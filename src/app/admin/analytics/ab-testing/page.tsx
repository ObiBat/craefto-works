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
import { IconChart, IconX } from "@/components/admin/icons";

interface ABTest {
  id: string;
  article_id: string;
  test_name: string;
  variant_a: string;
  variant_b: string;
  variant_a_views: number;
  variant_b_views: number;
  variant_a_clicks: number;
  variant_b_clicks: number;
  winner: string | null;
  confidence: number | null;
  status: string;
  created_at: string;
  ended_at: string | null;
  journal_articles?: {
    title: string;
    slug: string;
  };
}

interface Article {
  id: string;
  title: string;
  slug: string;
}

const MODAL_TITLE = "font-[family-name:var(--font-heading)] text-lg font-semibold text-[hsl(var(--color-foreground))]";
const FIELD_LABEL = "block text-sm font-medium text-[hsl(var(--color-foreground-muted))] mb-1.5";
const FIELD =
  "w-full px-4 py-2.5 rounded-xl bg-[hsl(var(--color-background))] border border-[hsl(var(--color-border))] text-sm text-[hsl(var(--color-foreground))] placeholder:text-[hsl(var(--color-foreground-subtle))] focus:outline-none focus:ring-2 focus:ring-[hsl(var(--color-accent))]/40 focus:border-[hsl(var(--color-accent))]/40";

function formatDate(dateString: string) {
  return new Date(dateString).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function calculateCTR(clicks: number, views: number): number {
  return views > 0 ? (clicks / views) * 100 : 0;
}

function TestStatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    active: "bg-green-500/10 text-green-600 border-green-500/20",
    completed: "bg-blue-500/10 text-blue-600 border-blue-500/20",
    cancelled: "bg-[hsl(var(--color-foreground-subtle))]/10 text-[hsl(var(--color-foreground-subtle))] border-[hsl(var(--color-foreground-subtle))]/20",
  };

  return (
    <span className={`inline-flex items-center shrink-0 whitespace-nowrap px-2.5 py-1 rounded-full text-xs font-medium border ${styles[status] || styles.cancelled}`}>
      {status.charAt(0).toUpperCase() + status.slice(1)}
    </span>
  );
}

function WinnerBadge({ variant, confidence }: { variant: string; confidence: number | null }) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <span className="inline-flex items-center whitespace-nowrap px-2.5 py-1 rounded-full text-xs font-medium bg-[hsl(var(--color-accent))]/10 text-[hsl(var(--color-accent))] border border-[hsl(var(--color-accent))]/20">
        Winner: Variant {variant.toUpperCase()}
      </span>
      {confidence !== null && (
        <span className="text-xs text-[hsl(var(--color-foreground-subtle))]">
          {(confidence * 100).toFixed(0)}% confidence
        </span>
      )}
    </div>
  );
}

export default function ABTestingPage() {
  const [tests, setTests] = React.useState<ABTest[]>([]);
  const [articles, setArticles] = React.useState<Article[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [showCreateModal, setShowCreateModal] = React.useState(false);
  const [selectedTest, setSelectedTest] = React.useState<ABTest | null>(null);
  const [filter, setFilter] = React.useState<"all" | "active" | "completed">("all");

  // Form state
  const [formArticle, setFormArticle] = React.useState("");
  const [formTestName, setFormTestName] = React.useState("title");
  const [formVariantA, setFormVariantA] = React.useState("");
  const [formVariantB, setFormVariantB] = React.useState("");
  const [creating, setCreating] = React.useState(false);

  // Fetch tests and articles
  React.useEffect(() => {
    async function fetchData() {
      try {
        // Fetch all tests
        const testsRes = await fetch("/api/analytics/ab-test");
        if (testsRes.ok) {
          const data = await testsRes.json();
          setTests(data);
        }

        // Fetch articles for dropdown
        const articlesRes = await fetch("/api/admin/journal/articles");
        if (articlesRes.ok) {
          const data = await articlesRes.json();
          setArticles(data.articles || []);
        }
      } catch (error) {
        console.error("Failed to fetch data:", error);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  async function handleCreateTest(e: React.FormEvent) {
    e.preventDefault();
    if (!formArticle || !formVariantA || !formVariantB) return;

    setCreating(true);
    try {
      const res = await fetch("/api/analytics/ab-test", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "create",
          articleId: formArticle,
          testName: formTestName,
          variantA: formVariantA,
          variantB: formVariantB,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        setTests((prev) => [data.test, ...prev]);
        setShowCreateModal(false);
        setFormArticle("");
        setFormVariantA("");
        setFormVariantB("");
      } else {
        const error = await res.json();
        alert(error.error || "Failed to create test");
      }
    } catch (error) {
      console.error("Failed to create test:", error);
    } finally {
      setCreating(false);
    }
  }

  async function handleEndTest(testId: string) {
    if (!confirm("End this test and declare a winner?")) return;

    try {
      const res = await fetch("/api/analytics/ab-test", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "end", testId }),
      });

      if (res.ok) {
        const data = await res.json();
        setTests((prev) =>
          prev.map((t) =>
            t.id === testId
              ? { ...t, status: "completed", winner: data.winner, confidence: data.confidence }
              : t
          )
        );
        setSelectedTest(null);
      }
    } catch (error) {
      console.error("Failed to end test:", error);
    }
  }

  async function handleCancelTest(testId: string) {
    if (!confirm("Cancel this test? This cannot be undone.")) return;

    try {
      const res = await fetch("/api/analytics/ab-test", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "cancel", testId }),
      });

      if (res.ok) {
        setTests((prev) =>
          prev.map((t) => (t.id === testId ? { ...t, status: "cancelled" } : t))
        );
        setSelectedTest(null);
      }
    } catch (error) {
      console.error("Failed to cancel test:", error);
    }
  }

  const filteredTests = tests.filter((test) => {
    if (filter === "all") return true;
    if (filter === "active") return test.status === "active";
    if (filter === "completed") return test.status === "completed";
    return true;
  });

  const activeTests = tests.filter((t) => t.status === "active").length;
  const completedTests = tests.filter((t) => t.status === "completed").length;

  if (loading) {
    return <AdminLoader message="Loading A/B tests..." />;
  }

  return (
    <PageContainer>
      <PageHeader
        title="A/B Testing"
        breadcrumb={
          <nav aria-label="Breadcrumb" className="flex items-center gap-2 text-sm text-[hsl(var(--color-foreground-muted))]">
            <Link href="/admin/analytics" className="inline-flex items-center hover:text-[hsl(var(--color-foreground))] transition-colors">
              Analytics
            </Link>
            <span>/</span>
            <span className="text-[hsl(var(--color-foreground))]">A/B Testing</span>
          </nav>
        }
        actions={
          <Button variant="accent" size="sm" onClick={() => setShowCreateModal(true)}>
            New Test
          </Button>
        }
      />

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard label="Total Tests" value={tests.length} />
        <StatCard label="Active Tests" value={activeTests} accent="success" />
        <StatCard label="Completed Tests" value={completedTests} />
      </div>

      {/* Filter Tabs */}
      <FilterBar>
        {(["all", "active", "completed"] as const).map((f) => (
          <FilterChip key={f} active={filter === f} onClick={() => setFilter(f)}>
            {f.charAt(0).toUpperCase() + f.slice(1)}
            {f === "active" && activeTests > 0 && (
              <span className="ml-2 px-1.5 py-0.5 bg-[hsl(var(--color-accent))]/20 text-[hsl(var(--color-accent))] text-xs tabular-nums rounded-md">
                {activeTests}
              </span>
            )}
          </FilterChip>
        ))}
      </FilterBar>

      {/* Tests List */}
      {filteredTests.length === 0 ? (
        <EmptyState
          icon={<IconChart size={48} />}
          title="No tests found"
          description={
            filter === "active"
              ? "Start a new A/B test to optimize your content."
              : "No tests match the current filter."
          }
        />
      ) : (
        <Card padding="none" className="overflow-hidden">
          <div className="divide-y divide-[hsl(var(--color-border))]/30">
            {filteredTests.map((test) => (
              <button
                key={test.id}
                onClick={() => setSelectedTest(test)}
                className="w-full px-6 py-4 flex flex-col gap-4 md:flex-row md:items-center md:gap-6 hover:bg-[hsl(var(--color-background-muted))]/30 transition-colors text-left"
              >
                <div className="min-w-0 md:flex-1">
                  <div className="flex items-center gap-3 mb-1">
                    <p className="font-medium text-[hsl(var(--color-foreground))] truncate">
                      {test.journal_articles?.title || "Unknown Article"}
                    </p>
                    <TestStatusBadge status={test.status} />
                  </div>
                  <p className="text-sm text-[hsl(var(--color-foreground-subtle))]">
                    Testing: {test.test_name} | Started {formatDate(test.created_at)}
                  </p>
                </div>

                <div className="flex items-center gap-6 md:gap-8 text-sm shrink-0">
                  <div className="text-center">
                    <p className="text-[hsl(var(--color-foreground))] font-medium tabular-nums">
                      {calculateCTR(test.variant_a_clicks, test.variant_a_views).toFixed(1)}%
                    </p>
                    <p className="text-[hsl(var(--color-foreground-subtle))]">Variant A</p>
                  </div>
                  <div className="text-center">
                    <p className="text-[hsl(var(--color-foreground))] font-medium tabular-nums">
                      {calculateCTR(test.variant_b_clicks, test.variant_b_views).toFixed(1)}%
                    </p>
                    <p className="text-[hsl(var(--color-foreground-subtle))]">Variant B</p>
                  </div>
                  <div className="text-center">
                    <p className="text-[hsl(var(--color-foreground))] font-medium tabular-nums">
                      {test.variant_a_views + test.variant_b_views}
                    </p>
                    <p className="text-[hsl(var(--color-foreground-subtle))]">Impressions</p>
                  </div>
                </div>

                {test.winner && (
                  <WinnerBadge variant={test.winner} confidence={test.confidence} />
                )}
              </button>
            ))}
          </div>
        </Card>
      )}

      {/* Create Test Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-[hsl(var(--color-background))] border border-[hsl(var(--color-border))]/50 rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-[hsl(var(--color-border))]/30 flex items-center justify-between gap-4">
              <h2 className={MODAL_TITLE}>Create A/B Test</h2>
              <Button
                variant="ghost"
                size="icon"
                className="h-9 w-9 shrink-0"
                aria-label="Close"
                onClick={() => setShowCreateModal(false)}
              >
                <IconX size={20} />
              </Button>
            </div>

            <form onSubmit={handleCreateTest} className="p-6 space-y-4">
              <div>
                <label htmlFor="ab-test-article" className={FIELD_LABEL}>
                  Article
                </label>
                <select
                  id="ab-test-article"
                  value={formArticle}
                  onChange={(e) => {
                    setFormArticle(e.target.value);
                    const article = articles.find((a) => a.id === e.target.value);
                    if (article) {
                      setFormVariantA(article.title);
                    }
                  }}
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

              <div>
                <label htmlFor="ab-test-type" className={FIELD_LABEL}>
                  Test Type
                </label>
                <select
                  id="ab-test-type"
                  value={formTestName}
                  onChange={(e) => setFormTestName(e.target.value)}
                  className={FIELD}
                >
                  <option value="title">Title</option>
                  <option value="excerpt">Excerpt</option>
                  <option value="cta">Call to Action</option>
                </select>
              </div>

              <div>
                <label htmlFor="ab-test-variant-a" className={FIELD_LABEL}>
                  Variant A (Control)
                </label>
                <textarea
                  id="ab-test-variant-a"
                  value={formVariantA}
                  onChange={(e) => setFormVariantA(e.target.value)}
                  className={`${FIELD} resize-none`}
                  rows={2}
                  placeholder="Original text..."
                  required
                />
              </div>

              <div>
                <label htmlFor="ab-test-variant-b" className={FIELD_LABEL}>
                  Variant B (Test)
                </label>
                <textarea
                  id="ab-test-variant-b"
                  value={formVariantB}
                  onChange={(e) => setFormVariantB(e.target.value)}
                  className={`${FIELD} resize-none`}
                  rows={2}
                  placeholder="Alternative text to test..."
                  required
                />
              </div>

              <div className="flex flex-wrap justify-end gap-3 pt-4">
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  onClick={() => setShowCreateModal(false)}
                >
                  Cancel
                </Button>
                <Button type="submit" variant="accent" size="sm" disabled={creating}>
                  {creating ? "Creating..." : "Create Test"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Test Detail Modal */}
      {selectedTest && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-[hsl(var(--color-background))] border border-[hsl(var(--color-border))]/50 rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-[hsl(var(--color-border))]/30 flex items-start justify-between gap-4 sticky top-0 z-10 bg-[hsl(var(--color-background))]">
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-3 mb-1">
                  <h2 className={MODAL_TITLE}>Test Details</h2>
                  <TestStatusBadge status={selectedTest.status} />
                </div>
                <p className="text-sm text-[hsl(var(--color-foreground-subtle))] break-words">
                  {selectedTest.journal_articles?.title || "Unknown Article"}
                </p>
              </div>
              <Button
                variant="ghost"
                size="icon"
                className="h-9 w-9 shrink-0"
                aria-label="Close"
                onClick={() => setSelectedTest(null)}
              >
                <IconX size={20} />
              </Button>
            </div>

            <div className="p-6 space-y-6">
              {/* Winner Banner */}
              {selectedTest.winner && (
                <div className="bg-[hsl(var(--color-accent))]/10 border border-[hsl(var(--color-accent))]/20 rounded-xl p-4">
                  <WinnerBadge variant={selectedTest.winner} confidence={selectedTest.confidence} />
                </div>
              )}

              {/* Variants Comparison */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className={`bg-[hsl(var(--color-background-subtle))] rounded-xl p-4 border ${
                  selectedTest.winner === "a" ? "border-[hsl(var(--color-accent))]" : "border-[hsl(var(--color-border))]"
                }`}>
                  <div className="flex items-center justify-between gap-3 mb-3">
                    <span className="text-sm font-medium text-[hsl(var(--color-foreground-muted))]">Variant A (Control)</span>
                    {selectedTest.winner === "a" && (
                      <span className="text-xs text-[hsl(var(--color-accent))]">WINNER</span>
                    )}
                  </div>
                  <p className="text-[hsl(var(--color-foreground))] mb-4 break-words">{selectedTest.variant_a}</p>
                  <div className="grid grid-cols-3 gap-4 text-center">
                    <div>
                      <p className="text-xl font-semibold tabular-nums text-[hsl(var(--color-foreground))]">{selectedTest.variant_a_views}</p>
                      <p className="text-xs text-[hsl(var(--color-foreground-subtle))]">Views</p>
                    </div>
                    <div>
                      <p className="text-xl font-semibold tabular-nums text-[hsl(var(--color-foreground))]">{selectedTest.variant_a_clicks}</p>
                      <p className="text-xs text-[hsl(var(--color-foreground-subtle))]">Clicks</p>
                    </div>
                    <div>
                      <p className="text-xl font-semibold tabular-nums text-[hsl(var(--color-accent))]">
                        {calculateCTR(selectedTest.variant_a_clicks, selectedTest.variant_a_views).toFixed(2)}%
                      </p>
                      <p className="text-xs text-[hsl(var(--color-foreground-subtle))]">CTR</p>
                    </div>
                  </div>
                </div>

                <div className={`bg-[hsl(var(--color-background-subtle))] rounded-xl p-4 border ${
                  selectedTest.winner === "b" ? "border-[hsl(var(--color-accent))]" : "border-[hsl(var(--color-border))]"
                }`}>
                  <div className="flex items-center justify-between gap-3 mb-3">
                    <span className="text-sm font-medium text-[hsl(var(--color-foreground-muted))]">Variant B (Test)</span>
                    {selectedTest.winner === "b" && (
                      <span className="text-xs text-[hsl(var(--color-accent))]">WINNER</span>
                    )}
                  </div>
                  <p className="text-[hsl(var(--color-foreground))] mb-4 break-words">{selectedTest.variant_b}</p>
                  <div className="grid grid-cols-3 gap-4 text-center">
                    <div>
                      <p className="text-xl font-semibold tabular-nums text-[hsl(var(--color-foreground))]">{selectedTest.variant_b_views}</p>
                      <p className="text-xs text-[hsl(var(--color-foreground-subtle))]">Views</p>
                    </div>
                    <div>
                      <p className="text-xl font-semibold tabular-nums text-[hsl(var(--color-foreground))]">{selectedTest.variant_b_clicks}</p>
                      <p className="text-xs text-[hsl(var(--color-foreground-subtle))]">Clicks</p>
                    </div>
                    <div>
                      <p className="text-xl font-semibold tabular-nums text-[hsl(var(--color-accent))]">
                        {calculateCTR(selectedTest.variant_b_clicks, selectedTest.variant_b_views).toFixed(2)}%
                      </p>
                      <p className="text-xs text-[hsl(var(--color-foreground-subtle))]">CTR</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Meta Info */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-[hsl(var(--color-foreground-subtle))]">Test Type:</span>
                  <span className="text-[hsl(var(--color-foreground))] ml-2 capitalize">{selectedTest.test_name}</span>
                </div>
                <div>
                  <span className="text-[hsl(var(--color-foreground-subtle))]">Started:</span>
                  <span className="text-[hsl(var(--color-foreground))] ml-2">{formatDate(selectedTest.created_at)}</span>
                </div>
                {selectedTest.ended_at && (
                  <div>
                    <span className="text-[hsl(var(--color-foreground-subtle))]">Ended:</span>
                    <span className="text-[hsl(var(--color-foreground))] ml-2">{formatDate(selectedTest.ended_at)}</span>
                  </div>
                )}
                <div>
                  <span className="text-[hsl(var(--color-foreground-subtle))]">Total Impressions:</span>
                  <span className="text-[hsl(var(--color-foreground))] ml-2 tabular-nums">
                    {selectedTest.variant_a_views + selectedTest.variant_b_views}
                  </span>
                </div>
              </div>

              {/* Actions */}
              {selectedTest.status === "active" && (
                <div className="flex flex-wrap justify-end gap-3 pt-4 border-t border-[hsl(var(--color-border))]/30">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-red-600 hover:bg-red-500/10"
                    onClick={() => handleCancelTest(selectedTest.id)}
                  >
                    Cancel Test
                  </Button>
                  <Button variant="accent" size="sm" onClick={() => handleEndTest(selectedTest.id)}>
                    End Test & Declare Winner
                  </Button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </PageContainer>
  );
}
