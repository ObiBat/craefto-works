import { test, expect } from "./fixtures";

// The outreach opt-out (src/app/optout, api/optout). These only use missing or
// forged links, so nobody is opted out: safe to run against production.
test.describe("outreach opt-out", () => {
  test("a missing or forged link says so and offers another way", async ({ page }) => {
    for (const url of ["/optout", "/optout?t=forged.token"]) {
      await page.goto(url);
      await expect(page.getByRole("heading", { level: 1 })).toContainText("This link didn't work");
      await expect(page.getByText(/reply "no thanks"/)).toBeVisible();
      await expect(page.getByRole("button", { name: "Stop emails" })).toHaveCount(0);
    }
  });

  test("the one-click endpoint refuses a forged link", async ({ request }) => {
    const res = await request.post("/api/optout?t=forged.token", { form: { "List-Unsubscribe": "One-Click" } });
    expect(res.status()).toBe(400);
  });

  test("visiting the link only opens the page (link scanners can't opt anyone out)", async ({ request }) => {
    const res = await request.get("/api/optout?t=forged.token", { maxRedirects: 0 });
    expect(res.status()).toBe(303);
    expect(res.headers()["location"]).toContain("/optout?t=forged.token");
  });

  test("the sender's clock refuses anyone without the cron secret", async ({ request }) => {
    expect((await request.get("/api/cron/outreach")).status()).toBe(401);
    expect((await request.get("/api/cron/outreach", { headers: { authorization: "Bearer guess" } })).status()).toBe(401);
  });
});
