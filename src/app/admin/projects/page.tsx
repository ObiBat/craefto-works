"use client";

import * as React from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { AdminLoader } from "@/components/admin/AdminLoader";
import { EmptyState } from "@/components/admin/ui";
import { IconPlus, IconFolder } from "@/components/admin/icons";

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
  budget: number;
  spent: number;
  revenue: number;
  cost: number;
  margin_percent: number;
  currency: string;
  created_at: string;
  updated_at: string;
  client: { id: string; name: string; company: string | null } | null;
  assignments: Array<{
    id: string;
    role: string;
    status: string;
    contractor: { id: string; name: string; avatar_url: string | null } | null;
  }>;
}

interface Client {
  id: string;
  name: string;
  company: string | null;
}

const STATUS_CONFIG: Record<string, { label: string; color: string }> = {
  planning: { label: "Planning", color: "bg-blue-500/15 text-blue-400 border border-blue-500/20" },
  in_progress: { label: "In Progress", color: "bg-[hsl(var(--color-accent))]/15 text-[hsl(var(--color-accent))] border border-[hsl(var(--color-accent))]/20" },
  review: { label: "Review", color: "bg-purple-500/15 text-purple-400 border border-purple-500/20" },
  completed: { label: "Completed", color: "bg-emerald-500/15 text-emerald-400 border border-emerald-500/20" },
  on_hold: { label: "On Hold", color: "bg-amber-500/15 text-amber-400 border border-amber-500/20" },
  cancelled: { label: "Cancelled", color: "bg-red-500/15 text-red-400 border border-red-500/20" },
};

const PRIORITY_DOTS: Record<string, string> = {
  low: "bg-gray-400",
  medium: "bg-blue-400",
  high: "bg-orange-400",
  urgent: "bg-red-400",
};

const HEALTH_COLORS: Record<string, string> = {
  on_track: "bg-emerald-500",
  at_risk: "bg-amber-500",
  delayed: "bg-red-500",
  blocked: "bg-red-400",
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

function Initials({ name }: { name: string }) {
  const initials = name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
  return (
    <div className="w-7 h-7 rounded-full bg-[hsl(var(--color-accent))]/20 text-[hsl(var(--color-accent))] flex items-center justify-center font-medium text-[10px] shrink-0 ring-2 ring-[hsl(var(--color-background-subtle))]">
      {initials}
    </div>
  );
}

const EMPTY_FORM = {
  name: "",
  description: "",
  client_id: "",
  status: "planning",
  priority: "medium",
  start_date: "",
  target_end_date: "",
  revenue: 0,
  cost: 0,
  budget: 0,
  currency: "AUD",
};

export default function ProjectsPage() {
  const [projects, setProjects] = React.useState<Project[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [filter, setFilter] = React.useState("all");
  const [sort, setSort] = React.useState("updated_at");
  const [showForm, setShowForm] = React.useState(false);
  const [form, setForm] = React.useState(EMPTY_FORM);
  const [clients, setClients] = React.useState<Client[]>([]);
  const [saving, setSaving] = React.useState(false);

  const fetchProjects = React.useCallback(async () => {
    try {
      const params = new URLSearchParams();
      if (filter !== "all") params.set("status", filter);
      params.set("sort", sort);
      const res = await fetch(`/api/admin/projects?${params}`);
      if (res.ok) {
        const data = await res.json();
        setProjects(data);
      }
    } catch (error) {
      console.error("Failed to fetch projects:", error);
    } finally {
      setLoading(false);
    }
  }, [filter, sort]);

  React.useEffect(() => {
    fetchProjects();
  }, [fetchProjects]);

  async function openForm() {
    setForm(EMPTY_FORM);
    setShowForm(true);
    try {
      const res = await fetch("/api/admin/clients");
      if (res.ok) {
        const data = await res.json();
        setClients(Array.isArray(data) ? data : data.clients || []);
      }
    } catch {
      // ignore
    }
  }

  async function handleSave() {
    if (!form.name) return;
    setSaving(true);
    try {
      const res = await fetch("/api/admin/projects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          client_id: form.client_id || null,
          revenue: Number(form.revenue) || 0,
          cost: Number(form.cost) || 0,
          budget: Number(form.budget) || 0,
        }),
      });
      if (res.ok) {
        setShowForm(false);
        fetchProjects();
      }
    } catch (error) {
      console.error("Save failed:", error);
    } finally {
      setSaving(false);
    }
  }

  if (loading) return <AdminLoader message="Loading projects..." />;

  return (
    <motion.div
      className="space-y-8"
      variants={staggerContainer}
      initial="hidden"
      animate="show"
    >
      {/* Header */}
      <motion.div variants={fadeUp} className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="font-[family-name:var(--font-heading)] text-3xl font-semibold tracking-tight mb-1">Projects</h1>
          <p className="text-[hsl(var(--color-foreground-muted))]">
            {projects.length} project{projects.length !== 1 ? "s" : ""}
          </p>
        </div>
        <div className="flex items-center gap-3 flex-wrap">
          {/* Status filter */}
          <div className="flex rounded-xl border border-[hsl(var(--color-border))]/50 overflow-hidden">
            {(["all", "planning", "in_progress", "completed"] as const).map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`px-3 py-1.5 text-xs font-medium transition-colors ${
                  filter === f
                    ? "bg-[hsl(var(--color-accent))]/10 text-[hsl(var(--color-foreground))]"
                    : "text-[hsl(var(--color-foreground-muted))] hover:text-[hsl(var(--color-foreground))]"
                }`}
              >
                {f === "all" ? "All" : f === "in_progress" ? "Active" : f === "planning" ? "Planning" : "Done"}
              </button>
            ))}
          </div>
          {/* Sort */}
          <select
            value={sort}
            onChange={(e) => setSort(e.target.value)}
            className="px-3 py-1.5 text-xs rounded-xl bg-[hsl(var(--color-background-subtle))]/50 border border-[hsl(var(--color-border))]/50 text-[hsl(var(--color-foreground))] focus:outline-none"
          >
            <option value="updated_at">Recent</option>
            <option value="name">Name</option>
          </select>
          <button
            onClick={openForm}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[hsl(var(--color-accent))] text-white hover:bg-[hsl(var(--color-accent-hover))] transition-colors text-sm font-medium"
          >
            <IconPlus size={16} />
            New Project
          </button>
        </div>
      </motion.div>

      {/* Grid */}
      {projects.length === 0 ? (
        <motion.div variants={fadeUp}>
          <div className="min-h-[400px] flex items-center justify-center">
            <EmptyState
              icon={<IconFolder size={48} />}
              title="No projects yet"
              description="Start tracking your client work"
              action={
                <button
                  onClick={openForm}
                  className="px-5 py-2.5 bg-[hsl(var(--color-accent))] hover:bg-[hsl(var(--color-accent-hover))] text-white rounded-xl text-sm font-medium transition-colors"
                >
                  Create your first project
                </button>
              }
            />
          </div>
        </motion.div>
      ) : (
        <motion.div
          className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6"
          variants={staggerContainer}
        >
          {projects.map((project) => {
            const statusConf = STATUS_CONFIG[project.status] || STATUS_CONFIG.planning;
            const priorityDot = PRIORITY_DOTS[project.priority] || PRIORITY_DOTS.medium;
            const healthColor = HEALTH_COLORS[project.health] || HEALTH_COLORS.on_track;
            const margin = project.revenue > 0
              ? Math.round(((project.revenue - project.cost) / project.revenue) * 100)
              : 0;
            const progress = project.progress || 0;

            return (
              <motion.div key={project.id} variants={fadeUp}>
                <Link
                  href={`/admin/projects/${project.id}`}
                  className="block bg-[hsl(var(--color-background-subtle))]/50 backdrop-blur-sm border border-[hsl(var(--color-border))]/50 rounded-2xl hover:border-[hsl(var(--color-border-strong))]/60 hover:bg-[hsl(var(--color-background-subtle))]/80 hover:shadow-lg hover:shadow-black/5 transition-all duration-200"
                >
                  <div className="p-6">
                    {/* Client name + priority dot */}
                    <div className="flex items-center justify-between mb-2">
                      <p className="text-xs text-[hsl(var(--color-foreground-subtle))]">
                        {project.client?.name || "No client"}
                      </p>
                      <div className="flex items-center gap-2">
                        <div className={`w-2 h-2 rounded-full ${priorityDot}`} title={project.priority} />
                        <div className={`w-2 h-2 rounded-full ${healthColor}`} />
                      </div>
                    </div>

                    {/* Project name */}
                    <h3 className="font-medium text-[hsl(var(--color-foreground))] truncate mb-3">
                      {project.name}
                    </h3>

                    {/* Status badge */}
                    <div className="flex flex-wrap gap-1.5 mb-4">
                      <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${statusConf.color}`}>
                        {statusConf.label}
                      </span>
                    </div>

                    {/* Progress bar */}
                    <div className="mb-4">
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="text-xs text-[hsl(var(--color-foreground-subtle))]">Progress</span>
                        <span className="text-xs font-mono tabular-nums text-[hsl(var(--color-foreground-muted))]">
                          {progress}%
                        </span>
                      </div>
                      <div className="h-2 bg-[hsl(var(--color-background-muted))]/50 rounded-full overflow-hidden shadow-[inset_0_1px_0_rgba(255,255,255,0.1)]">
                        <div
                          className={`h-full rounded-full transition-all duration-500 ${
                            progress > 80 ? "bg-emerald-500" : progress > 50 ? "bg-amber-400" : "bg-[hsl(var(--color-accent))]"
                          }`}
                          style={{ width: `${progress}%` }}
                        />
                      </div>
                    </div>

                    {/* Budget / Margin */}
                    <div className="space-y-1.5 text-sm mb-4">
                      {(project.revenue > 0 || project.cost > 0) && (
                        <div className="flex items-center justify-between">
                          <span className="text-[hsl(var(--color-foreground-subtle))]">Revenue / Cost</span>
                          <span className="font-mono tabular-nums text-[hsl(var(--color-foreground))]">
                            {formatCurrency(project.revenue, project.currency)} / {formatCurrency(project.cost, project.currency)}
                          </span>
                        </div>
                      )}
                      {project.revenue > 0 && (
                        <div className="flex items-center justify-between">
                          <span className="text-[hsl(var(--color-foreground-subtle))]">Margin</span>
                          <span
                            className={`font-mono tabular-nums font-medium ${
                              margin >= 30
                                ? "text-emerald-400"
                                : margin >= 15
                                ? "text-amber-400"
                                : "text-red-400"
                            }`}
                          >
                            {margin}%
                          </span>
                        </div>
                      )}
                      {project.budget > 0 && (
                        <div className="flex items-center justify-between">
                          <span className="text-[hsl(var(--color-foreground-subtle))]">Budget</span>
                          <span className="font-mono tabular-nums text-[hsl(var(--color-foreground))]">
                            {formatCurrency(project.budget, project.currency)}
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Team avatars */}
                    {project.assignments && project.assignments.length > 0 && (
                      <div className="flex items-center gap-2 pt-4 border-t border-[hsl(var(--color-border))]/30">
                        <div className="flex -space-x-2">
                          {project.assignments.slice(0, 4).map((a, i) =>
                            a.contractor ? (
                              <Initials key={i} name={a.contractor.name} />
                            ) : null
                          )}
                          {project.assignments.length > 4 && (
                            <div className="w-7 h-7 rounded-full bg-[hsl(var(--color-background-muted))] border border-[hsl(var(--color-border))] text-[10px] flex items-center justify-center text-[hsl(var(--color-foreground-muted))] ring-2 ring-[hsl(var(--color-background-subtle))]">
                              +{project.assignments.length - 4}
                            </div>
                          )}
                        </div>
                        <span className="text-[10px] text-[hsl(var(--color-foreground-subtle))]">
                          {project.assignments.length} assigned
                        </span>
                      </div>
                    )}
                  </div>
                </Link>
              </motion.div>
            );
          })}
        </motion.div>
      )}

      {/* New Project Modal */}
      <AnimatePresence>
        {showForm && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm"
              onClick={() => setShowForm(false)}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.97 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.97 }}
              transition={{ duration: 0.2, ease: [0.25, 0.1, 0.25, 1] as const }}
              className="fixed inset-x-4 top-[5%] bottom-[5%] z-50 mx-auto max-w-lg bg-[hsl(var(--color-background-subtle))] border border-[hsl(var(--color-border))]/50 rounded-2xl shadow-2xl overflow-y-auto"
            >
              <div className="p-6">
                <h2 className="font-[family-name:var(--font-heading)] text-lg font-semibold mb-6">New Project</h2>
                <div className="space-y-4">
                  <FormField label="Project Name *">
                    <input
                      value={form.name}
                      onChange={(e) => setForm({ ...form, name: e.target.value })}
                      className="w-full px-4 py-3 rounded-xl bg-[hsl(var(--color-background))] border border-[hsl(var(--color-border))] text-[hsl(var(--color-foreground))] text-sm focus:outline-none focus:ring-2 focus:ring-[hsl(var(--color-accent))]/50 focus:border-[hsl(var(--color-accent))]/50"
                      placeholder="Project name"
                    />
                  </FormField>
                  <FormField label="Description">
                    <textarea
                      value={form.description}
                      onChange={(e) => setForm({ ...form, description: e.target.value })}
                      rows={3}
                      className="w-full px-4 py-3 rounded-xl bg-[hsl(var(--color-background))] border border-[hsl(var(--color-border))] text-[hsl(var(--color-foreground))] text-sm focus:outline-none focus:ring-2 focus:ring-[hsl(var(--color-accent))]/50 focus:border-[hsl(var(--color-accent))]/50 resize-none"
                      placeholder="Brief description"
                    />
                  </FormField>
                  <FormField label="Client">
                    <select
                      value={form.client_id}
                      onChange={(e) => setForm({ ...form, client_id: e.target.value })}
                      className="w-full px-4 py-3 rounded-xl bg-[hsl(var(--color-background))] border border-[hsl(var(--color-border))] text-[hsl(var(--color-foreground))] text-sm focus:outline-none focus:ring-2 focus:ring-[hsl(var(--color-accent))]/50 focus:border-[hsl(var(--color-accent))]/50"
                    >
                      <option value="">No client</option>
                      {clients.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.name}{c.company ? ` (${c.company})` : ""}
                        </option>
                      ))}
                    </select>
                  </FormField>
                  <div className="grid grid-cols-2 gap-3">
                    <FormField label="Status">
                      <select
                        value={form.status}
                        onChange={(e) => setForm({ ...form, status: e.target.value })}
                        className="w-full px-4 py-3 rounded-xl bg-[hsl(var(--color-background))] border border-[hsl(var(--color-border))] text-[hsl(var(--color-foreground))] text-sm focus:outline-none focus:ring-2 focus:ring-[hsl(var(--color-accent))]/50 focus:border-[hsl(var(--color-accent))]/50"
                      >
                        <option value="planning">Planning</option>
                        <option value="in_progress">In Progress</option>
                        <option value="review">Review</option>
                        <option value="on_hold">On Hold</option>
                      </select>
                    </FormField>
                    <FormField label="Priority">
                      <select
                        value={form.priority}
                        onChange={(e) => setForm({ ...form, priority: e.target.value })}
                        className="w-full px-4 py-3 rounded-xl bg-[hsl(var(--color-background))] border border-[hsl(var(--color-border))] text-[hsl(var(--color-foreground))] text-sm focus:outline-none focus:ring-2 focus:ring-[hsl(var(--color-accent))]/50 focus:border-[hsl(var(--color-accent))]/50"
                      >
                        <option value="low">Low</option>
                        <option value="medium">Medium</option>
                        <option value="high">High</option>
                        <option value="urgent">Urgent</option>
                      </select>
                    </FormField>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <FormField label="Start Date">
                      <input
                        type="date"
                        value={form.start_date}
                        onChange={(e) => setForm({ ...form, start_date: e.target.value })}
                        className="w-full px-4 py-3 rounded-xl bg-[hsl(var(--color-background))] border border-[hsl(var(--color-border))] text-[hsl(var(--color-foreground))] text-sm focus:outline-none focus:ring-2 focus:ring-[hsl(var(--color-accent))]/50 focus:border-[hsl(var(--color-accent))]/50"
                      />
                    </FormField>
                    <FormField label="Target End Date">
                      <input
                        type="date"
                        value={form.target_end_date}
                        onChange={(e) => setForm({ ...form, target_end_date: e.target.value })}
                        className="w-full px-4 py-3 rounded-xl bg-[hsl(var(--color-background))] border border-[hsl(var(--color-border))] text-[hsl(var(--color-foreground))] text-sm focus:outline-none focus:ring-2 focus:ring-[hsl(var(--color-accent))]/50 focus:border-[hsl(var(--color-accent))]/50"
                      />
                    </FormField>
                  </div>
                  <div className="grid grid-cols-3 gap-3">
                    <FormField label="Revenue">
                      <input
                        type="number"
                        value={form.revenue || ""}
                        onChange={(e) => setForm({ ...form, revenue: Number(e.target.value) })}
                        className="w-full px-4 py-3 rounded-xl bg-[hsl(var(--color-background))] border border-[hsl(var(--color-border))] text-[hsl(var(--color-foreground))] text-sm focus:outline-none focus:ring-2 focus:ring-[hsl(var(--color-accent))]/50 focus:border-[hsl(var(--color-accent))]/50"
                        placeholder="0"
                      />
                    </FormField>
                    <FormField label="Budget">
                      <input
                        type="number"
                        value={form.budget || ""}
                        onChange={(e) => setForm({ ...form, budget: Number(e.target.value) })}
                        className="w-full px-4 py-3 rounded-xl bg-[hsl(var(--color-background))] border border-[hsl(var(--color-border))] text-[hsl(var(--color-foreground))] text-sm focus:outline-none focus:ring-2 focus:ring-[hsl(var(--color-accent))]/50 focus:border-[hsl(var(--color-accent))]/50"
                        placeholder="0"
                      />
                    </FormField>
                    <FormField label="Currency">
                      <select
                        value={form.currency}
                        onChange={(e) => setForm({ ...form, currency: e.target.value })}
                        className="w-full px-4 py-3 rounded-xl bg-[hsl(var(--color-background))] border border-[hsl(var(--color-border))] text-[hsl(var(--color-foreground))] text-sm focus:outline-none focus:ring-2 focus:ring-[hsl(var(--color-accent))]/50 focus:border-[hsl(var(--color-accent))]/50"
                      >
                        <option value="AUD">AUD</option>
                        <option value="EUR">EUR</option>
                        <option value="USD">USD</option>
                        <option value="GBP">GBP</option>
                      </select>
                    </FormField>
                  </div>
                </div>
                <div className="flex items-center justify-end gap-3 mt-6 pt-4 border-t border-[hsl(var(--color-border))]/30">
                  <button
                    onClick={() => setShowForm(false)}
                    className="px-5 py-2.5 rounded-xl bg-transparent border border-[hsl(var(--color-border))] hover:bg-[hsl(var(--color-background-muted))]/50 text-sm text-[hsl(var(--color-foreground-muted))] hover:text-[hsl(var(--color-foreground))] transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSave}
                    disabled={saving || !form.name}
                    className="px-5 py-2.5 rounded-xl bg-[hsl(var(--color-accent))] text-white text-sm font-medium hover:bg-[hsl(var(--color-accent-hover))] transition-colors disabled:opacity-50"
                  >
                    {saving ? "Creating..." : "Create Project"}
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

function FormField({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="text-sm font-medium text-[hsl(var(--color-foreground-muted))] mb-1.5 block">
        {label}
      </label>
      {children}
    </div>
  );
}
