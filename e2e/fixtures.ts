import { test as base, expect, type Page } from "@playwright/test";

export const SITE = "https://www.craefto.com";

/** Public pages every run checks. */
export const PAGES = [
  "/",
  "/work",
  "/work/mng-steel",
  "/services",
  "/process",
  "/about",
  "/journal",
  "/contact",
  "/start",
  "/careers",
  "/changelog",
];

export const canonicalFor = (path: string) => `${SITE}${path === "/" ? "" : path}`;

type Fixtures = { consoleErrors: string[] };

// (Fixture callbacks name their argument `provide`, not `use`, so the React
// hooks lint rule doesn't mistake it for React's use().)

export const test = base.extend<Fixtures>({
  // Never send analytics from a test run (the site also skips automated browsers).
  page: async ({ page }, provide) => {
    await page.route("**/api/analytics/**", (route) => route.fulfill({ status: 204, body: "" }));
    await provide(page);
  },
  consoleErrors: async ({ page }, provide) => {
    const errors: string[] = [];
    page.on("pageerror", (error) => errors.push(`pageerror: ${error.message}`));
    page.on("console", (message) => {
      if (message.type() !== "error") return;
      // Vercel's analytics scripts only exist on Vercel deployments with the
      // feature enabled; their 404s elsewhere are expected.
      if (`${message.location().url} ${message.text()}`.includes("/_vercel/")) return;
      errors.push(message.text());
    });
    await provide(errors);
  },
});

export { expect };

/** Scroll to the bottom a screen at a time, letting reveals and lazy content settle. */
export async function scrollThrough(page: Page) {
  const height = await page.evaluate(() => document.documentElement.scrollHeight);
  const step = await page.evaluate(() => window.innerHeight * 0.8);
  for (let y = 0; y <= height; y += step) {
    await page.evaluate((top) => window.scrollTo(0, top), y);
    await page.waitForTimeout(250);
  }
  await page.evaluate(() => window.scrollTo(0, document.documentElement.scrollHeight));
  await page.waitForTimeout(1600);
}
