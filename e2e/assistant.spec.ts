import { test, expect } from "./fixtures";

// Ask Craefto, the website assistant. Opening the panel sends nothing to the
// AI and saves nothing, so these are safe to run against production.
test.describe("Ask Craefto", () => {
  test("opens from a page, says it's an AI, and closes with Escape", async ({ page }) => {
    await page.goto("/");
    const launcher = page.getByRole("button", { name: "Ask Craefto" });
    await launcher.click();
    const dialog = page.getByRole("dialog", { name: "Ask Craefto" });
    await expect(dialog).toBeVisible();
    await expect(dialog.getByText("AI assistant", { exact: true })).toBeVisible();
    await expect(dialog.getByText(/Obi, who reads every enquiry/)).toBeVisible();
    await expect(page.getByLabel("Your message")).toBeFocused();
    await page.keyboard.press("Escape");
    await expect(dialog).toBeHidden();
    await expect(launcher).toBeFocused();
  });

  test("isn't on the admin pages", async ({ page }) => {
    await page.goto("/admin");
    await expect(page.getByRole("button", { name: "Ask Craefto" })).toHaveCount(0);
  });

  test("the chat API refuses requests it can't read", async ({ request }) => {
    // 400 for a bad request; 403 where BotID, on Vercel, turns away a request that isn't from the page.
    const status = (await request.post("/api/assistant", { data: { id: "not-a-chat" } })).status();
    expect([400, 403]).toContain(status);
    expect((await request.get("/api/assistant?id=not-a-chat")).status()).toBe(404);
  });
});
