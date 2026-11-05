"use client";

import { useSearchParams } from "next/navigation";
import { Suspense } from "react";

/**
 * A link that counts its click: a download of one of our files, or a visit to
 * a tool we recommend. The count goes to the same page-view log as visits,
 * under the given path (/free/<slug>/download/<file> or /free/<slug>/out/<id>),
 * carrying the visit's UTM tags so each Instagram post's results can be told
 * apart. Like page views, nothing is sent from local development or test browsers.
 */

interface TrackedLinkProps extends Omit<React.AnchorHTMLAttributes<HTMLAnchorElement>, "href" | "download"> {
  href: string;
  /** The path to log. */
  track: string;
  /** Download the file instead of opening it; a string sets the saved name. */
  download?: boolean | string;
  /** Opens in a new tab, without passing our page as the opener. */
  external?: boolean;
}

/** The props that go straight onto the <a>, without ours. */
function anchorRest(props: TrackedLinkProps): React.AnchorHTMLAttributes<HTMLAnchorElement> {
  const rest: Record<string, unknown> = { ...props };
  for (const key of ["track", "download", "external", "href", "children"]) delete rest[key];
  return rest;
}

function linkProps({ href, download, external }: TrackedLinkProps) {
  return {
    href,
    ...(download ? { download: download === true ? "" : download } : {}),
    ...(external ? { target: "_blank", rel: "noopener" } : {}),
  };
}

function Tracked(props: TrackedLinkProps) {
  const { track, children } = props;
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
      // Counting is best effort; the link always works.
    }
  };
  return (
    <a {...anchorRest(props)} {...linkProps(props)} onClick={onClick}>
      {children}
    </a>
  );
}

export function TrackedLink(props: TrackedLinkProps) {
  return (
    <Suspense
      fallback={
        <a {...anchorRest(props)} {...linkProps(props)}>
          {props.children}
        </a>
      }
    >
      <Tracked {...props} />
    </Suspense>
  );
}
