import type { Metadata } from "next";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { PageTitle } from "@/components/portal/page-title";
import { calendarEvents, monthGrid, shiftMonth, type CalendarEvent, type CalendarKind } from "@/lib/portal/calendar";
import { requireMember } from "@/lib/portal/session";
import type { ClientMeeting, ClientRequest, ClientTimeEntry } from "@/lib/portal/types";
import { cn } from "@/lib/utils";

export const metadata: Metadata = { title: "Calendar" };

const KINDS: Record<CalendarKind, { label: string; chip: string; dot: string }> = {
  call: { label: "Call", chip: "bg-[hsl(var(--color-foreground))] text-[hsl(var(--color-background))]", dot: "bg-[hsl(var(--color-foreground))]" },
  needed: { label: "You need it", chip: "bg-[hsl(var(--color-warning-subtle))] text-[hsl(35_55%_28%)]", dot: "bg-[hsl(var(--color-warning))]" },
  target: { label: "Target", chip: "bg-[hsl(var(--color-accent-subtle))] text-[hsl(var(--color-accent))]", dot: "bg-[hsl(var(--color-accent))]" },
  delivered: { label: "Delivered", chip: "bg-[hsl(var(--color-accent))] text-white", dot: "bg-[hsl(var(--color-accent))]" },
  work: { label: "Work", chip: "bg-[hsl(var(--color-background-muted))] text-[hsl(var(--color-foreground-muted))]", dot: "bg-[hsl(var(--color-foreground-subtle))]" },
  renews: { label: "Hours renew", chip: "bg-[hsl(var(--color-background))] text-[hsl(var(--color-foreground-muted))]", dot: "bg-[hsl(var(--color-border-strong))]" },
};

const WEEKDAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

const todayIn = (timeZone: string) => new Intl.DateTimeFormat("en-CA", { timeZone, year: "numeric", month: "2-digit", day: "2-digit" }).format(new Date());
const monthName = (month: string) => new Date(`${month}-15T12:00:00Z`).toLocaleDateString("en-AU", { month: "long", year: "numeric", timeZone: "UTC" });
const dayName = (date: string) => new Date(`${date}T12:00:00Z`).toLocaleDateString("en-AU", { weekday: "long", day: "numeric", month: "long", timeZone: "UTC" });

function Chip({ event }: { event: CalendarEvent }) {
  const body = (
    <span className={cn("block truncate rounded-md px-1.5 py-0.5 text-[0.6875rem] leading-snug", KINDS[event.kind].chip)}>
      {event.time ? `${event.time} ` : ""}
      {event.title}
    </span>
  );
  return event.href ? (
    <Link href={event.href} className="block transition-opacity hover:opacity-80" title={`${KINDS[event.kind].label}: ${event.title}`}>
      {body}
    </Link>
  ) : (
    <span title={event.detail ?? event.title}>{body}</span>
  );
}

/** The client's month: calls, the dates their requests aim for or need, deliveries, work logged and when hours renew. */
export default async function CalendarPage({ searchParams }: { searchParams: Promise<{ month?: string }> }) {
  const { account, db } = await requireMember();
  const timeZone = account.time_zone || "Australia/Sydney";
  const today = todayIn(timeZone);
  const asked = (await searchParams).month;
  const month = asked && /^\d{4}-(0[1-9]|1[0-2])$/.test(asked) ? asked : today.slice(0, 7);
  const weeks = monthGrid(month);
  const from = weeks[0][0];
  const to = weeks.at(-1)!.at(-1)!;

  const [{ data: requestRows }, { data: meetingRows }, { data: entryRows }] = await Promise.all([
    db.from("client_requests").select("*").eq("account_id", account.id),
    db.from("client_meetings").select("*").eq("account_id", account.id).gte("starts_at", `${from}T00:00:00Z`).lte("starts_at", `${to}T23:59:59Z`),
    db.from("client_time_entries").select("*").eq("account_id", account.id).gte("worked_on", from).lte("worked_on", to),
  ]);
  const firsts = [month, shiftMonth(month, 1)].map((value) => `${value}-01`).filter((first) => first >= from && first <= to);
  const events = calendarEvents({
    requests: (requestRows ?? []) as ClientRequest[],
    meetings: (meetingRows ?? []) as ClientMeeting[],
    entries: (entryRows ?? []) as ClientTimeEntry[],
    timeZone,
    months: firsts,
  });
  const onDay = new Map<string, CalendarEvent[]>();
  for (const event of events) onDay.set(event.date, [...(onDay.get(event.date) ?? []), event]);
  const agenda = events.filter((event) => event.date.startsWith(month));
  const agendaDays = [...new Set(agenda.map((event) => event.date))];
  const navLink = "grid size-11 place-items-center rounded-full bg-[hsl(var(--color-background-subtle))] transition-colors hover:bg-[hsl(var(--color-accent-subtle))]";

  return (
    <>
      <PageTitle
        title="Calendar"
        actions={
          <Button asChild size="lg" variant="secondary">
            <Link href="/portal/calls">Book a call</Link>
          </Button>
        }
      >
        <p>Your calls, the dates your requests aim for, deliveries and the work logged each day.</p>
      </PageTitle>

      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <h2 className="font-[family-name:var(--font-heading)] text-2xl font-semibold tracking-tight md:text-3xl">{monthName(month)}</h2>
        <div className="flex items-center gap-2">
          {month !== today.slice(0, 7) && (
            <Link href="/portal/calendar" className="mr-2 text-sm font-medium text-[hsl(var(--color-accent))] hover:underline">
              This month
            </Link>
          )}
          <Link href={`/portal/calendar?month=${shiftMonth(month, -1)}`} aria-label="Previous month" className={navLink}>
            <svg aria-hidden="true" className="size-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </Link>
          <Link href={`/portal/calendar?month=${shiftMonth(month, 1)}`} aria-label="Next month" className={navLink}>
            <svg aria-hidden="true" className="size-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </Link>
        </div>
      </div>

      <div className="overflow-hidden rounded-3xl bg-[hsl(var(--color-background-subtle))] p-2 sm:p-3">
        <div className="grid grid-cols-7 gap-1 px-1 pb-2 pt-1 sm:gap-2">
          {WEEKDAYS.map((weekday) => (
            <span key={weekday} className="text-center font-mono text-[0.6875rem] uppercase tracking-[0.06em] text-[hsl(var(--color-foreground-subtle))]">
              {weekday}
            </span>
          ))}
        </div>
        <div className="grid grid-cols-7 gap-1 sm:gap-2">
          {weeks.flat().map((date) => {
            const inMonth = date.startsWith(month);
            const isToday = date === today;
            const list = onDay.get(date) ?? [];
            return (
              <div
                key={date}
                className={cn(
                  "flex min-h-16 flex-col gap-1 rounded-xl p-1.5 sm:min-h-28 sm:rounded-2xl sm:p-2",
                  inMonth ? "bg-[hsl(var(--color-background))]" : "bg-transparent",
                  isToday && "ring-2 ring-[hsl(var(--color-accent))]"
                )}
              >
                <span
                  className={cn(
                    "text-xs tabular-nums sm:text-sm",
                    isToday ? "font-semibold text-[hsl(var(--color-accent))]" : inMonth ? "text-[hsl(var(--color-foreground))]" : "text-[hsl(var(--color-foreground-subtle))]"
                  )}
                >
                  {Number(date.slice(8))}
                </span>
                {/* Phones: a dot for each kind of thing on the day; the list below has the details. */}
                <span className="flex flex-wrap gap-1 sm:hidden">
                  {[...new Set(list.map((event) => event.kind))].map((kind) => (
                    <span key={kind} aria-hidden="true" className={cn("size-1.5 rounded-full", KINDS[kind].dot)} />
                  ))}
                </span>
                <span className="hidden flex-col gap-1 sm:flex">
                  {list.slice(0, 3).map((event, index) => (
                    <Chip key={index} event={event} />
                  ))}
                  {list.length > 3 && <span className="px-1.5 text-[0.6875rem] text-[hsl(var(--color-foreground-subtle))]">+{list.length - 3} more</span>}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      <div className="mt-4 flex flex-wrap gap-x-5 gap-y-2">
        {(Object.keys(KINDS) as CalendarKind[]).map((kind) => (
          <span key={kind} className="flex items-center gap-2 text-sm text-[hsl(var(--color-foreground-muted))]">
            <span aria-hidden="true" className={cn("size-2 rounded-full", KINDS[kind].dot)} />
            {KINDS[kind].label}
          </span>
        ))}
      </div>

      <section className="mt-14 max-w-3xl">
        <h2 className="label-heading mb-6">This month</h2>
        {agendaDays.length === 0 ? (
          <p className="text-[hsl(var(--color-foreground-subtle))]">Nothing on the calendar this month yet.</p>
        ) : (
          <ol className="flex flex-col gap-6">
            {agendaDays.map((date) => (
              <li key={date} className="grid gap-2 sm:grid-cols-[11rem_minmax(0,1fr)] sm:gap-6">
                <p className={cn("text-sm font-medium", date === today ? "text-[hsl(var(--color-accent))]" : "text-[hsl(var(--color-foreground))]")}>
                  {dayName(date)}
                  {date === today && " · today"}
                </p>
                <ul className="flex flex-col gap-2">
                  {agenda
                    .filter((event) => event.date === date)
                    .map((event, index) => {
                      const content = (
                        <>
                          <span className={cn("mt-1.5 size-2 shrink-0 rounded-full", KINDS[event.kind].dot)} aria-hidden="true" />
                          <span className="min-w-0">
                            <span className="block text-[hsl(var(--color-foreground))]">
                              {event.time && <span className="font-medium">{event.time} · </span>}
                              {event.title}
                            </span>
                            {(event.detail || event.kind === "call") && (
                              <span className="block text-sm text-[hsl(var(--color-foreground-subtle))]">{event.kind === "call" ? `Call · your time (${timeZone.replace(/_/g, " ")})` : event.detail}</span>
                            )}
                          </span>
                        </>
                      );
                      return (
                        <li key={index}>
                          {event.href ? (
                            <Link href={event.href} className="flex gap-3 rounded-xl px-1 py-0.5 transition-colors hover:text-[hsl(var(--color-accent))]">
                              {content}
                            </Link>
                          ) : (
                            <span className="flex gap-3 px-1 py-0.5">{content}</span>
                          )}
                        </li>
                      );
                    })}
                </ul>
              </li>
            ))}
          </ol>
        )}
      </section>
    </>
  );
}
