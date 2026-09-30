"use client";

import { useEffect } from "react";
import { scrollPageTo } from "@/lib/smooth-scroll";

// Anchors from the old services page, now covered by these capabilities.
const LEGACY_ANCHORS: Record<string, string> = { web: "product", products: "product", ai: "systems" };

/**
 * Opens the page on the right capability: from a #hash (shared links,
 * including the old service anchors, which are rewritten to the new ones) or
 * from /start, which passes its target through sessionStorage.
 */
export function CapabilityScroll() {
  useEffect(() => {
    const stored = sessionStorage.getItem("scrollToService");
    const hash = window.location.hash.replace("#", "");
    const requested = stored || hash;
    if (!requested) return;
    const target = LEGACY_ANCHORS[requested] ?? requested;

    if (!stored) {
      if (target !== hash) window.history.replaceState(window.history.state, "", `#${target}`);
      // Hold the browser's own jump; the glide below takes over.
      window.scrollTo(0, 0);
    }

    // Let the page transition and layout settle first. The stored target is
    // cleared only once the scroll runs, so a re-run effect still finds it.
    const timer = window.setTimeout(() => {
      sessionStorage.removeItem("scrollToService");
      const section = document.getElementById(target);
      if (section) scrollPageTo(section);
    }, 450);
    return () => window.clearTimeout(timer);
  }, []);

  return null;
}
