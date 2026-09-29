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

  test("other pages draw the header logo in place", async ({ page }) => {
    await page.goto("/about", { waitUntil: "domcontentloaded" });
    const onLoad = await classes(page);
    expect(onLoad).toContain("logo-intro");
    expect(onLoad).not.toContain("logo-intro-home");
    await expect.poll(() => classes(page), { timeout: 5_000 }).not.toContain("logo-intro");
  });
});
