"use client";

import * as React from "react";
import Link from "next/link";
import { AdminLoader } from "@/components/admin/AdminLoader";
import { Button } from "@/components/ui/button";
import {
  PageContainer,
  PageHeader,
  Section,
  Card,
  StatCard,
  EmptyState,
  FilterBar,
  FilterChip,
} from "@/components/admin/ui";
import {
  IconFileText,
  IconChart,
  IconMonitor,
  IconEye,
  IconUsers,
  IconUserPlus,
  IconStar,
  IconTrendingUp,
  IconArrowDown,
  IconTarget,
} from "@/components/admin/icons";

interface AnalyticsData {
  summary: {
    totalViews: number;
    uniqueVisitors: number;
    totalLeads: number;
    avgLeadScore: number;
    conversionRate: string;
  };
  dailyData: Array<{
    date: string;
    views: number;
    leads: number;
  }>;
  topPages: Array<{
    path: string;
    views: number;
  }>;
  trafficSources: Array<{
    source: string;
    visits: number;
  }>;
}

interface FunnelData {
  funnel: Array<{
    stage: string;
    count: number;
    conversionRate: number;
  }>;
  overallConversion: string;
}

interface Goal {
  id: string;
  name: string;
  goal_type: string;
  target_value: number;
  current_value: number;
  period: string;
  status: string;
  progress: number;
  daysRemaining: number | null;
  isOnTrack: boolean;
}

interface SourceData {
  totalLeads: number;
  sources: Array<{
    source: string;
    count: number;
    avgScore: number;
    percentage: number;
  }>;
  trafficSources: Array<{
    source: string;
    visits: number;
    leads: number;
    conversionRate: string;
  }>;
}

const CARD_TITLE = "font-[family-name:var(--font-heading)] text-lg font-semibold text-[hsl(var(--color-foreground))]";
const QUICK_LINK_CARD =
  "group block bg-[hsl(var(--color-background-subtle))]/50 backdrop-blur-sm border border-[hsl(var(--color-border))]/50 rounded-2xl p-6 hover:border-[hsl(var(--color-border-strong))]/60 hover:bg-[hsl(var(--color-background-subtle))]/80 transition-all duration-200";

export default function AnalyticsPage() {
  const [data, setData] = React.useState<AnalyticsData | null>(null);
  const [funnelData, setFunnelData] = React.useState<FunnelData | null>(null);
  const [goals, setGoals] = React.useState<Goal[]>([]);
  const [sourceData, setSourceData] = React.useState<SourceData | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [days, setDays] = React.useState(30);
  const [activeSection, setActiveSection] = React.useState<"overview" | "funnel" | "sources" | "goals">("overview");

  React.useEffect(() => {
    async function fetchData() {
      setLoading(true);
      try {
        const [analyticsRes, funnelRes, goalsRes, sourcesRes] = await Promise.all([
          fetch(`/api/admin/analytics?days=${days}`),
          fetch(`/api/admin/analytics/funnel?days=${days}`),
          fetch("/api/admin/analytics/goals"),
          fetch(`/api/admin/analytics/sources?days=${days}`),
        ]);

        if (analyticsRes.ok) {
          setData(await analyticsRes.json());
        }
        if (funnelRes.ok) {
          setFunnelData(await funnelRes.json());
        }
        if (goalsRes.ok) {
          setGoals(await goalsRes.json());
        }
        if (sourcesRes.ok) {
          setSourceData(await sourcesRes.json());
        }
      } catch (error) {
        console.error("Failed to fetch analytics:", error);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, [days]);

  if (loading) {
    return <AdminLoader message="Loading analytics..." />;
  }

  return (
    <PageContainer>
      <PageHeader
        title="Analytics"
        subtitle="Website traffic and performance metrics"
        actions={
          <FilterBar>
            {[7, 30, 90].map((d) => (
              <FilterChip key={d} active={days === d} onClick={() => setDays(d)}>
                {d}d
              </FilterChip>
            ))}
          </FilterBar>
        }
      />

      {/* Quick Links to Dashboards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Link href="/admin/analytics/content" className={QUICK_LINK_CARD}>
          <div className="flex items-center gap-3">
            <div className="p-2 bg-[hsl(var(--color-accent))]/10 rounded-xl shrink-0">
              <IconFileText size={20} className="text-[hsl(var(--color-accent))]" />
            </div>
            <div className="min-w-0">
              <h3 className="text-base font-semibold text-[hsl(var(--color-foreground))] group-hover:text-[hsl(var(--color-accent))] transition-colors">
                Content Performance
              </h3>
              <p className="text-sm text-[hsl(var(--color-foreground-subtle))]">Article views, engagement, trending</p>
            </div>
          </div>
        </Link>

        <Link href="/admin/analytics/ab-testing" className={QUICK_LINK_CARD}>
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-500/10 rounded-xl shrink-0">
              <IconChart size={20} className="text-blue-600" />
            </div>
            <div className="min-w-0">
              <h3 className="text-base font-semibold text-[hsl(var(--color-foreground))] group-hover:text-blue-600 transition-colors">
                A/B Testing
              </h3>
              <p className="text-sm text-[hsl(var(--color-foreground-subtle))]">Test titles, CTAs, optimize CTR</p>
            </div>
          </div>
        </Link>

        <Link href="/admin/analytics/feedback" className={QUICK_LINK_CARD}>
          <div className="flex items-center gap-3">
            <div className="p-2 bg-purple-500/10 rounded-xl shrink-0">
              <IconMonitor size={20} className="text-purple-600" />
            </div>
            <div className="min-w-0">
              <h3 className="text-base font-semibold text-[hsl(var(--color-foreground))] group-hover:text-purple-600 transition-colors">
                Agent Feedback
              </h3>
              <p className="text-sm text-[hsl(var(--color-foreground-subtle))]">AI agent performance tracking</p>
            </div>
          </div>
        </Link>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-5 gap-4">
        <StatCard label="Page Views" value={data?.summary.totalViews || 0} icon={<IconEye size={20} />} />
        <StatCard label="Unique Visitors" value={data?.summary.uniqueVisitors || 0} icon={<IconUsers size={20} />} />
        <StatCard label="Leads Generated" value={data?.summary.totalLeads || 0} icon={<IconUserPlus size={20} />} />
        <StatCard label="Avg Lead Score" value={data?.summary.avgLeadScore || 0} icon={<IconStar size={20} />} />
        <StatCard
          label="Conversion Rate"
          value={data?.summary.conversionRate || "0%"}
          icon={<IconTrendingUp size={20} />}
        />
      </div>

      {/* Section Tabs */}
      <div className="flex gap-6 overflow-x-auto -mx-4 px-4 md:mx-0 md:px-0 border-b border-[hsl(var(--color-border))]/30 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
        {[
          { id: "overview", label: "Overview" },
          { id: "funnel", label: "Conversion Funnel" },
          { id: "sources", label: "Lead Sources" },
          { id: "goals", label: "Goals" },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveSection(tab.id as typeof activeSection)}
            className={`relative shrink-0 whitespace-nowrap pb-3 text-sm font-medium transition-colors ${
              activeSection === tab.id
                ? "text-[hsl(var(--color-foreground))]"
                : "text-[hsl(var(--color-foreground-muted))] hover:text-[hsl(var(--color-foreground))]"
            }`}
          >
            {tab.label}
            {activeSection === tab.id && (
              <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-[hsl(var(--color-accent))] rounded-full" />
            )}
          </button>
        ))}
      </div>

      {/* Overview Section */}
      {activeSection === "overview" && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Top Pages */}
          <Card padding="none" className="overflow-hidden">
            <div className="p-6 border-b border-[hsl(var(--color-border))]/30">
              <h2 className={CARD_TITLE}>Top Pages</h2>
            </div>
            <div className="divide-y divide-[hsl(var(--color-border))]/30">
              {data?.topPages && data.topPages.length > 0 ? (
                data.topPages.map((page, index) => (
                  <div key={index} className="flex items-center justify-between gap-4 px-6 py-4">
                    <div className="flex items-center gap-3 min-w-0">
                      <span className="text-[hsl(var(--color-foreground-subtle))] text-sm tabular-nums w-6 shrink-0">{index + 1}.</span>
                      <span className="font-mono text-sm text-[hsl(var(--color-foreground))] truncate">{page.path}</span>
                    </div>
                    <span className="text-sm text-[hsl(var(--color-foreground-muted))] whitespace-nowrap shrink-0">
                      {page.views} views
                    </span>
                  </div>
                ))
              ) : (
                <div className="px-6 py-8 text-center text-sm text-[hsl(var(--color-foreground-subtle))]">No data yet</div>
              )}
            </div>
          </Card>

          {/* Traffic Sources */}
          <Card padding="none" className="overflow-hidden">
            <div className="p-6 border-b border-[hsl(var(--color-border))]/30">
              <h2 className={CARD_TITLE}>Traffic Sources</h2>
            </div>
            <div className="divide-y divide-[hsl(var(--color-border))]/30">
              {data?.trafficSources && data.trafficSources.length > 0 ? (
                data.trafficSources.map((source, index) => (
                  <div key={index} className="flex items-center justify-between gap-4 px-6 py-4">
                    <div className="flex items-center gap-3 min-w-0">
                      <span className="text-[hsl(var(--color-foreground-subtle))] text-sm tabular-nums w-6 shrink-0">{index + 1}.</span>
                      <span className="text-sm text-[hsl(var(--color-foreground))] truncate">{source.source}</span>
                    </div>
                    <span className="text-sm text-[hsl(var(--color-foreground-muted))] whitespace-nowrap shrink-0">
                      {source.visits} visits
                    </span>
                  </div>
                ))
              ) : (
                <div className="px-6 py-8 text-center text-sm text-[hsl(var(--color-foreground-subtle))]">No data yet</div>
              )}
            </div>
          </Card>
        </div>
      )}

      {/* Conversion Funnel Section */}
      {activeSection === "funnel" && (
        <div className="space-y-6">
          <Card>
            <div className="mb-6">
              <h2 className={CARD_TITLE}>Conversion Funnel</h2>
              <p className="text-sm text-[hsl(var(--color-foreground-subtle))] mt-0.5">
                Overall conversion: {funnelData?.overallConversion || "0"}%
              </p>
            </div>

            {funnelData?.funnel && funnelData.funnel.length > 0 ? (
              <div className="space-y-4">
                {funnelData.funnel.map((stage, index) => {
                  const maxCount = funnelData.funnel[0].count || 1;
                  const width = Math.max(10, (stage.count / maxCount) * 100);

                  return (
                    <div key={stage.stage} className="space-y-2">
                      <div className="flex justify-between items-center gap-4">
                        <span className="text-sm font-medium text-[hsl(var(--color-foreground))] min-w-0">
                          {index + 1}. {stage.stage}
                        </span>
                        <div className="flex items-center gap-4 shrink-0">
                          <span className="text-sm tabular-nums text-[hsl(var(--color-foreground-muted))]">
                            {stage.count.toLocaleString()}
                          </span>
                          <span className="text-xs tabular-nums text-[hsl(var(--color-foreground-subtle))] w-12 text-right">
                            {stage.conversionRate}%
                          </span>
                        </div>
                      </div>
                      <div className="h-8 bg-[hsl(var(--color-background-muted))] rounded-lg overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-[hsl(var(--color-accent))] to-[hsl(var(--color-accent-hover))] rounded-lg transition-all duration-500"
                          style={{ width: `${width}%` }}
                        />
                      </div>
                      {index < funnelData.funnel.length - 1 && (
                        <div className="flex justify-center">
                          <IconArrowDown size={16} className="text-[hsl(var(--color-foreground-subtle))]" />
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="py-12 text-center text-sm text-[hsl(var(--color-foreground-subtle))]">
                No funnel data yet
              </div>
            )}
          </Card>
        </div>
      )}

      {/* Lead Sources Section */}
      {activeSection === "sources" && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Lead Sources */}
            <Card padding="none" className="overflow-hidden">
              <div className="p-6 border-b border-[hsl(var(--color-border))]/30">
                <h2 className={CARD_TITLE}>Lead Sources</h2>
                <p className="text-sm text-[hsl(var(--color-foreground-subtle))] mt-0.5">
                  {sourceData?.totalLeads || 0} total leads
                </p>
              </div>
              <div className="divide-y divide-[hsl(var(--color-border))]/30">
                {sourceData?.sources && sourceData.sources.length > 0 ? (
                  sourceData.sources.map((source) => (
                    <div key={source.source} className="px-6 py-4">
                      <div className="flex items-center justify-between gap-4 mb-2">
                        <span className="text-sm font-medium text-[hsl(var(--color-foreground))] capitalize truncate">
                          {source.source}
                        </span>
                        <span className="text-sm text-[hsl(var(--color-foreground-muted))] whitespace-nowrap shrink-0">
                          {source.count} leads
                        </span>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="flex-1 h-2 bg-[hsl(var(--color-background-muted))] rounded-full overflow-hidden">
                          <div
                            className="h-full bg-[hsl(var(--color-accent))] rounded-full"
                            style={{ width: `${source.percentage}%` }}
                          />
                        </div>
                        <span className="text-xs tabular-nums text-[hsl(var(--color-foreground-subtle))] w-10 text-right shrink-0">
                          {source.percentage}%
                        </span>
                        <span className="text-xs tabular-nums text-[hsl(var(--color-foreground-subtle))] w-16 text-right whitespace-nowrap shrink-0">
                          Avg: {source.avgScore}
                        </span>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="px-6 py-8 text-center text-sm text-[hsl(var(--color-foreground-subtle))]">No data yet</div>
                )}
              </div>
            </Card>

            {/* Traffic to Lead Conversion */}
            <Card padding="none" className="overflow-hidden">
              <div className="p-6 border-b border-[hsl(var(--color-border))]/30">
                <h2 className={CARD_TITLE}>Traffic → Lead Conversion</h2>
                <p className="text-sm text-[hsl(var(--color-foreground-subtle))] mt-0.5">
                  Conversion rate by traffic source
                </p>
              </div>
              <div className="divide-y divide-[hsl(var(--color-border))]/30">
                {sourceData?.trafficSources && sourceData.trafficSources.length > 0 ? (
                  sourceData.trafficSources.map((source) => (
                    <div key={source.source} className="px-6 py-4 flex items-center justify-between gap-4">
                      <div className="min-w-0">
                        <span className="block text-sm font-medium text-[hsl(var(--color-foreground))] capitalize truncate">
                          {source.source}
                        </span>
                        <p className="text-xs text-[hsl(var(--color-foreground-subtle))]">
                          {source.visits.toLocaleString()} visits → {source.leads} leads
                        </p>
                      </div>
                      <span className={`text-lg font-semibold tabular-nums shrink-0 ${
                        parseFloat(source.conversionRate) >= 2 ? "text-green-600" :
                        parseFloat(source.conversionRate) >= 1 ? "text-yellow-600" :
                        "text-[hsl(var(--color-foreground-muted))]"
                      }`}>
                        {source.conversionRate}%
                      </span>
                    </div>
                  ))
                ) : (
                  <div className="px-6 py-8 text-center text-sm text-[hsl(var(--color-foreground-subtle))]">No data yet</div>
                )}
              </div>
            </Card>
          </div>
        </div>
      )}

      {/* Goals Section */}
      {activeSection === "goals" && (
        <Section
          title="Goals"
          actions={
            <Button variant="accent" size="sm">
              + New Goal
            </Button>
          }
        >
          {goals.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {goals.map((goal) => (
                <Card key={goal.id}>
                  <div className="flex justify-between items-start gap-3 mb-4">
                    <div className="min-w-0">
                      <h3 className="text-base font-semibold text-[hsl(var(--color-foreground))]">{goal.name}</h3>
                      <p className="text-xs text-[hsl(var(--color-foreground-subtle))] capitalize">
                        {goal.goal_type.replace("_", " ")} • {goal.period}
                      </p>
                    </div>
                    <span className={`shrink-0 whitespace-nowrap px-2.5 py-1 rounded-full text-xs font-medium border ${
                      goal.isOnTrack
                        ? "bg-green-500/15 text-green-600 border-green-500/20"
                        : "bg-yellow-500/15 text-yellow-600 border-yellow-500/20"
                    }`}>
                      {goal.isOnTrack ? "On Track" : "Behind"}
                    </span>
                  </div>

                  <div className="mb-4">
                    <div className="flex justify-between items-baseline gap-3 mb-2">
                      <span className="text-2xl font-semibold tabular-nums text-[hsl(var(--color-foreground))]">
                        {goal.current_value.toLocaleString()}
                      </span>
                      <span className="text-sm tabular-nums text-[hsl(var(--color-foreground-subtle))]">
                        / {goal.target_value.toLocaleString()}
                      </span>
                    </div>
                    <div className="h-3 bg-[hsl(var(--color-background-muted))] rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all ${
                          goal.progress >= 100 ? "bg-green-600" :
                          goal.progress >= 75 ? "bg-[hsl(var(--color-accent))]" :
                          goal.progress >= 50 ? "bg-yellow-600" :
                          "bg-red-600"
                        }`}
                        style={{ width: `${Math.min(100, goal.progress)}%` }}
                      />
                    </div>
                  </div>

                  <div className="flex flex-wrap justify-between items-center gap-2 text-xs text-[hsl(var(--color-foreground-subtle))]">
                    <span>{goal.progress}% complete</span>
                    {goal.daysRemaining !== null && (
                      <span>{goal.daysRemaining} days remaining</span>
                    )}
                  </div>
                </Card>
              ))}
            </div>
          ) : (
            <EmptyState
              icon={<IconTarget size={48} />}
              title="No goals set yet"
              description="Set goals to track your progress on leads, page views, and conversions"
            />
          )}
        </Section>
      )}
    </PageContainer>
  );
}
