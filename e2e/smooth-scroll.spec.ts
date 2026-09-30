import type { Page } from "@playwright/test";
import { test, expect } from "./fixtures";

// Wheel scrolling glides on the public site (components/editorial/smooth-scroll.tsx).

const LENIS = /(^|\s)lenis(\s|$)/;

/** Record scrollY every frame for the next `ms` milliseconds. */
async function recordScroll(page: Page, ms = 1600) {
  await page.evaluate((ms) => {
    const w = window as unknown as { __ys: number[] };
    w.__ys = [];
    const start = performance.now();
    const tick = () => {
      w.__ys.push(window.scrollY);
      if (performance.now() - start < ms) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  }, ms);
  return async () => {
    await page.waitForTimeout(ms + 100);
    return page.evaluate(() => (window as unknown as { __ys: number[] }).__ys);
  };
}

/** How far a section sits from its resting place below the fixed header. */
function offFromRest(page: Page, id: string) {
  return page.evaluate((id) => {
    const section = document.getElementById(id)!;
    const rest =
      parseFloat(getComputedStyle(document.documentElement).scrollPaddingTop) +
      parseFloat(getComputedStyle(section).scrollMarginTop);
    return Math.abs(section.getBoundingClientRect().top - rest);
  }, id);
}

/** Whether the next wheel event gets taken over (Lenis cancels it and glides). */
function nextWheelTakenOver(page: Page) {
  return page.evaluate(
    () =>
      new Promise<boolean>((resolve) =>
        window.addEventListener("wheel", (e) => resolve(e.defaultPrevented), { once: true, passive: true })
      )
  );
}

test.describe("smooth scroll", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/about");
    await expect(page.locator("html")).toHaveClass(LENIS);
    await page.mouse.move(640, 400);
  });

  test("a wheel turn glides rather than jumps", async ({ page }) => {
    const takenOver = nextWheelTakenOver(page);
    const recorded = await recordScroll(page);
    await page.mouse.wheel(0, 600);
    expect(await takenOver).toBe(true);
    const ys = await recorded();
    // Many frames on the way, then at rest where the wheel pointed.
    expect(ys.filter((y) => y > 5 && y < 595).length).toBeGreaterThan(4);
    expect(Math.round(ys.at(-1)!)).toBe(600);
  });

  test("reduced motion hands scrolling back to the browser", async ({ page }) => {
    await page.emulateMedia({ reducedMotion: "reduce" });
    await expect(page.locator("html")).not.toHaveClass(LENIS);
    const takenOver = nextWheelTakenOver(page);
    await page.mouse.wheel(0, 600);
    expect(await takenOver).toBe(false);
    await expect.poll(() => page.evaluate(() => Math.round(window.scrollY))).toBe(600);
  });

  test("the open menu holds the page still", async ({ page }) => {
    // The menu button shows below the md breakpoint (768px).
    await page.setViewportSize({ width: 600, height: 900 });
    await page.getByRole("button", { name: "Open menu" }).click();
    await page.mouse.move(300, 450);
    await page.mouse.wheel(0, 600);
    await page.waitForTimeout(1200);
    expect(await page.evaluate(() => window.scrollY)).toBe(0);

    await page.getByRole("button", { name: "Close menu" }).click();
    await page.mouse.wheel(0, 600);
    await expect.poll(() => page.evaluate(() => window.scrollY)).toBeGreaterThan(100);
  });

  test("a link clicked mid-glide opens the next page at the top", async ({ page }) => {
    await page.mouse.wheel(0, 2400);
    await expect(page.locator("html")).toHaveClass(/lenis-smooth/);
    await page.locator('header a[href="/work"]').first().click();
    await page.waitForURL(/\/work$/);
    await page.waitForTimeout(1200);
    expect(await page.evaluate(() => window.scrollY)).toBeLessThan(5);
  });

  test("going back mid-glide leaves the previous page where it was", async ({ page }) => {
    await page.locator('header a[href="/work"]').first().click();
    await page.waitForURL(/\/work$/);
    await page.mouse.wheel(0, 2400);
    await expect(page.locator("html")).toHaveClass(/lenis-smooth/);
    await page.goBack();
    await page.waitForURL(/\/about$/);
    await page.waitForTimeout(1200);
    expect(await page.evaluate(() => window.scrollY)).toBeLessThan(5);
  });

  test("same-page links glide to their section", async ({ page }) => {
    await page.goto("/privacy");
    await expect(page.locator("html")).toHaveClass(LENIS);
    const link = page.locator('main a[href^="#"]').nth(3);
    const hash = (await link.getAttribute("href"))!;
    await link.scrollIntoViewIfNeeded();
    const recorded = await recordScroll(page, 2500);
    await link.click();
    const ys = await recorded();
    expect(ys.filter((y) => y > 5 && y < ys.at(-1)! - 5).length).toBeGreaterThan(4);
    await expect(page).toHaveURL(new RegExp(`${hash}$`));
    expect(await offFromRest(page, hash.slice(1))).toBeLessThan(2);
  });

  test("tapping a capability glides to it and moves focus there", async ({ page }) => {
    await page.goto("/services");
    await expect(page.locator("html")).toHaveClass(LENIS);
    const recorded = await recordScroll(page, 2500);
    await page.getByRole("navigation", { name: "Capabilities on this page" }).locator('a[href="#systems"]').click();
    const ys = await recorded();
    expect(ys.filter((y) => y > 5 && y < ys.at(-1)! - 5).length).toBeGreaterThan(4);
    await expect(page).toHaveURL(/#systems$/);
    expect(await offFromRest(page, "systems")).toBeLessThan(2);
    expect(await page.evaluate(() => document.activeElement?.id)).toBe("systems");
  });

  test("a same-page link made with Next's Link glides too", async ({ page }) => {
    await page.goto("/services");
    await expect(page.locator("html")).toHaveClass(LENIS);
    const link = page.locator('footer a[href="/services#growth"]');
    await link.scrollIntoViewIfNeeded();
    await page.waitForTimeout(500);
    const recorded = await recordScroll(page, 2500);
    await link.click();
    const ys = await recorded();
    expect(ys.filter((y) => y < ys[0] - 5 && y > ys.at(-1)! + 5).length).toBeGreaterThan(4);
    await expect(page).toHaveURL(/\/services#growth$/);
    expect(await offFromRest(page, "growth")).toBeLessThan(2);
  });

  test("contents links land on their heading while article images load", async ({ page }) => {
    await page.goto("/journal");
    const article = await page
      .locator('main a[href^="/journal/"]')
      .evaluateAll((links) => links.map((a) => a.getAttribute("href")!).find((href) => href.split("/").length === 3));
    test.skip(!article, "no published articles");
    await page.goto(article!);
    const contents = page.getByRole("navigation", { name: "Table of contents" }).locator('a[href^="#"]');
    test.skip((await contents.count()) < 4, "article too short for a contents list");
    const id = (await contents.nth(3).getAttribute("href"))!.slice(1);
    await contents.nth(3).click();
    await expect.poll(() => offFromRest(page, id), { timeout: 6_000 }).toBeLessThan(2);
  });
});
