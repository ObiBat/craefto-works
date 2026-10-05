import "server-only";
import { createServerClient } from "@/lib/supabase";
import { createLead, leadInputSchema, logActivity, type Activity, type LeadRow } from "@/lib/leads";
import { threadUrl } from "./alerts";
import { aiUnavailable, draftWithAi, suggestAnswer, type DraftFn } from "./classify";
import { mailboxConfigured, SENDER, spacemail, type Mailer } from "./mail";
import { applyLabel, toReply, type ReplyRow } from "./replies";
import { addDays, applyAction, hasPlaceholders, messageProblems, OutreachError, sydneyDate } from "./rules";
import { deliver, listMessages, quoteBelow, toMessage, type MessageRow } from "./sender";
import { getProspect, updateProspect } from "./store";
import type { Actor, OutreachMessage, OutreachReply, Prospect, ReplyLabel, StatusAction } from "./types";

// What Obi does with a reply in admin (or from a Telegram button): read the
// thread, correct the label, answer it (sent from the outreach mailbox, in
// the same thread), hand it over to Leads, or mark it handled. Nothing here
// runs by itself.

type Db = ReturnType<typeof createServerClient>;

async function readReply(db: Db, id: string): Promise<ReplyRow> {
  const { data, error } = await db.from("outreach_replies").select("*").eq("id", id).maybeSingle<ReplyRow>();
  if (error) throw error;
  if (!data) throw new OutreachError("No such reply", 404);
  return data;
}

async function companies(db: Db, rows: ReplyRow[]) {
  const names = new Map<string, string>();
  const ids = [...new Set(rows.map((row) => row.prospect_id))];
  if (!ids.length) return names;
  const { data, error } = await db.from("outreach_prospects").select("campaign_id, id, company").in("id", ids);
  if (error) throw error;
  for (const p of data ?? []) names.set(`${p.campaign_id}/${p.id}`, p.company);
  return names;
}

export interface ReplyFilter {
  /** Not handled yet. */
  open?: boolean;
  mode?: "test" | "live";
  campaignId?: string;
  prospectId?: string;
  limit?: number;
}

/** Replies, newest first, with each prospect's company. */
export async function listReplies(filter: ReplyFilter = {}): Promise<OutreachReply[]> {
  const db = createServerClient();
  let query = db.from("outreach_replies").select("*");
  if (filter.open) query = query.is("handled_at", null);
  if (filter.mode) query = query.eq("mode", filter.mode);
  if (filter.campaignId) query = query.eq("campaign_id", filter.campaignId);
  if (filter.prospectId) query = query.eq("prospect_id", filter.prospectId);
  const { data, error } = await query.order("received_at", { ascending: false }).limit(filter.limit ?? 100);
  if (error) throw error;
  const rows = (data ?? []) as ReplyRow[];
  const names = await companies(db, rows);
  return rows.map((row) => toReply(row, names.get(`${row.campaign_id}/${row.prospect_id}`)));
}

/** How many live replies wait for Obi (the queue's badge). */
export async function openReplyCount(): Promise<number> {
  const { count } = await createServerClient().from("outreach_replies").select("id", { count: "exact", head: true }).is("handled_at", null).eq("mode", "live").in("label", ["interested", "question", "referral", "unclear"]);
  return count ?? 0;
}

export type ThreadItem = { at: string; ours: OutreachMessage; theirs?: never } | { at: string; theirs: OutreachReply; ours?: never };

export interface Conversation {
  reply: OutreachReply;
  prospect: Prospect;
  /** Both directions, oldest first: what we sent (tests only beside test replies) and what came back. */
  thread: ThreadItem[];
  /** The do-not-email entry covering the person who wrote, if any. */
  suppressed: { value: string; reason: string } | null;
}

/** The do-not-email entry covering an address or its domain. */
async function suppressionFor(db: Db, address: string) {
  const domain = address.split("@")[1];
  const { data, error } = await db.from("outreach_suppressions").select("value, reason").in("value", [address, ...(domain ? [`@${domain}`] : [])]).limit(1);
  if (error) throw error;
  return (data?.[0] as { value: string; reason: string } | undefined) ?? null;
}

export async function getConversation(replyId: string): Promise<Conversation> {
  const db = createServerClient();
  const row = await readReply(db, replyId);
  const prospect = await getProspect(row.campaign_id, row.prospect_id);
  if (!prospect) throw new OutreachError("The prospect behind this reply is gone", 404);
  const [messages, replies, suppressed] = await Promise.all([
    listMessages({ campaignId: row.campaign_id, prospectId: row.prospect_id, limit: 50 }),
    listReplies({ campaignId: row.campaign_id, prospectId: row.prospect_id, mode: row.mode, limit: 50 }),
    suppressionFor(db, row.from_address),
  ]);
  const thread: ThreadItem[] = [
    ...messages.filter((m) => m.mode === row.mode && m.status !== "failed").map((ours) => ({ at: ours.sentAt ?? ours.createdAt, ours })),
    ...replies.map((theirs) => ({ at: theirs.receivedAt, theirs })),
  ].sort((a, b) => a.at.localeCompare(b.at));
  return { reply: toReply(row, prospect.company), prospect, thread, suppressed };
}

const DAY = /^\d{4}-\d{2}-\d{2}$/;

/**
 * Corrects a label. The correction is kept beside what the machine said
 * (corrected_from), and a live reply's new label takes effect: closing,
 * suppressing or moving the follow-up. Nothing is undone by itself: an
 * address on the do-not-email list stays there until removed by hand.
 */
export async function relabel(replyId: string, to: ReplyLabel | undefined, returnOn: string | null | undefined, actor: Actor): Promise<OutreachReply> {
  const db = createServerClient();
  const row = await readReply(db, replyId);
  const label = to ?? row.label;
  if (returnOn && !DAY.test(returnOn)) throw new OutreachError("Give the date as YYYY-MM-DD", 400);
  const now = new Date();
  const nextReturn = returnOn !== undefined ? returnOn : label === "not-now" ? (row.return_on ?? addDays(sydneyDate(now), 90)) : row.return_on;
  if (row.label === label && nextReturn === row.return_on) return toReply(row);
  const { data, error } = await db
    .from("outreach_replies")
    .update({
      label,
      label_source: "manual",
      corrected_from: row.corrected_from ?? row.label,
      corrected_at: now.toISOString(),
      return_on: nextReturn,
      // A corrected opt-out is a deliberate one.
      complaint: label === "opt-out" ? row.complaint : false,
      applied_at: row.mode === "test" ? row.applied_at : null,
    })
    .eq("id", row.id)
    .select("*")
    .single<ReplyRow>();
  if (error) throw error;
  if (data.mode === "live") {
    await applyLabel(db, data, now, row.label === label ? undefined : row.label);
    await db.from("outreach_replies").update({ applied_at: now.toISOString() }).eq("id", data.id);
  }
  console.log(`Outreach reply ${row.id} relabelled ${row.label} → ${label} by ${actor}`);
  return toReply({ ...data, applied_at: now.toISOString() });
}

export async function setHandled(replyId: string, handled: boolean, actor: Actor): Promise<OutreachReply> {
  const db = createServerClient();
  const { data, error } = await db
    .from("outreach_replies")
    .update(handled ? { handled_at: new Date().toISOString(), handled_by: actor } : { handled_at: null, handled_by: null })
    .eq("id", replyId)
    .select("*")
    .maybeSingle<ReplyRow>();
  if (error) throw error;
  if (!data) throw new OutreachError("No such reply", 404);
  return toReply(data);
}

/** Keeps an edited answer, so it's there next time. */
export async function saveSuggestion(replyId: string, text: string): Promise<OutreachReply> {
  const db = createServerClient();
  const { data, error } = await db.from("outreach_replies").update({ suggested_reply: text }).eq("id", replyId).select("*").maybeSingle<ReplyRow>();
  if (error) throw error;
  if (!data) throw new OutreachError("No such reply", 404);
  return toReply(data);
}

/** A fresh suggested answer from the AI, replacing the one kept. */
export async function redraft(replyId: string, draft: DraftFn = draftWithAi): Promise<OutreachReply> {
  const db = createServerClient();
  const row = await readReply(db, replyId);
  const prospect = await getProspect(row.campaign_id, row.prospect_id);
  const { data: ours } = row.answers ? await db.from("outreach_messages").select("subject, body").eq("id", row.answers).maybeSingle<{ subject: string; body: string }>() : { data: null };
  let text: string;
  try {
    text = await suggestAnswer(
      {
        label: row.label,
        company: prospect?.company ?? row.prospect_id,
        theirName: row.from_name,
        their: { subject: row.subject ?? "", body: row.body },
        ours: ours ?? (prospect?.email ? { subject: prospect.email.subject, body: prospect.email.body } : null),
        research: [prospect?.whyFit, ...(prospect?.findings ?? []).map((finding) => finding.text)].filter((line): line is string => !!line).slice(0, 8),
      },
      draft,
    );
  } catch (error) {
    console.error(`Outreach reply ${row.id}: drafting failed:`, error);
    const lasting = aiUnavailable(error);
    throw new OutreachError(lasting ? `The AI can't draft yet: ${lasting}. Write this one yourself.` : "The AI couldn't draft an answer just now. Try again in a minute, or write it yourself.", 503);
  }
  return saveSuggestion(replyId, text);
}

/**
 * Sends Obi's answer from the outreach mailbox, in the same thread, with
 * their email quoted under it. One answer per reply of theirs; refused when
 * they're on the do-not-email list, or when the signature or opt-out line
 * is missing.
 */
export async function sendAnswer(replyId: string, text: string, actor: Actor, mailer: Mailer = spacemail()): Promise<{ reply: OutreachReply; message: OutreachMessage }> {
  const db = createServerClient();
  const row = await readReply(db, replyId);
  const p = await getProspect(row.campaign_id, row.prospect_id);
  if (!p) throw new OutreachError("The prospect behind this reply is gone", 404);
  const body = text.replace(/\r\n?/g, "\n").trim();
  if (!body) throw new OutreachError("Write the answer first", 400);
  if (hasPlaceholders(body)) throw new OutreachError("Fill in the [bracketed] parts first", 400);
  const problems = messageProblems(body);
  if (problems.length) throw new OutreachError(problems[0], 400);
  if (!mailboxConfigured()) throw new OutreachError("The outreach mailbox isn't set up here", 503);
  if (row.mode === "live") {
    const blocked = await suppressionFor(db, row.from_address);
    if (blocked) throw new OutreachError(`${blocked.value} is on the do-not-email list, so it can't be emailed from here`, 409);
  }

  const subject = /^re:/i.test(row.subject ?? "") ? row.subject! : `Re: ${row.subject || p.email?.subject || "your email"}`;
  const now = new Date();
  const sent = await deliver(db, { mailer, now: () => new Date() }, row.mode, p, "reply", {
    to: [row.from_address],
    subject,
    text: `${body}\n\n${quoteBelow(row.from_name ? `${row.from_name} <${row.from_address}>` : row.from_address, row.received_at, row.body)}`,
    inReplyTo: row.message_id,
    references: [...row.refs, row.message_id].slice(-20),
    evidence: null,
    answersReply: row.id,
  });
  if (!sent) throw new OutreachError("This reply has already been answered", 409);
  if (!sent.result.ok) throw new OutreachError(`It didn't send: ${sent.result.error}${sent.result.response ? ` (${sent.result.response.slice(0, 200)})` : ""}`, 502);

  const { data: updated, error } = await db
    .from("outreach_replies")
    .update({ suggested_reply: body, handled_at: row.handled_at ?? now.toISOString(), handled_by: row.handled_by ?? actor })
    .eq("id", row.id)
    .select("*")
    .single<ReplyRow>();
  if (error) throw error;
  if (row.mode === "live") await updateProspect(p.campaignId, p.id, actor, () => `Answered ${row.from_address} from ${SENDER.address}`);
  const { data: message } = await db.from("outreach_messages").select("*").eq("id", sent.row.id).single<MessageRow>();
  return { reply: toReply(updated, p.company), message: toMessage(message ?? sent.row) };
}

/** Applies a status action when it's allowed from where the prospect is; otherwise leaves it. */
function tryAction(p: Prospect, action: StatusAction, actor: Actor) {
  try {
    applyAction(p, action, { actor, now: new Date() });
  } catch (error) {
    if (!(error instanceof OutreachError)) throw error;
  }
}

export interface Handover {
  leadId: string | null;
  /** A new lead, rather than one that was already there for their address. */
  created: boolean;
  /** A test reply: nothing was handed over. */
  test: boolean;
}

/**
 * Hands a reply over to Leads: the lead for their address (filed if there
 * isn't one, with no "we've received it" email and no owner alert, since
 * Obi is the one doing it), a note with the summary and a link back to the
 * thread, and the reply marked handled. A test reply is only marked handled.
 */
export async function handOver(replyId: string, actor: Actor): Promise<Handover> {
  const db = createServerClient();
  const row = await readReply(db, replyId);
  if (row.lead_id) return { leadId: row.lead_id, created: false, test: false };
  const now = new Date().toISOString();
  if (row.mode === "test") {
    await db.from("outreach_replies").update({ handled_at: row.handled_at ?? now, handled_by: row.handled_by ?? actor }).eq("id", row.id);
    return { leadId: null, created: false, test: true };
  }
  const p = await getProspect(row.campaign_id, row.prospect_id);
  if (!p) throw new OutreachError("The prospect behind this reply is gone", 404);

  const note: Activity = {
    type: "note_added",
    title: "Replied to outreach",
    description: [row.summary, row.quote ? `“${row.quote}”` : null, `The thread: ${threadUrl(row.id)}`].filter(Boolean).join("\n\n"),
    metadata: { outreach_reply: row.id, campaign: row.campaign_id, prospect: row.prospect_id, label: row.label },
  };
  const { data: existing } = await db.from("leads").select("*").eq("email", row.from_address).order("created_at", { ascending: false }).limit(1).maybeSingle<LeadRow>();
  let lead = existing;
  if (lead) await logActivity(db, lead.id, note, "admin");
  else {
    const input = leadInputSchema.safeParse({ name: row.from_name || p.company, email: row.from_address, company: p.company, message: row.body.slice(0, 5000) });
    if (!input.success) throw new OutreachError(`Their details didn't make a valid lead: ${input.error.issues[0]?.message ?? "check the address"}`, 400);
    lead = await createLead(input.data, { source: "outreach", confirm: false, notify: false, activity: note });
  }
  await db.from("outreach_replies").update({ lead_id: lead.id, handled_at: row.handled_at ?? now, handled_by: row.handled_by ?? actor }).eq("id", row.id);
  await updateProspect(p.campaignId, p.id, actor, (draft) => {
    tryAction(draft, "replied", actor);
    return `Handed over to Leads${existing ? " (their lead was already there)" : ""}`;
  });
  return { leadId: lead.id, created: !existing, test: false };
}

/** A Discovery Call booked by someone handed over from outreach moves their prospect to "Meeting". */
export async function outreachMeetingBooked(leadId: string) {
  const db = createServerClient();
  const { data } = await db.from("outreach_replies").select("campaign_id, prospect_id").eq("lead_id", leadId).eq("mode", "live");
  const prospects = [...new Map((data ?? []).map((row) => [`${row.campaign_id}/${row.prospect_id}`, row])).values()];
  for (const { campaign_id, prospect_id } of prospects) {
    await updateProspect(campaign_id, prospect_id, "system", (p) => {
      const before = p.status;
      tryAction(p, "meeting", "system");
      return p.status !== before ? "Discovery Call booked" : null;
    });
  }
}
