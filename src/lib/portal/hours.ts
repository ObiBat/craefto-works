import { planById } from "@/lib/pricing";
import { isLive, isOpen, type ClientAccount, type ClientRequest, type ClientSubscription, type ClientTimeEntry } from "./types";

// Studio time: the hours a client has each month, what's been used, and
// what's already approved in their queue. A client on a Stripe plan has its
// hours (plans can be combined); a client Craefto agreed hours with directly
// has the account's monthly_hours instead. Months are calendar months in
// Sydney, where the work is logged.

/** Today's date in Sydney, yyyy-mm-dd. */
export const sydneyToday = (now = new Date()) =>
  new Intl.DateTimeFormat("en-CA", { timeZone: "Australia/Sydney", year: "numeric", month: "2-digit", day: "2-digit" }).format(now);

/** The calendar month a date falls in: its first and last day, and the first of the next. */
export function monthOf(date: string) {
  const [year, month] = date.split("-").map(Number);
  const pad = (value: number) => String(value).padStart(2, "0");
  const last = new Date(Date.UTC(year, month, 0)).getUTCDate();
  const next = month === 12 ? `${year + 1}-01-01` : `${year}-${pad(month + 1)}-01`;
  return { from: `${year}-${pad(month)}-01`, to: `${year}-${pad(month)}-${pad(last)}`, renews: next };
}

export interface Allowance {
  hours: number;
  /** "Studio plan", "JapanoMa monthly hours" */
  label: string;
}

/** The hours the client has this month, or null when they have none (no plan running, none agreed). */
export function allowanceFor(account: Pick<ClientAccount, "monthly_hours" | "engagement">, subscriptions: ClientSubscription[]): Allowance | null {
  if (account.monthly_hours) return { hours: Number(account.monthly_hours), label: account.engagement || "Monthly hours" };
  const running = subscriptions.filter(isLive).map((subscription) => planById(subscription.plan)).filter((plan) => plan?.hours);
  if (running.length === 0) return null;
  const hours = running.reduce((total, plan) => total + (plan!.hours ?? 0), 0);
  const names = running.map((plan) => plan!.name);
  return { hours, label: `${names.join(" and ")} plan${names.length > 1 ? "s" : ""}` };
}

/** Minutes logged against each request. */
export function minutesByRequest(entries: ClientTimeEntry[]) {
  const totals = new Map<string, number>();
  for (const entry of entries) if (entry.request_id) totals.set(entry.request_id, (totals.get(entry.request_id) ?? 0) + entry.minutes);
  return totals;
}

export interface Usage {
  allowance: Allowance | null;
  month: ReturnType<typeof monthOf>;
  /** Hours logged this month. */
  used: number;
  /** Hours still to come on approved, open requests (their estimates less what's logged), low and high. */
  committedLow: number;
  committedHigh: number;
  /** Hours left this month after what's used (negative when over). */
  left: number | null;
}

/** Where the month stands, from the account's time entries and requests. */
export function usageFor(allowance: Allowance | null, entries: ClientTimeEntry[], requests: ClientRequest[], today = sydneyToday()): Usage {
  const month = monthOf(today);
  const used = entries.filter((entry) => entry.worked_on >= month.from && entry.worked_on <= month.to).reduce((total, entry) => total + entry.minutes, 0) / 60;
  const logged = minutesByRequest(entries);
  let committedLow = 0;
  let committedHigh = 0;
  for (const request of requests) {
    if (!isOpen(request) || request.estimate_state !== "approved" || request.estimate_low == null || request.estimate_high == null) continue;
    const done = (logged.get(request.id) ?? 0) / 60;
    committedLow += Math.max(0, Number(request.estimate_low) - done);
    committedHigh += Math.max(0, Number(request.estimate_high) - done);
  }
  return { allowance, month, used, committedLow, committedHigh, left: allowance ? allowance.hours - used : null };
}

/** Hours to two places at most: 2.5, 5.75, 3. */
const exact = (hours: number) => Number(hours.toFixed(2));

/** "2.5 h", "5.75 h", "45 min" */
export function shortHours(hours: number) {
  if (hours > 0 && hours < 1) return `${Math.round(hours * 60)} min`;
  return `${exact(hours)} h`;
}

/** "2.5 hours", "1 hour", "45 minutes" */
export function longHours(hours: number) {
  if (hours > 0 && hours < 1) return `${Math.round(hours * 60)} minutes`;
  const value = exact(hours);
  return `${value} hour${value === 1 ? "" : "s"}`;
}
