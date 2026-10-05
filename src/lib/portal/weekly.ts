import "server-only";
import type { createServerClient } from "@/lib/supabase";
import * as emails from "@/emails/portal";
import { allowanceFor, longHours, minutesByRequest, sydneyToday, usageFor } from "./hours";
import { sendWeekly } from "./notify";
import { estimateLabel, isOpen, type ClientAccount, type ClientRequest, type ClientSubscription, type ClientTimeEntry } from "./types";

// The Friday effort email (vercel.json → /api/cron/portal-weekly): for each
// client who has it on, the week's studio time and what it went into, the
// month against their hours, what's in progress and next, and anything
// waiting on them. A quiet week (no time, nothing delivered, nothing waiting)
// sends nothing. Once a week per client (client_accounts.weekly_sent_on).

type Db = ReturnType<typeof createServerClient>;

const dayLabel = (date: string) => new Date(`${date}T12:00:00Z`).toLocaleDateString("en-AU", { weekday: "long", day: "numeric", month: "long", timeZone: "UTC" });
const sydneyDay = (iso: string) => new Intl.DateTimeFormat("en-CA", { timeZone: "Australia/Sydney", year: "numeric", month: "2-digit", day: "2-digit" }).format(new Date(iso));
const daysBefore = (date: string, days: number) => new Date(Date.parse(`${date}T12:00:00Z`) - days * 86_400_000).toISOString().slice(0, 10);
/** To the quarter hour: what's reported is what was logged, never rounded up by more than a few minutes. */
const tidy = (hours: number) => Math.round(hours * 4) / 4;

/** One client's summary, or null for a quiet week. */
export function weeklySummary(account: ClientAccount, subscriptions: ClientSubscription[], requests: ClientRequest[], entries: ClientTimeEntry[], today: string, portalUrl: string) {
  const from = daysBefore(today, 6);
  const week = entries.filter((entry) => entry.worked_on >= from && entry.worked_on <= today);
  const weekHours = week.reduce((total, entry) => total + entry.minutes, 0) / 60;
  const logged = minutesByRequest(entries);
  const loggedHours = (request: ClientRequest) => tidy((logged.get(request.id) ?? 0) / 60);
  const delivered = requests.filter((request) => request.status === "delivered" && request.delivered_at && sydneyDay(request.delivered_at) >= from);
  const waiting = requests.filter((request) => request.status === "estimated" || request.status === "needs_info");
  if (weekHours === 0 && delivered.length === 0 && waiting.length === 0) return null;

  const usage = usageFor(allowanceFor(account, subscriptions), entries, requests, today);
  const monthLine = usage.allowance
    ? `This month: ${longHours(tidy(usage.used))} of your ${usage.allowance.hours} used${usage.committedHigh > 0 ? `, with about ${tidy(usage.committedLow)} to ${tidy(usage.committedHigh)} more approved in your queue` : ""}.`
    : null;
  const byQueue = (a: ClientRequest, b: ClientRequest) => (a.queue_position ?? 999) - (b.queue_position ?? 999);
  return emails.weeklyEmail({
    name: account.name,
    weekLabel: `Week ending ${dayLabel(today)}`,
    hoursWeek: weekHours > 0 ? longHours(tidy(weekHours)) : null,
    monthLine,
    waiting: waiting.map((request) => `${request.title}: ${request.status === "estimated" ? `an estimate to approve (${estimateLabel(request) ?? "see your portal"})` : "we need your input"}`),
    delivered: delivered.map((request) => `${request.title}${loggedHours(request) > 0 ? `: ${longHours(loggedHours(request))}` : ""}`),
    inProgress: requests
      .filter((request) => request.status === "in_progress")
      .sort(byQueue)
      .map((request) => `${request.title}: ${longHours(loggedHours(request))} logged${request.estimate_high != null ? ` of up to ${Number(request.estimate_high)}` : ""}`),
    next: requests
      .filter((request) => request.status === "queued")
      .sort(byQueue)
      .slice(0, 3)
      .map((request) => `${request.title}${estimateLabel(request) ? ` (${estimateLabel(request)})` : ""}`),
    link: portalUrl,
  });
}

/** Send this Friday's summaries: each claimed before sending, so a retried run never sends one twice. */
export async function sendWeeklySummaries(db: Db, origin: string, now = new Date()) {
  const today = sydneyToday(now);
  const { data: accounts, error } = await db.from("client_accounts").select("*").eq("weekly_email", true);
  if (error) throw error;
  let sent = 0;
  for (const account of (accounts ?? []) as ClientAccount[]) {
    if (account.weekly_sent_on === today) continue;
    const [{ data: subscriptions }, { data: requests }, { data: entries }] = await Promise.all([
      db.from("client_subscriptions").select("*").eq("account_id", account.id),
      db.from("client_requests").select("*").eq("account_id", account.id),
      db.from("client_time_entries").select("*").eq("account_id", account.id),
    ]);
    const all = (requests ?? []) as ClientRequest[];
    const allowance = allowanceFor(account, (subscriptions ?? []) as ClientSubscription[]);
    // Only clients with hours to report on, or work still open.
    if (!allowance && !all.some(isOpen)) continue;
    const email = weeklySummary(account, (subscriptions ?? []) as ClientSubscription[], all, (entries ?? []) as ClientTimeEntry[], today, `${origin}/portal/login?email=${encodeURIComponent(account.email)}`);
    if (!email) continue;
    const { data: claimed } = await db
      .from("client_accounts")
      .update({ weekly_sent_on: today })
      .eq("id", account.id)
      .or(`weekly_sent_on.is.null,weekly_sent_on.neq.${today}`)
      .select("id")
      .maybeSingle();
    if (!claimed) continue;
    await sendWeekly(account, email);
    sent++;
  }
  return { sent };
}
