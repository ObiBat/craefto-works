"use client";

import * as React from "react";
import Link from "next/link";
import { AdminLoader } from "@/components/admin/AdminLoader";
import { Button } from "@/components/ui/button";
import { PageContainer, PageHeader, Card, StatCard, StatusBadge, EmptyState } from "@/components/admin/ui";
import { IconLightbulb, IconSpinner } from "@/components/admin/icons";

interface LeadWithAnalysis {
  id: string;
  name: string;
  email: string;
  company: string | null;
  service_interest: string | null;
  budget_range: string | null;
  timeline: string | null;
  message: string | null;
  created_at: string;
  analysis?: {
    fit_score: number;
    project_type: string;
    complexity: string;
    scope_creep_risk: number;
    recommended_stack: string[];
    requires_review: boolean;
    analyzed_at: string;
  } | null;
}

function formatDate(dateString: string) {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  return date.toLocaleDateString();
}

function getRiskColor(risk: number) {
  if (risk < 0.3) return "text-green-600";
  if (risk < 0.7) return "text-yellow-600";
  return "text-red-600";
}

function getFitColor(score: number) {
  if (score >= 0.7) return "text-green-600";
  if (score >= 0.4) return "text-yellow-600";
  return "text-red-600";
}

/** Same thresholds as getFitColor, expressed as a StatCard accent. */
function getFitAccent(score: number): "success" | "warning" | "error" {
  if (score >= 0.7) return "success";
  if (score >= 0.4) return "warning";
  return "error";
}

export default function IntelligencePage() {
  const [leads, setLeads] = React.useState<LeadWithAnalysis[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [analyzing, setAnalyzing] = React.useState<string | null>(null);
  const [stats, setStats] = React.useState({
    total: 0,
    analyzed: 0,
    avgFit: 0,
    highRisk: 0,
  });

  React.useEffect(() => {
    fetchLeads();
  }, []);

  async function fetchLeads() {
    try {
      const res = await fetch("/api/admin/intelligence/leads");
      if (res.ok) {
        const data = await res.json();
        setLeads(data.leads || []);
        setStats(data.stats || { total: 0, analyzed: 0, avgFit: 0, highRisk: 0 });
      }
    } catch (error) {
      console.error("Failed to fetch leads:", error);
    } finally {
      setLoading(false);
    }
  }

  async function analyzeLead(leadId: string) {
    setAnalyzing(leadId);
    try {
      const res = await fetch(`/api/admin/intelligence/analyze`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ leadId }),
      });

      if (res.ok) {
        const data = await res.json();
        setLeads((prev) =>
          prev.map((lead) =>
            lead.id === leadId ? { ...lead, analysis: data.analysis } : lead
          )
        );
        // Refresh stats
        fetchLeads();
      }
    } catch (error) {
      console.error("Failed to analyze lead:", error);
    } finally {
      setAnalyzing(null);
    }
  }

  if (loading) {
    return <AdminLoader message="Loading intelligence..." />;
  }

  return (
    <PageContainer>
      <PageHeader title="Client Intelligence" subtitle="AI-powered analysis of incoming leads" />

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Total Leads" value={stats.total} />
        <StatCard label="Analyzed" value={stats.analyzed} />
        <StatCard
          label="Avg Fit Score"
          value={stats.avgFit > 0 ? `${Math.round(stats.avgFit * 100)}%` : "—"}
          accent={getFitAccent(stats.avgFit)}
        />
        <StatCard label="High Risk" value={stats.highRisk} accent="error" />
      </div>

      {/* Leads list */}
      <Card padding="none" className="overflow-hidden">
        <div className="p-6 border-b border-[hsl(var(--color-border))]/30">
          <h2 className="font-[family-name:var(--font-heading)] text-lg font-semibold text-[hsl(var(--color-foreground))]">
            Lead Analysis
          </h2>
          <p className="text-sm text-[hsl(var(--color-foreground-muted))] mt-0.5">Click analyze to run AI assessment</p>
        </div>

        {leads.length > 0 ? (
          <div className="divide-y divide-[hsl(var(--color-border))]/30">
            {leads.map((lead) => (
              <div
                key={lead.id}
                className="p-4 md:px-6 hover:bg-[hsl(var(--color-background-muted))]/30 transition-colors"
              >
                <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                  <div className="flex items-center gap-4 min-w-0">
                    <div className="w-10 h-10 rounded-full bg-[hsl(var(--color-accent))]/20 flex items-center justify-center text-[hsl(var(--color-accent))] font-medium shrink-0">
                      {lead.name.charAt(0).toUpperCase()}
                    </div>
                    <div className="min-w-0">
                      <Link
                        href={`/admin/leads/${lead.id}`}
                        className="font-medium text-[hsl(var(--color-foreground))] hover:text-[hsl(var(--color-accent))] transition-colors"
                      >
                        {lead.name}
                      </Link>
                      <p className="text-sm text-[hsl(var(--color-foreground-muted))] truncate">
                        {lead.company || lead.email}
                      </p>
                      <p className="text-xs text-[hsl(var(--color-foreground-subtle))] mt-1">
                        {formatDate(lead.created_at)}
                      </p>
                    </div>
                  </div>

                  {lead.analysis ? (
                    <div className="flex flex-wrap items-center gap-x-6 gap-y-3 text-sm pl-14 md:pl-0 md:shrink-0">
                      <div className="text-center">
                        <p className="text-[hsl(var(--color-foreground-subtle))] text-xs mb-1">Fit</p>
                        <p className={`font-semibold tabular-nums ${getFitColor(lead.analysis.fit_score)}`}>
                          {Math.round(lead.analysis.fit_score * 100)}%
                        </p>
                      </div>
                      <div className="text-center">
                        <p className="text-[hsl(var(--color-foreground-subtle))] text-xs mb-1">Risk</p>
                        <p className={`font-semibold tabular-nums ${getRiskColor(lead.analysis.scope_creep_risk)}`}>
                          {Math.round(lead.analysis.scope_creep_risk * 100)}%
                        </p>
                      </div>
                      <div className="text-center">
                        <p className="text-[hsl(var(--color-foreground-subtle))] text-xs mb-1">Type</p>
                        <p className="font-medium text-[hsl(var(--color-foreground))]">{lead.analysis.project_type}</p>
                      </div>
                      <div className="text-center">
                        <p className="text-[hsl(var(--color-foreground-subtle))] text-xs mb-1">Complexity</p>
                        <p className="font-medium text-[hsl(var(--color-foreground))]">{lead.analysis.complexity}</p>
                      </div>
                      {lead.analysis.requires_review && (
                        <StatusBadge variant="warning">Needs Review</StatusBadge>
                      )}
                    </div>
                  ) : (
                    <Button
                      variant="accent"
                      size="sm"
                      onClick={() => analyzeLead(lead.id)}
                      disabled={analyzing === lead.id}
                      className="h-9 px-4 self-start ml-14 md:ml-0 md:shrink-0"
                    >
                      {analyzing === lead.id ? (
                        <>
                          <IconSpinner size={16} />
                          Analyzing...
                        </>
                      ) : (
                        "Analyze"
                      )}
                    </Button>
                  )}
                </div>

                {lead.analysis && lead.analysis.recommended_stack.length > 0 && (
                  <div className="mt-3 ml-14 flex flex-wrap items-center gap-2">
                    <span className="text-[hsl(var(--color-foreground-subtle))] text-xs">Stack:</span>
                    <div className="flex flex-wrap gap-1">
                      {lead.analysis.recommended_stack.map((tech) => (
                        <span
                          key={tech}
                          className="px-2 py-0.5 bg-[hsl(var(--color-background-muted))] text-[hsl(var(--color-foreground-muted))] text-xs rounded-md"
                        >
                          {tech}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        ) : (
          <EmptyState
            icon={<IconLightbulb size={48} />}
            title="No leads yet"
            description="Leads will appear here when someone submits the contact form"
          />
        )}
      </Card>
    </PageContainer>
  );
}
