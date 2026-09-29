"use client";

import * as React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { AdminLoader } from "@/components/admin/AdminLoader";
import { IconPlus, IconUsers } from "@/components/admin/icons";

interface Contractor {
  id: string;
  name: string;
  email: string | null;
  role: string;
  skills: string[];
  hourly_rate: number;
  currency: string;
  timezone: string | null;
  country: string | null;
  portfolio_url: string | null;
  availability: "available" | "busy" | "unavailable" | "on_leave";
  capacity_hours_weekly: number;
  notes: string | null;
  avatar_url: string | null;
  status: "active" | "inactive" | "trial";
  hours_this_week: number;
  assignments: Array<{
    id: string;
    role: string;
    status: string;
    estimated_hours: number;
    actual_hours: number;
    project: { id: string; name: string; status: string } | null;
  }>;
}

const AVAILABILITY_CONFIG: Record<string, { label: string; color: string }> = {
  available: { label: "Available", color: "bg-emerald-500/15 text-emerald-400 border border-emerald-500/20" },
  busy: { label: "Busy", color: "bg-amber-500/15 text-amber-400 border border-amber-500/20" },
  unavailable: { label: "Unavailable", color: "bg-red-500/15 text-red-400 border border-red-500/20" },
  on_leave: { label: "On Leave", color: "bg-[hsl(var(--color-foreground-subtle))]/10 text-[hsl(var(--color-foreground-muted))] border border-[hsl(var(--color-border))]/30" },
};

const COUNTRY_FLAGS: Record<string, string> = {
  Germany: "\u{1F1E9}\u{1F1EA}", DE: "\u{1F1E9}\u{1F1EA}",
  Australia: "\u{1F1E6}\u{1F1FA}", AU: "\u{1F1E6}\u{1F1FA}",
  "United States": "\u{1F1FA}\u{1F1F8}", US: "\u{1F1FA}\u{1F1F8}",
  "United Kingdom": "\u{1F1EC}\u{1F1E7}", UK: "\u{1F1EC}\u{1F1E7}", GB: "\u{1F1EC}\u{1F1E7}",
  France: "\u{1F1EB}\u{1F1F7}", FR: "\u{1F1EB}\u{1F1F7}",
  Netherlands: "\u{1F1F3}\u{1F1F1}", NL: "\u{1F1F3}\u{1F1F1}",
  Spain: "\u{1F1EA}\u{1F1F8}", ES: "\u{1F1EA}\u{1F1F8}",
  Italy: "\u{1F1EE}\u{1F1F9}", IT: "\u{1F1EE}\u{1F1F9}",
  Portugal: "\u{1F1F5}\u{1F1F9}", PT: "\u{1F1F5}\u{1F1F9}",
  Canada: "\u{1F1E8}\u{1F1E6}", CA: "\u{1F1E8}\u{1F1E6}",
  India: "\u{1F1EE}\u{1F1F3}", IN: "\u{1F1EE}\u{1F1F3}",
  Japan: "\u{1F1EF}\u{1F1F5}", JP: "\u{1F1EF}\u{1F1F5}",
  Brazil: "\u{1F1E7}\u{1F1F7}", BR: "\u{1F1E7}\u{1F1F7}",
  Philippines: "\u{1F1F5}\u{1F1ED}", PH: "\u{1F1F5}\u{1F1ED}",
  Nigeria: "\u{1F1F3}\u{1F1EC}", NG: "\u{1F1F3}\u{1F1EC}",
  Poland: "\u{1F1F5}\u{1F1F1}", PL: "\u{1F1F5}\u{1F1F1}",
  Ukraine: "\u{1F1FA}\u{1F1E6}", UA: "\u{1F1FA}\u{1F1E6}",
  Argentina: "\u{1F1E6}\u{1F1F7}", AR: "\u{1F1E6}\u{1F1F7}",
  Mexico: "\u{1F1F2}\u{1F1FD}", MX: "\u{1F1F2}\u{1F1FD}",
  Colombia: "\u{1F1E8}\u{1F1F4}", CO: "\u{1F1E8}\u{1F1F4}",
  Kenya: "\u{1F1F0}\u{1F1EA}", KE: "\u{1F1F0}\u{1F1EA}",
  "South Africa": "\u{1F1FF}\u{1F1E6}", ZA: "\u{1F1FF}\u{1F1E6}",
};

const AVATAR_GRADIENTS = [
  "from-violet-500/30 to-indigo-500/30",
  "from-cyan-500/30 to-blue-500/30",
  "from-rose-500/30 to-pink-500/30",
  "from-amber-500/30 to-orange-500/30",
  "from-emerald-500/30 to-teal-500/30",
  "from-fuchsia-500/30 to-purple-500/30",
];

function getGradient(name: string) {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  return AVATAR_GRADIENTS[Math.abs(hash) % AVATAR_GRADIENTS.length];
}

const staggerContainer = {
  hidden: {},
  show: { transition: { staggerChildren: 0.06 } },
};

const fadeUp = {
  hidden: { opacity: 0, y: 12 },
  show: { opacity: 1, y: 0, transition: { duration: 0.4, ease: [0.25, 0.1, 0.25, 1] as const } },
};

const EMPTY_FORM: Omit<Contractor, "id" | "hours_this_week" | "assignments"> = {
  name: "",
  email: null,
  role: "",
  skills: [],
  hourly_rate: 0,
  currency: "EUR",
  timezone: null,
  country: null,
  portfolio_url: null,
  availability: "available",
  capacity_hours_weekly: 40,
  notes: null,
  avatar_url: null,
  status: "active",
};

export default function TeamPage() {
  const [contractors, setContractors] = React.useState<Contractor[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [expandedId, setExpandedId] = React.useState<string | null>(null);
  const [showForm, setShowForm] = React.useState(false);
  const [editingId, setEditingId] = React.useState<string | null>(null);
  const [form, setForm] = React.useState(EMPTY_FORM);
  const [skillInput, setSkillInput] = React.useState("");
  const [saving, setSaving] = React.useState(false);
  const [filter, setFilter] = React.useState<"all" | "active" | "inactive">("all");

  async function fetchTeam() {
    try {
      const res = await fetch("/api/admin/team");
      if (res.ok) {
        const data = await res.json();
        setContractors(data);
      }
    } catch (error) {
      console.error("Failed to fetch team:", error);
    } finally {
      setLoading(false);
    }
  }

  React.useEffect(() => {
    fetchTeam();
  }, []);

  function openAddForm() {
    setForm(EMPTY_FORM);
    setEditingId(null);
    setSkillInput("");
    setShowForm(true);
  }

  function openEditForm(c: Contractor) {
    setForm({
      name: c.name,
      email: c.email,
      role: c.role,
      skills: c.skills || [],
      hourly_rate: c.hourly_rate,
      currency: c.currency,
      timezone: c.timezone,
      country: c.country,
      portfolio_url: c.portfolio_url,
      availability: c.availability,
      capacity_hours_weekly: c.capacity_hours_weekly,
      notes: c.notes,
      avatar_url: c.avatar_url,
      status: c.status,
    });
    setEditingId(c.id);
    setSkillInput("");
    setShowForm(true);
  }

  async function handleSave() {
    setSaving(true);
    try {
      const url = editingId ? `/api/admin/team/${editingId}` : "/api/admin/team";
      const method = editingId ? "PATCH" : "POST";
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (res.ok) {
        setShowForm(false);
        fetchTeam();
      }
    } catch (error) {
      console.error("Save failed:", error);
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("Delete this team member?")) return;
    try {
      await fetch(`/api/admin/team/${id}`, { method: "DELETE" });
      fetchTeam();
    } catch (error) {
      console.error("Delete failed:", error);
    }
  }

  function addSkill() {
    const skill = skillInput.trim();
    if (skill && !form.skills.includes(skill)) {
      setForm({ ...form, skills: [...form.skills, skill] });
      setSkillInput("");
    }
  }

  function removeSkill(skill: string) {
    setForm({ ...form, skills: form.skills.filter((s) => s !== skill) });
  }

  const filtered = contractors.filter((c) => {
    if (filter === "active") return c.status === "active";
    if (filter === "inactive") return c.status !== "active";
    return true;
  });

  if (loading) return <AdminLoader message="Loading team..." />;

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
          <h1 className="font-[family-name:var(--font-heading)] text-3xl font-semibold tracking-tight mb-1">Team</h1>
          <p className="text-[hsl(var(--color-foreground-muted))]">
            {contractors.length} team member{contractors.length !== 1 ? "s" : ""}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex rounded-xl border border-[hsl(var(--color-border))]/50 overflow-hidden">
            {(["all", "active", "inactive"] as const).map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`px-3 py-1.5 text-xs font-medium capitalize transition-colors ${
                  filter === f
                    ? "bg-[hsl(var(--color-accent))]/10 text-[hsl(var(--color-foreground))]"
                    : "text-[hsl(var(--color-foreground-muted))] hover:text-[hsl(var(--color-foreground))]"
                }`}
              >
                {f}
              </button>
            ))}
          </div>
          <button
            onClick={openAddForm}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[hsl(var(--color-accent))] text-white hover:bg-[hsl(var(--color-accent-hover))] transition-colors text-sm font-medium"
          >
            <IconPlus size={16} />
            Add Member
          </button>
        </div>
      </motion.div>

      {/* Grid */}
      {filtered.length === 0 ? (
        <motion.div variants={fadeUp}>
          <div className="min-h-[400px] flex items-center justify-center">
            <div className="border-2 border-dashed border-[hsl(var(--color-border))]/30 rounded-2xl p-12 flex flex-col items-center text-center max-w-md">
              <IconUsers size={48} className="mb-4 text-[hsl(var(--color-foreground-subtle))]" />
              <p className="text-lg font-medium text-[hsl(var(--color-foreground-muted))] mb-1">No team members yet</p>
              <p className="text-sm text-[hsl(var(--color-foreground-subtle))] mb-5">Add contractors and freelancers to your team</p>
              <button
                onClick={openAddForm}
                className="px-5 py-2.5 bg-[hsl(var(--color-accent))] hover:bg-[hsl(var(--color-accent-hover))] text-white rounded-xl text-sm font-medium transition-colors"
              >
                Add your first team member
              </button>
            </div>
          </div>
        </motion.div>
      ) : (
        <motion.div
          className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6"
          variants={staggerContainer}
        >
          {filtered.map((c) => {
            const isExpanded = expandedId === c.id;
            const utilization = c.capacity_hours_weekly > 0
              ? Math.round((c.hours_this_week / c.capacity_hours_weekly) * 100)
              : 0;
            const avail = AVAILABILITY_CONFIG[c.availability] || AVAILABILITY_CONFIG.available;
            const flag = c.country ? COUNTRY_FLAGS[c.country] || "" : "";
            const activeProjects = (c.assignments || []).filter(
              (a) => a.status === "active" && a.project?.status !== "completed"
            );
            const gradient = getGradient(c.name);

            return (
              <motion.div
                key={c.id}
                variants={fadeUp}
                className="bg-[hsl(var(--color-background-subtle))]/50 backdrop-blur-sm border border-[hsl(var(--color-border))]/50 rounded-2xl hover:border-[hsl(var(--color-border-strong))]/60 hover:bg-[hsl(var(--color-background-subtle))]/80 hover:shadow-lg hover:shadow-black/5 transition-all duration-200"
              >
                <div className="p-6">
                  {/* Top row */}
                  <div className="flex items-start gap-4 mb-4">
                    <div className={`w-14 h-14 rounded-full bg-gradient-to-br ${gradient} text-[hsl(var(--color-foreground))] flex items-center justify-center font-semibold text-base shrink-0`}>
                      {c.name
                        .split(" ")
                        .map((n) => n[0])
                        .join("")
                        .toUpperCase()
                        .slice(0, 2)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-[hsl(var(--color-foreground))] truncate">
                        {c.name}
                      </p>
                      <p className="text-sm text-[hsl(var(--color-foreground-muted))]">
                        {c.role}
                      </p>
                    </div>
                    <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${avail.color}`}>
                      {avail.label}
                    </span>
                  </div>

                  {/* Details */}
                  <div className="space-y-2.5 text-sm">
                    <div className="flex items-center justify-between">
                      <span className="text-[hsl(var(--color-foreground-subtle))]">Rate</span>
                      <span className="font-mono tabular-nums text-[hsl(var(--color-foreground))]">
                        {c.currency} {Number(c.hourly_rate).toFixed(0)}/hr
                      </span>
                    </div>
                    {(c.timezone || c.country) && (
                      <div className="flex items-center justify-between">
                        <span className="text-[hsl(var(--color-foreground-subtle))]">Location</span>
                        <span className="text-[hsl(var(--color-foreground))]">
                          {flag && <span className="mr-1">{flag}</span>}
                          {c.timezone || c.country}
                        </span>
                      </div>
                    )}
                    {/* Capacity bar */}
                    <div>
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="text-[hsl(var(--color-foreground-subtle))]">This week</span>
                        <span className="text-xs font-mono tabular-nums text-[hsl(var(--color-foreground-muted))]">
                          {c.hours_this_week.toFixed(1)}h / {c.capacity_hours_weekly}h
                        </span>
                      </div>
                      <div className="h-2 bg-[hsl(var(--color-background-muted))]/50 rounded-full overflow-hidden shadow-[inset_0_1px_0_rgba(255,255,255,0.1)]">
                        <div
                          className={`h-full rounded-full transition-all duration-500 ${
                            utilization > 90
                              ? "bg-red-500"
                              : utilization > 70
                              ? "bg-amber-500"
                              : utilization > 50
                              ? "bg-amber-400"
                              : "bg-[hsl(var(--color-accent))]"
                          }`}
                          style={{ width: `${Math.min(utilization, 100)}%` }}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Skills */}
                  {c.skills && c.skills.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 mt-4">
                      {c.skills.slice(0, 4).map((skill) => (
                        <span
                          key={skill}
                          className="px-2.5 py-1 text-[10px] rounded-full bg-[hsl(var(--color-foreground-subtle))]/10 text-[hsl(var(--color-foreground-muted))] border border-[hsl(var(--color-border))]/30"
                        >
                          {skill}
                        </span>
                      ))}
                      {c.skills.length > 4 && (
                        <span className="px-2.5 py-1 text-[10px] rounded-full text-[hsl(var(--color-foreground-subtle))]">
                          +{c.skills.length - 4}
                        </span>
                      )}
                    </div>
                  )}

                  {/* Actions */}
                  <div className="flex items-center gap-2 mt-4 pt-4 border-t border-[hsl(var(--color-border))]/30">
                    <button
                      onClick={() => setExpandedId(isExpanded ? null : c.id)}
                      className="text-xs text-[hsl(var(--color-accent))] hover:underline"
                    >
                      {isExpanded ? "Collapse" : "Details"}
                    </button>
                    <span className="text-[hsl(var(--color-border))]">&middot;</span>
                    <button
                      onClick={() => openEditForm(c)}
                      className="text-xs text-[hsl(var(--color-foreground-muted))] hover:text-[hsl(var(--color-foreground))]"
                    >
                      Edit
                    </button>
                    <span className="text-[hsl(var(--color-border))]">&middot;</span>
                    <button
                      onClick={() => handleDelete(c.id)}
                      className="text-xs text-red-400 hover:underline"
                    >
                      Delete
                    </button>
                  </div>
                </div>

                {/* Expanded details */}
                <AnimatePresence>
                  {isExpanded && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.2 }}
                      className="overflow-hidden border-t border-[hsl(var(--color-border))]/30"
                    >
                      <div className="p-6 space-y-4">
                        {activeProjects.length > 0 && (
                          <div>
                            <p className="text-xs font-medium text-[hsl(var(--color-foreground-subtle))] mb-2">
                              Active Projects
                            </p>
                            <div className="space-y-1.5">
                              {activeProjects.map((a) => (
                                <div
                                  key={a.id}
                                  className="flex items-center justify-between text-sm"
                                >
                                  <span className="text-[hsl(var(--color-foreground))]">
                                    {a.project?.name || "Unknown"}
                                  </span>
                                  <span className="text-xs font-mono tabular-nums text-[hsl(var(--color-foreground-subtle))]">
                                    {Number(a.actual_hours).toFixed(1)}h / {Number(a.estimated_hours).toFixed(0)}h
                                  </span>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                        {c.email && (
                          <div className="text-sm">
                            <span className="text-[hsl(var(--color-foreground-subtle))]">Email: </span>
                            <span className="text-[hsl(var(--color-foreground))]">{c.email}</span>
                          </div>
                        )}
                        {c.notes && (
                          <div className="text-sm">
                            <span className="text-[hsl(var(--color-foreground-subtle))]">Notes: </span>
                            <span className="text-[hsl(var(--color-foreground))]">{c.notes}</span>
                          </div>
                        )}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            );
          })}
        </motion.div>
      )}

      {/* Add/Edit Modal */}
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
                <h2 className="font-[family-name:var(--font-heading)] text-lg font-semibold mb-6">
                  {editingId ? "Edit Team Member" : "Add Team Member"}
                </h2>

                {/* Personal Info Section */}
                <div className="space-y-4">
                  <p className="text-xs font-medium text-[hsl(var(--color-foreground-subtle))]">Personal Info</p>
                  <FormField label="Name *">
                    <input
                      value={form.name}
                      onChange={(e) => setForm({ ...form, name: e.target.value })}
                      className="w-full px-4 py-3 rounded-xl bg-[hsl(var(--color-background))] border border-[hsl(var(--color-border))] text-[hsl(var(--color-foreground))] text-sm focus:outline-none focus:ring-2 focus:ring-[hsl(var(--color-accent))]/50 focus:border-[hsl(var(--color-accent))]/50"
                      placeholder="Full name"
                    />
                  </FormField>
                  <FormField label="Email">
                    <input
                      type="email"
                      value={form.email || ""}
                      onChange={(e) => setForm({ ...form, email: e.target.value || null })}
                      className="w-full px-4 py-3 rounded-xl bg-[hsl(var(--color-background))] border border-[hsl(var(--color-border))] text-[hsl(var(--color-foreground))] text-sm focus:outline-none focus:ring-2 focus:ring-[hsl(var(--color-accent))]/50 focus:border-[hsl(var(--color-accent))]/50"
                      placeholder="email@example.com"
                    />
                  </FormField>
                  <div className="grid grid-cols-2 gap-3">
                    <FormField label="Country">
                      <input
                        value={form.country || ""}
                        onChange={(e) => setForm({ ...form, country: e.target.value || null })}
                        className="w-full px-4 py-3 rounded-xl bg-[hsl(var(--color-background))] border border-[hsl(var(--color-border))] text-[hsl(var(--color-foreground))] text-sm focus:outline-none focus:ring-2 focus:ring-[hsl(var(--color-accent))]/50 focus:border-[hsl(var(--color-accent))]/50"
                        placeholder="e.g. Germany"
                      />
                    </FormField>
                    <FormField label="Timezone">
                      <input
                        value={form.timezone || ""}
                        onChange={(e) => setForm({ ...form, timezone: e.target.value || null })}
                        className="w-full px-4 py-3 rounded-xl bg-[hsl(var(--color-background))] border border-[hsl(var(--color-border))] text-[hsl(var(--color-foreground))] text-sm focus:outline-none focus:ring-2 focus:ring-[hsl(var(--color-accent))]/50 focus:border-[hsl(var(--color-accent))]/50"
                        placeholder="Europe/Berlin"
                      />
                    </FormField>
                  </div>
                </div>

                {/* Professional Section */}
                <div className="space-y-4 mt-6 pt-6 border-t border-[hsl(var(--color-border))]/30">
                  <p className="text-xs font-medium text-[hsl(var(--color-foreground-subtle))]">Professional</p>
                  <FormField label="Role *">
                    <input
                      value={form.role}
                      onChange={(e) => setForm({ ...form, role: e.target.value })}
                      className="w-full px-4 py-3 rounded-xl bg-[hsl(var(--color-background))] border border-[hsl(var(--color-border))] text-[hsl(var(--color-foreground))] text-sm focus:outline-none focus:ring-2 focus:ring-[hsl(var(--color-accent))]/50 focus:border-[hsl(var(--color-accent))]/50"
                      placeholder="e.g. UI Designer, Developer"
                    />
                  </FormField>
                  <div className="grid grid-cols-2 gap-3">
                    <FormField label="Hourly Rate *">
                      <input
                        type="number"
                        value={form.hourly_rate || ""}
                        onChange={(e) => setForm({ ...form, hourly_rate: Number(e.target.value) })}
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
                        <option value="EUR">EUR</option>
                        <option value="USD">USD</option>
                        <option value="AUD">AUD</option>
                        <option value="GBP">GBP</option>
                      </select>
                    </FormField>
                  </div>
                  <FormField label="Skills">
                    <div className="flex gap-2">
                      <input
                        value={skillInput}
                        onChange={(e) => setSkillInput(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") {
                            e.preventDefault();
                            addSkill();
                          }
                        }}
                        className="flex-1 px-4 py-3 rounded-xl bg-[hsl(var(--color-background))] border border-[hsl(var(--color-border))] text-[hsl(var(--color-foreground))] text-sm focus:outline-none focus:ring-2 focus:ring-[hsl(var(--color-accent))]/50 focus:border-[hsl(var(--color-accent))]/50"
                        placeholder="Add skill + Enter"
                      />
                      <button
                        type="button"
                        onClick={addSkill}
                        className="px-4 py-3 rounded-xl bg-transparent border border-[hsl(var(--color-border))] hover:bg-[hsl(var(--color-background-muted))]/50 text-sm text-[hsl(var(--color-foreground-muted))] hover:text-[hsl(var(--color-foreground))] transition-colors"
                      >
                        Add
                      </button>
                    </div>
                    {form.skills.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 mt-2">
                        {form.skills.map((skill) => (
                          <span
                            key={skill}
                            className="inline-flex items-center gap-1 px-2.5 py-1 text-xs rounded-full bg-[hsl(var(--color-foreground-subtle))]/10 text-[hsl(var(--color-foreground-muted))] border border-[hsl(var(--color-border))]/30"
                          >
                            {skill}
                            <button
                              type="button"
                              onClick={() => removeSkill(skill)}
                              className="text-[hsl(var(--color-foreground-subtle))] hover:text-red-400"
                            >
                              &times;
                            </button>
                          </span>
                        ))}
                      </div>
                    )}
                  </FormField>
                </div>

                {/* Availability Section */}
                <div className="space-y-4 mt-6 pt-6 border-t border-[hsl(var(--color-border))]/30">
                  <p className="text-xs font-medium text-[hsl(var(--color-foreground-subtle))]">Availability</p>
                  <div className="grid grid-cols-2 gap-3">
                    <FormField label="Weekly Capacity (hrs)">
                      <input
                        type="number"
                        value={form.capacity_hours_weekly}
                        onChange={(e) => setForm({ ...form, capacity_hours_weekly: Number(e.target.value) })}
                        className="w-full px-4 py-3 rounded-xl bg-[hsl(var(--color-background))] border border-[hsl(var(--color-border))] text-[hsl(var(--color-foreground))] text-sm focus:outline-none focus:ring-2 focus:ring-[hsl(var(--color-accent))]/50 focus:border-[hsl(var(--color-accent))]/50"
                      />
                    </FormField>
                    <FormField label="Availability">
                      <select
                        value={form.availability}
                        onChange={(e) =>
                          setForm({ ...form, availability: e.target.value as Contractor["availability"] })
                        }
                        className="w-full px-4 py-3 rounded-xl bg-[hsl(var(--color-background))] border border-[hsl(var(--color-border))] text-[hsl(var(--color-foreground))] text-sm focus:outline-none focus:ring-2 focus:ring-[hsl(var(--color-accent))]/50 focus:border-[hsl(var(--color-accent))]/50"
                      >
                        <option value="available">Available</option>
                        <option value="busy">Busy</option>
                        <option value="unavailable">Unavailable</option>
                        <option value="on_leave">On Leave</option>
                      </select>
                    </FormField>
                  </div>
                  <FormField label="Notes">
                    <textarea
                      value={form.notes || ""}
                      onChange={(e) => setForm({ ...form, notes: e.target.value || null })}
                      rows={3}
                      className="w-full px-4 py-3 rounded-xl bg-[hsl(var(--color-background))] border border-[hsl(var(--color-border))] text-[hsl(var(--color-foreground))] text-sm focus:outline-none focus:ring-2 focus:ring-[hsl(var(--color-accent))]/50 focus:border-[hsl(var(--color-accent))]/50 resize-none"
                      placeholder="Any notes..."
                    />
                  </FormField>
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
                    disabled={saving || !form.name || !form.role || !form.hourly_rate}
                    className="px-5 py-2.5 rounded-xl bg-[hsl(var(--color-accent))] text-white text-sm font-medium hover:bg-[hsl(var(--color-accent-hover))] transition-colors disabled:opacity-50"
                  >
                    {saving ? "Saving..." : editingId ? "Update" : "Add Member"}
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
