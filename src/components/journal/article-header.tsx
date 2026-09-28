import Link from "next/link";
import Image from "next/image";
import { RevealText } from "@/components/editorial/reveal-text";

interface ArticleHeaderProps {
  article: {
    title: string;
    subtitle?: string | null;
    pillar_name: string;
    pillar_slug: string;
    pillar_color: string;
    author_name: string;
    author_slug: string;
    author_avatar?: string | null;
    author_role?: string | null;
    published_at?: string | null;
    reading_time?: number | null;
    featured_image_url?: string | null;
    featured_image_alt?: string | null;
  };
}

function formatDate(dateString: string) {
  return new Date(dateString).toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}

export function ArticleHeader({ article }: ArticleHeaderProps) {
  return (
    <header className="mb-16">
      {/* Back Button */}
      <nav className="mb-8" aria-label="Back to journal">
        <Link
          href="/journal"
          className="group inline-flex items-center gap-2 text-sm font-medium text-foreground-muted hover:text-foreground transition-colors"
        >
          <svg
            className="w-4 h-4 transition-transform group-hover:-translate-x-1"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          <span>Back to Journal</span>
        </Link>
      </nav>

      {/* Pillar Tag */}
      <div className="mb-8">
        <Link
          href={`/journal/pillar/${article.pillar_slug}`}
          className="inline-flex items-center gap-2.5 text-sm font-medium transition-all hover:opacity-80 hover:gap-3"
          style={{ color: article.pillar_color }}
        >
          <span
            className="w-2.5 h-2.5 rounded-full ring-2 ring-current/20"
            style={{ backgroundColor: article.pillar_color }}
          />
          {article.pillar_name}
        </Link>
      </div>

      {/* Title */}
      <h1 className="font-heading text-[2.25rem] md:text-[3rem] lg:text-[3.5rem] font-semibold leading-[1.08] tracking-[-0.025em] text-foreground mb-6">
        <RevealText text={article.title} mode="load" />
      </h1>

      {/* Subtitle */}
      {article.subtitle && (
        <p className="text-lg md:text-xl lg:text-[1.375rem] text-foreground-muted leading-[1.5] mb-8 md:mb-10 max-w-[40ch]">
          {article.subtitle}
        </p>
      )}

      {/* Meta - Refined layout */}
      <div className="flex flex-wrap items-center gap-x-6 gap-y-4 pb-10 border-b border-border">
        {/* Author */}
        <Link
          href={`/journal/author/${article.author_slug}`}
          className="flex items-center gap-4 hover:text-foreground transition-colors group"
        >
          {article.author_avatar ? (
            <Image
              src={article.author_avatar}
              alt={article.author_name}
              width={48}
              height={48}
              className="rounded-full ring-2 ring-background shadow-md"
            />
          ) : (
            <div className="w-12 h-12 rounded-full bg-accent/15 flex items-center justify-center text-accent font-semibold text-lg ring-2 ring-background shadow-md">
              {article.author_name.charAt(0)}
            </div>
          )}
          <div className="flex flex-col">
            <span className="font-medium text-foreground group-hover:text-accent transition-colors">
              {article.author_name}
            </span>
            {article.author_role && (
              <span className="text-sm text-foreground-muted">{article.author_role}</span>
            )}
          </div>
        </Link>

        {/* Date & Reading Time */}
        <div className="flex items-center gap-4 text-sm text-foreground-muted">
          {article.published_at && (
            <time dateTime={article.published_at} className="flex items-center gap-2">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              {formatDate(article.published_at)}
            </time>
          )}
          {article.reading_time && (
            <span className="flex items-center gap-2">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              {article.reading_time} min read
            </span>
          )}
        </div>
      </div>

      {/* Featured Image */}
      {article.featured_image_url && (
        <figure className="mt-12 md:mt-16 max-w-2xl mx-auto">
          <div className="overflow-hidden rounded-xl shadow-sm bg-background-muted">
            <Image
              src={article.featured_image_url}
              alt={article.featured_image_alt || article.title}
              width={680}
              height={0}
              sizes="(max-width: 768px) 100vw, 680px"
              className="w-full h-auto"
              preload
            />
          </div>
          {article.featured_image_alt && (
            <figcaption className="mt-4 text-center text-sm text-foreground-muted">
              {article.featured_image_alt}
            </figcaption>
          )}
        </figure>
      )}
    </header>
  );
}
