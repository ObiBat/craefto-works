import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { BackLink, Callout, Section } from "@/components/portal/blocks";
import { MessageForm } from "@/components/portal/forms";
import { PageTitle } from "@/components/portal/page-title";
import { RequestStatusPill } from "@/components/portal/status-pill";
import { FileList } from "@/components/portal/file-list";
import { Thread, portalFileHref, sydneyDate } from "@/components/portal/thread";
import { requireMember } from "@/lib/portal/session";
import { REQUEST_STATUSES, type ClientFile, type ClientMessage, type ClientRequest, type RequestStatus } from "@/lib/portal/types";
import { cn } from "@/lib/utils";

export const metadata: Metadata = { title: "Request" };

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** Received, in progress, delivered: done steps filled, the current one named by its actual status. */
function Progress({ status }: { status: RequestStatus }) {
  const steps: RequestStatus[] = ["received", "in_progress", "delivered"];
  const current = status === "needs_info" ? 1 : steps.indexOf(status);
  return (
    <ol aria-label="Progress" className="flex flex-wrap items-center gap-x-6 gap-y-3">
      {steps.map((step, index) => {
        const done = index <= current;
        const label = index === current ? REQUEST_STATUSES[status].label : REQUEST_STATUSES[step].label;
        return (
          <li key={step} aria-current={index === current ? "step" : undefined} className="flex items-center gap-2.5">
            <span
              aria-hidden="true"
              className={cn(
                "h-2.5 w-2.5 rounded-full",
                !done && "bg-[hsl(var(--color-background-muted))]",
                done && (status === "needs_info" && index === current ? "bg-[hsl(var(--color-warning))]" : "bg-[hsl(var(--color-accent))]")
              )}
            />
            <span
              className={cn(
                "text-sm",
                index === current ? "font-medium text-[hsl(var(--color-foreground))]" : "text-[hsl(var(--color-foreground-subtle))]"
              )}
            >
              {label}
            </span>
          </li>
        );
      })}
    </ol>
  );
}

export default async function RequestPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ sent?: string }>;
}) {
  const { id } = await params;
  if (!UUID.test(id)) notFound();
  const { account, db } = await requireMember();
  const [{ data: requestRow }, { data: messageRows }, { data: fileRows }] = await Promise.all([
    db.from("client_requests").select("*").eq("id", id).eq("account_id", account.id).maybeSingle(),
    db.from("client_messages").select("*").eq("account_id", account.id).eq("request_id", id).order("created_at"),
    db.from("client_files").select("*").eq("account_id", account.id).eq("request_id", id).order("created_at"),
  ]);
  if (!requestRow) notFound();
  const request = requestRow as ClientRequest;
  const messages = (messageRows ?? []) as ClientMessage[];
  const files = (fileRows ?? []) as ClientFile[];
  const briefFiles = files.filter((file) => !file.message_id);
  const sent = Boolean((await searchParams).sent);

  return (
    <div className="max-w-3xl">
      <BackLink href="/portal/requests">All requests</BackLink>
      <div className="mb-4 flex flex-wrap items-center gap-3">
        <RequestStatusPill status={request.status} />
        <span className="text-sm text-[hsl(var(--color-foreground-subtle))]">Sent {sydneyDate(request.created_at)}</span>
      </div>
      <PageTitle title={request.title} />

      <div className="mb-12 flex flex-col gap-6">
        <div className="flex flex-col gap-2">
          <Progress status={request.status} />
          <p className="text-sm text-[hsl(var(--color-foreground-subtle))]">
            We&apos;ll email you at {account.email} whenever this moves or we reply.
          </p>
        </div>
        {sent && (
          <Callout title="Request sent">
            We&apos;ve let the team know. Updates and replies will show up here, and we&apos;ll email you when anything changes.
          </Callout>
        )}
        {request.status === "needs_info" && (
          <Callout tone="attention" title="We need a little more from you">
            See the latest message below, and reply here when you can.
          </Callout>
        )}
      </div>

      <div className="flex flex-col gap-14">
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
          <Thread messages={messages} files={files} empty="No messages yet. Questions and updates about this request will appear here." />
          <div className="mt-4">
            <MessageForm requestId={request.id} placeholder="Add details, answer a question, or attach files…" />
          </div>
        </Section>
      </div>
    </div>
  );
}
