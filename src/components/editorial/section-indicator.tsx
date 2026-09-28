"use client";

import { useEffect, useState, type CSSProperties } from "react";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

type Section = { number: string; label: string };

/**
 * Wayfinding: the numbered section you are reading ("02 Case studies"), shown
 * beside the logo (phones and wide screens). It reads the page's SectionLabels, so it
 * needs no wiring per page, and types itself in like they do.
 */
export function SectionIndicator({ className }: { className?: string }) {
  const pathname = usePathname();
  const [current, setCurrent] = useState<Section | null>(null);

  useEffect(() => {
    let frame = 0;
    const update = () => {
      frame = 0;
      const line = window.innerHeight * 0.35;
      let found: Section | null = null;
      for (const el of document.querySelectorAll<HTMLElement>("main [data-section]")) {
        if (el.getBoundingClientRect().top >= line) break;
        found = { number: el.dataset.sectionNumber ?? "", label: el.dataset.section ?? "" };
      }
      // Past the last section (footer on screen): nothing to point at.
      const footer = document.querySelector("footer");
      if (footer && footer.getBoundingClientRect().top < line) found = null;
      setCurrent((prev) => (prev?.label === found?.label && prev?.number === found?.number ? prev : found));
    };
    const schedule = () => {
      if (!frame) frame = requestAnimationFrame(update);
    };
    update();
    window.addEventListener("scroll", schedule, { passive: true });
    window.addEventListener("resize", schedule);
    return () => {
      window.removeEventListener("scroll", schedule);
      window.removeEventListener("resize", schedule);
      cancelAnimationFrame(frame);
    };
  }, [pathname]);

  return (
    <span
      aria-hidden="true"
      className={cn("section-indicator min-w-0 max-w-[52vw] overflow-hidden font-mono text-[11px] uppercase tracking-[0.06em] xl:max-w-none", className)}
    >
      {current && (
        <span
          key={`${current.number}-${current.label}`}
          className="section-indicator-text"
          style={{ "--n": current.number.length + current.label.length + 1 } as CSSProperties}
        >
          {current.number && <span className="mr-2 text-[hsl(var(--color-accent))]">{current.number}</span>}
          <span className="text-[hsl(var(--color-foreground-subtle))]">{current.label}</span>
        </span>
      )}
    </span>
  );
}
