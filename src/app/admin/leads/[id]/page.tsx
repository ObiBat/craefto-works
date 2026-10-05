"use client";

import * as React from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { AdminLoader } from "@/components/admin/AdminLoader";
import {
  IconChevronLeft,
  IconFileText,
  IconLightbulb,
  IconMail,
  IconArrowRight,
  IconEdit,
  IconInfo,
  IconSpinner,
  IconCheck,
  IconAlertTriangle,
  IconLinkedIn,
  IconMessageSquare,
  IconPhone,
} from "@/components/admin/icons";

interface Lead {
  id: string;
  name: string;
  email: string;
  company: string | null;
  phone: string | null;
  service_interest: string | null;
  budget_range: string | null;
  timeline: string | null;
  message: string | null;
  score: number;
  utm_source: string | null;
  utm_medium: string | null;
  utm_campaign: string | null;
  landing_page: string | null;
  created_at: string;
  updated_at: string;
  stage: { id: string; name: string; color: string } | null;
}

interface CompanyResearch {
  domain: string | null;
  industry: string | null;
  estimated_size: string | null;
  linkedin_url: string | null;
  tech_signals: string[];
  funding_stage: string | null;
}

interface DetailedRedFlag {
  flag: string;
  severity: 'low' | 'medium' | 'high';
}

interface LeadAnalysis {
  fit_score: number;
  scope_creep_risk: number;
  project_type: string;
  complexity: string;
  recommended_stack: string[];
  red_flags: string[];
  green_flags: string[];
  requires_review: boolean;
  analysis_mode: string;
  analyzed_at: string;
  // V2 Enhanced fields
  company_research?: CompanyResearch;
  detailed_red_flags?: DetailedRedFlag[];
  response_template?: string;
  call_agenda?: string[];
}

interface Activity {
  id: string;
  type: string;
  description: string;
  metadata: Record<string, unknown> | null;
  created_at: string;
}

interface PipelineStage {
  id: string;
  name: string;
  color: string;
}

function getStageColor(color: string | null) {
  const colors: Record<string, string> = {
    blue: "bg-blue-500/20 text-blue-400 border-blue-500/30",
    cyan: "bg-cyan-500/20 text-cyan-400 border-cyan-500/30",
    yellow: "bg-yellow-500/20 text-yellow-600 border-yellow-500/30",
    purple: "bg-purple-500/20 text-purple-400 border-purple-500/30",
    orange: "bg-orange-500/20 text-orange-400 border-orange-500/30",
    green: "bg-green-500/20 text-green-600 border-green-500/30",
    red: "bg-red-500/20 text-red-600 border-red-500/30",
  };
  return colors[color || "blue"] || colors.blue;
}

function formatDate(dateString: string) {
  return new Date(dateString).toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

function formatBudget(budget: string | null) {
  const budgets: Record<string, string> = {
    "3-5k": "A$3,000 – A$5,000",
    "5-10k": "A$5,000 – A$10,000",
    "10-25k": "A$10,000 – A$25,000",
    "25-50k": "A$25,000 – A$50,000",
    "50k+": "A$50,000+",
    "discuss": "To discuss",
  };
  return budgets[budget || ""] || budget || "Not specified";
}

function formatService(service: string | null) {
  const services: Record<string, string> = {
    brand: "Brand Identity",
    web: "Web Design & Development",
    saas: "SaaS / Product",
    ai: "AI / Automation",
    other: "Not sure yet",
  };
  return services[service || ""] || service || "Not specified";
}

function formatTimeline(timeline: string | null) {
  const timelines: Record<string, string> = {
    asap: "ASAP",
    "1-3months": "1-3 months",
    "3-6months": "3-6 months",
    flexible: "Flexible",
  };
  return timelines[timeline || ""] || timeline || "Not specified";
}

function getActivityIcon(type: string) {
  switch (type) {
    case "form_submission":
      return <IconFileText size={16} />;
    case "ai_analysis":
      return <IconLightbulb size={16} />;
    case "email_sent":
      return <IconMail size={16} />;
    case "stage_change":
      return <IconArrowRight size={16} />;
    case "note":
      return <IconEdit size={16} />;
    default:
      return <IconInfo size={16} />;
  }
}

export default function LeadDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [lead, setLead] = React.useState<Lead | null>(null);
  const [activities, setActivities] = React.useState<Activity[]>([]);
  const [chatId, setChatId] = React.useState<string | null>(null);
  const [stages, setStages] = React.useState<PipelineStage[]>([]);
  const [analysis, setAnalysis] = React.useState<LeadAnalysis | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [analyzing, setAnalyzing] = React.useState(false);
  const [note, setNote] = React.useState("");
  const [addingNote, setAddingNote] = React.useState(false);

  React.useEffect(() => {
    async function fetchData() {
      try {
        const [leadRes, stagesRes, analysisRes] = await Promise.all([
          fetch(`/api/admin/leads/${params.id}`),
          fetch("/api/admin/stages"),
          fetch(`/api/admin/intelligence/lead/${params.id}`),
        ]);

        if (leadRes.ok) {
          const data = await leadRes.json();
          setLead(data.lead);
          setActivities(data.activities || []);
          setChatId(data.chat?.id ?? null);
        } else if (leadRes.status === 404) {
          router.push("/admin/leads");
        }

        if (stagesRes.ok) {
          const data = await stagesRes.json();
          setStages(data.stages || []);
        }

        if (analysisRes.ok) {
          const data = await analysisRes.json();
          setAnalysis(data.analysis);
        }
      } catch (error) {
        console.error("Failed to fetch data:", error);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, [params.id, router]);

  const handleAnalyze = async () => {
    if (!lead) return;
    setAnalyzing(true);
    try {
      const res = await fetch("/api/admin/intelligence/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ leadId: lead.id }),
      });
      if (res.ok) {
        const data = await res.json();
        setAnalysis(data.analysis);
        // Add to activities
        setActivities((prev) => [
          {
            id: Date.now().toString(),
            type: "ai_analysis",
            description: `AI analysis completed: Fit ${Math.round(data.analysis.fit_score * 100)}%`,
            metadata: null,
            created_at: new Date().toISOString(),
          },
          ...prev,
        ]);
      }
    } catch (error) {
      console.error("Failed to analyze:", error);
    } finally {
      setAnalyzing(false);
    }
  };

  const handleStageChange = async (newStageId: string) => {
    if (!lead) return;

    try {
      const res = await fetch(`/api/admin/leads/${lead.id}/stage`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ stageId: newStageId }),
      });

      if (res.ok) {
        const newStage = stages.find((s) => s.id === newStageId);
        setLead((prev) => (prev ? { ...prev, stage: newStage || prev.stage } : prev));
        setActivities((prev) => [
          {
            id: Date.now().toString(),
            type: "stage_change",
            description: `Moved to ${newStage?.name}`,
            metadata: null,
            created_at: new Date().toISOString(),
          },
          ...prev,
        ]);
      }
    } catch (error) {
      console.error("Failed to update stage:", error);
    }
  };

  const handleAddNote = async () => {
    if (!lead || !note.trim()) return;

    setAddingNote(true);
    try {
      const res = await fetch(`/api/admin/leads/${lead.id}/notes`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ note: note.trim() }),
      });

      if (res.ok) {
        setActivities((prev) => [
          {
            id: Date.now().toString(),
            type: "note",
            description: note.trim(),
            metadata: null,
            created_at: new Date().toISOString(),
          },
          ...prev,
        ]);
        setNote("");
      }
    } catch (error) {
      console.error("Failed to add note:", error);
    } finally {
      setAddingNote(false);
    }
  };

  if (loading) {
    return <AdminLoader message="Loading lead details..." />;
  }

  if (!lead) {
    return (
      <div className="text-center py-12">
        <p className="text-[hsl(var(--color-foreground-subtle))]">Lead not found</p>
        <Link href="/admin/leads" className="text-[hsl(var(--color-accent))] hover:underline mt-2 inline-block">
          Back to leads
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex items-center gap-4 min-w-0">
          <Link
            href="/admin/leads"
            aria-label="Back to leads"
            className="inline-flex items-center justify-center p-2 hover:bg-[hsl(var(--color-background-subtle))] rounded-xl transition-colors"
          >
            <IconChevronLeft size={16} />
          </Link>
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-full bg-[hsl(var(--color-accent))]/20 flex items-center justify-center text-[hsl(var(--color-accent))] font-semibold text-xl">
              {lead.name.charAt(0).toUpperCase()}
            </div>
            <div>
              <h1 className="font-[family-name:var(--font-heading)] text-2xl md:text-3xl tracking-tight font-semibold">{lead.name}</h1>
              <p>{lead.company || lead.email}</p>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2 px-3 py-1.5 bg-[hsl(var(--color-background-subtle))] rounded-xl">
            <span className="text-[hsl(var(--color-foreground-muted))] text-sm">Score:</span>
            <span className="font-semibold text-[hsl(var(--color-foreground))]">{lead.score}</span>
          </div>
          <select
            aria-label="Lead stage"
            value={lead.stage?.id || ""}
            onChange={(e) => handleStageChange(e.target.value)}
            className={`px-4 py-2 rounded-xl text-sm font-medium border cursor-pointer focus:outline-none ${getStageColor(lead.stage?.color || null)}`}
          >
            {stages.map((stage) => (
              <option key={stage.id} value={stage.id} className="bg-[hsl(var(--color-background-muted))] text-[hsl(var(--color-foreground))]">
                {stage.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Message */}
          <div className="bg-[hsl(var(--color-background-muted))] border border-[hsl(var(--color-border))] rounded-xl p-6">
            <h2 className="font-[family-name:var(--font-heading)] text-lg font-semibold text-[hsl(var(--color-foreground))] mb-4">Project Details</h2>
            <div className="prose prose-invert max-w-none">
              <p className="text-[hsl(var(--color-foreground-muted))] whitespace-pre-wrap">{lead.message || "No message provided"}</p>
            </div>
          </div>

          {/* Details Grid */}
          <div className="bg-[hsl(var(--color-background-muted))] border border-[hsl(var(--color-border))] rounded-xl p-6">
            <h2 className="font-[family-name:var(--font-heading)] text-lg font-semibold text-[hsl(var(--color-foreground))] mb-4">Lead Information</h2>
            <div className="grid grid-cols-2 gap-6">
              <div>
                <p className="text-[hsl(var(--color-foreground-subtle))] text-sm mb-1">Email</p>
                <a href={`mailto:${lead.email}`} className="text-[hsl(var(--color-accent))] hover:underline">
                  {lead.email}
                </a>
              </div>
              {lead.phone && (
                <div>
                  <p className="text-[hsl(var(--color-foreground-subtle))] text-sm mb-1">Phone</p>
                  <a href={`tel:${lead.phone}`} className="hover:text-[hsl(var(--color-accent))]">
                    {lead.phone}
                  </a>
                </div>
              )}
              <div>
                <p className="text-[hsl(var(--color-foreground-subtle))] text-sm mb-1">Service Interest</p>
                <p className="text-[hsl(var(--color-foreground))]">{formatService(lead.service_interest)}</p>
              </div>
              <div>
                <p className="text-[hsl(var(--color-foreground-subtle))] text-sm mb-1">Budget Range</p>
                <p className="text-[hsl(var(--color-foreground))]">{formatBudget(lead.budget_range)}</p>
              </div>
              <div>
                <p className="text-[hsl(var(--color-foreground-subtle))] text-sm mb-1">Timeline</p>
                <p className="text-[hsl(var(--color-foreground))]">{formatTimeline(lead.timeline)}</p>
              </div>
              <div>
                <p className="text-[hsl(var(--color-foreground-subtle))] text-sm mb-1">Submitted</p>
                <p className="text-[hsl(var(--color-foreground))]">{formatDate(lead.created_at)}</p>
              </div>
            </div>
          </div>

          {/* Attribution */}
          {(lead.utm_source || lead.landing_page) && (
            <div className="bg-[hsl(var(--color-background-muted))] border border-[hsl(var(--color-border))] rounded-xl p-6">
              <h2 className="font-[family-name:var(--font-heading)] text-lg font-semibold text-[hsl(var(--color-foreground))] mb-4">Attribution</h2>
              <div className="grid grid-cols-2 gap-6">
                {lead.utm_source && (
                  <div>
                    <p className="text-[hsl(var(--color-foreground-subtle))] text-sm mb-1">Source</p>
                    <p className="text-[hsl(var(--color-foreground))]">{lead.utm_source}</p>
                  </div>
                )}
                {lead.utm_medium && (
                  <div>
                    <p className="text-[hsl(var(--color-foreground-subtle))] text-sm mb-1">Medium</p>
                    <p className="text-[hsl(var(--color-foreground))]">{lead.utm_medium}</p>
                  </div>
                )}
                {lead.utm_campaign && (
                  <div>
                    <p className="text-[hsl(var(--color-foreground-subtle))] text-sm mb-1">Campaign</p>
                    <p className="text-[hsl(var(--color-foreground))]">{lead.utm_campaign}</p>
                  </div>
                )}
                {lead.landing_page && (
                  <div>
                    <p className="text-[hsl(var(--color-foreground-subtle))] text-sm mb-1">Landing Page</p>
                    <p className="text-[hsl(var(--color-foreground))]">{lead.landing_page}</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* AI Intelligence */}
          <div className="bg-[hsl(var(--color-background-muted))] border border-[hsl(var(--color-border))] rounded-xl p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-[family-name:var(--font-heading)] text-lg font-semibold text-[hsl(var(--color-foreground))]">AI Intelligence</h2>
              {!analysis && (
                <button
                  onClick={handleAnalyze}
                  disabled={analyzing}
                  className="px-4 py-2 bg-[hsl(var(--color-accent))] text-black text-sm font-medium rounded-xl hover:bg-[hsl(var(--color-accent-hover))] transition-colors disabled:opacity-50"
                >
                  {analyzing ? (
                    <span className="flex items-center gap-2">
                      <IconSpinner size={16} />
                      Analyzing...
                    </span>
                  ) : (
                    "Run Analysis"
                  )}
                </button>
              )}
            </div>

            {analysis ? (
              <div className="space-y-6">
                {/* Score Cards */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-4 bg-[hsl(var(--color-background-subtle))] rounded-xl">
                    <p className="text-[hsl(var(--color-foreground-subtle))] text-sm mb-1">Fit Score</p>
                    <p className={`text-2xl font-semibold ${analysis.fit_score >= 0.7 ? 'text-green-600' : analysis.fit_score >= 0.4 ? 'text-yellow-600' : 'text-red-600'}`}>
                      {Math.round(analysis.fit_score * 100)}%
                    </p>
                  </div>
                  <div className="p-4 bg-[hsl(var(--color-background-subtle))] rounded-xl">
                    <p className="text-[hsl(var(--color-foreground-subtle))] text-sm mb-1">Scope Risk</p>
                    <p className={`text-2xl font-semibold ${analysis.scope_creep_risk < 0.3 ? 'text-green-600' : analysis.scope_creep_risk < 0.7 ? 'text-yellow-600' : 'text-red-600'}`}>
                      {Math.round(analysis.scope_creep_risk * 100)}%
                    </p>
                  </div>
                </div>

                {/* Classification */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-[hsl(var(--color-foreground-subtle))] text-sm mb-1">Project Type</p>
                    <p className="text-[hsl(var(--color-foreground))] font-medium">{analysis.project_type}</p>
                  </div>
                  <div>
                    <p className="text-[hsl(var(--color-foreground-subtle))] text-sm mb-1">Complexity</p>
                    <p className="text-[hsl(var(--color-foreground))] font-medium">{analysis.complexity}</p>
                  </div>
                </div>

                {/* Recommended Stack */}
                {analysis.recommended_stack && analysis.recommended_stack.length > 0 && (
                  <div>
                    <p className="text-[hsl(var(--color-foreground-subtle))] text-sm mb-2">Recommended Stack</p>
                    <div className="flex flex-wrap gap-2">
                      {analysis.recommended_stack.map((tech) => (
                        <span key={tech} className="px-3 py-1 bg-[hsl(var(--color-background-subtle))] text-[hsl(var(--color-foreground-muted))] text-sm rounded-full">
                          {tech}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Flags */}
                <div className="grid grid-cols-2 gap-4">
                  {analysis.green_flags && analysis.green_flags.length > 0 && (
                    <div>
                      <p className="text-[hsl(var(--color-foreground-subtle))] text-sm mb-2">Green Flags</p>
                      <div className="space-y-1">
                        {analysis.green_flags.map((flag, i) => (
                          <div key={i} className="flex items-center gap-2 text-green-600 text-sm">
                            <IconCheck size={16} className="shrink-0" />
                            {flag}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  {analysis.red_flags && analysis.red_flags.length > 0 && (
                    <div>
                      <p className="text-[hsl(var(--color-foreground-subtle))] text-sm mb-2">Red Flags</p>
                      <div className="space-y-1">
                        {analysis.red_flags.map((flag, i) => (
                          <div key={i} className="flex items-center gap-2 text-red-600 text-sm">
                            <IconAlertTriangle size={16} className="shrink-0" />
                            {flag}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* Review Status */}
                {analysis.requires_review && (
                  <div className="p-3 bg-yellow-500/10 border border-yellow-500/30 rounded-xl flex items-center gap-2 text-yellow-600">
                    <IconAlertTriangle size={20} className="shrink-0" />
                    <span className="text-sm font-medium">This lead requires human review</span>
                  </div>
                )}

                {/* V2: Company Research */}
                {analysis.company_research?.domain && (
                  <div className="p-4 bg-[hsl(var(--color-background-subtle))] rounded-xl">
                    <p className="text-[hsl(var(--color-foreground-subtle))] text-sm mb-3">Company Research</p>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-[hsl(var(--color-foreground-muted))]">Domain</span>
                        <a 
                          href={`https://${analysis.company_research.domain}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-sm text-[hsl(var(--color-accent))] hover:underline"
                        >
                          {analysis.company_research.domain}
                        </a>
                      </div>
                      {analysis.company_research.industry && (
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-[hsl(var(--color-foreground-muted))]">Industry</span>
                          <span className="text-sm text-[hsl(var(--color-foreground))]">{analysis.company_research.industry}</span>
                        </div>
                      )}
                      {analysis.company_research.tech_signals && analysis.company_research.tech_signals.length > 0 && (
                        <div>
                          <span className="text-sm text-[hsl(var(--color-foreground-muted))]">Tech Stack Detected</span>
                          <div className="flex flex-wrap gap-1 mt-1">
                            {analysis.company_research.tech_signals.map((tech) => (
                              <span key={tech} className="px-2 py-0.5 bg-blue-500/20 text-blue-400 text-xs rounded">
                                {tech}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                      {analysis.company_research.linkedin_url && (
                        <a 
                          href={analysis.company_research.linkedin_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-2 text-sm text-[hsl(var(--color-accent))] hover:underline mt-2"
                        >
                          <IconLinkedIn size={16} />
                          View on LinkedIn
                        </a>
                      )}
                    </div>
                  </div>
                )}

                {/* V2: Detailed Red Flags */}
                {analysis.detailed_red_flags && analysis.detailed_red_flags.length > 0 && (
                  <div>
                    <p className="text-[hsl(var(--color-foreground-subtle))] text-sm mb-2">Risk Assessment</p>
                    <div className="space-y-2">
                      {analysis.detailed_red_flags.map((flag, i) => (
                        <div 
                          key={i} 
                          className={`flex items-center gap-2 text-sm p-2 rounded-lg ${
                            flag.severity === 'high' ? 'bg-red-500/10 text-red-500' :
                            flag.severity === 'medium' ? 'bg-yellow-500/10 text-yellow-600' :
                            'bg-gray-500/10 text-gray-400'
                          }`}
                        >
                          <span className={`w-2 h-2 rounded-full ${
                            flag.severity === 'high' ? 'bg-red-500' :
                            flag.severity === 'medium' ? 'bg-yellow-500' :
                            'bg-gray-400'
                          }`} />
                          {flag.flag}
                          <span className="ml-auto text-xs opacity-60 capitalize">{flag.severity}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* V2: Response Template */}
                {analysis.response_template && (
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <p className="text-[hsl(var(--color-foreground-subtle))] text-sm">Suggested Response</p>
                      <button
                        onClick={() => {
                          navigator.clipboard.writeText(analysis.response_template || '');
                        }}
                        className="text-xs text-[hsl(var(--color-accent))] hover:underline"
                      >
                        Copy
                      </button>
                    </div>
                    <div className="p-4 bg-[hsl(var(--color-background-subtle))] rounded-xl">
                      <pre className="text-sm text-[hsl(var(--color-foreground-muted))] whitespace-pre-wrap font-sans">
                        {analysis.response_template}
                      </pre>
                    </div>
                  </div>
                )}

                {/* V2: Call Agenda */}
                {analysis.call_agenda && analysis.call_agenda.length > 0 && (
                  <div>
                    <p className="text-[hsl(var(--color-foreground-subtle))] text-sm mb-2">Discovery Call Agenda</p>
                    <ol className="space-y-2">
                      {analysis.call_agenda.map((item, i) => (
                        <li key={i} className="flex items-start gap-3 text-sm">
                          <span className="w-5 h-5 rounded-full bg-[hsl(var(--color-accent))]/20 text-[hsl(var(--color-accent))] flex items-center justify-center text-xs shrink-0">
                            {i + 1}
                          </span>
                          <span className={item.startsWith('⚠️') ? 'text-yellow-600' : 'text-[hsl(var(--color-foreground-muted))]'}>
                            {item}
                          </span>
                        </li>
                      ))}
                    </ol>
                  </div>
                )}

                {/* Analysis Mode */}
                <p className="text-xs text-[hsl(var(--color-foreground-subtle))]">
                  Analyzed via {analysis.analysis_mode === 'ml_service' ? 'ML Service' : 'Rule-based Engine'}
                  {analysis.analyzed_at && ` • ${formatDate(analysis.analyzed_at)}`}
                </p>
              </div>
            ) : (
              <div className="text-center py-8 text-[hsl(var(--color-foreground-subtle))]">
                <IconLightbulb size={48} className="mx-auto mb-3 opacity-50" />
                <p>Click &quot;Run Analysis&quot; to get AI-powered insights</p>
              </div>
            )}
          </div>
        </div>

        {/* Activity Timeline */}
        <div className="space-y-6">
          {/* Add Note */}
          <div className="bg-[hsl(var(--color-background-muted))] border border-[hsl(var(--color-border))] rounded-xl p-4">
            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Add a note..."
              rows={3}
              className="w-full bg-transparent border-none resize-none text-[hsl(var(--color-foreground))] placeholder-[hsl(var(--color-foreground-subtle))] focus:outline-none"
            />
            <div className="flex justify-end">
              <button
                onClick={handleAddNote}
                disabled={!note.trim() || addingNote}
                className="px-4 py-2 bg-[hsl(var(--color-accent))] text-black font-medium rounded-xl hover:bg-[hsl(var(--color-accent-hover))] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {addingNote ? "Adding..." : "Add Note"}
              </button>
            </div>
          </div>

          {/* Timeline */}
          <div className="bg-[hsl(var(--color-background-muted))] border border-[hsl(var(--color-border))] rounded-xl p-6">
            <h2 className="font-[family-name:var(--font-heading)] text-lg font-semibold text-[hsl(var(--color-foreground))] mb-4">Activity</h2>
            <div className="space-y-4">
              {activities.length > 0 ? (
                activities.map((activity, index) => (
                  <div key={activity.id} className="flex gap-3">
                    <div className="relative">
                      <div className="w-8 h-8 rounded-full bg-[hsl(var(--color-background-subtle))] flex items-center justify-center text-[hsl(var(--color-foreground-muted))]">
                        {getActivityIcon(activity.type)}
                      </div>
                      {index < activities.length - 1 && (
                        <div className="absolute top-8 left-1/2 -translate-x-1/2 w-px h-full bg-[hsl(var(--color-border))]" />
                      )}
                    </div>
                    <div className="flex-1 pb-4">
                      <p className="text-sm text-[hsl(var(--color-foreground))]">{activity.description}</p>
                      <p className="text-xs text-[hsl(var(--color-foreground-subtle))] mt-1">
                        {formatDate(activity.created_at)}
                      </p>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-[hsl(var(--color-foreground-subtle))] text-sm">No activity yet</p>
              )}
            </div>
          </div>

          {/* Quick Actions */}
          <div className="bg-[hsl(var(--color-background-muted))] border border-[hsl(var(--color-border))] rounded-xl p-6">
            <h2 className="font-[family-name:var(--font-heading)] text-lg font-semibold text-[hsl(var(--color-foreground))] mb-4">Quick Actions</h2>
            <div className="space-y-2">
              <a
                href={`mailto:${lead.email}`}
                className="flex items-center gap-3 px-4 py-3 bg-[hsl(var(--color-background-subtle))] hover:bg-[hsl(var(--color-border))] rounded-xl transition-colors"
              >
                <IconMail size={20} className="text-[hsl(var(--color-foreground-muted))]" />
                <span>Send Email</span>
              </a>
              {chatId && (
                <Link
                  href={`/admin/chats/${chatId}`}
                  className="flex items-center gap-3 px-4 py-3 bg-[hsl(var(--color-background-subtle))] hover:bg-[hsl(var(--color-border))] rounded-xl transition-colors"
                >
                  <IconMessageSquare size={20} className="text-[hsl(var(--color-foreground-muted))]" />
                  <span>Read the Ask Craefto chat</span>
                </Link>
              )}
              {lead.phone && (
                <a
                  href={`tel:${lead.phone}`}
                  className="flex items-center gap-3 px-4 py-3 bg-[hsl(var(--color-background-subtle))] hover:bg-[hsl(var(--color-border))] rounded-xl transition-colors"
                >
                  <IconPhone size={20} className="text-[hsl(var(--color-foreground-muted))]" />
                  <span>Call</span>
                </a>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
