import { shortHours } from "./hours";
import { isOpen, type ClientMeeting, type ClientRequest, type ClientTimeEntry } from "./types";

// A client's calendar: their calls, the dates their requests aim for or
// need, deliveries, the work logged day by day, and when their monthly hours
// renew. Dates are the client's own (their time zone) for calls and
// deliveries; logged work and target dates are calendar dates as written.

export type CalendarKind = "call" | "target" | "needed" | "delivered" | "work" | "renews";

export interface CalendarEvent {
  /** yyyy-mm-dd */
  date: string;
  kind: CalendarKind;
  title: string;
  /** "10:30 am" for calls. */
  time?: string;
  detail?: string;
  href?: string;
}

const dateIn = (iso: string, timeZone: string) =>
  new Intl.DateTimeFormat("en-CA", { timeZone, year: "numeric", month: "2-digit", day: "2-digit" }).format(new Date(iso));
const timeIn = (iso: string, timeZone: string) =>
  new Intl.DateTimeFormat("en-AU", { timeZone, hour: "numeric", minute: "2-digit" }).format(new Date(iso)).replace(/\s?([ap])\.?m\.?/i, " $1m");

const ORDER: Record<CalendarKind, number> = { call: 0, needed: 1, target: 2, delivered: 3, work: 4, renews: 5 };

export function calendarEvents({
  requests,
  meetings,
  entries,
  timeZone,
  months,
}: {
  requests: ClientRequest[];
  meetings: ClientMeeting[];
  entries: ClientTimeEntry[];
  timeZone: string;
  /** First days (yyyy-mm-01) of the months whose hours renew, to mark them. */
  months: string[];
}): CalendarEvent[] {
  const events: CalendarEvent[] = [];
  for (const meeting of meetings) {
    if (meeting.status !== "booked") continue;
    events.push({ date: dateIn(meeting.starts_at, timeZone), kind: "call", title: meeting.title || "Call with Craefto", time: timeIn(meeting.starts_at, timeZone), href: "/portal/calls" });
  }
  for (const request of requests) {
    const href = `/portal/requests/${request.id}`;
    if (isOpen(request) && request.target_date && request.estimate_state === "approved") events.push({ date: request.target_date, kind: "target", title: request.title, detail: "Target date", href });
    if (isOpen(request) && request.needed_by) events.push({ date: request.needed_by, kind: "needed", title: request.title, detail: "You need it by", href });
    if (request.status === "delivered" && request.delivered_at) events.push({ date: dateIn(request.delivered_at, timeZone), kind: "delivered", title: request.title, detail: "Delivered", href });
  }
  const byDay = new Map<string, ClientTimeEntry[]>();
  for (const entry of entries) byDay.set(entry.worked_on, [...(byDay.get(entry.worked_on) ?? []), entry]);
  for (const [date, list] of byDay) {
    const minutes = list.reduce((total, entry) => total + entry.minutes, 0);
    const notes = [...new Set(list.map((entry) => entry.note).filter(Boolean))];
    events.push({ date, kind: "work", title: `${shortHours(minutes / 60)} of work`, detail: notes.join(" · ") || undefined });
  }
  for (const first of months) events.push({ date: first, kind: "renews", title: "Monthly hours renew" });
  return events.sort((a, b) => a.date.localeCompare(b.date) || ORDER[a.kind] - ORDER[b.kind] || (a.time ?? "").localeCompare(b.time ?? ""));
}

/** The weeks (Monday first) covering a month, each day as yyyy-mm-dd. */
export function monthGrid(month: string) {
  const [year, monthIndex] = month.split("-").map(Number);
  const first = new Date(Date.UTC(year, monthIndex - 1, 1));
  const start = new Date(first);
  start.setUTCDate(1 - ((first.getUTCDay() + 6) % 7));
  const last = new Date(Date.UTC(year, monthIndex, 0));
  const weeks: string[][] = [];
  for (const day = new Date(start); day <= last || weeks.at(-1)?.length !== 7; day.setUTCDate(day.getUTCDate() + 1)) {
    if (!weeks.length || weeks.at(-1)!.length === 7) weeks.push([]);
    weeks.at(-1)!.push(day.toISOString().slice(0, 10));
  }
  return weeks;
}

/** yyyy-mm for the month before or after. */
export function shiftMonth(month: string, by: number) {
  const [year, monthIndex] = month.split("-").map(Number);
  const date = new Date(Date.UTC(year, monthIndex - 1 + by, 1));
  return date.toISOString().slice(0, 7);
}
