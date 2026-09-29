import { createServerClient } from "@/lib/supabase";
import { ogCard } from "@/lib/og/card";

export const alt = "Craefto Journal article";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

// Cards are cached like the article pages: rebuilt at most every 5 minutes.
export const revalidate = 300;

type ArticleCardRow = {
  title: string;
  excerpt: string | null;
  pillar_name: string | null;
  reading_time: number | null;
  featured_image_url: string | null;
};

export default async function Image({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  let article: ArticleCardRow | null = null;
  try {
    const { data } = await createServerClient()
      .from("journal_published_articles")
      .select("title, excerpt, pillar_name, reading_time, featured_image_url")
      .eq("slug", slug)
      .single();
    article = data as ArticleCardRow | null;
  } catch {
    article = null;
  }

  if (!article) {
    return ogCard({ eyebrow: "Journal", title: "The Craefto Journal" });
  }

  return ogCard({
    eyebrow: article.pillar_name ? `Journal · ${article.pillar_name}` : "Journal",
    title: article.title,
    description: article.excerpt,
    image: article.featured_image_url,
    meta: article.reading_time ? `${article.reading_time} min read` : null,
  });
}
