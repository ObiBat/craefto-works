"use client";

import { useSearchParams } from "next/navigation";
import { Suspense } from "react";
import { cn } from "@/lib/utils";

/**
 * A plain download link that also counts the download. The count goes to the
 * same page-view log as visits, under /free/<pack>/download/<file>, carrying
 * the visit's UTM tags so each Instagram post's downloads can be told apart.
 * Like page views, nothing is sent from local development or test browsers.
 */
function Tracked({ href, track, filename, className, children, ...rest }: DownloadLinkProps) {
  const params = useSearchParams();
  const onClick = () => {
    if (process.env.NODE_ENV !== "production" || navigator.webdriver) return;
    const body = JSON.stringify({
      path: track,
      referrer: document.referrer || null,
      utm_source: params.get("utm_source"),
      utm_medium: params.get("utm_medium"),
      utm_campaign: params.get("utm_campaign"),
      utm_content: params.get("utm_content"),
    });
    try {
      navigator.sendBeacon("/api/analytics/pageview", new Blob([body], { type: "application/json" }));
    } catch {
      // Counting is best effort; the download always goes ahead.
    }
  };
  return (
    <a href={href} download={filename ?? true} onClick={onClick} className={cn(className)} {...rest}>
      {children}
    </a>
  );
}

interface DownloadLinkProps extends Omit<React.AnchorHTMLAttributes<HTMLAnchorElement>, "href" | "download"> {
  href: string;
  /** The path to log, e.g. /free/backgrounds/download/all */
  track: string;
  filename?: string;
}

export function DownloadLink({ track, ...anchor }: DownloadLinkProps) {
  const { href, filename, className, children, ...rest } = anchor;
  return (
    <Suspense
      fallback={
        <a href={href} download={filename ?? true} className={cn(className)} {...rest}>
          {children}
        </a>
      }
    >
      <Tracked track={track} {...anchor} />
    </Suspense>
  );
}
