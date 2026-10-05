"use client";

import * as React from "react";
import Link from "next/link";
import { AdminLoader } from "@/components/admin/AdminLoader";
import { PageContainer, PageHeader, Card, StatCard, FilterBar, FilterChip } from "@/components/admin/ui";
import { IconFileText, IconMail, IconMessageSquare, IconEye, IconUsers, IconUserPlus, IconStar, IconTrendingUp } from "@/components/admin/icons";

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
  const [sourceData, setSourceData] = React.useState<SourceData | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [days, setDays] = React.useState(30);
  const [activeSection, setActiveSection] = React.useState<"overview" | "sources">("overview");

  React.useEffect(() => {
    async function fetchData() {
      setLoading(true);
      try {
        const [analyticsRes, sourcesRes] = await Promise.all([
          fetch(`/api/admin/analytics?days=${days}`),
          fetch(`/api/admin/analytics/sources?days=${days}`),
        ]);

        if (analyticsRes.ok) {
          setData(await analyticsRes.json());
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
        subtitle="Visits to the site, where they came from, and which turned into enquiries"
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
                Journal reading
              </h3>
              <p className="text-sm text-[hsl(var(--color-foreground-subtle))]">Article views, reading time and scroll depth</p>
            </div>
          </div>
        </Link>

        <Link href="/admin/subscribers" className={QUICK_LINK_CARD}>
          <div className="flex items-center gap-3">
            <div className="p-2 bg-[hsl(var(--color-accent))]/10 rounded-xl shrink-0">
              <IconMail size={20} className="text-[hsl(var(--color-accent))]" />
            </div>
            <div className="min-w-0">
              <h3 className="text-base font-semibold text-[hsl(var(--color-foreground))] group-hover:text-[hsl(var(--color-accent))] transition-colors">
                Journal subscribers
              </h3>
              <p className="text-sm text-[hsl(var(--color-foreground-subtle))]">Who gets new articles by email</p>
            </div>
          </div>
        </Link>

        <Link href="/admin/chats" className={QUICK_LINK_CARD}>
          <div className="flex items-center gap-3">
            <div className="p-2 bg-[hsl(var(--color-accent))]/10 rounded-xl shrink-0">
              <IconMessageSquare size={20} className="text-[hsl(var(--color-accent))]" />
            </div>
            <div className="min-w-0">
              <h3 className="text-base font-semibold text-[hsl(var(--color-foreground))] group-hover:text-[hsl(var(--color-accent))] transition-colors">
                Ask Craefto
              </h3>
              <p className="text-sm text-[hsl(var(--color-foreground-subtle))]">What visitors ask, and what it couldn&apos;t answer</p>
            </div>
          </div>
        </Link>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-5 gap-4">
        <StatCard label="Page Views" value={data?.summary.totalViews || 0} icon={<IconEye size={20} />} />
        <StatCard label="Visits (one a day per visitor)" value={data?.summary.uniqueVisitors || 0} icon={<IconUsers size={20} />} />
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
          { id: "sources", label: "Lead Sources" },
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

    </PageContainer>
  );
}
