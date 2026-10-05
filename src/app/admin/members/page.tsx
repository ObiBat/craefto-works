"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
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
/** On a running plan, or on hours Craefto agreed directly. */
const isActive = (member: MemberSummary) => member.subscriptions.some(isLive) || member.account.monthly_hours != null;

function matches(member: MemberSummary, filter: Filter, query: string) {
  const live = isActive(member);
  if (filter === "attention" && !needsYou(member)) return false;
  if (filter === "active" && !live) return false;
  if (filter === "ended" && live) return false;
  const haystack = [member.account.name, member.account.email, member.account.company].join(" ").toLowerCase();
  return haystack.includes(query.trim().toLowerCase());
}

const field =
  "w-full px-3 py-2 bg-[hsl(var(--color-background-subtle))] border border-[hsl(var(--color-border))] rounded-xl text-sm text-[hsl(var(--color-foreground))] focus:outline-none focus:ring-2 focus:ring-[hsl(var(--color-accent))]/50";

/** A client Craefto works with directly (no plan bought online): their account and monthly hours. They're invited from their page. */
function AddClient({ onClose }: { onClose: () => void }) {
  const router = useRouter();
  const [saving, setSaving] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  async function add(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = Object.fromEntries(new FormData(event.currentTarget));
    setSaving(true);
    setError(null);
    const res = await fetch("/api/admin/members", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) });
    const data = await res.json().catch(() => null);
    setSaving(false);
    if (!res.ok) return setError(data?.error ?? "That didn't save.");
    router.push(`/admin/members/${data.id}`);
  }
  return (
    <form onSubmit={add} className="space-y-4 rounded-2xl border border-[hsl(var(--color-border))]/60 bg-[hsl(var(--color-background-subtle))]/60 p-5">
      <div>
        <p className="font-semibold">Add a client</p>
        <p className="text-sm text-[hsl(var(--color-foreground-muted))]">For clients you work with directly. Nothing is sent until you invite them from their page.</p>
      </div>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        <label className="flex flex-col gap-1 text-xs text-[hsl(var(--color-foreground-muted))]">
          Email
          <input name="email" type="email" required className={field} />
        </label>
        <label className="flex flex-col gap-1 text-xs text-[hsl(var(--color-foreground-muted))]">
          Name
          <input name="name" className={field} />
        </label>
        <label className="flex flex-col gap-1 text-xs text-[hsl(var(--color-foreground-muted))]">
          Company
          <input name="company" className={field} />
        </label>
        <label className="flex flex-col gap-1 text-xs text-[hsl(var(--color-foreground-muted))]">
          Monthly hours
          <input name="monthly_hours" type="number" min="0.5" max="400" step="0.5" required className={field} />
        </label>
        <label className="flex flex-col gap-1 text-xs text-[hsl(var(--color-foreground-muted))]">
          What it&apos;s called
          <input name="engagement" placeholder="JapanoMa monthly hours" className={field} />
        </label>
        <label className="flex flex-col gap-1 text-xs text-[hsl(var(--color-foreground-muted))]">
          Their time zone
          <input name="time_zone" defaultValue="Australia/Sydney" className={field} />
        </label>
      </div>
      {error && <p className="text-sm text-[hsl(var(--color-error))]">{error}</p>}
      <div className="flex items-center gap-3">
        <button type="submit" disabled={saving} className="rounded-xl bg-[hsl(var(--color-accent))] px-4 py-2 text-sm font-medium text-white hover:bg-[hsl(var(--color-accent-hover))] disabled:opacity-50">
          {saving ? "Adding…" : "Add client"}
        </button>
        <button type="button" onClick={onClose} className="text-sm text-[hsl(var(--color-foreground-muted))]">
          Cancel
        </button>
      </div>
    </form>
  );
}

/** Clients: who needs a reply, what's open, and what the plans bring in. */
export default function MembersPage() {
  // ?add=1 (the command palette's "Add a client") opens the form straight away.
  const [adding, setAdding] = React.useState(() => typeof window !== "undefined" && new URLSearchParams(window.location.search).has("add"));
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

  if (failed) return <EmptyState title="Clients didn't load" description="Refresh the page to try again." />;
  if (!data) return <AdminLoader message="Loading members..." />;

  const { members, monthly } = data;
  const shown = members.filter((member) => matches(member, filter, query));

  return (
    <PageContainer>
      <PageHeader
        title="Clients"
        subtitle="Everyone on a monthly plan or hours: their requests, estimates, time and messages, as they see them in the portal."
        actions={
          !adding && (
            <button type="button" onClick={() => setAdding(true)} className="rounded-xl bg-[hsl(var(--color-accent))] px-4 py-2 text-sm font-medium text-white hover:bg-[hsl(var(--color-accent-hover))]">
              Add client
            </button>
          )
        }
      />
      {adding && <AddClient onClose={() => setAdding(false)} />}

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard label="Active clients" value={members.filter(isActive).length} />
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
        <SearchInput value={query} onChange={setQuery} placeholder="Search name, email or company" label="Search clients" className="md:w-72" />
      </div>

      {shown.length === 0 ? (
        <EmptyState
          icon={<IconUsers size={48} />}
          title={members.length ? "No clients match" : "No clients yet"}
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
                    {member.account.monthly_hours != null && (
                      <StatusBadge variant="success">
                        {member.account.engagement || "Monthly hours"} · {member.account.monthly_hours} h/month
                      </StatusBadge>
                    )}
                    {member.awaitingReply && <StatusBadge variant="warning">Needs a reply</StatusBadge>}
                    {member.fresh > 0 && <StatusBadge variant="accent">{member.fresh} to estimate</StatusBadge>}
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
