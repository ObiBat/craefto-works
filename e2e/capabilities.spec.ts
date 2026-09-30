import { test, expect } from "./fixtures";

// The five capabilities (content/capabilities.ts) on /services and wherever
// the site summarises them.

const NAMES = ["Brand", "Product", "Systems", "Media", "Growth"];

test.describe("capabilities", () => {
  test("the page sets out the five capabilities, in order, each one reachable", async ({ page }) => {
    await page.goto("/services");
    await expect(page.getByRole("heading", { level: 1 })).toHaveText("Capabilities");

    const sections = page.locator("main h2[data-section-number]");
    const overview = page.getByRole("navigation", { name: "Capabilities on this page" }).getByRole("link");
    await expect(sections).toHaveCount(NAMES.length);
    await expect(overview).toHaveCount(NAMES.length);
    for (const [index, name] of NAMES.entries()) {
      await expect(sections.nth(index)).toHaveAttribute("data-section", name);
      const target = await overview.nth(index).getAttribute("href");
      await expect(page.locator(`main h2${target}`)).toHaveText(new RegExp(name));
    }
  });

  test("an old service anchor lands on the capability that covers it", async ({ page }) => {
    await page.goto("/services#ai");
    await expect(page).toHaveURL(/\/services#systems$/);
    await expect
      .poll(() => page.evaluate(() => Math.round(document.getElementById("systems")!.getBoundingClientRect().top)), { timeout: 8_000 })
      .toBeLessThan(200);
  });

  test("an enquiry can start from a capability", async ({ page }) => {
    await page.goto("/contact?service=media");
    const projectType = page.locator("#projectType");
    await expect(projectType).toHaveValue("media");
    const groups = await projectType.locator("optgroup").evaluateAll((els) => els.map((el) => el.getAttribute("label")));
    expect(groups).toEqual(NAMES);
  });

  test("a monthly plan opens the enquiry with the plan filled in", async ({ page }) => {
    await page.goto("/services");
    await page.getByRole("link", { name: "Start with Studio" }).click();
    await page.waitForURL(/\/contact\?plan=studio$/);
    await expect(page.locator("#budget")).toHaveValue("monthly");
    await expect(page.locator("#message")).toHaveValue(/Studio plan/);
    await expect(page.getByText(/Monthly plans run A\$/)).toBeVisible();
  });

  test("the navigation, home page and footer use the same five", async ({ page }) => {
    await page.goto("/");
    await expect(page.locator('header a[href="/services"]').first()).toContainText("Capabilities");

    const accordion = page.locator("main button[aria-controls]");
    await expect(accordion).toHaveCount(NAMES.length);
    for (const [index, name] of NAMES.entries()) await expect(accordion.nth(index)).toContainText(name);

    const footer = page.getByRole("navigation", { name: "Capabilities", exact: true }).getByRole("link");
    await expect(footer).toHaveText(NAMES);
  });
});
