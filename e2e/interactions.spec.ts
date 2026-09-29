import { test, expect } from "./fixtures";

test.describe("interactions", () => {
  test("the services accordion opens and closes", async ({ page }) => {
    await page.goto("/");
    const toggle = page.locator("button[aria-controls]").first();
    const panel = page.locator(`[id="${await toggle.getAttribute("aria-controls")}"]`);
    await toggle.scrollIntoViewIfNeeded();
    await expect(toggle).toHaveAttribute("aria-expanded", "false");

    await toggle.click();
    await expect(toggle).toHaveAttribute("aria-expanded", "true");
    await expect.poll(() => panel.evaluate((el) => el.getBoundingClientRect().height)).toBeGreaterThan(100);
    expect(await panel.evaluate((el) => (el as HTMLElement).inert)).toBe(false);

    await toggle.click();
    await expect(toggle).toHaveAttribute("aria-expanded", "false");
    await expect.poll(() => panel.evaluate((el) => el.getBoundingClientRect().height)).toBeLessThan(2);
  });

  test("the contact form switches to a quick message", async ({ page }) => {
    await page.goto("/contact");
    await page.getByRole("button", { name: "Quick message" }).click();
    await expect(page.locator("#quick-email")).toBeVisible();
    await expect(page.locator("#quick-message")).toBeVisible();
  });

  test("back to top appears only after scrolling", async ({ page }) => {
    await page.goto("/");
    const button = page.getByRole("button", { name: "Back to top" });
    await expect(button).toBeHidden();
    await page.evaluate(() => window.scrollTo(0, window.innerHeight * 3));
    await expect(button).toBeVisible();
    await button.click();
    await expect.poll(() => page.evaluate(() => window.scrollY), { timeout: 5_000 }).toBeLessThan(10);
  });
});
