"use client";

import * as React from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { AdminLoader } from "@/components/admin/AdminLoader";
import { IconChevronRight, IconPlus, IconCheck, IconFileText } from "@/components/admin/icons";

interface Milestone {
  id: string;
  name: string;
  description: string | null;
  due_date: string | null;
  completed_at: string | null;
  status: string;
  sort_order: number;
  deliverables: string[];
}

interface Project {
  id: string;
  name: string;
  description: string | null;
  project_type: string | null;
  status: string;
  health: string;
  start_date: string | null;
  target_end_date: string | null;
  actual_end_date: string | null;
  budget: number | null;
  spent: number | null;
  progress: number;
  milestones: Milestone[];
}

interface Invoice {
  id: string;
  invoice_number: string;
  amount: number;
  currency: string;
  status: string;
  due_date: string | null;
  paid_at: string | null;
}

interface ClientDocument {
  id: string;
  name: string;
  file_type: string | null;
  file_url: string;
  category: string | null;
  created_at: string;
}

interface Client {
  id: string;
  name: string;
  company: string | null;
  email: string | null;
  phone: string | null;
  website: string | null;
  industry: string | null;
  notes: string | null;
  status: string;
  created_at: string;
  projects: Project[];
  invoices: Invoice[];
  documents: ClientDocument[];
}

function formatCurrency(amount: number, currency = "AUD") {
  return new Intl.NumberFormat("en-AU", {
    style: "currency",
    currency,
    minimumFractionDigits: 0,
  }).format(amount);
}

function formatDate(dateString: string | null) {
  if (!dateString) return "—";
  return new Date(dateString).toLocaleDateString("en-AU", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function getStatusConfig(status: string) {
  const config: Record<string, { bg: string; text: string; label: string }> = {
    planning: { bg: "bg-blue-500/15", text: "text-blue-600", label: "Planning" },
    in_progress: { bg: "bg-yellow-500/15", text: "text-yellow-600", label: "In Progress" },
    review: { bg: "bg-purple-500/15", text: "text-purple-600", label: "Review" },
    completed: { bg: "bg-green-500/15", text: "text-green-600", label: "Completed" },
    on_hold: { bg: "bg-gray-500/15", text: "text-gray-600", label: "On Hold" },
    cancelled: { bg: "bg-red-500/15", text: "text-red-600", label: "Cancelled" },
  };
  return config[status] || config.planning;
}

function getHealthConfig(health: string) {
  const config: Record<string, { color: string; label: string }> = {
    on_track: { color: "text-green-600", label: "On Track" },
    at_risk: { color: "text-yellow-600", label: "At Risk" },
    delayed: { color: "text-orange-600", label: "Delayed" },
    blocked: { color: "text-red-600", label: "Blocked" },
  };
  return config[health] || config.on_track;
}

function getInvoiceStatusConfig(status: string) {
  const config: Record<string, { bg: string; text: string }> = {
    draft: { bg: "bg-gray-500/15", text: "text-gray-600" },
    sent: { bg: "bg-blue-500/15", text: "text-blue-600" },
    viewed: { bg: "bg-purple-500/15", text: "text-purple-600" },
    paid: { bg: "bg-green-500/15", text: "text-green-600" },
    overdue: { bg: "bg-red-500/15", text: "text-red-600" },
    cancelled: { bg: "bg-gray-500/15", text: "text-gray-500" },
  };
  return config[status] || config.draft;
}

export default function ClientDetailPage() {
  const params = useParams();
  const [client, setClient] = React.useState<Client | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [activeTab, setActiveTab] = React.useState<"projects" | "invoices" | "documents">("projects");
  const [selectedProject, setSelectedProject] = React.useState<Project | null>(null);
  const [showNewProjectModal, setShowNewProjectModal] = React.useState(false);
  const [newProject, setNewProject] = React.useState({
    name: "",
    description: "",
    project_type: "website",
    budget: "",
    start_date: "",
    target_end_date: "",
  });

  const fetchClient = React.useCallback(async () => {
    try {
      const res = await fetch(`/api/admin/clients/${params.id}`);
      if (res.ok) {
        const data = await res.json();
        setClient(data);
      }
    } catch (error) {
      console.error("Failed to fetch client:", error);
    } finally {
      setLoading(false);
    }
  }, [params.id]);

  React.useEffect(() => {
    fetchClient();
  }, [fetchClient]);

  const handleCreateProject = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch(`/api/admin/clients/${params.id}/projects`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...newProject,
          budget: newProject.budget ? parseFloat(newProject.budget) : null,
        }),
      });
      if (res.ok) {
        setShowNewProjectModal(false);
        setNewProject({ name: "", description: "", project_type: "website", budget: "", start_date: "", target_end_date: "" });
        fetchClient();
      }
    } catch (error) {
      console.error("Failed to create project:", error);
    }
  };

  const handleUpdateMilestone = async (projectId: string, milestoneId: string, status: string) => {
    try {
      await fetch(`/api/admin/projects/${projectId}/milestones`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ milestoneId, status }),
      });
      fetchClient();
    } catch (error) {
      console.error("Failed to update milestone:", error);
    }
  };

  if (loading) {
    return <AdminLoader message="Loading client..." />;
  }

  if (!client) {
    return (
      <div className="text-center py-12">
        <p className="text-[hsl(var(--color-foreground-muted))]">Client not found</p>
        <Link href="/admin/clients" className="text-[hsl(var(--color-accent))] hover:underline mt-2 inline-block">
          Back to clients
        </Link>
      </div>
    );
  }

  // Calculate financials
  const totalBudget = client.projects.reduce((sum, p) => sum + (p.budget || 0), 0);
  const totalSpent = client.projects.reduce((sum, p) => sum + (p.spent || 0), 0);
  const totalInvoiced = client.invoices.reduce((sum, i) => sum + i.amount, 0);
  const totalPaid = client.invoices.filter(i => i.status === "paid").reduce((sum, i) => sum + i.amount, 0);

  return (
    <div className="space-y-6">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-[hsl(var(--color-foreground-subtle))]">
        <Link href="/admin/clients" className="hover:text-[hsl(var(--color-foreground))] transition-colors">Clients</Link>
        <IconChevronRight size={16} />
        <span className="text-[hsl(var(--color-foreground))]">{client.name}</span>
      </div>

      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <h1 className="font-[family-name:var(--font-heading)] text-2xl md:text-3xl tracking-tight font-semibold">{client.name}</h1>
          {client.company && <p className="text-[hsl(var(--color-foreground-muted))]">{client.company}</p>}
          <div className="flex gap-4 mt-2 text-sm text-[hsl(var(--color-foreground-subtle))]">
            {client.email && <span>{client.email}</span>}
            {client.phone && <span>{client.phone}</span>}
            {client.website && (
              <a href={client.website} target="_blank" rel="noopener noreferrer" className="text-[hsl(var(--color-accent))] hover:underline">
                {client.website}
              </a>
            )}
          </div>
        </div>
        <button
          onClick={() => setShowNewProjectModal(true)}
          className="px-4 py-2.5 bg-[hsl(var(--color-accent))] text-black font-medium rounded-xl hover:bg-[hsl(var(--color-accent-hover))] transition-colors inline-flex items-center gap-2"
        >
          <IconPlus size={20} />
          New Project
        </button>
      </div>

      {/* Financial Summary */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-[hsl(var(--color-background-muted))] border border-[hsl(var(--color-border))] rounded-xl p-4">
          <p className="text-[hsl(var(--color-foreground-subtle))] text-xs mb-1">Total Budget</p>
          <p className="text-2xl font-semibold text-[hsl(var(--color-foreground))]">{formatCurrency(totalBudget)}</p>
        </div>
        <div className="bg-[hsl(var(--color-background-muted))] border border-[hsl(var(--color-border))] rounded-xl p-4">
          <p className="text-[hsl(var(--color-foreground-subtle))] text-xs mb-1">Spent</p>
          <p className="text-2xl font-semibold text-blue-600">{formatCurrency(totalSpent)}</p>
        </div>
        <div className="bg-[hsl(var(--color-background-muted))] border border-[hsl(var(--color-border))] rounded-xl p-4">
          <p className="text-[hsl(var(--color-foreground-subtle))] text-xs mb-1">Invoiced</p>
          <p className="text-2xl font-semibold text-purple-600">{formatCurrency(totalInvoiced)}</p>
        </div>
        <div className="bg-[hsl(var(--color-background-muted))] border border-[hsl(var(--color-border))] rounded-xl p-4">
          <p className="text-[hsl(var(--color-foreground-subtle))] text-xs mb-1">Paid</p>
          <p className="text-2xl font-semibold text-green-600">{formatCurrency(totalPaid)}</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-[hsl(var(--color-border))] pb-4">
        {[
          { id: "projects", label: `Projects (${client.projects.length})` },
          { id: "invoices", label: `Invoices (${client.invoices.length})` },
          { id: "documents", label: `Documents (${client.documents.length})` },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as typeof activeTab)}
            className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors ${
              activeTab === tab.id
                ? "bg-[hsl(var(--color-background-subtle))] text-[hsl(var(--color-foreground))]"
                : "text-[hsl(var(--color-foreground-subtle))] hover:text-[hsl(var(--color-foreground))]"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Projects Tab */}
      {activeTab === "projects" && (
        <div className="space-y-4">
          {client.projects.length === 0 ? (
            <div className="bg-[hsl(var(--color-background-muted))] border border-[hsl(var(--color-border))] rounded-xl p-12 text-center">
              <p className="text-[hsl(var(--color-foreground-muted))]">No projects yet</p>
            </div>
          ) : (
            client.projects.map((project) => {
              const statusConfig = getStatusConfig(project.status);
              const healthConfig = getHealthConfig(project.health);
              const isExpanded = selectedProject?.id === project.id;

              return (
                <div
                  key={project.id}
                  className="bg-[hsl(var(--color-background-muted))] border border-[hsl(var(--color-border))] rounded-xl overflow-hidden"
                >
                  <div
                    className="p-5 cursor-pointer hover:bg-[hsl(var(--color-background-subtle))] transition-colors"
                    onClick={() => setSelectedProject(isExpanded ? null : project)}
                  >
                    <div className="flex justify-between items-start gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <span className={`px-2 py-0.5 rounded text-xs font-medium ${statusConfig.bg} ${statusConfig.text}`}>
                            {statusConfig.label}
                          </span>
                          <span className={`text-xs font-medium ${healthConfig.color}`}>
                            • {healthConfig.label}
                          </span>
                          {project.project_type && (
                            <span className="text-xs text-[hsl(var(--color-foreground-subtle))]">
                              {project.project_type}
                            </span>
                          )}
                        </div>
                        <h3 className="text-lg font-medium text-[hsl(var(--color-foreground))]">{project.name}</h3>
                        {project.description && (
                          <p className="text-sm text-[hsl(var(--color-foreground-muted))] mt-1 line-clamp-2">{project.description}</p>
                        )}
                        <div className="flex gap-4 mt-2 text-xs text-[hsl(var(--color-foreground-subtle))]">
                          <span>Start: {formatDate(project.start_date)}</span>
                          <span>Target: {formatDate(project.target_end_date)}</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        {/* Progress Circle */}
                        <div className="relative w-14 h-14">
                          <svg className="w-14 h-14 -rotate-90" viewBox="0 0 56 56">
                            <circle cx="28" cy="28" r="24" fill="none" className="stroke-[hsl(var(--color-border))]" strokeWidth="4" />
                            <circle
                              cx="28" cy="28" r="24" fill="none"
                              className={project.progress >= 100 ? "stroke-green-600" : "stroke-[hsl(var(--color-accent))]"}
                              strokeWidth="4"
                              strokeDasharray={`${project.progress * 1.508} 151`}
                              strokeLinecap="round"
                            />
                          </svg>
                          <span className="absolute inset-0 flex items-center justify-center text-sm font-semibold text-[hsl(var(--color-foreground))]">
                            {project.progress}%
                          </span>
                        </div>
                        {project.budget && (
                          <div className="text-right">
                            <p className="text-xs text-[hsl(var(--color-foreground-subtle))]">Budget</p>
                            <p className="text-lg font-semibold text-[hsl(var(--color-foreground))]">{formatCurrency(project.budget)}</p>
                          </div>
                        )}
                        <IconChevronRight size={20} className={`text-[hsl(var(--color-foreground-subtle))] transition-transform ${isExpanded ? "rotate-90" : ""}`} />
                      </div>
                    </div>
                  </div>

                  {/* Milestones Timeline */}
                  {isExpanded && project.milestones.length > 0 && (
                    <div className="border-t border-[hsl(var(--color-border))] p-5 bg-[hsl(var(--color-background-subtle))]">
                      <h4 className="font-[family-name:var(--font-heading)] text-base font-semibold text-[hsl(var(--color-foreground))] mb-4">
                        Milestones
                      </h4>
                      <div className="relative">
                        {/* Timeline line */}
                        <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-[hsl(var(--color-border))]" />

                        <div className="space-y-4">
                          {project.milestones
                            .sort((a, b) => a.sort_order - b.sort_order)
                            .map((milestone) => {
                              const isCompleted = milestone.status === "completed";
                              const isOverdue = milestone.status === "overdue" || 
                                (milestone.due_date && new Date(milestone.due_date) < new Date() && !isCompleted);

                              return (
                                <div key={milestone.id} className="relative flex items-start gap-4 pl-10">
                                  {/* Dot */}
                                  <div
                                    className={`absolute left-2 w-4 h-4 rounded-full border-2 ${
                                      isCompleted
                                        ? "bg-green-600 border-green-600"
                                        : isOverdue
                                        ? "bg-red-600 border-red-600"
                                        : "bg-[hsl(var(--color-background))] border-[hsl(var(--color-border))]"
                                    }`}
                                  >
                                    {isCompleted && (
                                      <IconCheck size={12} className="text-white [stroke-width:3]" />
                                    )}
                                  </div>

                                  <div className="flex-1 bg-[hsl(var(--color-background-muted))] rounded-xl p-4">
                                    <div className="flex justify-between items-start">
                                      <div>
                                        <h5 className={`font-medium ${isCompleted ? "text-[hsl(var(--color-foreground-muted))] line-through" : "text-[hsl(var(--color-foreground))]"}`}>
                                          {milestone.name}
                                        </h5>
                                        {milestone.description && (
                                          <p className="text-sm text-[hsl(var(--color-foreground-subtle))] mt-1">{milestone.description}</p>
                                        )}
                                        <div className="flex gap-2 mt-2 text-xs text-[hsl(var(--color-foreground-subtle))]">
                                          {milestone.due_date && (
                                            <span className={isOverdue && !isCompleted ? "text-red-600" : ""}>
                                              Due: {formatDate(milestone.due_date)}
                                            </span>
                                          )}
                                          {isCompleted && milestone.completed_at && (
                                            <span className="text-green-600">
                                              Completed: {formatDate(milestone.completed_at)}
                                            </span>
                                          )}
                                        </div>
                                      </div>
                                      {!isCompleted && (
                                        <button
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            handleUpdateMilestone(project.id, milestone.id, "completed");
                                          }}
                                          className="px-3 py-1.5 bg-green-500/15 text-green-600 text-xs font-medium rounded-lg hover:bg-green-500/25 transition-colors"
                                        >
                                          Mark Complete
                                        </button>
                                      )}
                                    </div>
                                  </div>
                                </div>
                              );
                            })}
                        </div>
                      </div>
                    </div>
                  )}

                  {isExpanded && project.milestones.length === 0 && (
                    <div className="border-t border-[hsl(var(--color-border))] p-5 bg-[hsl(var(--color-background-subtle))] text-center">
                      <p className="text-sm text-[hsl(var(--color-foreground-muted))]">No milestones defined</p>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      )}

      {/* Invoices Tab */}
      {activeTab === "invoices" && (
        <div className="bg-[hsl(var(--color-background-muted))] border border-[hsl(var(--color-border))] rounded-xl overflow-hidden">
          {client.invoices.length === 0 ? (
            <div className="p-12 text-center">
              <p className="text-[hsl(var(--color-foreground-muted))]">No invoices yet</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[640px]">
                <thead className="bg-[hsl(var(--color-background-subtle))]">
                  <tr>
                    <th className="text-left text-xs font-semibold text-[hsl(var(--color-foreground-muted))] px-6 py-3">Invoice</th>
                    <th className="text-left text-xs font-semibold text-[hsl(var(--color-foreground-muted))] px-6 py-3">Amount</th>
                    <th className="text-left text-xs font-semibold text-[hsl(var(--color-foreground-muted))] px-6 py-3">Status</th>
                    <th className="text-left text-xs font-semibold text-[hsl(var(--color-foreground-muted))] px-6 py-3">Due Date</th>
                    <th className="text-left text-xs font-semibold text-[hsl(var(--color-foreground-muted))] px-6 py-3">Paid</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[hsl(var(--color-border))]">
                  {client.invoices.map((invoice) => {
                    const statusConfig = getInvoiceStatusConfig(invoice.status);
                    return (
                      <tr key={invoice.id} className="hover:bg-[hsl(var(--color-background-subtle))]">
                        <td className="px-6 py-4 font-medium text-[hsl(var(--color-foreground))]">{invoice.invoice_number}</td>
                        <td className="px-6 py-4 text-[hsl(var(--color-foreground))]">{formatCurrency(invoice.amount, invoice.currency)}</td>
                        <td className="px-6 py-4">
                          <span className={`px-2 py-0.5 rounded text-xs font-medium ${statusConfig.bg} ${statusConfig.text}`}>
                            {invoice.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-[hsl(var(--color-foreground-muted))]">{formatDate(invoice.due_date)}</td>
                        <td className="px-6 py-4 text-[hsl(var(--color-foreground-muted))]">{formatDate(invoice.paid_at)}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Documents Tab */}
      {activeTab === "documents" && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {client.documents.length === 0 ? (
            <div className="col-span-full bg-[hsl(var(--color-background-muted))] border border-[hsl(var(--color-border))] rounded-xl p-12 text-center">
              <p className="text-[hsl(var(--color-foreground-muted))]">No documents yet</p>
            </div>
          ) : (
            client.documents.map((doc) => (
              <a
                key={doc.id}
                href={doc.file_url}
                target="_blank"
                rel="noopener noreferrer"
                className="bg-[hsl(var(--color-background-muted))] border border-[hsl(var(--color-border))] rounded-xl p-4 hover:border-[hsl(var(--color-accent))]/50 transition-colors"
              >
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-xl bg-[hsl(var(--color-background-subtle))] flex items-center justify-center">
                    <IconFileText size={20} className="text-[hsl(var(--color-foreground-muted))]" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-[hsl(var(--color-foreground))] truncate">{doc.name}</p>
                    <p className="text-xs text-[hsl(var(--color-foreground-subtle))]">
                      {doc.category && <span className="capitalize">{doc.category} • </span>}
                      {formatDate(doc.created_at)}
                    </p>
                  </div>
                </div>
              </a>
            ))
          )}
        </div>
      )}

      {/* New Project Modal */}
      {showNewProjectModal && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <div className="bg-[hsl(var(--color-background-muted))] border border-[hsl(var(--color-border))] rounded-2xl max-w-md w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-[hsl(var(--color-border))]">
              <h2 className="text-lg font-semibold text-[hsl(var(--color-foreground))]">New Project</h2>
            </div>
            <form onSubmit={handleCreateProject} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-[hsl(var(--color-foreground))] mb-1">Project Name *</label>
                <input
                  type="text"
                  value={newProject.name}
                  onChange={(e) => setNewProject({ ...newProject, name: e.target.value })}
                  required
                  className="w-full px-4 py-2 bg-[hsl(var(--color-background-subtle))] border border-[hsl(var(--color-border))] rounded-xl text-[hsl(var(--color-foreground))] placeholder-[hsl(var(--color-foreground-subtle))] focus:outline-none focus:ring-2 focus:ring-[hsl(var(--color-accent))]/50"
                  placeholder="e.g. Website Redesign"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-[hsl(var(--color-foreground))] mb-1">Description</label>
                <textarea
                  value={newProject.description}
                  onChange={(e) => setNewProject({ ...newProject, description: e.target.value })}
                  rows={3}
                  className="w-full px-4 py-2 bg-[hsl(var(--color-background-subtle))] border border-[hsl(var(--color-border))] rounded-xl text-[hsl(var(--color-foreground))] placeholder-[hsl(var(--color-foreground-subtle))] focus:outline-none focus:ring-2 focus:ring-[hsl(var(--color-accent))]/50 resize-none"
                  placeholder="Project description..."
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-[hsl(var(--color-foreground))] mb-1">Type</label>
                  <select
                    value={newProject.project_type}
                    onChange={(e) => setNewProject({ ...newProject, project_type: e.target.value })}
                    className="w-full px-4 py-2 bg-[hsl(var(--color-background-subtle))] border border-[hsl(var(--color-border))] rounded-xl text-[hsl(var(--color-foreground))] focus:outline-none focus:ring-2 focus:ring-[hsl(var(--color-accent))]/50"
                  >
                    <option value="website">Website</option>
                    <option value="webapp">Web App</option>
                    <option value="branding">Branding</option>
                    <option value="consulting">Consulting</option>
                    <option value="maintenance">Maintenance</option>
                    <option value="other">Other</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-[hsl(var(--color-foreground))] mb-1">Budget</label>
                  <input
                    type="number"
                    value={newProject.budget}
                    onChange={(e) => setNewProject({ ...newProject, budget: e.target.value })}
                    className="w-full px-4 py-2 bg-[hsl(var(--color-background-subtle))] border border-[hsl(var(--color-border))] rounded-xl text-[hsl(var(--color-foreground))] placeholder-[hsl(var(--color-foreground-subtle))] focus:outline-none focus:ring-2 focus:ring-[hsl(var(--color-accent))]/50"
                    placeholder="0"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-[hsl(var(--color-foreground))] mb-1">Start Date</label>
                  <input
                    type="date"
                    value={newProject.start_date}
                    onChange={(e) => setNewProject({ ...newProject, start_date: e.target.value })}
                    className="w-full px-4 py-2 bg-[hsl(var(--color-background-subtle))] border border-[hsl(var(--color-border))] rounded-xl text-[hsl(var(--color-foreground))] focus:outline-none focus:ring-2 focus:ring-[hsl(var(--color-accent))]/50"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-[hsl(var(--color-foreground))] mb-1">Target End</label>
                  <input
                    type="date"
                    value={newProject.target_end_date}
                    onChange={(e) => setNewProject({ ...newProject, target_end_date: e.target.value })}
                    className="w-full px-4 py-2 bg-[hsl(var(--color-background-subtle))] border border-[hsl(var(--color-border))] rounded-xl text-[hsl(var(--color-foreground))] focus:outline-none focus:ring-2 focus:ring-[hsl(var(--color-accent))]/50"
                  />
                </div>
              </div>
              <div className="flex justify-end gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowNewProjectModal(false)}
                  className="px-4 py-2 bg-[hsl(var(--color-background-subtle))] text-[hsl(var(--color-foreground))] font-medium rounded-xl hover:bg-[hsl(var(--color-border))] transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-[hsl(var(--color-accent))] text-black font-medium rounded-xl hover:bg-[hsl(var(--color-accent-hover))] transition-colors"
                >
                  Create Project
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
