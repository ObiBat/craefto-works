import "server-only";
import { headers } from "next/headers";
import { SITE_URL } from "@/lib/seo";

/**
 * The site's origin for links in redirects and emails. Sign-in links carry a
 * token, so the origin never comes from a request header in production (a
 * forged Host would send the token elsewhere): www.craefto.com there, the
 * deployment's own URL on Vercel previews, and localhost or the LAN while
 * developing.
 */
export async function siteOrigin(): Promise<string> {
  if (process.env.VERCEL_ENV === "production") return SITE_URL;
  if (process.env.VERCEL_ENV === "preview" && process.env.VERCEL_URL) return `https://${process.env.VERCEL_URL}`;
  const host = (await headers()).get("host") ?? "";
  if (/^(localhost|127\.0\.0\.1|192\.168\.\d+\.\d+)(:\d+)?$/.test(host)) return `http://${host}`;
  return SITE_URL;
}
