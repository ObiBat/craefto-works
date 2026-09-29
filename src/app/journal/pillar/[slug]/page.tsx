import { notFound } from "next/navigation";
import { Metadata } from "next";
import { JOURNAL_OG_IMAGE } from "@/lib/seo";
import Link from "next/link";
import { createServerClient } from "@/lib/supabase";
import { ArticleCard } from "@/components/journal/article-card";
import type { ArticleCard as ArticleCardType } from "@/lib/journal-types";
import { RevealText } from "@/components/editorial/reveal-text";

// ISR: Revalidate every 5 minutes
export const revalidate = 300;

interface PillarPageProps {
  params: Promise<{ slug: string }>;
}

interface Pillar {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  color: string;
  strategic_intent: string | null;
}

async function getPillar(slug: string): Promise<Pillar | null> {
  const supabase = createServerClient();

  const { data, error } = await supabase
    .from("journal_pillars")
    .select("*")
    .eq("slug", slug)
    .single();

  if (error || !data) {
    return null;
  }

  return data;
}

async function getArticlesByPillar(pillarSlug: string): Promise<ArticleCardType[]> {
  const supabase = createServerClient();

  const { data, error } = await supabase
    .from("journal_published_articles")
    .select("*")
    .eq("pillar_slug", pillarSlug)
    .order("published_at", { ascending: false });

  if (error) {
    console.error("Error fetching articles:", error);
    return [];
  }

  return (data || []).map((article) => ({
    id: article.id,
    slug: article.slug,
    title: article.title,
    excerpt: article.excerpt,
    featured_image_url: article.featured_image_url,
    content_type: article.content_type,
    pillar_name: article.pillar_name,
    pillar_slug: article.pillar_slug,
    pillar_color: article.pillar_color,
    author_name: article.author_name,
    author_slug: article.author_slug,
    author_avatar: article.author_avatar,
    published_at: article.published_at,
    reading_time: article.reading_time,
  }));
}

export async function generateMetadata({ params }: PillarPageProps): Promise<Metadata> {
  const { slug } = await params;
  const pillar = await getPillar(slug);

  if (!pillar) {
    return {
      title: "Pillar Not Found | Craefto Journal",
    };
  }

  return {
    title: { absolute: `${pillar.name} | Craefto Journal` },
    description: pillar.description || `Articles about ${pillar.name} from Craefto.`,
    alternates: {
      canonical: `https://www.craefto.com/journal/pillar/${pillar.slug}`,
    },
    openGraph: {
      title: `${pillar.name} | Craefto Journal`,
      description: pillar.description || `Articles about ${pillar.name} from Craefto.`,
      url: `https://www.craefto.com/journal/pillar/${pillar.slug}`,
      type: "website",
      images: [JOURNAL_OG_IMAGE],
    },
  };
}

export default async function PillarPage({ params }: PillarPageProps) {
  const { slug } = await params;
  const pillar = await getPillar(slug);

  if (!pillar) {
    notFound();
  }

  const articles = await getArticlesByPillar(slug);

  return (
    <main className="min-h-screen bg-background">
      {/* Breadcrumb */}
      <nav className="pt-28 px-6" aria-label="Breadcrumb">
        <div className="max-w-7xl mx-auto">
          <ol className="flex items-center gap-2 text-sm text-foreground-muted">
            <li>
              <Link href="/journal" className="hover:text-foreground transition-colors">
                Journal
              </Link>
            </li>
            <li>
              <span className="mx-2">/</span>
            </li>
            <li className="text-foreground font-medium">{pillar.name}</li>
          </ol>
        </div>
      </nav>

      {/* Header */}
      <section className="pt-8 pb-16 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center gap-3 mb-6">
            <span
              className="w-3 h-3 rounded-full"
              style={{ backgroundColor: pillar.color }}
            />
            <span className="text-sm font-medium uppercase font-mono tracking-[0.06em]" style={{ color: pillar.color }}>
              Content Pillar
            </span>
          </div>
          <h1 className="font-heading text-5xl md:text-6xl lg:text-7xl font-semibold tracking-tight text-foreground mb-6">
            <RevealText text={pillar.name} mode="load" />
          </h1>
          {pillar.description && (
            <p className="text-xl text-foreground-muted max-w-2xl leading-relaxed">
              {pillar.description}
            </p>
          )}
        </div>
      </section>

      {/* Articles */}
      <section className="px-6 pb-24">
        <div className="max-w-7xl mx-auto">
          {articles.length === 0 ? (
            <div className="text-center py-24">
              <p className="text-foreground-muted text-lg">
                No articles in this pillar yet. Check back soon.
              </p>
            </div>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
              {articles.map((article) => (
                <ArticleCard key={article.id} article={article} />
              ))}
            </div>
          )}
        </div>
      </section>

      {/* JSON-LD Schema */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "CollectionPage",
            name: pillar.name,
            description: pillar.description,
            url: `https://www.craefto.com/journal/pillar/${pillar.slug}`,
            isPartOf: {
              "@type": "Blog",
              name: "Craefto Journal",
              url: "https://www.craefto.com/journal",
            },
            breadcrumb: {
              "@type": "BreadcrumbList",
              itemListElement: [
                {
                  "@type": "ListItem",
                  position: 1,
                  name: "Journal",
                  item: "https://www.craefto.com/journal",
                },
                {
                  "@type": "ListItem",
                  position: 2,
                  name: pillar.name,
                  item: `https://www.craefto.com/journal/pillar/${pillar.slug}`,
                },
              ],
            },
          }),
        }}
      />
    </main>
  );
}
