"use client";

import { useEffect } from "react";
import { usePathname, useSearchParams } from "next/navigation";

export function usePageView() {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  useEffect(() => {
    // Don't track admin pages, or clients in their portal.
    if (pathname.startsWith("/admin") || pathname.startsWith("/portal")) return;
    // Only real visits: local development and automated browsers (tests,
    // screenshot tools) would otherwise write to the live analytics.
    if (process.env.NODE_ENV !== "production" || navigator.webdriver) return;

    const trackPageView = async () => {
      try {
        await fetch("/api/analytics/pageview", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            path: pathname,
            referrer: document.referrer || null,
            utm_source: searchParams.get("utm_source"),
            utm_medium: searchParams.get("utm_medium"),
            utm_campaign: searchParams.get("utm_campaign"),
            utm_content: searchParams.get("utm_content"),
          }),
        });
      } catch {
        // Fail silently - analytics shouldn't break the site
      }
    };

    trackPageView();
  }, [pathname, searchParams]);
}
