import { test, expect, PAGES, SITE, canonicalFor } from "./fixtures";

const match = (html: string, pattern: RegExp) => html.match(pattern)?.[1] ?? null;
const meta = (html: string, key: string) =>
  match(html, new RegExp(`<meta (?:property|name)="${key.replace(/[.:]/g, "\\$&")}" content="([^"]*)"`));
const pathOf = (url: string) => {
  const u = new URL(url, SITE);
  return u.pathname + u.search;
};

test.describe("search and sharing", () => {
  test("robots.txt keeps private areas out and points to the sitemap", async ({ request }) => {
    const res = await request.get("/robots.txt");
    expect(res.ok()).toBeTruthy();
    const body = await res.text();
    for (const path of ["/api/", "/admin/"]) expect(body).toContain(`Disallow: ${path}`);
    expect(body).toContain(`Sitemap: ${SITE}/sitemap.xml`);
  });

  test("the sitemap lists the public pages and nothing private", async ({ request }) => {
    const body = await (await request.get("/sitemap.xml")).text();
    for (const path of PAGES) expect(body).toContain(`<loc>${canonicalFor(path)}</loc>`);
    expect(body).not.toMatch(/\/(admin|portal|api)\//);
  });

  for (const path of PAGES) {
    test(`${path}: canonical, title, description, share card and structured data`, async ({ request }) => {
      const res = await request.get(path);
      expect(res.status()).toBe(200);
      const html = await res.text();

      expect(match(html, /<link rel="canonical" href="([^"]*)"/)).toBe(canonicalFor(path));
      expect(match(html, /<title>([^<]*)<\/title>/)).toMatch(/Craefto/);
      expect(meta(html, "description")?.length ?? 0).toBeGreaterThan(50);

      const card = meta(html, "og:image");
      expect(card, "og:image").toBeTruthy();
      expect(meta(html, "twitter:image"), "twitter:image matches og:image").toBe(card);
      const image = await request.get(pathOf(card!));
      expect(image.status()).toBe(200);
      expect(image.headers()["content-type"]).toContain("image/png");

      for (const [, json] of html.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)) {
        expect(() => JSON.parse(json)).not.toThrow();
      }
    });
  }

  test("titles and descriptions are unique", async ({ request }) => {
    const seen = new Map<string, string>();
    for (const path of PAGES) {
      const html = await (await request.get(path)).text();
      for (const value of [match(html, /<title>([^<]*)<\/title>/), meta(html, "description")]) {
        expect(value).toBeTruthy();
        expect(seen.get(value!), `${path} repeats "${value}"`).toBeUndefined();
        seen.set(value!, path);
      }
    }
  });

  test("unknown pages return a real 404 that stays out of search", async ({ request }) => {
    const res = await request.get("/this-page-does-not-exist");
    expect(res.status()).toBe(404);
    const html = await res.text();
    expect(html).toContain("<title>Page not found | Craefto</title>");
    expect(html).toMatch(/<meta name="robots" content="noindex/);
    expect(html).not.toContain('rel="canonical"');
  });

  test("retired addresses redirect permanently", async ({ request }) => {
    for (const [from, to] of [
      ["/lab", "/about"],
      ["/journal/author/craefto-lab", "/journal/author/craefto-works"],
    ]) {
      const res = await request.get(from, { maxRedirects: 0 });
      expect(res.status(), from).toBe(308);
      expect(new URL(res.headers()["location"], SITE).pathname).toBe(to);
    }
  });

  test("security headers are sent", async ({ request }) => {
    const headers = (await request.get("/")).headers();
    expect(headers["x-content-type-options"]).toBe("nosniff");
    expect(headers["x-frame-options"]).toBe("SAMEORIGIN");
    expect(headers["referrer-policy"]).toBe("strict-origin-when-cross-origin");
    expect(headers["content-security-policy-report-only"]).toContain("default-src 'self'");
  });
});
