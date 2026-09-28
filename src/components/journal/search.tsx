"use client";

import * as React from "react";
import { useRouter } from "next/navigation";

interface SearchResult {
  id: string;
  title: string;
  slug: string;
  excerpt: string | null;
  pillar_name: string;
  pillar_color: string;
  author_name: string;
  published_at: string;
  reading_time: number | null;
}

export function JournalSearch() {
  const router = useRouter();
  const [isOpen, setIsOpen] = React.useState(false);
  const [query, setQuery] = React.useState("");
  const [results, setResults] = React.useState<SearchResult[]>([]);
  const [isLoading, setIsLoading] = React.useState(false);
  const inputRef = React.useRef<HTMLInputElement>(null);

  // Debounced search
  React.useEffect(() => {
    if (query.length < 2) {
      setResults([]);
      return;
    }

    const timer = setTimeout(async () => {
      setIsLoading(true);
      try {
        const res = await fetch(`/api/journal/search?q=${encodeURIComponent(query)}&limit=5`);
        if (res.ok) {
          const data = await res.json();
          setResults(data.articles);
        }
      } catch (error) {
        console.error("Search error:", error);
      } finally {
        setIsLoading(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [query]);

  // Keyboard shortcut to open search
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setIsOpen(true);
      }
      if (e.key === "Escape") {
        setIsOpen(false);
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, []);

  // Focus input when opening
  React.useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  const handleSelect = (slug: string) => {
    setIsOpen(false);
    setQuery("");
    setResults([]);
    router.push(`/journal/${slug}`);
  };

  return (
    <>
      {/* Search Trigger Button */}
      <button
        onClick={() => setIsOpen(true)}
        className="flex items-center gap-2 px-4 py-2 rounded-lg bg-background-subtle text-foreground-muted hover:text-foreground hover:bg-background-muted transition-colors text-sm"
        aria-label="Search articles"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
          />
        </svg>
        <span className="hidden sm:inline">Search</span>
        <kbd className="hidden md:inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-background-muted text-xs text-foreground-subtle">
          <span className="text-xs">&#8984;</span>K
        </kbd>
      </button>

      {/* Search Modal */}
      {isOpen && (
        <div className="fixed inset-0 z-50">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-background/80 backdrop-blur-sm"
            onClick={() => setIsOpen(false)}
          />

          {/* Dialog */}
          <div className="absolute top-[20%] left-1/2 -translate-x-1/2 w-full max-w-xl px-4">
            <div className="bg-background border border-border rounded-xl shadow-2xl overflow-hidden">
              {/* Input */}
              <div className="flex items-center gap-3 p-4 border-b border-border">
                <svg className="w-5 h-5 text-foreground-muted" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                  />
                </svg>
                <input
                  ref={inputRef}
                  type="text"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Search articles..."
                  className="flex-1 bg-transparent text-foreground placeholder:text-foreground-muted focus:outline-none"
                />
                {isLoading && (
                  <div className="w-5 h-5 border-2 border-foreground-muted border-t-transparent rounded-full animate-spin" />
                )}
                <button
                  onClick={() => setIsOpen(false)}
                  className="p-1 text-foreground-muted hover:text-foreground transition-colors"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              {/* Results */}
              {results.length > 0 && (
                <div className="max-h-[400px] overflow-y-auto">
                  {results.map((result) => (
                    <button
                      key={result.id}
                      onClick={() => handleSelect(result.slug)}
                      className="w-full text-left p-4 hover:bg-background-subtle transition-colors border-b border-border last:border-b-0"
                    >
                      <div className="flex items-start gap-3">
                        <span
                          className="w-2 h-2 rounded-full mt-2 shrink-0"
                          style={{ backgroundColor: result.pillar_color }}
                        />
                        <div className="flex-1 min-w-0">
                          <h4 className="font-medium text-foreground line-clamp-1">
                            {result.title}
                          </h4>
                          {result.excerpt && (
                            <p className="text-sm text-foreground-muted line-clamp-2 mt-1">
                              {result.excerpt}
                            </p>
                          )}
                          <div className="flex items-center gap-2 mt-2 text-xs text-foreground-subtle">
                            <span>{result.pillar_name}</span>
                            <span>·</span>
                            <span>{result.author_name}</span>
                          </div>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              )}

              {/* No results */}
              {query.length >= 2 && results.length === 0 && !isLoading && (
                <div className="p-8 text-center text-foreground-muted">
                  <p>No articles found for &ldquo;{query}&rdquo;</p>
                </div>
              )}

              {/* Help text */}
              {query.length < 2 && (
                <div className="p-4 text-center text-sm text-foreground-muted">
                  <p>Type at least 2 characters to search</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
