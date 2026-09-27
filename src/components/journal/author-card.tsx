import Link from "next/link";
import Image from "next/image";

interface AuthorCardProps {
  name: string;
  slug: string;
  role: string | null;
  bio: string | null;
  avatar: string | null;
  twitter: string | null;
  linkedin: string | null;
}

export function AuthorCard({
  name,
  slug,
  role,
  bio,
  avatar,
  twitter,
  linkedin,
}: AuthorCardProps) {
  return (
    <div className="relative mt-16 p-8 rounded-2xl bg-background-subtle/50 border border-border-subtle">
      {/* Label */}
      <p className="text-xs font-medium text-foreground-muted uppercase font-mono tracking-[0.06em] mb-6">
        Written by
      </p>

      <div className="flex flex-col sm:flex-row items-start gap-6">
        {/* Avatar */}
        <Link
          href={`/journal/author/${slug}`}
          className="shrink-0 group"
        >
          {avatar ? (
            <div className="w-20 h-20 rounded-full ring-4 ring-background shadow-lg transition-transform group-hover:scale-105 bg-background flex items-center justify-center overflow-hidden">
              <Image
                src={avatar}
                alt={name}
                width={48}
                height={48}
                className="object-contain"
              />
            </div>
          ) : (
            <div className="w-20 h-20 rounded-full bg-accent/15 flex items-center justify-center text-accent text-2xl font-semibold ring-4 ring-background shadow-lg transition-transform group-hover:scale-105">
              {name.charAt(0)}
            </div>
          )}
        </Link>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <Link
            href={`/journal/author/${slug}`}
            className="group inline-block mb-1"
          >
            <span className="font-heading text-xl font-semibold text-foreground group-hover:text-accent transition-colors">
              {name}
            </span>
          </Link>

          {role && (
            <p className="text-sm text-foreground-muted mb-3">{role}</p>
          )}

          {bio && (
            <p className="text-foreground-muted leading-relaxed mb-5 max-w-[50ch]">
              {bio}
            </p>
          )}

          {/* Social Links & View Profile */}
          <div className="flex flex-wrap items-center gap-4">
            {/* Social Links */}
            {(twitter || linkedin) && (
              <div className="flex items-center gap-3">
                {twitter && (
                  <a
                    href={twitter.startsWith("http") ? twitter : `https://twitter.com/${twitter}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-2 rounded-lg bg-background text-foreground-muted hover:text-foreground hover:bg-background-muted transition-all"
                    aria-label={`${name} on X`}
                  >
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                    </svg>
                  </a>
                )}
                {linkedin && (
                  <a
                    href={linkedin.startsWith("http") ? linkedin : `https://linkedin.com/in/${linkedin}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-2 rounded-lg bg-background text-foreground-muted hover:text-foreground hover:bg-background-muted transition-all flex items-center justify-center"
                    aria-label={`${name} on LinkedIn`}
                  >
                    <svg className="w-4 h-4 block" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
                    </svg>
                  </a>
                )}
              </div>
            )}

            {/* View Profile Link */}
            <Link
              href={`/journal/author/${slug}`}
              className="inline-flex items-center gap-2 text-sm font-medium text-accent hover:gap-3 transition-all"
            >
              <span>View all articles</span>
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
              </svg>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
