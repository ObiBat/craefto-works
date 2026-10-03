import type { Page } from "@playwright/test";
import { test, expect, PAGES, scrollThrough } from "./fixtures";

/**
 * Text in the top half of the screen that isn't fully shown: faded, or with
 * a reveal animation that never finished. Looping animations are ignored.
 */
function unfinishedText(page: Page) {
  return page.evaluate(() => {
    const vh = window.innerHeight;
    const problems: string[] = [];
    const candidates = document.querySelectorAll<HTMLElement>(
      "main :is(h1, h2, h3, h4, p, li, dd, dt, figcaption, blockquote)"
    );
    for (const el of candidates) {
      // Skip decorative and screen-reader-only text.
      if (el.closest('[aria-hidden="true"], .sr-only')) continue;
      const text = el.innerText.trim();
      const box = el.getBoundingClientRect();
      if (!text || box.width === 0 || box.height === 0) continue;
      if (box.top < 0 || box.top > vh * 0.5) continue;
      let opacity = 1;
      for (let node: HTMLElement | null = el; node; node = node.parentElement) {
        opacity *= Number(getComputedStyle(node).opacity);
      }
      const running = el
        .getAnimations({ subtree: true })
        .filter((a) => a.effect?.getComputedTiming().iterations !== Infinity)
        .some((a) => (a.effect?.getComputedTiming().progress ?? 1) < 0.999);
      if (opacity < 0.95 || running) problems.push(`${el.tagName} "${text.slice(0, 40)}" opacity ${opacity.toFixed(2)}${running ? " animating" : ""}`);
    }
    return problems;
  });
}

test.describe("pages", () => {
  for (const path of PAGES) {
    test(`${path} loads cleanly and reveals everything`, async ({ page, consoleErrors }) => {
      const res = await page.goto(path, { waitUntil: "load" });
      expect(res?.status()).toBe(200);
      await scrollThrough(page);

      // Every rendered reveal was triggered (layouts for other screen sizes are
      // display: none and never intersect), and the text on screen has arrived.
      const unrevealed = await page.evaluate(
        () => [...document.querySelectorAll("[data-reveal]:not([data-in])")].filter((el) => el.getClientRects().length > 0).length
      );
      expect(unrevealed, "reveal elements never marked [data-in]").toBe(0);
      expect(await unfinishedText(page)).toEqual([]);

      await page.evaluate(() => window.scrollTo(0, 0));
      await page.waitForTimeout(3200);
      expect(await unfinishedText(page)).toEqual([]);

      expect(consoleErrors).toEqual([]);
    });
  }

  test.describe("without JavaScript", () => {
    test.use({ javaScriptEnabled: false });
    test("the home page is fully readable", async ({ page }) => {
      await page.goto("/");
      const headline = page.locator("main h1");
      await expect(headline).toBeVisible();
      await expect.poll(() => headline.evaluate((el) => getComputedStyle(el).opacity)).toBe("1");
      await expect(page.locator("main p").first()).toBeVisible();
    });
  });

  test.describe("with reduced motion", () => {
    test.use({ reducedMotion: "reduce" });
    test("there is no intro and nothing waits to appear", async ({ page }) => {
      await page.goto("/");
      await expect(page.locator(".brand-intro")).toBeHidden();
      expect(await page.evaluate(() => document.documentElement.className)).not.toMatch(/logo-intro|intro-delay/);
      await expect(page.locator("main h1")).toBeVisible();
      expect(await unfinishedText(page)).toEqual([]);
    });
  });
});
