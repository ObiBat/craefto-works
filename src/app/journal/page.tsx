import { Suspense } from "react";
import { StickyBar } from "@/components/editorial/sticky-bar";
import type { Metadata } from "next";
import { pageMetadata } from "@/lib/seo";
import Link from "next/link";
import { createServerClient } from "@/lib/supabase";
import { Header, Footer, Section, Container } from "@/components/layout";
import { HeroText, AnimatedSection, Separator } from "@/components/ui";
import { ArticleCard } from "@/components/journal/article-card";
import { JournalSearchInline } from "@/components/journal/search-inline";
import { SubscriptionForm } from "@/components/journal/subscription-form";
import type { ArticleCard as ArticleCardType, Pillar } from "@/lib/journal-types";
import { RevealText } from "@/components/editorial/reveal-text";

// ISR: Revalidate every 60 seconds
export const revalidate = 60;

export const metadata: Metadata = {
  ...pageMetadata({
    title: "Journal",
    description:
      "Insights on systems thinking, applied AI, product craft and creative technology from the Craefto team.",
    path: "/journal",
  }),
  alternates: {
    canonical: "/journal",
    types: {
      "application/rss+xml": "/journal/feed",
      "application/atom+xml": "/journal/atom",
    },
  },
};

async function getArticles(pillarSlug?: string): Promise<ArticleCardType[]> {
  const supabase = createServerClient();

  let query = supabase
    .from("journal_published_articles")
    .select("*")
    .order("published_at", { ascending: false });

  if (pillarSlug) {
    query = query.eq("pillar_slug", pillarSlug);
  }

  const { data, error } = await query;

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

async function getPillars(): Promise<Pillar[]> {
  const supabase = createServerClient();

  // Only fetch the 5 main pillars
  const allowedSlugs = ['engineering', 'design', 'product', 'ai-automation', 'craefto-practice'];

  const { data, error } = await supabase
    .from("journal_pillars")
    .select("*")
    .in("slug", allowedSlugs)
    .order("sort_order");

  if (error) {
    console.error("Error fetching pillars:", error);
    return [];
  }

  return data || [];
}

interface JournalPageProps {
  searchParams: Promise<{ pillar?: string }>;
}

export default async function JournalPage({ searchParams }: JournalPageProps) {
  const params = await searchParams;
  const activePillar = params.pillar;

  const [articles, pillars] = await Promise.all([
    getArticles(activePillar),
    getPillars(),
  ]);

  const featuredArticle = articles[0];
  const remainingArticles = articles.slice(1);

  return (
    <>
      <Header />
      <main id="main-content" className="min-h-screen bg-[hsl(var(--color-background))] pt-20">
        {/* Hero */}
        <Section spacing="sm">
          <Container>
            <div className="max-w-3xl">
              {/* Breadcrumb */}
              <nav className="mb-8" aria-label="Breadcrumb">
                <ol className="flex items-center gap-2 text-sm text-[hsl(var(--color-foreground-muted))]">
                  <li>
                    <Link href="/" className="hover:text-[hsl(var(--color-foreground))] transition-colors">
                      Home
                    </Link>
                  </li>
                  <li>
                    <span className="mx-2">/</span>
                  </li>
                  <li className="text-[hsl(var(--color-foreground))] font-medium">Journal</li>
                </ol>
              </nav>

              <h1 className="font-semibold tracking-tight mb-6"><RevealText text={"Journal"} mode="load" /></h1>
              <HeroText delay={0.1}>
                <p className="text-xl text-[hsl(var(--color-foreground-muted))] leading-relaxed max-w-xl">
                  Insights on systems thinking, applied AI, product craft, and creative
                  technology from the Craefto team.
                </p>
              </HeroText>
            </div>
          </Container>
        </Section>

        {/* Pillar Filters - Sticky */}
        <StickyBar top={64} className="sticky top-16 z-30 bg-[hsl(var(--color-background))]/95 backdrop-blur-md">
          <Container>
            <div className="flex items-center justify-between gap-3 py-2 sm:py-3">
              <nav className="flex items-center gap-1.5 sm:gap-2 overflow-x-auto scrollbar-hide -mx-1 px-1" aria-label="Content pillars">
                <PillarTab href="/journal" active={!activePillar}>
                  All
                </PillarTab>
                {pillars.map((pillar) => (
                  <PillarTab
                    key={pillar.id}
                    href={`/journal?pillar=${pillar.slug}`}
                    active={activePillar === pillar.slug}
                    color={pillar.color}
                  >
                    {pillar.name}
                  </PillarTab>
                ))}
              </nav>
              <div className="hidden sm:block">
                <JournalSearchInline />
              </div>
            </div>
          </Container>
        </StickyBar>

        {/* Articles */}
        <Section spacing="md">
          <Container>
            {articles.length === 0 ? (
              <AnimatedSection variant="fadeUp">
                <div className="text-center py-24">
                  <div className="w-16 h-16 mx-auto mb-6 rounded-full bg-[hsl(var(--color-background-muted))] flex items-center justify-center">
                    <svg className="w-8 h-8 text-[hsl(var(--color-foreground-muted))]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z" />
                    </svg>
                  </div>
                  <p className="text-[hsl(var(--color-foreground-muted))] text-lg mb-2">
                    No articles published yet.
                  </p>
                  <p className="text-[hsl(var(--color-foreground-subtle))] text-sm">
                    Check back soon for new content.
                  </p>
                </div>
              </AnimatedSection>
            ) : (
              <div className="space-y-20">
                {/* Featured Article */}
                {featuredArticle && (
                  <AnimatedSection>
                    <Suspense fallback={<ArticleCardSkeleton featured />}>
                      <ArticleCard article={featuredArticle} featured />
                    </Suspense>
                  </AnimatedSection>
                )}

                {/* Divider */}
                {remainingArticles.length > 0 && (
                  <Separator />
                )}

                {/* Article Grid */}
                {remainingArticles.length > 0 && (
                  <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-x-8 gap-y-12">
                    {remainingArticles.map((article, index) => (
                      <AnimatedSection key={article.id} delay={index * 0.05}>
                        <Suspense fallback={<ArticleCardSkeleton />}>
                          <ArticleCard article={article} />
                        </Suspense>
                      </AnimatedSection>
                    ))}
                  </div>
                )}
              </div>
            )}
          </Container>
        </Section>

        {/* Newsletter CTA */}
        <Section spacing="lg">
          <Container>
            <AnimatedSection variant="scaleIn">
              <div className="max-w-2xl mx-auto text-center">
                <div className="w-14 h-14 mx-auto mb-6 rounded-full bg-[hsl(var(--color-accent))]/10 flex items-center justify-center">
                  <svg className="w-7 h-7 text-[hsl(var(--color-accent))]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                </div>
                <h2 className="font-semibold tracking-tight text-[hsl(var(--color-foreground))] mb-4"><RevealText text={"Stay in the loop"} /></h2>
                <p data-ink className="text-[hsl(var(--color-foreground-muted))] mb-10 max-w-md mx-auto">
                  Get our latest insights on AI, product strategy, and creative
                  technology delivered to your inbox.
                </p>
                <Suspense fallback={<SubscriptionFormSkeleton />}>
                  <SubscriptionForm />
                </Suspense>
              </div>
            </AnimatedSection>
          </Container>
        </Section>
      </main>
      <Footer />
    </>
  );
}

function PillarTab({
  href,
  active,
  color,
  children,
}: {
  href: string;
  active: boolean;
  color?: string;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 sm:px-3 sm:py-1.5 rounded-full text-xs sm:text-sm font-medium transition-all duration-200 whitespace-nowrap shrink-0 ${active
        ? "bg-foreground text-background shadow-sm"
        : "bg-background text-foreground-muted hover:text-foreground hover:bg-background-subtle border border-border-subtle"
        }`}
    >
      {color && (
        <span
          className={`w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full transition-transform ${active ? "scale-0" : "scale-100"}`}
          style={{ backgroundColor: color }}
        />
      )}
      {children}
    </Link>
  );
}

function SubscriptionFormSkeleton() {
  return (
    <div className="flex flex-col sm:flex-row gap-3 max-w-md mx-auto animate-pulse">
      <div className="flex-1 h-[52px] rounded-xl bg-[hsl(var(--color-background))]" />
      <div className="w-32 h-[52px] rounded-xl bg-[hsl(var(--color-accent))]/50" />
    </div>
  );
}

function ArticleCardSkeleton({ featured = false }: { featured?: boolean }) {
  if (featured) {
    return (
      <div className="grid md:grid-cols-2 gap-8 items-center animate-pulse">
        <div className="aspect-[16/10] rounded-xl bg-background-subtle" />
        <div className="space-y-4">
          <div className="h-4 w-24 bg-background-subtle rounded" />
          <div className="h-10 w-full bg-background-subtle rounded" />
          <div className="h-20 w-full bg-background-subtle rounded" />
          <div className="h-4 w-48 bg-background-subtle rounded" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4 animate-pulse">
      <div className="aspect-[16/10] rounded-xl bg-background-subtle" />
      <div className="h-4 w-24 bg-background-subtle rounded" />
      <div className="h-6 w-full bg-background-subtle rounded" />
      <div className="h-12 w-full bg-background-subtle rounded" />
      <div className="h-4 w-32 bg-background-subtle rounded" />
    </div>
  );
}
