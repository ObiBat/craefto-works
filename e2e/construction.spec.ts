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
    // The hero's preview rests on the finished flow and leads to the full one.
    const preview = page.locator("figure.fp");
    await expect(preview.locator(".fp-row")).toHaveCount(6);
    await expect(preview.locator('.fp-row[data-row="approval"]')).toHaveAttribute("data-state", "done");
    await expect(preview.getByRole("link", { name: "See the full workflow" })).toHaveAttribute("href", "#how-it-works");
    await expect(preview.getByRole("button")).toHaveCount(0);
  });

  test.describe("the workflow graph", () => {
    const card = (page: import("@playwright/test").Page, id: string) => page.locator(`.wf-node[data-node="${id}"]`);
    const APPS = [
      "Procore", "Google Drive", "Microsoft Excel", "Google Sheets", "Assignar", "Deputy", "Google Calendar", "Microsoft Outlook",
      "Microsoft Teams", "Slack", "Gmail", "WhatsApp", "Twilio (SMS)", "Google Maps", "HammerTech", "Power BI",
      "Facebook", "Xero", "MYOB", "QuickBooks", "Employment Hero", "Reckon",
    ];

    test("still, it tells the whole week in three layers, with the software at every stage", async ({ page }) => {
      await page.emulateMedia({ reducedMotion: "reduce" });
      await page.goto("/solutions/construction");
      for (const lane of ["Every working day", "When the crew is short", "Weekly or fortnightly"]) {
        await expect(page.getByRole("region", { name: lane })).toBeVisible();
      }
      await expect(page.locator(".wf-node")).toHaveCount(7);
      await expect(page.locator(".wf-days li[data-state=\"done\"]")).toHaveCount(5);
      // At rest, the end of the week: approved, hired for the day, and the pay run sent.
      await expect(card(page, "approval")).toContainText("Approved by the supervisor");
      await expect(card(page, "hire")).toContainText("3 day-hire fixers");
      await expect(card(page, "payroll")).toContainText("Sent to Xero");
      // Every stage connects to real software, by name, and all of it has been reached.
      await expect(page.locator(".wf-apps img")).toHaveCount(27);
      for (const name of APPS) await expect(page.locator(".wf-apps").getByRole("img", { name, exact: true }).first()).toBeVisible();
      await expect(page.locator(".wf-apps[data-lit]")).toHaveCount(7);
      // Nothing plays, and there's nothing for the visitor to approve.
      await expect(page.getByRole("button", { name: /Pause the demo|Play the demo/ })).toHaveCount(0);
      await expect(page.getByRole("button", { name: /Approve/ })).toHaveCount(0);
      // Inspecting a stage opens its description.
      const title = card(page, "scheduling").getByRole("button", { name: /Scheduling/ });
      await title.click();
      await expect(title).toHaveAttribute("aria-pressed", "true");
      await expect(page.getByRole("region", { name: "Stage details" })).toContainText("proposes day hire when the crew is short");
    });

    test("on a laptop screen, the whole graph fits in view", async ({ page }) => {
      await page.setViewportSize({ width: 1440, height: 900 });
      await page.emulateMedia({ reducedMotion: "reduce" });
      await page.goto("/solutions/construction");
      const box = await page.locator(".wf").boundingBox();
      expect(box!.height).toBeLessThan(780);
      // The five daily stages share one row.
      const tops = await page
        .locator('.wf-lane[data-lane="daily"] .wf-node')
        .evaluateAll((nodes) => nodes.map((node) => Math.round(node.getBoundingClientRect().top)));
      expect(tops).toHaveLength(5);
      expect(new Set(tops).size).toBe(1);
    });

    test("playing, the week runs on its own and starts again", async ({ page }) => {
      test.setTimeout(120_000);
      await page.goto("/solutions/construction");
      await page.locator(".wf").scrollIntoViewIfNeeded();
      await page.mouse.move(2, 2);
      await expect(page.getByRole("button", { name: "Pause the demo" })).toBeVisible({ timeout: 20_000 });
      // Tuesday: a person approves the suggestion, with nothing for the visitor to press.
      await expect(card(page, "approval")).toHaveAttribute("data-state", "waiting", { timeout: 30_000 });
      await expect(card(page, "approval")).toHaveAttribute("data-state", "done", { timeout: 10_000 });
      // Thursday: day hire goes out through the casual pool, Facebook and agencies.
      await expect(card(page, "hire")).toHaveAttribute("data-state", "active", { timeout: 40_000 });
      await expect(card(page, "hire").locator(".wf-apps")).toHaveAttribute("data-lit", "");
      // Pause holds the week where it is; play carries on.
      await page.getByRole("button", { name: "Pause the demo" }).click();
      const held = await card(page, "hire").getAttribute("data-state");
      await page.waitForTimeout(3000);
      await expect(card(page, "hire")).toHaveAttribute("data-state", held!);
      await page.getByRole("button", { name: "Play the demo", exact: true }).click();
      // Friday's pay run, then Monday again.
      await expect(card(page, "payroll")).toHaveAttribute("data-state", "done", { timeout: 40_000 });
      await expect(page.locator(".wf-days li").first()).toHaveAttribute("data-state", "current", { timeout: 15_000 });
      await expect(card(page, "payroll")).toHaveAttribute("data-state", "idle");
    });

    test.describe("on a phone", () => {
      test.use({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });

      test("the week plays down one column", async ({ page }) => {
        await page.goto("/solutions/construction");
        await expect(page.locator(".wf-node")).toHaveCount(7);
        await page.locator(".wf").evaluate((element) => {
          window.scrollTo({ top: element.getBoundingClientRect().top + window.scrollY - 80, behavior: "instant" });
        });
        await expect(card(page, "jobs")).toHaveAttribute("data-state", /active|done/, { timeout: 20_000 });
        await expect(page.getByText("Round again the next working day")).toBeVisible();
        await expect(page.getByRole("button", { name: /Approve/ })).toHaveCount(0);
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
