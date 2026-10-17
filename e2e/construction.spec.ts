import { test, expect } from "./fixtures";

// Construction Operations & AI Integration (/solutions/construction), an
// industry solution within Systems. Nothing here sends an enquiry, so these
// are safe to run against production.
test.describe("construction operations", () => {
  test("the page sets out the offer and leads to an enquiry with construction chosen", async ({ page }) => {
    await page.goto("/solutions/construction");
    await expect(page.getByRole("heading", { level: 1 })).toHaveText("Construction Operations, Connected.");
    await expect(page.locator(".construction-includes > li")).toHaveCount(6);
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

  test("the page is in English only, and the hero previews the workflow", async ({ page }) => {
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.goto("/solutions/construction");
    const main = page.locator("main");
    await expect(main).not.toContainText(/Mongolian|[\u0400-\u04FF]/);
    await expect(main.locator('[lang="mn"]')).toHaveCount(0);
    // The hero's preview: today's tools, scattered, feeding one system, then one line out through a
    // person's approval to the crew and payroll; it leads to the full flow.
    const preview = page.locator("figure.fp");
    await expect(preview.locator(".hf-tool")).toHaveCount(6);
    await expect(preview.locator('[data-node="hub"]')).toHaveCount(1);
    await expect(preview.locator(".flow-node")).toHaveCount(3);
    await expect(preview.getByRole("link", { name: "See the full workflow" })).toHaveAttribute("href", "#how-it-works");
    await expect(preview.getByRole("button")).toHaveCount(0);
  });

  test("the hero's preview plays, and pauses", async ({ page }) => {
    await page.goto("/solutions/construction");
    const preview = page.locator("figure.fp");
    await expect(preview.locator(".flow-svg")).toHaveAttribute("data-playing", "", { timeout: 15_000 });
    await preview.getByRole("button", { name: "Pause the animation" }).click();
    await expect(preview.locator(".flow-svg")).not.toHaveAttribute("data-playing");
    await preview.getByRole("button", { name: "Play the animation" }).click();
    await expect(preview.locator(".flow-svg")).toHaveAttribute("data-playing", "");
  });

  test.describe("the information flow", () => {
    const STAGES = [
      "Jobs and sites",
      "Workforce scheduling",
      "Supervisor approval",
      "Crew notifications and attendance",
      "Timesheet approval and job costing",
      "Day hire",
      "Payroll and accounts",
    ];

    test("still, it shows the whole system, and each stage explains itself", async ({ page }) => {
      await page.emulateMedia({ reducedMotion: "reduce" });
      await page.goto("/solutions/construction");
      const flow = page.locator("figure.flow");
      await expect(flow).toHaveAttribute("data-mode", "still");
      for (const name of STAGES) await expect(flow.getByRole("button", { name, exact: true })).toBeVisible();
      // The software round each stage: nineteen tools, WhatsApp and Gmail at two stages each.
      await expect(flow.locator(".flow-app")).toHaveCount(21);
      // Nothing moves, so there's nothing to pause.
      await expect(flow.getByRole("button", { name: /Pause the animation|Play the animation/ })).toHaveCount(0);
      // A stage describes itself on focus.
      await flow.getByRole("button", { name: "Day hire", exact: true }).focus();
      await expect(page.getByRole("tooltip")).toContainText("Facebook doesn’t let apps post in groups");
      await page.keyboard.press("Escape");
      await expect(page.getByRole("tooltip")).toHaveCount(0);
    });

    test("on a laptop screen, it fits in view", async ({ page }) => {
      await page.setViewportSize({ width: 1440, height: 900 });
      await page.emulateMedia({ reducedMotion: "reduce" });
      await page.goto("/solutions/construction");
      const box = await page.locator("figure.flow").boundingBox();
      expect(box!.height).toBeLessThan(700);
    });

    test("playing, the signal goes round a day at a time, and pauses", async ({ page }) => {
      await page.goto("/solutions/construction");
      const flow = page.locator("figure.flow");
      await flow.scrollIntoViewIfNeeded();
      await page.mouse.move(2, 2);
      await expect(flow.locator(".flow-svg")).toHaveAttribute("data-playing", "", { timeout: 15_000 });
      // Monday, then the ring comes round to Tuesday.
      await expect(flow.locator('[data-day="1"]')).toHaveAttribute("data-state", "on", { timeout: 20_000 });
      await expect(flow.locator('[data-day="0"]')).toHaveAttribute("data-state", "done");
      // Pause holds it where it is; play carries on.
      await flow.getByRole("button", { name: "Pause the animation" }).click();
      await expect(flow.locator(".flow-svg")).not.toHaveAttribute("data-playing");
      await flow.getByRole("button", { name: "Play the animation" }).click();
      await expect(flow.locator(".flow-svg")).toHaveAttribute("data-playing", "");
    });

    test.describe("on a phone", () => {
      test.use({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });

      test("it has its own layout that fits the screen", async ({ page }) => {
        await page.goto("/solutions/construction");
        const flow = page.locator("figure.flow");
        await expect(flow).toHaveAttribute("data-layout", "narrow");
        const stage = await flow.locator(".flow-stage").boundingBox();
        expect(stage!.width).toBeLessThanOrEqual(390);
        expect(stage!.height).toBeLessThan(600);
        // A tap shows what a stage does (in view first, in one jump: the site scrolls smoothly).
        await flow.evaluate((element) => window.scrollTo({ top: element.getBoundingClientRect().top + window.scrollY - 60, behavior: "instant" }));
        await flow.getByRole("button", { name: "Supervisor approval", exact: true }).click();
        await expect(page.getByRole("tooltip")).toContainText("A supervisor reviews each recommendation");
      });
    });
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
