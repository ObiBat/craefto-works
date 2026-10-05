import "server-only";
import { createServerClient } from "@/lib/supabase";
import { siteConfig } from "@/lib/constants";
import { ADMIN_EMAIL, EMAIL_FROM, isEmailEnabled, resend } from "@/lib/resend";
import { outreachDigestEmail, type DigestLine } from "@/emails/outreach-digest";
import { threadUrl } from "./alerts";
import { sydneyDate } from "./rules";
import { getSettings } from "./sender";
import { INSTANT_LABELS, REPLY_LABEL, type ReplyLabel } from "./types";

// The morning digest (plan: "short email digest at 8:30am"). Vercel Cron calls
// at 21:30 and 22:30 UTC; whichever is 8:30 in Sydney sends it, once a day.
// Only live replies: test replies alert straight away and stop there.

type Db = ReturnType<typeof createServerClient>;

interface Row {
  id: string;
  campaign_id: string;
  prospect_id: string;
  label: ReplyLabel;
  summary: string | null;
  return_on: string | null;
  received_at: string;
}

const day = (at: Date) => new Intl.DateTimeFormat("en-AU", { timeZone: "Australia/Sydney", weekday: "short", day: "numeric", month: "short" }).format(at);

async function companies(db: Db, rows: Row[]) {
  const names = new Map<string, string>();
  const keys = [...new Set(rows.map((row) => row.prospect_id))];
  if (!keys.length) return names;
  const { data } = await db.from("outreach_prospects").select("campaign_id, id, company").in("id", keys);
  for (const p of data ?? []) names.set(`${p.campaign_id}/${p.id}`, p.company);
  return names;
}

export type DigestOutcome = { sent: true; subject: string } | { sent: false; reason: string };

/** Sends today's digest if it hasn't gone yet. `force` sends again (from admin, to check it). */
export async function sendDigest(now = new Date(), { force = false } = {}): Promise<DigestOutcome> {
  if (!isEmailEnabled()) return { sent: false, reason: "Email isn't set up (RESEND_API_KEY)" };
  const db = createServerClient();
  const today = sydneyDate(now);

  const { data: before } = await db.from("outreach_settings").select("digest_sent_on").eq("id", 1).single<{ digest_sent_on: string | null }>();
  if (!force) {
    const { data: claimed, error } = await db
      .from("outreach_settings")
      .update({ digest_sent_on: today })
      .eq("id", 1)
      .or(`digest_sent_on.is.null,digest_sent_on.lt.${today}`)
      .select("id");
    if (error) throw error;
    if (!claimed?.length) return { sent: false, reason: "Already sent today" };
  }

  const [open, handled, due, settings, sent, queued, sync] = await Promise.all([
    db.from("outreach_replies").select("id, campaign_id, prospect_id, label, summary, return_on, received_at").eq("mode", "live").is("handled_at", null).in("label", INSTANT_LABELS).order("received_at"),
    db.from("outreach_replies").select("id, campaign_id, prospect_id, label, summary, return_on, received_at").eq("mode", "live").is("digested_at", null).not("label", "in", `(${INSTANT_LABELS.join(",")})`).order("received_at"),
    db.from("outreach_replies").select("id, campaign_id, prospect_id, label, summary, return_on, received_at").eq("mode", "live").eq("label", "not-now").lte("return_on", today).is("reminded_on", null),
    getSettings(db),
    db.from("outreach_messages").select("status").eq("mode", "live").neq("kind", "reply").in("status", ["sent", "bounced"]).gte("sent_at", new Date(now.getTime() - 24 * 3600_000).toISOString()),
    db.from("outreach_prospects").select("id", { count: "exact", head: true }).eq("status", "approved").eq("contact_kind", "email"),
    db.from("outreach_sync").select("synced_at, last_error").eq("mailbox", "INBOX").maybeSingle<{ synced_at: string | null; last_error: string | null }>(),
  ]);
  const rows = [...(open.data ?? []), ...(handled.data ?? []), ...(due.data ?? [])] as Row[];
  const names = await companies(db, rows);
  const line = (row: Row, text: string | null): DigestLine => ({ company: names.get(`${row.campaign_id}/${row.prospect_id}`) ?? row.prospect_id, label: REPLY_LABEL[row.label], line: text, link: threadUrl(row.id) });

  const sentRows = (sent.data ?? []) as { status: string }[];
  const bounced = sentRows.filter((row) => row.status === "bounced").length;
  const quiet = !rows.length && !sentRows.length && settings.mode === "off";
  if (quiet) return { sent: false, reason: "Nothing to report" };

  const email = outreachDigestEmail({
    day: day(now),
    needsYou: ((open.data ?? []) as Row[]).map((row) => line(row, row.summary)),
    due: ((due.data ?? []) as Row[]).map((row) => line(row, `They said to try again around now${row.summary ? `: ${row.summary}` : ""}`)),
    handled: ((handled.data ?? []) as Row[]).map((row) => line(row, row.summary)),
    sending: [
      ["Mode", settings.pausedReason ? `Paused: ${settings.pausedReason}` : { off: "Off", test: "Test (to your own inbox)", live: "Live" }[settings.mode]],
      ["Last 24 hours", `${sentRows.length} sent${bounced ? `, ${bounced} bounced` : ""}`],
      ["Queued", `${queued.count ?? 0} approved`],
      ["Inbox", sync.data?.last_error ? `Couldn't be read: ${sync.data.last_error}` : sync.data?.synced_at ? null : "Not read yet"],
    ],
    link: `${siteConfig.url}/admin/outreach/replies`,
  });

  const result = await resend.emails.send({ from: EMAIL_FROM, to: ADMIN_EMAIL, subject: email.subject, html: email.html });
  if (result.error) {
    if (!force) await db.from("outreach_settings").update({ digest_sent_on: before?.digest_sent_on ?? null }).eq("id", 1);
    throw new Error(`Resend: ${result.error.message}`);
  }
  const handledIds = ((handled.data ?? []) as Row[]).map((row) => row.id);
  const dueIds = ((due.data ?? []) as Row[]).map((row) => row.id);
  if (handledIds.length) await db.from("outreach_replies").update({ digested_at: now.toISOString() }).in("id", handledIds);
  if (dueIds.length) await db.from("outreach_replies").update({ reminded_on: today }).in("id", dueIds);
  return { sent: true, subject: email.subject };
}

/** Whether it's the digest's hour in Sydney (the cron runs at both possible UTC times). */
export const digestHour = (now = new Date()) => Number(new Intl.DateTimeFormat("en-AU", { timeZone: "Australia/Sydney", hour: "numeric", hourCycle: "h23" }).format(now)) === 8;
