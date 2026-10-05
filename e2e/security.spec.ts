import { test, expect } from "./fixtures";

// The admin API and the analytics reads behind the admin screens must refuse
// anyone without a session (src/proxy.ts). These only ever expect refusals,
// so they are safe to run against production.
test.describe("admin API access", () => {
  const protectedReads = [
    "/api/admin/clients",
    "/api/admin/leads",
    "/api/admin/finances/overview",
    "/api/admin/applications",
    "/api/admin/outreach",
    "/api/admin/outreach?view=summary",
    "/api/admin/outreach/outreach-1",
    "/api/admin/outreach/outreach-1/a-prospect",
    "/api/admin/outreach/settings",
    "/api/admin/outreach/messages",
    "/api/admin/outreach/suppressions",
    "/api/admin/outreach/replies",
    "/api/admin/outreach/replies/00000000-0000-4000-8000-000000000000",
    "/api/admin/chats",
    "/api/admin/chats/00000000-0000-4000-8000-000000000000",
    "/api/analytics/feedback",
    "/api/analytics/ab-test",
    "/api/analytics/article",
  ];

  for (const path of protectedReads) {
    test(`${path} refuses anonymous requests`, async ({ request }) => {
      const res = await request.get(path);
      expect(res.status()).toBe(401);
    });
  }

  // Approving outreach authorises sending: every way to change it is refused without a session or the API token.
  test("outreach changes are refused without a session or the token", async ({ request }) => {
    const reply = "/api/admin/outreach/replies/00000000-0000-4000-8000-000000000000";
    const writes: Array<[string, "post" | "put" | "patch", Record<string, unknown>]> = [
      ["/api/admin/outreach/import", "post", { id: "x", name: "x", description: "", createdAt: "2026-10-04T00:00:00Z", prospects: [] }],
      ["/api/admin/outreach/bulk", "post", { action: "approve", items: [{ campaignId: "outreach-1", id: "a-prospect" }] }],
      ["/api/admin/outreach/outreach-1/a-prospect/status", "post", { action: "approve" }],
      ["/api/admin/outreach/outreach-1/a-prospect/research", "post", { research: {}, event: "x" }],
      ["/api/admin/outreach/outreach-1/a-prospect", "put", { notes: "x" }],
      ["/api/admin/outreach/settings", "put", { mode: "live" }],
      ["/api/admin/outreach/suppressions", "post", { value: "a@example.com" }],
      ["/api/admin/outreach/outreach-1/a-prospect/evidence", "post", { action: "confirm" }],
      [reply, "patch", { label: "opt-out" }],
      [`${reply}/answer`, "post", { body: "x" }],
      [`${reply}/draft`, "post", {}],
      [`${reply}/handover`, "post", {}],
      ["/api/admin/outreach/digest", "post", {}],
    ];
    for (const [path, method, data] of writes) {
      expect((await request[method](path, { data })).status(), path).toBe(401);
      expect((await request[method](path, { data, headers: { authorization: "Bearer guess" } })).status(), `${path} with a guessed token`).toBe(401);
    }
  });

  // The outreach clock sends email and reads the mailbox; the Telegram button files leads. Only signed calls get through.
  test("the outreach clock, digest and Telegram webhook refuse unsigned calls", async ({ request }) => {
    for (const path of ["/api/cron/outreach", "/api/cron/outreach-digest", "/api/cron/assistant", "/api/cron/portal-weekly"]) {
      expect((await request.get(path)).status(), path).toBe(401);
      expect((await request.get(path, { headers: { authorization: "Bearer guess" } })).status(), `${path} with a guessed secret`).toBe(401);
    }
    const press = { update_id: 1, callback_query: { id: "1", data: "handover:00000000-0000-4000-8000-000000000000", from: { id: 1 } } };
    expect((await request.post("/api/telegram/webhook", { data: press })).status()).toBe(401);
    expect((await request.post("/api/telegram/webhook", { data: press, headers: { "x-telegram-bot-api-secret-token": "guess" } })).status()).toBe(401);
  });

  test("forged sessions and wrong passwords are refused", async ({ request }) => {
    const forged = await request.get("/api/admin/clients", {
      headers: { cookie: "craefto_admin=99999999999.not-a-real-signature" },
    });
    expect(forged.status()).toBe(401);

    const bearer = await request.get("/api/admin/clients", { headers: { authorization: "Bearer guess" } });
    expect(bearer.status()).toBe(401);

    expect((await request.get("/api/admin/auth")).status()).toBe(401);
    // 401, or 500 where no admin password is configured: never a session.
    const login = await request.post("/api/admin/auth", { data: { password: "definitely-not-the-password" } });
    expect(login.ok()).toBe(false);
    expect(login.headers()["set-cookie"] ?? "").not.toContain("craefto_admin=");
  });
});
