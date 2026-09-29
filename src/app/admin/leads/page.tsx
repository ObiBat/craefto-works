"use client";

import * as React from "react";
import Link from "next/link";
import { AdminLoader } from "@/components/admin/AdminLoader";
import { PageHeader, SearchInput, FilterBar, FilterChip } from "@/components/admin/ui";

interface Lead {
  id: string;
  name: string;
  email: string;
  company: string | null;
  service_interest: string | null;
  budget_range: string | null;
  timeline: string | null;
  score: number;
  created_at: string;
  stage: { id: string; name: string; color: string } | null;
}

interface PipelineStage {
  id: string;
  name: string;
  color: string;
  position: number;
}

function getStageColor(color: string | null) {
  const colors: Record<string, string> = {
    blue: "bg-blue-500/20 text-blue-400 border-blue-500/30",
    cyan: "bg-cyan-500/20 text-cyan-400 border-cyan-500/30",
    yellow: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30",
    purple: "bg-purple-500/20 text-purple-400 border-purple-500/30",
    orange: "bg-orange-500/20 text-orange-400 border-orange-500/30",
    green: "bg-green-500/20 text-green-400 border-green-500/30",
    red: "bg-red-500/20 text-red-400 border-red-500/30",
  };
  return colors[color || "blue"] || colors.blue;
}

function formatDate(dateString: string) {
  return new Date(dateString).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function formatBudget(budget: string | null) {
  const budgets: Record<string, string> = {
    "3-5k": "A$3k – A$5k",
    "5-10k": "A$5k – A$10k",
    "10-25k": "A$10k – A$25k",
    "25-50k": "A$25k – A$50k",
    "50k+": "A$50k+",
    "discuss": "To discuss",
  };
  return budgets[budget || ""] || budget || "—";
}

function formatService(service: string | null) {
  const services: Record<string, string> = {
    brand: "Brand Identity",
    web: "Web Design & Dev",
    saas: "SaaS / Product",
    ai: "AI / Automation",
    other: "Not sure yet",
  };
  return services[service || ""] || service || "—";
}

export default function LeadsPage() {
  const [leads, setLeads] = React.useState<Lead[]>([]);
  const [stages, setStages] = React.useState<PipelineStage[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [filter, setFilter] = React.useState<string>("all");
  const [search, setSearch] = React.useState("");

  React.useEffect(() => {
    async function fetchData() {
      try {
        const [leadsRes, stagesRes] = await Promise.all([
          fetch("/api/admin/leads"),
          fetch("/api/admin/stages"),
        ]);

        if (leadsRes.ok) {
          const data = await leadsRes.json();
          setLeads(data.leads || []);
        }
        if (stagesRes.ok) {
          const data = await stagesRes.json();
          setStages(data.stages || []);
        }
      } catch (error) {
        console.error("Failed to fetch data:", error);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  const filteredLeads = React.useMemo(() => {
    return leads.filter((lead) => {
      const matchesFilter = filter === "all" || lead.stage?.id === filter;
      const matchesSearch =
        search === "" ||
        lead.name.toLowerCase().includes(search.toLowerCase()) ||
        lead.email.toLowerCase().includes(search.toLowerCase()) ||
        (lead.company && lead.company.toLowerCase().includes(search.toLowerCase()));
      return matchesFilter && matchesSearch;
    });
  }, [leads, filter, search]);

  const handleStageChange = async (leadId: string, newStageId: string) => {
    try {
      const res = await fetch(`/api/admin/leads/${leadId}/stage`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ stageId: newStageId }),
      });

      if (res.ok) {
        setLeads((prev) =>
          prev.map((lead) =>
            lead.id === leadId
              ? { ...lead, stage: stages.find((s) => s.id === newStageId) || lead.stage }
              : lead
          )
        );
      }
    } catch (error) {
      console.error("Failed to update stage:", error);
    }
  };

  if (loading) {
    return <AdminLoader message="Loading leads..." />;
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Leads"
        subtitle={`${leads.length} total leads`}
      />

      {/* Filters */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
        <SearchInput
          value={search}
          onChange={setSearch}
          placeholder="Search leads..."
        />

        <FilterBar>
          <FilterChip active={filter === "all"} onClick={() => setFilter("all")}>
            All
          </FilterChip>
          {stages.map((stage) => (
            <FilterChip
              key={stage.id}
              active={filter === stage.id}
              onClick={() => setFilter(stage.id)}
              className={filter === stage.id ? getStageColor(stage.color) : undefined}
            >
              {stage.name}
            </FilterChip>
          ))}
        </FilterBar>
      </div>

      {/* Leads Table */}
      <div className="bg-[hsl(var(--color-background-muted))] border border-[hsl(var(--color-border))] rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[760px]">
            <thead>
              <tr className="border-b border-[hsl(var(--color-border))]">
                <th className="text-left px-6 py-4 text-sm font-medium text-[hsl(var(--color-foreground-muted))]">Lead</th>
                <th className="text-left px-6 py-4 text-sm font-medium text-[hsl(var(--color-foreground-muted))]">Service</th>
                <th className="text-left px-6 py-4 text-sm font-medium text-[hsl(var(--color-foreground-muted))]">Budget</th>
                <th className="text-left px-6 py-4 text-sm font-medium text-[hsl(var(--color-foreground-muted))]">Score</th>
                <th className="text-left px-6 py-4 text-sm font-medium text-[hsl(var(--color-foreground-muted))]">Stage</th>
                <th className="text-left px-6 py-4 text-sm font-medium text-[hsl(var(--color-foreground-muted))]">Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[hsl(var(--color-border))]">
              {filteredLeads.length > 0 ? (
                filteredLeads.map((lead) => (
                  <tr key={lead.id} className="hover:bg-[hsl(var(--color-background-subtle))] transition-colors">
                    <td className="px-6 py-4">
                      <Link href={`/admin/leads/${lead.id}`} className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-[hsl(var(--color-accent))]/20 flex items-center justify-center text-[hsl(var(--color-accent))] font-medium text-sm">
                          {lead.name.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <p className="font-medium text-[hsl(var(--color-foreground))] hover:text-[hsl(var(--color-accent))] transition-colors">{lead.name}</p>
                          <p className="text-sm text-[hsl(var(--color-foreground-subtle))]">{lead.company || lead.email}</p>
                        </div>
                      </Link>
                    </td>
                    <td className="px-6 py-4 text-[hsl(var(--color-foreground-muted))]">{formatService(lead.service_interest)}</td>
                    <td className="px-6 py-4 text-[hsl(var(--color-foreground-muted))]">{formatBudget(lead.budget_range)}</td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-full bg-[hsl(var(--color-background-subtle))] flex items-center justify-center text-sm font-medium">
                          {lead.score}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <select
                        value={lead.stage?.id || ""}
                        onChange={(e) => handleStageChange(lead.id, e.target.value)}
                        className={`px-3 py-1.5 rounded-xl text-xs font-medium border cursor-pointer focus:outline-none ${getStageColor(lead.stage?.color || null)}`}
                      >
                        {stages.map((stage) => (
                          <option key={stage.id} value={stage.id} className="bg-[hsl(var(--color-background))] text-[hsl(var(--color-foreground))]">
                            {stage.name}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td className="px-6 py-4 text-[hsl(var(--color-foreground-subtle))] text-sm">{formatDate(lead.created_at)}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-[hsl(var(--color-foreground-subtle))]">
                    {search || filter !== "all" ? "No leads match your filters" : "No leads yet"}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
