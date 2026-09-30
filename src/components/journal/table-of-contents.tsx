"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

interface TOCItem {
  id: string;
  text: string;
  level: number;
}

interface TableOfContentsProps {
  content: string;
}

function extractHeadings(content: string): TOCItem[] {
  const headingRegex = /^(#{2,3})\s+(.+)$/gm;
  const headings: TOCItem[] = [];
  let match;

  while ((match = headingRegex.exec(content)) !== null) {
    const level = match[1].length;
    const text = match[2].trim();
    const id = text
      .toLowerCase()
      .replace(/\s+/g, "-")
      .replace(/[^\w-]/g, "");

    headings.push({ id, text, level });
  }

  return headings;
}

export function TableOfContents({ content }: TableOfContentsProps) {
  const [activeId, setActiveId] = React.useState<string>("");
  const headings = React.useMemo(() => extractHeadings(content), [content]);

  React.useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setActiveId(entry.target.id);
          }
        });
      },
      {
        rootMargin: "-100px 0px -80% 0px",
      }
    );

    headings.forEach(({ id }) => {
      const element = document.getElementById(id);
      if (element) {
        observer.observe(element);
      }
    });

    return () => {
      headings.forEach(({ id }) => {
        const element = document.getElementById(id);
        if (element) {
          observer.unobserve(element);
        }
      });
    };
  }, [headings]);

  if (headings.length === 0) {
    return null;
  }

  return (
    <nav className="hidden xl:block" aria-label="Table of contents">
      <div className="max-h-[calc(100vh-8rem)] overflow-auto pr-4 -mr-4">
        <p className="text-xs font-medium text-foreground-muted uppercase font-mono tracking-[0.06em] mb-5">
          On this page
        </p>
        <ul className="space-y-1 text-sm border-l border-border-subtle">
          {headings.map((heading) => (
            <li
              key={heading.id}
              className="relative"
            >
              {/* Active indicator */}
              {activeId === heading.id && (
                <span className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-5 bg-accent rounded-full" />
              )}
              <a
                href={`#${heading.id}`}
                // The glide itself comes from the site-wide anchor handling
                // (components/editorial/smooth-scroll.tsx).
                onClick={() => setActiveId(heading.id)}
                className={cn(
                  "block py-1.5 transition-all duration-200 leading-relaxed",
                  heading.level === 3 ? "pl-6" : "pl-4",
                  activeId === heading.id
                    ? "text-accent font-medium"
                    : "text-foreground-muted hover:text-foreground hover:pl-5"
                )}
              >
                {heading.text}
              </a>
            </li>
          ))}
        </ul>

        {/* Share buttons */}
        <div className="mt-10 pt-6 border-t border-border">
          <p className="text-xs font-medium text-foreground-muted uppercase font-mono tracking-[0.06em] mb-4">Share</p>
          <div className="flex gap-2">
            <ShareButton
              network="twitter"
              label="X"
              icon={
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                </svg>
              }
            />
            <ShareButton
              network="linkedin"
              label="LinkedIn"
              icon={
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
                </svg>
              }
            />
            <CopyLinkButton />
          </div>
        </div>
      </div>
    </nav>
  );
}

function ShareButton({
  network,
  label,
  icon,
}: {
  network: "twitter" | "linkedin";
  label: string;
  icon: React.ReactNode;
}) {
  const handleShare = () => {
    const url = encodeURIComponent(window.location.href);
    const title = encodeURIComponent(document.title);

    const shareUrls = {
      twitter: `https://twitter.com/intent/tweet?url=${url}&text=${title}`,
      linkedin: `https://www.linkedin.com/sharing/share-offsite/?url=${url}`,
    };

    window.open(shareUrls[network], "_blank", "width=600,height=400");
  };

  return (
    <button
      onClick={handleShare}
      className="p-2 rounded-lg bg-background-subtle text-foreground-muted hover:text-foreground hover:bg-background-muted transition-colors"
      aria-label={`Share on ${label}`}
    >
      {icon}
    </button>
  );
}

function CopyLinkButton() {
  const [copied, setCopied] = React.useState(false);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <button
      onClick={handleCopy}
      className="p-2 rounded-lg bg-background-subtle text-foreground-muted hover:text-foreground hover:bg-background-muted transition-colors"
      aria-label="Copy link"
    >
      {copied ? (
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
        </svg>
      ) : (
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
        </svg>
      )}
    </button>
  );
}
