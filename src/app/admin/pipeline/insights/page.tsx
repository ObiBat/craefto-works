"use client";

import * as React from "react";
import Link from "next/link";
import { AdminLoader } from "@/components/admin/AdminLoader";
import { Button } from "@/components/ui/button";
import {
  PageContainer,
  PageHeader,
  Card,
  StatCard,
  EmptyState,
  FilterBar,
  FilterChip,
} from "@/components/admin/ui";
import {
  IconCheck,
  IconChevronRight,
  IconFlame,
  IconLightbulb,
  IconSearch,
  IconSpinner,
  IconX,
} from "@/components/admin/icons";

interface Insight {
  id: string;
  title: string;
  summary: string;
  key_points: string[];
  source_type: string;
  relevance_score: number;
  urgency: string;
  target_keywords: string[];
  status: string;
  journal_pillars: { name: string; slug: string } | null;
  created_at: string;
}

interface Stats {
  total: number;
  new: number;
  approved: number;
  rejected: number;
  used: number;
}

const MODAL_PANEL_CLASS =
  "bg-[hsl(var(--color-background))] border border-[hsl(var(--color-border))]/50 rounded-2xl shadow-2xl w-full";

const MODAL_TITLE_CLASS =
  "font-[family-name:var(--font-heading)] text-lg font-semibold text-[hsl(var(--color-foreground))]";

const SUBHEADING_CLASS = "text-base font-semibold text-[hsl(var(--color-foreground))]";

const CHECKBOX_CLASS =
  "w-4 h-4 rounded border-[hsl(var(--color-border))] bg-[hsl(var(--color-background-subtle))] text-[hsl(var(--color-accent))] focus:ring-[hsl(var(--color-accent))] accent-[hsl(var(--color-accent))]";

function getUrgencyIcon(urgency: string) {
  const icons: Record<string, { color: string; label: string }> = {
    low: { color: "text-[hsl(var(--color-foreground-subtle))]", label: "Low" },
    medium: { color: "text-yellow-600", label: "Medium" },
    high: { color: "text-orange-600", label: "High" },
    trending: { color: "text-red-600", label: "Trending" },
  };
  return icons[urgency] || icons.low;
}

function getStatusConfig(status: string) {
  const config: Record<string, { bg: string; text: string; label: string }> = {
    new: { bg: "bg-blue-500/15", text: "text-blue-600", label: "New" },
    approved: { bg: "bg-green-500/15", text: "text-green-600", label: "Approved" },
    rejected: { bg: "bg-red-500/15", text: "text-red-600", label: "Rejected" },
    used: { bg: "bg-purple-500/15", text: "text-purple-600", label: "Used" },
  };
  return config[status] || config.new;
}

export default function InsightsPage() {
  const [insights, setInsights] = React.useState<Insight[]>([]);
  const [stats, setStats] = React.useState<Stats>({ total: 0, new: 0, approved: 0, rejected: 0, used: 0 });
  const [loading, setLoading] = React.useState(true);
  const [statusFilter, setStatusFilter] = React.useState<string>("all");
  const [selectedInsight, setSelectedInsight] = React.useState<Insight | null>(null);
  const [actionLoading, setActionLoading] = React.useState<string | null>(null);
  const [rejectReason, setRejectReason] = React.useState("");
  const [showRejectModal, setShowRejectModal] = React.useState(false);
  const [notification, setNotification] = React.useState<{ type: "success" | "error" | "info"; message: string } | null>(null);
  const [selectedIds, setSelectedIds] = React.useState<Set<string>>(new Set());
  const [batchLoading, setBatchLoading] = React.useState(false);

  const showNotification = (type: "success" | "error" | "info", message: string) => {
    setNotification({ type, message });
    setTimeout(() => setNotification(null), 5000);
  };

  const fetchInsights = React.useCallback(async () => {
    try {
      const url = statusFilter === "all"
        ? "/api/admin/pipeline/insights"
        : `/api/admin/pipeline/insights?status=${statusFilter}`;
      const res = await fetch(url);
      if (res.ok) {
        const data = await res.json();
        setInsights(data);

        // Calculate stats
        const allRes = await fetch("/api/admin/pipeline/insights");
        if (allRes.ok) {
          const allData = await allRes.json();
          const newStats = { total: 0, new: 0, approved: 0, rejected: 0, used: 0 };
          allData.forEach((insight: Insight) => {
            newStats.total++;
            if (insight.status in newStats) {
              newStats[insight.status as keyof Stats]++;
            }
          });
          setStats(newStats);
        }
      }
    } catch (error) {
      console.error("Failed to fetch insights:", error);
    } finally {
      setLoading(false);
    }
  }, [statusFilter]);

  React.useEffect(() => {
    setLoading(true);
    fetchInsights();
  }, [fetchInsights]);

  const handleAction = async (action: string, insightId: string, extraData?: Record<string, string>) => {
    setActionLoading(insightId || "scan");

    if (action === "scan") {
      showNotification("info", "Scanning for trends... This may take 15-30 seconds.");
    }

    try {
      const res = await fetch("/api/admin/pipeline/insights", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action,
          insightId,
          reviewedBy: "admin",
          ...extraData,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || `Failed to ${action}`);
      }

      await fetchInsights();
      setSelectedInsight(null);
      setShowRejectModal(false);
      setRejectReason("");

      // Show success messages
      if (action === "scan") {
        const count = data.insights?.length || 0;
        showNotification("success", `Found ${count} new content opportunities!`);
      } else if (action === "approve") {
        showNotification("success", "Insight approved successfully");
      } else if (action === "reject") {
        showNotification("success", "Insight rejected");
      } else if (action === "synthesize") {
        showNotification("success", "Brief created! Check the Briefs page.");
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : `Failed to ${action}`;
      showNotification("error", message);
      console.error(`Failed to ${action}:`, error);
    } finally {
      setActionLoading(null);
    }
  };

  const handleReject = () => {
    if (selectedInsight && rejectReason.trim()) {
      handleAction("reject", selectedInsight.id, { reason: rejectReason });
    }
  };

  const toggleSelectAll = () => {
    if (selectedIds.size === insights.filter(i => i.status === "new").length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(insights.filter(i => i.status === "new").map(i => i.id)));
    }
  };

  const toggleSelect = (id: string) => {
    const newSelected = new Set(selectedIds);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedIds(newSelected);
  };

  const handleBatchAction = async (action: "approve" | "reject") => {
    if (selectedIds.size === 0) return;

    setBatchLoading(true);
    try {
      const res = await fetch("/api/admin/pipeline/batch", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action,
          itemType: "insight",
          itemIds: Array.from(selectedIds),
          reviewedBy: "admin",
          reason: action === "reject" ? "Batch rejected" : undefined,
        }),
      });

      const data = await res.json();
      if (res.ok) {
        showNotification("success", `${action === "approve" ? "Approved" : "Rejected"} ${data.results.success.length} insights`);
        setSelectedIds(new Set());
        await fetchInsights();
      } else {
        showNotification("error", data.error || `Failed to ${action} insights`);
      }
    } catch {
      showNotification("error", `Failed to ${action} insights`);
    } finally {
      setBatchLoading(false);
    }
  };

  if (loading) {
    return <AdminLoader message="Loading insights..." />;
  }

  return (
    <>
      <PageContainer>
        <PageHeader
          breadcrumb={
            <div className="flex items-center gap-2 text-sm text-[hsl(var(--color-foreground-subtle))]">
              <Link href="/admin/pipeline" className="inline-flex items-center hover:text-[hsl(var(--color-foreground))] transition-colors">Pipeline</Link>
              <IconChevronRight size={16} />
              <span className="text-[hsl(var(--color-foreground))]">Insights</span>
            </div>
          }
          title="Content Insights"
          subtitle="AI-discovered content opportunities and trends"
          actions={
            <Button
              variant="accent"
              size="sm"
              onClick={() => handleAction("scan", "")}
              disabled={actionLoading !== null}
            >
              {actionLoading === "scan" ? <IconSpinner size={16} /> : <IconSearch size={16} />}
              Scan for Trends
            </Button>
          }
        />

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-5 gap-4">
          {[
            { label: "Total", value: stats.total },
            { label: "New", value: stats.new },
            { label: "Approved", value: stats.approved, accent: "success" as const },
            { label: "Rejected", value: stats.rejected, accent: "error" as const },
            { label: "Used", value: stats.used },
          ].map((stat) => (
            <StatCard key={stat.label} label={stat.label} value={stat.value} accent={stat.accent} />
          ))}
        </div>

        {/* Filters */}
        <FilterBar>
          {["all", "new", "approved", "rejected", "used"].map((status) => (
            <FilterChip key={status} active={statusFilter === status} onClick={() => setStatusFilter(status)}>
              {status === "all" ? "All" : status.charAt(0).toUpperCase() + status.slice(1)}
            </FilterChip>
          ))}
        </FilterBar>

        {/* Batch Actions Toolbar */}
        {insights.some(i => i.status === "new") && (
          <Card padding="compact" className="flex flex-wrap items-center gap-3 sm:gap-4">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={selectedIds.size > 0 && selectedIds.size === insights.filter(i => i.status === "new").length}
                onChange={toggleSelectAll}
                className={CHECKBOX_CLASS}
              />
              <span className="text-sm text-[hsl(var(--color-foreground-muted))]">
                {selectedIds.size > 0 ? `${selectedIds.size} selected` : "Select all new"}
              </span>
            </label>

            {selectedIds.size > 0 && (
              <>
                <div className="hidden sm:block h-4 w-px bg-[hsl(var(--color-border))]" />
                <Button
                  variant="accent"
                  size="sm"
                  className="h-8 px-3 text-xs"
                  onClick={() => handleBatchAction("approve")}
                  disabled={batchLoading}
                >
                  {batchLoading ? "Processing..." : `Approve ${selectedIds.size}`}
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 px-3 text-xs bg-red-500/15 text-red-600 hover:bg-red-500/25"
                  onClick={() => handleBatchAction("reject")}
                  disabled={batchLoading}
                >
                  Reject {selectedIds.size}
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 px-3 text-xs text-[hsl(var(--color-foreground-muted))]"
                  onClick={() => setSelectedIds(new Set())}
                >
                  Clear
                </Button>
              </>
            )}
          </Card>
        )}

        {/* Insights List */}
        <div className="space-y-3">
          {insights.length === 0 ? (
            <EmptyState
              icon={<IconLightbulb size={48} />}
              title="No insights yet"
              description="Run a trend scan to discover content opportunities"
              action={
                <Button
                  variant="accent"
                  size="sm"
                  onClick={() => handleAction("scan", "")}
                  disabled={actionLoading !== null}
                >
                  Scan for Trends
                </Button>
              }
            />
          ) : (
            insights.map((insight) => {
              const statusConfig = getStatusConfig(insight.status);
              const urgencyConfig = getUrgencyIcon(insight.urgency);
              const isSelected = selectedIds.has(insight.id);

              return (
                <Card
                  key={insight.id}
                  className={`p-5 transition-colors ${isSelected ? "border-[hsl(var(--color-accent))]" : ""}`}
                >
                  <div className="flex flex-col gap-4 sm:flex-row sm:justify-between sm:items-start">
                    <div className="flex gap-3 flex-1 min-w-0">
                      {insight.status === "new" && (
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => toggleSelect(insight.id)}
                          aria-label={`Select ${insight.title}`}
                          className={`mt-1 flex-shrink-0 ${CHECKBOX_CLASS}`}
                        />
                      )}
                      <div className="flex-1 min-w-0">
                        {/* Tags Row */}
                        <div className="flex items-center gap-2 mb-3 flex-wrap">
                          <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${statusConfig.bg} ${statusConfig.text}`}>
                            {statusConfig.label}
                          </span>
                          <span className={`flex items-center gap-1 text-xs ${urgencyConfig.color}`}>
                            <IconFlame size={14} />
                            {urgencyConfig.label}
                          </span>
                          {insight.journal_pillars && (
                            <span className="px-2.5 py-1 rounded-full text-xs bg-[hsl(var(--color-background-muted))] text-[hsl(var(--color-foreground-muted))]">
                              {insight.journal_pillars.name}
                            </span>
                          )}
                          <span className="text-xs text-[hsl(var(--color-foreground-subtle))]">
                            {Math.round((insight.relevance_score || 0) * 100)}% relevance
                          </span>
                        </div>

                        {/* Title & Summary */}
                        <h3 className={`${SUBHEADING_CLASS} mb-2 line-clamp-1`}>{insight.title}</h3>
                        <p className="text-[hsl(var(--color-foreground-muted))] text-sm mb-3 line-clamp-2">{insight.summary}</p>

                        {/* Keywords */}
                        <div className="flex flex-wrap gap-1.5">
                          {insight.target_keywords.slice(0, 4).map((keyword, i) => (
                            <span key={i} className="px-2 py-0.5 bg-[hsl(var(--color-background-muted))] rounded text-xs text-[hsl(var(--color-foreground-subtle))]">
                              {keyword}
                            </span>
                          ))}
                          {insight.target_keywords.length > 4 && (
                            <span className="text-xs text-[hsl(var(--color-foreground-subtle))]">+{insight.target_keywords.length - 4} more</span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex flex-row flex-wrap items-center gap-2 sm:flex-col sm:items-stretch sm:flex-shrink-0">
                      {insight.status === "new" && (
                        <>
                          <Button
                            variant="accent"
                            size="sm"
                            className="h-8 px-3 text-xs"
                            onClick={() => handleAction("approve", insight.id)}
                            disabled={actionLoading === insight.id}
                          >
                            Approve
                          </Button>
                          <Button
                            variant="secondary"
                            size="sm"
                            className="h-8 px-3 text-xs"
                            onClick={() => setSelectedInsight(insight)}
                          >
                            Review
                          </Button>
                        </>
                      )}
                      {insight.status === "approved" && (
                        <Button
                          variant="accent"
                          size="sm"
                          className="h-8 px-3 text-xs"
                          onClick={() => handleAction("synthesize", insight.id)}
                          disabled={actionLoading === insight.id}
                        >
                          Create Brief
                        </Button>
                      )}
                      {insight.status === "rejected" && (
                        <span className="text-xs text-[hsl(var(--color-foreground-subtle))] sm:text-center">Rejected</span>
                      )}
                      {insight.status === "used" && (
                        <span className="text-xs text-purple-600 sm:text-center">Brief created</span>
                      )}
                    </div>
                  </div>

                  {/* Key Points (collapsed by default) */}
                  {insight.key_points.length > 0 && insight.status === "new" && (
                    <details className="mt-4 pt-4 border-t border-[hsl(var(--color-border))]/50">
                      <summary className="text-xs text-[hsl(var(--color-foreground-subtle))] cursor-pointer hover:text-[hsl(var(--color-foreground))] transition-colors">
                        {insight.key_points.length} key points
                      </summary>
                      <ul className="mt-3 space-y-1.5">
                        {insight.key_points.map((point, i) => (
                          <li key={i} className="flex gap-2 text-sm text-[hsl(var(--color-foreground-muted))]">
                            <span className="text-[hsl(var(--color-foreground-subtle))]">•</span>
                            {point}
                          </li>
                        ))}
                      </ul>
                    </details>
                  )}
                </Card>
              );
            })
          )}
        </div>
      </PageContainer>

      {/* Review Modal */}
      {selectedInsight && !showRejectModal && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <div className={`${MODAL_PANEL_CLASS} max-w-2xl max-h-[85vh] overflow-hidden flex flex-col`}>
            <div className="p-6 border-b border-[hsl(var(--color-border))]/50">
              <div className="flex items-start justify-between">
                <div className="flex-1 min-w-0 pr-4">
                  <div className="flex flex-wrap items-center gap-2 mb-2">
                    {(() => {
                      const cfg = getStatusConfig(selectedInsight.status);
                      return (
                        <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${cfg.bg} ${cfg.text}`}>
                          {cfg.label}
                        </span>
                      );
                    })()}
                    {selectedInsight.journal_pillars && (
                      <span className="px-2.5 py-0.5 rounded-full text-xs bg-[hsl(var(--color-background-muted))] text-[hsl(var(--color-foreground-muted))]">
                        {selectedInsight.journal_pillars.name}
                      </span>
                    )}
                  </div>
                  <h2 className={`${MODAL_TITLE_CLASS} break-words`}>{selectedInsight.title}</h2>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-9 w-9 shrink-0"
                  aria-label="Close"
                  onClick={() => setSelectedInsight(null)}
                >
                  <IconX size={20} />
                </Button>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              <div>
                <h3 className={`${SUBHEADING_CLASS} mb-2`}>Summary</h3>
                <p className="text-[hsl(var(--color-foreground))]">{selectedInsight.summary}</p>
              </div>

              <div>
                <h3 className={`${SUBHEADING_CLASS} mb-2`}>Key Points</h3>
                <ul className="space-y-2">
                  {selectedInsight.key_points.map((point, i) => (
                    <li key={i} className="flex gap-3 text-[hsl(var(--color-foreground-muted))]">
                      <span className="text-[hsl(var(--color-accent))] flex-shrink-0">✓</span>
                      {point}
                    </li>
                  ))}
                </ul>
              </div>

              <div>
                <h3 className={`${SUBHEADING_CLASS} mb-2`}>Target Keywords</h3>
                <div className="flex flex-wrap gap-2">
                  {selectedInsight.target_keywords.map((keyword, i) => (
                    <span key={i} className="px-3 py-1.5 bg-[hsl(var(--color-background-muted))] rounded-xl text-sm text-[hsl(var(--color-foreground-muted))]">
                      {keyword}
                    </span>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-4 border-t border-[hsl(var(--color-border))]/50 break-words">
                <div>
                  <p className="text-xs text-[hsl(var(--color-foreground-subtle))] mb-1">Relevance</p>
                  <p className="text-lg font-semibold text-[hsl(var(--color-foreground))]">{Math.round((selectedInsight.relevance_score || 0) * 100)}%</p>
                </div>
                <div>
                  <p className="text-xs text-[hsl(var(--color-foreground-subtle))] mb-1">Urgency</p>
                  <p className={`text-lg font-semibold ${getUrgencyIcon(selectedInsight.urgency).color}`}>
                    {selectedInsight.urgency.charAt(0).toUpperCase() + selectedInsight.urgency.slice(1)}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-[hsl(var(--color-foreground-subtle))] mb-1">Source</p>
                  <p className="text-lg font-semibold text-[hsl(var(--color-foreground))]">{selectedInsight.source_type}</p>
                </div>
              </div>
            </div>

            <div className="p-6 border-t border-[hsl(var(--color-border))]/50 flex flex-wrap justify-end gap-3">
              <Button variant="secondary" size="sm" onClick={() => setSelectedInsight(null)}>
                Cancel
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="bg-red-500/15 text-red-600 hover:bg-red-500/25"
                onClick={() => setShowRejectModal(true)}
              >
                Reject
              </Button>
              <Button
                variant="accent"
                size="sm"
                onClick={() => handleAction("approve", selectedInsight.id)}
                disabled={actionLoading === selectedInsight.id}
              >
                Approve Insight
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Reject Modal */}
      {showRejectModal && selectedInsight && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <div className={`${MODAL_PANEL_CLASS} max-w-md max-h-[90vh] overflow-y-auto`}>
            <div className="p-6 border-b border-[hsl(var(--color-border))]/50">
              <h2 className={MODAL_TITLE_CLASS}>Reject Insight</h2>
              <p className="text-sm text-[hsl(var(--color-foreground-subtle))] mt-1">Why is this insight not suitable?</p>
            </div>
            <div className="p-6">
              <textarea
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                placeholder="Enter reason for rejection..."
                aria-label="Reason for rejection"
                className="w-full h-32 px-4 py-2.5 rounded-xl bg-[hsl(var(--color-background))] border border-[hsl(var(--color-border))] text-sm text-[hsl(var(--color-foreground))] placeholder:text-[hsl(var(--color-foreground-subtle))] focus:outline-none focus:ring-2 focus:ring-[hsl(var(--color-accent))]/40 focus:border-[hsl(var(--color-accent))]/40 resize-none"
              />
            </div>
            <div className="p-6 border-t border-[hsl(var(--color-border))]/50 flex flex-wrap justify-end gap-3">
              <Button
                variant="secondary"
                size="sm"
                onClick={() => {
                  setShowRejectModal(false);
                  setRejectReason("");
                }}
              >
                Cancel
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="bg-red-500 text-[hsl(var(--color-foreground))] hover:bg-red-600"
                onClick={handleReject}
                disabled={!rejectReason.trim() || actionLoading === selectedInsight.id}
              >
                Reject Insight
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Notification Toast */}
      {notification && (
        <div className="fixed bottom-6 left-4 right-4 sm:left-auto sm:right-6 z-50 rounded-xl bg-[hsl(var(--color-background))] shadow-lg animate-in slide-in-from-bottom-4 fade-in duration-300">
          <div
            className={`flex items-center gap-3 px-4 py-3 rounded-xl border ${
              notification.type === "success"
                ? "bg-green-500/15 border-green-500/30 text-green-600"
                : notification.type === "error"
                ? "bg-red-500/15 border-red-500/30 text-red-600"
                : "bg-blue-500/15 border-blue-500/30 text-blue-600"
            }`}
          >
            {notification.type === "success" && <IconCheck size={20} className="flex-shrink-0" />}
            {notification.type === "error" && <IconX size={20} className="flex-shrink-0" />}
            {notification.type === "info" && <IconSpinner size={20} className="flex-shrink-0" />}
            <span className="text-sm font-medium">{notification.message}</span>
            <Button
              variant="ghost"
              size="icon"
              className="ml-auto h-7 w-7 shrink-0 text-current hover:bg-[hsl(var(--color-foreground))]/5"
              aria-label="Dismiss notification"
              onClick={() => setNotification(null)}
            >
              <IconX size={16} />
            </Button>
          </div>
        </div>
      )}
    </>
  );
}
