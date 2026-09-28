import Link from "next/link";
import Image from "next/image";
import { contentTypeLabels, type ArticleCard as ArticleCardType } from "@/lib/journal-types";

interface ArticleCardProps {
  article: ArticleCardType;
  featured?: boolean;
}

function formatDate(dateString: string) {
  return new Date(dateString).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export function ArticleCard({ article, featured = false }: ArticleCardProps) {
  if (featured) {
    return (
      <article className="group">
        <Link href={`/journal/${article.slug}`} className="block">
          <div className="grid md:grid-cols-2 gap-10 lg:gap-14 items-center">
            {/* Image */}
            {article.featured_image_url && (
              <div className="aspect-[16/10] relative overflow-hidden rounded-2xl bg-background-subtle shadow-lg">
                <Image
                  src={article.featured_image_url}
                  alt={article.title}
                  fill
                  preload
                  sizes="(max-width: 768px) 100vw, (max-width: 1400px) 50vw, 700px"
                  className="object-cover transition-all duration-700 group-hover:scale-105"
                />
                {/* Overlay gradient on hover */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
              </div>
            )}

            {/* Content */}
            <div className="space-y-5">
              {/* Meta */}
              <div className="flex items-center gap-3 text-sm">
                <span
                  className="inline-flex items-center gap-2 font-medium px-3 py-1 rounded-full bg-background-subtle"
                  style={{ color: article.pillar_color }}
                >
                  <span
                    className="w-2 h-2 rounded-full"
                    style={{ backgroundColor: article.pillar_color }}
                  />
                  {article.pillar_name}
                </span>
                <span className="text-foreground-muted text-xs uppercase font-mono tracking-[0.06em]">
                  {contentTypeLabels[article.content_type]}
                </span>
              </div>

              {/* Title */}
              <h2 className="font-heading text-3xl md:text-4xl lg:text-[2.5rem] font-semibold leading-[1.15] text-foreground group-hover:text-accent transition-colors duration-300">
                {article.title}
              </h2>

              {/* Excerpt */}
              {article.excerpt && (
                <p className="text-foreground-muted text-lg leading-relaxed line-clamp-3 max-w-[45ch]">
                  {article.excerpt}
                </p>
              )}

              {/* Footer */}
              <div className="flex items-center gap-4 text-sm text-foreground-muted pt-3">
                {article.author_avatar ? (
                  <Image
                    src={article.author_avatar}
                    alt={article.author_name}
                    width={32}
                    height={32}
                    className="rounded-full ring-2 ring-background"
                  />
                ) : (
                  <div className="w-8 h-8 rounded-full bg-accent/15 flex items-center justify-center text-accent text-sm font-semibold ring-2 ring-background">
                    {article.author_name.charAt(0)}
                  </div>
                )}
                <span className="font-medium text-foreground">{article.author_name}</span>
                {article.published_at && (
                  <>
                    <span className="text-foreground-subtle">·</span>
                    <time>{formatDate(article.published_at)}</time>
                  </>
                )}
                {article.reading_time && (
                  <>
                    <span className="text-foreground-subtle">·</span>
                    <span>{article.reading_time} min read</span>
                  </>
                )}
              </div>
            </div>
          </div>
        </Link>
      </article>
    );
  }

  return (
    <article className="group">
      <Link href={`/journal/${article.slug}`} className="block">
        {/* Image */}
        {article.featured_image_url && (
          <div className="aspect-[16/10] relative overflow-hidden rounded-xl bg-background-subtle mb-5 shadow-sm">
            <Image
              src={article.featured_image_url}
              alt={article.title}
              fill
              sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 440px"
              className="object-cover transition-all duration-500 group-hover:scale-105"
            />
          </div>
        )}

        {/* Content */}
        <div className="space-y-3">
          {/* Meta */}
          <div className="flex items-center gap-2 text-sm">
            <span
              className="inline-flex items-center gap-1.5 font-medium"
              style={{ color: article.pillar_color }}
            >
              <span
                className="w-1.5 h-1.5 rounded-full"
                style={{ backgroundColor: article.pillar_color }}
              />
              {article.pillar_name}
            </span>
            <span className="text-foreground-subtle">·</span>
            <span className="text-foreground-muted text-xs uppercase font-mono tracking-[0.06em]">
              {contentTypeLabels[article.content_type]}
            </span>
          </div>

          {/* Title */}
          <h3 className="font-heading text-xl font-semibold leading-snug text-foreground group-hover:text-accent transition-colors duration-300">
            {article.title}
          </h3>

          {/* Excerpt */}
          {article.excerpt && (
            <p className="text-foreground-muted text-sm leading-relaxed line-clamp-2">
              {article.excerpt}
            </p>
          )}

          {/* Footer */}
          <div className="flex items-center gap-3 text-sm text-foreground-muted pt-2">
            {article.published_at && (
              <time>{formatDate(article.published_at)}</time>
            )}
            {article.reading_time && (
              <>
                <span className="text-foreground-subtle">·</span>
                <span>{article.reading_time} min read</span>
              </>
            )}
          </div>
        </div>
      </Link>
    </article>
  );
}
