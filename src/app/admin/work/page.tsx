"use client";

import * as React from "react";
import Link from "next/link";
import { AdminLoader } from "@/components/admin/AdminLoader";
import { Card, EmptyState, PageContainer, PageHeader, Section, StatusBadge } from "@/components/admin/ui";
import { IconExternal } from "@/components/admin/icons";
import { REQUEST_STATUSES, isOpen } from "@/lib/portal/types";
import { linkLines, parseLinkLines } from "@/lib/portal/outcome";
import { minutesLabel, requestRef } from "@/lib/portal/work-rules";
import type { DraftView, PublishMode } from "@/lib/portal/work";
import { REQUEST_VARIANT, shortDate } from "../members/shared";
import { cn } from "@/lib/utils";

const field =
  "w-full px-4 py-2 bg-[hsl(var(--color-background-subtle))] border border-[hsl(var(--color-border))] rounded-xl text-[hsl(var(--color-foreground))] focus:outline-none focus:ring-2 focus:ring-[hsl(var(--color-accent))]/50";
const primary =
  "px-4 py-2 bg-[hsl(var(--color-accent))] text-white text-sm font-medium rounded-xl hover:bg-[hsl(var(--color-accent-hover))] transition-colors disabled:opacity-50";
const secondary =
  "px-3 py-1.5 text-sm font-medium rounded-xl bg-[hsl(var(--color-background-muted))] text-[hsl(var(--color-foreground))] hover:bg-[hsl(var(--color-accent-subtle))] transition-colors disabled:opacity-50";

async function api(url: string, method: string, body?: unknown) {
  const res = await fetch(url, { method, headers: { "Content-Type": "application/json" }, body: body === undefined ? undefined : JSON.stringify(body) });
  const data = await res.json().catch(() => null);
  if (!res.ok) throw new Error(data?.error ?? "That didn't save. Try again.");
  return data;
}

/** "japanoma-com/japanoma #201" */
const sourceLabel = (draft: DraftView) => draft.source_ref.replace(/^github:/, "").replace("#", " #");
const hoursOf = (minutes: number | null) => (minutes ? String(Number((minutes / 60).toFixed(2))) : "");

/** One merged pull request, drafted: edit what the client will read and the time, then publish it. */
function DraftCard({ draft, onChanged }: { draft: DraftView; onChanged: () => void }) {
  const [title, setTitle] = React.useState(draft.title);
  const [outcome, setOutcome] = React.useState(draft.outcome ?? "");
  const [links, setLinks] = React.useState(linkLines(draft.outcome_links));
  const [hours, setHours] = React.useState(hoursOf(draft.minutes));
  const [internal, setInternal] = React.useState(draft.internal);
  const [ref, setRef] = React.useState(draft.request ? requestRef(draft.request.id) : "");
  const [saving, setSaving] = React.useState(false);
  const [message, setMessage] = React.useState<string | null>(null);

  const minutes = hours.trim() === "" ? 0 : Math.round(Number(hours) * 60);
  const edits = {
    ...(title !== draft.title ? { title } : {}),
    ...(outcome !== (draft.outcome ?? "") ? { outcome } : {}),
    ...(links !== linkLines(draft.outcome_links) ? { outcome_links: parseLinkLines(links) } : {}),
    ...(minutes !== (draft.minutes ?? 0) ? { minutes: minutes || null } : {}),
    ...(internal !== draft.internal ? { internal } : {}),
    ...(ref !== (draft.request ? requestRef(draft.request.id) : "") ? { request_ref: ref } : {}),
  };
  const dirty = Object.keys(edits).length > 0;
  const deliverable = draft.request !== null && isOpen(draft.request) && !("request_ref" in edits);

  async function run(work: () => Promise<unknown>, done: string) {
    setSaving(true);
    setMessage(null);
    try {
      await work();
      setMessage(done);
      onChanged();
    } catch (error) {
      setMessage((error as Error).message);
    }
    setSaving(false);
  }

  const save = () => run(() => api(`/api/admin/work/${draft.id}`, "PATCH", edits), "Saved.");
  const publish = (mode: PublishMode) =>
    run(async () => {
      if (!(Number.isFinite(minutes) && minutes >= 0)) throw new Error("Give the time in hours, like 1.5.");
      if (dirty) await api(`/api/admin/work/${draft.id}`, "PATCH", edits);
      await api(`/api/admin/work/${draft.id}`, "PATCH", { action: "publish", mode, minutes });
    }, mode === "deliver" ? "Delivered, and the client has been emailed." : mode === "time" ? "Time logged." : "Published to their Past work.");

  return (
    <Card id={`draft-${draft.id}`} className="scroll-mt-24 space-y-4">
      <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
        <p className="text-sm font-semibold">{draft.client}</p>
        <p className="text-xs text-[hsl(var(--color-foreground-subtle))]">
          {draft.source_url ? (
            <a href={draft.source_url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 hover:text-[hsl(var(--color-foreground))]">
              {sourceLabel(draft)} <IconExternal size={12} />
            </a>
          ) : (
            sourceLabel(draft)
          )}{" "}
          · merged {shortDate(draft.merged_at, true)} · {draft.written_by === "assistant" ? "drafted by the AI" : draft.written_by === "craefto" ? "edited by you" : "the pull request's own words"}
        </p>
      </div>
      <label className="flex flex-col gap-1 text-xs text-[hsl(var(--color-foreground-muted))]">
        What they&apos;ll read as the title
        <input value={title} onChange={(event) => setTitle(event.target.value)} maxLength={200} className={cn(field, "py-1.5 text-sm font-medium")} />
      </label>
      <label className="flex flex-col gap-1 text-xs text-[hsl(var(--color-foreground-muted))]">
        Outcome: what it does and what it changes for them
        <textarea value={outcome} onChange={(event) => setOutcome(event.target.value)} rows={5} maxLength={4000} className={cn(field, "text-sm leading-relaxed")} />
      </label>
      <label className="flex flex-col gap-1 text-xs text-[hsl(var(--color-foreground-muted))]">
        Links, one a line: Label | https://…
        <textarea value={links} onChange={(event) => setLinks(event.target.value)} rows={2} className={cn(field, "font-mono text-xs")} />
      </label>
      <div className="grid gap-3 sm:grid-cols-[9rem_minmax(0,1fr)]">
        <label className="flex flex-col gap-1 text-xs text-[hsl(var(--color-foreground-muted))]">
          Time (hours)
          <input type="number" min="0" max="24" step="0.25" value={hours} onChange={(event) => setHours(event.target.value)} className={cn(field, "py-1.5 text-sm")} />
        </label>
        <label className="flex flex-col gap-1 text-xs text-[hsl(var(--color-foreground-muted))]">
          For their request (its reference, R- and 8 characters)
          <input value={ref} onChange={(event) => setRef(event.target.value)} placeholder="None" className={cn(field, "py-1.5 font-mono text-sm")} />
        </label>
      </div>
      <p className="text-xs text-[hsl(var(--color-foreground-subtle))]">
        {draft.suggested_minutes ? `Suggested ${minutesLabel(draft.suggested_minutes)}${draft.suggestion_note ? `: ${draft.suggestion_note}` : ""}. ` : "No time suggested. "}
        The time counts on the day it merged.
        {draft.request && (
          <>
            {" "}
            For{" "}
            <Link href={`/admin/members/${draft.account_id}#request-${draft.request.id}`} className="font-medium text-[hsl(var(--color-accent))] hover:underline">
              {draft.request.title}
            </Link>{" "}
            <StatusBadge variant={REQUEST_VARIANT[draft.request.status]}>{REQUEST_STATUSES[draft.request.status].label}</StatusBadge>
          </>
        )}
      </p>
      <label className="flex items-center gap-2 text-sm text-[hsl(var(--color-foreground-muted))]">
        <input type="checkbox" checked={internal} onChange={(event) => setInternal(event.target.checked)} />
        Housekeeping: nothing they&apos;d notice, so its time only
      </label>
      <div className="flex flex-wrap items-center gap-3">
        {deliverable ? (
          <button type="button" disabled={saving} onClick={() => publish("deliver")} className={primary}>
            Deliver their request{minutes ? ` · ${minutesLabel(minutes)}` : ""}
          </button>
        ) : (
          !internal && (
            <button type="button" disabled={saving} onClick={() => publish("past_work")} className={primary}>
              Publish to Past work{minutes ? ` · ${minutesLabel(minutes)}` : ""}
            </button>
          )
        )}
        <button type="button" disabled={saving || minutes <= 0} onClick={() => publish("time")} className={internal && !deliverable ? primary : secondary}>
          Time only{minutes ? ` · ${minutesLabel(minutes)}` : ""}
        </button>
        {internal && !deliverable && (
          <button type="button" disabled={saving} onClick={() => publish("past_work")} className={secondary}>
            Publish anyway
          </button>
        )}
        {dirty && (
          <button type="button" disabled={saving} onClick={save} className={secondary}>
            Save changes
          </button>
        )}
        <button type="button" disabled={saving} onClick={() => run(() => api(`/api/admin/work/${draft.id}`, "PATCH", { action: "dismiss" }), "Dismissed.")} className="text-sm text-[hsl(var(--color-foreground-muted))] hover:text-[hsl(var(--color-foreground))]">
          Dismiss
        </button>
        {message && <span className="text-sm text-[hsl(var(--color-foreground-muted))]">{message}</span>}
      </div>
      {deliverable && <p className="text-xs text-[hsl(var(--color-foreground-subtle))]">Delivering emails them, with the outcome, as delivering it on their page does.</p>}
    </Card>
  );
}

function outcomeLabel(draft: DraftView) {
  if (draft.status === "dismissed") return { text: "Dismissed", variant: "neutral" as const };
  const time = draft.published_minutes ? ` · ${minutesLabel(draft.published_minutes)}` : "";
  if (draft.published_mode === "deliver") return { text: `Delivered their request${time}`, variant: "success" as const };
  if (draft.published_mode === "time") return { text: `Time only${time}`, variant: "accent" as const };
  return { text: `Past work${time}`, variant: "success" as const };
}

function RecentRow({ draft, onChanged }: { draft: DraftView; onChanged: () => void }) {
  const [saving, setSaving] = React.useState(false);
  const [message, setMessage] = React.useState<string | null>(null);
  const label = outcomeLabel(draft);
  const undoable = draft.status === "dismissed" || draft.published_mode !== "deliver";

  async function undo() {
    setSaving(true);
    setMessage(null);
    try {
      await api(`/api/admin/work/${draft.id}`, "PATCH", { action: "undo" });
      onChanged();
    } catch (error) {
      setMessage((error as Error).message);
    }
    setSaving(false);
  }

  return (
    <li id={`draft-${draft.id}`} className="flex flex-col gap-1 py-3 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
      <div className="min-w-0">
        <p className="truncate text-sm font-medium">{draft.title}</p>
        <p className="text-xs text-[hsl(var(--color-foreground-subtle))]">
          {draft.client} · {sourceLabel(draft)} · {shortDate(draft.published_at ?? draft.updated_at)}
          {message && <span className="text-[hsl(var(--color-warning))]"> · {message}</span>}
        </p>
      </div>
      <div className="flex shrink-0 items-center gap-3">
        <StatusBadge variant={label.variant}>{label.text}</StatusBadge>
        {undoable && (
          <button type="button" disabled={saving} onClick={undo} className="text-sm text-[hsl(var(--color-foreground-muted))] hover:text-[hsl(var(--color-foreground))] disabled:opacity-50">
            Undo
          </button>
        )}
      </div>
    </li>
  );
}

/**
 * Shipped work: pull requests merged in clients' repositories, drafted for
 * their Past work and hours. Nothing reaches a client until it's published
 * here or from Telegram.
 */
export default function ShippedWorkPage() {
  const [data, setData] = React.useState<{ pending: DraftView[]; recent: DraftView[]; projects: number } | null>(null);
  const [failed, setFailed] = React.useState(false);

  const load = React.useCallback(() => {
    fetch("/api/admin/work", { cache: "no-store" })
      .then((res) => (res.ok ? res.json() : Promise.reject(res.status)))
      .then(setData)
      .catch(() => setFailed(true));
  }, []);
  React.useEffect(load, [load]);

  // A link from Telegram or Today (#draft-…): bring it into view once loaded.
  const loaded = data !== null;
  React.useEffect(() => {
    if (!loaded || !window.location.hash.startsWith("#draft-")) return;
    document.getElementById(window.location.hash.slice(1))?.scrollIntoView({ block: "start" });
  }, [loaded]);

  if (failed) return <EmptyState title="Shipped work didn't load" description="Refresh to try again." />;
  if (!data) return <AdminLoader message="Loading shipped work..." />;

  return (
    <PageContainer>
      <PageHeader
        eyebrow="Do the work"
        title="Shipped work"
        subtitle="Pull requests merged in clients' repositories, drafted for their Past work and hours. Nothing reaches a client until you publish it, here or in Telegram."
      />

      {data.projects === 0 && (
        <Card>
          <p className="text-sm text-[hsl(var(--color-foreground-muted))]">
            No repositories are connected yet. Connect a client&apos;s GitHub repository on their page, under Projects.
          </p>
        </Card>
      )}

      <Section title="Waiting to publish" description={data.pending.length ? `${data.pending.length} merged, newest first` : "Nothing waiting"}>
        {data.pending.length === 0 ? (
          <p className="text-sm text-[hsl(var(--color-foreground-subtle))]">When a pull request merges into a connected repository&apos;s main branch, it arrives here and on your phone.</p>
        ) : (
          <div className="space-y-4">
            {data.pending.map((draft) => (
              <DraftCard key={`${draft.id}:${draft.updated_at}`} draft={draft} onChanged={load} />
            ))}
          </div>
        )}
      </Section>

      {data.recent.length > 0 && (
        <Section title="The last month" description="Published and dismissed. Undo puts one back to wait, except a delivery, whose email has gone.">
          <Card padding="compact">
            <ul className="divide-y divide-[hsl(var(--color-border))]/50">
              {data.recent.map((draft) => (
                <RecentRow key={`${draft.id}:${draft.updated_at}`} draft={draft} onChanged={load} />
              ))}
            </ul>
          </Card>
        </Section>
      )}
    </PageContainer>
  );
}
