import type { Metadata } from "next";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Callout, Empty, Section } from "@/components/portal/blocks";
import { HoursMeter } from "@/components/portal/hours-meter";
import { PageTitle } from "@/components/portal/page-title";
import { PlanSummary } from "@/components/portal/plan-summary";
import { RequestList } from "@/components/portal/request-list";
import { sydneyDate } from "@/components/portal/thread";
import { calendarEvents, type CalendarEvent } from "@/lib/portal/calendar";
import { minutesByRequest, shortHours, usageFor } from "@/lib/portal/hours";
import { requireMember } from "@/lib/portal/session";
import { isOwing, isWaitingOnClient, shownPlans, type ClientMeeting, type ClientMessage, type ClientRequest, type ClientTimeEntry } from "@/lib/portal/types";
import { cn } from "@/lib/utils";
import { openBilling } from "./actions";

export const metadata: Metadata = { title: "Overview" };

const link = "inline-flex items-center font-medium text-[hsl(var(--color-accent))] hover:underline";
const byQueue = (a: ClientRequest, b: ClientRequest) => (a.queue_position ?? 999) - (b.queue_position ?? 999);
const shortDay = (date: string) => new Date(`${date}T12:00:00Z`).toLocaleDateString("en-AU", { weekday: "short", day: "numeric", month: "short", timeZone: "UTC" });

/** A request being worked on: the time logged against its estimate. */
function WorkCard({ request, minutes }: { request: ClientRequest; minutes: number }) {
  const logged = minutes / 60;
  const high = request.estimate_high != null ? Number(request.estimate_high) : null;
  return (
    <Link href={`/portal/requests/${request.id}`} className="group block rounded-3xl bg-[hsl(var(--color-accent-subtle))] p-6 transition-colors hover:bg-[hsl(var(--color-accent-subtle)/0.7)]">
      <div className="flex items-start justify-between gap-4">
        <p className="font-semibold tracking-tight text-[hsl(var(--color-foreground))] group-hover:text-[hsl(var(--color-accent))]">{request.title}</p>
        <span className="portal-live-dot mt-1.5 shrink-0" aria-label="In progress" />
      </div>
      <div className="mt-5 flex items-baseline justify-between gap-4 text-sm">
        <span className="text-[hsl(var(--color-foreground-muted))]">{logged > 0 ? "Time logged" : "Just started"}</span>
        {high != null && (
          <span className="font-medium tabular-nums">
            {shortHours(logged)} <span className="font-normal text-[hsl(var(--color-foreground-subtle))]">of up to {shortHours(high)}</span>
          </span>
        )}
      </div>
      {high != null && (
        <div className="mt-2 h-2 overflow-hidden rounded-full bg-[hsl(var(--color-background)/0.8)]">
          <div className={cn("portal-meter-fill h-full rounded-full", logged > high ? "bg-[hsl(var(--color-warning))]" : "bg-[hsl(var(--color-accent))]")} style={{ width: `${Math.min(100, (logged / high) * 100)}%` }} />
        </div>
      )}
    </Link>
  );
}

/** The next fortnight: calls and the dates that matter. */
function ComingUp({ events, today }: { events: CalendarEvent[]; today: string }) {
  return (
    <div className="rounded-3xl bg-[hsl(var(--color-background-subtle))] p-6">
      <div className="flex items-baseline justify-between gap-4">
        <p className="font-semibold tracking-tight">Coming up</p>
        <Link href="/portal/calendar" className={`text-sm ${link}`}>
          Calendar
        </Link>
      </div>
      {events.length === 0 ? (
        <p className="mt-2 text-sm text-[hsl(var(--color-foreground-muted))]">Nothing in the next two weeks.</p>
      ) : (
        <ul className="mt-4 flex flex-col gap-3">
          {events.map((event, index) => (
            <li key={index}>
              <Link href={event.href ?? "/portal/calendar"} className="group flex gap-3">
                <span className="w-16 shrink-0 font-mono text-[0.6875rem] uppercase leading-5 tracking-[0.06em] text-[hsl(var(--color-foreground-subtle))]">
                  {event.date === today ? "Today" : shortDay(event.date)}
                </span>
                <span className="min-w-0 text-sm leading-5">
                  <span className="block truncate text-[hsl(var(--color-foreground))] group-hover:text-[hsl(var(--color-accent))]">
                    {event.time ? `${event.time} · ` : ""}
                    {event.title}
                  </span>
                  <span className="block text-[hsl(var(--color-foreground-subtle))]">{event.kind === "call" ? "Call" : event.detail}</span>
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

/** Where everything stands: what waits on the client, what's being worked on and the time going in, what's next, and the month's hours. */
export default async function OverviewPage({ searchParams }: { searchParams: Promise<{ welcome?: string }> }) {
  const member = await requireMember();
  const { account, subscriptions, allowance, db } = member;
  const welcome = Boolean((await searchParams).welcome);
  const timeZone = account.time_zone || "Australia/Sydney";

  const [{ data: requestRows }, { data: replyRows }, { data: callRows }, { data: entryRows }] = await Promise.all([
    db.from("client_requests").select("*").eq("account_id", account.id).order("updated_at", { ascending: false }),
    db.from("client_messages").select("*").eq("account_id", account.id).eq("author", "craefto").order("created_at", { ascending: false }).limit(3),
    db.from("client_meetings").select("*").eq("account_id", account.id).eq("status", "booked").gte("ends_at", new Date().toISOString()).order("starts_at").limit(5),
    db.from("client_time_entries").select("*").eq("account_id", account.id),
  ]);
  const requests = (requestRows ?? []) as ClientRequest[];
  const replies = (replyRows ?? []) as ClientMessage[];
  const entries = (entryRows ?? []) as ClientTimeEntry[];
  const logged = minutesByRequest(entries);
  const usage = usageFor(allowance, entries, requests);
  const waiting = requests.filter(isWaitingOnClient);
  const working = requests.filter((request) => request.status === "in_progress").sort(byQueue);
  const queue = requests.filter((request) => request.status === "queued").sort(byQueue);
  const estimating = requests.filter((request) => request.status === "received");
  const titles = new Map(requests.map((request) => [request.id, request.title]));
  const toApprove = requests.filter((request) => request.status === "estimated");

  const today = new Intl.DateTimeFormat("en-CA", { timeZone, year: "numeric", month: "2-digit", day: "2-digit" }).format(new Date());
  const now = new Date();
  const fortnight = new Date(now.getTime() + 14 * 86_400_000).toISOString().slice(0, 10);
  const upcoming = calendarEvents({ requests, meetings: (callRows ?? []) as ClientMeeting[], entries: [], timeZone, months: [usage.month.renews] })
    .filter((event) => event.date >= today && event.date <= fortnight && event.kind !== "delivered")
    .slice(0, 5);

  const firstName = account.name?.split(" ")[0];
  const tally = [
    waiting.length && `${waiting.length} waiting on you`,
    working.length && `${working.length} in progress`,
    queue.length && `${queue.length} in your queue`,
  ].filter(Boolean);

  const newRequest = allowance && (
    <Button asChild size="lg">
      <Link href="/portal/requests/new">New request</Link>
    </Button>
  );

  return (
    <>
      <PageTitle
        eyebrow={account.company ?? allowance?.label ?? "Overview"}
        title={welcome ? `Welcome${firstName ? `, ${firstName}` : ""}` : `Hi${firstName ? `, ${firstName}` : ""}`}
        actions={requests.length > 0 && newRequest}
      >
        {welcome ? (
          <p>
            This is your portal: send requests, approve each estimate before work starts, follow the time that goes in, and message us. To come back, sign in with
            your email; there&apos;s no password.
          </p>
        ) : (
          <p>{tally.length ? `${tally.join(" · ")}.` : "Here's where everything stands."}</p>
        )}
      </PageTitle>

      <div className="mb-12 flex flex-col gap-4 empty:hidden">
        {isOwing(subscriptions) && (
          <Callout
            tone="attention"
            title="Your last payment didn't go through"
            action={
              <form action={openBilling}>
                <Button type="submit">Update your card</Button>
              </form>
            }
          >
            Update your card to keep your plan running.
          </Callout>
        )}
        {toApprove.length > 0 && (
          <Callout
            tone="attention"
            title={toApprove.length === 1 ? "An estimate is ready for you" : `${toApprove.length} estimates are ready for you`}
            action={
              <Button asChild>
                <Link href={toApprove.length === 1 ? `/portal/requests/${toApprove[0].id}` : "/portal/requests"}>{toApprove.length === 1 ? "Review it" : "Review them"}</Link>
              </Button>
            }
          >
            {toApprove.length === 1 ? `“${toApprove[0].title}”: approve it and it joins your queue.` : "Approve each one and it joins your queue."} Nothing starts before you do.
          </Callout>
        )}
        {!allowance && subscriptions[0]?.status === "canceled" && (
          <Callout
            title="Your plan has ended"
            action={
              <Button asChild>
                <Link href="/services#plans">See the plans</Link>
              </Button>
            }
          >
            Your requests and messages are still here. Start a plan again whenever you&apos;re ready.
          </Callout>
        )}
      </div>

      {/* Phones: the month's hours first, where they're seen; wider screens have them beside the work. */}
      <HoursMeter usage={usage} className="mb-14 md:hidden" />

      <div className="grid gap-14 md:grid-cols-[minmax(0,1fr)_20rem] md:gap-12 lg:grid-cols-[minmax(0,1fr)_23rem]">
        <div className="flex min-w-0 flex-col gap-14">
          {requests.length === 0 && (
            <Empty title={allowance ? "Send your first request" : "No requests yet"} action={newRequest}>
              {allowance
                ? "Tell us what you need next: a page, a fix, a shoot. Ask Craefto replies within a minute with an initial estimate, Obi confirms it, and you approve it before work starts."
                : "Requests open again when a plan is active."}
            </Empty>
          )}

          {waiting.length > 0 && (
            <Section title="Waiting on you">
              <RequestList requests={waiting} logged={logged} />
            </Section>
          )}

          {working.length > 0 && (
            <Section title="In progress">
              <div className="grid gap-3 sm:grid-cols-2">
                {working.map((request) => (
                  <WorkCard key={request.id} request={request} minutes={logged.get(request.id) ?? 0} />
                ))}
              </div>
            </Section>
          )}

          {(queue.length > 0 || estimating.length > 0) && (
            <Section
              title="Up next"
              action={
                <Link href="/portal/requests" className={`text-sm ${link}`}>
                  All requests
                </Link>
              }
            >
              {queue.length > 0 && <RequestList requests={queue.slice(0, 3)} logged={logged} numbered />}
              {queue.length > 3 && <p className="text-sm text-[hsl(var(--color-foreground-subtle))]">And {queue.length - 3} more in your queue.</p>}
              {estimating.length > 0 && <RequestList requests={estimating} logged={logged} />}
            </Section>
          )}

          {replies.length > 0 && (
            <Section title="Latest from Craefto">
              <ul className="flex flex-col gap-2">
                {replies.map((reply) => (
                  <li key={reply.id}>
                    <Link
                      href={reply.request_id ? `/portal/requests/${reply.request_id}` : "/portal/messages"}
                      className="group block rounded-2xl bg-[hsl(var(--color-accent-subtle))] px-5 py-4"
                    >
                      <span className="block text-sm text-[hsl(var(--color-foreground-subtle))]">
                        {reply.request_id ? `On “${titles.get(reply.request_id) ?? "a request"}”` : "In Messages"} · {sydneyDate(reply.created_at, true)}
                      </span>
                      {/* line-clamp sets its own display: no "block" here, or the clamp is lost. */}
                      <span className="mt-1.5 line-clamp-2 leading-relaxed text-[hsl(var(--color-foreground))] transition-colors group-hover:text-[hsl(var(--color-accent))]">
                        {reply.body}
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            </Section>
          )}
        </div>

        <aside className="flex flex-col gap-6">
          <HoursMeter usage={usage} className="hidden md:block" />
          <ComingUp events={upcoming} today={today} />
          <div className="rounded-3xl bg-[hsl(var(--color-background-subtle))] p-6">
            <p className="font-semibold tracking-tight">Talk to us</p>
            <p className="mt-1.5 text-sm leading-relaxed text-[hsl(var(--color-foreground-muted))]">Questions, ideas or feedback? Message the team, or book a call.</p>
            <div className="mt-2 flex flex-wrap gap-x-5">
              <Link href="/portal/messages" className={`text-sm ${link}`}>
                Send a message
              </Link>
              <Link href="/portal/calls" className={`text-sm ${link}`}>
                Book a call
              </Link>
            </div>
          </div>
          {shownPlans(member).map((subscription) => (
            <PlanSummary key={subscription.id} subscription={subscription}>
              <Link href="/portal/billing" className={`self-start text-sm ${link}`}>
                Billing and invoices
              </Link>
            </PlanSummary>
          ))}
        </aside>
      </div>
    </>
  );
}
