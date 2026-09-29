"use client";

import * as React from "react";
import Link from "next/link";
import { AdminLoader } from "@/components/admin/AdminLoader";
import { Button } from "@/components/ui/button";
import { PageContainer, PageHeader, Card, StatCard } from "@/components/admin/ui";
import { IconPlus, IconEdit, IconExternal } from "@/components/admin/icons";

interface Article {
  id: string;
  title: string;
  slug: string;
  status: string;
  content_type: string;
  pillar_name: string;
  pillar_color: string;
  author_name: string;
  published_at: string | null;
  created_at: string;
  updated_at: string;
}

interface Pillar {
  id: string;
  name: string;
  slug: string;
  color: string;
}

function formatDate(dateString: string) {
  return new Date(dateString).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function getStatusStyles(status: string) {
  const styles: Record<string, string> = {
    draft: "bg-[hsl(var(--color-background-muted))] text-[hsl(var(--color-foreground-muted))]",
    review: "bg-yellow-500/20 text-yellow-600",
    approved: "bg-blue-500/20 text-blue-600",
    published: "bg-green-500/20 text-green-600",
    archived: "bg-red-500/20 text-red-600",
  };
  return styles[status] || styles.draft;
}

const SELECT_CLASS =
  "h-10 px-3 rounded-xl bg-[hsl(var(--color-background-muted))] border border-[hsl(var(--color-border))] text-sm text-[hsl(var(--color-foreground))] focus:outline-none focus:ring-2 focus:ring-[hsl(var(--color-accent))]/40";
const TH_CLASS = "px-6 py-3 text-xs font-semibold text-[hsl(var(--color-foreground-muted))]";
const ROW_ACTION_CLASS =
  "h-9 w-9 text-[hsl(var(--color-foreground-muted))] hover:text-[hsl(var(--color-foreground))]";

export default function JournalAdminPage() {
  const [articles, setArticles] = React.useState<Article[]>([]);
  const [pillars, setPillars] = React.useState<Pillar[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [statusFilter, setStatusFilter] = React.useState<string>("all");
  const [pillarFilter, setPillarFilter] = React.useState<string>("all");

  React.useEffect(() => {
    async function fetchData() {
      try {
        const [articlesRes, pillarsRes] = await Promise.all([
          fetch("/api/admin/journal/articles"),
          fetch("/api/journal/pillars"),
        ]);

        if (articlesRes.ok) {
          const data = await articlesRes.json();
          setArticles(data.articles || []);
        }

        if (pillarsRes.ok) {
          const data = await pillarsRes.json();
          setPillars(data.pillars || []);
        }
      } catch (error) {
        console.error("Failed to fetch data:", error);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  const filteredArticles = articles.filter((article) => {
    if (statusFilter !== "all" && article.status !== statusFilter) return false;
    if (pillarFilter !== "all" && article.pillar_name !== pillarFilter) return false;
    return true;
  });

  const statuses = ["all", "draft", "review", "approved", "published", "archived"];

  if (loading) {
    return <AdminLoader message="Loading journal..." />;
  }

  return (
    <PageContainer>
      <PageHeader
        title="Journal"
        subtitle="Manage your articles and content"
        actions={
          <Button asChild variant="accent" size="sm">
            <Link href="/admin/journal/new">
              <IconPlus size={20} />
              New Article
            </Link>
          </Button>
        }
      />

      {/* Filters */}
      <div className="flex flex-col sm:flex-row sm:flex-wrap sm:items-center gap-3">
        <div className="flex items-center gap-2">
          <label htmlFor="journal-status-filter" className="text-sm text-[hsl(var(--color-foreground-muted))]">
            Status:
          </label>
          <select
            id="journal-status-filter"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className={`${SELECT_CLASS} flex-1 sm:flex-none`}
          >
            {statuses.map((status) => (
              <option key={status} value={status}>
                {status === "all" ? "All Statuses" : status.charAt(0).toUpperCase() + status.slice(1)}
              </option>
            ))}
          </select>
        </div>
        <div className="flex items-center gap-2">
          <label htmlFor="journal-pillar-filter" className="text-sm text-[hsl(var(--color-foreground-muted))]">
            Pillar:
          </label>
          <select
            id="journal-pillar-filter"
            value={pillarFilter}
            onChange={(e) => setPillarFilter(e.target.value)}
            className={`${SELECT_CLASS} flex-1 sm:flex-none`}
          >
            <option value="all">All Pillars</option>
            {pillars.map((pillar) => (
              <option key={pillar.id} value={pillar.name}>
                {pillar.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Articles Table */}
      <Card padding="none" className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[760px]">
            <thead>
              <tr className="border-b border-[hsl(var(--color-border))]/30">
                <th className={`text-left ${TH_CLASS}`}>Title</th>
                <th className={`text-left ${TH_CLASS}`}>Pillar</th>
                <th className={`text-left ${TH_CLASS}`}>Type</th>
                <th className={`text-left ${TH_CLASS}`}>Status</th>
                <th className={`text-left ${TH_CLASS}`}>Date</th>
                <th className={`text-right ${TH_CLASS}`}>Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[hsl(var(--color-border))]/30">
              {filteredArticles.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-[hsl(var(--color-foreground-subtle))]">
                    <p className="text-lg mb-2">No articles found</p>
                    <p className="text-sm">Create your first article to get started</p>
                  </td>
                </tr>
              ) : (
                filteredArticles.map((article) => (
                  <tr key={article.id} className="hover:bg-[hsl(var(--color-background-muted))]/30 transition-colors">
                    <td className="px-6 py-3.5 text-sm">
                      <Link
                        href={`/admin/journal/${article.id}`}
                        className="font-medium text-[hsl(var(--color-foreground))] hover:text-[hsl(var(--color-accent))] transition-colors"
                      >
                        {article.title}
                      </Link>
                      <p className="text-sm text-[hsl(var(--color-foreground-subtle))] mt-0.5">{article.author_name}</p>
                    </td>
                    <td className="px-6 py-3.5 text-sm">
                      <span
                        className="inline-flex items-center gap-1.5 text-sm"
                        style={{ color: article.pillar_color }}
                      >
                        <span
                          className="w-2 h-2 rounded-full"
                          style={{ backgroundColor: article.pillar_color }}
                        />
                        {article.pillar_name}
                      </span>
                    </td>
                    <td className="px-6 py-3.5 text-sm text-[hsl(var(--color-foreground-muted))] capitalize">
                      {article.content_type.replace("_", " ")}
                    </td>
                    <td className="px-6 py-3.5 text-sm">
                      <span
                        className={`px-2.5 py-1 rounded-full text-xs font-medium ${getStatusStyles(article.status)}`}
                      >
                        {article.status}
                      </span>
                    </td>
                    <td className="px-6 py-3.5 text-sm text-[hsl(var(--color-foreground-muted))]">
                      {article.published_at
                        ? formatDate(article.published_at)
                        : formatDate(article.updated_at)}
                    </td>
                    <td className="px-6 py-3.5 text-sm text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Button asChild variant="ghost" size="icon" className={ROW_ACTION_CLASS}>
                          <Link href={`/admin/journal/${article.id}`} title="Edit" aria-label="Edit article">
                            <IconEdit size={16} />
                          </Link>
                        </Button>
                        {article.status === "published" && (
                          <Button asChild variant="ghost" size="icon" className={ROW_ACTION_CLASS}>
                            <a
                              href={`/journal/${article.slug}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              title="View"
                              aria-label="View published article"
                            >
                              <IconExternal size={16} />
                            </a>
                          </Button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Stats Summary */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        {statuses.slice(1).map((status) => {
          const count = articles.filter((a) => a.status === status).length;
          return (
            <StatCard
              key={status}
              label={status.charAt(0).toUpperCase() + status.slice(1)}
              value={count}
            />
          );
        })}
      </div>
    </PageContainer>
  );
}
