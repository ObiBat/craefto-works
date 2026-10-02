"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";

// Mirrors the scroll-driven rules in globals.css (keep the two in step).
const CLIP_BOXES = ".overflow-hidden, .overflow-auto, .overflow-scroll, [class*='overflow-x-'], [class*='overflow-y-']";
const NO_COPY_INSIDE = `li, dd, figcaption, form, nav, [data-ink], [data-no-reveal], ${CLIP_BOXES}`;
const CANDIDATES = "main p, main dd, main figcaption, main li, [data-ink], .phase-marker, .entry-dot, [data-unmask]";

type Effect = "copy" | "item" | "ink" | "marker" | "unmask";

function effectFor(el: HTMLElement): Effect | null {
  const insideClipBox = !!el.parentElement?.closest(CLIP_BOXES);
  if (el.matches("[data-unmask]")) return insideClipBox ? null : "unmask";
  if (el.matches(".phase-marker, .entry-dot")) return "marker";
  if (el.matches("[data-ink]")) return insideClipBox ? null : "ink";
  if (el.matches("[data-no-reveal], [class*='opacity-'], .sr-only") || el.parentElement?.closest(NO_COPY_INSIDE)) return null;
  if (el.matches("li")) return "item";
  if (el.matches("p, dd, figcaption")) return "copy";
  return null;
}

/**
 * For browsers without scroll-driven animations (older iOS Safari, some
 * Android browsers): the same text, image and marker effects play once,
 * over time, as each element scrolls into view. Only elements that start
 * below the fold take part, so nothing already on screen flickers; it runs
 * after hydration, so the server HTML is never altered.
 */
export function ScrollFallback() {
  const pathname = usePathname();

  useEffect(() => {
    const root = document.documentElement;
    const forced = new URLSearchParams(window.location.search).has("sd-fallback");
    if (!forced && CSS.supports("animation-timeline: view()")) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    if (!root.classList.contains("site") || !("IntersectionObserver" in window)) return;
    root.classList.add("sd-fallback");

    const io = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (!entry.isIntersecting) continue;
          entry.target.setAttribute("data-sd", "play");
          io.unobserve(entry.target);
        }
      },
      { rootMargin: "0px 0px -12% 0px" }
    );

    const fold = window.innerHeight * 0.88;
    for (const el of document.querySelectorAll<HTMLElement>(CANDIDATES)) {
      if (el.hasAttribute("data-sd")) continue;
      const effect = effectFor(el);
      if (!effect || el.getBoundingClientRect().top < fold) continue;
      el.setAttribute("data-sd-fx", effect);
      el.setAttribute("data-sd", "wait");
      io.observe(el);
    }
    return () => io.disconnect();
  }, [pathname]);

  return null;
}
