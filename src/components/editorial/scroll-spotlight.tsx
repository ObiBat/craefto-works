"use client";

import { useEffect } from "react";

// A new element takes over only once it is this much nearer the middle, so
// pausing between two doesn't flicker.
const HANDOVER = 32;

/**
 * Lights one element at a time as the page scrolls: the one nearest the
 * middle of the screen, within a quarter screen either side of it. The lit
 * element carries [data-spotlight], and globals.css eases it on and off.
 * It runs only while `media` matches.
 */
export function ScrollSpotlight({ selector, media = "all" }: { selector: string; media?: string }) {
  useEffect(() => {
    const query = window.matchMedia(media);
    const targets = [...document.querySelectorAll<HTMLElement>(selector)];
    let lit: HTMLElement | null = null;
    let frame = 0;

    const light = (next: HTMLElement | null) => {
      if (next === lit) return;
      lit?.removeAttribute("data-spotlight");
      next?.setAttribute("data-spotlight", "");
      lit = next;
    };

    const update = () => {
      frame = 0;
      const middle = window.innerHeight / 2;
      const reach = window.innerHeight / 4;
      let best: HTMLElement | null = null;
      let bestDistance = Infinity;
      let litDistance = Infinity;
      for (const target of targets) {
        const box = target.getBoundingClientRect();
        // How far the middle line is from the element: 0 while it spans it.
        const distance = Math.max(0, box.top - middle, middle - box.bottom);
        if (distance > reach) continue;
        if (target === lit) litDistance = distance;
        if (distance < bestDistance) {
          best = target;
          bestDistance = distance;
        }
      }
      if (lit && litDistance <= reach && bestDistance > litDistance - HANDOVER) return;
      light(best);
    };
    const schedule = () => {
      if (!frame) frame = requestAnimationFrame(update);
    };

    const stop = () => {
      window.removeEventListener("scroll", schedule);
      window.removeEventListener("resize", schedule);
      cancelAnimationFrame(frame);
      frame = 0;
      light(null);
    };
    const start = () => {
      stop();
      if (!query.matches) return;
      window.addEventListener("scroll", schedule, { passive: true });
      window.addEventListener("resize", schedule);
      update();
    };

    start();
    query.addEventListener("change", start);
    return () => {
      query.removeEventListener("change", start);
      stop();
    };
  }, [selector, media]);

  return null;
}
