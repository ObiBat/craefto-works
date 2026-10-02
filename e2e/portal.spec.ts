import { test, expect } from "./fixtures";

// The client portal and the Stripe webhook, from the outside. These only read
// and expect refusals (no checkout, no email, no writes), so they are safe to
// run against production.
test.describe("client portal", () => {
  for (const path of ["/portal", "/portal/requests", "/portal/requests/new", "/portal/messages", "/portal/calls", "/portal/billing"]) {
    test(`${path} asks a visitor to sign in`, async ({ page }) => {
      await page.goto(path);
      await page.waitForURL(/\/portal\/login$/);
      await expect(page.getByRole("heading", { name: "Sign in" })).toBeVisible();
    });
  }

  test("the sign-in page stays out of search and works without errors", async ({ page, consoleErrors }) => {
    await page.goto("/portal/login");
    await expect(page.locator('meta[name="robots"]')).toHaveAttribute("content", /noindex/);
    await expect(page.getByLabel("Email")).toBeVisible();
    expect(consoleErrors).toEqual([]);
  });

  test("a sign-in link is offered the same way for any address", async ({ page }) => {
    // The reply never says whether an address is a client's.
    await page.goto("/portal/login");
    await page.getByLabel("Email").fill("not-a-client@example.com");
    await page.getByRole("button", { name: "Email me a sign-in link" }).click();
    await page.waitForURL(/\/portal\/login\?sent=1/);
    await expect(page.getByRole("heading", { name: "Check your email" })).toBeVisible();
  });

  test("a used or broken sign-in link asks for a fresh one", async ({ page }) => {
    await page.goto("/portal/auth/confirm?token_hash=not-a-token&type=magiclink");
    await page.waitForURL(/\/portal\/login\?expired=1$/);
    await expect(page.getByText("That link has expired or was already used.")).toBeVisible();
  });

  test("a plan's start page asks for the terms before checkout, offers a call and stays out of search", async ({ page, request }) => {
    await page.goto("/subscribe/studio");
    await expect(page.getByRole("heading", { name: "Start your Studio plan" })).toBeVisible();
    await expect(page.getByRole("heading", { name: "What's included" })).toBeVisible();
    await expect(page.getByRole("heading", { name: "The plan terms" })).toBeVisible();

    // Paying without agreeing sends nothing: the page explains instead.
    await page.getByRole("button", { name: "Continue to payment" }).click();
    await expect(page.getByText("Tick the box to agree to the plan terms first.")).toBeVisible();
    await expect(page).toHaveURL(/\/subscribe\/studio$/);
    await expect(page.getByRole("checkbox")).toBeFocused();

    // Or talk first: the Discovery Call, with the plan written in.
    await expect(page.getByRole("link", { name: "Book a call", exact: true })).toHaveAttribute(
      "href",
      /^https:\/\/cal\.com\/craefto\/discovery-call\?.*Studio\+plan/,
    );
    await expect(page.locator('meta[name="robots"]')).toHaveAttribute("content", /noindex/);
    expect((await request.get("/subscribe/not-a-plan")).status()).toBe(404);
  });

  test("the checkout return page without a session goes to sign-in", async ({ page }) => {
    await page.goto("/portal/welcome");
    await page.waitForURL(/\/portal\/login$/);
  });

  test("signing out only happens by form", async ({ request }) => {
    expect((await request.get("/portal/signout", { maxRedirects: 0 })).status()).toBe(405);
  });

  test("the members admin API refuses anonymous requests", async ({ request }) => {
    const nobody = "00000000-0000-0000-0000-000000000000";
    expect((await request.get("/api/admin/members")).status()).toBe(401);
    expect((await request.post(`/api/admin/members/${nobody}/messages`, { data: { body: "hi" } })).status()).toBe(401);
    expect((await request.post(`/api/admin/members/${nobody}/files`, { data: { files: [] } })).status()).toBe(401);
    expect((await request.get(`/api/admin/members/files/${nobody}`, { maxRedirects: 0 })).status()).toBe(401);
  });

  test("shared files need the client signed in", async ({ request }) => {
    const res = await request.get("/portal/files/00000000-0000-0000-0000-000000000000", { maxRedirects: 0 });
    expect(res.status()).toBe(307);
    expect(res.headers().location).toContain("/portal/login");
  });

  test("the Cal.com webhook refuses unsigned events", async ({ request }) => {
    const res = await request.post("/api/cal/webhook", {
      headers: { "x-cal-signature-256": "forged" },
      data: { triggerEvent: "BOOKING_CREATED", payload: { uid: "forged" } },
    });
    // 401 with a secret set; 400 where the webhook isn't configured yet.
    expect([400, 401]).toContain(res.status());
  });

  test("the Stripe webhook refuses unsigned events", async ({ request }) => {
    const res = await request.post("/api/stripe/webhook", {
      data: { type: "checkout.session.completed", data: { object: { id: "cs_test_forged", mode: "subscription" } } },
    });
    expect(res.status()).toBe(400);
  });
});
