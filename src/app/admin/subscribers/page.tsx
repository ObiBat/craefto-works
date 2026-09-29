"use client";

import * as React from "react";
import type { Subscriber } from "@/lib/journal-types";
import { AdminLoader } from "@/components/admin/AdminLoader";
import { Button } from "@/components/ui/button";
import { PageContainer, PageHeader, Card, StatCard, SearchInput, FilterBar, FilterChip } from "@/components/admin/ui";
import { IconDownload } from "@/components/admin/icons";

interface Stats {
  total: number;
  confirmed: number;
  pending: number;
  unsubscribed: number;
}

function getStatusColor(status: Subscriber["status"]) {
  const colors: Record<Subscriber["status"], string> = {
    confirmed: "bg-green-500/20 text-green-600 border-green-500/30",
    pending: "bg-yellow-500/20 text-yellow-600 border-yellow-500/30",
    unsubscribed: "bg-red-500/20 text-red-600 border-red-500/30",
  };
  return colors[status];
}

function formatDate(dateString: string) {
  return new Date(dateString).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function formatDateTime(dateString: string | null) {
  if (!dateString) return "—";
  return new Date(dateString).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

const STATUS_FILTERS: { value: string; label: string; activeClassName?: string }[] = [
  { value: "all", label: "All" },
  { value: "confirmed", label: "Confirmed", activeClassName: "bg-green-500/20 text-green-600 border-green-500/30" },
  { value: "pending", label: "Pending", activeClassName: "bg-yellow-500/20 text-yellow-600 border-yellow-500/30" },
  { value: "unsubscribed", label: "Unsubscribed", activeClassName: "bg-red-500/20 text-red-600 border-red-500/30" },
];

export default function SubscribersPage() {
  const [subscribers, setSubscribers] = React.useState<Subscriber[]>([]);
  const [stats, setStats] = React.useState<Stats>({ total: 0, confirmed: 0, pending: 0, unsubscribed: 0 });
  const [loading, setLoading] = React.useState(true);
  const [filter, setFilter] = React.useState<string>("all");
  const [search, setSearch] = React.useState("");

  React.useEffect(() => {
    async function fetchData() {
      try {
        const res = await fetch("/api/admin/subscribers");

        if (res.ok) {
          const data = await res.json();
          setSubscribers(data.subscribers || []);
          setStats(data.stats || { total: 0, confirmed: 0, pending: 0, unsubscribed: 0 });
        }
      } catch (error) {
        console.error("Failed to fetch subscribers:", error);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  const filteredSubscribers = React.useMemo(() => {
    return subscribers.filter((sub) => {
      const matchesFilter = filter === "all" || sub.status === filter;
      const matchesSearch =
        search === "" ||
        sub.email.toLowerCase().includes(search.toLowerCase());
      return matchesFilter && matchesSearch;
    });
  }, [subscribers, filter, search]);

  const handleExportCSV = () => {
    const headers = ["Email", "Status", "Source", "Subscribed", "Confirmed", "Unsubscribed"];
    const rows = filteredSubscribers.map((sub) => [
      sub.email,
      sub.status,
      sub.source || "",
      formatDate(sub.created_at),
      sub.confirmed_at ? formatDate(sub.confirmed_at) : "",
      sub.unsubscribed_at ? formatDate(sub.unsubscribed_at) : "",
    ]);

    const csvContent = [
      headers.join(","),
      ...rows.map((row) => row.map((cell) => `"${cell}"`).join(",")),
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `subscribers_${new Date().toISOString().split("T")[0]}.csv`;
    link.click();
  };

  if (loading) {
    return <AdminLoader message="Loading subscribers..." />;
  }

  return (
    <PageContainer>
      <PageHeader
        title="Subscribers"
        subtitle="Journal newsletter subscribers"
        actions={
          <Button variant="secondary" size="sm" onClick={handleExportCSV}>
            <IconDownload size={16} />
            Export CSV
          </Button>
        }
      />

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard label="Total" value={stats.total} />
        <StatCard label="Confirmed" value={stats.confirmed} accent="success" />
        <StatCard label="Pending" value={stats.pending} accent="warning" />
        <StatCard label="Unsubscribed" value={stats.unsubscribed} accent="error" />
      </div>

      <div className="space-y-4">
        {/* Filters */}
        <div className="flex flex-col sm:flex-row sm:items-center gap-3">
          <SearchInput value={search} onChange={setSearch} placeholder="Search by email..." />

          <FilterBar className="sm:mx-0 sm:px-0 sm:pb-0">
            {STATUS_FILTERS.map((option) => (
              <FilterChip
                key={option.value}
                active={filter === option.value}
                onClick={() => setFilter(option.value)}
                className={filter === option.value ? option.activeClassName : undefined}
              >
                {option.label}
              </FilterChip>
            ))}
          </FilterBar>
        </div>

        {/* Subscribers Table */}
        <Card padding="none" className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[640px]">
              <thead>
                <tr className="border-b border-[hsl(var(--color-border))]/30">
                  <th className="text-left px-6 py-3 text-xs font-semibold text-[hsl(var(--color-foreground-muted))]">Email</th>
                  <th className="text-left px-6 py-3 text-xs font-semibold text-[hsl(var(--color-foreground-muted))]">Status</th>
                  <th className="text-left px-6 py-3 text-xs font-semibold text-[hsl(var(--color-foreground-muted))]">Source</th>
                  <th className="text-left px-6 py-3 text-xs font-semibold text-[hsl(var(--color-foreground-muted))]">Subscribed</th>
                  <th className="text-left px-6 py-3 text-xs font-semibold text-[hsl(var(--color-foreground-muted))]">Confirmed</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[hsl(var(--color-border))]/30">
                {filteredSubscribers.length > 0 ? (
                  filteredSubscribers.map((subscriber) => (
                    <tr key={subscriber.id} className="hover:bg-[hsl(var(--color-background-muted))]/30 transition-colors">
                      <td className="px-6 py-3.5 text-sm">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-full bg-[hsl(var(--color-accent))]/20 flex items-center justify-center text-[hsl(var(--color-accent))] font-medium text-sm shrink-0">
                            {subscriber.email.charAt(0).toUpperCase()}
                          </div>
                          <span className="text-[hsl(var(--color-foreground))]">{subscriber.email}</span>
                        </div>
                      </td>
                      <td className="px-6 py-3.5 text-sm">
                        <span className={`px-2.5 py-1 rounded-full text-xs font-medium border ${getStatusColor(subscriber.status)}`}>
                          {subscriber.status.charAt(0).toUpperCase() + subscriber.status.slice(1)}
                        </span>
                      </td>
                      <td className="px-6 py-3.5 text-sm text-[hsl(var(--color-foreground-muted))]">
                        {subscriber.source?.replace(/_/g, " ") || "—"}
                      </td>
                      <td className="px-6 py-3.5 text-sm text-[hsl(var(--color-foreground-subtle))]">
                        {formatDate(subscriber.created_at)}
                      </td>
                      <td className="px-6 py-3.5 text-sm text-[hsl(var(--color-foreground-subtle))]">
                        {formatDateTime(subscriber.confirmed_at)}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={5} className="px-6 py-12 text-center text-sm text-[hsl(var(--color-foreground-subtle))]">
                      {search || filter !== "all" ? "No subscribers match your filters" : "No subscribers yet"}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </Card>

        {/* Footer with count */}
        {filteredSubscribers.length > 0 && (
          <p className="text-sm text-[hsl(var(--color-foreground-subtle))]">
            Showing {filteredSubscribers.length} of {stats.total} subscribers
          </p>
        )}
      </div>
    </PageContainer>
  );
}
