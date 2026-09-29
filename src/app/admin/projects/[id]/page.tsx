"use client";

import * as React from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { AdminLoader } from "@/components/admin/AdminLoader";
import { EmptyState } from "@/components/admin/ui";
import { IconChevronRight, IconPlus, IconClock, IconEdit, IconUsers, IconClipboard } from "@/components/admin/icons";

interface Assignment {
  id: string;
  role: string;
  estimated_hours: number;
  actual_hours: number;
  start_date: string | null;
  end_date: string | null;
  status: string;
  contractor: {
    id: string;
    name: string;
    email: string | null;
    role: string;
    hourly_rate: number;
    currency: string;
    avatar_url: string | null;
  } | null;
}

interface Milestone {
  id: string;
  name: string;
  description: string | null;
  due_date: string | null;
  completed_at: string | null;
  status: string;
  sort_order: number;
  deliverables: string | null;
}

interface TimeLog {
  id: string;
  date: string;
  hours: number;
  description: string | null;
  billable: boolean;
  created_at: string;
  contractor: { id: string; name: string; avatar_url: string | null } | null;
}

interface Project {
  id: string;
  name: string;
  description: string | null;
  project_type: string;
  status: string;
  health: string;
  progress: number;
  priority: string;
  start_date: string | null;
  target_end_date: string | null;
  actual_end_date: string | null;
  budget: number;
  spent: number;
  revenue: number;
  cost: number;
  margin_percent: number;
  currency: string;
  client: { id: string; name: string; company: string | null; email: string | null } | null;
  milestones: Milestone[];
  assignments: Assignment[];
  time_logs: TimeLog[];
}

const STATUS_CONFIG: Record<string, { label: string; color: string }> = {
  planning: { label: "Planning", color: "bg-blue-500/15 text-blue-400 border border-blue-500/20" },
  in_progress: { label: "In Progress", color: "bg-[hsl(var(--color-accent))]/15 text-[hsl(var(--color-accent))] border border-[hsl(var(--color-accent))]/20" },
  review: { label: "Review", color: "bg-purple-500/15 text-purple-400 border border-purple-500/20" },
  completed: { label: "Completed", color: "bg-emerald-500/15 text-emerald-400 border border-emerald-500/20" },
  on_hold: { label: "On Hold", color: "bg-amber-500/15 text-amber-400 border border-amber-500/20" },
  cancelled: { label: "Cancelled", color: "bg-red-500/15 text-red-400 border border-red-500/20" },
};

const PRIORITY_CONFIG: Record<string, { label: string; color: string }> = {
  low: { label: "Low", color: "bg-[hsl(var(--color-foreground-subtle))]/10 text-[hsl(var(--color-foreground-muted))] border border-[hsl(var(--color-border))]/30" },
  medium: { label: "Medium", color: "bg-blue-500/15 text-blue-400 border border-blue-500/20" },
  high: { label: "High", color: "bg-orange-500/15 text-orange-400 border border-orange-500/20" },
  urgent: { label: "Urgent", color: "bg-red-500/15 text-red-400 border border-red-500/20" },
};

const HEALTH_CONFIG: Record<string, { label: string; color: string; dot: string }> = {
  on_track: { label: "On Track", color: "bg-emerald-500/15 text-emerald-400 border border-emerald-500/20", dot: "bg-emerald-500" },
  at_risk: { label: "At Risk", color: "bg-amber-500/15 text-amber-400 border border-amber-500/20", dot: "bg-amber-500" },
  delayed: { label: "Delayed", color: "bg-red-500/15 text-red-400 border border-red-500/20", dot: "bg-red-500" },
  blocked: { label: "Blocked", color: "bg-red-500/15 text-red-300 border border-red-500/20", dot: "bg-red-400" },
};

const MILESTONE_STATUS: Record<string, { label: string; color: string }> = {
  pending: { label: "Pending", color: "text-[hsl(var(--color-foreground-subtle))]" },
  in_progress: { label: "In Progress", color: "text-[hsl(var(--color-accent))]" },
  completed: { label: "Completed", color: "text-emerald-400" },
};

const staggerContainer = {
  hidden: {},
  show: { transition: { staggerChildren: 0.06 } },
};

const fadeUp = {
  hidden: { opacity: 0, y: 12 },
  show: { opacity: 1, y: 0, transition: { duration: 0.4, ease: [0.25, 0.1, 0.25, 1] as const } },
};

function formatCurrency(value: number, currency = "AUD") {
  return new Intl.NumberFormat("en-AU", {
    style: "currency",
    currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
}

function formatDate(dateString: string) {
  const date = new Date(dateString + "T00:00:00");
  return date.toLocaleDateString("en-AU", { month: "short", day: "numeric", year: "numeric" });
}

function Initials({ name, size = "sm" }: { name: string; size?: "sm" | "md" }) {
  const initials = name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
  const sizeClasses = size === "sm" ? "w-8 h-8 text-[11px]" : "w-10 h-10 text-sm";
  return (
    <div className={`${sizeClasses} rounded-full bg-[hsl(var(--color-accent))]/20 text-[hsl(var(--color-accent))] flex items-center justify-center font-medium shrink-0`}>
      {initials}
    </div>
  );
}

export default function ProjectDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [project, setProject] = React.useState<Project | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [showTimeForm, setShowTimeForm] = React.useState(false);
  const [timeForm, setTimeForm] = React.useState({
    contractor_id: "",
    hours: "",
    description: "",
    date: new Date().toISOString().split("T")[0],
  });
  const [savingTime, setSavingTime] = React.useState(false);
  const [editing, setEditing] = React.useState(false);
  const [editForm, setEditForm] = React.useState({ status: "", health: "", priority: "", progress: 0 });

  const fetchProject = React.useCallback(async () => {
    try {
      const res = await fetch(`/api/admin/projects/${id}`);
      if (res.ok) {
        const data = await res.json();
        setProject(data);
      }
    } catch (error) {
      console.error("Failed to fetch project:", error);
    } finally {
      setLoading(false);
    }
  }, [id]);

  React.useEffect(() => {
    fetchProject();
  }, [fetchProject]);

  async function handleLogTime() {
    if (!timeForm.contractor_id || !timeForm.hours) return;
    setSavingTime(true);
    try {
      const assignment = project?.assignments.find(
        (a) => a.contractor?.id === timeForm.contractor_id
      );
      const res = await fetch("/api/admin/ops/time-logs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          project_id: id,
          contractor_id: timeForm.contractor_id,
          assignment_id: assignment?.id || null,
          date: timeForm.date,
          hours: Number(timeForm.hours),
          description: timeForm.description || null,
          billable: true,
        }),
      });

      if (!res.ok) {
        // Fallback: close and refresh
      }

      setShowTimeForm(false);
      setTimeForm({ contractor_id: "", hours: "", description: "", date: new Date().toISOString().split("T")[0] });
      fetchProject();
    } catch (error) {
      console.error("Failed to log time:", error);
    } finally {
      setSavingTime(false);
    }
  }

  function openEdit() {
    if (!project) return;
    setEditForm({
      status: project.status,
      health: project.health,
      priority: project.priority,
      progress: project.progress,
    });
    setEditing(true);
  }

  async function handleSaveEdit() {
    try {
      const res = await fetch(`/api/admin/projects/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(editForm),
      });
      if (res.ok) {
        setEditing(false);
        fetchProject();
      }
    } catch (error) {
      console.error("Save failed:", error);
    }
  }

  if (loading) return <AdminLoader message="Loading project..." />;

  if (!project) {
    return (
      <div className="min-h-[400px] flex flex-col items-center justify-center">
        <div className="border-2 border-dashed border-[hsl(var(--color-border))]/30 rounded-2xl p-12 flex flex-col items-center text-center">
          <p className="text-lg font-medium text-[hsl(var(--color-foreground-muted))] mb-2">Project not found</p>
          <Link href="/admin/projects" className="text-sm text-[hsl(var(--color-accent))] hover:underline">
            &larr; Back to projects
          </Link>
        </div>
      </div>
    );
  }

  const statusConf = STATUS_CONFIG[project.status] || STATUS_CONFIG.planning;
  const priorityConf = PRIORITY_CONFIG[project.priority] || PRIORITY_CONFIG.medium;
  const healthConf = HEALTH_CONFIG[project.health] || HEALTH_CONFIG.on_track;
  const margin = project.revenue > 0
    ? Math.round(((project.revenue - project.cost) / project.revenue) * 100)
    : 0;
  const burnRate = project.revenue > 0
    ? Math.min(Math.round((project.cost / project.revenue) * 100), 100)
    : 0;

  return (
    <motion.div
      className="space-y-8"
      variants={staggerContainer}
      initial="hidden"
      animate="show"
    >
      {/* Breadcrumb */}
      <motion.div variants={fadeUp} className="flex items-center gap-2 text-sm">
        <Link
          href="/admin/projects"
          className="inline-flex items-center text-[hsl(var(--color-foreground-muted))] hover:text-[hsl(var(--color-foreground))] transition-colors"
        >
          Projects
        </Link>
        <IconChevronRight size={16} className="text-[hsl(var(--color-foreground-subtle))] shrink-0" />
        <span className="text-[hsl(var(--color-foreground))] font-medium truncate">{project.name}</span>
      </motion.div>

      {/* Header */}
      <motion.div variants={fadeUp} className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
        <div>
          <h1 className="font-[family-name:var(--font-heading)] text-3xl font-semibold tracking-tight mb-2">{project.name}</h1>
          <div className="flex items-center gap-2 flex-wrap">
            {project.client && (
              <Link
                href={`/admin/clients/${project.client.id}`}
                className="inline-flex items-center text-sm text-[hsl(var(--color-accent))] hover:underline"
              >
                {project.client.name}
              </Link>
            )}
            <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${statusConf.color}`}>
              {statusConf.label}
            </span>
            <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${healthConf.color}`}>
              {healthConf.label}
            </span>
            <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${priorityConf.color}`}>
              {priorityConf.label}
            </span>
          </div>
          {project.description && (
            <p className="text-sm text-[hsl(var(--color-foreground-muted))] mt-2 max-w-2xl">
              {project.description}
            </p>
          )}
        </div>
        <button
          onClick={openEdit}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-transparent border border-[hsl(var(--color-border))]/50 text-sm text-[hsl(var(--color-foreground-muted))] hover:text-[hsl(var(--color-foreground))] hover:border-[hsl(var(--color-border-strong))]/60 hover:bg-[hsl(var(--color-background-subtle))]/50 transition-all duration-200 shrink-0"
        >
          <IconEdit size={16} />
          Edit
        </button>
      </motion.div>

      {/* Progress bar */}
      <motion.div variants={fadeUp}>
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm text-[hsl(var(--color-foreground-muted))]">Progress</span>
          <span className="text-sm font-mono tabular-nums font-medium text-[hsl(var(--color-foreground))]">{project.progress}%</span>
        </div>
        <div className="h-2 bg-[hsl(var(--color-background-muted))]/50 rounded-full overflow-hidden shadow-[inset_0_1px_0_rgba(255,255,255,0.1)]">
          <div
            className={`h-full rounded-full transition-all duration-500 ${
              project.progress > 80 ? "bg-emerald-500" : project.progress > 50 ? "bg-amber-400" : "bg-[hsl(var(--color-accent))]"
            }`}
            style={{ width: `${project.progress}%` }}
          />
        </div>
      </motion.div>

      {/* Financials + Team */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Financials Card */}
        <motion.div
          variants={fadeUp}
          className="bg-[hsl(var(--color-background-subtle))]/50 backdrop-blur-sm border border-[hsl(var(--color-border))]/50 rounded-2xl"
        >
          <div className="p-6 border-b border-[hsl(var(--color-border))]/30">
            <h2 className="font-[family-name:var(--font-heading)] text-lg font-semibold">Financials</h2>
          </div>
          <div className="p-6 space-y-5">
            {/* Revenue vs Cost horizontal bar */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs text-[hsl(var(--color-foreground-subtle))]">Revenue</span>
                <span className="text-lg font-semibold font-mono tabular-nums text-[hsl(var(--color-foreground))]">
                  {formatCurrency(project.revenue, project.currency)}
                </span>
              </div>
              <div className="h-3 bg-[hsl(var(--color-background-muted))]/50 rounded-full overflow-hidden">
                <div
                  className="h-full bg-emerald-500/60 rounded-full transition-all duration-500"
                  style={{ width: project.revenue > 0 ? "100%" : "0%" }}
                />
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-[hsl(var(--color-foreground-subtle))]">Cost</span>
                <span className="text-lg font-semibold font-mono tabular-nums text-[hsl(var(--color-foreground))]">
                  {formatCurrency(project.cost, project.currency)}
                </span>
              </div>
              <div className="h-3 bg-[hsl(var(--color-background-muted))]/50 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-500 ${
                    burnRate > 80 ? "bg-red-500/60" : burnRate > 60 ? "bg-amber-500/60" : "bg-blue-500/60"
                  }`}
                  style={{ width: `${burnRate}%` }}
                />
              </div>
            </div>

            {/* Margin */}
            <div className="flex items-center justify-between pt-4 border-t border-[hsl(var(--color-border))]/30">
              <span className="text-sm text-[hsl(var(--color-foreground-subtle))]">Margin</span>
              <span className={`text-2xl font-semibold font-mono tabular-nums tracking-tight ${
                margin >= 30 ? "text-emerald-400" : margin >= 15 ? "text-amber-400" : "text-red-400"
              }`}>
                {margin}%
              </span>
            </div>

            {project.budget > 0 && (
              <div className="flex items-center justify-between text-sm pt-3 border-t border-[hsl(var(--color-border))]/30">
                <span className="text-[hsl(var(--color-foreground-subtle))]">Budget</span>
                <span className="font-mono tabular-nums text-[hsl(var(--color-foreground))]">
                  {formatCurrency(project.budget, project.currency)}
                </span>
              </div>
            )}
          </div>
        </motion.div>

        {/* Team Card */}
        <motion.div
          variants={fadeUp}
          className="bg-[hsl(var(--color-background-subtle))]/50 backdrop-blur-sm border border-[hsl(var(--color-border))]/50 rounded-2xl"
        >
          <div className="p-6 border-b border-[hsl(var(--color-border))]/30">
            <h2 className="font-[family-name:var(--font-heading)] text-lg font-semibold">Team</h2>
          </div>
          <div className="divide-y divide-[hsl(var(--color-border))]/30">
            {project.assignments && project.assignments.length > 0 ? (
              project.assignments.map((a) => (
                <div key={a.id} className="px-6 py-4 flex items-center gap-3 hover:bg-[hsl(var(--color-background-muted))]/30 transition-colors">
                  {a.contractor && <Initials name={a.contractor.name} />}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-[hsl(var(--color-foreground))] truncate">
                      {a.contractor?.name || "Unknown"}
                    </p>
                    <p className="text-xs text-[hsl(var(--color-foreground-subtle))]">
                      {a.role || a.contractor?.role || "No role"}
                    </p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-sm font-mono tabular-nums text-[hsl(var(--color-foreground))]">
                      {Number(a.actual_hours).toFixed(1)}h / {Number(a.estimated_hours).toFixed(0)}h
                    </p>
                    <p className="text-[10px] text-[hsl(var(--color-foreground-subtle))]">
                      {a.contractor?.currency || "EUR"} {Number(a.contractor?.hourly_rate || 0).toFixed(0)}/hr
                    </p>
                  </div>
                </div>
              ))
            ) : (
              <EmptyState
                icon={<IconUsers size={48} />}
                title="No team members assigned"
                description="Assign contractors to this project"
              />
            )}
          </div>
        </motion.div>
      </div>

      {/* Milestones */}
      <motion.div
        variants={fadeUp}
        className="bg-[hsl(var(--color-background-subtle))]/50 backdrop-blur-sm border border-[hsl(var(--color-border))]/50 rounded-2xl"
      >
        <div className="p-6 border-b border-[hsl(var(--color-border))]/30">
          <h2 className="font-[family-name:var(--font-heading)] text-lg font-semibold">Milestones</h2>
        </div>
        <div className="divide-y divide-[hsl(var(--color-border))]/30">
          {project.milestones && project.milestones.length > 0 ? (
            [...project.milestones]
              .sort((a, b) => a.sort_order - b.sort_order)
              .map((m) => {
                const mStatus = MILESTONE_STATUS[m.status] || MILESTONE_STATUS.pending;
                return (
                  <div key={m.id} className="px-6 py-4 flex items-start gap-4 hover:bg-[hsl(var(--color-background-muted))]/30 transition-colors">
                    <div className={`w-2.5 h-2.5 rounded-full mt-1.5 shrink-0 ${
                      m.status === "completed" ? "bg-emerald-500" : m.status === "in_progress" ? "bg-[hsl(var(--color-accent))] animate-pulse" : "bg-[hsl(var(--color-foreground-subtle))]"
                    }`} />
                    <div className="flex-1 min-w-0">
                      <p className={`text-sm font-medium ${
                        m.status === "completed" ? "line-through text-[hsl(var(--color-foreground-muted))]" : "text-[hsl(var(--color-foreground))]"
                      }`}>
                        {m.name}
                      </p>
                      {m.deliverables && (
                        <p className="text-xs text-[hsl(var(--color-foreground-subtle))] mt-0.5 truncate">
                          {m.deliverables}
                        </p>
                      )}
                    </div>
                    <div className="text-right shrink-0">
                      <p className={`text-xs font-medium ${mStatus.color}`}>
                        {mStatus.label}
                      </p>
                      {m.due_date && (
                        <p className="text-[10px] text-[hsl(var(--color-foreground-subtle))]">
                          {formatDate(m.due_date)}
                        </p>
                      )}
                    </div>
                  </div>
                );
              })
          ) : (
            <EmptyState
              icon={<IconClipboard size={48} />}
              title="No milestones defined"
              description="Add milestones to track deliverables"
            />
          )}
        </div>
      </motion.div>

      {/* Time Logs */}
      <motion.div
        variants={fadeUp}
        className="bg-[hsl(var(--color-background-subtle))]/50 backdrop-blur-sm border border-[hsl(var(--color-border))]/50 rounded-2xl"
      >
        <div className="p-6 border-b border-[hsl(var(--color-border))]/30 flex items-center justify-between">
          <h2 className="font-[family-name:var(--font-heading)] text-lg font-semibold">Time Logs</h2>
          <button
            onClick={() => setShowTimeForm(!showTimeForm)}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-[hsl(var(--color-accent))]/10 text-[hsl(var(--color-foreground))] hover:bg-[hsl(var(--color-accent))]/20 transition-colors border border-[hsl(var(--color-accent))]/20 text-xs font-medium"
          >
            <IconPlus size={16} />
            Log Time
          </button>
        </div>

        {/* Inline time log form */}
        <AnimatePresence>
          {showTimeForm && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="overflow-hidden border-b border-[hsl(var(--color-border))]/30"
            >
              <div className="p-6 bg-[hsl(var(--color-background-muted))]/30">
                <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                  <div>
                    <label className="text-sm font-medium text-[hsl(var(--color-foreground-muted))] mb-1.5 block">Contractor *</label>
                    <select
                      value={timeForm.contractor_id}
                      onChange={(e) => setTimeForm({ ...timeForm, contractor_id: e.target.value })}
                      className="w-full px-4 py-3 rounded-xl bg-[hsl(var(--color-background))] border border-[hsl(var(--color-border))] text-[hsl(var(--color-foreground))] text-sm focus:outline-none focus:ring-2 focus:ring-[hsl(var(--color-accent))]/50 focus:border-[hsl(var(--color-accent))]/50"
                    >
                      <option value="">Select...</option>
                      {project.assignments
                        .filter((a) => a.contractor)
                        .map((a) => (
                          <option key={a.contractor!.id} value={a.contractor!.id}>
                            {a.contractor!.name}
                          </option>
                        ))}
                    </select>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-[hsl(var(--color-foreground-muted))] mb-1.5 block">Hours *</label>
                    <input
                      type="number"
                      step="0.5"
                      value={timeForm.hours}
                      onChange={(e) => setTimeForm({ ...timeForm, hours: e.target.value })}
                      className="w-full px-4 py-3 rounded-xl bg-[hsl(var(--color-background))] border border-[hsl(var(--color-border))] text-[hsl(var(--color-foreground))] text-sm focus:outline-none focus:ring-2 focus:ring-[hsl(var(--color-accent))]/50 focus:border-[hsl(var(--color-accent))]/50"
                      placeholder="0"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-[hsl(var(--color-foreground-muted))] mb-1.5 block">Date</label>
                    <input
                      type="date"
                      value={timeForm.date}
                      onChange={(e) => setTimeForm({ ...timeForm, date: e.target.value })}
                      className="w-full px-4 py-3 rounded-xl bg-[hsl(var(--color-background))] border border-[hsl(var(--color-border))] text-[hsl(var(--color-foreground))] text-sm focus:outline-none focus:ring-2 focus:ring-[hsl(var(--color-accent))]/50 focus:border-[hsl(var(--color-accent))]/50"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-[hsl(var(--color-foreground-muted))] mb-1.5 block">Description</label>
                    <input
                      value={timeForm.description}
                      onChange={(e) => setTimeForm({ ...timeForm, description: e.target.value })}
                      className="w-full px-4 py-3 rounded-xl bg-[hsl(var(--color-background))] border border-[hsl(var(--color-border))] text-[hsl(var(--color-foreground))] text-sm focus:outline-none focus:ring-2 focus:ring-[hsl(var(--color-accent))]/50 focus:border-[hsl(var(--color-accent))]/50"
                      placeholder="What was done"
                    />
                  </div>
                </div>
                <div className="flex justify-end gap-2 mt-4">
                  <button
                    onClick={() => setShowTimeForm(false)}
                    className="px-4 py-2 rounded-xl text-xs text-[hsl(var(--color-foreground-muted))] hover:text-[hsl(var(--color-foreground))] border border-[hsl(var(--color-border))] hover:bg-[hsl(var(--color-background-muted))]/50 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleLogTime}
                    disabled={savingTime || !timeForm.contractor_id || !timeForm.hours}
                    className="px-5 py-2 rounded-xl bg-[hsl(var(--color-accent))] text-white text-xs font-medium hover:bg-[hsl(var(--color-accent-hover))] transition-colors disabled:opacity-50"
                  >
                    {savingTime ? "Saving..." : "Log Time"}
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="divide-y divide-[hsl(var(--color-border))]/30">
          {project.time_logs && project.time_logs.length > 0 ? (
            project.time_logs.slice(0, 20).map((log) => (
              <div key={log.id} className="px-6 py-3.5 flex items-center gap-3 hover:bg-[hsl(var(--color-background-muted))]/30 transition-colors">
                {log.contractor && <Initials name={log.contractor.name} />}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-[hsl(var(--color-foreground))] truncate">
                    {log.contractor?.name || "Unknown"}
                  </p>
                  <p className="text-xs text-[hsl(var(--color-foreground-subtle))] truncate">
                    {log.description || "No description"}
                  </p>
                </div>
                <div className="text-right shrink-0">
                  <p className="text-sm font-mono tabular-nums font-medium text-[hsl(var(--color-foreground))]">
                    {Number(log.hours).toFixed(1)}h
                  </p>
                  <p className="text-[10px] text-[hsl(var(--color-foreground-subtle))]">
                    {formatDate(log.date)}
                  </p>
                </div>
              </div>
            ))
          ) : (
            <div className="min-h-[200px] flex flex-col items-center justify-center p-8">
              <div className="border-2 border-dashed border-[hsl(var(--color-border))]/30 rounded-2xl p-6 flex flex-col items-center">
                <IconClock size={16} />
                <p className="text-lg font-medium text-[hsl(var(--color-foreground-muted))] mb-1">No time logged yet</p>
                <p className="text-sm text-[hsl(var(--color-foreground-subtle))]">Use the button above to log hours</p>
              </div>
            </div>
          )}
        </div>
      </motion.div>

      {/* Edit Modal */}
      <AnimatePresence>
        {editing && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm"
              onClick={() => setEditing(false)}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.97 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.97 }}
              transition={{ duration: 0.2, ease: [0.25, 0.1, 0.25, 1] as const }}
              className="fixed inset-x-4 top-[15%] z-50 mx-auto max-w-md bg-[hsl(var(--color-background-subtle))] border border-[hsl(var(--color-border))]/50 rounded-2xl shadow-2xl"
            >
              <div className="p-6">
                <h2 className="font-[family-name:var(--font-heading)] text-lg font-semibold mb-6">Edit Project</h2>
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-sm font-medium text-[hsl(var(--color-foreground-muted))] mb-1.5 block">Status</label>
                      <select
                        value={editForm.status}
                        onChange={(e) => setEditForm({ ...editForm, status: e.target.value })}
                        className="w-full px-4 py-3 rounded-xl bg-[hsl(var(--color-background))] border border-[hsl(var(--color-border))] text-[hsl(var(--color-foreground))] text-sm focus:outline-none focus:ring-2 focus:ring-[hsl(var(--color-accent))]/50 focus:border-[hsl(var(--color-accent))]/50"
                      >
                        {Object.entries(STATUS_CONFIG).map(([k, v]) => (
                          <option key={k} value={k}>{v.label}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-[hsl(var(--color-foreground-muted))] mb-1.5 block">Health</label>
                      <select
                        value={editForm.health}
                        onChange={(e) => setEditForm({ ...editForm, health: e.target.value })}
                        className="w-full px-4 py-3 rounded-xl bg-[hsl(var(--color-background))] border border-[hsl(var(--color-border))] text-[hsl(var(--color-foreground))] text-sm focus:outline-none focus:ring-2 focus:ring-[hsl(var(--color-accent))]/50 focus:border-[hsl(var(--color-accent))]/50"
                      >
                        {Object.entries(HEALTH_CONFIG).map(([k, v]) => (
                          <option key={k} value={k}>{v.label}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-sm font-medium text-[hsl(var(--color-foreground-muted))] mb-1.5 block">Priority</label>
                      <select
                        value={editForm.priority}
                        onChange={(e) => setEditForm({ ...editForm, priority: e.target.value })}
                        className="w-full px-4 py-3 rounded-xl bg-[hsl(var(--color-background))] border border-[hsl(var(--color-border))] text-[hsl(var(--color-foreground))] text-sm focus:outline-none focus:ring-2 focus:ring-[hsl(var(--color-accent))]/50 focus:border-[hsl(var(--color-accent))]/50"
                      >
                        {Object.entries(PRIORITY_CONFIG).map(([k, v]) => (
                          <option key={k} value={k}>{v.label}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-[hsl(var(--color-foreground-muted))] mb-1.5 block">
                        Progress ({editForm.progress}%)
                      </label>
                      <input
                        type="range"
                        min="0"
                        max="100"
                        step="5"
                        value={editForm.progress}
                        onChange={(e) => setEditForm({ ...editForm, progress: Number(e.target.value) })}
                        className="w-full mt-1"
                      />
                    </div>
                  </div>
                </div>
                <div className="flex items-center justify-end gap-3 mt-6 pt-4 border-t border-[hsl(var(--color-border))]/30">
                  <button
                    onClick={() => setEditing(false)}
                    className="px-5 py-2.5 rounded-xl bg-transparent border border-[hsl(var(--color-border))] hover:bg-[hsl(var(--color-background-muted))]/50 text-sm text-[hsl(var(--color-foreground-muted))] hover:text-[hsl(var(--color-foreground))] transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSaveEdit}
                    className="px-5 py-2.5 rounded-xl bg-[hsl(var(--color-accent))] text-white text-sm font-medium hover:bg-[hsl(var(--color-accent-hover))] transition-colors"
                  >
                    Save Changes
                  </button>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
