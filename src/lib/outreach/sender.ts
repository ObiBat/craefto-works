import "server-only";
import { randomUUID } from "node:crypto";
import { createServerClient } from "@/lib/supabase";
import { isEmailEnabled } from "@/lib/resend";
import { telegramConfigured } from "./alerts";
import { checkEvidence } from "./evidence";
import { logoAttachment, renderEmailHtml } from "./email-html";
import { compose, mailboxConfigured, SENDER, spacemail, type Mailer, type SendResult } from "./mail";
import { optoutConfigured, unsubscribeHeaders } from "./optout";
import { inboxReadAt, NOT_ANSWERED } from "./replies";
import { applyAction, approvalCheck, followUpCheck, FOLLOW_UP_TEMPLATE, OutreachError } from "./rules";
import { isWorkingTime, localParts, nextGap, zoneFor } from "./schedule";
import { getProspect, suppressedBy, updateProspect } from "./store";
import type { Evidence, OutreachMessage, Prospect, SendingMode, SendingSettings } from "./types";

// The sender (Lead Engine phase 2). Vercel Cron calls tick() every three
// minutes; each tick sends at most one email:
//
//   off → nothing; test → approved emails go to the test recipients only;
//   live → to the prospects, in their working hours, at most daily_cap a day,
//   3 to 10 minutes apart. A bounce rate over 3% pauses it.
//
// Before every send the approval rules run again, the fingerprint must match
// what was approved, and the published-address check must pass (or have been
// confirmed by hand). The message row is written first: a unique index
// refuses a second live first email or follow-up to the same prospect. A
// follow-up also waits for the inbox to have been read (replies.ts): it never
// goes to someone who has written back.

type Db = ReturnType<typeof createServerClient>;

interface SettingsRow {
  mode: SendingMode;
  daily_cap: number;
  test_recipients: string[];
  window_start: string;
  window_end: string;
  follow_ups: boolean;
  next_send_at: string | null;
  paused_reason: string | null;
  updated_at: string;
  updated_by: string | null;
}

const toSettings = (row: SettingsRow): SendingSettings => ({
  mode: row.mode,
  dailyCap: row.daily_cap,
  testRecipients: row.test_recipients ?? [],
  windowStart: row.window_start.slice(0, 5),
  windowEnd: row.window_end.slice(0, 5),
  followUps: row.follow_ups,
  nextSendAt: row.next_send_at,
  pausedReason: row.paused_reason,
  updatedAt: row.updated_at,
  updatedBy: row.updated_by,
});

export async function getSettings(db: Db = createServerClient()): Promise<SendingSettings> {
  const { data, error } = await db.from("outreach_settings").select("*").eq("id", 1).single<SettingsRow>();
  if (error) throw error;
  return toSettings(data);
}

export interface SettingsPatch {
  mode?: SendingMode;
  dailyCap?: number;
  testRecipients?: string[];
  windowStart?: string;
  windowEnd?: string;
  followUps?: boolean;
  /** Clears a pause the sender set itself. */
  resume?: boolean;
}

export async function updateSettings(patch: SettingsPatch, by: string): Promise<SendingSettings> {
  const db = createServerClient();
  if (patch.mode === "live") {
    const { count } = await db.from("outreach_messages").select("id", { count: "exact", head: true }).eq("mode", "test").eq("status", "sent");
    if (!count) throw new OutreachError("Send a test batch to your own inbox first, and check it arrived properly");
  }
  const row: Partial<SettingsRow> = { updated_by: by };
  if (patch.mode !== undefined) row.mode = patch.mode;
  if (patch.dailyCap !== undefined) row.daily_cap = patch.dailyCap;
  if (patch.testRecipients !== undefined) row.test_recipients = patch.testRecipients;
  if (patch.windowStart !== undefined) row.window_start = patch.windowStart;
  if (patch.windowEnd !== undefined) row.window_end = patch.windowEnd;
  if (patch.followUps !== undefined) row.follow_ups = patch.followUps;
  if (patch.resume) row.paused_reason = null;
  if (patch.mode !== undefined || patch.resume) row.next_send_at = null;
  const { data, error } = await db.from("outreach_settings").update(row).eq("id", 1).select("*").single<SettingsRow>();
  if (error) throw error;
  return toSettings(data);
}

export interface MessageRow {
  id: string;
  campaign_id: string;
  prospect_id: string;
  kind: OutreachMessage["kind"];
  mode: OutreachMessage["mode"];
  status: OutreachMessage["status"];
  message_id: string;
  to_address: string;
  subject: string;
  body: string;
  evidence: Evidence | null;
  error: string | null;
  saved_to_sent: boolean;
  created_at: string;
  sent_at: string | null;
  answers_reply: string | null;
}

export const toMessage = (row: MessageRow): OutreachMessage => ({
  id: row.id,
  campaignId: row.campaign_id,
  prospectId: row.prospect_id,
  kind: row.kind,
  mode: row.mode,
  status: row.status,
  messageId: row.message_id,
  to: row.to_address,
  subject: row.subject,
  body: row.body,
  evidence: row.evidence,
  error: row.error,
  savedToSent: row.saved_to_sent,
  createdAt: row.created_at,
  sentAt: row.sent_at,
  answersReply: row.answers_reply,
});

export async function listMessages(filter: { campaignId?: string; prospectId?: string; limit?: number } = {}): Promise<OutreachMessage[]> {
  let query = createServerClient().from("outreach_messages").select("*");
  if (filter.campaignId) query = query.eq("campaign_id", filter.campaignId);
  if (filter.prospectId) query = query.eq("prospect_id", filter.prospectId);
  const { data, error } = await query.order("created_at", { ascending: false }).limit(filter.limit ?? 50);
  if (error) throw error;
  return (data as MessageRow[]).map(toMessage);
}

/** Today's numbers for the admin: sent in the last 24 hours (by mode) and what's waiting. */
export async function sendingStatus() {
  const db = createServerClient();
  const since = new Date(Date.now() - 24 * 3600_000).toISOString();
  const [settings, recent, queued, testsSent, inbox] = await Promise.all([
    getSettings(db),
    db.from("outreach_messages").select("mode, kind, status").gte("sent_at", since),
    db.from("outreach_prospects").select("id", { count: "exact", head: true }).eq("status", "approved").eq("contact_kind", "email"),
    db.from("outreach_messages").select("id", { count: "exact", head: true }).eq("mode", "test").eq("status", "sent"),
    db.from("outreach_sync").select("synced_at, last_error").eq("mailbox", "INBOX").maybeSingle<{ synced_at: string | null; last_error: string | null }>(),
  ]);
  const rows = (recent.data ?? []) as { mode: string; kind: string; status: string }[];
  return {
    settings,
    sentToday: rows.filter((row) => row.mode === settings.mode && row.kind !== "reply" && ["sent", "bounced"].includes(row.status)).length,
    queued: queued.count ?? 0,
    testsSent: testsSent.count ?? 0,
    ready: { mailbox: mailboxConfigured(), optout: optoutConfigured() },
    /** Reading replies: when the inbox was last read, and why it couldn't be if it couldn't. */
    inbox: { readAt: inbox.data?.synced_at ?? null, error: inbox.data?.last_error ?? null },
    /** Where alerts go: the Telegram bot, email, or nowhere yet. */
    alerts: telegramConfigured() ? ("telegram" as const) : isEmailEnabled() ? ("email" as const) : null,
  };
}

export interface SenderDeps {
  mailer: Mailer;
  now: () => Date;
  random: () => number;
  checkEvidence: typeof checkEvidence;
}

export type TickOutcome =
  | { result: "off" | "paused" | "waiting" | "cap-reached" | "not-configured" | "nothing-due"; detail?: string }
  | { result: "sent" | "failed" | "bounced" | "held"; prospect: string; kind: "initial" | "follow-up"; detail?: string };

/** A hand confirmation of the published address stays good for 30 days. */
const MANUAL_DAYS = 30;
/** A follow-up only goes when the inbox was read this recently (the clock reads it every 3 minutes). */
const INBOX_FRESH_MINUTES = 10;
/** After a failed address check, the prospect waits this long before another try. */
const RECHECK_HOURS = 12;

function manualStillGood(evidence: Evidence | undefined, now: Date) {
  return !!evidence?.manual && now.getTime() - new Date(evidence.manual.at).getTime() < MANUAL_DAYS * 86_400_000;
}

function recentlyHeld(evidence: Evidence | undefined, now: Date) {
  return !!evidence && !evidence.ok && !manualStillGood(evidence, now) && now.getTime() - new Date(evidence.checkedAt).getTime() < RECHECK_HOURS * 3_600_000;
}

/** An earlier email quoted under a new one, the way mail apps do it. */
export const quoteBelow = (who: string, at: string | null, body: string) => {
  const when = new Intl.DateTimeFormat("en-AU", { timeZone: "Australia/Sydney", weekday: "short", day: "numeric", month: "short", year: "numeric" }).format(new Date(at ?? Date.now()));
  return `On ${when}, ${who} wrote:\n\n${body.split("\n").map((line) => (line ? `> ${line}` : ">")).join("\n")}`;
};

interface Candidate {
  campaignId: string;
  id: string;
  kind: "initial" | "follow-up";
}

/** What could go next, follow-ups first (they're time-sensitive), then by priority and approval time. */
async function candidates(db: Db, settings: SendingSettings, now: Date): Promise<Candidate[]> {
  const mode = settings.mode;
  const { data: sentRows, error: sentError } = await db
    .from("outreach_messages")
    .select("campaign_id, prospect_id, kind, status")
    .eq("mode", mode)
    .in("status", mode === "live" ? ["sending", "sent", "bounced"] : ["sending", "sent"]);
  if (sentError) throw sentError;
  const done = new Set((sentRows ?? []).map((row) => `${row.campaign_id}/${row.prospect_id}/${row.kind}`));
  const sentInitial = new Set((sentRows ?? []).filter((row) => row.kind === "initial" && row.status === "sent").map((row) => `${row.campaign_id}/${row.prospect_id}`));

  const columns = "campaign_id, id, priority, status, state, location, website, contact_kind, contact_value, approved_at, follow_up, evidence";
  const { data, error } = await db
    .from("outreach_prospects")
    .select(columns)
    .eq("contact_kind", "email")
    .in("status", mode === "live" ? ["approved", "sent"] : ["approved"]);
  if (error) throw error;
  type Row = { campaign_id: string; id: string; priority: string; status: string; state: string | null; location: string | null; website: string; contact_value: string; approved_at: string | null; follow_up: { dueAt: string; sentAt?: string } | null; evidence: Evidence | null };
  const rows = (data ?? []) as Row[];
  const working = (row: Row) =>
    mode === "test" || isWorkingTime(now, zoneFor({ state: row.state ?? undefined, location: row.location ?? undefined, website: row.website, contact: { value: row.contact_value } }), { start: settings.windowStart, end: settings.windowEnd });
  const key = (row: Row) => `${row.campaign_id}/${row.id}`;

  const followUps = !settings.followUps
    ? []
    : rows.filter((row) => {
        if (done.has(`${key(row)}/follow-up`) || !sentInitial.has(key(row))) return false;
        if (mode === "test") return true;
        const zone = zoneFor({ state: row.state ?? undefined, location: row.location ?? undefined, website: row.website, contact: { value: row.contact_value } });
        return row.status === "sent" && !!row.follow_up && !row.follow_up.sentAt && row.follow_up.dueAt <= localParts(now, zone).date;
      });
  const initials = rows
    .filter((row) => row.status === "approved" && row.approved_at && !done.has(`${key(row)}/initial`) && !recentlyHeld(row.evidence ?? undefined, now))
    .sort((a, b) => a.priority.localeCompare(b.priority) || (a.approved_at ?? "").localeCompare(b.approved_at ?? ""));

  return [
    ...followUps.filter(working).map((row) => ({ campaignId: row.campaign_id, id: row.id, kind: "follow-up" as const })),
    ...initials.filter(working).map((row) => ({ campaignId: row.campaign_id, id: row.id, kind: "initial" as const })),
  ];
}

/** Runs the published-address check, keeping the result on the prospect. Returns the evidence to send on, or null to hold. */
async function evidenceFor(p: Prospect, deps: SenderDeps, now: Date): Promise<Evidence | null> {
  const fresh = await deps.checkEvidence(p.contact.value, p.contact.source);
  const usable = fresh.ok ? fresh : manualStillGood(p.evidence, now) ? { ...fresh, ok: true, manual: p.evidence!.manual } : null;
  const previous = p.evidence;
  await updateProspect(p.campaignId, p.id, "system", (draft) => {
    draft.evidence = usable ?? fresh;
    if (usable || (previous && !previous.ok && previous.error === fresh.error)) return null;
    return `Held before sending: couldn't confirm ${p.contact.value} is still published (${fresh.error ?? "a notice refuses unsolicited email"}). Check the page, then confirm it by hand.`;
  });
  return usable;
}

export interface Delivery {
  to: string[];
  subject: string;
  text: string;
  inReplyTo?: string;
  /** The thread so far, oldest first (In-Reply-To alone when left out). */
  references?: string[];
  evidence: Evidence | null;
  /** An answer from admin: the reply of theirs it answers. */
  answersReply?: string;
}

/** Sends one email: claims the message row, sends the exact bytes, files the copy, records the outcome. Null when the claim was refused (already sent). */
export async function deliver(
  db: Db,
  deps: Pick<SenderDeps, "mailer" | "now">,
  mode: "test" | "live",
  p: Prospect,
  kind: OutreachMessage["kind"],
  message: Delivery,
): Promise<{ result: SendResult; row: MessageRow } | null> {
  const test = mode === "test";
  const to = message.to;
  const messageId = `<${randomUUID()}@craefto.com>`;
  const { data: claimed, error: claimError } = await db
    .from("outreach_messages")
    .insert({
      campaign_id: p.campaignId,
      prospect_id: p.id,
      kind,
      mode,
      status: "sending",
      message_id: messageId,
      in_reply_to: message.inReplyTo ?? null,
      from_address: SENDER.address,
      to_address: to.join(", "),
      subject: message.subject,
      body: message.text,
      email_hash: kind === "reply" ? null : (p.emailHash ?? null),
      evidence: message.evidence,
      answers_reply: message.answersReply ?? null,
    })
    .select("*")
    .single<MessageRow>();
  if (claimError) {
    if (claimError.code === "23505") return null;
    throw claimError;
  }
  let raw: Buffer;
  let result: SendResult;
  try {
    raw = await compose({
      messageId,
      to,
      subject: message.subject,
      text: message.text,
      html: renderEmailHtml(message.text, message.subject),
      attachments: [logoAttachment()],
      inReplyTo: message.inReplyTo,
      references: message.references ?? (message.inReplyTo ? [message.inReplyTo] : undefined),
      headers: { ...unsubscribeHeaders(p.campaignId, p.id, test, SENDER.address), ...(test ? { "X-Craefto-Test": "yes" } : {}) },
    });
    result = await deps.mailer.send(raw, { from: SENDER.address, to });
  } catch (error) {
    // Nothing went out: free the claim so it can be tried again.
    await db.from("outreach_messages").update({ status: "failed", error: (error as Error).message.slice(0, 500) }).eq("id", claimed.id);
    throw error;
  }
  const sentAt = deps.now().toISOString();
  if (result.ok) {
    const saved = await deps.mailer.saveToSent(raw);
    await db.from("outreach_messages").update({ status: "sent", sent_at: sentAt, smtp_response: result.response, saved_to_sent: saved }).eq("id", claimed.id);
  } else {
    await db
      .from("outreach_messages")
      .update({ status: result.kind === "bounce" ? "bounced" : "failed", sent_at: result.kind === "bounce" ? sentAt : null, error: result.error, smtp_response: result.response ?? null })
      .eq("id", claimed.id);
  }
  return { result, row: claimed };
}

async function pause(db: Db, reason: string) {
  await db.from("outreach_settings").update({ paused_reason: reason, updated_by: "system" }).eq("id", 1);
}

/** What a failed send means for the sender and the prospect. */
async function afterFailure(db: Db, settings: SendingSettings, p: Prospect, kind: "initial" | "follow-up", result: Exclude<SendResult, { ok: true }>, now: Date): Promise<TickOutcome> {
  const prospect = `${p.campaignId}/${p.id}`;
  if (result.kind === "bounce") {
    if (settings.mode === "test") {
      await pause(db, `A test copy bounced (${result.response ?? result.error}). Check the test addresses.`);
      return { result: "bounced", prospect, kind, detail: result.error };
    }
    const address = p.contact.value.trim().toLowerCase();
    await db.from("outreach_suppressions").upsert({ value: address, reason: "bounce", note: (result.response ?? result.error).slice(0, 300) }, { onConflict: "value", ignoreDuplicates: true });
    await updateProspect(p.campaignId, p.id, "system", (draft) => {
      draft.status = "lost";
      return `Bounced (${(result.response ?? result.error).slice(0, 160)}): ${address} is on the do-not-email list`;
    });
    return { result: "bounced", prospect, kind, detail: result.error };
  }
  if (result.kind === "auth") await pause(db, "Spacemail refused the mailbox login. Check OUTREACH_MAILBOX_PASSWORD, then resume.");
  else if (result.kind === "rejected") await pause(db, `Spacemail refused a message (${(result.response ?? result.error).slice(0, 200)}). Check it before resuming.`);
  else await db.from("outreach_settings").update({ next_send_at: new Date(now.getTime() + 15 * 60_000).toISOString() }).eq("id", 1);
  return { result: "failed", prospect, kind, detail: result.error };
}

async function sendInitial(db: Db, deps: SenderDeps, settings: SendingSettings, candidate: Candidate, now: Date): Promise<TickOutcome> {
  const prospect = `${candidate.campaignId}/${candidate.id}`;
  const p = await getProspect(candidate.campaignId, candidate.id);
  if (!p || p.status !== "approved" || !p.email) return { result: "held", prospect, kind: "initial", detail: "No longer approved" };
  const check = approvalCheck(p, await suppressedBy(p));
  const changed = p.email.approvedHash !== p.emailHash;
  if (check.blocks.length || changed) {
    const reason = changed ? "the email changed after it was approved" : check.blocks[0];
    if (settings.mode === "live") {
      await updateProspect(p.campaignId, p.id, "system", (draft) => {
        applyAction(draft, "draft", { actor: "system", now });
        return `Held before sending: ${reason}. Approve it again once it's right.`;
      });
    }
    return { result: "held", prospect, kind: "initial", detail: reason };
  }
  const evidence = await evidenceFor(p, deps, now);
  if (!evidence) return { result: "held", prospect, kind: "initial", detail: "The published address couldn't be confirmed" };

  const test = settings.mode === "test";
  const to = test ? settings.testRecipients : [p.contact.value.trim().toLowerCase()];
  const sent = await deliver(db, deps, settings.mode === "live" ? "live" : "test", p, "initial", { to, subject: test ? `[Test] ${p.email.subject}` : p.email.subject, text: p.email.body, evidence });
  if (!sent) return { result: "held", prospect, kind: "initial", detail: "Already being sent" };
  if (!sent.result.ok) return afterFailure(db, settings, p, "initial", sent.result, now);
  if (!test) {
    await updateProspect(p.campaignId, p.id, "system", (draft) => {
      applyAction(draft, "sent", { actor: "system", now });
      return `Sent from ${SENDER.address} to ${p.contact.value}`;
    });
  }
  return { result: "sent", prospect, kind: "initial", detail: test ? `test copy to ${settings.testRecipients.join(", ")}` : p.contact.value };
}

async function sendFollowUp(db: Db, deps: SenderDeps, settings: SendingSettings, candidate: Candidate, now: Date): Promise<TickOutcome> {
  const prospect = `${candidate.campaignId}/${candidate.id}`;
  const test = settings.mode === "test";
  const p = await getProspect(candidate.campaignId, candidate.id);
  if (!p) return { result: "held", prospect, kind: "follow-up", detail: "Gone" };
  const { data: initials } = await db
    .from("outreach_messages")
    .select("*")
    .eq("campaign_id", p.campaignId)
    .eq("prospect_id", p.id)
    .eq("kind", "initial")
    .eq("mode", settings.mode)
    .eq("status", "sent")
    .order("sent_at", { ascending: false })
    .limit(1);
  const initial = (initials as MessageRow[] | null)?.[0];
  if (!initial) return { result: "held", prospect, kind: "follow-up", detail: "The first email isn't on record" };

  const body = (p.followUp?.body ?? FOLLOW_UP_TEMPLATE).trim();
  const suppressed = await suppressedBy(p);
  if (!test) {
    const check = followUpCheck(p, suppressed);
    if (check.blocks.length) return { result: "held", prospect, kind: "follow-up", detail: check.blocks[0] };
    // A reply could be waiting unread: only follow up on a freshly read inbox.
    const readAt = await inboxReadAt(db);
    if (!readAt || now.getTime() - readAt.getTime() > INBOX_FRESH_MINUTES * 60_000) {
      return { result: "held", prospect, kind: "follow-up", detail: "The inbox hasn't been read in the last few minutes, so a reply could be missed" };
    }
    // Anything they wrote back since the first email (an out-of-office aside) means no follow-up.
    const { data: answered, error: answeredError } = await db
      .from("outreach_replies")
      .select("label")
      .eq("campaign_id", p.campaignId)
      .eq("prospect_id", p.id)
      .eq("mode", "live")
      .gte("received_at", initial.sent_at ?? initial.created_at);
    if (answeredError) throw answeredError;
    const replied = (answered ?? []).filter((row) => !NOT_ANSWERED.includes(row.label));
    if (replied.length) return { result: "held", prospect, kind: "follow-up", detail: `They replied (${replied.map((row) => row.label).join(", ")})` };
  } else if (suppressed) {
    return { result: "held", prospect, kind: "follow-up", detail: "On the do-not-email list" };
  }
  const evidence = await evidenceFor(p, deps, now);
  if (!evidence) return { result: "held", prospect, kind: "follow-up", detail: "The published address couldn't be confirmed" };

  const subject = /^re:/i.test(initial.subject) ? initial.subject : `Re: ${initial.subject}`;
  const sent = await deliver(db, deps, settings.mode === "live" ? "live" : "test", p, "follow-up", {
    to: test ? settings.testRecipients : [p.contact.value.trim().toLowerCase()],
    subject,
    text: `${body}\n\n${quoteBelow(`${SENDER.name} <${SENDER.address}>`, initial.sent_at, initial.body)}`,
    inReplyTo: initial.message_id,
    evidence,
  });
  if (!sent) return { result: "held", prospect, kind: "follow-up", detail: "Already being sent" };
  if (!sent.result.ok) return afterFailure(db, settings, p, "follow-up", sent.result, now);
  if (!test) {
    await updateProspect(p.campaignId, p.id, "system", (draft) => {
      applyAction(draft, "followup-sent", { actor: "system", now });
      return `Follow-up sent from ${SENDER.address}, in the same thread`;
    });
  }
  return { result: "sent", prospect, kind: "follow-up", detail: test ? `test copy to ${settings.testRecipients.join(", ")}` : p.contact.value };
}

/** One turn of the sender. Safe to call as often as you like: it sends at most one email. */
export async function tick(deps: SenderDeps = { mailer: spacemail(), now: () => new Date(), random: Math.random, checkEvidence }): Promise<TickOutcome> {
  const db = createServerClient();
  const now = deps.now();
  const settings = await getSettings(db);
  if (settings.mode === "off") return { result: "off" };
  if (settings.pausedReason) return { result: "paused", detail: settings.pausedReason };
  if (!mailboxConfigured() || !optoutConfigured()) return { result: "not-configured", detail: "The mailbox password or the opt-out secret isn't set" };
  if (settings.mode === "test" && !settings.testRecipients.length) return { result: "not-configured", detail: "Add a test address first" };

  // Claim this turn: only one tick at a time gets past here.
  const { data: claimed, error } = await db
    .from("outreach_settings")
    .update({ next_send_at: new Date(now.getTime() + 2 * 60_000).toISOString() })
    .eq("id", 1)
    .eq("mode", settings.mode)
    .is("paused_reason", null)
    .or(`next_send_at.is.null,next_send_at.lte."${now.toISOString()}"`)
    .select("id");
  if (error) throw error;
  if (!claimed?.length) return { result: "waiting", detail: settings.nextSendAt ?? undefined };

  const since = new Date(now.getTime() - 24 * 3600_000).toISOString();
  // Answers to people who wrote back aren't outreach: they don't count.
  const { count: sentToday } = await db.from("outreach_messages").select("id", { count: "exact", head: true }).eq("mode", settings.mode).neq("kind", "reply").in("status", ["sent", "bounced"]).gte("sent_at", since);
  if ((sentToday ?? 0) >= settings.dailyCap) return { result: "cap-reached", detail: `${sentToday} in the last 24 hours` };

  if (settings.mode === "live") {
    const { data: recent } = await db.from("outreach_messages").select("status").eq("mode", "live").neq("kind", "reply").in("status", ["sent", "bounced"]).order("sent_at", { ascending: false }).limit(50);
    const bounced = (recent ?? []).filter((row) => row.status === "bounced").length;
    if ((recent?.length ?? 0) >= 20 && bounced / recent!.length > 0.03) {
      await pause(db, `${bounced} of the last ${recent!.length} emails bounced, over the 3% limit. Check the addresses before resuming.`);
      return { result: "paused", detail: "Bounce rate over 3%" };
    }
  }

  for (const candidate of (await candidates(db, settings, now)).slice(0, 5)) {
    const outcome = candidate.kind === "follow-up" ? await sendFollowUp(db, deps, settings, candidate, now) : await sendInitial(db, deps, settings, candidate, now);
    if (outcome.result === "held") continue;
    if (outcome.result === "sent") await db.from("outreach_settings").update({ next_send_at: new Date(now.getTime() + nextGap(deps.random)).toISOString() }).eq("id", 1);
    return outcome;
  }
  return { result: "nothing-due" };
}
