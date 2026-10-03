"use client";

import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";

/**
 * Keeps html.site correct after client-side navigation between the site and
 * admin, and ends the logo intro as soon as you navigate away from the
 * page it played on (so the next page's logo and hero never wait for it).
 */
export function SiteClassSync() {
  const pathname = usePathname();
  const previous = useRef(pathname);
  useEffect(() => {
    (window as unknown as { __cwMarkSite?: () => void }).__cwMarkSite?.();
    // Compare paths rather than counting runs: Strict Mode re-runs effects.
    if (previous.current !== pathname) {
      previous.current = pathname;
      document.documentElement.classList.remove("logo-intro", "logo-intro-home", "intro-delay", "hl-intro");
    }
  }, [pathname]);
  return null;
}
