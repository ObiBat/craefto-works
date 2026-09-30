import { test, expect, PAGES } from "./fixtures";

// The server and the browser must render the same markup. When they don't,
// React re-renders the page, which drops the boot script's classes on <html>
// and stops every animation for the rest of the visit. It happened only in
// Safari (Intl.ListFormat adds an Oxford comma there), so the iPhone project
// runs these checks in WebKit.

const HYDRATION_ERROR = /Minified React error #4(18|19|21|22|23|25)\b|[Hh]ydrat/;

test.describe("hydration", () => {
  for (const path of PAGES) {
    test(`${path} hydrates without React re-rendering it`, async ({ page, consoleErrors }) => {
      await page.goto(path, { waitUntil: "load" });
      // React hydrates after the load event; give a slow runner time to finish.
      await page.waitForTimeout(2000);
      expect(consoleErrors.filter((error) => HYDRATION_ERROR.test(error))).toEqual([]);
      await expect(page.locator("html")).toHaveClass(/(^|\s)js(\s|$)/);
    });
  }
});
