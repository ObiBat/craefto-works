"use client";

import { useCallback, useEffect, useRef, type ReactNode } from "react";
import { cn } from "@/lib/utils";

/**
 * Glide: one soft tile that follows the pointer, and keyboard focus, across a
 * set of rows or cells, marking the one you are on without drawing lines.
 * Mark each row with `data-glide-item`. On touch screens it only follows focus.
 *
 * `bleed` widens the tile past the row edges so text never sits flush on it.
 */
export function Glide({
  children,
  className,
  bleed = 20,
}: {
  children: ReactNode;
  className?: string;
  bleed?: number;
}) {
  const rootRef = useRef<HTMLDivElement>(null);
  const tileRef = useRef<HTMLSpanElement>(null);
  const activeRef = useRef<HTMLElement | null>(null);

  const place = useCallback(
    (item: HTMLElement | null) => {
      const root = rootRef.current;
      const tile = tileRef.current;
      if (!root || !tile) return;
      activeRef.current = item;
      if (!item) {
        tile.removeAttribute("data-on");
        return;
      }
      const r = root.getBoundingClientRect();
      const e = item.getBoundingClientRect();
      const entering = !tile.hasAttribute("data-on");
      // Entering the list: appear in place. Moving within it: glide.
      if (entering) tile.style.transition = "none";
      tile.style.transform = `translate3d(${e.left - r.left - bleed}px, ${e.top - r.top}px, 0)`;
      tile.style.width = `${e.width + bleed * 2}px`;
      tile.style.height = `${e.height}px`;
      if (entering) {
        void tile.offsetWidth;
        tile.style.transition = "";
      }
      tile.setAttribute("data-on", "");
    },
    [bleed]
  );

  // Keep the tile on its row while rows open, close or reflow.
  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;
    const ro = new ResizeObserver(() => {
      if (activeRef.current) place(activeRef.current);
    });
    ro.observe(root);
    return () => ro.disconnect();
  }, [place]);

  const itemFrom = (target: EventTarget | null) => {
    const item = (target as Element | null)?.closest?.("[data-glide-item]");
    return item && rootRef.current?.contains(item) ? (item as HTMLElement) : null;
  };

  return (
    <div
      ref={rootRef}
      className={cn("glide-root", className)}
      onPointerOver={(e) => {
        if (e.pointerType !== "mouse") return;
        const item = itemFrom(e.target);
        if (item && item !== activeRef.current) place(item);
      }}
      onPointerLeave={(e) => {
        if (e.pointerType === "mouse") place(null);
      }}
      onFocus={(e) => {
        if (!(e.target as HTMLElement).matches(":focus-visible")) return;
        place(itemFrom(e.target));
      }}
      onBlur={(e) => {
        if (!rootRef.current?.contains(e.relatedTarget as Node | null)) place(null);
      }}
    >
      <span ref={tileRef} className="glide-tile" aria-hidden="true" />
      {children}
    </div>
  );
}
