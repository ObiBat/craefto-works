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
