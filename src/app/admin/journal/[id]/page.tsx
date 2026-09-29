"use client";

import * as React from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import { AdminLoader } from "@/components/admin/AdminLoader";
import { Button } from "@/components/ui/button";
import { PageContainer, PageHeader, Card } from "@/components/admin/ui";
import { IconChevronLeft } from "@/components/admin/icons";

interface Author {
  id: string;
  name: string;
  slug: string;
}

interface Pillar {
  id: string;
  name: string;
  slug: string;
  color: string;
}

interface Article {
  id: string;
  title: string;
  slug: string;
  subtitle: string | null;
  excerpt: string | null;
  content: string | null;
  featured_image_url: string | null;
  featured_image_alt: string | null;
  content_type: string;
  status: string;
  meta_title: string | null;
  meta_description: string | null;
  author_id: string;
  pillar_id: string;
  reading_time: number | null;
  published_at: string | null;
}

function generateSlug(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .trim();
}

function calculateReadingTime(content: string): number {
  const wordsPerMinute = 200;
  const words = content.trim().split(/\s+/).length;
  return Math.ceil(words / wordsPerMinute);
}

const LABEL_CLASS = "block text-sm font-medium text-[hsl(var(--color-foreground-muted))] mb-1.5";
const INPUT_CLASS =
  "w-full px-4 py-2.5 rounded-xl bg-[hsl(var(--color-background))] border border-[hsl(var(--color-border))] text-sm text-[hsl(var(--color-foreground))] placeholder:text-[hsl(var(--color-foreground-subtle))] focus:outline-none focus:ring-2 focus:ring-[hsl(var(--color-accent))]/40 focus:border-[hsl(var(--color-accent))]/40";

export default function ArticleEditorPage() {
  const router = useRouter();
  const params = useParams();
  const articleId = params.id as string;
  const isNew = articleId === "new";

  const [loading, setLoading] = React.useState(!isNew);
  const [saving, setSaving] = React.useState(false);
  const [authors, setAuthors] = React.useState<Author[]>([]);
  const [pillars, setPillars] = React.useState<Pillar[]>([]);
  const [error, setError] = React.useState<string | null>(null);
  const [success, setSuccess] = React.useState<string | null>(null);

  const [formData, setFormData] = React.useState<Partial<Article>>({
    title: "",
    slug: "",
    subtitle: "",
    excerpt: "",
    content: "",
    featured_image_url: "",
    featured_image_alt: "",
    content_type: "article",
    status: "draft",
    meta_title: "",
    meta_description: "",
    author_id: "",
    pillar_id: "",
    reading_time: 0,
  });

  // Fetch authors and pillars
  React.useEffect(() => {
    async function fetchData() {
      try {
        const [authorsRes, pillarsRes] = await Promise.all([
          fetch("/api/admin/journal/authors"),
          fetch("/api/journal/pillars"),
        ]);

        if (authorsRes.ok) {
          const data = await authorsRes.json();
          setAuthors(data.authors || []);
          if (!isNew && !formData.author_id && data.authors?.length > 0) {
            setFormData((prev) => ({ ...prev, author_id: data.authors[0].id }));
          }
        }

        if (pillarsRes.ok) {
          const data = await pillarsRes.json();
          setPillars(data.pillars || []);
          if (!isNew && !formData.pillar_id && data.pillars?.length > 0) {
            setFormData((prev) => ({ ...prev, pillar_id: data.pillars[0].id }));
          }
        }
      } catch (err) {
        console.error("Failed to fetch data:", err);
      }
    }
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps -- runs once per isNew and deliberately reads the initial author/pillar ids; adding them as deps would refetch authors and pillars whenever the form changes them
  }, [isNew]);

  // Fetch article if editing
  React.useEffect(() => {
    if (isNew) return;

    async function fetchArticle() {
      try {
        const res = await fetch(`/api/admin/journal/articles/${articleId}`);
        if (res.ok) {
          const data = await res.json();
          setFormData({
            title: data.article.title,
            slug: data.article.slug,
            subtitle: data.article.subtitle || "",
            excerpt: data.article.excerpt || "",
            content: data.article.content || "",
            featured_image_url: data.article.featured_image_url || "",
            featured_image_alt: data.article.featured_image_alt || "",
            content_type: data.article.content_type,
            status: data.article.status,
            meta_title: data.article.meta_title || "",
            meta_description: data.article.meta_description || "",
            author_id: data.article.author_id,
            pillar_id: data.article.pillar_id,
            reading_time: data.article.reading_time,
          });
        } else {
          setError("Failed to load article");
        }
      } catch {
        setError("Failed to load article");
      } finally {
        setLoading(false);
      }
    }
    fetchArticle();
  }, [articleId, isNew]);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => {
      const updated = { ...prev, [name]: value };

      // Auto-generate slug from title
      if (name === "title" && isNew) {
        updated.slug = generateSlug(value);
      }

      // Auto-calculate reading time from content
      if (name === "content") {
        updated.reading_time = calculateReadingTime(value);
      }

      return updated;
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    setSaving(true);

    try {
      const url = isNew
        ? "/api/admin/journal/articles"
        : `/api/admin/journal/articles/${articleId}`;
      const method = isNew ? "POST" : "PUT";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Failed to save article");
        return;
      }

      setSuccess("Article saved successfully");

      if (isNew) {
        router.push(`/admin/journal/${data.article.id}`);
      }
    } catch {
      setError("Failed to save article");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm("Are you sure you want to delete this article? This cannot be undone.")) {
      return;
    }

    try {
      const res = await fetch(`/api/admin/journal/articles/${articleId}`, {
        method: "DELETE",
      });

      if (res.ok) {
        router.push("/admin/journal");
      } else {
        setError("Failed to delete article");
      }
    } catch {
      setError("Failed to delete article");
    }
  };

  if (loading) {
    return <AdminLoader message="Loading article..." />;
  }

  return (
    <PageContainer className="max-w-4xl">
      <PageHeader
        breadcrumb={
          <Link
            href="/admin/journal"
            aria-label="Back to journal"
            className="inline-flex items-center justify-center p-2 -ml-2 rounded-xl text-[hsl(var(--color-foreground-muted))] hover:text-[hsl(var(--color-foreground))] hover:bg-[hsl(var(--color-background-subtle))] transition-colors"
          >
            <IconChevronLeft size={20} />
          </Link>
        }
        title={isNew ? "New Article" : "Edit Article"}
        actions={
          !isNew ? (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleDelete}
              className="text-red-600 hover:bg-red-500/10"
            >
              Delete
            </Button>
          ) : undefined
        }
      />

      {/* Alerts */}
      {error && (
        <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-red-600">
          {error}
        </div>
      )}
      {success && (
        <div className="p-4 bg-green-500/10 border border-green-500/20 rounded-xl text-green-600">
          {success}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        <Card className="space-y-6">
          {/* Title */}
          <div>
            <label htmlFor="article-title" className={LABEL_CLASS}>
              Title *
            </label>
            <input
              id="article-title"
              type="text"
              name="title"
              value={formData.title}
              onChange={handleChange}
              required
              className={INPUT_CLASS}
              placeholder="Article title"
            />
          </div>

          {/* Slug */}
          <div>
            <label htmlFor="article-slug" className={LABEL_CLASS}>
              Slug *
            </label>
            <input
              id="article-slug"
              type="text"
              name="slug"
              value={formData.slug}
              onChange={handleChange}
              required
              className={INPUT_CLASS}
              placeholder="article-slug"
            />
          </div>

          {/* Subtitle */}
          <div>
            <label htmlFor="article-subtitle" className={LABEL_CLASS}>
              Subtitle
            </label>
            <input
              id="article-subtitle"
              type="text"
              name="subtitle"
              value={formData.subtitle || ""}
              onChange={handleChange}
              className={INPUT_CLASS}
              placeholder="A brief subtitle for the article"
            />
          </div>

          {/* Author & Pillar */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label htmlFor="article-author" className={LABEL_CLASS}>
                Author *
              </label>
              <select
                id="article-author"
                name="author_id"
                value={formData.author_id}
                onChange={handleChange}
                required
                className={INPUT_CLASS}
              >
                <option value="">Select author</option>
                {authors.map((author) => (
                  <option key={author.id} value={author.id}>
                    {author.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label htmlFor="article-pillar" className={LABEL_CLASS}>
                Pillar *
              </label>
              <select
                id="article-pillar"
                name="pillar_id"
                value={formData.pillar_id}
                onChange={handleChange}
                required
                className={INPUT_CLASS}
              >
                <option value="">Select pillar</option>
                {pillars.map((pillar) => (
                  <option key={pillar.id} value={pillar.id}>
                    {pillar.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Content Type & Status */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label htmlFor="article-content-type" className={LABEL_CLASS}>
                Content Type
              </label>
              <select
                id="article-content-type"
                name="content_type"
                value={formData.content_type}
                onChange={handleChange}
                className={INPUT_CLASS}
              >
                <option value="article">Article</option>
                <option value="deep_dive">Deep Dive</option>
                <option value="case_study">Case Study</option>
                <option value="tutorial">Tutorial</option>
                <option value="opinion">Opinion</option>
              </select>
            </div>
            <div>
              <label htmlFor="article-status" className={LABEL_CLASS}>
                Status
              </label>
              <select
                id="article-status"
                name="status"
                value={formData.status}
                onChange={handleChange}
                className={INPUT_CLASS}
              >
                <option value="draft">Draft</option>
                <option value="review">Review</option>
                <option value="approved">Approved</option>
                <option value="published">Published</option>
                <option value="archived">Archived</option>
              </select>
            </div>
          </div>

          {/* Featured Image */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label htmlFor="article-featured-image-url" className={LABEL_CLASS}>
                Featured Image URL
              </label>
              <input
                id="article-featured-image-url"
                type="url"
                name="featured_image_url"
                value={formData.featured_image_url || ""}
                onChange={handleChange}
                className={INPUT_CLASS}
                placeholder="https://..."
              />
            </div>
            <div>
              <label htmlFor="article-featured-image-alt" className={LABEL_CLASS}>
                Image Alt Text
              </label>
              <input
                id="article-featured-image-alt"
                type="text"
                name="featured_image_alt"
                value={formData.featured_image_alt || ""}
                onChange={handleChange}
                className={INPUT_CLASS}
                placeholder="Describe the image"
              />
            </div>
          </div>

          {/* Excerpt */}
          <div>
            <label htmlFor="article-excerpt" className={LABEL_CLASS}>
              Excerpt
            </label>
            <textarea
              id="article-excerpt"
              name="excerpt"
              value={formData.excerpt || ""}
              onChange={handleChange}
              rows={3}
              className={`${INPUT_CLASS} resize-none`}
              placeholder="A brief summary of the article"
            />
          </div>

          {/* Content */}
          <div>
            <label htmlFor="article-content" className={LABEL_CLASS}>
              Content (MDX)
              <span className="text-[hsl(var(--color-foreground-subtle))] ml-2">
                {formData.reading_time} min read
              </span>
            </label>
            <textarea
              id="article-content"
              name="content"
              value={formData.content || ""}
              onChange={handleChange}
              rows={20}
              className={`${INPUT_CLASS} font-mono resize-y`}
              placeholder="Write your article content in MDX format..."
            />
          </div>
        </Card>

        {/* SEO */}
        <Card className="space-y-4">
          <h2 className="font-[family-name:var(--font-heading)] text-lg font-semibold text-[hsl(var(--color-foreground))]">
            SEO Settings
          </h2>
          <div className="space-y-4">
            <div>
              <label htmlFor="article-meta-title" className={LABEL_CLASS}>
                Meta Title
              </label>
              <input
                id="article-meta-title"
                type="text"
                name="meta_title"
                value={formData.meta_title || ""}
                onChange={handleChange}
                className={INPUT_CLASS}
                placeholder="SEO title (defaults to article title)"
              />
            </div>
            <div>
              <label htmlFor="article-meta-description" className={LABEL_CLASS}>
                Meta Description
              </label>
              <textarea
                id="article-meta-description"
                name="meta_description"
                value={formData.meta_description || ""}
                onChange={handleChange}
                rows={2}
                className={`${INPUT_CLASS} resize-none`}
                placeholder="SEO description (defaults to excerpt)"
              />
            </div>
          </div>
        </Card>

        {/* Submit */}
        <div className="flex flex-wrap items-center justify-end gap-3">
          <Button
            asChild
            variant="ghost"
            size="sm"
            className="text-[hsl(var(--color-foreground-muted))] hover:text-[hsl(var(--color-foreground))]"
          >
            <Link href="/admin/journal">Cancel</Link>
          </Button>
          <Button type="submit" variant="accent" size="sm" disabled={saving}>
            {saving ? "Saving..." : isNew ? "Create Article" : "Save Changes"}
          </Button>
        </div>
      </form>
    </PageContainer>
  );
}
