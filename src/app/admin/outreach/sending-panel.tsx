"use client";

import * as React from "react";
import Link from "next/link";
import { IconAlertTriangle } from "@/components/admin/icons";
import type { OutreachMessage, SendingMode, SendingSettings } from "@/lib/outreach/types";
import { api, formatWhen } from "./shared";

interface Status {
  settings: SendingSettings;
  sentToday: number;
  queued: number;
  testsSent: number;
  ready: { mailbox: boolean; optout: boolean };
}

const MODES: { id: SendingMode; label: string }[] = [
  { id: "off", label: "Off" },
  { id: "test", label: "Test" },
  { id: "live", label: "Live" },
];

const field =
  "w-full rounded-xl border border-[hsl(var(--color-border))] bg-[hsl(var(--color-background-muted))] px-3 py-2 text-sm text-[hsl(var(--color-foreground))] focus:outline-none focus:ring-2 focus:ring-[hsl(var(--color-accent))]/40";
const button = "inline-flex min-h-10 items-center justify-center rounded-xl px-4 py-2 text-sm font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-50";

const STATUS_TONE: Record<OutreachMessage["status"], string> = {
  sending: "text-[hsl(var(--color-warning))]",
  sent: "text-[hsl(var(--color-success))]",
  failed: "text-[hsl(var(--color-error))]",
  bounced: "text-[hsl(var(--color-error))]",
};

/** How the sender runs: off, test (to your inbox) or live, with today's numbers and its settings. */
export function SendingPanel({ onModeChange }: { onModeChange?: (mode: SendingMode) => void }) {
  const [status, setStatus] = React.useState<Status | null>(null);
  const [messages, setMessages] = React.useState<OutreachMessage[]>([]);
  const [error, setError] = React.useState("");
  const [busy, setBusy] = React.useState(false);
  const [confirmLive, setConfirmLive] = React.useState(false);
  const [editing, setEditing] = React.useState(false);
  const [form, setForm] = React.useState({ dailyCap: 12, windowStart: "09:00", windowEnd: "16:30", followUps: true, testRecipients: "" });

  const load = React.useCallback(async () => {
    const [next, recent] = await Promise.all([api<Status>("/api/admin/outreach/settings"), api<{ messages: OutreachMessage[] }>("/api/admin/outreach/messages?limit=8")]);
    setStatus(next);
    setMessages(recent.messages);
    onModeChange?.(next.settings.mode);
    return next;
  }, [onModeChange]);

  React.useEffect(() => {
    load().catch((reason: Error) => setError(reason.message));
  }, [load]);

  const save = async (patch: Record<string, unknown>) => {
    setBusy(true);
    setError("");
    try {
      const next = await api<Status>("/api/admin/outreach/settings", patch, "PUT");
      setStatus(next);
      onModeChange?.(next.settings.mode);
      return true;
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Couldn't save");
      return false;
    } finally {
      setBusy(false);
    }
  };

  if (!status) {
    return error ? <p className="text-sm text-[hsl(var(--color-error))]">{error}</p> : null;
  }
  const { settings } = status;
  const notReady = !status.ready.mailbox ? "The mailbox password isn't set (OUTREACH_MAILBOX_PASSWORD), so nothing can be sent yet." : !status.ready.optout ? "Opt-out links aren't set up (OUTREACH_OPTOUT_SECRET), so nothing can be sent yet." : "";
  const summary =
    settings.mode === "off"
      ? "Nothing is sent. Approved emails wait here."
      : settings.mode === "test"
        ? `Approved emails go only to ${settings.testRecipients.join(", ") || "your test address (add one in Settings)"}, any time of day. ${status.sentToday} test cop${status.sentToday === 1 ? "y" : "ies"} in the last 24 hours.`
        : `${status.sentToday} of ${settings.dailyCap} sent in the last 24 hours · ${status.queued} approved and waiting · ${settings.windowStart}–${settings.windowEnd} their time, weekdays${settings.nextSendAt && new Date(settings.nextSendAt) > new Date() ? ` · next no sooner than ${formatWhen(settings.nextSendAt)}` : ""}`;

  const openSettings = () => {
    setForm({ dailyCap: settings.dailyCap, windowStart: settings.windowStart, windowEnd: settings.windowEnd, followUps: settings.followUps, testRecipients: settings.testRecipients.join(", ") });
    setEditing(true);
  };

  return (
    <section aria-label="Sending" className="space-y-4 rounded-2xl border border-[hsl(var(--color-border))]/50 bg-[hsl(var(--color-background-subtle))]/50 p-4 sm:p-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="min-w-0">
          <h2 className="font-[family-name:var(--font-heading)] text-lg font-semibold text-[hsl(var(--color-foreground))]">Sending</h2>
          <p className="text-sm text-[hsl(var(--color-foreground-muted))]">{summary}</p>
        </div>
        <div className="flex rounded-xl bg-[hsl(var(--color-background-muted))] p-1" role="radiogroup" aria-label="Sending mode">
          {MODES.map((mode) => {
            const locked = mode.id === "live" && status.testsSent === 0;
            return (
              <button
                key={mode.id}
                type="button"
                role="radio"
                aria-checked={settings.mode === mode.id}
                disabled={busy || locked}
                title={locked ? "Send a test to your own inbox first" : undefined}
                onClick={() => (mode.id === "live" && settings.mode !== "live" ? setConfirmLive(true) : void save({ mode: mode.id }))}
                className={`min-h-10 rounded-lg px-4 text-sm font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-40 ${
                  settings.mode === mode.id
                    ? mode.id === "live"
                      ? "bg-[hsl(var(--color-accent))] text-black"
                      : "bg-[hsl(var(--color-background))] text-[hsl(var(--color-foreground))] shadow-sm"
                    : "text-[hsl(var(--color-foreground-muted))] hover:text-[hsl(var(--color-foreground))]"
                }`}
              >
                {mode.label}
              </button>
            );
          })}
        </div>
      </div>

      {confirmLive && (
        <div className="space-y-3 rounded-xl border border-[hsl(var(--color-accent))]/30 bg-[hsl(var(--color-background))] p-4 text-sm">
          <p className="text-[hsl(var(--color-foreground))]">
            Start sending to prospects? Up to {settings.dailyCap} a day, 3 to 10 minutes apart, {settings.windowStart}–{settings.windowEnd} in each recipient&apos;s time zone on weekdays. Each email is checked again just before it goes.
          </p>
          <div className="flex flex-wrap gap-2">
            <button type="button" disabled={busy} className={`${button} bg-[hsl(var(--color-accent))] text-black`} onClick={() => void save({ mode: "live" }).then((ok) => ok && setConfirmLive(false))}>
              Start sending
            </button>
            <button type="button" disabled={busy} className={`${button} border border-[hsl(var(--color-border))]`} onClick={() => setConfirmLive(false)}>
              Not yet
            </button>
          </div>
        </div>
      )}

      {(settings.pausedReason || notReady) && (
        <div className="flex flex-wrap items-start justify-between gap-3 rounded-xl border border-[hsl(var(--color-warning))]/30 bg-[hsl(var(--color-warning-subtle))] px-4 py-3 text-sm text-[hsl(var(--color-foreground))]">
          <p className="flex gap-2">
            <IconAlertTriangle size={18} className="mt-px shrink-0 text-[hsl(var(--color-warning))]" />
            <span>{settings.pausedReason ? `Paused: ${settings.pausedReason}` : notReady}</span>
          </p>
          {settings.pausedReason && (
            <button type="button" disabled={busy} className={`${button} border border-[hsl(var(--color-border))] bg-[hsl(var(--color-background))]`} onClick={() => void save({ resume: true })}>
              Resume
            </button>
          )}
        </div>
      )}

      {error && <p className="text-sm text-[hsl(var(--color-error))]">{error}</p>}

      {editing ? (
        <form
          className="grid gap-3 sm:grid-cols-2"
          onSubmit={(event) => {
            event.preventDefault();
            void save({
              dailyCap: Number(form.dailyCap),
              windowStart: form.windowStart,
              windowEnd: form.windowEnd,
              followUps: form.followUps,
              testRecipients: form.testRecipients.split(/[\s,]+/).filter(Boolean),
            }).then((ok) => ok && setEditing(false));
          }}
        >
          <label className="text-sm">
            <span className="mb-1 block text-[hsl(var(--color-foreground-subtle))]">Emails a day (the plan: 10 to 15, never more than 25)</span>
            <input className={field} type="number" min={1} max={25} value={form.dailyCap} onChange={(e) => setForm({ ...form, dailyCap: Number(e.target.value) })} />
          </label>
          <label className="text-sm">
            <span className="mb-1 block text-[hsl(var(--color-foreground-subtle))]">Test addresses (your own inboxes)</span>
            <input className={field} type="text" inputMode="email" placeholder="you@gmail.com" value={form.testRecipients} onChange={(e) => setForm({ ...form, testRecipients: e.target.value })} />
          </label>
          <label className="text-sm">
            <span className="mb-1 block text-[hsl(var(--color-foreground-subtle))]">From (their time)</span>
            <input className={field} type="time" value={form.windowStart} onChange={(e) => setForm({ ...form, windowStart: e.target.value })} />
          </label>
          <label className="text-sm">
            <span className="mb-1 block text-[hsl(var(--color-foreground-subtle))]">Until (their time)</span>
            <input className={field} type="time" value={form.windowEnd} onChange={(e) => setForm({ ...form, windowEnd: e.target.value })} />
          </label>
          <label className="flex items-center gap-2 text-sm text-[hsl(var(--color-foreground))] sm:col-span-2">
            <input type="checkbox" checked={form.followUps} onChange={(e) => setForm({ ...form, followUps: e.target.checked })} />
            One follow-up, a week later in the same thread, unless they&apos;ve replied
          </label>
          <div className="flex gap-2 sm:col-span-2">
            <button type="submit" disabled={busy} className={`${button} bg-[hsl(var(--color-accent))] text-black`}>
              Save
            </button>
            <button type="button" disabled={busy} className={`${button} border border-[hsl(var(--color-border))]`} onClick={() => setEditing(false)}>
              Cancel
            </button>
          </div>
        </form>
      ) : (
        <button type="button" className="text-sm font-medium text-[hsl(var(--color-accent))] hover:underline" onClick={openSettings}>
          Settings
        </button>
      )}

      {messages.length > 0 && (
        <div className="border-t border-[hsl(var(--color-border))]/40 pt-3">
          <p className="mb-2 text-xs font-semibold uppercase tracking-[0.12em] text-[hsl(var(--color-foreground-subtle))]">Latest</p>
          <ul className="space-y-1.5">
            {messages.map((message) => (
              <li key={message.id} className="flex flex-wrap items-baseline gap-x-2 text-sm">
                <span className="tabular-nums text-xs text-[hsl(var(--color-foreground-subtle))]">{formatWhen(message.sentAt ?? message.createdAt)}</span>
                <Link href={`/admin/outreach/${message.campaignId}/${message.prospectId}`} className="min-w-0 truncate text-[hsl(var(--color-foreground))] hover:underline">
                  {message.mode === "test" ? "Test: " : ""}
                  {message.kind === "follow-up" ? "Follow-up to " : ""}
                  {message.to}
                </Link>
                <span className={`text-xs font-medium ${STATUS_TONE[message.status]}`}>{message.status}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </section>
  );
}
