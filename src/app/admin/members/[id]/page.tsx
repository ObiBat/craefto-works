"use client";

import * as React from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { AdminLoader } from "@/components/admin/AdminLoader";
import { Card, EmptyState, PageContainer, PageHeader, Section, StatusBadge } from "@/components/admin/ui";
import { IconArrowLeft, IconExternal, IconMail } from "@/components/admin/icons";
import { REQUEST_STATUSES, subscriptionLabel, type ClientFile, type ClientMessage, type ClientRequest, type RequestStatus } from "@/lib/portal/types";
import { AttachButton, DropOverlay, UploadList, useAttachments, useFileDrop, type PrepareUploads } from "@/components/portal/attachments";
import { FileList } from "@/components/portal/file-list";
import { callTime } from "@/lib/portal/call-times";
import type { MemberDetail } from "@/lib/portal/admin";
import { REQUEST_VARIANT, planName, planVariant, shortDate } from "../shared";
import { cn } from "@/lib/utils";

const STATUSES = Object.keys(REQUEST_STATUSES) as RequestStatus[];
const field =
  "w-full px-4 py-2 bg-[hsl(var(--color-background-subtle))] border border-[hsl(var(--color-border))] rounded-xl text-[hsl(var(--color-foreground))] focus:outline-none focus:ring-2 focus:ring-[hsl(var(--color-accent))]/50";
const primary =
  "px-4 py-2 bg-[hsl(var(--color-accent))] text-white text-sm font-medium rounded-xl hover:bg-[hsl(var(--color-accent-hover))] transition-colors disabled:opacity-50";
const adminFileHref = (file: ClientFile) => `/api/admin/members/files/${file.id}`;

function Thread({ messages, files, client }: { messages: ClientMessage[]; files: ClientFile[]; client: string }) {
  if (messages.length === 0) return <p className="text-sm text-[hsl(var(--color-foreground-subtle))]">No messages yet.</p>;
  return (
    <ol className="space-y-2">
      {messages.map((message) => {
        const ours = message.author === "craefto";
        return (
          <li
            key={message.id}
            className={cn(
              "rounded-xl px-4 py-3",
              ours ? "ml-8 bg-[hsl(var(--color-accent-subtle))]" : "mr-8 bg-[hsl(var(--color-background-muted))]/60"
            )}
          >
            <p className="mb-1 flex justify-between gap-4 text-xs text-[hsl(var(--color-foreground-subtle))]">
              <span className="font-medium">{ours ? "Craefto" : client}</span>
              <time dateTime={message.created_at}>{shortDate(message.created_at, true)}</time>
            </p>
            {message.body && <p className="whitespace-pre-wrap text-sm leading-relaxed text-[hsl(var(--color-foreground))]">{message.body}</p>}
            <FileList files={files.filter((file) => file.message_id === message.id)} href={adminFileHref} className={message.body ? "mt-2" : undefined} />
          </li>
        );
      })}
    </ol>
  );
}

/** Reply as Craefto, with files if need be; on a request it can move the status in the same step (one email to the client). */
function ReplyForm({
  memberId,
  request,
  onSent,
}: {
  memberId: string;
  request?: ClientRequest;
  onSent: (message: ClientMessage, request: ClientRequest | null, files: ClientFile[]) => void;
}) {
  const [body, setBody] = React.useState("");
  const [status, setStatus] = React.useState<RequestStatus | "">("");
  const [sending, setSending] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const prepare = React.useCallback<PrepareUploads>(
    (files) =>
      fetch(`/api/admin/members/${memberId}/files`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ files }),
      }).then((res) => res.json()),
    [memberId]
  );
  const attachments = useAttachments(prepare);
  const { over, dropProps } = useFileDrop(attachments.add);

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setSending(true);
    setError(null);
    const res = await fetch(`/api/admin/members/${memberId}/messages`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ body, request_id: request?.id, status: status || undefined, files: attachments.ids }),
    });
    setSending(false);
    if (!res.ok) {
      setError((await res.json().catch(() => null))?.error ?? "Failed to send");
      return;
    }
    const data = await res.json();
    setBody("");
    setStatus("");
    attachments.clear();
    onSent(data.message, data.request, data.files ?? []);
  }

  return (
    <form onSubmit={submit} className="relative space-y-3" {...dropProps}>
      <DropOverlay over={over} />
      <textarea
        value={body}
        onChange={(event) => setBody(event.target.value)}
        rows={3}
        maxLength={10000}
        placeholder="Reply as Craefto. The client gets it by email and in their portal."
        aria-label="Reply"
        className={field}
      />
      <UploadList uploads={attachments.uploads} error={attachments.error} onRemove={attachments.remove} hint={false} />
      <div className="flex flex-wrap items-center justify-between gap-3">
        {request ? (
          <label className="flex items-center gap-2 text-sm text-[hsl(var(--color-foreground-muted))]">
            Then set status
            <select
              value={status}
              onChange={(event) => setStatus(event.target.value as RequestStatus | "")}
              aria-label="Status after sending"
              className={cn(field, "w-auto py-1.5 text-sm")}
            >
              <option value="">Keep: {REQUEST_STATUSES[request.status].label}</option>
              {STATUSES.filter((option) => option !== request.status).map((option) => (
                <option key={option} value={option}>
                  {REQUEST_STATUSES[option].label}
                </option>
              ))}
            </select>
          </label>
        ) : (
          <span />
        )}
        <div className="flex items-center gap-3">
          {error && <span className="text-sm text-[hsl(var(--color-error))]">{error}</span>}
          <AttachButton onFiles={attachments.add} label="Attach" />
          <button
            type="submit"
            disabled={sending || attachments.busy || (!body.trim() && attachments.ids.length === 0)}
            className={primary}
          >
            {sending ? "Sending…" : attachments.busy ? "Uploading…" : "Send reply"}
          </button>
        </div>
      </div>
    </form>
  );
}

function RequestCard({
  memberId,
  client,
  request,
  messages,
  files,
  onStatus,
  onSent,
}: {
  memberId: string;
  client: string;
  request: ClientRequest;
  messages: ClientMessage[];
  /** This request's files: its brief's, and those sent in its conversation. */
  files: ClientFile[];
  onStatus: (request: ClientRequest) => void;
  onSent: (message: ClientMessage, request: ClientRequest | null, files: ClientFile[]) => void;
}) {
  const [saving, setSaving] = React.useState(false);
  const [note, setNote] = React.useState<string | null>(null);
  const awaitingReply = messages.at(-1)?.author === "client";

  async function changeStatus(status: RequestStatus) {
    setSaving(true);
    setNote(null);
    const res = await fetch(`/api/admin/members/${memberId}/requests/${request.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    setSaving(false);
    if (!res.ok) {
      setNote("Couldn't save the status. Try again.");
      return;
    }
    onStatus(await res.json());
    setNote(status === "received" ? "Saved." : "Saved. The client has been emailed.");
  }

  return (
    <Card className="space-y-5">
      <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
        <div className="min-w-0 space-y-1">
          <h3 className="font-[family-name:var(--font-heading)] text-lg font-semibold tracking-tight">{request.title}</h3>
          <p className="text-xs text-[hsl(var(--color-foreground-subtle))]">
            Sent {shortDate(request.created_at, true)} · updated {shortDate(request.updated_at, true)}
          </p>
          <div className="flex flex-wrap gap-2 pt-1">
            <StatusBadge variant={REQUEST_VARIANT[request.status]}>{REQUEST_STATUSES[request.status].label}</StatusBadge>
            {awaitingReply && <StatusBadge variant="warning">Needs a reply</StatusBadge>}
          </div>
        </div>
        <label className="flex shrink-0 items-center gap-2 text-sm text-[hsl(var(--color-foreground-muted))]">
          Status
          <select
            value={request.status}
            disabled={saving}
            aria-label="Status"
            onChange={(event) => changeStatus(event.target.value as RequestStatus)}
            className={cn(field, "w-auto py-1.5 text-sm")}
          >
            {STATUSES.map((option) => (
              <option key={option} value={option}>
                {REQUEST_STATUSES[option].label}
              </option>
            ))}
          </select>
        </label>
      </div>
      {note && <p className="text-sm text-[hsl(var(--color-foreground-muted))]">{note}</p>}
      {request.details && (
        <p className="whitespace-pre-wrap rounded-xl bg-[hsl(var(--color-background-muted))]/40 px-4 py-3 text-sm leading-relaxed">{request.details}</p>
      )}
      <FileList files={files.filter((file) => !file.message_id)} href={adminFileHref} />
      <Thread messages={messages} files={files} client={client} />
      <ReplyForm memberId={memberId} request={request} onSent={onSent} />
    </Card>
  );
}

/** One member: their plans, each request with its conversation and status, and the general conversation. */
export default function MemberPage() {
  const { id } = useParams<{ id: string }>();
  const [member, setMember] = React.useState<MemberDetail | null>(null);
  const [missing, setMissing] = React.useState(false);

  React.useEffect(() => {
    fetch(`/api/admin/members/${id}`)
      .then((res) => (res.ok ? res.json() : Promise.reject(res.status)))
      .then(setMember)
      .catch(() => setMissing(true));
  }, [id]);

  const replaceRequest = React.useCallback((updated: ClientRequest) => {
    setMember((current) =>
      current && { ...current, requests: current.requests.map((request) => (request.id === updated.id ? updated : request)) }
    );
  }, []);
  const addMessage = React.useCallback(
    (message: ClientMessage, request: ClientRequest | null, files: ClientFile[]) => {
      setMember((current) => current && { ...current, messages: [...current.messages, message], files: [...current.files, ...files] });
      if (request) replaceRequest(request);
    },
    [replaceRequest]
  );

  if (missing) return <EmptyState title="Member not found" description="They may have been removed." />;
  if (!member) return <AdminLoader message="Loading member..." />;

  const { account, subscriptions, requests, messages, files, upcomingCalls, stripeUrl } = member;
  const client = account.name || account.email;
  const open = requests.filter((request) => request.status !== "delivered");
  const delivered = requests.filter((request) => request.status === "delivered");
  const threadOf = (requestId: string | null) => messages.filter((message) => message.request_id === requestId);
  const card = (request: ClientRequest) => (
    <RequestCard
      key={request.id}
      memberId={account.id}
      client={client}
      request={request}
      messages={threadOf(request.id)}
      files={files.filter((file) => file.request_id === request.id)}
      onStatus={replaceRequest}
      onSent={addMessage}
    />
  );

  return (
    <PageContainer>
      <PageHeader
        breadcrumb={
          <Link href="/admin/members" className="inline-flex items-center gap-1.5 text-sm text-[hsl(var(--color-foreground-muted))] hover:text-[hsl(var(--color-foreground))]">
            <IconArrowLeft size={16} /> Members
          </Link>
        }
        eyebrow={account.company ?? undefined}
        title={client}
        subtitle={`${account.email} · member since ${shortDate(account.created_at)}`}
        actions={
          <>
            <a href={`mailto:${account.email}`} className="inline-flex items-center gap-2 rounded-xl border border-[hsl(var(--color-border))] px-4 py-2 text-sm font-medium hover:bg-[hsl(var(--color-background-subtle))]">
              <IconMail size={16} /> Email
            </a>
            {stripeUrl && (
              <a href={stripeUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 rounded-xl border border-[hsl(var(--color-border))] px-4 py-2 text-sm font-medium hover:bg-[hsl(var(--color-background-subtle))]">
                Stripe <IconExternal size={14} />
              </a>
            )}
          </>
        }
      />

      <Section title="Plans">
        {subscriptions.length === 0 ? (
          <p className="text-sm text-[hsl(var(--color-foreground-subtle))]">No subscriptions.</p>
        ) : (
          <div className="flex flex-wrap gap-3">
            {subscriptions.map((subscription) => (
              <Card key={subscription.id} padding="compact" className="min-w-[14rem] space-y-2">
                <div className="flex items-center justify-between gap-3">
                  <span className="font-semibold">{planName(subscription.plan)}</span>
                  <StatusBadge variant={planVariant(subscription)}>{subscriptionLabel(subscription)}</StatusBadge>
                </div>
                {subscription.current_period_end && (
                  <p className="text-xs text-[hsl(var(--color-foreground-subtle))]">
                    {subscription.status === "canceled" ? "Ended" : subscription.cancel_at_period_end ? "Ends" : "Renews"}{" "}
                    {shortDate(subscription.current_period_end)}
                  </p>
                )}
              </Card>
            ))}
          </div>
        )}
      </Section>

      {upcomingCalls.length > 0 && (
        <Section title="Calls" description="Booked through Cal.com">
          <div className="flex flex-wrap gap-3">
            {upcomingCalls.map((call) => (
              <Card key={call.id} padding="compact" className="min-w-[16rem] space-y-1">
                <p className="text-sm font-semibold">{callTime(call)}</p>
                <p className="truncate text-xs text-[hsl(var(--color-foreground-subtle))]">{call.title}</p>
                {call.join_url && (
                  <a href={call.join_url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-xs font-medium text-[hsl(var(--color-accent))] hover:underline">
                    Join <IconExternal size={12} />
                  </a>
                )}
              </Card>
            ))}
          </div>
        </Section>
      )}

      <Section title="Requests" description={`${open.length} open · ${delivered.length} delivered`}>
        {requests.length === 0 ? (
          <p className="text-sm text-[hsl(var(--color-foreground-subtle))]">No requests yet.</p>
        ) : (
          <div className="space-y-4">
            {open.map(card)}
            {delivered.length > 0 && (
              <details className="group space-y-4">
                <summary className="cursor-pointer text-sm font-medium text-[hsl(var(--color-foreground-muted))]">
                  Delivered ({delivered.length})
                </summary>
                <div className="space-y-4 pt-2">{delivered.map(card)}</div>
              </details>
            )}
          </div>
        )}
      </Section>

      <Section title="Messages" description="The general conversation, outside any one request.">
        <Card className="space-y-5">
          <Thread messages={threadOf(null)} files={files.filter((file) => !file.request_id)} client={client} />
          <ReplyForm memberId={account.id} onSent={addMessage} />
        </Card>
      </Section>
    </PageContainer>
  );
}
