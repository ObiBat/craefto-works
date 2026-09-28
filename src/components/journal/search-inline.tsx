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

export function JournalSearchInline() {
    const router = useRouter();
    const [query, setQuery] = React.useState("");
    const [results, setResults] = React.useState<SearchResult[]>([]);
    const [isLoading, setIsLoading] = React.useState(false);
    const [isFocused, setIsFocused] = React.useState(false);
    const inputRef = React.useRef<HTMLInputElement>(null);
    const containerRef = React.useRef<HTMLDivElement>(null);

    // Close dropdown when clicking outside
    React.useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
                setIsFocused(false);
            }
        };

        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

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

    // Keyboard shortcut
    React.useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if ((e.metaKey || e.ctrlKey) && e.key === "k") {
                e.preventDefault();
                inputRef.current?.focus();
            }
            if (e.key === "Escape") {
                setIsFocused(false);
                inputRef.current?.blur();
            }
        };

        document.addEventListener("keydown", handleKeyDown);
        return () => document.removeEventListener("keydown", handleKeyDown);
    }, []);

    const handleSelect = (slug: string) => {
        setIsFocused(false);
        setQuery("");
        setResults([]);
        router.push(`/journal/${slug}`);
    };

    const showDropdown = isFocused && (query.length >= 2 || results.length > 0);

    return (
        <div ref={containerRef} className="relative shrink-0">
            {/* Search Input */}
            <div className="relative flex items-center">
                <svg
                    className="absolute left-2 sm:left-3 w-3.5 h-3.5 sm:w-4 sm:h-4 text-[hsl(var(--color-foreground-muted))] pointer-events-none"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                >
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
                    onFocus={() => setIsFocused(true)}
                    placeholder="Search..."
                    className="w-24 sm:w-32 md:w-40 pl-7 sm:pl-9 pr-2 sm:pr-3 py-1.5 sm:py-2 rounded-lg bg-[hsl(var(--color-background-muted))] border border-[hsl(var(--color-border))] text-xs sm:text-sm text-[hsl(var(--color-foreground))] placeholder:text-[hsl(var(--color-foreground-muted))] focus:outline-none focus:ring-2 focus:ring-[hsl(var(--color-accent))] focus:border-transparent transition-all"
                />
                {isLoading && (
                    <div className="absolute right-2 sm:right-3 w-3.5 h-3.5 sm:w-4 sm:h-4 border-2 border-[hsl(var(--color-foreground-muted))] border-t-transparent rounded-full animate-spin" />
                )}
            </div>

            {/* Dropdown Results */}
            {showDropdown && (
                <div className="absolute top-full right-0 mt-2 w-80 max-w-[90vw] bg-[hsl(var(--color-background))] border border-[hsl(var(--color-border))] rounded-xl shadow-2xl overflow-hidden z-50">
                    {results.length > 0 ? (
                        <div className="max-h-[320px] overflow-y-auto">
                            {results.map((result) => (
                                <button
                                    key={result.id}
                                    onClick={() => handleSelect(result.slug)}
                                    className="w-full text-left p-3 hover:bg-[hsl(var(--color-background-muted))] transition-colors border-b border-[hsl(var(--color-border))] last:border-b-0"
                                >
                                    <div className="flex items-start gap-2">
                                        <span
                                            className="w-2 h-2 rounded-full mt-1.5 shrink-0"
                                            style={{ backgroundColor: result.pillar_color }}
                                        />
                                        <div className="flex-1 min-w-0">
                                            <h4 className="font-medium text-sm text-[hsl(var(--color-foreground))] line-clamp-1">
                                                {result.title}
                                            </h4>
                                            <div className="flex items-center gap-2 mt-1 text-xs text-[hsl(var(--color-foreground-subtle))]">
                                                <span>{result.pillar_name}</span>
                                                <span>·</span>
                                                <span>{result.reading_time || 5} min read</span>
                                            </div>
                                        </div>
                                    </div>
                                </button>
                            ))}
                        </div>
                    ) : query.length >= 2 && !isLoading ? (
                        <div className="p-4 text-center text-sm text-[hsl(var(--color-foreground-muted))]">
                            No articles found for &ldquo;{query}&rdquo;
                        </div>
                    ) : query.length < 2 ? (
                        <div className="p-4 text-center text-xs text-[hsl(var(--color-foreground-muted))]">
                            Type at least 2 characters
                        </div>
                    ) : null}
                </div>
            )}
        </div>
    );
}
