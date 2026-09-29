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
import { IconChevronRight, IconEdit, IconX } from "@/components/admin/icons";

interface Draft {
  id: string;
  title: string;
  subtitle: string | null;
  content: string;
  excerpt: string | null;
  version: number;
  word_count: number | null;
  reading_time: number | null;
  meta_title: string | null;
  meta_description: string | null;
  keywords: string[];
  readability_score: number | null;
  seo_score: number | null;
  originality_score: number | null;
  overall_score: number | null;
  status: string;
  content_briefs: { working_title: string; content_type: string } | null;
  created_at: string;
}

interface Stats {
  total: number;
  draft: number;
  reviewing: number;
  needs_revision: number;
  approved: number;
  published: number;
}

const MODAL_PANEL_CLASS =
  "bg-[hsl(var(--color-background))] border border-[hsl(var(--color-border))]/50 rounded-2xl shadow-2xl w-full";

const MODAL_TITLE_CLASS =
  "font-[family-name:var(--font-heading)] text-lg font-semibold text-[hsl(var(--color-foreground))]";

function formatDate(dateString: string) {
  return new Date(dateString).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
}

function getStatusConfig(status: string) {
  const config: Record<string, { bg: string; text: string; label: string }> = {
    draft: { bg: "bg-[hsl(var(--color-background-muted))]", text: "text-[hsl(var(--color-foreground-muted))]", label: "Draft" },
    reviewing: { bg: "bg-yellow-500/15", text: "text-yellow-600", label: "Reviewing" },
    needs_revision: { bg: "bg-orange-500/15", text: "text-orange-600", label: "Needs Revision" },
    approved: { bg: "bg-green-500/15", text: "text-green-600", label: "Approved" },
    published: { bg: "bg-purple-500/15", text: "text-purple-600", label: "Published" },
  };
  return config[status] || config.draft;
}

function getScoreRing(score: number | null) {
  if (score === null) return { color: "stroke-[hsl(var(--color-border))]", textColor: "text-[hsl(var(--color-foreground-subtle))]" };
  if (score >= 80) return { color: "stroke-green-600", textColor: "text-green-600" };
  if (score >= 60) return { color: "stroke-yellow-600", textColor: "text-yellow-600" };
  return { color: "stroke-red-600", textColor: "text-red-600" };
}

function ScoreCircle({ score, label, size = "md" }: { score: number | null; label: string; size?: "sm" | "md" }) {
  const ring = getScoreRing(score);
  const radius = size === "sm" ? 16 : 20;
  const circumference = 2 * Math.PI * radius;
  const progress = score !== null ? ((score) / 100) * circumference : 0;

  return (
    <div className="flex flex-col items-center gap-1">
      <div className="relative">
        {/* Score ring: a data visualisation, not an icon, so it stays inline */}
        <svg className={size === "sm" ? "w-10 h-10" : "w-12 h-12"} viewBox="0 0 48 48">
          <circle
            cx="24"
            cy="24"
            r={radius}
            fill="none"
            className="stroke-[hsl(var(--color-border))]"
            strokeWidth="3"
          />
          {score !== null && (
            <circle
              cx="24"
              cy="24"
              r={radius}
              fill="none"
              className={ring.color}
              strokeWidth="3"
              strokeDasharray={circumference}
              strokeDashoffset={circumference - progress}
              strokeLinecap="round"
              transform="rotate(-90 24 24)"
            />
          )}
        </svg>
        <span className={`absolute inset-0 flex items-center justify-center text-xs font-semibold ${ring.textColor}`}>
          {score !== null ? score : "—"}
        </span>
      </div>
      <span className="text-[10px] text-[hsl(var(--color-foreground-subtle))]">{label}</span>
    </div>
  );
}

export default function DraftsPage() {
  const [drafts, setDrafts] = React.useState<Draft[]>([]);
  const [stats, setStats] = React.useState<Stats>({ total: 0, draft: 0, reviewing: 0, needs_revision: 0, approved: 0, published: 0 });
  const [loading, setLoading] = React.useState(true);
  const [statusFilter, setStatusFilter] = React.useState<string>("all");
  const [selectedDraft, setSelectedDraft] = React.useState<Draft | null>(null);
  const [actionLoading, setActionLoading] = React.useState<string | null>(null);
  const [revisionFeedback, setRevisionFeedback] = React.useState("");
  const [showRevisionModal, setShowRevisionModal] = React.useState(false);

  const fetchDrafts = React.useCallback(async () => {
    try {
      const url = statusFilter === "all"
        ? "/api/admin/pipeline/drafts"
        : `/api/admin/pipeline/drafts?status=${statusFilter}`;
      const res = await fetch(url);
      if (res.ok) {
        const data = await res.json();
        setDrafts(data);

        // Calculate stats
        const allRes = await fetch("/api/admin/pipeline/drafts");
        if (allRes.ok) {
          const allData = await allRes.json();
          const newStats: Stats = { total: 0, draft: 0, reviewing: 0, needs_revision: 0, approved: 0, published: 0 };
          allData.forEach((draft: Draft) => {
            newStats.total++;
            const status = draft.status as keyof Omit<Stats, 'total'>;
            if (status in newStats) {
              newStats[status]++;
            }
          });
          setStats(newStats);
        }
      }
    } catch (error) {
      console.error("Failed to fetch drafts:", error);
    } finally {
      setLoading(false);
    }
  }, [statusFilter]);

  React.useEffect(() => {
    setLoading(true);
    fetchDrafts();
  }, [fetchDrafts]);

  const handleAction = async (action: string, draftId: string, extraData?: Record<string, string>) => {
    setActionLoading(draftId);
    try {
      const res = await fetch("/api/admin/pipeline/drafts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action,
          draftId,
          ...extraData,
        }),
      });
      if (res.ok) {
        const data = await res.json();
        await fetchDrafts();
        setSelectedDraft(null);
        setShowRevisionModal(false);
        setRevisionFeedback("");
        if (action === "publish" && data.article) {
          // Could show a toast notification here
        }
      }
    } catch (error) {
      console.error(`Failed to ${action}:`, error);
    } finally {
      setActionLoading(null);
    }
  };

  const handleRequestRevision = () => {
    if (selectedDraft && revisionFeedback.trim()) {
      handleAction("revise", selectedDraft.id, { feedback: revisionFeedback });
    }
  };

  if (loading) {
    return <AdminLoader message="Loading drafts..." />;
  }

  return (
    <>
      <PageContainer>
        <PageHeader
          breadcrumb={
            <div className="flex items-center gap-2 text-sm text-[hsl(var(--color-foreground-subtle))]">
              <Link href="/admin/pipeline" className="inline-flex items-center hover:text-[hsl(var(--color-foreground))] transition-colors">Pipeline</Link>
              <IconChevronRight size={16} />
              <span className="text-[hsl(var(--color-foreground))]">Drafts</span>
            </div>
          }
          title="Content Drafts"
          subtitle="AI-generated content ready for review and publishing"
        />

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-4">
          {[
            { label: "Total", value: stats.total },
            { label: "Draft", value: stats.draft },
            { label: "Reviewing", value: stats.reviewing, accent: "warning" as const },
            { label: "Needs Revision", value: stats.needs_revision, accent: "warning" as const },
            { label: "Approved", value: stats.approved, accent: "success" as const },
            { label: "Published", value: stats.published },
          ].map((stat) => (
            <StatCard key={stat.label} label={stat.label} value={stat.value} accent={stat.accent} />
          ))}
        </div>

        {/* Filters */}
        <FilterBar>
          {["all", "draft", "reviewing", "needs_revision", "approved", "published"].map((status) => (
            <FilterChip key={status} active={statusFilter === status} onClick={() => setStatusFilter(status)}>
              {status === "all" ? "All" : status.replace("_", " ").replace(/\b\w/g, (c) => c.toUpperCase())}
            </FilterChip>
          ))}
        </FilterBar>

        {/* Drafts List */}
        <div className="space-y-3">
          {drafts.length === 0 ? (
            <EmptyState
              icon={<IconEdit size={48} />}
              title="No drafts yet"
              description="Drafts are generated from approved briefs"
            />
          ) : (
            drafts.map((draft) => {
              const statusConfig = getStatusConfig(draft.status);

              return (
                <Card key={draft.id} className="p-5">
                  <div className="flex flex-col gap-4 sm:flex-row sm:justify-between sm:items-start">
                    <div className="flex-1 min-w-0">
                      {/* Tags Row */}
                      <div className="flex items-center gap-2 mb-3 flex-wrap">
                        <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${statusConfig.bg} ${statusConfig.text}`}>
                          {statusConfig.label}
                        </span>
                        <span className="text-xs text-[hsl(var(--color-foreground-subtle))]">v{draft.version}</span>
                        {draft.word_count && (
                          <span className="text-xs text-[hsl(var(--color-foreground-subtle))]">{draft.word_count.toLocaleString()} words</span>
                        )}
                        {draft.reading_time && (
                          <span className="text-xs text-[hsl(var(--color-foreground-subtle))]">{draft.reading_time} min read</span>
                        )}
                      </div>

                      {/* Title & Subtitle */}
                      <h3 className="text-base font-semibold text-[hsl(var(--color-foreground))] mb-1 break-words">{draft.title}</h3>
                      {draft.subtitle && (
                        <p className="text-[hsl(var(--color-foreground-muted))] text-sm mb-2">{draft.subtitle}</p>
                      )}
                      {draft.excerpt && (
                        <p className="text-[hsl(var(--color-foreground-subtle))] text-sm mb-3 line-clamp-2">{draft.excerpt}</p>
                      )}

                      {/* Keywords */}
                      <div className="flex flex-wrap gap-1.5 mb-3">
                        {draft.keywords.slice(0, 4).map((keyword, i) => (
                          <span key={i} className="px-2 py-0.5 bg-[hsl(var(--color-background-muted))] rounded text-xs text-[hsl(var(--color-foreground-subtle))]">
                            {keyword}
                          </span>
                        ))}
                        {draft.keywords.length > 4 && (
                          <span className="text-xs text-[hsl(var(--color-foreground-subtle))]">+{draft.keywords.length - 4} more</span>
                        )}
                      </div>

                      {/* Meta */}
                      <div className="text-xs text-[hsl(var(--color-foreground-subtle))]">
                        {formatDate(draft.created_at)}
                      </div>
                    </div>

                    {/* Scores & Actions */}
                    <div className="flex items-start gap-4 sm:flex-shrink-0">
                      {/* Score Circles */}
                      {draft.overall_score !== null && (
                        <div className="hidden md:flex items-center gap-3 pr-4 border-r border-[hsl(var(--color-border))]/50">
                          <ScoreCircle score={draft.overall_score} label="Overall" />
                          <ScoreCircle score={draft.readability_score} label="Read" size="sm" />
                          <ScoreCircle score={draft.seo_score} label="SEO" size="sm" />
                        </div>
                      )}

                      {/* Actions */}
                      <div className="flex flex-row flex-wrap gap-2 sm:flex-col">
                        <Button variant="secondary" size="sm" className="h-8 px-3 text-xs" onClick={() => setSelectedDraft(draft)}>
                          Preview
                        </Button>
                        {draft.status === "draft" && (
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 px-3 text-xs bg-yellow-500/15 text-yellow-600 hover:bg-yellow-500/25"
                            onClick={() => handleAction("review", draft.id)}
                            disabled={actionLoading === draft.id}
                          >
                            AI Review
                          </Button>
                        )}
                        {(draft.status === "draft" || draft.status === "needs_revision" || draft.status === "reviewing") && (
                          <Button
                            variant="accent"
                            size="sm"
                            className="h-8 px-3 text-xs"
                            onClick={() => handleAction("approve", draft.id)}
                            disabled={actionLoading === draft.id}
                          >
                            Approve
                          </Button>
                        )}
                        {draft.status === "approved" && (
                          <Button
                            variant="accent"
                            size="sm"
                            className="h-8 px-3 text-xs"
                            onClick={() => handleAction("publish", draft.id)}
                            disabled={actionLoading === draft.id}
                          >
                            Publish
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                </Card>
              );
            })
          )}
        </div>
      </PageContainer>

      {/* Preview Modal */}
      {selectedDraft && !showRevisionModal && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <div className={`${MODAL_PANEL_CLASS} max-w-4xl max-h-[90vh] overflow-hidden flex flex-col`}>
            {/* Header */}
            <div className="p-6 border-b border-[hsl(var(--color-border))]/50">
              <div className="flex items-start justify-between">
                <div className="flex-1 min-w-0 pr-4">
                  <div className="flex flex-wrap items-center gap-2 mb-2">
                    {(() => {
                      const cfg = getStatusConfig(selectedDraft.status);
                      return (
                        <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${cfg.bg} ${cfg.text}`}>
                          {cfg.label}
                        </span>
                      );
                    })()}
                    <span className="text-xs text-[hsl(var(--color-foreground-subtle))]">v{selectedDraft.version}</span>
                    {selectedDraft.word_count && (
                      <span className="text-xs text-[hsl(var(--color-foreground-subtle))]">{selectedDraft.word_count.toLocaleString()} words</span>
                    )}
                  </div>
                  <h2 className={`${MODAL_TITLE_CLASS} break-words`}>{selectedDraft.title}</h2>
                  {selectedDraft.subtitle && (
                    <p className="text-[hsl(var(--color-foreground-muted))] mt-1">{selectedDraft.subtitle}</p>
                  )}
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-9 w-9 shrink-0"
                  aria-label="Close"
                  onClick={() => setSelectedDraft(null)}
                >
                  <IconX size={20} />
                </Button>
              </div>
            </div>

            {/* Score Bar */}
            {selectedDraft.overall_score !== null && (
              <div className="p-4 bg-[hsl(var(--color-background-muted))]/40 border-b border-[hsl(var(--color-border))]/50 flex flex-wrap items-center justify-center gap-6 sm:gap-8">
                <ScoreCircle score={selectedDraft.overall_score} label="Overall" />
                <ScoreCircle score={selectedDraft.readability_score} label="Readability" size="sm" />
                <ScoreCircle score={selectedDraft.seo_score} label="SEO" size="sm" />
                <ScoreCircle score={selectedDraft.originality_score} label="Originality" size="sm" />
              </div>
            )}

            {/* Meta Info */}
            <div className="p-4 bg-[hsl(var(--color-background-muted))]/40 border-b border-[hsl(var(--color-border))]/50">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm break-words">
                <div>
                  <p className="text-xs text-[hsl(var(--color-foreground-subtle))] mb-1">Meta Title</p>
                  <p className="text-[hsl(var(--color-foreground))]">{selectedDraft.meta_title || selectedDraft.title}</p>
                </div>
                <div>
                  <p className="text-xs text-[hsl(var(--color-foreground-subtle))] mb-1">Meta Description</p>
                  <p className="text-[hsl(var(--color-foreground))] line-clamp-2">{selectedDraft.meta_description || "Not set"}</p>
                </div>
              </div>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-6">
              <div className="prose prose-invert max-w-none">
                <div className="text-[hsl(var(--color-foreground))] whitespace-pre-wrap break-words leading-relaxed">
                  {selectedDraft.content.slice(0, 8000)}
                  {selectedDraft.content.length > 8000 && (
                    <p className="text-[hsl(var(--color-foreground-subtle))] italic mt-6 pt-4 border-t border-[hsl(var(--color-border))]/50">
                      Content truncated for preview ({(selectedDraft.content.length - 8000).toLocaleString()} more characters)
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="p-6 border-t border-[hsl(var(--color-border))]/50 flex flex-col gap-3 sm:flex-row sm:justify-between sm:items-center">
              <div className="flex items-center gap-4">
                {selectedDraft.reading_time && (
                  <span className="text-sm text-[hsl(var(--color-foreground-subtle))]">{selectedDraft.reading_time} min read</span>
                )}
              </div>
              <div className="flex flex-wrap gap-3">
                <Button variant="secondary" size="sm" onClick={() => setSelectedDraft(null)}>
                  Close
                </Button>
                {selectedDraft.status !== "published" && (
                  <>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="bg-orange-500/15 text-orange-600 hover:bg-orange-500/25"
                      onClick={() => setShowRevisionModal(true)}
                    >
                      Request Revision
                    </Button>
                    {selectedDraft.status === "approved" ? (
                      <Button
                        variant="accent"
                        size="sm"
                        onClick={() => handleAction("publish", selectedDraft.id)}
                        disabled={actionLoading === selectedDraft.id}
                      >
                        Publish Now
                      </Button>
                    ) : (
                      <Button
                        variant="accent"
                        size="sm"
                        onClick={() => handleAction("approve", selectedDraft.id)}
                        disabled={actionLoading === selectedDraft.id}
                      >
                        Approve Draft
                      </Button>
                    )}
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Revision Modal */}
      {showRevisionModal && selectedDraft && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <div className={`${MODAL_PANEL_CLASS} max-w-md max-h-[90vh] overflow-y-auto`}>
            <div className="p-6 border-b border-[hsl(var(--color-border))]/50">
              <h2 className={MODAL_TITLE_CLASS}>Request Revision</h2>
              <p className="text-sm text-[hsl(var(--color-foreground-subtle))] mt-1">What changes should be made to this draft?</p>
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
                disabled={!revisionFeedback.trim() || actionLoading === selectedDraft.id}
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
