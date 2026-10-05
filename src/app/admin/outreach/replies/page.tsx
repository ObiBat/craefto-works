"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { AdminLoader } from "@/components/admin/AdminLoader";
import { EmptyState, FilterBar, FilterChip, PageHeader } from "@/components/admin/ui";
import { IconChevronLeft } from "@/components/admin/icons";
import { INSTANT_LABELS, type OutreachReply } from "@/lib/outreach/types";
import { api, formatWhen, ReplyBadge } from "../shared";

const VIEWS = [
  { id: "needs-you", label: "Needs you" },
  { id: "all", label: "All replies" },
  { id: "tests", label: "Tests" },
] as const;
type View = (typeof VIEWS)[number]["id"];

const needsYou = (reply: OutreachReply) => reply.mode === "live" && !reply.handledAt && INSTANT_LABELS.includes(reply.label);

const EMPTY: Record<View, string> = {
  "needs-you": "Nothing needs you. Replies that do arrive on your phone as well.",
  all: "No replies yet. They appear here within three minutes of arriving.",
  tests: "No test replies. Reply to a test copy from your own inbox to try it.",
};

function RepliesInbox() {
  const router = useRouter();
  const params = useSearchParams();
  const view: View = VIEWS.find((v) => v.id === params.get("view"))?.id ?? "needs-you";
  const [replies, setReplies] = React.useState<OutreachReply[] | null>(null);
  const [error, setError] = React.useState("");

  React.useEffect(() => {
    api<{ replies: OutreachReply[] }>("/api/admin/outreach/replies?limit=300")
      .then(({ replies: rows }) => setReplies(rows))
      .catch((reason: Error) => setError(reason.message));
  }, []);

  if (error) return <EmptyState title="Couldn't load replies" description={error} />;
  if (!replies) return <AdminLoader message="Loading replies..." />;

  const live = replies.filter((reply) => reply.mode === "live");
  const rows = view === "needs-you" ? replies.filter(needsYou) : view === "tests" ? replies.filter((reply) => reply.mode === "test") : live;
  const count = (id: View) => (id === "needs-you" ? replies.filter(needsYou).length : id === "tests" ? replies.length - live.length : live.length);

  return (
    <div className="space-y-6">
      <Link href="/admin/outreach" className="inline-flex min-h-11 items-center gap-1 rounded-xl pr-3 text-sm text-[hsl(var(--color-foreground-muted))] hover:text-[hsl(var(--color-foreground))]">
        <IconChevronLeft size={16} /> Outreach
      </Link>
      <PageHeader title="Replies" subtitle={`${count("needs-you")} need you · ${live.filter((reply) => !INSTANT_LABELS.includes(reply.label)).length} handled by themselves`} />

      <FilterBar>
        {VIEWS.map((v) => (
          <FilterChip key={v.id} active={v.id === view} onClick={() => router.replace(`/admin/outreach/replies${v.id === "needs-you" ? "" : `?view=${v.id}`}`, { scroll: false })}>
            {v.label} <span className="ml-1 tabular-nums opacity-70">{count(v.id)}</span>
          </FilterChip>
        ))}
      </FilterBar>

      {rows.length === 0 ? (
        <EmptyState title={EMPTY[view]} />
      ) : (
        <ul className="divide-y divide-[hsl(var(--color-border))]/40 overflow-hidden rounded-2xl border border-[hsl(var(--color-border))]/50 bg-[hsl(var(--color-background-subtle))]/50">
          {rows.map((reply) => (
            <li key={reply.id}>
              <Link href={`/admin/outreach/replies/${reply.id}`} className="block px-4 py-4 transition-colors hover:bg-[hsl(var(--color-background-muted))]/50 sm:px-5">
                <div className="flex items-start justify-between gap-3">
                  <p className="min-w-0 font-medium text-[hsl(var(--color-foreground))]">{reply.company ?? reply.prospectId}</p>
                  <ReplyBadge label={reply.label} />
                </div>
                <p className="mt-0.5 truncate text-sm text-[hsl(var(--color-foreground-muted))]">
                  {reply.fromName ? `${reply.fromName} · ` : ""}
                  {reply.fromAddress}
                </p>
                {reply.summary && <p className="mt-1 text-sm text-[hsl(var(--color-foreground))]">{reply.summary}</p>}
                <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-[hsl(var(--color-foreground-subtle))]">
                  <span className="tabular-nums">{formatWhen(reply.receivedAt)}</span>
                  {reply.mode === "test" && <span className="font-medium text-[hsl(var(--color-foreground-muted))]">Test</span>}
                  {reply.leadId ? <span className="font-medium text-[hsl(var(--color-success))]">Handed over</span> : reply.handledAt ? <span>Handled</span> : null}
                  {reply.suggestedReply && !reply.handledAt && <span>Answer drafted</span>}
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export default function OutreachRepliesPage() {
  return (
    <React.Suspense fallback={<AdminLoader message="Loading replies..." />}>
      <RepliesInbox />
    </React.Suspense>
  );
}
