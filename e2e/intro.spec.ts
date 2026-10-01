import { test, expect } from "./fixtures";

const classes = (page: import("@playwright/test").Page) => page.evaluate(() => document.documentElement.className);

test.describe("logo intro", () => {
  test("home: the construction intro plays on a full load, then hands over to the header logo", async ({ page }) => {
    await page.goto("/", { waitUntil: "domcontentloaded" });
    expect(await classes(page)).toContain("logo-intro-home");
    await expect.poll(() => classes(page), { timeout: 8_000 }).not.toContain("logo-intro-home");
    await expect
      .poll(() => page.locator(".site-header .logo-link").first().evaluate((el) => getComputedStyle(el).opacity))
      .toBe("1");
  });

  test("leaving the home page mid-intro ends it", async ({ page }) => {
    await page.goto("/", { waitUntil: "load" });
    await page.locator('.site-header a[href="/about"]').first().click();
    await page.waitForURL("**/about");
    await expect.poll(() => classes(page)).not.toMatch(/logo-intro|intro-delay/);
  });

  test.describe("on a short phone screen", () => {
    test.use({ viewport: { width: 375, height: 629 } });

    // The hero figures sit near the bottom edge there. They used to wait to be
    // marked in view, which happened only once they rose in after the intro,
    // and then they sat on 0 for the whole intro delay (2.9s on an iPhone mini).
    test("the hero figures count with the entrance, not when scrolled to", async ({ page }) => {
      await page.goto("/", { waitUntil: "load" });
      // Well inside the 3s intro, so a counter still waiting to be seen fails.
      await expect
        .poll(() => page.evaluate(() => document.getAnimations().find((a) => a.animationName === "count-up")?.playState), {
          timeout: 1_000,
        })
        .toBe("running");
    });
  });

  test("other pages draw the header logo in place", async ({ page }) => {
    await page.goto("/about", { waitUntil: "domcontentloaded" });
    const onLoad = await classes(page);
    expect(onLoad).toContain("logo-intro");
    expect(onLoad).not.toContain("logo-intro-home");
    await expect.poll(() => classes(page), { timeout: 5_000 }).not.toContain("logo-intro");
  });
});
