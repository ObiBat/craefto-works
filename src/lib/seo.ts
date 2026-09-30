import type { Metadata } from "next";

export const SITE_URL = "https://www.craefto.com";
export const SITE_NAME = "Craefto";

/**
 * Generated share cards (see lib/og/card.tsx). A route's own
 * opengraph-image.tsx takes precedence; these cover pages without one, since
 * a page's openGraph block replaces its parents' rather than merging.
 */
export const DEFAULT_OG_IMAGE = { url: "/opengraph-image", width: 1200, height: 630, alt: "Craefto, a creative tech studio in Sydney" };
export const JOURNAL_OG_IMAGE = { url: "/journal/opengraph-image", width: 1200, height: 630, alt: "The Craefto Journal" };

interface PageMetadataInput {
  /** Page title; " | Craefto" (or " | " + brand) is appended. */
  title: string;
  /** The name after the title, where a page speaks as Craefto Works. */
  brand?: string;
  description: string;
  /** Path of the page, e.g. "/services". Used for the canonical and og:url. */
  path: string;
  /**
   * "route" when the route has its own opengraph-image.tsx card: no image is
   * set here, so that card fills og:image and twitter:image. Otherwise an
   * explicit image, or the site-wide card by default.
   */
  image?: "route" | { url: string; width?: number; height?: number; alt?: string };
  type?: "website" | "article";
  noIndex?: boolean;
}

/**
 * Metadata for one page: a self-referencing canonical plus Open Graph and
 * Twitter cards built from the same title and description. Child segments
 * replace (rather than merge) `openGraph` and `twitter`, so every page sets
 * all of them here instead of inheriting the homepage's.
 *
 * Share images: a route's opengraph-image.tsx only wins over metadata set in
 * the same layout, and never over an explicit twitter image, so routes with
 * their own card pass image: "route" and set none here.
 */
export function pageMetadata({ title, brand = SITE_NAME, description, path, image, type = "website", noIndex }: PageMetadataInput): Metadata {
  const fullTitle = `${title} | ${brand}`;
  const images = image === "route" ? undefined : [image ? { ...image, alt: image.alt ?? title } : DEFAULT_OG_IMAGE];
  return {
    title: { absolute: fullTitle },
    description,
    alternates: { canonical: path },
    openGraph: {
      type,
      url: path,
      siteName: SITE_NAME,
      locale: "en_AU",
      title: fullTitle,
      description,
      ...(images ? { images } : {}),
    },
    twitter: {
      card: "summary_large_image",
      site: "@craefto",
      creator: "@craefto",
      title: fullTitle,
      description,
      ...(images ? { images: images.map((i) => i.url) } : {}),
    },
    ...(noIndex ? { robots: { index: false, follow: true } } : {}),
  };
}
