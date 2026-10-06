"use client";

import * as React from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { AdminLoader } from "@/components/admin/AdminLoader";
import { Card, EmptyState, PageContainer, PageHeader, Section, StatusBadge } from "@/components/admin/ui";
import { IconArrowLeft, IconExternal, IconMail } from "@/components/admin/icons";
import {
  REQUEST_STATUSES,
  estimateLabel,
  isOpen,
  subscriptionLabel,
  type ClientFile,
  type ClientMessage,
  type ClientRequest,
  type ClientTimeEntry,
  type RequestStatus,
} from "@/lib/portal/types";
import { shortHours } from "@/lib/portal/hours";
import { AttachButton, DropOverlay, UploadList, useAttachments, useFileDrop, type PrepareUploads } from "@/components/portal/attachments";
import { FileList } from "@/components/portal/file-list";
import { RichText } from "@/components/assistant/rich-text";
import { callTime } from "@/lib/portal/call-times";
import type { MemberDetail } from "@/lib/portal/admin";
import { REQUEST_VARIANT, planName, planVariant, shortDate } from "../shared";
import { cn } from "@/lib/utils";

// "Estimate ready" is set by confirming an estimate (which emails the client), never picked here.
const STATUSES = (Object.keys(REQUEST_STATUSES) as RequestStatus[]).filter((status) => status !== "estimated");
const field =
  "w-full px-4 py-2 bg-[hsl(var(--color-background-subtle))] border border-[hsl(var(--color-border))] rounded-xl text-[hsl(var(--color-foreground))] focus:outline-none focus:ring-2 focus:ring-[hsl(var(--color-accent))]/50";
const primary =
  "px-4 py-2 bg-[hsl(var(--color-accent))] text-white text-sm font-medium rounded-xl hover:bg-[hsl(var(--color-accent-hover))] transition-colors disabled:opacity-50";
const adminFileHref = (file: ClientFile) => `/api/admin/members/files/${file.id}`;
const secondary =
  "px-3 py-1.5 text-sm font-medium rounded-xl bg-[hsl(var(--color-background-muted))] text-[hsl(var(--color-foreground))] hover:bg-[hsl(var(--color-accent-subtle))] transition-colors disabled:opacity-50";
const today = () => new Intl.DateTimeFormat("en-CA", { timeZone: "Australia/Sydney", year: "numeric", month: "2-digit", day: "2-digit" }).format(new Date());
const hours = (value: number) => (Number.isInteger(value) ? String(value) : value.toFixed(1));

async function api(url: string, method: string, body?: unknown) {
  const res = await fetch(url, { method, headers: { "Content-Type": "application/json" }, body: body === undefined ? undefined : JSON.stringify(body) });
  const data = await res.json().catch(() => null);
  if (!res.ok) throw new Error(data?.error ?? "That didn't save. Try again.");
  return data;
}

function Thread({ messages, files, client }: { messages: ClientMessage[]; files: ClientFile[]; client: string }) {
  if (messages.length === 0) return <p className="text-sm text-[hsl(var(--color-foreground-subtle))]">No messages yet.</p>;
  return (
    <ol className="space-y-2">
      {messages.map((message) => {
        const ours = message.author !== "client";
        return (
          <li
            key={message.id}
            className={cn(
              "rounded-xl px-4 py-3",
              ours ? "ml-8 bg-[hsl(var(--color-accent-subtle))]" : "mr-8 bg-[hsl(var(--color-background-muted))]/60"
            )}
          >
            <p className="mb-1 flex justify-between gap-4 text-xs text-[hsl(var(--color-foreground-subtle))]">
              <span className="font-medium">{message.author === "assistant" ? "Ask Craefto (AI)" : ours ? "Craefto" : client}</span>
              <time dateTime={message.created_at}>{shortDate(message.created_at, true)}</time>
            </p>
            {message.body &&
              (message.author === "assistant" ? (
                <div className="text-sm leading-relaxed text-[hsl(var(--color-foreground))]">
                  <RichText text={message.body} />
                </div>
              ) : (
                <p className="whitespace-pre-wrap text-sm leading-relaxed text-[hsl(var(--color-foreground))]">{message.body}</p>
              ))}
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

/** The estimate: Ask Craefto's first read to confirm, or Craefto's own, sent to the client for approval. */
function EstimatePanel({ memberId, request, onSaved }: { memberId: string; request: ClientRequest; onSaved: () => void }) {
  const [low, setLow] = React.useState(request.estimate_low != null ? String(request.estimate_low) : "");
  const [high, setHigh] = React.useState(request.estimate_high != null ? String(request.estimate_high) : "");
  const [note, setNote] = React.useState(request.estimate_note ?? "");
  const [target, setTarget] = React.useState(request.target_date ?? "");
  const [saving, setSaving] = React.useState(false);
  const [message, setMessage] = React.useState<string | null>(null);
  const label = estimateLabel(request);
  const closed = request.status === "delivered" || request.status === "withdrawn";
  const state =
    request.estimate_state === "initial"
      ? "Ask Craefto's initial estimate: confirm it or adjust it."
      : request.estimate_state === "confirmed"
        ? "Sent: waiting for the client to approve."
        : request.estimate_state === "approved"
          ? `Approved${request.approved_at ? ` ${shortDate(request.approved_at)}` : ""}.`
          : "No estimate yet.";

  async function send(event: React.FormEvent) {
    event.preventDefault();
    setSaving(true);
    setMessage(null);
    try {
      await api(`/api/admin/members/${memberId}/requests/${request.id}`, "PATCH", { estimate: { low: Number(low), high: Number(high), note, target_date: target || null } });
      setMessage(request.status === "in_progress" || request.status === "needs_info" ? "Saved." : "Sent. The client has been emailed to approve it.");
      onSaved();
    } catch (error) {
      setMessage((error as Error).message);
    }
    setSaving(false);
  }

  if (closed && !label) return null;
  return (
    <form onSubmit={send} className="space-y-3 rounded-xl bg-[hsl(var(--color-background-muted))]/40 p-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-sm font-semibold">Estimate {label && <span className="font-normal text-[hsl(var(--color-foreground-muted))]">· {label}</span>}</p>
        <p className="text-xs text-[hsl(var(--color-foreground-subtle))]">{state}</p>
      </div>
      {!closed && (
        <>
          <div className="flex flex-wrap items-end gap-3">
            <label className="flex flex-col gap-1 text-xs text-[hsl(var(--color-foreground-muted))]">
              Low (h)
              <input type="number" min="0.5" max="400" step="0.5" required value={low} onChange={(event) => setLow(event.target.value)} className={cn(field, "w-24 py-1.5 text-sm")} />
            </label>
            <label className="flex flex-col gap-1 text-xs text-[hsl(var(--color-foreground-muted))]">
              High (h)
              <input type="number" min="0.5" max="400" step="0.5" required value={high} onChange={(event) => setHigh(event.target.value)} className={cn(field, "w-24 py-1.5 text-sm")} />
            </label>
            <label className="flex flex-col gap-1 text-xs text-[hsl(var(--color-foreground-muted))]">
              Target date
              <input type="date" value={target} onChange={(event) => setTarget(event.target.value)} className={cn(field, "w-40 py-1.5 text-sm")} />
            </label>
          </div>
          <textarea
            value={note}
            onChange={(event) => setNote(event.target.value)}
            rows={2}
            maxLength={2000}
            placeholder="What it covers and assumes; one point per line or separated by semicolons."
            aria-label="What the estimate covers"
            className={cn(field, "text-sm")}
          />
          <div className="flex flex-wrap items-center gap-3">
            <button type="submit" disabled={saving || !low || !high} className={primary}>
              {saving
                ? "Saving…"
                : request.status === "in_progress" || request.status === "needs_info"
                  ? "Update estimate"
                  : request.estimate_state === "initial"
                    ? "Confirm and send to client"
                    : request.estimate_state === "confirmed"
                      ? "Send the changed estimate"
                      : request.estimate_state === "approved"
                        ? "Re-estimate (client approves again)"
                        : "Send estimate to client"}
            </button>
            {message && <span className="text-sm text-[hsl(var(--color-foreground-muted))]">{message}</span>}
          </div>
        </>
      )}
    </form>
  );
}

/** Time against a request (or the account generally): quick amounts, a note and the day; entries listed with a way to remove a mistake. */
function TimePanel({ memberId, requestId, entries, onSaved }: { memberId: string; requestId: string | null; entries: ClientTimeEntry[]; onSaved: () => void }) {
  const [minutes, setMinutes] = React.useState(60);
  const [custom, setCustom] = React.useState("");
  const [note, setNote] = React.useState("");
  const [day, setDay] = React.useState(today());
  const [saving, setSaving] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const total = entries.reduce((sum, entry) => sum + entry.minutes, 0) / 60;

  async function log(event: React.FormEvent) {
    event.preventDefault();
    const amount = custom ? Math.round(Number(custom) * 60) : minutes;
    setSaving(true);
    setError(null);
    try {
      await api(`/api/admin/members/${memberId}/time`, "POST", { request_id: requestId, minutes: amount, note, worked_on: day });
      setNote("");
      setCustom("");
      onSaved();
    } catch (failure) {
      setError((failure as Error).message);
    }
    setSaving(false);
  }

  async function remove(entry: ClientTimeEntry) {
    if (!window.confirm(`Remove ${shortHours(entry.minutes / 60)} on ${shortDate(`${entry.worked_on}T12:00:00+10:00`)}? The client sees the change.`)) return;
    try {
      await api(`/api/admin/members/${memberId}/time?entry=${entry.id}`, "DELETE");
      onSaved();
    } catch (failure) {
      setError((failure as Error).message);
    }
  }

  return (
    <div className="space-y-3 rounded-xl bg-[hsl(var(--color-background-muted))]/40 p-4">
      <div className="flex items-baseline justify-between gap-3">
        <p className="text-sm font-semibold">
          Time <span className="font-normal text-[hsl(var(--color-foreground-muted))]">· {shortHours(total)} logged</span>
        </p>
        <p className="text-xs text-[hsl(var(--color-foreground-subtle))]">The client sees each entry and its note.</p>
      </div>
      <form onSubmit={log} className="flex flex-wrap items-center gap-2">
        {[15, 30, 60, 120].map((amount) => (
          <button
            key={amount}
            type="button"
            onClick={() => {
              setMinutes(amount);
              setCustom("");
            }}
            className={cn(secondary, !custom && minutes === amount && "bg-[hsl(var(--color-accent))] text-white hover:bg-[hsl(var(--color-accent-hover))]")}
          >
            {amount < 60 ? `${amount}m` : `${amount / 60}h`}
          </button>
        ))}
        <input
          type="number"
          min="0.25"
          max="24"
          step="0.25"
          value={custom}
          onChange={(event) => setCustom(event.target.value)}
          placeholder="h"
          aria-label="Other amount, in hours"
          className={cn(field, "w-20 py-1.5 text-sm")}
        />
        <input value={note} onChange={(event) => setNote(event.target.value)} maxLength={500} placeholder="What was done (the client sees this)" aria-label="Note" className={cn(field, "min-w-[12rem] flex-1 py-1.5 text-sm")} />
        <input type="date" value={day} max={today()} onChange={(event) => setDay(event.target.value)} aria-label="Day worked" className={cn(field, "w-40 py-1.5 text-sm")} />
        <button type="submit" disabled={saving} className={primary}>
          {saving ? "Logging…" : "Log time"}
        </button>
      </form>
      {error && <p className="text-sm text-[hsl(var(--color-error))]">{error}</p>}
      {entries.length > 0 && (
        <ul className="space-y-1 text-sm">
          {entries.map((entry) => (
            <li key={entry.id} className="flex items-baseline gap-3">
              <span className="w-24 shrink-0 text-xs text-[hsl(var(--color-foreground-subtle))]">{shortDate(`${entry.worked_on}T12:00:00+10:00`)}</span>
              <span className="w-14 shrink-0 font-medium tabular-nums">{shortHours(entry.minutes / 60)}</span>
              <span className="min-w-0 flex-1 truncate text-[hsl(var(--color-foreground-muted))]">{entry.note}</span>
              <button type="button" onClick={() => remove(entry)} className="text-xs text-[hsl(var(--color-foreground-subtle))] hover:text-[hsl(var(--color-error))]">
                Remove
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function RequestCard({
  memberId,
  client,
  request,
  messages,
  files,
  entries,
  queueLength,
  onChanged,
  onSent,
}: {
  memberId: string;
  client: string;
  request: ClientRequest;
  messages: ClientMessage[];
  /** This request's files: its brief's, and those sent in its conversation. */
  files: ClientFile[];
  entries: ClientTimeEntry[];
  queueLength: number;
  onChanged: () => void;
  onSent: (message: ClientMessage, request: ClientRequest | null, files: ClientFile[]) => void;
}) {
  const [saving, setSaving] = React.useState(false);
  const [note, setNote] = React.useState<string | null>(null);
  const awaitingReply = messages.at(-1)?.author === "client";
  const queued = request.queue_position != null && isOpen(request);

  async function changeStatus(status: RequestStatus) {
    setSaving(true);
    setNote(null);
    try {
      await api(`/api/admin/members/${memberId}/requests/${request.id}`, "PATCH", { status });
      setNote(status === "received" ? "Saved." : "Saved. The client has been emailed.");
      onChanged();
    } catch (error) {
      setNote((error as Error).message);
    }
    setSaving(false);
  }

  async function move(direction: "up" | "down") {
    setSaving(true);
    try {
      await api(`/api/admin/members/${memberId}/requests/${request.id}`, "PATCH", { move: direction });
      onChanged();
    } catch (error) {
      setNote((error as Error).message);
    }
    setSaving(false);
  }

  return (
    <Card id={`request-${request.id}`} className="scroll-mt-24 space-y-5">
      <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
        <div className="flex min-w-0 gap-3">
          {queued && (
            <div className="flex shrink-0 flex-col items-center gap-0.5">
              <button type="button" aria-label="Move up the queue" disabled={saving || request.queue_position === 1} onClick={() => move("up")} className="text-[hsl(var(--color-foreground-subtle))] hover:text-[hsl(var(--color-foreground))] disabled:opacity-30">
                ▲
              </button>
              <span className="grid size-8 place-items-center rounded-full bg-[hsl(var(--color-background-muted))] font-mono text-sm">{request.queue_position}</span>
              <button type="button" aria-label="Move down the queue" disabled={saving || request.queue_position === queueLength} onClick={() => move("down")} className="text-[hsl(var(--color-foreground-subtle))] hover:text-[hsl(var(--color-foreground))] disabled:opacity-30">
                ▼
              </button>
            </div>
          )}
          <div className="min-w-0 space-y-1">
            <h3 className="font-[family-name:var(--font-heading)] text-lg font-semibold tracking-tight">{request.title}</h3>
            <p className="text-xs text-[hsl(var(--color-foreground-subtle))]">
              Sent {shortDate(request.created_at, true)} · updated {shortDate(request.updated_at, true)}
              {request.needed_by && ` · needed by ${shortDate(`${request.needed_by}T12:00:00+10:00`)}`}
            </p>
            <div className="flex flex-wrap gap-2 pt-1">
              <StatusBadge variant={REQUEST_VARIANT[request.status]}>{REQUEST_STATUSES[request.status].label}</StatusBadge>
              {request.estimate_state === "initial" && <StatusBadge variant="warning">Confirm the estimate</StatusBadge>}
              {awaitingReply && <StatusBadge variant="warning">Needs a reply</StatusBadge>}
            </div>
          </div>
        </div>
        <label className="flex shrink-0 items-center gap-2 text-sm text-[hsl(var(--color-foreground-muted))]">
          Status
          <select
            value={request.status === "estimated" ? "" : request.status}
            disabled={saving}
            aria-label="Status"
            onChange={(event) => changeStatus(event.target.value as RequestStatus)}
            className={cn(field, "w-auto py-1.5 text-sm")}
          >
            {request.status === "estimated" && <option value="">Estimate ready (waiting for them)</option>}
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
      <div className="grid gap-3 lg:grid-cols-2">
        <EstimatePanel key={`${request.id}:${request.updated_at}`} memberId={memberId} request={request} onSaved={onChanged} />
        <TimePanel memberId={memberId} requestId={request.id} entries={entries} onSaved={onChanged} />
      </div>
      <Thread messages={messages} files={files} client={client} />
      <ReplyForm memberId={memberId} request={request} onSent={onSent} />
    </Card>
  );
}

/** The client's month and their arrangement: hours set here for clients outside the Stripe plans. */
function HoursPanel({ member, onSaved }: { member: MemberDetail; onSaved: () => void }) {
  const { account, usage } = member;
  const [hoursValue, setHoursValue] = React.useState(account.monthly_hours != null ? String(account.monthly_hours) : "");
  const [engagement, setEngagement] = React.useState(account.engagement ?? "");
  const [zone, setZone] = React.useState(account.time_zone);
  const [weekly, setWeekly] = React.useState(account.weekly_email);
  const [saving, setSaving] = React.useState(false);
  const [message, setMessage] = React.useState<string | null>(null);
  const allowance = usage.allowance;

  async function save(event: React.FormEvent) {
    event.preventDefault();
    setSaving(true);
    setMessage(null);
    try {
      await api(`/api/admin/members/${account.id}`, "PATCH", { monthly_hours: hoursValue === "" ? null : Number(hoursValue), engagement, time_zone: zone, weekly_email: weekly });
      setMessage("Saved.");
      onSaved();
    } catch (error) {
      setMessage((error as Error).message);
    }
    setSaving(false);
  }

  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <Card className="space-y-3">
        <p className="text-sm font-semibold">This month</p>
        {allowance ? (
          <>
            {allowance.hours == null ? (
              <p className="text-3xl font-semibold tabular-nums">
                {shortHours(usage.used)} <span className="text-base font-normal text-[hsl(var(--color-foreground-muted))]">used · no hour limit · {allowance.label}</span>
              </p>
            ) : (
              <p className="text-3xl font-semibold tabular-nums">
                {hours(Math.round((allowance.hours - usage.used) * 2) / 2)} <span className="text-base font-normal text-[hsl(var(--color-foreground-muted))]">of {allowance.hours} h left · {allowance.label}</span>
              </p>
            )}
            <p className="text-sm text-[hsl(var(--color-foreground-muted))]">
              {shortHours(usage.used)} used · {usage.committedHigh > 0 ? `${hours(usage.committedLow)}–${hours(usage.committedHigh)} h approved in the queue` : "nothing approved in the queue"}
            </p>
          </>
        ) : (
          <p className="text-sm text-[hsl(var(--color-foreground-muted))]">No hours: no plan running and none set. They can&apos;t send requests until there are.</p>
        )}
        <TimePanel memberId={account.id} requestId={null} entries={member.entries.filter((entry) => !entry.request_id)} onSaved={onSaved} />
      </Card>
      <Card>
        <form onSubmit={save} className="space-y-3">
          <p className="text-sm font-semibold">Their arrangement</p>
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="flex flex-col gap-1 text-xs text-[hsl(var(--color-foreground-muted))]">
              Monthly hours (empty: the plan&apos;s)
              <input type="number" min="0.5" max="400" step="0.5" value={hoursValue} onChange={(event) => setHoursValue(event.target.value)} className={cn(field, "py-1.5 text-sm")} />
            </label>
            <label className="flex flex-col gap-1 text-xs text-[hsl(var(--color-foreground-muted))]">
              What it&apos;s called
              <input value={engagement} onChange={(event) => setEngagement(event.target.value)} maxLength={120} placeholder="JapanoMa monthly hours" className={cn(field, "py-1.5 text-sm")} />
            </label>
            <label className="flex flex-col gap-1 text-xs text-[hsl(var(--color-foreground-muted))]">
              Their time zone
              <input value={zone} onChange={(event) => setZone(event.target.value)} placeholder="Asia/Tokyo" className={cn(field, "py-1.5 text-sm")} />
            </label>
            <label className="flex items-center gap-2 self-end pb-2 text-sm text-[hsl(var(--color-foreground-muted))]">
              <input type="checkbox" checked={weekly} onChange={(event) => setWeekly(event.target.checked)} className="size-4 accent-[hsl(var(--color-accent))]" />
              Friday effort email
            </label>
          </div>
          <div className="flex items-center gap-3">
            <button type="submit" disabled={saving} className={primary}>
              {saving ? "Saving…" : "Save"}
            </button>
            {message && <span className="text-sm text-[hsl(var(--color-foreground-muted))]">{message}</span>}
          </div>
        </form>
      </Card>
    </div>
  );
}

/** Email the client a sign-in link to their portal, after a second press. */
function InviteButton({ memberId, email }: { memberId: string; email: string }) {
  const [stage, setStage] = React.useState<"idle" | "sure" | "sending" | "sent" | "failed">("idle");
  async function invite() {
    setStage("sending");
    try {
      await api(`/api/admin/members/${memberId}/invite`, "POST");
      setStage("sent");
    } catch {
      setStage("failed");
    }
  }
  const button = "inline-flex items-center gap-2 rounded-xl border border-[hsl(var(--color-border))] px-4 py-2 text-sm font-medium hover:bg-[hsl(var(--color-background-subtle))]";
  if (stage === "sent") return <span className="px-2 py-2 text-sm text-[hsl(var(--color-foreground-muted))]">Sign-in link sent to {email}</span>;
  if (stage === "sure" || stage === "sending")
    return (
      <span className="inline-flex items-center gap-2">
        <span className="text-sm text-[hsl(var(--color-foreground-muted))]">Email {email} a sign-in link?</span>
        <button type="button" onClick={invite} disabled={stage === "sending"} className={primary}>
          {stage === "sending" ? "Sending…" : "Send"}
        </button>
        <button type="button" onClick={() => setStage("idle")} className="text-sm text-[hsl(var(--color-foreground-muted))]">
          Cancel
        </button>
      </span>
    );
  return (
    <button type="button" onClick={() => setStage("sure")} className={button}>
      {stage === "failed" ? "Invite failed: try again" : "Invite to portal"}
    </button>
  );
}

/** One member: their hours, each request with its estimate, time and conversation, and the general conversation. */
export default function MemberPage() {
  const { id } = useParams<{ id: string }>();
  const [member, setMember] = React.useState<MemberDetail | null>(null);
  const [missing, setMissing] = React.useState(false);

  const load = React.useCallback(() => {
    fetch(`/api/admin/members/${id}`)
      .then((res) => (res.ok ? res.json() : Promise.reject(res.status)))
      .then(setMember)
      .catch(() => setMissing(true));
  }, [id]);
  React.useEffect(load, [load]);

  // Today links straight to a request (#request-…): bring it into view once the page has loaded.
  const loaded = member !== null;
  React.useEffect(() => {
    if (!loaded || !window.location.hash.startsWith("#request-")) return;
    document.getElementById(window.location.hash.slice(1))?.scrollIntoView({ block: "start" });
  }, [loaded]);

  const addMessage = React.useCallback(
    (message: ClientMessage, request: ClientRequest | null, files: ClientFile[]) => {
      setMember((current) => current && { ...current, messages: [...current.messages, message], files: [...current.files, ...files] });
      if (request) load();
    },
    [load]
  );

  if (missing) return <EmptyState title="Client not found" description="They may have been removed." />;
  if (!member) return <AdminLoader message="Loading client..." />;

  const { account, subscriptions, requests, messages, files, upcomingCalls, stripeUrl, entries } = member;
  const client = account.name || account.email;
  const byQueue = (a: ClientRequest, b: ClientRequest) => (a.queue_position ?? 999) - (b.queue_position ?? 999);
  const open = requests.filter(isOpen).sort(byQueue);
  const closed = requests.filter((request) => !isOpen(request));
  const queueLength = open.filter((request) => request.queue_position != null).length;
  const threadOf = (requestId: string | null) => messages.filter((message) => message.request_id === requestId);
  const card = (request: ClientRequest) => (
    <RequestCard
      key={request.id}
      memberId={account.id}
      client={client}
      request={request}
      messages={threadOf(request.id)}
      files={files.filter((file) => file.request_id === request.id)}
      entries={entries.filter((entry) => entry.request_id === request.id)}
      queueLength={queueLength}
      onChanged={load}
      onSent={addMessage}
    />
  );

  return (
    <PageContainer>
      <PageHeader
        breadcrumb={
          <Link href="/admin/members" className="inline-flex items-center gap-1.5 text-sm text-[hsl(var(--color-foreground-muted))] hover:text-[hsl(var(--color-foreground))]">
            <IconArrowLeft size={16} /> Clients
          </Link>
        }
        eyebrow={account.company ?? undefined}
        title={client}
        subtitle={`${account.email} · client since ${shortDate(account.created_at)}${account.time_zone !== "Australia/Sydney" ? ` · ${account.time_zone}` : ""}`}
        actions={
          <>
            <InviteButton memberId={account.id} email={account.email} />
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

      <Section title="Hours" description="Their studio time this month, and general time (calls, planning) not tied to one request.">
        <HoursPanel key={account.id + (account.monthly_hours ?? "") + account.time_zone} member={member} onSaved={load} />
      </Section>

      {subscriptions.length > 0 && (
        <Section title="Plans">
          <div className="flex flex-wrap gap-3">
            {subscriptions.map((subscription) => (
              <Card key={subscription.id} padding="compact" className="min-w-[14rem] space-y-2">
                <div className="flex items-center justify-between gap-3">
                  <span className="font-semibold">{planName(subscription.plan)}</span>
                  <StatusBadge variant={planVariant(subscription)}>{subscriptionLabel(subscription)}</StatusBadge>
                </div>
                {subscription.current_period_end && (
                  <p className="text-xs text-[hsl(var(--color-foreground-subtle))]">
                    {subscription.status === "canceled" ? "Ended" : subscription.cancel_at_period_end ? "Ends" : "Renews"} {shortDate(subscription.current_period_end)}
                  </p>
                )}
              </Card>
            ))}
          </div>
        </Section>
      )}

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

      <Section title="Requests" description={`${open.length} open, in queue order · ${closed.length} delivered or withdrawn`}>
        {requests.length === 0 ? (
          <p className="text-sm text-[hsl(var(--color-foreground-subtle))]">No requests yet.</p>
        ) : (
          <div className="space-y-4">
            {open.map(card)}
            {closed.length > 0 && (
              <details className="group space-y-4">
                <summary className="cursor-pointer text-sm font-medium text-[hsl(var(--color-foreground-muted))]">Delivered and withdrawn ({closed.length})</summary>
                <div className="space-y-4 pt-2">{closed.map(card)}</div>
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
