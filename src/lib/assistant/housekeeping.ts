import "server-only";
import { siteConfig } from "@/lib/constants";
import { ADMIN_EMAIL, EMAIL_FROM, isEmailEnabled, resend } from "@/lib/resend";
import { createServerClient } from "@/lib/supabase";
import { assistantWeeklyEmail } from "@/emails/assistant-weekly";

// Ask Craefto's daily housekeeping (api/cron/assistant): chats that didn't
// become an enquiry are deleted after 90 days, as the privacy policy says,
// and on Mondays Obi gets the questions it couldn't answer that week.

type Db = ReturnType<typeof createServerClient>;

export const RETENTION_DAYS = 90;

/** Deletes chats with no lead that nobody has touched for 90 days. */
export async function deleteExpiredChats(db: Db, now = new Date()) {
  const cutoff = new Date(now.getTime() - RETENTION_DAYS * 86_400_000).toISOString();
  const { data, error } = await db.from("assistant_chats").delete().is("lead_id", null).lt("updated_at", cutoff).select("id");
  if (error) throw error;
  return data?.length ?? 0;
}

const dayLabel = (at: Date) => new Intl.DateTimeFormat("en-AU", { timeZone: "Australia/Sydney", day: "numeric", month: "short" }).format(at);

/** Whether it's Monday in Sydney. */
export const isMonday = (now = new Date()) => new Intl.DateTimeFormat("en-AU", { timeZone: "Australia/Sydney", weekday: "short" }).format(now) === "Mon";

/** Monday's email: the week's numbers and unanswered questions. Skipped when there were no chats. */
export async function sendWeeklyNote(db: Db, now = new Date()) {
  if (!isEmailEnabled()) return { sent: false, reason: "Email isn't set up" };
  const since = new Date(now.getTime() - 7 * 86_400_000);
  const { data, error } = await db.from("assistant_chats").select("status, turns, gaps, blocked, lead_id").gte("updated_at", since.toISOString());
  if (error) throw error;
  const chats = (data ?? []) as { status: string; turns: number; gaps: string[]; blocked: string[]; lead_id: string | null }[];
  if (!chats.length) return { sent: false, reason: "No chats this week" };
  const gaps = [...new Set(chats.flatMap((chat) => chat.gaps))].slice(0, 40);
  const email = assistantWeeklyEmail({
    week: `${dayLabel(since)} – ${dayLabel(now)}`,
    numbers: [
      ["Chats", String(chats.length)],
      ["Visitor messages", String(chats.reduce((total, chat) => total + chat.turns, 0))],
      ["Became enquiries", String(chats.filter((chat) => chat.status === "enquiry").length)],
      ["Asked for a person", String(chats.filter((chat) => chat.status === "handoff").length)],
      ["Price check stepped in", String(chats.reduce((total, chat) => total + chat.blocked.length, 0))],
    ],
    gaps,
    link: `${siteConfig.url}/admin/chats`,
  });
  const result = await resend.emails.send({ from: EMAIL_FROM, to: ADMIN_EMAIL, subject: email.subject, html: email.html });
  if (result.error) throw new Error(`Resend: ${result.error.message}`);
  return { sent: true, subject: email.subject };
}
