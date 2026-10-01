"use client";

import * as React from "react";
import Link from "next/link";
import { AdminLoader } from "@/components/admin/AdminLoader";
import { EmptyState, FilterBar, FilterChip, PageContainer, PageHeader, SearchInput, StatCard, StatusBadge } from "@/components/admin/ui";
import { IconChevronRight, IconUsers } from "@/components/admin/icons";
import { formatPrice } from "@/lib/pricing";
import { isLive, subscriptionLabel } from "@/lib/portal/types";
import type { MembersOverview, MemberSummary } from "@/lib/portal/admin";
import { planName, planVariant, shortDate } from "./shared";

type Filter = "all" | "attention" | "active" | "ended";

const FILTERS: Array<{ id: Filter; label: string }> = [
  { id: "all", label: "All" },
  { id: "attention", label: "Needs you" },
  { id: "active", label: "Active" },
  { id: "ended", label: "Ended" },
];

const needsYou = (member: MemberSummary) => member.awaitingReply || member.fresh > 0;

function matches(member: MemberSummary, filter: Filter, query: string) {
  const live = member.subscriptions.some(isLive);
  if (filter === "attention" && !needsYou(member)) return false;
  if (filter === "active" && !live) return false;
  if (filter === "ended" && live) return false;
  const haystack = [member.account.name, member.account.email, member.account.company].join(" ").toLowerCase();
  return haystack.includes(query.trim().toLowerCase());
}

/** Clients on monthly plans: who needs a reply, what's open, and what the plans bring in. */
export default function MembersPage() {
  const [data, setData] = React.useState<MembersOverview | null>(null);
  const [failed, setFailed] = React.useState(false);
  const [filter, setFilter] = React.useState<Filter>("all");
  const [query, setQuery] = React.useState("");

  React.useEffect(() => {
    fetch("/api/admin/members")
      .then((res) => (res.ok ? res.json() : Promise.reject(res.status)))
      .then(setData)
      .catch(() => setFailed(true));
  }, []);

  if (failed) return <EmptyState title="Members didn't load" description="Refresh the page to try again." />;
  if (!data) return <AdminLoader message="Loading members..." />;

  const { members, monthly } = data;
  const shown = members.filter((member) => matches(member, filter, query));

  return (
    <PageContainer>
      <PageHeader title="Members" subtitle="Clients on monthly plans: their requests, messages and billing." />

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard label="Active members" value={members.filter((member) => member.subscriptions.some(isLive)).length} />
        <StatCard label="Monthly revenue" value={formatPrice(monthly)} />
        <StatCard label="Open requests" value={members.reduce((sum, member) => sum + member.open, 0)} />
        <StatCard
          label="Need you"
          value={members.filter(needsYou).length}
          accent={members.some(needsYou) ? "warning" : undefined}
        />
      </div>

      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <FilterBar>
          {FILTERS.map(({ id, label }) => (
            <FilterChip key={id} active={filter === id} onClick={() => setFilter(id)}>
              {label}
            </FilterChip>
          ))}
        </FilterBar>
        <SearchInput value={query} onChange={setQuery} placeholder="Search name, email or company" label="Search members" className="md:w-72" />
      </div>

      {shown.length === 0 ? (
        <EmptyState
          icon={<IconUsers size={48} />}
          title={members.length ? "No members match" : "No members yet"}
          description={members.length ? "Try another filter or search." : "Clients appear here once they subscribe to a plan."}
        />
      ) : (
        <ul className="space-y-3">
          {shown.map((member) => (
            <li key={member.account.id}>
              <Link
                href={`/admin/members/${member.account.id}`}
                className="group flex items-center gap-4 rounded-2xl border border-[hsl(var(--color-border))]/50 bg-[hsl(var(--color-background-subtle))]/50 p-5 transition-colors hover:border-[hsl(var(--color-border-strong))]/60"
              >
                <div className="min-w-0 flex-1 space-y-2">
                  <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
                    <span className="font-semibold text-[hsl(var(--color-foreground))]">{member.account.name || member.account.email}</span>
                    {member.account.company && <span className="text-sm text-[hsl(var(--color-foreground-muted))]">{member.account.company}</span>}
                    <span className="text-sm text-[hsl(var(--color-foreground-subtle))]">{member.account.email}</span>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    {member.subscriptions
                      .filter((subscription, index) => isLive(subscription) || index === 0)
                      .map((subscription) => (
                        <StatusBadge key={subscription.id} variant={planVariant(subscription)}>
                          {planName(subscription.plan)} · {subscriptionLabel(subscription)}
                        </StatusBadge>
                      ))}
                    {member.awaitingReply && <StatusBadge variant="warning">Needs a reply</StatusBadge>}
                    {member.fresh > 0 && <StatusBadge variant="accent">{member.fresh} new</StatusBadge>}
                    {member.waiting > 0 && <StatusBadge variant="neutral">{member.waiting} waiting on them</StatusBadge>}
                    <span className="text-xs text-[hsl(var(--color-foreground-subtle))]">
                      {member.open} open · {member.delivered} delivered
                    </span>
                  </div>
                </div>
                <span className="hidden text-xs text-[hsl(var(--color-foreground-subtle))] sm:block">
                  {shortDate(member.lastActivity)}
                </span>
                <IconChevronRight size={18} className="text-[hsl(var(--color-foreground-subtle))] group-hover:text-[hsl(var(--color-foreground))]" />
              </Link>
            </li>
          ))}
        </ul>
      )}
    </PageContainer>
  );
}
