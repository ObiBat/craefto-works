import type Lenis from "lenis";

/**
 * The page's Lenis instance while smooth scrolling runs (set by
 * components/editorial/smooth-scroll.tsx). It is null in admin, for visitors
 * who prefer reduced motion and before hydration; the helpers below then use
 * the browser's own scrolling.
 */
let lenis: Lenis | null = null;

export function setSmoothScroll(instance: Lenis | null) {
  lenis = instance;
}

/**
 * Scroll the page to a position or an element on the same glide as the
 * wheel. Elements land clear of the fixed header (html scroll-padding-top).
 */
export function scrollPageTo(target: number | HTMLElement) {
  const l = lenis;
  if (!l) {
    const behavior: ScrollBehavior = window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth";
    if (typeof target === "number") window.scrollTo({ top: target, behavior });
    else target.scrollIntoView({ behavior });
    return;
  }
  if (typeof target === "number") {
    l.scrollTo(target);
    return;
  }

  // The page can still move under a glide: article images have no set size
  // until they load, so the ones on the way push the target down. Re-aim
  // whenever the element moves, so the glide still lands on it.
  const pageTop = () => target.getBoundingClientRect().top + window.scrollY;
  let aimedAt = pageTop();
  const unsubscribe: Array<() => void> = [];
  const stop = () => unsubscribe.forEach((off) => off());
  unsubscribe.push(
    l.on("scroll", () => {
      if (l.isScrolling !== "smooth") return stop();
      const now = pageTop();
      if (Math.abs(now - aimedAt) < 1) return;
      aimedAt = now;
      l.scrollTo(target);
    }),
    // Wheel or touch input takes over from the glide.
    l.on("virtual-scroll", stop)
  );
  l.scrollTo(target);
  // No glide started: already there, or held still under the menu.
  if (l.isScrolling !== "smooth") stop();
}

/** Hold the page still while an overlay such as the mobile menu is open. */
export function pauseSmoothScroll(paused: boolean) {
  if (paused) lenis?.stop();
  else lenis?.start();
}
