import { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/seo";

// /_next/ must stay crawlable: it serves the CSS, scripts and optimised images
// search engines need to render pages and index their images.
export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: ["/api/", "/admin/", "/portal"],
      },
    ],
    sitemap: `${SITE_URL}/sitemap.xml`,
  };
}
