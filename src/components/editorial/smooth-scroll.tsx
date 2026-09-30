"use client";

import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import Lenis from "lenis";
import { scrollPageTo, setSmoothScroll } from "@/lib/smooth-scroll";

/**
 * Smooth wheel scrolling for the public site, tuned like matter.com: every
 * wheel input becomes a one-second ease-out glide, re-aimed when more input
 * arrives mid-glide. Lenis moves the real document scroll, so sticky
 * elements, scroll-driven CSS, IntersectionObserver reveals and find-in-page
 * behave as before. Touch and keyboard scrolling stay native, and it stays
 * off in admin and for visitors who prefer reduced motion. Anything that
 * scrolls the page itself goes through scrollPageTo() in lib/smooth-scroll.
 */
export function SmoothScroll() {
  const pathname = usePathname();
  const enabled = !/^\/admin(\/|$)/.test(pathname);
  const shownPath = useRef(pathname);

  useEffect(() => {
    shownPath.current = pathname;
  }, [pathname]);

  useEffect(() => {
    if (!enabled) return;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)");
    let lenis: Lenis | null = null;

    const update = () => {
      if (reduced.matches) {
        lenis?.destroy();
        lenis = null;
      } else if (!lenis) {
        lenis = new Lenis({
          autoRaf: true,
          // matter.com's curve: expo out over one second. (They pass this
          // easing without a duration, which Lenis turns into duration 1.)
          duration: 1,
          easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
          // Clicking through to another page drops the glide, so the new
          // page opens at the top.
          stopInertiaOnNavigate: true,
          // Inner scroll areas (the menu, contents list, search results,
          // code blocks) keep scrolling natively under the pointer.
          allowNestedScroll: true,
        });
      }
      setSmoothScroll(lenis);
    };
    update();
    reduced.addEventListener("change", update);

    // Same-page #links glide instead of jumping, through scrollPageTo so they
    // re-aim if the page moves on the way. This runs in the capture phase,
    // ahead of Next's <Link>, which would otherwise jump there itself; it then
    // does what the jump would have: updates the address and moves keyboard
    // focus to the target.
    const onClick = (e: MouseEvent) => {
      if (!lenis || lenis.isStopped || e.defaultPrevented) return;
      if (e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
      const link = (e.target as Element | null)?.closest?.("a[href*='#']");
      if (!(link instanceof HTMLAnchorElement) || (link.target && link.target !== "_self") || link.hasAttribute("download")) return;
      const url = new URL(link.href);
      const here = window.location;
      if (url.origin !== here.origin || url.pathname !== here.pathname || url.search !== here.search || !url.hash) return;
      const target = document.getElementById(decodeURIComponent(url.hash.slice(1)));
      if (!target) return;

      e.preventDefault();
      if (url.hash !== here.hash) window.history.pushState(window.history.state, "", url.hash);
      scrollPageTo(target);
      if (!target.hasAttribute("tabindex") && target.tabIndex < 0) target.setAttribute("tabindex", "-1");
      target.focus({ preventScroll: true });
    };
    document.addEventListener("click", onClick, true);

    // Back or forward to another page mid-glide: drop the glide so the
    // restored position holds. Same-page #links fire popstate too, and those
    // glides carry on. (Stopping and restarting is Lenis's public reset.)
    const onPopState = () => {
      if (window.location.pathname !== shownPath.current && lenis?.isScrolling === "smooth") {
        lenis.stop();
        lenis.start();
      }
    };
    window.addEventListener("popstate", onPopState);

    return () => {
      reduced.removeEventListener("change", update);
      document.removeEventListener("click", onClick, true);
      window.removeEventListener("popstate", onPopState);
      lenis?.destroy();
      setSmoothScroll(null);
    };
  }, [enabled]);

  return null;
}
