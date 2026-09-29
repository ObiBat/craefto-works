"use client";

import * as React from "react";
import Link from "next/link";
import { AdminLoader } from "@/components/admin/AdminLoader";
import { Button } from "@/components/ui/button";
import { PageContainer, PageHeader, Card } from "@/components/admin/ui";
import { IconX } from "@/components/admin/icons";

interface FeedbackEntry {
  id: string;
  article_id: string;
  agent_type: string;
  feedback_type: string;
  feedback_score: number;
  feedback_text: string | null;
  metadata: Record<string, unknown>;
  created_at: string;
  journal_articles?: {
    title: string;
    slug: string;
  };
}

interface AgentStats {
  totalFeedback: number;
  avgScore: number;
  byType: Record<string, { count: number; avgScore: number }>;
  recentTrend: "improving" | "declining" | "stable";
}

const AGENT_LABELS: Record<string, { name: string; icon: string }> = {
  topic_scout: { name: "Topic Scout", icon: "🔍" },
  research_analyst: { name: "Research Analyst", icon: "📊" },
  editorial_strategist: { name: "Editorial Strategist", icon: "🎯" },
  editorial_writer: { name: "Editorial Writer", icon: "✍️" },
  editor_guardian: { name: "Editor Guardian", icon: "🛡️" },
};

const FEEDBACK_TYPE_LABELS: Record<string, string> = {
  quality: "Quality",
  accuracy: "Accuracy",
  relevance: "Relevance",
  engagement: "Engagement",
  style: "Style",
  technical_accuracy: "Technical Accuracy",
  overall: "Overall",
};

const CARD_TITLE = "font-[family-name:var(--font-heading)] text-lg font-semibold text-[hsl(var(--color-foreground))]";
const FIELD_LABEL = "block text-sm font-medium text-[hsl(var(--color-foreground-muted))] mb-1.5";
const FIELD =
  "w-full px-4 py-2.5 rounded-xl bg-[hsl(var(--color-background))] border border-[hsl(var(--color-border))] text-sm text-[hsl(var(--color-foreground))] placeholder:text-[hsl(var(--color-foreground-subtle))] focus:outline-none focus:ring-2 focus:ring-[hsl(var(--color-accent))]/40 focus:border-[hsl(var(--color-accent))]/40";

function formatDate(dateString: string) {
  return new Date(dateString).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function ScoreDisplay({ score }: { score: number }) {
  const color =
    score >= 4
      ? "text-green-600"
      : score >= 3
        ? "text-yellow-600"
        : "text-red-600";

  return (
    <div className="flex items-center gap-1">
      {[1, 2, 3, 4, 5].map((i) => (
        <span
          key={i}
          className={`text-sm ${i <= score ? color : "text-[hsl(var(--color-border-strong))]"}`}
        >
          ★
        </span>
      ))}
      <span className={`ml-2 text-sm font-medium tabular-nums ${color}`}>
        {score.toFixed(1)}
      </span>
    </div>
  );
}

function TrendBadge({ trend }: { trend: "improving" | "declining" | "stable" }) {
  const styles: Record<string, { bg: string; text: string; icon: string }> = {
    improving: { bg: "bg-green-500/10", text: "text-green-600", icon: "↑" },
    declining: { bg: "bg-red-500/10", text: "text-red-600", icon: "↓" },
    stable: { bg: "bg-[hsl(var(--color-foreground-subtle))]/10", text: "text-[hsl(var(--color-foreground-subtle))]", icon: "→" },
  };

  const style = styles[trend];

  return (
    <span className={`shrink-0 whitespace-nowrap px-2.5 py-1 rounded-full text-xs font-medium ${style.bg} ${style.text}`}>
      {style.icon} {trend.charAt(0).toUpperCase() + trend.slice(1)}
    </span>
  );
}

export default function FeedbackDashboardPage() {
  const [feedback, setFeedback] = React.useState<FeedbackEntry[]>([]);
  const [stats, setStats] = React.useState<Record<string, AgentStats>>({});
  const [loading, setLoading] = React.useState(true);
  const [selectedAgent, setSelectedAgent] = React.useState<string | null>(null);
  const [showSubmitModal, setShowSubmitModal] = React.useState(false);

  // Form state for submitting feedback
  const [formArticle, setFormArticle] = React.useState("");
  const [formAgent, setFormAgent] = React.useState("editorial_writer");
  const [formType, setFormType] = React.useState("overall");
  const [formScore, setFormScore] = React.useState(4);
  const [formText, setFormText] = React.useState("");
  const [articles, setArticles] = React.useState<{ id: string; title: string }[]>([]);
  const [submitting, setSubmitting] = React.useState(false);

  // Fetch feedback and stats
  React.useEffect(() => {
    async function fetchData() {
      try {
        const res = await fetch("/api/analytics/feedback");
        if (res.ok) {
          const data = await res.json();
          setFeedback(data.feedback || []);
          setStats(data.stats || {});
        }

        // Fetch articles for dropdown
        const articlesRes = await fetch("/api/admin/journal/articles");
        if (articlesRes.ok) {
          const data = await articlesRes.json();
          setArticles(data.articles || []);
        }
      } catch (error) {
        console.error("Failed to fetch feedback:", error);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  async function handleSubmitFeedback(e: React.FormEvent) {
    e.preventDefault();
    if (!formArticle) return;

    setSubmitting(true);
    try {
      const res = await fetch("/api/analytics/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          articleId: formArticle,
          agentType: formAgent,
          feedbackType: formType,
          feedbackScore: formScore,
          feedbackText: formText || null,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        setFeedback((prev) => [data.feedback, ...prev]);
        setShowSubmitModal(false);
        setFormArticle("");
        setFormText("");
        setFormScore(4);
      } else {
        const error = await res.json();
        alert(error.error || "Failed to submit feedback");
      }
    } catch (error) {
      console.error("Failed to submit feedback:", error);
    } finally {
      setSubmitting(false);
    }
  }

  const filteredFeedback = selectedAgent
    ? feedback.filter((f) => f.agent_type === selectedAgent)
    : feedback;

  // Calculate overall stats
  const overallAvg = feedback.length
    ? feedback.reduce((sum, f) => sum + f.feedback_score, 0) / feedback.length
    : 0;

  if (loading) {
    return <AdminLoader message="Loading feedback..." />;
  }

  return (
    <PageContainer>
      <PageHeader
        title="Agent Feedback Loop"
        subtitle="Track AI agent performance and improve content generation"
        breadcrumb={
          <nav aria-label="Breadcrumb" className="flex items-center gap-2 text-sm text-[hsl(var(--color-foreground-muted))]">
            <Link href="/admin/analytics" className="inline-flex items-center hover:text-[hsl(var(--color-foreground))] transition-colors">
              Analytics
            </Link>
            <span>/</span>
            <span className="text-[hsl(var(--color-foreground))]">Agent Feedback</span>
          </nav>
        }
        actions={
          <Button variant="accent" size="sm" onClick={() => setShowSubmitModal(true)}>
            Submit Feedback
          </Button>
        }
      />

      {/* Overall Stats */}
      <Card>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between mb-6">
          <h2 className={CARD_TITLE}>Overall Performance</h2>
          <div className="flex flex-wrap items-center gap-4">
            <span className="text-sm text-[hsl(var(--color-foreground-subtle))]">{feedback.length} feedback entries</span>
            <ScoreDisplay score={overallAvg} />
          </div>
        </div>

        {/* Agent Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
          {Object.entries(AGENT_LABELS).map(([key, { name, icon }]) => {
            const agentStats = stats[key];
            const isSelected = selectedAgent === key;

            return (
              <button
                key={key}
                onClick={() => setSelectedAgent(isSelected ? null : key)}
                aria-pressed={isSelected}
                className={`p-4 rounded-xl border transition-colors text-left ${
                  isSelected
                    ? "bg-[hsl(var(--color-accent))]/10 border-[hsl(var(--color-accent))]/30"
                    : "bg-[hsl(var(--color-background))]/60 border-[hsl(var(--color-border))]/50 hover:border-[hsl(var(--color-border-strong))]/60"
                }`}
              >
                <div className="flex items-center gap-2 mb-3">
                  <span className="text-2xl">{icon}</span>
                  <span className="font-medium text-[hsl(var(--color-foreground))] text-sm">{name}</span>
                </div>

                {agentStats ? (
                  <>
                    <div className="mb-2">
                      <ScoreDisplay score={agentStats.avgScore} />
                    </div>
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <span className="text-xs text-[hsl(var(--color-foreground-subtle))]">
                        {agentStats.totalFeedback} entries
                      </span>
                      <TrendBadge trend={agentStats.recentTrend} />
                    </div>
                  </>
                ) : (
                  <p className="text-sm text-[hsl(var(--color-foreground-subtle))]">No feedback yet</p>
                )}
              </button>
            );
          })}
        </div>
      </Card>

      {/* Feedback by Type (for selected agent) */}
      {selectedAgent && stats[selectedAgent] && (
        <Card>
          <h2 className={`${CARD_TITLE} mb-4`}>
            {AGENT_LABELS[selectedAgent].icon} {AGENT_LABELS[selectedAgent].name} - Feedback by Type
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-7 gap-3">
            {Object.entries(stats[selectedAgent].byType).map(([type, data]) => (
              <div key={type} className="rounded-xl bg-[hsl(var(--color-background-muted))]/40 p-3">
                <p className="text-xs text-[hsl(var(--color-foreground-subtle))] mb-1">{FEEDBACK_TYPE_LABELS[type]}</p>
                <p className={`text-lg font-semibold tabular-nums ${
                  data.avgScore >= 4 ? "text-green-600" : data.avgScore >= 3 ? "text-yellow-600" : "text-red-600"
                }`}>
                  {data.avgScore.toFixed(1)}
                </p>
                <p className="text-xs text-[hsl(var(--color-foreground-subtle))]">{data.count} entries</p>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Recent Feedback */}
      <Card padding="none" className="overflow-hidden">
        <div className="p-6 border-b border-[hsl(var(--color-border))]/30 flex items-center justify-between gap-4">
          <h2 className={CARD_TITLE}>
            {selectedAgent ? `${AGENT_LABELS[selectedAgent].name} Feedback` : "Recent Feedback"}
          </h2>
          {selectedAgent && (
            <button
              onClick={() => setSelectedAgent(null)}
              className="shrink-0 text-sm text-[hsl(var(--color-foreground-subtle))] hover:text-[hsl(var(--color-foreground))] transition-colors"
            >
              Show all
            </button>
          )}
        </div>

        {filteredFeedback.length === 0 ? (
          <div className="px-6 py-12 text-center">
            <p className="text-lg font-medium text-[hsl(var(--color-foreground-muted))] mb-2">No feedback yet</p>
            <p className="text-sm text-[hsl(var(--color-foreground-subtle))]">Submit feedback to help improve AI agent performance.</p>
          </div>
        ) : (
          <div className="divide-y divide-[hsl(var(--color-border))]/30">
            {filteredFeedback.slice(0, 20).map((entry) => (
              <div key={entry.id} className="px-6 py-4">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between sm:gap-4">
                  <div className="min-w-0 sm:flex-1">
                    <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mb-2">
                      <span className="text-lg">
                        {AGENT_LABELS[entry.agent_type]?.icon || "🤖"}
                      </span>
                      <span className="font-medium text-[hsl(var(--color-foreground))]">
                        {AGENT_LABELS[entry.agent_type]?.name || entry.agent_type}
                      </span>
                      <span className="px-2.5 py-1 rounded-full bg-[hsl(var(--color-background-muted))] text-xs font-medium text-[hsl(var(--color-foreground-muted))]">
                        {FEEDBACK_TYPE_LABELS[entry.feedback_type] || entry.feedback_type}
                      </span>
                    </div>
                    <p className="text-sm text-[hsl(var(--color-foreground-subtle))] truncate">
                      {entry.journal_articles?.title || "Unknown article"}
                    </p>
                    {entry.feedback_text && (
                      <p className="text-sm text-[hsl(var(--color-foreground-muted))] mt-2 break-words">{entry.feedback_text}</p>
                    )}
                  </div>
                  <div className="shrink-0 sm:text-right">
                    <ScoreDisplay score={entry.feedback_score} />
                    <p className="text-xs text-[hsl(var(--color-foreground-subtle))] mt-1">
                      {formatDate(entry.created_at)}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>

      {/* Submit Feedback Modal */}
      {showSubmitModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-[hsl(var(--color-background))] border border-[hsl(var(--color-border))]/50 rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-[hsl(var(--color-border))]/30 flex items-center justify-between gap-4">
              <h2 className={CARD_TITLE}>Submit Feedback</h2>
              <Button
                variant="ghost"
                size="icon"
                className="h-9 w-9 shrink-0"
                aria-label="Close"
                onClick={() => setShowSubmitModal(false)}
              >
                <IconX size={20} />
              </Button>
            </div>

            <form onSubmit={handleSubmitFeedback} className="p-6 space-y-4">
              <div>
                <label htmlFor="feedback-article" className={FIELD_LABEL}>
                  Article
                </label>
                <select
                  id="feedback-article"
                  value={formArticle}
                  onChange={(e) => setFormArticle(e.target.value)}
                  className={FIELD}
                  required
                >
                  <option value="">Select an article...</option>
                  {articles.map((article) => (
                    <option key={article.id} value={article.id}>
                      {article.title}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="feedback-agent" className={FIELD_LABEL}>
                    Agent
                  </label>
                  <select
                    id="feedback-agent"
                    value={formAgent}
                    onChange={(e) => setFormAgent(e.target.value)}
                    className={FIELD}
                  >
                    {Object.entries(AGENT_LABELS).map(([key, { name, icon }]) => (
                      <option key={key} value={key}>
                        {icon} {name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label htmlFor="feedback-type" className={FIELD_LABEL}>
                    Feedback Type
                  </label>
                  <select
                    id="feedback-type"
                    value={formType}
                    onChange={(e) => setFormType(e.target.value)}
                    className={FIELD}
                  >
                    {Object.entries(FEEDBACK_TYPE_LABELS).map(([key, label]) => (
                      <option key={key} value={key}>
                        {label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <p id="feedback-score-label" className={FIELD_LABEL}>
                  Score
                </p>
                <div role="group" aria-labelledby="feedback-score-label" className="flex flex-wrap items-center gap-2">
                  {[1, 2, 3, 4, 5].map((score) => (
                    <button
                      key={score}
                      type="button"
                      onClick={() => setFormScore(score)}
                      aria-label={`Score ${score} of 5`}
                      aria-pressed={formScore === score}
                      className={`p-3 rounded-xl border transition-colors ${
                        formScore >= score
                          ? "bg-[hsl(var(--color-accent))]/10 border-[hsl(var(--color-accent))] text-[hsl(var(--color-accent))]"
                          : "bg-[hsl(var(--color-background-subtle))] border-[hsl(var(--color-border))] text-[hsl(var(--color-border-strong))] hover:border-[hsl(var(--color-border-strong))]"
                      }`}
                    >
                      <span className="text-xl">★</span>
                    </button>
                  ))}
                  <span className="ml-4 text-sm text-[hsl(var(--color-foreground-subtle))]">
                    {formScore === 1 && "Poor"}
                    {formScore === 2 && "Below Average"}
                    {formScore === 3 && "Average"}
                    {formScore === 4 && "Good"}
                    {formScore === 5 && "Excellent"}
                  </span>
                </div>
              </div>

              <div>
                <label htmlFor="feedback-comments" className={FIELD_LABEL}>
                  Comments (Optional)
                </label>
                <textarea
                  id="feedback-comments"
                  value={formText}
                  onChange={(e) => setFormText(e.target.value)}
                  className={`${FIELD} resize-none`}
                  rows={3}
                  placeholder="What could be improved? What worked well?"
                />
              </div>

              <div className="flex flex-wrap justify-end gap-3 pt-4">
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  onClick={() => setShowSubmitModal(false)}
                >
                  Cancel
                </Button>
                <Button type="submit" variant="accent" size="sm" disabled={submitting}>
                  {submitting ? "Submitting..." : "Submit Feedback"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </PageContainer>
  );
}
