"use client";

import { useEffect } from "react";
import { scrollPageTo } from "@/lib/smooth-scroll";

// Anchors from the old services page, now covered by these capabilities.
const LEGACY_ANCHORS: Record<string, string> = { web: "product", products: "product", ai: "systems" };

/**
 * Opens the page on the right capability from a #hash (links from other
 * pages, and shared links, including the old service anchors, which are
 * rewritten to the new ones).
 */
export function CapabilityScroll() {
  useEffect(() => {
    const hash = window.location.hash.replace("#", "");
    if (!hash) return;
    const target = LEGACY_ANCHORS[hash] ?? hash;
    if (target !== hash) window.history.replaceState(window.history.state, "", `#${target}`);
    // Hold the browser's own jump; the glide below takes over.
    window.scrollTo(0, 0);

    // Let the page transition and layout settle first.
    const timer = window.setTimeout(() => {
      const section = document.getElementById(target);
      if (section) scrollPageTo(section);
    }, 450);
    return () => window.clearTimeout(timer);
  }, []);

  return null;
}
