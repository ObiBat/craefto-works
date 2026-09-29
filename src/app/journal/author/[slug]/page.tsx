import { notFound } from "next/navigation";
import { Metadata } from "next";
import { JOURNAL_OG_IMAGE } from "@/lib/seo";
import Link from "next/link";
import Image from "next/image";
import { createServerClient } from "@/lib/supabase";
import { ArticleCard } from "@/components/journal/article-card";
import type { ArticleCard as ArticleCardType } from "@/lib/journal-types";
import { RevealText } from "@/components/editorial/reveal-text";

// ISR: Revalidate every 5 minutes
export const revalidate = 300;

interface AuthorPageProps {
  params: Promise<{ slug: string }>;
}

interface Author {
  id: string;
  name: string;
  slug: string;
  role: string | null;
  bio: string | null;
  avatar_url: string | null;
  twitter: string | null;
  linkedin: string | null;
  expertise: string[];
}

async function getAuthor(slug: string): Promise<Author | null> {
  const supabase = createServerClient();

  const { data, error } = await supabase
    .from("journal_authors")
    .select("*")
    .eq("slug", slug)
    .single();

  if (error || !data) {
    return null;
  }

  return data;
}

async function getArticlesByAuthor(authorId: string): Promise<ArticleCardType[]> {
  const supabase = createServerClient();

  const { data, error } = await supabase
    .from("journal_published_articles")
    .select("*")
    .eq("author_id", authorId)
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

export async function generateMetadata({ params }: AuthorPageProps): Promise<Metadata> {
  const { slug } = await params;
  const author = await getAuthor(slug);

  if (!author) {
    return {
      title: "Author Not Found | Craefto Journal",
    };
  }

  return {
    title: { absolute: `${author.name} | Craefto Journal` },
    description: author.bio || `Articles by ${author.name} on Craefto Journal.`,
    alternates: {
      canonical: `https://www.craefto.com/journal/author/${author.slug}`,
    },
    openGraph: {
      title: `${author.name} | Craefto Journal`,
      description: author.bio || `Articles by ${author.name} on Craefto Journal.`,
      url: `https://www.craefto.com/journal/author/${author.slug}`,
      type: "profile",
      images: [JOURNAL_OG_IMAGE],
    },
  };
}

export default async function AuthorPage({ params }: AuthorPageProps) {
  const { slug } = await params;
  const author = await getAuthor(slug);

  if (!author) {
    notFound();
  }

  const articles = await getArticlesByAuthor(author.id);

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
            <li className="text-foreground font-medium">{author.name}</li>
          </ol>
        </div>
      </nav>

      {/* Author Header */}
      <section className="pt-8 pb-16 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row items-start gap-8">
            {/* Avatar */}
            {author.avatar_url ? (
              <Image
                src={author.avatar_url}
                alt={author.name}
                width={120}
                height={120}
                className="rounded-full"
              />
            ) : (
              <div className="w-[120px] h-[120px] rounded-full bg-accent/20 flex items-center justify-center text-accent text-4xl font-semibold">
                {author.name.charAt(0)}
              </div>
            )}

            {/* Info */}
            <div className="flex-1">
              <h1 className="font-heading text-4xl md:text-5xl font-semibold tracking-tight text-foreground mb-2">
                <RevealText text={author.name} mode="load" />
              </h1>
              {author.role && (
                <p className="text-lg text-foreground-muted mb-4">{author.role}</p>
              )}
              {author.bio && (
                <p className="text-foreground-muted leading-relaxed max-w-2xl mb-6">
                  {author.bio}
                </p>
              )}

              {/* Expertise */}
              {author.expertise && author.expertise.length > 0 && (
                <div className="flex flex-wrap gap-2 mb-6">
                  {author.expertise.map((skill) => (
                    <span
                      key={skill}
                      className="px-3 py-1 rounded-full bg-background-subtle text-foreground-muted text-sm"
                    >
                      {skill}
                    </span>
                  ))}
                </div>
              )}

              {/* Social Links */}
              {(author.twitter || author.linkedin) && (
                <div className="flex items-center gap-4">
                  {author.twitter && (
                    <a
                      href={author.twitter.startsWith("http") ? author.twitter : `https://twitter.com/${author.twitter}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-foreground-muted hover:text-foreground transition-colors"
                      aria-label={`${author.name} on X`}
                    >
                      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                      </svg>
                    </a>
                  )}
                  {author.linkedin && (
                    <a
                      href={author.linkedin.startsWith("http") ? author.linkedin : `https://linkedin.com/in/${author.linkedin}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-foreground-muted hover:text-foreground transition-colors"
                      aria-label={`${author.name} on LinkedIn`}
                    >
                      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
                      </svg>
                    </a>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Articles */}
      <section className="px-6 pb-24">
        <div className="max-w-7xl mx-auto">
          <h2 className="font-heading text-2xl font-semibold text-foreground mb-8">
            Articles by {author.name}
          </h2>
          {articles.length === 0 ? (
            <div className="text-center py-16">
              <p className="text-foreground-muted text-lg">
                No articles published yet.
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
            "@type": "Person",
            name: author.name,
            jobTitle: author.role,
            description: author.bio,
            url: `https://www.craefto.com/journal/author/${author.slug}`,
            image: author.avatar_url,
            sameAs: [
              author.twitter?.startsWith("http") ? author.twitter : author.twitter ? `https://twitter.com/${author.twitter}` : null,
              author.linkedin?.startsWith("http") ? author.linkedin : author.linkedin ? `https://linkedin.com/in/${author.linkedin}` : null,
            ].filter(Boolean),
            worksFor: {
              "@type": "Organization",
              name: "Craefto",
              url: "https://www.craefto.com",
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
                  name: author.name,
                  item: `https://www.craefto.com/journal/author/${author.slug}`,
                },
              ],
            },
          }),
        }}
      />
    </main>
  );
}
