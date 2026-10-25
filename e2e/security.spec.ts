import { test, expect } from "./fixtures";

// The admin API and the analytics reads behind the admin screens must refuse
// anyone without a session (src/proxy.ts). These only ever expect refusals,
// so they are safe to run against production.
test.describe("admin API access", () => {
  const protectedReads = [
    "/api/admin/today",
    "/api/admin/leads",
    "/api/admin/leads/00000000-0000-4000-8000-000000000000",
    "/api/admin/members",
    "/api/admin/members/00000000-0000-4000-8000-000000000000/view",
    "/api/admin/members/00000000-0000-4000-8000-000000000000/invoices/00000000-0000-4000-8000-000000000000/pdf",
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
    "/api/admin/work",
    "/api/analytics/article",
  ];

  for (const path of protectedReads) {
    test(`${path} refuses anonymous requests`, async ({ request }) => {
      const res = await request.get(path);
      expect(res.status()).toBe(401);
    });
  }

  test("invoices can't be drafted or issued without a session", async ({ request }) => {
    const member = "/api/admin/members/00000000-0000-4000-8000-000000000000";
    expect((await request.post(`${member}/invoices`, { data: { kind: "retainer" } })).status()).toBe(401);
    expect((await request.patch(`${member}/invoices/00000000-0000-4000-8000-000000000000`, { data: { action: "issue", email: true } })).status()).toBe(401);
  });

  test("past work can't be added without a session", async ({ request }) => {
    const res = await request.post("/api/admin/members/00000000-0000-4000-8000-000000000000/requests", { data: { title: "x", delivered_on: "2026-01-01" } });
    expect(res.status()).toBe(401);
  });

  test("shipped work and projects can't change without a session", async ({ request }) => {
    const draft = "/api/admin/work/00000000-0000-4000-8000-000000000000";
    expect((await request.patch(draft, { data: { action: "publish", mode: "past_work", minutes: 30 } })).status()).toBe(401);
    expect((await request.patch(draft, { data: { title: "x" } })).status()).toBe(401);
    const projects = "/api/admin/members/00000000-0000-4000-8000-000000000000/projects";
    expect((await request.post(projects, { data: { repo: "someone/something" } })).status()).toBe(401);
    expect((await request.delete(`${projects}?project=00000000-0000-4000-8000-000000000000`)).status()).toBe(401);
  });

  test("the GitHub webhook refuses unsigned or wrongly signed calls", async ({ request }) => {
    const merged = { action: "closed", repository: { full_name: "someone/something", default_branch: "main" }, pull_request: { number: 1, merged: true } };
    expect((await request.post("/api/github/webhook", { data: merged, headers: { "x-github-event": "pull_request" } })).status()).toBe(401);
    const forged = { "x-github-event": "pull_request", "x-hub-signature-256": `sha256=${"0".repeat(64)}` };
    expect((await request.post("/api/github/webhook", { data: merged, headers: forged })).status()).toBe(401);
  });

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
    const forged = await request.get("/api/admin/today", {
      headers: { cookie: "craefto_admin=99999999999.not-a-real-signature" },
    });
    expect(forged.status()).toBe(401);

    const bearer = await request.get("/api/admin/today", { headers: { authorization: "Bearer guess" } });
    expect(bearer.status()).toBe(401);

    expect((await request.get("/api/admin/auth")).status()).toBe(401);
    // 401, or 500 where no admin password is configured: never a session.
    const login = await request.post("/api/admin/auth", { data: { password: "definitely-not-the-password" } });
    expect(login.ok()).toBe(false);
    expect(login.headers()["set-cookie"] ?? "").not.toContain("craefto_admin=");
  });
});
