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
    const choices = page.locator('input[name="capability"]');
    // The form renders once the page hydrates (it reads the address), so wait
    // for it before reading the choices: the five capabilities, equally, then
    // "a mix".
    await expect(choices).toHaveCount(NAMES.length + 1);
    expect(await choices.evaluateAll((els) => els.map((el) => (el as HTMLInputElement).value))).toEqual([...NAMES.map((name) => name.toLowerCase()), "other"]);
    for (const name of NAMES) await expect(page.getByRole("radio", { name: new RegExp(`^\\d{2}\\s*${name}`) })).toHaveCount(1);
    await expect(page.locator('input[name="capability"][value="media"]')).toBeChecked();
    await expect(page.locator('input[name="projectType"]')).toHaveValue("media");
  });

  test("a Product enquiry asks whether it's a website or an app", async ({ page }) => {
    await page.goto("/contact");
    await page.locator('label:has(input[name="capability"][value="product"])').click();
    await expect(page.locator('input[name="projectType"]')).toHaveValue("web");
    await page.locator('label:has(input[name="projectTypeDetail"][value="saas"])').click();
    await expect(page.locator('input[name="projectType"]')).toHaveValue("saas");
    // The prompt follows the choice.
    await expect(page.locator("#message")).toHaveAttribute("placeholder", /who is it for/);
  });

  test("case studies filter by capability, and the address keeps the filter", async ({ page }) => {
    await page.goto("/work?capability=media");
    const media = page.getByRole("radio", { name: /Media/ });
    await expect(media).toHaveAttribute("aria-checked", "true");
    await expect(page.locator('main a[href="/work/nowuknow"]')).toHaveCount(1);
    await expect(page.locator('main a[href="/work/tactix"]')).toHaveCount(0);
    await page.getByRole("radio", { name: /All work/ }).click();
    await expect(page.locator('main a[href="/work/tactix"]')).toHaveCount(1);
    await expect(page).toHaveURL(/\/work$/);
  });

  test("the process shows each stage for the chosen capability", async ({ page }) => {
    await page.goto("/process");
    const stages = page.locator("main li.phase");
    await expect(stages).toHaveCount(6);
    await expect(stages.first().getByRole("heading", { level: 2 })).toHaveText("Discover");
    await page.getByRole("radio", { name: /Media/ }).click();
    await expect(page).toHaveURL(/\/process\?for=media$/);
    await expect(page.locator("#build")).toContainText("The shoot or the recording");
  });

  test("a monthly plan opens its start page, and from there the enquiry with the plan filled in", async ({ page }) => {
    await page.goto("/services");
    await page.locator('li.plan-card a[href="/subscribe/studio"]').click();
    await page.waitForURL(/\/subscribe\/studio$/);
    await page.getByRole("link", { name: "Or send us a message", exact: true }).click();
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
