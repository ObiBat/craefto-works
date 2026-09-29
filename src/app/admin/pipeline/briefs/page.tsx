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
  InfoField,
} from "@/components/admin/ui";
import { IconChevronRight, IconFileText, IconUsers, IconX } from "@/components/admin/icons";

interface Brief {
  id: string;
  working_title: string;
  angle: string;
  thesis_statement: string | null;
  target_audience: string | null;
  content_type: string | null;
  outline: Array<{ heading: string; points: string[]; notes?: string }>;
  key_takeaways: string[];
  primary_keyword: string | null;
  secondary_keywords: string[];
  target_word_count: number | null;
  status: string;
  content_insights: { title: string } | null;
  journal_pillars: { name: string; slug: string } | null;
  created_at: string;
}

interface Stats {
  total: number;
  draft: number;
  approved: number;
  in_progress: number;
  completed: number;
  rejected: number;
}

const MODAL_PANEL_CLASS =
  "bg-[hsl(var(--color-background))] border border-[hsl(var(--color-border))]/50 rounded-2xl shadow-2xl w-full";

const MODAL_TITLE_CLASS =
  "font-[family-name:var(--font-heading)] text-lg font-semibold text-[hsl(var(--color-foreground))]";

const SUBHEADING_CLASS = "text-base font-semibold text-[hsl(var(--color-foreground))]";

function formatDate(dateString: string) {
  return new Date(dateString).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
}

function getStatusConfig(status: string) {
  const config: Record<string, { bg: string; text: string; label: string }> = {
    draft: { bg: "bg-[hsl(var(--color-background-muted))]", text: "text-[hsl(var(--color-foreground-muted))]", label: "Draft" },
    approved: { bg: "bg-green-500/15", text: "text-green-600", label: "Approved" },
    rejected: { bg: "bg-red-500/15", text: "text-red-600", label: "Rejected" },
    in_progress: { bg: "bg-blue-500/15", text: "text-blue-600", label: "In Progress" },
    completed: { bg: "bg-purple-500/15", text: "text-purple-600", label: "Completed" },
  };
  return config[status] || config.draft;
}

function getContentTypeIcon(type: string | null) {
  const icons: Record<string, { icon: string; label: string }> = {
    article: { icon: "📝", label: "Article" },
    deep_dive: { icon: "🔬", label: "Deep Dive" },
    case_study: { icon: "📊", label: "Case Study" },
    tutorial: { icon: "🎓", label: "Tutorial" },
    opinion: { icon: "💭", label: "Opinion" },
  };
  return type ? icons[type] || { icon: "📄", label: type } : { icon: "📄", label: "Unknown" };
}

export default function BriefsPage() {
  const [briefs, setBriefs] = React.useState<Brief[]>([]);
  const [stats, setStats] = React.useState<Stats>({ total: 0, draft: 0, approved: 0, in_progress: 0, completed: 0, rejected: 0 });
  const [loading, setLoading] = React.useState(true);
  const [statusFilter, setStatusFilter] = React.useState<string>("all");
  const [selectedBrief, setSelectedBrief] = React.useState<Brief | null>(null);
  const [actionLoading, setActionLoading] = React.useState<string | null>(null);
  const [revisionFeedback, setRevisionFeedback] = React.useState("");
  const [showRevisionModal, setShowRevisionModal] = React.useState(false);

  const fetchBriefs = React.useCallback(async () => {
    try {
      const url = statusFilter === "all"
        ? "/api/admin/pipeline/briefs"
        : `/api/admin/pipeline/briefs?status=${statusFilter}`;
      const res = await fetch(url);
      if (res.ok) {
        const data = await res.json();
        setBriefs(data);

        // Calculate stats
        const allRes = await fetch("/api/admin/pipeline/briefs");
        if (allRes.ok) {
          const allData = await allRes.json();
          const newStats: Stats = { total: 0, draft: 0, approved: 0, in_progress: 0, completed: 0, rejected: 0 };
          allData.forEach((brief: Brief) => {
            newStats.total++;
            const status = brief.status as keyof Omit<Stats, 'total'>;
            if (status in newStats) {
              newStats[status]++;
            }
          });
          setStats(newStats);
        }
      }
    } catch (error) {
      console.error("Failed to fetch briefs:", error);
    } finally {
      setLoading(false);
    }
  }, [statusFilter]);

  React.useEffect(() => {
    setLoading(true);
    fetchBriefs();
  }, [fetchBriefs]);

  const handleAction = async (action: string, briefId: string, extraData?: Record<string, string>) => {
    setActionLoading(briefId);
    try {
      const res = await fetch("/api/admin/pipeline/briefs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action,
          briefId,
          reviewedBy: "admin",
          ...extraData,
        }),
      });
      if (res.ok) {
        await fetchBriefs();
        setSelectedBrief(null);
        setShowRevisionModal(false);
        setRevisionFeedback("");
      }
    } catch (error) {
      console.error(`Failed to ${action}:`, error);
    } finally {
      setActionLoading(null);
    }
  };

  const handleRequestRevision = () => {
    if (selectedBrief && revisionFeedback.trim()) {
      handleAction("reject", selectedBrief.id, { feedback: revisionFeedback });
    }
  };

  if (loading) {
    return <AdminLoader message="Loading briefs..." />;
  }

  return (
    <>
      <PageContainer>
        <PageHeader
          breadcrumb={
            <div className="flex items-center gap-2 text-sm text-[hsl(var(--color-foreground-subtle))]">
              <Link href="/admin/pipeline" className="inline-flex items-center hover:text-[hsl(var(--color-foreground))] transition-colors">Pipeline</Link>
              <IconChevronRight size={16} />
              <span className="text-[hsl(var(--color-foreground))]">Briefs</span>
            </div>
          }
          title="Content Briefs"
          subtitle="Structured outlines ready for writing"
        />

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-4">
          {[
            { label: "Total", value: stats.total },
            { label: "Draft", value: stats.draft },
            { label: "Approved", value: stats.approved, accent: "success" as const },
            { label: "In Progress", value: stats.in_progress },
            { label: "Completed", value: stats.completed },
            { label: "Rejected", value: stats.rejected, accent: "error" as const },
          ].map((stat) => (
            <StatCard key={stat.label} label={stat.label} value={stat.value} accent={stat.accent} />
          ))}
        </div>

        {/* Filters */}
        <FilterBar>
          {["all", "draft", "approved", "in_progress", "completed", "rejected"].map((status) => (
            <FilterChip key={status} active={statusFilter === status} onClick={() => setStatusFilter(status)}>
              {status === "all" ? "All" : status.replace("_", " ").replace(/\b\w/g, (c) => c.toUpperCase())}
            </FilterChip>
          ))}
        </FilterBar>

        {/* Briefs List */}
        <div className="space-y-3">
          {briefs.length === 0 ? (
            <EmptyState
              icon={<IconFileText size={48} />}
              title="No briefs yet"
              description="Briefs are created from approved insights"
            />
          ) : (
            briefs.map((brief) => {
              const statusConfig = getStatusConfig(brief.status);
              const contentType = getContentTypeIcon(brief.content_type);

              return (
                <Card key={brief.id} className="p-5">
                  <div className="flex flex-col gap-4 sm:flex-row sm:justify-between sm:items-start">
                    <div className="flex-1 min-w-0">
                      {/* Tags Row */}
                      <div className="flex items-center gap-2 mb-3 flex-wrap">
                        <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${statusConfig.bg} ${statusConfig.text}`}>
                          {statusConfig.label}
                        </span>
                        <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs bg-[hsl(var(--color-background-muted))] text-[hsl(var(--color-foreground-muted))]">
                          <span>{contentType.icon}</span>
                          {contentType.label}
                        </span>
                        {brief.target_word_count && (
                          <span className="text-xs text-[hsl(var(--color-foreground-subtle))]">~{brief.target_word_count} words</span>
                        )}
                      </div>

                      {/* Title & Angle */}
                      <h3 className={`${SUBHEADING_CLASS} mb-2 break-words`}>{brief.working_title}</h3>
                      <p className="text-[hsl(var(--color-foreground-muted))] text-sm mb-3 line-clamp-2">{brief.angle}</p>

                      {/* Keywords */}
                      <div className="flex flex-wrap gap-1.5 mb-3">
                        {brief.primary_keyword && (
                          <span className="px-2.5 py-1 bg-[hsl(var(--color-accent))]/15 text-[hsl(var(--color-accent))] rounded-md text-xs font-medium">
                            {brief.primary_keyword}
                          </span>
                        )}
                        {brief.secondary_keywords.slice(0, 3).map((keyword, i) => (
                          <span key={i} className="px-2 py-0.5 bg-[hsl(var(--color-background-muted))] rounded text-xs text-[hsl(var(--color-foreground-subtle))]">
                            {keyword}
                          </span>
                        ))}
                        {brief.secondary_keywords.length > 3 && (
                          <span className="text-xs text-[hsl(var(--color-foreground-subtle))]">+{brief.secondary_keywords.length - 3} more</span>
                        )}
                      </div>

                      {/* Meta */}
                      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-[hsl(var(--color-foreground-subtle))]">
                        {brief.target_audience && (
                          <span className="flex items-center gap-1">
                            <IconUsers size={14} />
                            {brief.target_audience}
                          </span>
                        )}
                        <span>{formatDate(brief.created_at)}</span>
                        <span>{brief.outline.length} sections</span>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex flex-row flex-wrap gap-2 sm:flex-col sm:flex-shrink-0">
                      <Button variant="secondary" size="sm" className="h-8 px-3 text-xs" onClick={() => setSelectedBrief(brief)}>
                        View
                      </Button>
                      {brief.status === "draft" && (
                        <>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 px-3 text-xs bg-purple-500/15 text-purple-600 hover:bg-purple-500/25"
                            onClick={() => handleAction("seo_optimize", brief.id)}
                            disabled={actionLoading === brief.id}
                          >
                            SEO Optimize
                          </Button>
                          <Button
                            variant="accent"
                            size="sm"
                            className="h-8 px-3 text-xs"
                            onClick={() => handleAction("approve", brief.id)}
                            disabled={actionLoading === brief.id}
                          >
                            Approve
                          </Button>
                        </>
                      )}
                      {brief.status === "approved" && (
                        <Button
                          variant="accent"
                          size="sm"
                          className="h-8 px-3 text-xs"
                          onClick={() => handleAction("write", brief.id)}
                          disabled={actionLoading === brief.id}
                        >
                          Generate Draft
                        </Button>
                      )}
                    </div>
                  </div>
                </Card>
              );
            })
          )}
        </div>
      </PageContainer>

      {/* Detail Modal */}
      {selectedBrief && !showRevisionModal && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <div className={`${MODAL_PANEL_CLASS} max-w-3xl max-h-[90vh] overflow-hidden flex flex-col`}>
            {/* Header */}
            <div className="p-6 border-b border-[hsl(var(--color-border))]/50">
              <div className="flex items-start justify-between">
                <div className="flex-1 min-w-0 pr-4">
                  <div className="flex flex-wrap items-center gap-2 mb-2">
                    {(() => {
                      const cfg = getStatusConfig(selectedBrief.status);
                      const ct = getContentTypeIcon(selectedBrief.content_type);
                      return (
                        <>
                          <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${cfg.bg} ${cfg.text}`}>
                            {cfg.label}
                          </span>
                          <span className="flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs bg-[hsl(var(--color-background-muted))] text-[hsl(var(--color-foreground-muted))]">
                            <span>{ct.icon}</span>
                            {ct.label}
                          </span>
                        </>
                      );
                    })()}
                  </div>
                  <h2 className={`${MODAL_TITLE_CLASS} break-words`}>{selectedBrief.working_title}</h2>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-9 w-9 shrink-0"
                  aria-label="Close"
                  onClick={() => setSelectedBrief(null)}
                >
                  <IconX size={20} />
                </Button>
              </div>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              {/* Meta Grid */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 rounded-xl bg-[hsl(var(--color-background-muted))]/40 p-4 break-words">
                <InfoField label="Audience" value={selectedBrief.target_audience || "Not specified"} />
                <InfoField
                  label="Word Count"
                  value={selectedBrief.target_word_count ? `~${selectedBrief.target_word_count}` : "Not set"}
                />
                <InfoField
                  label="Primary Keyword"
                  value={
                    <span className="text-[hsl(var(--color-accent))] font-medium">
                      {selectedBrief.primary_keyword || "Not set"}
                    </span>
                  }
                />
                <InfoField label="Sections" value={selectedBrief.outline.length} />
              </div>

              {/* Angle */}
              <div>
                <h3 className={`${SUBHEADING_CLASS} mb-2`}>Angle</h3>
                <p className="text-[hsl(var(--color-foreground))]">{selectedBrief.angle}</p>
              </div>

              {/* Thesis */}
              {selectedBrief.thesis_statement && (
                <div className="p-4 bg-[hsl(var(--color-accent))]/5 border border-[hsl(var(--color-accent))]/20 rounded-xl">
                  <h3 className="text-base font-semibold text-[hsl(var(--color-accent))] mb-2">Thesis Statement</h3>
                  <p className="text-[hsl(var(--color-foreground))] italic">&ldquo;{selectedBrief.thesis_statement}&rdquo;</p>
                </div>
              )}

              {/* Outline */}
              <div>
                <h3 className={`${SUBHEADING_CLASS} mb-3`}>Outline</h3>
                <div className="space-y-3">
                  {selectedBrief.outline.map((section, i) => (
                    <div key={i} className="rounded-xl bg-[hsl(var(--color-background-muted))]/40 p-4">
                      <div className="flex items-start gap-3">
                        <span className="w-6 h-6 rounded-full bg-[hsl(var(--color-background))] flex items-center justify-center text-xs text-[hsl(var(--color-foreground-subtle))] flex-shrink-0">
                          {i + 1}
                        </span>
                        <div className="flex-1 min-w-0">
                          <h4 className="font-medium text-[hsl(var(--color-foreground))] mb-2">{section.heading}</h4>
                          <ul className="space-y-1.5">
                            {section.points.map((point, j) => (
                              <li key={j} className="flex gap-2 text-sm text-[hsl(var(--color-foreground-muted))]">
                                <span className="text-[hsl(var(--color-foreground-subtle))]">•</span>
                                {point}
                              </li>
                            ))}
                          </ul>
                          {section.notes && (
                            <p className="mt-2 text-xs text-[hsl(var(--color-foreground-subtle))] italic">Note: {section.notes}</p>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Key Takeaways */}
              {selectedBrief.key_takeaways.length > 0 && (
                <div>
                  <h3 className={`${SUBHEADING_CLASS} mb-2`}>Key Takeaways</h3>
                  <ul className="space-y-2">
                    {selectedBrief.key_takeaways.map((takeaway, i) => (
                      <li key={i} className="flex gap-3 text-[hsl(var(--color-foreground-muted))]">
                        <span className="text-[hsl(var(--color-accent))] flex-shrink-0">✓</span>
                        {takeaway}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Secondary Keywords */}
              {selectedBrief.secondary_keywords.length > 0 && (
                <div>
                  <h3 className={`${SUBHEADING_CLASS} mb-2`}>Secondary Keywords</h3>
                  <div className="flex flex-wrap gap-2">
                    {selectedBrief.secondary_keywords.map((keyword, i) => (
                      <span key={i} className="px-3 py-1.5 bg-[hsl(var(--color-background-muted))] rounded-xl text-sm text-[hsl(var(--color-foreground-muted))]">
                        {keyword}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="p-6 border-t border-[hsl(var(--color-border))]/50 flex flex-wrap justify-end gap-3">
              <Button variant="secondary" size="sm" onClick={() => setSelectedBrief(null)}>
                Close
              </Button>
              {selectedBrief.status === "draft" && (
                <>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="bg-orange-500/15 text-orange-600 hover:bg-orange-500/25"
                    onClick={() => setShowRevisionModal(true)}
                  >
                    Request Revisions
                  </Button>
                  <Button
                    variant="accent"
                    size="sm"
                    onClick={() => handleAction("approve", selectedBrief.id)}
                    disabled={actionLoading === selectedBrief.id}
                  >
                    Approve Brief
                  </Button>
                </>
              )}
              {selectedBrief.status === "approved" && (
                <Button
                  variant="accent"
                  size="sm"
                  onClick={() => handleAction("write", selectedBrief.id)}
                  disabled={actionLoading === selectedBrief.id}
                >
                  Generate Draft
                </Button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Revision Modal */}
      {showRevisionModal && selectedBrief && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <div className={`${MODAL_PANEL_CLASS} max-w-md max-h-[90vh] overflow-y-auto`}>
            <div className="p-6 border-b border-[hsl(var(--color-border))]/50">
              <h2 className={MODAL_TITLE_CLASS}>Request Revisions</h2>
              <p className="text-sm text-[hsl(var(--color-foreground-subtle))] mt-1">What changes would improve this brief?</p>
            </div>
            <div className="p-6">
              <textarea
                value={revisionFeedback}
                onChange={(e) => setRevisionFeedback(e.target.value)}
                placeholder="Describe the revisions needed..."
                aria-label="Revision feedback"
                className="w-full h-32 px-4 py-2.5 rounded-xl bg-[hsl(var(--color-background))] border border-[hsl(var(--color-border))] text-sm text-[hsl(var(--color-foreground))] placeholder:text-[hsl(var(--color-foreground-subtle))] focus:outline-none focus:ring-2 focus:ring-[hsl(var(--color-accent))]/40 focus:border-[hsl(var(--color-accent))]/40 resize-none"
              />
            </div>
            <div className="p-6 border-t border-[hsl(var(--color-border))]/50 flex flex-wrap justify-end gap-3">
              <Button
                variant="secondary"
                size="sm"
                onClick={() => {
                  setShowRevisionModal(false);
                  setRevisionFeedback("");
                }}
              >
                Cancel
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="bg-orange-500 text-[hsl(var(--color-foreground))] hover:bg-orange-600"
                onClick={handleRequestRevision}
                disabled={!revisionFeedback.trim() || actionLoading === selectedBrief.id}
              >
                Send Feedback
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
