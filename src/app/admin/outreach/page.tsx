"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { AdminLoader } from "@/components/admin/AdminLoader";
import { EmptyState, FilterBar, FilterChip, PageHeader, SearchInput } from "@/components/admin/ui";
import { IconAlertTriangle, IconChevronRight, IconMessageSquare } from "@/components/admin/icons";
import type { ProspectSummary, SendingMode } from "@/lib/outreach/types";
import { SendingPanel } from "./sending-panel";
import { api, byPriority, PriorityBadge, StatusPill, TABS, tabFor } from "./shared";

interface Summary {
  campaigns: { id: string; name: string }[];
  prospects: ProspectSummary[];
  replies?: { open: number };
}

const EMPTY: Record<string, string> = {
  approve: "Nothing to approve. New drafts from the command centre appear here.",
  approved: "No approved emails waiting.",
  sent: "Nothing sent yet.",
  replies: "No replies yet.",
  closed: "Nothing closed yet.",
  researched: "No researched prospects without a draft.",
};

function OutreachQueue() {
  const router = useRouter();
  const params = useSearchParams();
  const tab = tabFor(params.get("tab"));
  const campaign = params.get("campaign") ?? "all";
  const [data, setData] = React.useState<Summary | null>(null);
  const [error, setError] = React.useState("");
  const [search, setSearch] = React.useState("");
  const [mode, setMode] = React.useState<SendingMode>("off");

  React.useEffect(() => {
    api<Summary>("/api/admin/outreach?view=summary")
      .then(setData)
      .catch((reason: Error) => setError(reason.message));
  }, []);

  const setParam = (key: string, value: string | null) => {
    const next = new URLSearchParams(params);
    if (value) next.set(key, value);
    else next.delete(key);
    router.replace(`/admin/outreach${next.size ? `?${next}` : ""}`, { scroll: false });
  };

  const inCampaign = React.useMemo(() => (data?.prospects ?? []).filter((p) => campaign === "all" || p.campaignId === campaign), [data, campaign]);
  const rows = React.useMemo(() => {
    const query = search.trim().toLowerCase();
    return inCampaign
      .filter((p) => tab.statuses.includes(p.status))
      .filter((p) => !query || [p.company, p.contact.value, p.segment, p.location ?? "", p.subject ?? ""].some((field) => field.toLowerCase().includes(query)))
      .sort(byPriority);
  }, [inCampaign, tab, search]);

  if (error) return <EmptyState title="Couldn't load outreach" description={error} />;
  if (!data) return <AdminLoader message="Loading outreach..." />;

  const count = (statuses: string[]) => inCampaign.filter((p) => statuses.includes(p.status)).length;
  const names = new Map(data.campaigns.map((c) => [c.id, c.name]));

  return (
    <div className="space-y-6">
      <PageHeader
        title="Outreach"
        subtitle={`${count(["drafted"])} to approve · ${count(["approved"])} approved · ${count(["sent", "replied", "meeting"])} in conversation`}
      />

      <Link
        href="/admin/outreach/replies"
        className="flex min-h-14 items-center gap-3 rounded-2xl border border-[hsl(var(--color-border))]/50 bg-[hsl(var(--color-background-subtle))]/50 px-4 py-3 transition-colors hover:bg-[hsl(var(--color-background-muted))]/50 sm:px-5"
      >
        <IconMessageSquare size={18} className="shrink-0 text-[hsl(var(--color-foreground-muted))]" />
        <span className="min-w-0 flex-1">
          <span className="block font-medium text-[hsl(var(--color-foreground))]">Replies</span>
          <span className="block text-sm text-[hsl(var(--color-foreground-muted))]">
            {data.replies?.open ? `${data.replies.open} need${data.replies.open === 1 ? "s" : ""} you` : "Nothing needs you"} · read from the inbox every 3 minutes
          </span>
        </span>
        {!!data.replies?.open && <span className="grid min-w-7 place-items-center rounded-full bg-[hsl(var(--color-accent))] px-2 py-0.5 text-xs font-semibold tabular-nums text-black">{data.replies.open}</span>}
        <IconChevronRight size={18} className="shrink-0 text-[hsl(var(--color-foreground-subtle))]" />
      </Link>

      <SendingPanel onModeChange={setMode} />

      <div className="space-y-3">
        <FilterBar>
          {TABS.map((t) => (
            <FilterChip key={t.id} active={t.id === tab.id} onClick={() => setParam("tab", t.id === TABS[0].id ? null : t.id)}>
              {t.label} <span className="ml-1 tabular-nums opacity-70">{count(t.statuses)}</span>
            </FilterChip>
          ))}
        </FilterBar>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <SearchInput value={search} onChange={setSearch} placeholder="Search companies, addresses, subjects..." />
          {data.campaigns.length > 1 && (
            <FilterBar className="pb-0">
              <FilterChip active={campaign === "all"} onClick={() => setParam("campaign", null)}>
                All campaigns
              </FilterChip>
              {data.campaigns.map((c) => (
                <FilterChip key={c.id} active={campaign === c.id} onClick={() => setParam("campaign", c.id)}>
                  {c.name}
                </FilterChip>
              ))}
            </FilterBar>
          )}
        </div>
      </div>

      {rows.length === 0 ? (
        <EmptyState title={search ? "No matches" : EMPTY[tab.id]} />
      ) : (
        <ul className="divide-y divide-[hsl(var(--color-border))]/40 overflow-hidden rounded-2xl border border-[hsl(var(--color-border))]/50 bg-[hsl(var(--color-background-subtle))]/50">
          {rows.map((p) => (
            <li key={`${p.campaignId}/${p.id}`}>
              <Link
                href={`/admin/outreach/${p.campaignId}/${p.id}${tab.id === TABS[0].id ? "" : `?tab=${tab.id}`}`}
                className="flex items-start gap-3 px-4 py-4 transition-colors hover:bg-[hsl(var(--color-background-muted))]/50 sm:px-5"
              >
                <PriorityBadge priority={p.priority} />
                <div className="min-w-0 flex-1">
                  <div className="flex items-start justify-between gap-3">
                    <p className="font-medium text-[hsl(var(--color-foreground))]">{p.company}</p>
                    {tab.statuses.length > 1 && <StatusPill status={p.status} />}
                  </div>
                  <p className="mt-0.5 truncate text-sm text-[hsl(var(--color-foreground-muted))]">
                    {p.contact.kind === "email" ? p.contact.value : p.contact.kind === "form" ? "Contact form" : "No contact route"}
                    {p.location ? ` · ${p.location}` : ""}
                  </p>
                  {p.subject && <p className="mt-1 truncate text-sm text-[hsl(var(--color-foreground))]">{p.subject}</p>}
                  <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-[hsl(var(--color-foreground-subtle))]">
                    {campaign === "all" && data.campaigns.length > 1 && <span>{names.get(p.campaignId)}</span>}
                    {p.status === "approved" && p.contact.kind === "form" && (
                      <span className="font-medium text-[hsl(var(--color-foreground-muted))]">Contact form: send by hand</span>
                    )}
                    {mode === "live" && p.status === "approved" && p.contact.kind === "email" && (
                      <span className="font-medium text-[hsl(var(--color-accent))]">Queued: sends in their working hours</span>
                    )}
                    {p.flags.length > 0 && (
                      <span className="inline-flex items-center gap-1 font-medium text-[hsl(var(--color-warning))]">
                        <IconAlertTriangle size={13} /> Read first
                      </span>
                    )}
                  </div>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export default function OutreachPage() {
  return (
    <React.Suspense fallback={<AdminLoader message="Loading outreach..." />}>
      <OutreachQueue />
    </React.Suspense>
  );
}
