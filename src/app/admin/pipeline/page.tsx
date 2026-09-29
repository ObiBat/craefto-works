"use client";

import * as React from "react";
import Link from "next/link";
import { AdminLoader } from "@/components/admin/AdminLoader";
import { Button } from "@/components/ui/button";
import { PageContainer, PageHeader, Card, EmptyState } from "@/components/admin/ui";
import {
  IconChevronRight,
  IconClock,
  IconEdit,
  IconFileText,
  IconLightbulb,
  IconPlus,
  IconSpinner,
} from "@/components/admin/icons";

interface PipelineStats {
  insights: { new: number; approved: number; total: number };
  briefs: { draft: number; approved: number; total: number };
  drafts: { draft: number; approved: number; published: number; total: number };
}

interface QueueItem {
  id: string;
  item_type: string;
  item_id: string;
  current_stage: string;
  status: string;
  priority: number;
  created_at: string;
}

interface Schedule {
  id: string;
  name: string;
  schedule_type: string;
  day_of_week: number | null;
  hour: number;
  enabled: boolean;
  last_run_at: string | null;
  next_run_at: string | null;
  topics: string[];
}

const STAGE_CARD_CLASS =
  "group block bg-[hsl(var(--color-background-subtle))]/50 backdrop-blur-sm border border-[hsl(var(--color-border))]/50 rounded-2xl p-6 hover:bg-[hsl(var(--color-background-subtle))]/80 transition-all duration-200";

const CARD_TITLE_CLASS =
  "font-[family-name:var(--font-heading)] text-lg font-semibold text-[hsl(var(--color-foreground))]";

function formatDate(dateString: string) {
  return new Date(dateString).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function PipelineDashboard() {
  const [stats, setStats] = React.useState<PipelineStats | null>(null);
  const [awaitingApproval, setAwaitingApproval] = React.useState<QueueItem[]>([]);
  const [schedules, setSchedules] = React.useState<Schedule[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [scanning, setScanning] = React.useState(false);

  const fetchData = React.useCallback(async () => {
    try {
      // Fetch pipeline status
      const pipelineRes = await fetch("/api/admin/pipeline");
      if (pipelineRes.ok) {
        const data = await pipelineRes.json();
        setAwaitingApproval(data.awaitingApproval || []);
      }

      // Fetch schedules
      const scheduleRes = await fetch("/api/admin/pipeline/schedule");
      if (scheduleRes.ok) {
        const scheduleData = await scheduleRes.json();
        setSchedules(scheduleData || []);
      }

      // Fetch counts for each stage
      const [insightsRes, briefsRes, draftsRes] = await Promise.all([
        fetch("/api/admin/pipeline/insights"),
        fetch("/api/admin/pipeline/briefs"),
        fetch("/api/admin/pipeline/drafts"),
      ]);

      const insights = insightsRes.ok ? await insightsRes.json() : [];
      const briefs = briefsRes.ok ? await briefsRes.json() : [];
      const drafts = draftsRes.ok ? await draftsRes.json() : [];

      setStats({
        insights: {
          new: insights.filter((i: { status: string }) => i.status === "new").length,
          approved: insights.filter((i: { status: string }) => i.status === "approved").length,
          total: insights.length,
        },
        briefs: {
          draft: briefs.filter((b: { status: string }) => b.status === "draft").length,
          approved: briefs.filter((b: { status: string }) => b.status === "approved").length,
          total: briefs.length,
        },
        drafts: {
          draft: drafts.filter((d: { status: string }) => d.status === "draft" || d.status === "reviewing").length,
          approved: drafts.filter((d: { status: string }) => d.status === "approved").length,
          published: drafts.filter((d: { status: string }) => d.status === "published").length,
          total: drafts.length,
        },
      });
    } catch (error) {
      console.error("Failed to fetch pipeline data:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 30000);
    return () => clearInterval(interval);
  }, [fetchData]);

  const runScan = async () => {
    setScanning(true);
    try {
      await fetch("/api/admin/pipeline/insights", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "scan" }),
      });
      await fetchData();
    } catch (error) {
      console.error("Failed to run scan:", error);
    } finally {
      setScanning(false);
    }
  };

  const toggleSchedule = async (scheduleId: string) => {
    try {
      await fetch("/api/admin/pipeline/schedule", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "toggle", scheduleId }),
      });
      await fetchData();
    } catch (error) {
      console.error("Failed to toggle schedule:", error);
    }
  };

  const formatNextRun = (nextRun: string | null) => {
    if (!nextRun) return "Not scheduled";
    const date = new Date(nextRun);
    const now = new Date();
    const diff = date.getTime() - now.getTime();
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    if (days === 0) return "Today";
    if (days === 1) return "Tomorrow";
    if (days < 7) return `In ${days} days`;
    return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  };

  if (loading) {
    return <AdminLoader message="Loading pipeline..." />;
  }

  const needsAttention = (stats?.insights.new || 0) + (stats?.briefs.draft || 0) + (stats?.drafts.draft || 0);

  return (
    <PageContainer>
      <PageHeader
        title="Content Pipeline"
        subtitle={
          needsAttention > 0 ? (
            <span className="text-yellow-600">{needsAttention} items need your attention</span>
          ) : (
            "All caught up"
          )
        }
        actions={
          <Button variant="accent" size="sm" onClick={runScan} disabled={scanning}>
            {scanning ? <IconSpinner size={16} /> : <IconPlus size={16} />}
            {scanning ? "Scanning..." : "New Scan"}
          </Button>
        }
      />

      {/* Pipeline Flow */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Insights */}
        <Link href="/admin/pipeline/insights" className={`${STAGE_CARD_CLASS} hover:border-purple-500/50`}>
          <div className="flex items-center justify-between mb-6">
            <div className="w-12 h-12 bg-purple-500/20 text-purple-600 rounded-xl flex items-center justify-center">
              <IconLightbulb size={24} />
            </div>
            <IconChevronRight
              size={20}
              className="text-[hsl(var(--color-foreground-subtle))] group-hover:text-purple-600 transition-colors"
            />
          </div>
          <h2 className={`${CARD_TITLE_CLASS} mb-1`}>Insights</h2>
          <p className="text-sm text-[hsl(var(--color-foreground-subtle))] mb-4">Content opportunities discovered</p>
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm text-[hsl(var(--color-foreground-muted))]">New to review</span>
              <span className={`text-sm font-medium ${(stats?.insights.new || 0) > 0 ? "text-yellow-600" : "text-[hsl(var(--color-foreground-subtle))]"}`}>
                {stats?.insights.new || 0}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-[hsl(var(--color-foreground-muted))]">Ready for brief</span>
              <span className={`text-sm font-medium ${(stats?.insights.approved || 0) > 0 ? "text-green-600" : "text-[hsl(var(--color-foreground-subtle))]"}`}>
                {stats?.insights.approved || 0}
              </span>
            </div>
          </div>
        </Link>

        {/* Briefs */}
        <Link href="/admin/pipeline/briefs" className={`${STAGE_CARD_CLASS} hover:border-blue-500/50`}>
          <div className="flex items-center justify-between mb-6">
            <div className="w-12 h-12 bg-blue-500/20 text-blue-600 rounded-xl flex items-center justify-center">
              <IconFileText size={24} />
            </div>
            <IconChevronRight
              size={20}
              className="text-[hsl(var(--color-foreground-subtle))] group-hover:text-blue-600 transition-colors"
            />
          </div>
          <h2 className={`${CARD_TITLE_CLASS} mb-1`}>Briefs</h2>
          <p className="text-sm text-[hsl(var(--color-foreground-subtle))] mb-4">Content outlines and plans</p>
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm text-[hsl(var(--color-foreground-muted))]">Draft to review</span>
              <span className={`text-sm font-medium ${(stats?.briefs.draft || 0) > 0 ? "text-yellow-600" : "text-[hsl(var(--color-foreground-subtle))]"}`}>
                {stats?.briefs.draft || 0}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-[hsl(var(--color-foreground-muted))]">Ready to write</span>
              <span className={`text-sm font-medium ${(stats?.briefs.approved || 0) > 0 ? "text-green-600" : "text-[hsl(var(--color-foreground-subtle))]"}`}>
                {stats?.briefs.approved || 0}
              </span>
            </div>
          </div>
        </Link>

        {/* Drafts */}
        <Link href="/admin/pipeline/drafts" className={`${STAGE_CARD_CLASS} hover:border-green-500/50`}>
          <div className="flex items-center justify-between mb-6">
            <div className="w-12 h-12 bg-green-500/20 text-green-600 rounded-xl flex items-center justify-center">
              <IconEdit size={24} />
            </div>
            <IconChevronRight
              size={20}
              className="text-[hsl(var(--color-foreground-subtle))] group-hover:text-green-600 transition-colors"
            />
          </div>
          <h2 className={`${CARD_TITLE_CLASS} mb-1`}>Drafts</h2>
          <p className="text-sm text-[hsl(var(--color-foreground-subtle))] mb-4">Written content ready for review</p>
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm text-[hsl(var(--color-foreground-muted))]">In review</span>
              <span className={`text-sm font-medium ${(stats?.drafts.draft || 0) > 0 ? "text-yellow-600" : "text-[hsl(var(--color-foreground-subtle))]"}`}>
                {stats?.drafts.draft || 0}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-[hsl(var(--color-foreground-muted))]">Ready to publish</span>
              <span className={`text-sm font-medium ${(stats?.drafts.approved || 0) > 0 ? "text-green-600" : "text-[hsl(var(--color-foreground-subtle))]"}`}>
                {stats?.drafts.approved || 0}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-[hsl(var(--color-foreground-muted))]">Published</span>
              <span className="text-sm font-medium text-[hsl(var(--color-foreground-subtle))]">{stats?.drafts.published || 0}</span>
            </div>
          </div>
        </Link>
      </div>

      {/* Scheduled Scans */}
      {schedules.length > 0 && (
        <Card>
          <h2 className={`${CARD_TITLE_CLASS} mb-4`}>Scheduled Scans</h2>
          <div className="space-y-3">
            {schedules.map((schedule) => (
              <div
                key={schedule.id}
                className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between rounded-xl bg-[hsl(var(--color-background-muted))]/40 p-4"
              >
                <div className="flex items-center gap-4 min-w-0">
                  <div
                    className={`w-10 h-10 shrink-0 rounded-xl flex items-center justify-center ${
                      schedule.enabled ? "bg-green-500/20 text-green-600" : "bg-[hsl(var(--color-background-muted))] text-[hsl(var(--color-foreground-muted))]"
                    }`}
                  >
                    <IconClock size={20} />
                  </div>
                  <div className="min-w-0 break-words">
                    <p className="font-medium text-[hsl(var(--color-foreground))]">{schedule.name}</p>
                    <p className="text-xs text-[hsl(var(--color-foreground-subtle))]">
                      {schedule.schedule_type.charAt(0).toUpperCase() + schedule.schedule_type.slice(1)} • {schedule.topics.slice(0, 2).join(", ")}
                      {schedule.topics.length > 2 && ` +${schedule.topics.length - 2} more`}
                    </p>
                  </div>
                </div>
                <div className="flex items-center justify-between gap-4 sm:justify-end shrink-0">
                  <div className="sm:text-right">
                    <p className="text-xs text-[hsl(var(--color-foreground-subtle))]">Next run</p>
                    <p className={`text-sm font-medium ${schedule.enabled ? "text-[hsl(var(--color-foreground))]" : "text-[hsl(var(--color-foreground-muted))]"}`}>
                      {schedule.enabled ? formatNextRun(schedule.next_run_at) : "Disabled"}
                    </p>
                  </div>
                  <button
                    onClick={() => toggleSchedule(schedule.id)}
                    role="switch"
                    aria-checked={schedule.enabled}
                    aria-label={`Toggle ${schedule.name}`}
                    className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors ${
                      schedule.enabled ? "bg-green-600" : "bg-[hsl(var(--color-border))]"
                    }`}
                  >
                    <span
                      className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                        schedule.enabled ? "translate-x-6" : "translate-x-1"
                      }`}
                    />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Workflow Guide */}
      <Card>
        <h2 className={`${CARD_TITLE_CLASS} mb-4`}>Workflow</h2>
        <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 shrink-0 rounded-full bg-purple-500/20 text-purple-600 flex items-center justify-center text-sm font-medium">1</div>
            <span className="text-sm text-[hsl(var(--color-foreground-muted))]">Scan for insights</span>
          </div>
          <IconChevronRight size={16} className="hidden xl:block shrink-0 text-[hsl(var(--color-border))]" />
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 shrink-0 rounded-full bg-purple-500/20 text-purple-600 flex items-center justify-center text-sm font-medium">2</div>
            <span className="text-sm text-[hsl(var(--color-foreground-muted))]">Approve insight</span>
          </div>
          <IconChevronRight size={16} className="hidden xl:block shrink-0 text-[hsl(var(--color-border))]" />
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 shrink-0 rounded-full bg-blue-500/20 text-blue-600 flex items-center justify-center text-sm font-medium">3</div>
            <span className="text-sm text-[hsl(var(--color-foreground-muted))]">Create brief</span>
          </div>
          <IconChevronRight size={16} className="hidden xl:block shrink-0 text-[hsl(var(--color-border))]" />
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 shrink-0 rounded-full bg-blue-500/20 text-blue-600 flex items-center justify-center text-sm font-medium">4</div>
            <span className="text-sm text-[hsl(var(--color-foreground-muted))]">Write draft</span>
          </div>
          <IconChevronRight size={16} className="hidden xl:block shrink-0 text-[hsl(var(--color-border))]" />
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 shrink-0 rounded-full bg-green-500/20 text-green-600 flex items-center justify-center text-sm font-medium">5</div>
            <span className="text-sm text-[hsl(var(--color-foreground-muted))]">Publish</span>
          </div>
        </div>
      </Card>

      {/* Awaiting Approval Queue */}
      {awaitingApproval.length > 0 && (
        <Card padding="none" className="overflow-hidden">
          <div className="px-6 py-4 border-b border-[hsl(var(--color-border))]/30 flex items-center justify-between gap-4">
            <h2 className={CARD_TITLE_CLASS}>Awaiting Approval</h2>
            <span className="px-2.5 py-0.5 rounded-full bg-yellow-500/20 text-yellow-600 text-xs font-medium">
              {awaitingApproval.length}
            </span>
          </div>
          <div className="divide-y divide-[hsl(var(--color-border))]/30">
            {awaitingApproval.slice(0, 5).map((item) => (
              <div
                key={item.id}
                className="px-6 py-4 flex items-center justify-between gap-4 hover:bg-[hsl(var(--color-background-muted))]/30 transition-colors"
              >
                <div className="flex items-center gap-4 min-w-0">
                  <div
                    className={`w-10 h-10 shrink-0 rounded-xl flex items-center justify-center ${
                      item.item_type === "insight" ? "bg-purple-500/20 text-purple-600" :
                      item.item_type === "brief" ? "bg-blue-500/20 text-blue-600" :
                      "bg-green-500/20 text-green-600"
                    }`}
                  >
                    {item.item_type === "insight" ? (
                      <IconLightbulb size={20} />
                    ) : item.item_type === "brief" ? (
                      <IconFileText size={20} />
                    ) : (
                      <IconEdit size={20} />
                    )}
                  </div>
                  <div className="min-w-0">
                    <p className="text-[hsl(var(--color-foreground))] font-medium capitalize">{item.item_type}</p>
                    <p className="text-xs text-[hsl(var(--color-foreground-subtle))]">{formatDate(item.created_at)}</p>
                  </div>
                </div>
                <Button asChild variant="secondary" size="sm" className="h-8 px-3 text-xs shrink-0">
                  <Link href={`/admin/pipeline/${item.item_type}s`}>Review</Link>
                </Button>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Empty State */}
      {!loading && !stats?.insights.total && !stats?.briefs.total && !stats?.drafts.total && (
        <EmptyState
          icon={<IconPlus size={48} />}
          title="Start your content pipeline"
          description='Click "New Scan" to discover content opportunities based on trends and your audience interests.'
          action={
            <Button variant="accent" size="sm" onClick={runScan} disabled={scanning}>
              {scanning ? "Scanning..." : "Start First Scan"}
            </Button>
          }
        />
      )}
    </PageContainer>
  );
}
