"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { cn } from "@/lib/utils";

/**
 * A sticky sub-bar (e.g. journal filters) that feathers its lower edge once it
 * is stuck under the header, instead of drawing a divider. While it is stuck,
 * the header's own feather steps aside (see the editorial layer in globals.css).
 */
export function StickyBar({
  children,
  className,
  top = 64,
}: {
  children: ReactNode;
  className?: string;
  /** The bar's sticky offset in px (match its `top-*` class). */
  top?: number;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [stuck, setStuck] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    let frame = 0;
    const check = () => {
      frame = 0;
      setStuck(window.scrollY > 0 && el.getBoundingClientRect().top <= top + 0.5);
    };
    const schedule = () => {
      if (!frame) frame = requestAnimationFrame(check);
    };
    check();
    window.addEventListener("scroll", schedule, { passive: true });
    window.addEventListener("resize", schedule);
    return () => {
      window.removeEventListener("scroll", schedule);
      window.removeEventListener("resize", schedule);
      cancelAnimationFrame(frame);
    };
  }, [top]);

  return (
    <div ref={ref} data-subbar="" data-scrolled={stuck ? "" : undefined} className={cn("feather-edge", className)}>
      {children}
    </div>
  );
}
