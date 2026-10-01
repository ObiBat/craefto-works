import type { Metadata } from "next";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Callout, Empty, Section } from "@/components/portal/blocks";
import { PageTitle } from "@/components/portal/page-title";
import { PlanSummary } from "@/components/portal/plan-summary";
import { RequestList } from "@/components/portal/request-list";
import { sydneyDate } from "@/components/portal/thread";
import { planName } from "@/lib/portal/notify";
import { requireMember } from "@/lib/portal/session";
import { callTime } from "@/lib/portal/call-times";
import { isOwing, shownPlans, type ClientMeeting, type ClientMessage, type ClientRequest } from "@/lib/portal/types";
import { openBilling } from "./actions";

export const metadata: Metadata = { title: "Overview" };

const link = "inline-flex items-center font-medium text-[hsl(var(--color-accent))] hover:underline";

/** Where everything stands: what's waiting on the client, what's in progress, the latest replies and the plan. */
export default async function OverviewPage({ searchParams }: { searchParams: Promise<{ welcome?: string }> }) {
  const member = await requireMember();
  const { account, subscriptions, plans, db } = member;
  const welcome = Boolean((await searchParams).welcome);

  const [{ data: requestRows }, { data: replyRows }, { data: callRows }] = await Promise.all([
    db.from("client_requests").select("*").eq("account_id", account.id).order("updated_at", { ascending: false }),
    db
      .from("client_messages")
      .select("*")
      .eq("account_id", account.id)
      .eq("author", "craefto")
      .order("created_at", { ascending: false })
      .limit(3),
    db
      .from("client_meetings")
      .select("*")
      .eq("account_id", account.id)
      .eq("status", "booked")
      .gte("ends_at", new Date().toISOString())
      .order("starts_at")
      .limit(1),
  ]);
  const nextCall = (callRows?.[0] as ClientMeeting | undefined) ?? null;
  const requests = (requestRows ?? []) as ClientRequest[];
  const replies = (replyRows ?? []) as ClientMessage[];
  const waiting = requests.filter((request) => request.status === "needs_info");
  const open = requests.filter((request) => request.status === "received" || request.status === "in_progress");
  const delivered = requests.filter((request) => request.status === "delivered").length;
  const titles = new Map(requests.map((request) => [request.id, request.title]));

  const live = plans.length > 0;
  const firstName = account.name?.split(" ")[0];
  const names = plans.map((running) => planName(running.plan));
  const planLine = names.length > 1 ? `Your ${names.slice(0, -1).join(", ")} and ${names.at(-1)} plans are active.` : `Your ${names[0] ?? ""} plan is active.`;
  const tally = [
    open.length && `${open.length} in progress`,
    waiting.length && `${waiting.length} waiting on you`,
    delivered && `${delivered} delivered`,
  ].filter(Boolean);

  const newRequest = live && (
    <Button asChild size="lg">
      <Link href="/portal/requests/new">New request</Link>
    </Button>
  );

  return (
    <>
      <PageTitle
        eyebrow={account.company ?? "Overview"}
        title={welcome ? `Welcome${firstName ? `, ${firstName}` : ""}` : `Hi${firstName ? `, ${firstName}` : ""}`}
        actions={requests.length > 0 && newRequest}
      >
        {welcome ? (
          <p>
            {live && `${planLine} `}This is your portal: send requests, follow them through to delivery, message us and manage
            billing. To come back, sign in with your email; there&apos;s no password.
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
        {!live && subscriptions[0]?.status === "canceled" && (
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

      <div className="grid gap-14 md:grid-cols-[minmax(0,1fr)_20rem] md:gap-12 lg:grid-cols-[minmax(0,1fr)_22rem]">
        <div className="flex flex-col gap-14">
          {waiting.length > 0 && (
            <Section title="Waiting on you">
              <RequestList requests={waiting} />
            </Section>
          )}

          <Section
            title="In progress"
            action={
              requests.length > 0 && (
                <Link href="/portal/requests" className={`text-sm ${link}`}>
                  All requests
                </Link>
              )
            }
          >
            {open.length > 0 ? (
              <RequestList requests={open} />
            ) : requests.length > 0 ? (
              <p className="text-[hsl(var(--color-foreground-subtle))]">
                {waiting.length ? "Nothing else in progress." : "Nothing in progress right now."}
              </p>
            ) : (
              <Empty
                title={live ? "Send your first request" : "No requests yet"}
                action={
                  live && (
                    <Button asChild>
                      <Link href="/portal/requests/new">New request</Link>
                    </Button>
                  )
                }
              >
                {live
                  ? "Tell us what you need next: a page, a shoot, a fix. One request for each piece of work keeps everything easy to follow."
                  : "Requests open again when a plan is active."}
              </Empty>
            )}
          </Section>

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
                        {reply.request_id ? `On “${titles.get(reply.request_id) ?? "a request"}”` : "In Messages"} ·{" "}
                        {sydneyDate(reply.created_at, true)}
                      </span>
                      <span className="mt-1.5 line-clamp-2 block leading-relaxed text-[hsl(var(--color-foreground))] transition-colors group-hover:text-[hsl(var(--color-accent))]">
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
          {(shownPlans(member).length ? shownPlans(member) : [null]).map((subscription) => (
            <PlanSummary key={subscription?.id ?? "none"} subscription={subscription}>
              <Link href="/portal/billing" className={`self-start text-sm ${link}`}>
                Billing and invoices
              </Link>
            </PlanSummary>
          ))}
          <div className="rounded-3xl bg-[hsl(var(--color-background-subtle))] p-6">
            <p className="font-semibold tracking-tight">Talk to us</p>
            {nextCall ? (
              <p className="mt-1.5 text-sm leading-relaxed text-[hsl(var(--color-foreground-muted))]">
                Your next call: <span className="font-medium text-[hsl(var(--color-foreground))]">{callTime(nextCall)}</span>
              </p>
            ) : (
              <p className="mt-1.5 text-sm leading-relaxed text-[hsl(var(--color-foreground-muted))]">
                Questions, ideas or feedback? Message the team, or book a call.
              </p>
            )}
            <div className="mt-2 flex flex-wrap gap-x-5">
              <Link href="/portal/messages" className={`text-sm ${link}`}>
                Send a message
              </Link>
              <Link href="/portal/calls" className={`text-sm ${link}`}>
                {nextCall ? "Your calls" : "Book a call"}
              </Link>
            </div>
          </div>
        </aside>
      </div>
    </>
  );
}
