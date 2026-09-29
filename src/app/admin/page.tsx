"use client";

import * as React from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { AdminLoader } from "@/components/admin/AdminLoader";
import { IconDollar, IconFolder, IconUsers, IconChart, IconPlus, IconClock, IconFileText, IconUserPlus, IconCalendar } from "@/components/admin/icons";
import { StatCard, EmptyState } from "@/components/admin/ui";

interface OpsStats {
  monthlyRevenue: number;
  activeProjectsCount: number;
  teamUtilization: number;
  avgMargin: number;
  recentTimeLogs: Array<{
    id: string;
    date: string;
    hours: number;
    description: string | null;
    contractor: { id: string; name: string; avatar_url: string | null } | null;
    project: { id: string; name: string } | null;
  }>;
  upcomingMilestones: Array<{
    id: string;
    name: string;
    due_date: string;
    status: string;
    project: { id: string; name: string; client: { name: string } | null } | null;
  }>;
  activeProjects: Array<{
    id: string;
    name: string;
    status: string;
    health: string;
    progress: number;
    priority: string;
    client: { id: string; name: string } | null;
    assignments: Array<{
      contractor: { id: string; name: string; avatar_url: string | null } | null;
    }>;
  }>;
}

function formatCurrency(value: number) {
  return new Intl.NumberFormat("en-AU", {
    style: "currency",
    currency: "AUD",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
}

function formatDate(dateString: string) {
  const date = new Date(dateString + "T00:00:00");
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffDays === 0) return "Today";
  if (diffDays === 1) return "Yesterday";
  if (diffDays < 7) return `${diffDays}d ago`;
  return date.toLocaleDateString("en-AU", { month: "short", day: "numeric" });
}

function formatDueDate(dateString: string) {
  const date = new Date(dateString + "T00:00:00");
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  const diffMs = date.getTime() - now.getTime();
  const diffDays = Math.round(diffMs / 86400000);

  if (diffDays === 0) return "Today";
  if (diffDays === 1) return "Tomorrow";
  if (diffDays < 7) return `In ${diffDays}d`;
  return date.toLocaleDateString("en-AU", { month: "short", day: "numeric" });
}

function getGreeting() {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning";
  if (hour < 17) return "Good afternoon";
  return "Good evening";
}

function getFormattedDate() {
  return new Date().toLocaleDateString("en-AU", {
    weekday: "long",
    month: "long",
    day: "numeric",
  });
}

function Initials({ name, size = "sm" }: { name: string; size?: "sm" | "md" }) {
  const initials = name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
  const sizeClasses = size === "sm" ? "w-7 h-7 text-[10px]" : "w-9 h-9 text-xs";
  return (
    <div
      className={`${sizeClasses} rounded-full bg-[hsl(var(--color-accent))]/20 text-[hsl(var(--color-accent))] flex items-center justify-center font-medium shrink-0 ring-2 ring-[hsl(var(--color-background-subtle))]`}
    >
      {initials}
    </div>
  );
}

const HEALTH_COLORS: Record<string, string> = {
  on_track: "bg-emerald-500/15 text-emerald-400 border-emerald-500/20",
  at_risk: "bg-amber-500/15 text-amber-400 border-amber-500/20",
  delayed: "bg-red-500/15 text-red-400 border-red-500/20",
  blocked: "bg-red-500/15 text-red-300 border-red-500/20",
};

const HEALTH_LABELS: Record<string, string> = {
  on_track: "On Track",
  at_risk: "At Risk",
  delayed: "Delayed",
  blocked: "Blocked",
};

const staggerContainer = {
  hidden: {},
  show: { transition: { staggerChildren: 0.06 } },
};

const fadeUp = {
  hidden: { opacity: 0, y: 12 },
  show: { opacity: 1, y: 0, transition: { duration: 0.4, ease: [0.25, 0.1, 0.25, 1] as const } },
};

export default function CommandCenter() {
  const [stats, setStats] = React.useState<OpsStats | null>(null);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    async function fetchStats() {
      try {
        const res = await fetch("/api/admin/ops/stats");
        if (res.ok) {
          const data = await res.json();
          setStats(data);
        }
      } catch (error) {
        console.error("Failed to fetch ops stats:", error);
      } finally {
        setLoading(false);
      }
    }
    fetchStats();
  }, []);

  if (loading) {
    return <AdminLoader message="Loading command center..." />;
  }

  return (
    <motion.div
      className="space-y-8"
      variants={staggerContainer}
      initial="hidden"
      animate="show"
    >
      {/* Header with Greeting */}
      <motion.div variants={fadeUp}>
        <h1 className="font-[family-name:var(--font-heading)] text-3xl font-semibold tracking-tight mb-1">
          {getGreeting()}
        </h1>
        <p className="text-[hsl(var(--color-foreground-muted))]">
          {getFormattedDate()}
        </p>
      </motion.div>

      {/* Stats Grid */}
      <motion.div
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6"
        variants={staggerContainer}
      >
        <motion.div variants={fadeUp}>
          <StatCard
            label="Monthly Revenue"
            value={formatCurrency(stats?.monthlyRevenue || 0)}
            icon={<IconDollar size={20} />}
          />
        </motion.div>
        <motion.div variants={fadeUp}>
          <StatCard
            label="Active Projects"
            value={stats?.activeProjectsCount || 0}
            icon={<IconFolder size={20} />}
          />
        </motion.div>
        <motion.div variants={fadeUp}>
          <StatCard
            label="Team Utilization"
            value={`${stats?.teamUtilization || 0}%`}
            icon={<IconUsers size={20} />}
            accent={
              (stats?.teamUtilization || 0) > 85
                ? "warning"
                : (stats?.teamUtilization || 0) > 60
                ? "success"
                : undefined
            }
          />
        </motion.div>
        <motion.div variants={fadeUp}>
          <StatCard
            label="Avg Margin"
            value={`${stats?.avgMargin || 0}%`}
            icon={<IconChart size={20} />}
          />
        </motion.div>
      </motion.div>

      {/* Active Projects + Recent Time Logs */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* Active Projects */}
        <motion.div
          className="lg:col-span-3 bg-[hsl(var(--color-background-subtle))]/50 backdrop-blur-sm border border-[hsl(var(--color-border))]/50 rounded-2xl"
          variants={fadeUp}
        >
          <div className="p-6 border-b border-[hsl(var(--color-border))]/30 flex items-center justify-between">
            <h2 className="font-[family-name:var(--font-heading)] text-lg font-semibold">Active Projects</h2>
            <Link
              href="/admin/projects"
              className="text-xs text-[hsl(var(--color-accent))] hover:underline"
            >
              View all &rarr;
            </Link>
          </div>
          <div className="divide-y divide-[hsl(var(--color-border))]/30">
            {stats?.activeProjects && stats.activeProjects.length > 0 ? (
              stats.activeProjects.map((project) => (
                <Link
                  key={project.id}
                  href={`/admin/projects/${project.id}`}
                  className="flex items-center gap-4 px-6 py-4 hover:bg-[hsl(var(--color-background-muted))]/30 transition-colors"
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <p className="font-medium text-sm text-[hsl(var(--color-foreground))] truncate">
                        {project.name}
                      </p>
                      <span
                        className={`px-2.5 py-1 rounded-full text-xs font-medium border ${
                          HEALTH_COLORS[project.health] || HEALTH_COLORS.on_track
                        }`}
                      >
                        {HEALTH_LABELS[project.health] || project.health}
                      </span>
                    </div>
                    <p className="text-xs text-[hsl(var(--color-foreground-subtle))]">
                      {project.client?.name || "No client"}
                    </p>
                    {/* Progress bar */}
                    <div className="mt-2 h-2 bg-[hsl(var(--color-background-muted))]/50 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-[hsl(var(--color-accent))] rounded-full transition-all duration-500"
                        style={{ width: `${project.progress || 0}%` }}
                      />
                    </div>
                  </div>
                  {/* Team avatars */}
                  <div className="flex -space-x-2 shrink-0">
                    {project.assignments?.slice(0, 3).map((a, i) =>
                      a.contractor ? (
                        <Initials key={i} name={a.contractor.name} />
                      ) : null
                    )}
                    {(project.assignments?.length || 0) > 3 && (
                      <div className="w-7 h-7 rounded-full bg-[hsl(var(--color-background-muted))] border border-[hsl(var(--color-border))] text-[10px] flex items-center justify-center text-[hsl(var(--color-foreground-muted))] ring-2 ring-[hsl(var(--color-background-subtle))]">
                        +{project.assignments.length - 3}
                      </div>
                    )}
                  </div>
                </Link>
              ))
            ) : (
              <EmptyState
                icon={<IconFolder size={48} />}
                title="No active projects"
                description="Create a project to get started"
                action={
                  <Link
                    href="/admin/projects"
                    className="px-5 py-2.5 bg-[hsl(var(--color-accent))] hover:bg-[hsl(var(--color-accent-hover))] text-white rounded-xl text-sm font-medium transition-colors"
                  >
                    New Project
                  </Link>
                }
              />
            )}
          </div>
        </motion.div>

        {/* Recent Time Logs */}
        <motion.div
          className="lg:col-span-2 bg-[hsl(var(--color-background-subtle))]/50 backdrop-blur-sm border border-[hsl(var(--color-border))]/50 rounded-2xl"
          variants={fadeUp}
        >
          <div className="p-6 border-b border-[hsl(var(--color-border))]/30">
            <h2 className="font-[family-name:var(--font-heading)] text-lg font-semibold">Recent Time Logs</h2>
          </div>
          <div className="divide-y divide-[hsl(var(--color-border))]/30">
            {stats?.recentTimeLogs && stats.recentTimeLogs.length > 0 ? (
              stats.recentTimeLogs.map((log) => (
                <div key={log.id} className="px-6 py-3.5 flex items-center gap-3 hover:bg-[hsl(var(--color-background-muted))]/30 transition-colors">
                  {log.contractor && <Initials name={log.contractor.name} />}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-[hsl(var(--color-foreground))] truncate">
                      {log.contractor?.name || "Unknown"}
                    </p>
                    <p className="text-xs text-[hsl(var(--color-foreground-subtle))] truncate">
                      {log.project?.name || "No project"}
                    </p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-sm font-mono font-medium tabular-nums text-[hsl(var(--color-foreground))]">
                      {Number(log.hours).toFixed(1)}h
                    </p>
                    <p className="text-[10px] text-[hsl(var(--color-foreground-subtle))]">
                      {formatDate(log.date)}
                    </p>
                  </div>
                </div>
              ))
            ) : (
              <EmptyState
                icon={<IconClock size={48} />}
                title="No time logs yet"
                description="Time entries will appear here"
              />
            )}
          </div>
        </motion.div>
      </div>

      {/* Upcoming Deadlines + Quick Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* Upcoming Deadlines */}
        <motion.div
          className="lg:col-span-3 bg-[hsl(var(--color-background-subtle))]/50 backdrop-blur-sm border border-[hsl(var(--color-border))]/50 rounded-2xl"
          variants={fadeUp}
        >
          <div className="p-6 border-b border-[hsl(var(--color-border))]/30">
            <h2 className="font-[family-name:var(--font-heading)] text-lg font-semibold">Upcoming Deadlines</h2>
            <p className="text-xs text-[hsl(var(--color-foreground-subtle))] mt-0.5">
              Next 14 days
            </p>
          </div>
          <div className="divide-y divide-[hsl(var(--color-border))]/30">
            {stats?.upcomingMilestones && stats.upcomingMilestones.length > 0 ? (
              stats.upcomingMilestones.map((milestone) => (
                <div key={milestone.id} className="px-6 py-4 flex items-center gap-4 hover:bg-[hsl(var(--color-background-muted))]/30 transition-colors">
                  <div
                    className={`w-2 h-2 rounded-full shrink-0 ${
                      milestone.status === "in_progress"
                        ? "bg-[hsl(var(--color-accent))] animate-pulse"
                        : "bg-[hsl(var(--color-foreground-subtle))]"
                    }`}
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-[hsl(var(--color-foreground))] truncate">
                      {milestone.name}
                    </p>
                    <p className="text-xs text-[hsl(var(--color-foreground-subtle))]">
                      {milestone.project?.name}
                      {milestone.project?.client?.name && ` \u00b7 ${milestone.project.client.name}`}
                    </p>
                  </div>
                  <span className="text-xs font-medium text-[hsl(var(--color-foreground-muted))] shrink-0">
                    {formatDueDate(milestone.due_date)}
                  </span>
                </div>
              ))
            ) : (
              <EmptyState
                icon={<IconCalendar size={48} />}
                title="No upcoming deadlines"
                description="All clear for the next 14 days"
              />
            )}
          </div>
        </motion.div>

        {/* Quick Actions */}
        <motion.div className="lg:col-span-2 space-y-4" variants={fadeUp}>
          <h2 className="font-[family-name:var(--font-heading)] text-lg font-semibold">Quick Actions</h2>
          <div className="flex flex-wrap gap-2.5">
            <Link
              href="/admin/projects"
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-full bg-[hsl(var(--color-accent))]/10 text-[hsl(var(--color-foreground))] hover:bg-[hsl(var(--color-accent))]/20 transition-all duration-200 border border-[hsl(var(--color-accent))]/20 hover:border-[hsl(var(--color-accent))]/40"
            >
              <IconPlus size={16} className="text-[hsl(var(--color-accent))]" />
              <span className="text-sm font-medium">New Project</span>
            </Link>
            <Link
              href="/admin/team"
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-full bg-[hsl(var(--color-background-subtle))]/50 text-[hsl(var(--color-foreground))] hover:bg-[hsl(var(--color-background-subtle))]/80 transition-all duration-200 border border-[hsl(var(--color-border))]/50 hover:border-[hsl(var(--color-border-strong))]/60"
            >
              <IconClock size={16} className="text-[hsl(var(--color-foreground-muted))]" />
              <span className="text-sm font-medium">Add Time</span>
            </Link>
            <Link
              href="/admin/finances"
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-full bg-[hsl(var(--color-background-subtle))]/50 text-[hsl(var(--color-foreground))] hover:bg-[hsl(var(--color-background-subtle))]/80 transition-all duration-200 border border-[hsl(var(--color-border))]/50 hover:border-[hsl(var(--color-border-strong))]/60"
            >
              <IconFileText size={16} className="text-[hsl(var(--color-foreground-muted))]" />
              <span className="text-sm font-medium">Create Invoice</span>
            </Link>
            <Link
              href="/admin/team"
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-full bg-[hsl(var(--color-background-subtle))]/50 text-[hsl(var(--color-foreground))] hover:bg-[hsl(var(--color-background-subtle))]/80 transition-all duration-200 border border-[hsl(var(--color-border))]/50 hover:border-[hsl(var(--color-border-strong))]/60"
            >
              <IconUserPlus size={16} className="text-[hsl(var(--color-foreground-muted))]" />
              <span className="text-sm font-medium">Add Team Member</span>
            </Link>
          </div>
        </motion.div>
      </div>
    </motion.div>
  );
}

