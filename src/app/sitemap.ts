import { MetadataRoute } from "next";
import { createServerClient } from "@/lib/supabase";
import { caseStudies } from "@/content/case-studies";
import { roles } from "@/lib/careers";
import { SITE_URL } from "@/lib/seo";

type ChangeFrequency = "weekly" | "monthly" | "always" | "hourly" | "daily" | "yearly" | "never";

// Only real dates go in lastModified: a timestamp that changes on every
// request teaches search engines to ignore the field, so static pages omit it.
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const supabase = createServerClient();

  const staticPages: { path: string; changeFrequency: ChangeFrequency; priority: number }[] = [
    { path: "", changeFrequency: "weekly", priority: 1 },
    { path: "/work", changeFrequency: "weekly", priority: 0.9 },
    { path: "/services", changeFrequency: "monthly", priority: 0.9 },
    { path: "/journal", changeFrequency: "daily", priority: 0.9 },
    { path: "/process", changeFrequency: "monthly", priority: 0.8 },
    { path: "/about", changeFrequency: "monthly", priority: 0.8 },
    { path: "/contact", changeFrequency: "monthly", priority: 0.8 },
    { path: "/start", changeFrequency: "monthly", priority: 0.7 },
    { path: "/careers", changeFrequency: "weekly", priority: 0.6 },
    { path: "/changelog", changeFrequency: "weekly", priority: 0.4 },
    { path: "/privacy", changeFrequency: "yearly", priority: 0.2 },
    { path: "/terms", changeFrequency: "yearly", priority: 0.2 },
  ];

  const routes: MetadataRoute.Sitemap = staticPages.map((page) => ({
    url: `${SITE_URL}${page.path}`,
    changeFrequency: page.changeFrequency,
    priority: page.priority,
  }));

  const projectRoutes: MetadataRoute.Sitemap = caseStudies.map((study) => ({
    url: `${SITE_URL}/work/${study.slug}`,
    changeFrequency: "monthly",
    priority: 0.7,
  }));

  const roleRoutes: MetadataRoute.Sitemap = roles.map((role) => ({
    url: `${SITE_URL}/careers/${role.slug}`,
    lastModified: new Date(role.postedDate),
    changeFrequency: "monthly",
    priority: 0.5,
  }));

  // Fetch dynamic routes from Supabase (skip if not configured)
  if (!supabase) {
    return [...routes, ...projectRoutes, ...roleRoutes];
  }

  // Fetch journal articles
  const { data: articles } = await supabase
    .from("journal_published_articles")
    .select("slug, updated_at, published_at")
    .order("published_at", { ascending: false });

  const articleRoutes: MetadataRoute.Sitemap = (articles || []).map((article) => ({
    url: `${SITE_URL}/journal/${article.slug}`,
    lastModified: new Date(article.updated_at || article.published_at),
    changeFrequency: "weekly" as ChangeFrequency,
    priority: 0.8,
  }));

  // Fetch pillars
  const { data: pillars } = await supabase
    .from("journal_pillars")
    .select("slug");

  const pillarRoutes: MetadataRoute.Sitemap = (pillars || []).map((pillar) => ({
    url: `${SITE_URL}/journal/pillar/${pillar.slug}`,
    changeFrequency: "weekly" as ChangeFrequency,
    priority: 0.6,
  }));

  // Fetch authors
  const { data: authors } = await supabase
    .from("journal_authors")
    .select("slug");

  const authorRoutes: MetadataRoute.Sitemap = (authors || []).map((author) => ({
    url: `${SITE_URL}/journal/author/${author.slug}`,
    changeFrequency: "monthly" as ChangeFrequency,
    priority: 0.5,
  }));

  return [...routes, ...projectRoutes, ...roleRoutes, ...articleRoutes, ...pillarRoutes, ...authorRoutes];
}
