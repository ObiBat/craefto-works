"use client";

import * as React from "react";
import Link from "next/link";
import { AdminLoader } from "@/components/admin/AdminLoader";
import { PageHeader, SearchInput, FilterBar, FilterChip } from "@/components/admin/ui";
import { IconStarFilled } from "@/components/admin/icons";

interface Application {
  id: string;
  full_name: string;
  email: string;
  role_slug: string;
  role_title: string;
  status: string;
  rating: number | null;
  created_at: string;
}

const STATUS_OPTIONS = [
  { value: "all", label: "All" },
  { value: "new", label: "New" },
  { value: "reviewing", label: "Reviewing" },
  { value: "shortlisted", label: "Shortlisted" },
  { value: "interview", label: "Interview" },
  { value: "offer", label: "Offer" },
  { value: "rejected", label: "Rejected" },
  { value: "hired", label: "Hired" },
  { value: "archived", label: "Archived" },
];

const ROLE_OPTIONS = [
  { value: "all", label: "All Roles" },
  { value: "marketing-manager", label: "Marketing Manager" },
];

function getStatusStyle(status: string) {
  const styles: Record<string, string> = {
    new: "bg-blue-500/20 text-blue-400 border-blue-500/30",
    reviewing: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30",
    shortlisted: "bg-purple-500/20 text-purple-400 border-purple-500/30",
    interview: "bg-orange-500/20 text-orange-400 border-orange-500/30",
    offer: "bg-green-500/20 text-green-400 border-green-500/30",
    rejected: "bg-red-500/20 text-red-400 border-red-500/30",
    hired: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30",
    archived: "bg-gray-500/20 text-gray-400 border-gray-500/30",
  };
  return styles[status] || styles.new;
}

function formatDate(dateString: string) {
  return new Date(dateString).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function RatingStars({ rating }: { rating: number | null }) {
  if (!rating) return <span className="text-[hsl(var(--color-foreground-subtle))]">--</span>;
  return (
    <span className="flex items-center gap-0.5">
      {Array.from({ length: 5 }, (_, i) => (
        <IconStarFilled
          key={i}
          size={14}
          className={i < rating ? "text-amber-400" : "text-[hsl(var(--color-border))]"}
        />
      ))}
    </span>
  );
}

export default function ApplicationsPage() {
  const [applications, setApplications] = React.useState<Application[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [statusFilter, setStatusFilter] = React.useState("all");
  const [roleFilter, setRoleFilter] = React.useState("all");
  const [search, setSearch] = React.useState("");

  React.useEffect(() => {
    async function fetchData() {
      try {
        const res = await fetch("/api/admin/applications");
        if (res.ok) {
          const data = await res.json();
          setApplications(data.applications || []);
        }
      } catch {
        // silently fail
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  const filtered = React.useMemo(() => {
    return applications.filter((app) => {
      const matchesStatus =
        statusFilter === "all" || app.status === statusFilter;
      const matchesRole = roleFilter === "all" || app.role_slug === roleFilter;
      const matchesSearch =
        search === "" ||
        app.full_name.toLowerCase().includes(search.toLowerCase()) ||
        app.email.toLowerCase().includes(search.toLowerCase());
      return matchesStatus && matchesRole && matchesSearch;
    });
  }, [applications, statusFilter, roleFilter, search]);

  const statusCounts = React.useMemo(() => {
    const counts: Record<string, number> = {};
    for (const app of applications) {
      counts[app.status] = (counts[app.status] || 0) + 1;
    }
    return counts;
  }, [applications]);

  if (loading) {
    return <AdminLoader message="Loading applications..." />;
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Applications"
        subtitle={`${applications.length} total application${applications.length !== 1 ? "s" : ""}`}
      />

      {/* Status count badges */}
      <div className="flex flex-wrap gap-2">
        {STATUS_OPTIONS.filter((s) => s.value !== "all").map((s) => {
          const count = statusCounts[s.value] || 0;
          if (count === 0) return null;
          return (
            <span
              key={s.value}
              className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium border ${getStatusStyle(s.value)}`}
            >
              {s.label}
              <span className="opacity-70">{count}</span>
            </span>
          );
        })}
      </div>

      {/* Filters */}
      <div className="flex flex-col gap-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
          <SearchInput
            value={search}
            onChange={setSearch}
            placeholder="Search by name or email..."
          />
          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className="px-3 py-2.5 bg-[hsl(var(--color-background-muted))] border border-[hsl(var(--color-border))] rounded-xl text-sm text-[hsl(var(--color-foreground))] focus:outline-none focus:ring-2 focus:ring-[hsl(var(--color-accent))]/40"
          >
            {ROLE_OPTIONS.map((r) => (
              <option key={r.value} value={r.value}>{r.label}</option>
            ))}
          </select>
        </div>
        <FilterBar>
          {STATUS_OPTIONS.map((s) => (
            <FilterChip
              key={s.value}
              active={statusFilter === s.value}
              onClick={() => setStatusFilter(s.value)}
              className={statusFilter === s.value && s.value !== "all" ? getStatusStyle(s.value) : undefined}
            >
              {s.label}
            </FilterChip>
          ))}
        </FilterBar>
      </div>

      {/* Table */}
      <div className="bg-[hsl(var(--color-background-muted))] border border-[hsl(var(--color-border))] rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[720px]">
            <thead>
              <tr className="border-b border-[hsl(var(--color-border))]">
                <th className="text-left px-6 py-4 text-sm font-medium text-[hsl(var(--color-foreground-muted))]">Applicant</th>
                <th className="text-left px-6 py-4 text-sm font-medium text-[hsl(var(--color-foreground-muted))]">Role</th>
                <th className="text-left px-6 py-4 text-sm font-medium text-[hsl(var(--color-foreground-muted))]">Applied</th>
                <th className="text-left px-6 py-4 text-sm font-medium text-[hsl(var(--color-foreground-muted))]">Status</th>
                <th className="text-left px-6 py-4 text-sm font-medium text-[hsl(var(--color-foreground-muted))]">Rating</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[hsl(var(--color-border))]">
              {filtered.length > 0 ? (
                filtered.map((app) => (
                  <tr
                    key={app.id}
                    className="hover:bg-[hsl(var(--color-background-subtle))] transition-colors cursor-pointer"
                  >
                    <td className="px-6 py-4">
                      <Link href={`/admin/applications/${app.id}`} className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-[hsl(var(--color-accent))]/20 flex items-center justify-center text-[hsl(var(--color-accent))] font-medium text-sm">
                          {app.full_name.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <p className="font-medium text-[hsl(var(--color-foreground))] hover:text-[hsl(var(--color-accent))] transition-colors">
                            {app.full_name}
                          </p>
                          <p className="text-sm text-[hsl(var(--color-foreground-subtle))]">{app.email}</p>
                        </div>
                      </Link>
                    </td>
                    <td className="px-6 py-4 text-[hsl(var(--color-foreground-muted))]">{app.role_title}</td>
                    <td className="px-6 py-4 text-[hsl(var(--color-foreground-subtle))] text-sm">{formatDate(app.created_at)}</td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex px-2.5 py-1 rounded-lg text-xs font-medium border ${getStatusStyle(app.status)}`}>
                        {app.status.charAt(0).toUpperCase() + app.status.slice(1)}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <RatingStars rating={app.rating} />
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-[hsl(var(--color-foreground-subtle))]">
                    {search || statusFilter !== "all" || roleFilter !== "all"
                      ? "No applications match your filters"
                      : "No applications yet"}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
