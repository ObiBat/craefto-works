"use client";

import * as React from "react";

interface ArticleAnalyticsProps {
  articleId: string;
  slug: string;
}

export function ArticleAnalytics({ articleId, slug }: ArticleAnalyticsProps) {
  const tracked = React.useRef(false);
  const scrollDepths = React.useRef<Set<number>>(new Set());
  const startTime = React.useRef<number>(0);

  // Get or create visitor ID
  const getVisitorId = React.useCallback(() => {
    if (typeof window === "undefined") return null;
    let visitorId = localStorage.getItem("craefto_visitor_id");
    if (!visitorId) {
      visitorId = `v_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      localStorage.setItem("craefto_visitor_id", visitorId);
    }
    return visitorId;
  }, []);

  // Get session ID
  const getSessionId = React.useCallback(() => {
    if (typeof window === "undefined") return null;
    let sessionId = sessionStorage.getItem("craefto_session_id");
    if (!sessionId) {
      sessionId = `s_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      sessionStorage.setItem("craefto_session_id", sessionId);
    }
    return sessionId;
  }, []);

  // Get device type
  const getDeviceType = React.useCallback(() => {
    if (typeof window === "undefined") return "unknown";
    const ua = navigator.userAgent;
    if (/tablet|ipad|playbook|silk/i.test(ua)) return "tablet";
    if (/mobile|iphone|ipod|android|blackberry|opera mini|iemobile/i.test(ua)) return "mobile";
    return "desktop";
  }, []);

  // Track event
  const trackEvent = React.useCallback(
    async (eventType: string, metadata: Record<string, unknown> = {}) => {
      try {
        await fetch("/api/analytics/article", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            articleId,
            slug,
            eventType,
            visitorId: getVisitorId(),
            sessionId: getSessionId(),
            referrer: document.referrer || null,
            deviceType: getDeviceType(),
            metadata,
          }),
        });
      } catch (error) {
        // Silently fail - don't break UX for analytics
        console.debug("Analytics error:", error);
      }
    },
    [articleId, slug, getVisitorId, getSessionId, getDeviceType]
  );

  // Track page view on mount
  React.useEffect(() => {
    if (tracked.current) return;
    tracked.current = true;
    trackEvent("view");
  }, [trackEvent]);

  // Track scroll depth
  React.useEffect(() => {
    const handleScroll = () => {
      const scrollTop = window.scrollY;
      const docHeight = document.documentElement.scrollHeight - window.innerHeight;
      const scrollPercent = Math.round((scrollTop / docHeight) * 100);

      const depths = [25, 50, 75, 100];
      depths.forEach((depth) => {
        if (scrollPercent >= depth && !scrollDepths.current.has(depth)) {
          scrollDepths.current.add(depth);
          trackEvent(`scroll_${depth}`, { scrollPercent });
        }
      });
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, [trackEvent]);

  // Track time on page when leaving (the clock starts once mounted)
  React.useEffect(() => {
    startTime.current = Date.now();
    const handleBeforeUnload = () => {
      const timeOnPage = Math.round((Date.now() - startTime.current) / 1000);
      const maxDepth = Math.max(...Array.from(scrollDepths.current), 0);

      // Use sendBeacon for reliable tracking on page exit
      navigator.sendBeacon(
        "/api/analytics/article",
        JSON.stringify({
          articleId,
          slug,
          eventType: "exit",
          visitorId: getVisitorId(),
          sessionId: getSessionId(),
          metadata: { timeOnPage, maxScrollDepth: maxDepth },
        })
      );
    };

    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [articleId, slug, getVisitorId, getSessionId]);

  // This component doesn't render anything visible
  return null;
}

// Hook for tracking specific events (code copy, link clicks, shares)
export function useArticleTracking(articleId: string, slug: string) {
  const trackEvent = React.useCallback(
    async (eventType: string, metadata: Record<string, unknown> = {}) => {
      try {
        const visitorId = localStorage.getItem("craefto_visitor_id");
        const sessionId = sessionStorage.getItem("craefto_session_id");

        await fetch("/api/analytics/article", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            articleId,
            slug,
            eventType,
            visitorId,
            sessionId,
            metadata,
          }),
        });
      } catch (error) {
        console.debug("Analytics error:", error);
      }
    },
    [articleId, slug]
  );

  return {
    trackCodeCopy: (language?: string) => trackEvent("copy_code", { language }),
    trackLinkClick: (url: string, isInternal: boolean) =>
      trackEvent("click_link", { url, isInternal }),
    trackShare: (platform: string) => trackEvent("share", { platform }),
  };
}
