import { test, expect } from "./fixtures";

// Construction Operations & AI Integration (/solutions/construction), an
// industry solution within Systems. Nothing here sends an enquiry, so these
// are safe to run against production.
test.describe("construction operations", () => {
  test("the page sets out the offer and leads to an enquiry with construction chosen", async ({ page }) => {
    await page.goto("/solutions/construction");
    await expect(page.getByRole("heading", { level: 1 })).toHaveText("Construction Operations, Connected.");
    await expect(page.locator(".construction-includes > li")).toHaveCount(6);
    // People approve: two steps wait for a supervisor and payroll for the office.
    await expect(page.getByText("Supervisor approves")).toHaveCount(2);
    await expect(page.getByText("Office signs off")).toHaveCount(1);
    // Three ways to start, the project prices marked as indicative.
    await expect(page.locator("li.plan-card")).toHaveCount(3);
    // (Each header has a decorative copy for the hover; count the real ones.)
    await expect(page.locator(".plan-card-head > p > .plan-label", { hasText: "Indicative price" })).toHaveCount(2);
    await expect(page.getByRole("link", { name: /Read the Artisan case study/ })).toHaveAttribute("href", "/work/artisan");

    await page.getByRole("link", { name: "Discuss Your Operations" }).first().click();
    await page.waitForURL(/\/contact\?service=construction$/);
    await expect(page.locator('input[name="capability"][value="systems"]')).toBeChecked();
    await expect(page.getByRole("radio", { name: "Construction operations" })).toBeChecked();
    await expect(page.getByLabel("Trade")).toBeVisible();
    await expect(page.getByLabel("Preferred language")).toBeVisible();
  });

  test("the construction questions are optional and only on construction enquiries", async ({ page }) => {
    await page.goto("/contact");
    await page.locator('label:has(input[name="capability"][value="brand"])').click();
    await expect(page.locator('input[name="projectType"]')).toHaveValue("brand");
    await expect(page.getByLabel("Trade")).toHaveCount(0);

    // Systems starts on software and automation, then construction adds the questions, none of them required.
    await page.locator('label:has(input[name="capability"][value="systems"])').click();
    await expect(page.locator('input[name="projectType"]')).toHaveValue("ai");
    await expect(page.getByLabel("Trade")).toHaveCount(0);
    await page.getByRole("radio", { name: "Construction operations" }).check({ force: true });
    await expect(page.locator('input[name="projectType"]')).toHaveValue("construction");
    for (const label of ["Trade", "Workforce size", "Active sites", "Preferred language", "Current scheduling and accounting tools", "Biggest operational bottleneck"]) {
      const field = page.getByLabel(label);
      await expect(field).toBeVisible();
      await expect(field).not.toHaveAttribute("required");
    }
    await expect(page.getByLabel("Preferred language").locator("option")).toHaveText(["No preference", "English", "Mongolian (Монгол)"]);
  });

  test("Systems on the home and services pages links to it, quietly", async ({ page }) => {
    await page.goto("/");
    const toggle = page.locator("button[aria-controls]", { hasText: "Systems" });
    await toggle.scrollIntoViewIfNeeded();
    await toggle.click();
    const panel = page.locator(`[id="${await toggle.getAttribute("aria-controls")}"]`);
    await expect(panel.getByRole("link", { name: /Construction operations/ })).toHaveAttribute("href", "/solutions/construction");
    // Only Systems carries an industry solution.
    await expect(page.getByRole("link", { name: /Construction operations/, includeHidden: true })).toHaveCount(1);

    await page.goto("/services");
    const systems = page.locator('section[aria-labelledby="systems"]');
    await expect(systems.getByRole("link", { name: /Construction operations/ })).toHaveAttribute("href", "/solutions/construction");
    // Small automations and larger custom systems are told apart beside their prices.
    await expect(systems.getByText(/^Smaller projects:/)).toBeVisible();
    await expect(systems.getByText(/^Larger custom systems:/)).toBeVisible();
  });
});
