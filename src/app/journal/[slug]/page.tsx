import { notFound } from "next/navigation";
import { Metadata } from "next";
import { MDXRemote } from "next-mdx-remote/rsc";
import remarkGfm from "remark-gfm";
import rehypeSlug from "rehype-slug";
import rehypeAutolinkHeadings from "rehype-autolink-headings";
import { createServerClient } from "@/lib/supabase";
import { ArticleHeader } from "@/components/journal/article-header";
import { TableOfContents } from "@/components/journal/table-of-contents";
import { AuthorCard } from "@/components/journal/author-card";
import { ArticleCard } from "@/components/journal/article-card";
import { ArticleAnalytics } from "@/components/journal/article-analytics";
import { mdxComponents } from "@/components/journal/mdx-components";
import type { ArticleCard as ArticleCardType } from "@/lib/journal-types";
import { RevealText } from "@/components/editorial/reveal-text";

// ISR: Revalidate every 5 minutes for articles
export const revalidate = 300;

interface ArticlePageProps {
  params: Promise<{ slug: string }>;
}

// Page-specific article type with only fields we use
interface PageArticle {
  id: string;
  slug: string;
  title: string;
  subtitle: string | null;
  excerpt: string | null;
  content: string | null;
  featured_image_url: string | null;
  featured_image_alt: string | null;
  content_type: string;
  status: string;
  meta_title: string | null;
  meta_description: string | null;
  published_at: string | null;
  reading_time: number | null;
  author_id: string;
  author_name: string;
  author_slug: string;
  author_role: string | null;
  author_bio: string | null;
  author_avatar: string | null;
  author_twitter: string | null;
  author_linkedin: string | null;
  pillar_id: string;
  pillar_name: string;
  pillar_slug: string;
  pillar_color: string;
  related_articles: ArticleCardType[];
}

async function getArticle(slug: string): Promise<PageArticle | null> {
  const supabase = createServerClient();

  const { data: article, error } = await supabase
    .from("journal_articles")
    .select(
      `
      *,
      author:journal_authors!journal_articles_author_id_fkey(
        id,
        name,
        slug,
        role,
        bio,
        avatar_url,
        twitter,
        linkedin
      ),
      pillar:journal_pillars!journal_articles_pillar_id_fkey(
        id,
        name,
        slug,
        color
      )
    `
    )
    .eq("slug", slug)
    .eq("status", "published")
    .single();

  if (error || !article) {
    return null;
  }

  // Get related articles — intelligent recommendations
  // 1. Same pillar first (most relevant), then fill with other articles
  // 2. Ordered by recency
  // 3. Never show the current article
  const { data: samePillar } = await supabase
    .from("journal_published_articles")
    .select("*")
    .eq("pillar_slug", article.pillar.slug)
    .neq("slug", slug)
    .order("published_at", { ascending: false })
    .limit(3);

  const samePillarIds = (samePillar || []).map((a) => a.id);
  const needMore = 3 - (samePillar || []).length;

  let otherArticles: typeof samePillar = [];
  if (needMore > 0) {
    const excludeIds = [article.id, ...samePillarIds];
    const { data: others } = await supabase
      .from("journal_published_articles")
      .select("*")
      .not("id", "in", `(${excludeIds.join(",")})`)
      .order("published_at", { ascending: false })
      .limit(needMore);
    otherArticles = others || [];
  }

  const related = [...(samePillar || []), ...otherArticles];

  return {
    id: article.id,
    slug: article.slug,
    title: article.title,
    subtitle: article.subtitle,
    excerpt: article.excerpt,
    content: article.content,
    featured_image_url: article.featured_image_url,
    featured_image_alt: article.featured_image_alt,
    content_type: article.content_type,
    status: article.status,
    meta_title: article.meta_title,
    meta_description: article.meta_description,
    published_at: article.published_at,
    reading_time: article.reading_time,
    author_id: article.author_id,
    author_name: article.author.name,
    author_slug: article.author.slug,
    author_role: article.author.role,
    author_bio: article.author.bio,
    author_avatar: article.author.avatar_url,
    author_twitter: article.author.twitter,
    author_linkedin: article.author.linkedin,
    pillar_id: article.pillar_id,
    pillar_name: article.pillar.name,
    pillar_slug: article.pillar.slug,
    pillar_color: article.pillar.color,
    related_articles: (related || []).map((r) => ({
      id: r.id,
      slug: r.slug,
      title: r.title,
      excerpt: r.excerpt,
      featured_image_url: r.featured_image_url,
      content_type: r.content_type,
      pillar_name: r.pillar_name,
      pillar_slug: r.pillar_slug,
      pillar_color: r.pillar_color,
      author_name: r.author_name,
      author_slug: r.author_slug,
      author_avatar: r.author_avatar,
      published_at: r.published_at,
      reading_time: r.reading_time,
    })),
  };
}

export async function generateMetadata({
  params,
}: ArticlePageProps): Promise<Metadata> {
  const { slug } = await params;
  const article = await getArticle(slug);

  if (!article) {
    return {
      title: "Article Not Found | Craefto",
    };
  }

  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://www.craefto.com";
  // The share image is the route's opengraph-image.tsx card.

  return {
    title: { absolute: article.meta_title ? `${article.meta_title} | Craefto` : `${article.title} | Craefto Journal` },
    description: article.meta_description || article.excerpt,
    alternates: { canonical: `/journal/${slug}` },
    openGraph: {
      title: article.title,
      description: article.excerpt || undefined,
      type: "article",
      publishedTime: article.published_at || undefined,
      authors: [article.author_name],
      url: `${baseUrl}/journal/${slug}`,
      siteName: "Craefto",
    },
    twitter: {
      card: "summary_large_image",
      title: article.title,
      description: article.excerpt || undefined,
    },
  };
}

export default async function ArticlePage({ params }: ArticlePageProps) {
  const { slug } = await params;
  const article = await getArticle(slug);

  if (!article) {
    notFound();
  }

  return (
    <main className="min-h-screen bg-background">
        {/* Article Container */}
        <article className="pt-20 md:pt-24 pb-20 md:pb-24">
          <div className="max-w-7xl mx-auto px-5 md:px-6 lg:px-8">
            <div className="grid xl:grid-cols-[1fr_300px] gap-12 xl:gap-16">
              {/* Main Content */}
              <div className="max-w-[680px] mx-auto xl:mx-0">
                <ArticleHeader article={article} />

                {/* Article Body - Editorial prose styling */}
                <div className="mt-14 md:mt-20 article-content">
                  <MDXRemote
                    source={article.content || ""}
                    components={mdxComponents}
                    options={{
                      mdxOptions: {
                        remarkPlugins: [remarkGfm],
                        rehypePlugins: [
                          rehypeSlug,
                          [
                            rehypeAutolinkHeadings,
                            {
                              behavior: "wrap",
                              properties: {
                                className: ["anchor"],
                              },
                            },
                          ],
                        ],
                      },
                    }}
                  />
                </div>

                {/* Article Footer Divider */}
                <div className="mt-20 mb-16">
                  <div className="flex items-center justify-center gap-4">
                    <div className="h-px w-16 bg-border" />
                    <span className="text-foreground-subtle text-xs font-mono tracking-[0.08em] uppercase font-medium">End</span>
                    <div className="h-px w-16 bg-border" />
                  </div>
                </div>

                {/* Author Card */}
                <AuthorCard
                  name={article.author_name}
                  slug={article.author_slug}
                  role={article.author_role}
                  bio={article.author_bio}
                  avatar={article.author_avatar}
                  twitter={article.author_twitter}
                  linkedin={article.author_linkedin}
                />
              </div>

              {/* Sidebar - Table of Contents */}
              <aside className="hidden xl:block">
                <div className="sticky top-28">
                  <TableOfContents content={article.content || ""} />
                </div>
              </aside>
            </div>
          </div>
        </article>

        {/* Related Articles */}
        {article.related_articles && article.related_articles.length > 0 && (
          <section className="px-6 lg:px-8 py-20 md:py-28 bg-background-subtle">
            <div className="max-w-7xl mx-auto">
              <div className="flex items-center gap-4 mb-12">
                <div className="h-px flex-1 bg-border" />
                <h2 className="font-heading text-xl md:text-2xl font-semibold text-foreground"><RevealText text={"Continue Reading"} /></h2>
                <div className="h-px flex-1 bg-border" />
              </div>
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
                {article.related_articles.map((related) => (
                  <ArticleCard key={related.id} article={related} />
                ))}
              </div>
            </div>
          </section>
        )}

        {/* JSON-LD Schema */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "Article",
              headline: article.title,
              description: article.excerpt,
              image: article.featured_image_url,
              datePublished: article.published_at,
              author: {
                "@type": "Person",
                name: article.author_name,
                url: `https://www.craefto.com/journal/author/${article.author_slug}`,
              },
              publisher: {
                "@type": "Organization",
                name: "Craefto",
                logo: {
                  "@type": "ImageObject",
                  url: "https://www.craefto.com/logo.png",
                },
              },
              mainEntityOfPage: {
                "@type": "WebPage",
                "@id": `https://www.craefto.com/journal/${article.slug}`,
              },
            }),
          }}
        />

        {/* Analytics Tracking */}
        <ArticleAnalytics articleId={article.id} slug={article.slug} />
      </main>
  );
}
