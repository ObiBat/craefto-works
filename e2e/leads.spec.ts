import { test, expect } from "./fixtures";

// The ways into the sales pipeline (src/lib/leads.ts). These send only what
// the site must refuse (or the honeypot, which stores nothing), so they never
// create a lead or send an email, and are safe to run against production.
test.describe("lead intake", () => {
  test("the enquiry API refuses what it can't use, with a reason", async ({ request }) => {
    const cases: Array<[Record<string, unknown> | string, RegExp]> = [
      [{ name: "x".repeat(150), email: "a@example.com" }, /name is too long/],
      [{ name: "Ann", email: "not-an-email" }, /valid email/],
      [{ email: "a@example.com" }, /your name/],
      [{ name: "Ann", email: "a@example.com", message: "x".repeat(5001) }, /under 5,000 characters/],
      ["not json", /check the form/],
    ];
    for (const [body, reason] of cases) {
      const res = await request.post("/api/leads", typeof body === "string" ? { data: body, headers: { "content-type": "application/json" } } : { data: body });
      expect(res.status(), JSON.stringify(body).slice(0, 60)).toBe(400);
      expect((await res.json()).error).toMatch(reason);
    }
  });

  test("bots that fill the hidden field are told it worked", async ({ request }) => {
    const res = await request.post("/api/leads", { data: { name: "Bot", email: "bot@example.com", website_url: "https://spam.example" } });
    expect(res.status()).toBe(200);
    expect(await res.json()).toMatchObject({ success: true, id: "honeypot" });
  });

  test("the booking webhook refuses unsigned calls", async ({ request }) => {
    const res = await request.post("/api/cal/webhook", { data: { triggerEvent: "BOOKING_CREATED", payload: { attendees: [{ email: "a@example.com" }] } } });
    expect(res.status()).toBe(401);
  });
});
