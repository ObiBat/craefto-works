import { test, expect } from "./fixtures";

// Case studies (content/case-studies.ts): where they're listed, and the photo
// shoot layout.

test.describe("case studies", () => {
  test("the Nowuknow shoot is the oldest on /work and stays off the home page", async ({ page }) => {
    await page.goto("/work");
    await expect(page.locator('main a[href^="/work/"]').last()).toHaveAttribute("href", "/work/nowuknow");

    await page.goto("/");
    await expect(page.locator('a[href="/work/nowuknow"]')).toHaveCount(0);
  });

  test("the Media capability links to the shoot", async ({ page }) => {
    await page.goto("/services");
    await expect(page.locator('section[aria-labelledby="media"] a[href="/work/nowuknow"]')).toHaveCount(1);
  });

  test("a photo shoot shows its photographs by setup and links to Instagram", async ({ page }) => {
    await page.goto("/work/nowuknow");
    await expect(page.getByRole("heading", { level: 1 })).toHaveText("Nowuknow");
    await expect(page.locator("main figure")).toHaveCount(7);
    await expect(page.locator("main figure img")).toHaveCount(16);
    await expect(page.getByRole("link", { name: /Nowuknow on Instagram/ }).first()).toHaveAttribute(
      "href",
      "https://www.instagram.com/nowuknow.syd/"
    );
  });
});
