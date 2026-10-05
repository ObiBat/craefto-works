import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { AssistantPending } from "@/components/portal/assistant-pending";
import { BackLink, Callout, Section } from "@/components/portal/blocks";
import { EstimateCard } from "@/components/portal/estimate-card";
import { MessageForm } from "@/components/portal/forms";
import { PageTitle } from "@/components/portal/page-title";
import { RequestHistory } from "@/components/portal/request-history";
import { RequestStatusPill } from "@/components/portal/status-pill";
import { FileList } from "@/components/portal/file-list";
import { Thread, portalFileHref, sydneyDate } from "@/components/portal/thread";
import { requireMember } from "@/lib/portal/session";
import type { ClientFile, ClientMessage, ClientRequest, ClientRequestEvent, ClientTimeEntry, RequestStatus } from "@/lib/portal/types";
import { cn } from "@/lib/utils";

export const metadata: Metadata = { title: "Request" };

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const STEPS = ["Sent", "Estimate", "Approved", "In progress", "Delivered"];

/** Where a status sits on the way, and what the current step is called (and whether it waits on the client). */
function stepOf(status: RequestStatus): { index: number; label: string; attention?: boolean } {
  switch (status) {
    case "received":
      return { index: 1, label: "Estimating" };
    case "estimated":
      return { index: 1, label: "Estimate ready", attention: true };
    case "queued":
      return { index: 2, label: "Approved, queued" };
    case "in_progress":
      return { index: 3, label: "In progress" };
    case "needs_info":
      return { index: 3, label: "Needs your input", attention: true };
    case "delivered":
      return { index: 4, label: "Delivered" };
    case "withdrawn":
      return { index: -1, label: "Withdrawn" };
  }
}

/** Sent, estimate, approved, in progress, delivered: done steps filled, the current one named for where it really is. */
function Progress({ status }: { status: RequestStatus }) {
  const step = stepOf(status);
  if (step.index < 0) return null;
  return (
    <ol aria-label="Progress" className="grid grid-cols-5 gap-2">
      {STEPS.map((name, index) => {
        const done = index < step.index || (index === step.index && status === "delivered");
        const current = index === step.index;
        return (
          <li key={name} aria-current={current ? "step" : undefined} className="flex flex-col gap-2">
            <span
              aria-hidden="true"
              className={cn(
                "h-1.5 rounded-full",
                done && "bg-[hsl(var(--color-accent))]",
                current && !done && (step.attention ? "bg-[hsl(var(--color-warning))]" : "portal-step-current"),
                !done && !current && "bg-[hsl(var(--color-background-muted))]"
              )}
            />
            <span
              className={cn(
                "text-xs leading-snug sm:text-sm",
                current ? "font-medium text-[hsl(var(--color-foreground))]" : done ? "text-[hsl(var(--color-foreground-muted))]" : "text-[hsl(var(--color-foreground-subtle))]"
              )}
            >
              {current ? step.label : name}
            </span>
          </li>
        );
      })}
    </ol>
  );
}

const day = (date: string) => new Date(`${date}T12:00:00Z`).toLocaleDateString("en-AU", { weekday: "short", day: "numeric", month: "short", timeZone: "UTC" });

export default async function RequestPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ sent?: string; approved?: string }>;
}) {
  const { id } = await params;
  if (!UUID.test(id)) notFound();
  const { account, db } = await requireMember();
  const [{ data: requestRow }, { data: messageRows }, { data: fileRows }, { data: eventRows }, { data: entryRows }] = await Promise.all([
    db.from("client_requests").select("*").eq("id", id).eq("account_id", account.id).maybeSingle(),
    db.from("client_messages").select("*").eq("account_id", account.id).eq("request_id", id).order("created_at"),
    db.from("client_files").select("*").eq("account_id", account.id).eq("request_id", id).order("created_at"),
    db.from("client_request_events").select("*").eq("request_id", id).order("created_at"),
    db.from("client_time_entries").select("*").eq("request_id", id).order("worked_on"),
  ]);
  if (!requestRow) notFound();
  const request = requestRow as ClientRequest;
  const messages = (messageRows ?? []) as ClientMessage[];
  const files = (fileRows ?? []) as ClientFile[];
  const events = (eventRows ?? []) as ClientRequestEvent[];
  const entries = (entryRows ?? []) as ClientTimeEntry[];
  const briefFiles = files.filter((file) => !file.message_id);
  const { sent, approved } = await searchParams;
  const loggedMinutes = entries.reduce((total, entry) => total + entry.minutes, 0);
  const replied = messages.some((message) => message.author === "assistant");
  // A new request's reply is a few seconds behind the page; an old one without a reply isn't coming.
  const awaitingReply = !replied && new Date().getTime() - new Date(request.created_at).getTime() < 3 * 60_000;
  const open = request.status !== "delivered" && request.status !== "withdrawn";

  return (
    <div className="max-w-6xl">
      <BackLink href="/portal/requests">All requests</BackLink>
      <div className="mb-4 flex flex-wrap items-center gap-x-4 gap-y-2">
        <RequestStatusPill status={request.status} />
        {open && request.queue_position != null && (
          <span className="text-sm font-medium text-[hsl(var(--color-foreground))]">#{request.queue_position} in your queue</span>
        )}
        <span className="text-sm text-[hsl(var(--color-foreground-subtle))]">Sent {sydneyDate(request.created_at)}</span>
        {open && request.needed_by && <span className="text-sm text-[hsl(var(--color-foreground-subtle))]">Needed by {day(request.needed_by)}</span>}
      </div>
      <PageTitle title={request.title} />

      <div className="mb-12 flex flex-col gap-6">
        <Progress status={request.status} />
        {sent && (
          <Callout title="Request sent">
            Ask Craefto replies below with an initial estimate in a moment. Obi then confirms it, you approve it, and it joins your queue. We&apos;ll email
            you at {account.email} as it moves.
          </Callout>
        )}
        {approved && request.status === "queued" && (
          <Callout title={`Approved: #${request.queue_position ?? ""} in your queue`}>
            Obi has been told. You&apos;ll see the time logged against it here as the work goes on.
          </Callout>
        )}
        {request.status === "needs_info" && (
          <Callout tone="attention" title="We need a little more from you">
            See the latest message below, and reply here when you can.
          </Callout>
        )}
      </div>

      <div className="grid gap-14 lg:grid-cols-[minmax(0,1fr)_24rem] lg:gap-12">
        <div className="flex min-w-0 flex-col gap-14">
          <Section title="What you asked for">
            {request.details ? (
              <p className="whitespace-pre-wrap leading-relaxed text-[hsl(var(--color-foreground))]">{request.details}</p>
            ) : (
              briefFiles.length === 0 && <p className="text-[hsl(var(--color-foreground-subtle))]">No details added. Add anything useful below.</p>
            )}
            {briefFiles.length > 0 && (
              <div className="rounded-2xl bg-[hsl(var(--color-background-subtle))] p-3">
                <FileList files={briefFiles} href={portalFileHref} />
              </div>
            )}
          </Section>

          <Section title="Conversation">
            <Thread messages={messages} files={files} empty={awaitingReply ? "" : "No messages yet. Questions and updates about this request will appear here."} />
            {awaitingReply && <AssistantPending />}
            <div id="message" className="mt-4 scroll-mt-28">
              <MessageForm requestId={request.id} placeholder="Add details, answer a question, or attach files…" />
            </div>
          </Section>
        </div>

        <aside className="flex flex-col gap-10 lg:sticky lg:top-36 lg:self-start">
          <EstimateCard request={request} loggedMinutes={loggedMinutes} />
          {(events.length > 0 || entries.length > 0) && (
            <Section title="History">
              <RequestHistory events={events} entries={entries} />
            </Section>
          )}
        </aside>
      </div>
    </div>
  );
}
