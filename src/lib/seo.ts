import type { Metadata } from "next";

export const SITE_URL = "https://www.craefto.com";
export const SITE_NAME = "Craefto";

const DEFAULT_IMAGE = {
  url: "/og-image.png",
  width: 1200,
  height: 630,
  alt: "Craefto, creative tech studio",
};

interface PageMetadataInput {
  /** Page title; the root layout's template appends " | Craefto". */
  title: string;
  description: string;
  /** Path of the page, e.g. "/services". Used for the canonical and og:url. */
  path: string;
  image?: { url: string; width?: number; height?: number; alt?: string };
  type?: "website" | "article";
  noIndex?: boolean;
}

/**
 * Metadata for one page: a self-referencing canonical plus Open Graph and
 * Twitter cards built from the same title and description. Child segments
 * replace (rather than merge) `openGraph` and `twitter`, so every page sets
 * all of them here instead of inheriting the homepage's.
 */
export function pageMetadata({ title, description, path, image, type = "website", noIndex }: PageMetadataInput): Metadata {
  const fullTitle = `${title} | ${SITE_NAME}`;
  const images = [image ? { ...image, alt: image.alt ?? title } : DEFAULT_IMAGE];
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
      images,
    },
    twitter: {
      card: "summary_large_image",
      site: "@craefto",
      creator: "@craefto",
      title: fullTitle,
      description,
      images: images.map((i) => i.url),
    },
    ...(noIndex ? { robots: { index: false, follow: true } } : {}),
  };
}
