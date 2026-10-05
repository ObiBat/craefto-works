import "server-only";
import { createServerClient } from "@/lib/supabase";
import { aiUnavailable, ANSWERED, classify, draftWithAi, fallback, labelWithAi, suggestAnswer, type Classification, type DraftFn, type LabelFn } from "./classify";
import { alertReply, type Alerter } from "./alerts";
import { mailboxConfigured, SENDER, spacemailInbox, type Cursor, type Inbox, type InboxHeader } from "./mail";
import { parseEmail, type IncomingEmail } from "./parse";
import { addDays, applyAction, hostOf, OutreachError, sydneyDate } from "./rules";
import { isHoliday, localParts, zoneFor } from "./schedule";
import { getProspect, updateProspect } from "./store";
import { INSTANT_LABELS, REPLY_LABEL, type OutreachReply, type Prospect, type ReplyLabel, type StatusAction } from "./types";

// Replies (Lead Engine phase 3). Each turn of the sender's clock reads the
// outreach mailbox's inbox and spam first: new mail that answers outreach (a
// reply in the thread, mail from an address we've written to, a bounce) is
// stored, labelled (classify.ts), acted on as the plan's table says, and
// alerted. Nothing is ever sent back automatically. A reply to a test copy is
// labelled and alerted but changes nothing.

type Db = ReturnType<typeof createServerClient>;

// ── Rows ──────────────────────────────────────────────────────────────────

export interface ReplyRow {
  id: string;
  campaign_id: string;
  prospect_id: string;
  mode: "test" | "live";
  message_id: string;
  in_reply_to: string | null;
  refs: string[];
  answers: string | null;
  from_address: string;
  from_name: string | null;
  subject: string | null;
  body: string;
  full_text: string | null;
  received_at: string;
  mailbox: string;
  imap_uid: number | null;
  label: ReplyLabel;
  label_source: "rule" | "ai" | "manual";
  ai_label: ReplyLabel | null;
  confidence: number | string | null;
  quote: string | null;
  summary: string | null;
  suggested_reply: string | null;
  complaint: boolean;
  referral: OutreachReply["referral"];
  return_on: string | null;
  corrected_from: ReplyLabel | null;
  corrected_at: string | null;
  applied_at: string | null;
  alerted_at: string | null;
  digested_at: string | null;
  reminded_on: string | null;
  handled_at: string | null;
  handled_by: string | null;
  lead_id: string | null;
  created_at: string;
}

export const toReply = (row: ReplyRow, company?: string): OutreachReply => ({
  id: row.id,
  campaignId: row.campaign_id,
  prospectId: row.prospect_id,
  mode: row.mode,
  messageId: row.message_id,
  answers: row.answers,
  fromAddress: row.from_address,
  fromName: row.from_name,
  subject: row.subject,
  body: row.body,
  fullText: row.full_text,
  receivedAt: row.received_at,
  mailbox: row.mailbox,
  label: row.label,
  labelSource: row.label_source,
  aiLabel: row.ai_label,
  confidence: row.confidence === null ? null : Number(row.confidence),
  quote: row.quote,
  summary: row.summary,
  suggestedReply: row.suggested_reply,
  referral: row.referral,
  returnOn: row.return_on,
  correctedFrom: row.corrected_from,
  alertedAt: row.alerted_at,
  handledAt: row.handled_at,
  handledBy: row.handled_by,
  leadId: row.lead_id,
  createdAt: row.created_at,
  ...(company ? { company } : {}),
});

/** What we sent, as matching needs it. */
interface SentRow {
  id: string;
  campaign_id: string;
  prospect_id: string;
  kind: "initial" | "follow-up" | "reply";
  mode: "test" | "live";
  status: string;
  message_id: string;
  to_address: string;
  subject: string;
  body: string;
  sent_at: string | null;
  created_at: string;
}

/**
 * Who a reply could be about: a prospect, and the email of ours it answers.
 * No email when it went by hand (through their contact form, or from a mail
 * app before the sender ran): then their domain is all there is to go on.
 */
export interface Target {
  campaignId: string;
  prospectId: string;
  mode: "test" | "live";
  message: SentRow | null;
  subject: string | null;
}

const targetOf = (row: SentRow): Target => ({ campaignId: row.campaign_id, prospectId: row.prospect_id, mode: row.mode, message: row, subject: row.subject });

// ── Matching ──────────────────────────────────────────────────────────────

/** Domains anyone can have an address at: a reply from one only counts from the exact address. */
const SHARED_DOMAINS = new Set([
  "gmail.com", "googlemail.com", "outlook.com", "outlook.com.au", "hotmail.com", "hotmail.com.au", "live.com", "live.com.au", "msn.com",
  "yahoo.com", "yahoo.com.au", "ymail.com", "icloud.com", "me.com", "mac.com", "aol.com", "bigpond.com", "bigpond.net.au", "bigpond.com.au",
  "optusnet.com.au", "iinet.net.au", "internode.on.net", "tpg.com.au", "westnet.com.au", "dodo.com.au", "protonmail.com", "proton.me", "pm.me",
  "gmx.com", "gmx.net", "zoho.com", "zohomail.com", "fastmail.com", "fastmail.fm", "mail.com", "yandex.com", "yandex.ru", "qq.com", "163.com", "126.com", "naver.com",
  "craefto.com",
]);

const ROBOT = /^(mailer-daemon|postmaster|mail-daemon|mailerdaemon)@/i;
const BOUNCE_SUBJECT = /undeliver|delivery status notification|delivery (failure|has failed|incomplete)|returned mail|failure notice|mail delivery (failed|subsystem|system)|could not be delivered/i;

const domainOf = (address: string) => address.split("@")[1]?.toLowerCase() ?? "";
const topic = (subject: string | null) => (subject ?? "").replace(/^\s*((re|aw|fw|fwd|sv|antw)\s*:\s*|\[test\]\s*)+/gi, "").trim().toLowerCase();

interface Known {
  byId: Map<string, SentRow>;
  /** The addresses we've written to for real, newest email first. */
  byAddress: Map<string, Target>;
  /** Their organisations' own domains: anyone there may answer for them. */
  byDomain: Map<string, Target[]>;
  /** The earliest send: nothing older can be a reply. */
  since: Date | null;
}

function addDomain(known: Known, domain: string, target: Target) {
  if (!domain || SHARED_DOMAINS.has(domain)) return;
  const list = known.byDomain.get(domain) ?? [];
  if (!list.some((other) => other.campaignId === target.campaignId && other.prospectId === target.prospectId)) list.push(target);
  known.byDomain.set(domain, list);
}

async function loadKnown(db: Db): Promise<Known> {
  const [messages, prospects] = await Promise.all([
    db
      .from("outreach_messages")
      .select("id, campaign_id, prospect_id, kind, mode, status, message_id, to_address, subject, body, sent_at, created_at")
      .in("status", ["sending", "sent", "bounced"])
      .order("created_at", { ascending: false })
      .limit(5000),
    // Sent by hand: marked sent, with no email of the sender's behind it.
    db.from("outreach_prospects").select("campaign_id, id, contact_kind, contact_value, website, email_subject, sent_at").not("sent_at", "is", null).limit(5000),
  ]);
  if (messages.error) throw messages.error;
  if (prospects.error) throw prospects.error;
  const known: Known = { byId: new Map(), byAddress: new Map(), byDomain: new Map(), since: null };
  const earliest = (at: Date) => {
    if (!known.since || at < known.since) known.since = at;
  };
  const liveSent = new Set<string>();
  for (const row of (messages.data ?? []) as SentRow[]) {
    known.byId.set(row.message_id.toLowerCase(), row);
    earliest(new Date(row.sent_at ?? row.created_at));
    if (row.mode !== "live") continue;
    liveSent.add(`${row.campaign_id}/${row.prospect_id}`);
    const address = row.to_address.trim().toLowerCase();
    if (!known.byAddress.has(address)) known.byAddress.set(address, targetOf(row));
    addDomain(known, domainOf(address), targetOf(row));
  }
  type ProspectRow = { campaign_id: string; id: string; contact_kind: string; contact_value: string; website: string; email_subject: string | null; sent_at: string };
  for (const p of (prospects.data ?? []) as ProspectRow[]) {
    if (liveSent.has(`${p.campaign_id}/${p.id}`)) continue;
    earliest(new Date(p.sent_at));
    const target: Target = { campaignId: p.campaign_id, prospectId: p.id, mode: "live", message: null, subject: p.email_subject };
    if (p.contact_kind === "email") {
      const address = p.contact_value.trim().toLowerCase();
      if (!known.byAddress.has(address)) known.byAddress.set(address, target);
      addDomain(known, domainOf(address), target);
    }
    addDomain(known, hostOf(p.website), target);
  }
  return known;
}

/** Before opening a message: could it answer outreach? */
const wantedBy = (known: Known) => (header: InboxHeader) => {
  const from = header.from?.address ?? "";
  if (from === SENDER.address.toLowerCase()) return false;
  if (header.messageId && known.byId.has(header.messageId.toLowerCase())) return false;
  if ([header.inReplyTo, ...header.references].some((id) => id && known.byId.has(id.toLowerCase()))) return true;
  if (known.byAddress.has(from) || known.byDomain.has(domainOf(from))) return true;
  return header.contentType === "multipart/report" || ROBOT.test(from) || BOUNCE_SUBJECT.test(header.subject);
};

export interface Match {
  target: Target;
  /** thread: it says which email it answers; report: a bounce naming ours; address/domain: from someone we wrote to, or their organisation. */
  via: "thread" | "report" | "address" | "domain";
}

/** Which prospect (and email of ours) it answers, if any. */
export function matchOf(known: Known, email: IncomingEmail): Match | null {
  const from = email.from?.address ?? "";
  if (from === SENDER.address.toLowerCase()) return null;
  for (const id of [email.inReplyTo, ...email.references]) {
    const sent = id ? known.byId.get(id.toLowerCase()) : undefined;
    if (sent) return { target: targetOf(sent), via: "thread" };
  }
  if (email.report) {
    for (const id of email.mentions) {
      const sent = known.byId.get(id);
      if (sent) return { target: targetOf(sent), via: "report" };
    }
    const target = email.report.recipient ? known.byAddress.get(email.report.recipient) : undefined;
    return target ? { target, via: "report" } : null;
  }
  if (email.bulk) return null;
  const target = known.byAddress.get(from);
  if (target) return { target, via: "address" };
  const candidates = known.byDomain.get(domainOf(from)) ?? [];
  if (!candidates.length) return null;
  return { target: candidates.find((candidate) => topic(candidate.subject) === topic(email.subject)) ?? candidates[0], via: "domain" };
}

/** Our email they answered, for the AI to read: the one on record, or the approved text when it went by hand. */
const oursFor = (target: Target, prospect: Prospect | null) =>
  target.message ? { subject: target.message.subject, body: target.message.body } : prospect?.email ? { subject: prospect.email.subject, body: prospect.email.body } : null;

// ── What each label does ──────────────────────────────────────────────────

/** Applies a status action when it's allowed from where the prospect is; otherwise leaves it. */
function tryAction(p: Prospect, action: StatusAction, now: Date) {
  try {
    applyAction(p, action, { actor: "system", now });
  } catch (error) {
    if (!(error instanceof OutreachError)) throw error;
  }
}

/** The first working day after a date, where they are. */
export function workingDayAfter(day: string, zone: string) {
  let next = addDays(day, 1);
  for (let i = 0; i < 14; i++) {
    const weekday = new Date(`${next}T00:00:00Z`).getUTCDay();
    if (weekday !== 0 && weekday !== 6 && !isHoliday(next, zone)) return next;
    next = addDays(next, 1);
  }
  return next;
}

const SUPPRESSIBLE = /^[^@\s]*@[^@\s]+$/;

async function suppress(db: Db, values: string[], reason: "opt-out" | "bounce" | "complaint", note: string) {
  const rows = [...new Set(values.map((value) => value.trim().toLowerCase()).filter((value) => SUPPRESSIBLE.test(value)))].map((value) => ({ value, reason, note: note.slice(0, 300) }));
  if (!rows.length) return;
  const { error } = await db.from("outreach_suppressions").upsert(rows, { onConflict: "value", ignoreDuplicates: true });
  if (error) throw error;
}

/** "Tue 20 Oct" for a YYYY-MM-DD day. */
const formatDay = (day: string) => {
  const parts = Object.fromEntries(new Intl.DateTimeFormat("en-AU", { timeZone: "UTC", weekday: "short", day: "numeric", month: "short" }).formatToParts(new Date(`${day}T00:00:00Z`)).map((part) => [part.type, part.value]));
  return `${parts.weekday} ${parts.day} ${parts.month}`;
};

/** The prospect's history line for a reply, before what it did. */
function historyLine(row: ReplyRow) {
  const who = row.from_name ? `${row.from_name} (${row.from_address})` : row.from_address;
  const said = row.summary ? `: ${row.summary.replace(/[.\s]+$/, "")}` : "";
  switch (row.label) {
    case "interested":
      return `${who} replied, interested${said}`;
    case "question":
      return `${who} replied with a question${said}`;
    case "referral":
      return `${who} replied with a referral${said}`;
    case "not-now":
      return `${who} replied, not now${said}`;
    case "not-interested":
      return `${who} replied, not interested${said}`;
    case "opt-out":
      return `${who} opted out by reply${said}`;
    case "out-of-office":
      return `Out-of-office reply from ${who}${said}`;
    case "auto-reply":
      return `Automatic reply from ${who}${said}`;
    case "bounce":
      return row.summary?.replace(/[.\s]+$/, "") ?? "Bounced";
    case "unclear":
      return `Reply from ${who} needs a look${said}`;
  }
}

/** Days a "not now" without a date waits before the reminder. */
const NOT_NOW_DAYS = 90;

/**
 * Does what a live reply's label means: the prospect's status, the follow-up,
 * the do-not-email list. Safe to run twice. `relabelled` names the label it
 * had before a correction by hand.
 */
export async function applyLabel(db: Db, row: ReplyRow, now: Date, relabelled?: ReplyLabel): Promise<void> {
  if (row.mode !== "live") return;
  const prefix = relabelled ? `Reply relabelled ${REPLY_LABEL[relabelled]} → ${REPLY_LABEL[row.label]}` : historyLine(row);

  if (row.label === "opt-out") {
    const prospect = await getProspect(row.campaign_id, row.prospect_id);
    const contact = prospect?.contact.kind === "email" ? prospect.contact.value : null;
    const domain = domainOf(row.from_address);
    // A complaint from their own domain covers everyone there.
    const wholeDomain = row.complaint && contact && domainOf(contact) === domain && !SHARED_DOMAINS.has(domain);
    await suppress(db, [row.from_address, ...(contact ? [contact] : []), ...(wholeDomain ? [`@${domain}`] : [])], row.complaint ? "complaint" : "opt-out", `Replied ${row.received_at.slice(0, 10)}: ${row.quote ?? "asked to stop"}`);
  }
  if (row.label === "bounce") {
    const prospect = await getProspect(row.campaign_id, row.prospect_id);
    const address = prospect?.contact.kind === "email" ? prospect.contact.value : null;
    if (address) await suppress(db, [address], "bounce", row.summary ?? "Bounced");
    if (row.answers) await db.from("outreach_messages").update({ status: "bounced", error: (row.quote ?? row.summary ?? "Bounced").slice(0, 500) }).eq("id", row.answers).eq("status", "sent");
  }

  await updateProspect(row.campaign_id, row.prospect_id, "system", (p) => {
    const zone = zoneFor(p);
    switch (row.label) {
      case "interested":
      case "question":
      case "referral":
        // Writing back after being closed (a "not now" that's now a yes) opens them again.
        if (["lost", "not-a-fit"].includes(p.status)) tryAction(p, "reopen", now);
        tryAction(p, "replied", now);
        return `${prefix}${row.label === "referral" && row.referral ? `. ${row.referral.name ?? "The person they named"}${row.referral.email ? ` (${row.referral.email})` : ""} won't be emailed automatically.` : ""}`;
      case "not-now":
        tryAction(p, "lost", now);
        return `${prefix}. Closed for now; reminder on ${formatDay(row.return_on ?? addDays(sydneyDate(now), NOT_NOW_DAYS))}.`;
      case "not-interested":
        tryAction(p, "lost", now);
        return `${prefix}. Closed: no more emails.`;
      case "opt-out":
        tryAction(p, "lost", now);
        return `${prefix}. On the do-not-email list.`;
      case "bounce":
        tryAction(p, "lost", now);
        return `${prefix}. On the do-not-email list.`;
      case "out-of-office": {
        if (!row.return_on || !p.followUp || p.followUp.sentAt) return `${prefix}${row.return_on ? `. Back ${formatDay(row.return_on)}.` : ""}`;
        const after = workingDayAfter(row.return_on, zone);
        if (after <= p.followUp.dueAt) return `${prefix}. Back ${formatDay(row.return_on)}; the follow-up is already later.`;
        p.followUp = { ...p.followUp, dueAt: after };
        return `${prefix}. Back ${formatDay(row.return_on)}: follow-up moved to ${formatDay(after)}.`;
      }
      case "auto-reply":
        return prefix;
      case "unclear":
        return `${prefix}. Follow-up held until it's labelled.`;
    }
  });
}

// ── Reading the inbox ─────────────────────────────────────────────────────

export interface ReplyDeps {
  inbox: Inbox;
  now: () => Date;
  label: LabelFn;
  draft: DraftFn;
  alert: Alerter;
}

export const replyDeps = (): ReplyDeps => ({ inbox: spacemailInbox(), now: () => new Date(), label: labelWithAi, draft: draftWithAi, alert: alertReply });

export interface SyncOutcome {
  result: "read" | "not-configured" | "nothing-sent" | "failed";
  /** Messages opened (they looked like they could answer outreach). */
  opened: number;
  stored: number;
  /** Opened but not ours after all, or already stored. */
  skipped: number;
  /** Left for the next turn: the AI couldn't be reached and the email is recent. */
  waiting: number;
  alerts: number;
  detail?: string;
}

/** At most this many messages are opened per turn; the rest wait three minutes. */
const OPEN_PER_TURN = 12;
/** A recent email waits this long for the AI before a person is asked to label it. */
const AI_PATIENCE_MS = 15 * 60_000;
/** Instant alerts are retried for this long. */
const ALERT_RETRY_MS = 24 * 3600_000;

/** Whether a reply goes to the phone straight away: every test reply, and the live ones that need Obi. */
const alertsNow = (row: Pick<ReplyRow, "mode" | "label">) => row.mode === "test" || INSTANT_LABELS.includes(row.label);

/** Applies what's pending for a stored reply: the label's effects, then the alert. */
async function settleReply(db: Db, deps: ReplyDeps, row: ReplyRow): Promise<{ alerted: boolean }> {
  const now = deps.now();
  if (!row.applied_at) {
    await applyLabel(db, row, now);
    await db.from("outreach_replies").update({ applied_at: now.toISOString() }).eq("id", row.id);
  }
  if (!row.alerted_at && alertsNow(row)) {
    const { data: prospect } = await db.from("outreach_prospects").select("company").eq("campaign_id", row.campaign_id).eq("id", row.prospect_id).maybeSingle<{ company: string }>();
    if (await deps.alert(toReply(row), prospect?.company ?? row.prospect_id)) {
      await db.from("outreach_replies").update({ alerted_at: deps.now().toISOString() }).eq("id", row.id);
      return { alerted: true };
    }
  }
  return { alerted: false };
}

/** When it arrived: its own date, unless that's in the future. */
const arrivedAt = (email: IncomingEmail, header: InboxHeader, now: Date) => (email.date && email.date <= now ? email.date : header.date && header.date <= now ? header.date : now);

/** Drafts an answer where one's likely wanted, and stores the reply; null when it was stored before. */
async function store(db: Db, deps: ReplyDeps, email: IncomingEmail, match: Match, prospect: Prospect | null, header: InboxHeader, verdict: Classification): Promise<ReplyRow | null> {
  const now = deps.now();
  const received = arrivedAt(email, header, now);
  const { target } = match;
  let suggested: string | null = null;
  if (ANSWERED.includes(verdict.label)) {
    try {
      suggested = await suggestAnswer(
        {
          label: verdict.label,
          company: prospect?.company ?? target.prospectId,
          theirName: email.from?.name ?? null,
          their: { subject: email.subject, body: email.body },
          ours: oursFor(target, prospect),
          research: [prospect?.whyFit, ...(prospect?.findings ?? []).map((finding) => finding.text)].filter((line): line is string => !!line).slice(0, 8),
        },
        deps.draft,
      );
    } catch (error) {
      console.error(`Outreach reply ${email.messageId}: no suggested answer (${(error as Error).message})`);
    }
  }
  const returnOn = verdict.label === "not-now" ? (verdict.returnOn ?? addDays(sydneyDate(received), NOT_NOW_DAYS)) : verdict.returnOn;
  const row = {
    campaign_id: target.campaignId,
    prospect_id: target.prospectId,
    mode: target.mode,
    message_id: email.messageId,
    in_reply_to: email.inReplyTo,
    refs: email.references.slice(-20),
    answers: target.message?.id ?? null,
    from_address: email.from?.address ?? "unknown@invalid",
    from_name: email.from?.name ?? null,
    subject: email.subject.slice(0, 500) || null,
    body: email.body.slice(0, 20_000),
    full_text: email.text !== email.body ? email.text : null,
    received_at: received.toISOString(),
    mailbox: header.mailbox,
    imap_uid: header.uid,
    label: verdict.label,
    label_source: verdict.source,
    ai_label: verdict.aiLabel,
    confidence: verdict.confidence,
    quote: verdict.quote,
    summary: verdict.summary,
    suggested_reply: suggested,
    complaint: verdict.complaint,
    referral: verdict.referral,
    return_on: returnOn,
    // A test reply changes nothing, so there's nothing left to apply.
    applied_at: target.mode === "test" ? now.toISOString() : null,
  };
  const { data, error } = await db.from("outreach_replies").insert(row).select("*").single<ReplyRow>();
  if (error) {
    if (error.code === "23505") return null;
    throw error;
  }
  return data;
}

/**
 * One turn of reading the outreach mailbox. Safe to run as often as you like:
 * each email is stored once (by its Message-ID), and what's left half-done
 * (effects, alerts) is finished on the next turn.
 */
export async function syncReplies(deps: ReplyDeps = replyDeps()): Promise<SyncOutcome> {
  const outcome: SyncOutcome = { result: "read", opened: 0, stored: 0, skipped: 0, waiting: 0, alerts: 0 };
  if (!mailboxConfigured()) return { ...outcome, result: "not-configured", detail: "The mailbox password isn't set" };
  const db = createServerClient();
  const known = await loadKnown(db);
  if (!known.since) return { ...outcome, result: "nothing-sent" };

  const { data: cursorRows } = await db.from("outreach_sync").select("mailbox, uidvalidity, last_uid");
  const cursors: Cursor[] = (cursorRows ?? []).map((row) => ({ mailbox: row.mailbox, uidValidity: row.uidvalidity === null ? null : String(row.uidvalidity), lastUid: Number(row.last_uid) }));
  const since = new Date(Math.max(known.since.getTime() - 86_400_000, deps.now().getTime() - 30 * 86_400_000));

  let batches;
  try {
    batches = await deps.inbox.read({ cursors, since, wanted: wantedBy(known), limit: OPEN_PER_TURN });
  } catch (error) {
    const message = (error as Error).message.slice(0, 300);
    await db.from("outreach_sync").upsert({ mailbox: "INBOX", last_error: message }, { onConflict: "mailbox" });
    return { ...outcome, result: "failed", detail: message };
  }

  for (const batch of batches) {
    let lastUid = batch.lastUid;
    for (const { header, raw } of batch.messages) {
      outcome.opened++;
      const email = await parseEmail(raw);
      const match = matchOf(known, email);
      if (!match) {
        outcome.skipped++;
        continue;
      }
      const { data: seen } = await db.from("outreach_replies").select("id").eq("message_id", email.messageId).maybeSingle();
      if (seen) {
        outcome.skipped++;
        continue;
      }
      const now = deps.now();
      const prospect = await getProspect(match.target.campaignId, match.target.prospectId);
      const arrived = arrivedAt(email, header, now);
      let verdict: Classification;
      try {
        verdict = await classify(email, { company: prospect?.company ?? match.target.prospectId, ours: oursFor(match.target, prospect), receivedAt: arrived, zone: prospect ? zoneFor(prospect) : "Australia/Sydney" }, deps.label);
      } catch (error) {
        // A hiccup is worth a few turns; a lasting refusal (no card, bad credentials) isn't.
        const lasting = aiUnavailable(error);
        if (!lasting && now.getTime() - arrived.getTime() < AI_PATIENCE_MS) {
          // Try again next turn: stop this mailbox just before it.
          console.error(`Outreach reply ${email.messageId}: the AI couldn't label it yet (${(error as Error).message})`);
          outcome.waiting++;
          lastUid = header.uid - 1;
          break;
        }
        if (lasting) console.error(`Outreach reply ${email.messageId}: labelled without the AI: ${lasting}`);
        verdict = fallback(email, lasting);
      }
      const row = await store(db, deps, email, match, prospect, header, verdict);
      if (!row) {
        outcome.skipped++;
        continue;
      }
      outcome.stored++;
      try {
        if ((await settleReply(db, deps, row)).alerted) outcome.alerts++;
      } catch (error) {
        console.error(`Outreach reply ${row.id}: stored, but acting on it failed (it's retried next turn):`, error);
      }
    }
    await db.from("outreach_sync").upsert({ mailbox: batch.mailbox, uidvalidity: Number(batch.uidValidity), last_uid: lastUid, synced_at: deps.now().toISOString(), last_error: null }, { onConflict: "mailbox" });
  }

  // Finish what earlier turns left half-done.
  const recent = new Date(deps.now().getTime() - ALERT_RETRY_MS).toISOString();
  const { data: pending } = await db
    .from("outreach_replies")
    .select("*")
    .or(`and(mode.eq.live,applied_at.is.null),and(alerted_at.is.null,created_at.gte."${recent}",or(mode.eq.test,label.in.(${INSTANT_LABELS.join(",")})))`)
    .order("created_at")
    .limit(20);
  for (const row of (pending ?? []) as ReplyRow[]) {
    try {
      if ((await settleReply(db, deps, row)).alerted) outcome.alerts++;
    } catch (error) {
      console.error(`Outreach reply ${row.id}: acting on it failed again:`, error);
    }
  }
  return outcome;
}

/** When the inbox was last read without an error (the sender holds follow-ups when it's stale). */
export async function inboxReadAt(db: Db = createServerClient()): Promise<Date | null> {
  const { data } = await db.from("outreach_sync").select("synced_at, last_error").eq("mailbox", "INBOX").maybeSingle<{ synced_at: string | null; last_error: string | null }>();
  return data?.synced_at && !data.last_error ? new Date(data.synced_at) : null;
}

/** Labels that aren't them answering: the follow-up can still go (a bounce stops it by itself). */
export const NOT_ANSWERED: ReplyLabel[] = ["out-of-office", "auto-reply", "bounce"];

/** Today where a prospect is, for comparing "back on" dates. */
export const todayFor = (p: Prospect, now: Date) => localParts(now, zoneFor(p)).date;
