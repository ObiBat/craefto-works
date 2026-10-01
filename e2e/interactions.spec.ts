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

  test("a plan lights up like a hovered one: by hover, or on a phone in mid-screen", async ({ page, isMobile }) => {
    await page.goto("/services");
    const cards = page.locator("li.plan-card");
    const on = (index: number) => cards.nth(index).evaluate((card) => getComputedStyle(card).getPropertyValue("--on").trim());
    // Put the second plan across the middle of the screen.
    await cards.nth(1).evaluate((card) => {
      const box = card.getBoundingClientRect();
      window.scrollTo(0, window.scrollY + box.top + box.height / 2 - window.innerHeight / 2);
    });

    if (isMobile) {
      await expect.poll(() => on(1)).toBe("1");
      expect(await on(0)).toBe("0");
    } else {
      // Scrolling alone lights nothing where there's hover.
      await page.mouse.move(1, 1);
      await page.waitForTimeout(300);
      expect(await on(1)).toBe("0");
      await cards.nth(1).hover();
      await expect.poll(() => on(1)).toBe("1");
    }
  });

  test("the capability in the middle of the screen is lit, one at a time", async ({ page }) => {
    await page.goto("/services");
    const sections = page.locator("section.capability");
    const lit = () => sections.evaluateAll((all) => all.filter((s) => s.hasAttribute("data-spotlight")).map((s) => s.getAttribute("aria-labelledby")));
    for (const id of ["product", "media"]) {
      await page.locator(`#${id}`).evaluate((heading) => {
        const box = heading.closest("section")!.getBoundingClientRect();
        window.scrollTo(0, window.scrollY + box.top + Math.min(box.height, window.innerHeight) / 2 - window.innerHeight / 2);
      });
      await expect.poll(lit).toEqual([id]);
    }
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
