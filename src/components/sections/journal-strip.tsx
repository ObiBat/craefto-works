import Link from "next/link";
import { createServerClient } from "@/lib/supabase";
import { Container } from "@/components/layout/container";
import { Section } from "@/components/layout/section";
import { SectionLabel } from "@/components/ui/section-label";
import { AnimatedSection, StaggeredGrid, StaggeredItem } from "@/components/ui/motion";
import { ArticleCard } from "@/components/journal/article-card";
import { RevealText } from "@/components/editorial/reveal-text";
import type { ArticleCard as ArticleCardType } from "@/lib/journal-types";

const CARD_FIELDS =
  "id, slug, title, excerpt, featured_image_url, content_type, pillar_name, pillar_slug, pillar_color, author_name, author_slug, author_avatar, published_at, reading_time";

/** The newest published articles, or none if the journal can't be reached. */
async function getLatestArticles(limit: number): Promise<ArticleCardType[]> {
  try {
    const { data, error } = await createServerClient()
      .from("journal_published_articles")
      .select(CARD_FIELDS)
      .order("published_at", { ascending: false })
      .limit(limit);
    if (error) {
      console.error("Error fetching latest articles:", error);
      return [];
    }
    return (data ?? []) as ArticleCardType[];
  } catch (error) {
    console.error("Error fetching latest articles:", error);
    return [];
  }
}

/**
 * Home page: the three newest journal articles. Server-rendered with the
 * page (which revalidates), so it adds no client JavaScript; if the journal
 * is unavailable the section is simply left out.
 */
export async function JournalStrip() {
  const articles = await getLatestArticles(3);
  if (articles.length === 0) return null;

  return (
    <Section spacing="lg">
      <Container>
        <div className="flex flex-col gap-14">
          <AnimatedSection>
            <div className="flex flex-col gap-4">
              <SectionLabel number="03" label="Journal" />
              <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
                <div>
                  <h2 className="font-semibold tracking-tight"><RevealText text={"From the journal"} /></h2>
                  <p data-ink className="text-lg text-[hsl(var(--color-foreground-muted))] max-w-xl leading-relaxed mt-3">
                    Notes on systems, applied AI and product craft.
                  </p>
                </div>
                <Link
                  href="/journal"
                  className="text-sm text-[hsl(var(--color-foreground-muted))] hover:text-[hsl(var(--color-foreground))] transition-colors group flex items-center gap-2 shrink-0"
                >
                  All articles
                  <svg
                    className="w-4 h-4 transition-transform group-hover:translate-x-1"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                    aria-hidden="true"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                  </svg>
                </Link>
              </div>
            </div>
          </AnimatedSection>

          <StaggeredGrid className="grid gap-12 md:grid-cols-3 md:gap-8 lg:gap-10">
            {articles.map((article, i) => (
              // Two on phones, three from tablet up.
              <StaggeredItem key={article.id} className={i === 2 ? "hidden md:block" : undefined}>
                <ArticleCard article={article} />
              </StaggeredItem>
            ))}
          </StaggeredGrid>
        </div>
      </Container>
    </Section>
  );
}
