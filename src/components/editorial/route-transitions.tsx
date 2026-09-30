"use client";

import { useEffect, useRef } from "react";
import { usePathname, useRouter } from "next/navigation";

/**
 * Soft page-to-page transitions using the browser's View Transitions API: the
 * old page settles out as the new one arrives, instead of cutting. Internal
 * link clicks are routed through `document.startViewTransition`; everything
 * else (new tabs, downloads, same-page anchors, admin, links marked
 * `data-no-transition`, browsers without the API, reduced motion) navigates
 * exactly as before. Styles live in the editorial layer of globals.css.
 *
 * Touch screens skip it: a phone freezes for a frame or more while it
 * snapshots both pages (110 to 150ms measured on a throttled Pixel 7), right
 * as the new page's own entrance starts. There the page swaps as on a reload
 * and its entrance animations carry the change.
 */
export function RouteTransitions() {
  const router = useRouter();
  const pathname = usePathname();
  const finish = useRef<(() => void) | null>(null);

  // The new route has rendered: let the transition capture it.
  useEffect(() => {
    finish.current?.();
    finish.current = null;
  }, [pathname]);

  useEffect(() => {
    if (!("startViewTransition" in document)) return;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)");
    const touch = window.matchMedia("(pointer: coarse)");

    const onClick = (e: MouseEvent) => {
      if (reduced.matches || touch.matches || e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
      const link = (e.target as Element | null)?.closest?.("a[href]");
      if (!(link instanceof HTMLAnchorElement)) return;
      if ((link.target && link.target !== "_self") || link.hasAttribute("download") || link.hasAttribute("data-no-transition")) return;
      const url = new URL(link.href, window.location.href);
      if (url.origin !== window.location.origin || url.pathname === window.location.pathname) return;
      if (/^\/(admin|api)(\/|$)/.test(url.pathname) || /^\/admin(\/|$)/.test(window.location.pathname)) return;

      // Runs in the capture phase, before Next's <Link> handler, which then
      // sees the event as handled and stands down.
      e.preventDefault();
      document.startViewTransition(
        () =>
          new Promise<void>((resolve) => {
            finish.current = resolve;
            router.push(url.pathname + url.search + url.hash);
            // Never hold the old page on screen if the route is slow.
            window.setTimeout(resolve, 1200);
          })
      );
    };

    document.addEventListener("click", onClick, true);
    return () => document.removeEventListener("click", onClick, true);
  }, [router]);

  return null;
}
