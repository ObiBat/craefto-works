import { defineConfig, devices } from "@playwright/test";

// BASE_URL: a deployment to test (CI passes each Vercel deployment's URL).
// Without it, the suite builds the site and serves it locally on port 3100.
const baseURL = process.env.BASE_URL ?? "http://localhost:3100";
// Vercel deployment protection: Settings > Deployment Protection >
// Protection Bypass for Automation.
const bypass = process.env.VERCEL_AUTOMATION_BYPASS_SECRET;

export default defineConfig({
  testDir: "e2e",
  timeout: 60_000,
  expect: { timeout: 10_000 },
  fullyParallel: true,
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? [["github"], ["list"]] : "list",
  use: {
    baseURL,
    extraHTTPHeaders: bypass
      ? { "x-vercel-protection-bypass": bypass, "x-vercel-set-bypass-cookie": "true" }
      : undefined,
    trace: "retain-on-failure",
  },
  projects: [
    { name: "desktop", use: { ...devices["Desktop Chrome"] } },
    // Phones: the page and interaction checks (search and intro checks don't depend on the device).
    { name: "mobile", use: { ...devices["Pixel 7"] }, testMatch: /(pages|interactions)\.spec\.ts/ },
    // Safari's engine formats some text differently from Node (Intl.ListFormat
    // adds an Oxford comma), and a mismatch makes React re-render the page,
    // which drops <html>'s classes and stops every animation. The page checks
    // fail on that error, so they run here too.
    {
      name: "iphone",
      use: { ...devices["iPhone 15"], timezoneId: "Australia/Sydney", locale: "en-AU" },
      testMatch: /pages\.spec\.ts/,
    },
  ],
  webServer: process.env.BASE_URL
    ? undefined
    : {
        command: "npm run build && npm run start -- -p 3100",
        url: "http://localhost:3100/robots.txt",
        timeout: 600_000,
        reuseExistingServer: true,
      },
});
