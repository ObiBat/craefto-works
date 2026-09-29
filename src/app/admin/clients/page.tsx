"use client";

import * as React from "react";
import Link from "next/link";
import { AdminLoader } from "@/components/admin/AdminLoader";
import { PageHeader, EmptyState } from "@/components/admin/ui";
import { IconPlus, IconUsers, IconChevronRight, IconMail } from "@/components/admin/icons";

interface ClientStats {
  activeProjects: number;
  totalProjects: number;
  totalBudget: number;
  totalSpent: number;
  totalPaid: number;
  totalPending: number;
  overallHealth: string;
}

interface Client {
  id: string;
  name: string;
  company: string | null;
  email: string | null;
  phone: string | null;
  industry: string | null;
  status: string;
  created_at: string;
  stats: ClientStats;
}

function formatCurrency(amount: number) {
  return new Intl.NumberFormat("en-AU", {
    style: "currency",
    currency: "AUD",
    minimumFractionDigits: 0,
  }).format(amount);
}

function formatDate(dateString: string) {
  return new Date(dateString).toLocaleDateString("en-AU", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function getStatusConfig(status: string) {
  const config: Record<string, { bg: string; text: string; label: string }> = {
    lead: { bg: "bg-blue-500/15", text: "text-blue-600", label: "Lead" },
    active: { bg: "bg-green-500/15", text: "text-green-600", label: "Active" },
    completed: { bg: "bg-purple-500/15", text: "text-purple-600", label: "Completed" },
    churned: { bg: "bg-red-500/15", text: "text-red-600", label: "Churned" },
  };
  return config[status] || config.active;
}

function getHealthConfig(health: string) {
  const config: Record<string, { bg: string; text: string; icon: string }> = {
    on_track: { bg: "bg-green-500/15", text: "text-green-600", icon: "✓" },
    at_risk: { bg: "bg-yellow-500/15", text: "text-yellow-600", icon: "!" },
    delayed: { bg: "bg-orange-500/15", text: "text-orange-600", icon: "⏱" },
    blocked: { bg: "bg-red-500/15", text: "text-red-600", icon: "✕" },
  };
  return config[health] || config.on_track;
}

export default function ClientsPage() {
  const [clients, setClients] = React.useState<Client[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [statusFilter, setStatusFilter] = React.useState("all");
  const [showNewModal, setShowNewModal] = React.useState(false);
  const [newClient, setNewClient] = React.useState({
    name: "",
    company: "",
    email: "",
    phone: "",
    industry: "",
    status: "active",
  });

  const fetchClients = React.useCallback(async () => {
    try {
      const url = statusFilter === "all"
        ? "/api/admin/clients"
        : `/api/admin/clients?status=${statusFilter}`;
      const res = await fetch(url);
      if (res.ok) {
        const data = await res.json();
        setClients(data);
      }
    } catch (error) {
      console.error("Failed to fetch clients:", error);
    } finally {
      setLoading(false);
    }
  }, [statusFilter]);

  React.useEffect(() => {
    setLoading(true);
    fetchClients();
  }, [fetchClients]);

  const handleCreateClient = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch("/api/admin/clients", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newClient),
      });
      if (res.ok) {
        setShowNewModal(false);
        setNewClient({ name: "", company: "", email: "", phone: "", industry: "", status: "active" });
        fetchClients();
      }
    } catch (error) {
      console.error("Failed to create client:", error);
    }
  };

  // Calculate summary stats
  const summaryStats = React.useMemo(() => {
    const totalClients = clients.length;
    const activeClients = clients.filter(c => c.status === "active").length;
    const totalRevenue = clients.reduce((sum, c) => sum + c.stats.totalPaid, 0);
    const totalPending = clients.reduce((sum, c) => sum + c.stats.totalPending, 0);
    const activeProjects = clients.reduce((sum, c) => sum + c.stats.activeProjects, 0);
    
    return { totalClients, activeClients, totalRevenue, totalPending, activeProjects };
  }, [clients]);

  if (loading) {
    return <AdminLoader message="Loading clients..." />;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <PageHeader
        title="Clients"
        subtitle="Manage clients, projects, and track their progress"
        actions={
          <button
            onClick={() => setShowNewModal(true)}
            className="px-4 py-2.5 bg-[hsl(var(--color-accent))] text-black font-medium rounded-xl hover:bg-[hsl(var(--color-accent-hover))] transition-colors inline-flex items-center gap-2"
          >
            <IconPlus size={20} />
            New Client
          </button>
        }
      />

      {/* Summary Stats */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <div className="bg-[hsl(var(--color-background-muted))] border border-[hsl(var(--color-border))] rounded-xl p-4">
          <p className="text-[hsl(var(--color-foreground-subtle))] text-xs mb-1">Total Clients</p>
          <p className="text-2xl font-semibold text-[hsl(var(--color-foreground))]">{summaryStats.totalClients}</p>
        </div>
        <div className="bg-[hsl(var(--color-background-muted))] border border-[hsl(var(--color-border))] rounded-xl p-4">
          <p className="text-[hsl(var(--color-foreground-subtle))] text-xs mb-1">Active Clients</p>
          <p className="text-2xl font-semibold text-green-600">{summaryStats.activeClients}</p>
        </div>
        <div className="bg-[hsl(var(--color-background-muted))] border border-[hsl(var(--color-border))] rounded-xl p-4">
          <p className="text-[hsl(var(--color-foreground-subtle))] text-xs mb-1">Active Projects</p>
          <p className="text-2xl font-semibold text-blue-600">{summaryStats.activeProjects}</p>
        </div>
        <div className="bg-[hsl(var(--color-background-muted))] border border-[hsl(var(--color-border))] rounded-xl p-4">
          <p className="text-[hsl(var(--color-foreground-subtle))] text-xs mb-1">Revenue</p>
          <p className="text-2xl font-semibold text-[hsl(var(--color-accent))]">{formatCurrency(summaryStats.totalRevenue)}</p>
        </div>
        <div className="bg-[hsl(var(--color-background-muted))] border border-[hsl(var(--color-border))] rounded-xl p-4">
          <p className="text-[hsl(var(--color-foreground-subtle))] text-xs mb-1">Pending</p>
          <p className="text-2xl font-semibold text-yellow-600">{formatCurrency(summaryStats.totalPending)}</p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-2 border-b border-[hsl(var(--color-border))] pb-4">
        {["all", "active", "lead", "completed", "churned"].map((status) => (
          <button
            key={status}
            onClick={() => setStatusFilter(status)}
            className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors ${
              statusFilter === status
                ? "bg-[hsl(var(--color-background-subtle))] text-[hsl(var(--color-foreground))]"
                : "text-[hsl(var(--color-foreground-subtle))] hover:text-[hsl(var(--color-foreground))]"
            }`}
          >
            {status === "all" ? "All" : status.charAt(0).toUpperCase() + status.slice(1)}
          </button>
        ))}
      </div>

      {/* Clients List */}
      <div className="space-y-3">
        {clients.length === 0 ? (
          <EmptyState
            icon={<IconUsers size={48} />}
            title="No clients yet"
            description="Add your first client to get started"
            action={
              <button
                onClick={() => setShowNewModal(true)}
                className="px-4 py-2 bg-[hsl(var(--color-accent))] text-black text-sm font-medium rounded-xl hover:bg-[hsl(var(--color-accent-hover))] transition-colors"
              >
                Add Client
              </button>
            }
          />
        ) : (
          clients.map((client) => {
            const statusConfig = getStatusConfig(client.status);
            const healthConfig = getHealthConfig(client.stats.overallHealth);

            return (
              <Link
                key={client.id}
                href={`/admin/clients/${client.id}`}
                className="block bg-[hsl(var(--color-background-muted))] border border-[hsl(var(--color-border))] rounded-xl p-5 hover:border-[hsl(var(--color-accent))]/50 transition-colors"
              >
                <div className="flex justify-between items-start gap-4">
                  <div className="flex-1 min-w-0">
                    {/* Tags Row */}
                    <div className="flex items-center gap-2 mb-3 flex-wrap">
                      <span className={`px-2.5 py-1 rounded-md text-xs font-medium ${statusConfig.bg} ${statusConfig.text}`}>
                        {statusConfig.label}
                      </span>
                      {client.stats.activeProjects > 0 && (
                        <span className={`px-2.5 py-1 rounded-md text-xs font-medium ${healthConfig.bg} ${healthConfig.text}`}>
                          {healthConfig.icon} {client.stats.activeProjects} active project{client.stats.activeProjects !== 1 ? "s" : ""}
                        </span>
                      )}
                      {client.industry && (
                        <span className="px-2.5 py-1 rounded-md text-xs bg-[hsl(var(--color-background-subtle))] text-[hsl(var(--color-foreground-muted))]">
                          {client.industry}
                        </span>
                      )}
                    </div>

                    {/* Name & Company */}
                    <h3 className="text-base font-medium text-[hsl(var(--color-foreground))] mb-1">{client.name}</h3>
                    {client.company && (
                      <p className="text-[hsl(var(--color-foreground-muted))] text-sm mb-2">{client.company}</p>
                    )}

                    {/* Contact Info */}
                    <div className="flex flex-wrap gap-4 text-xs text-[hsl(var(--color-foreground-subtle))]">
                      {client.email && (
                        <span className="flex items-center gap-1">
                          <IconMail size={14} />
                          {client.email}
                        </span>
                      )}
                      <span>Client since {formatDate(client.created_at)}</span>
                    </div>
                  </div>

                  {/* Financial Summary */}
                  <div className="flex items-center gap-6 flex-shrink-0">
                    <div className="text-right">
                      <p className="text-xs text-[hsl(var(--color-foreground-subtle))] mb-1">Total Budget</p>
                      <p className="text-lg font-semibold text-[hsl(var(--color-foreground))]">
                        {formatCurrency(client.stats.totalBudget)}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-[hsl(var(--color-foreground-subtle))] mb-1">Paid</p>
                      <p className="text-lg font-semibold text-green-600">
                        {formatCurrency(client.stats.totalPaid)}
                      </p>
                    </div>
                    {client.stats.totalPending > 0 && (
                      <div className="text-right">
                        <p className="text-xs text-[hsl(var(--color-foreground-subtle))] mb-1">Pending</p>
                        <p className="text-lg font-semibold text-yellow-600">
                          {formatCurrency(client.stats.totalPending)}
                        </p>
                      </div>
                    )}
                    <IconChevronRight size={20} className="text-[hsl(var(--color-foreground-subtle))]" />
                  </div>
                </div>
              </Link>
            );
          })
        )}
      </div>

      {/* New Client Modal */}
      {showNewModal && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <div className="bg-[hsl(var(--color-background-muted))] border border-[hsl(var(--color-border))] rounded-2xl max-w-md w-full">
            <div className="p-6 border-b border-[hsl(var(--color-border))]">
              <h2 className="text-lg font-semibold text-[hsl(var(--color-foreground))]">New Client</h2>
            </div>
            <form onSubmit={handleCreateClient} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-[hsl(var(--color-foreground))] mb-1">Name *</label>
                <input
                  type="text"
                  value={newClient.name}
                  onChange={(e) => setNewClient({ ...newClient, name: e.target.value })}
                  required
                  className="w-full px-4 py-2 bg-[hsl(var(--color-background-subtle))] border border-[hsl(var(--color-border))] rounded-xl text-[hsl(var(--color-foreground))] placeholder-[hsl(var(--color-foreground-subtle))] focus:outline-none focus:ring-2 focus:ring-[hsl(var(--color-accent))]/50"
                  placeholder="Contact name"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-[hsl(var(--color-foreground))] mb-1">Company</label>
                <input
                  type="text"
                  value={newClient.company}
                  onChange={(e) => setNewClient({ ...newClient, company: e.target.value })}
                  className="w-full px-4 py-2 bg-[hsl(var(--color-background-subtle))] border border-[hsl(var(--color-border))] rounded-xl text-[hsl(var(--color-foreground))] placeholder-[hsl(var(--color-foreground-subtle))] focus:outline-none focus:ring-2 focus:ring-[hsl(var(--color-accent))]/50"
                  placeholder="Company name"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-[hsl(var(--color-foreground))] mb-1">Email</label>
                  <input
                    type="email"
                    value={newClient.email}
                    onChange={(e) => setNewClient({ ...newClient, email: e.target.value })}
                    className="w-full px-4 py-2 bg-[hsl(var(--color-background-subtle))] border border-[hsl(var(--color-border))] rounded-xl text-[hsl(var(--color-foreground))] placeholder-[hsl(var(--color-foreground-subtle))] focus:outline-none focus:ring-2 focus:ring-[hsl(var(--color-accent))]/50"
                    placeholder="email@example.com"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-[hsl(var(--color-foreground))] mb-1">Phone</label>
                  <input
                    type="tel"
                    value={newClient.phone}
                    onChange={(e) => setNewClient({ ...newClient, phone: e.target.value })}
                    className="w-full px-4 py-2 bg-[hsl(var(--color-background-subtle))] border border-[hsl(var(--color-border))] rounded-xl text-[hsl(var(--color-foreground))] placeholder-[hsl(var(--color-foreground-subtle))] focus:outline-none focus:ring-2 focus:ring-[hsl(var(--color-accent))]/50"
                    placeholder="+61 4XX XXX XXX"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-[hsl(var(--color-foreground))] mb-1">Industry</label>
                  <input
                    type="text"
                    value={newClient.industry}
                    onChange={(e) => setNewClient({ ...newClient, industry: e.target.value })}
                    className="w-full px-4 py-2 bg-[hsl(var(--color-background-subtle))] border border-[hsl(var(--color-border))] rounded-xl text-[hsl(var(--color-foreground))] placeholder-[hsl(var(--color-foreground-subtle))] focus:outline-none focus:ring-2 focus:ring-[hsl(var(--color-accent))]/50"
                    placeholder="e.g. Technology"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-[hsl(var(--color-foreground))] mb-1">Status</label>
                  <select
                    value={newClient.status}
                    onChange={(e) => setNewClient({ ...newClient, status: e.target.value })}
                    className="w-full px-4 py-2 bg-[hsl(var(--color-background-subtle))] border border-[hsl(var(--color-border))] rounded-xl text-[hsl(var(--color-foreground))] focus:outline-none focus:ring-2 focus:ring-[hsl(var(--color-accent))]/50"
                  >
                    <option value="lead">Lead</option>
                    <option value="active">Active</option>
                    <option value="completed">Completed</option>
                  </select>
                </div>
              </div>
              <div className="flex justify-end gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowNewModal(false)}
                  className="px-4 py-2 bg-[hsl(var(--color-background-subtle))] text-[hsl(var(--color-foreground))] font-medium rounded-xl hover:bg-[hsl(var(--color-border))] transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-[hsl(var(--color-accent))] text-black font-medium rounded-xl hover:bg-[hsl(var(--color-accent-hover))] transition-colors"
                >
                  Create Client
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
