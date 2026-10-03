// Prints the company profile (src/app/company-profile) to
// public/craefto-works-company-profile.pdf, with the dev server running:
//
//   npm run dev                          # in another terminal
//   npm run profile:pdf                  # print the PDF
//   npm run profile:pdf -- --form        # also recapture the cover's 3D form
//
// The profile reads the site's own content, so after changing capabilities,
// prices, case studies, the team or the About page's facts, print it again.
// Images are served resized for print, which keeps the PDF to a few MB.
// BASE_URL points it at another server; FORM_AT picks the moment the 3D form
// is captured, in ms after its canvas appears (the form keeps moving).

import { access, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { chromium } from "@playwright/test";
import sharp from "sharp";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const base = process.env.BASE_URL ?? "http://localhost:3000";
const pdfPath = path.join(root, "public/craefto-works-company-profile.pdf");
const formPath = path.join(root, "public/images/brand/craefto-form.png");

const exists = (file) => access(file).then(() => true, () => false);

/** Never log page views or Vercel analytics from a script. */
async function blockAnalytics(page) {
  await page.route(/\/api\/analytics\/|\/_vercel\/(insights|speed-insights)\//, (route) => route.fulfill({ status: 204, body: "" }));
}

/**
 * The home page's 3D form, large, captured with a transparent background and
 * trimmed. The form scales with its canvas, so the canvas is big.
 */
async function captureForm(browser) {
  const page = await browser.newPage({ viewport: { width: 3200, height: 3200 }, deviceScaleFactor: 1.5 });
  await blockAnalytics(page);
  await page.goto(`${base}/company-profile/form`, { waitUntil: "networkidle", timeout: 180_000 });
  const canvas = page.locator("#form canvas");
  await canvas.waitFor({ timeout: 60_000 });
  await page.waitForTimeout(Number(process.env.FORM_AT ?? 800));
  const shot = await canvas.screenshot({ omitBackground: true });
  const trimmed = await sharp(shot).trim().toBuffer();
  const png = await sharp(trimmed)
    .resize({ width: 1600, height: 1600, fit: "inside", withoutEnlargement: true })
    .extend({ top: 24, bottom: 24, left: 24, right: 24, background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .png({ compressionLevel: 9 })
    .toBuffer();
  await writeFile(formPath, png);
  await page.close();
  console.log(`Captured the 3D form: ${path.relative(root, formPath)}`);
}

/** Serves photos and screens at print size. */
async function serveImagesForPrint(page) {
  await page.route(/\/(images|team)\/[^?]+\.(jpe?g|png)(\?.*)?$/i, async (route) => {
    const { pathname } = new URL(route.request().url());
    const file = path.join(root, "public", decodeURIComponent(pathname));
    if (!(await exists(file))) return route.continue();
    const image = sharp(await readFile(file)).rotate().resize({ width: 2000, height: 2000, fit: "inside", withoutEnlargement: true });
    // PNGs keep their transparency (the cover's 3D form); photos become JPEGs.
    const png = pathname.endsWith(".png");
    const body = await (png ? image.png({ compressionLevel: 9 }) : image.jpeg({ quality: 82, mozjpeg: true })).toBuffer();
    await route.fulfill({ body, contentType: png ? "image/png" : "image/jpeg" });
  });
}

async function printProfile(browser) {
  const context = await browser.newContext({ viewport: { width: 1123, height: 794 }, reducedMotion: "reduce" });
  const page = await context.newPage();
  await blockAnalytics(page);
  await serveImagesForPrint(page);
  await page.goto(`${base}/company-profile`, { waitUntil: "networkidle", timeout: 180_000 });
  await page.evaluate(async () => {
    await document.fonts.ready;
    await Promise.all(
      [...document.images].map((img) => (img.complete ? null : new Promise((resolve) => img.addEventListener("load", resolve, { once: true })))),
    );
  });
  // Screen styles: the site's print stylesheet would strip every background.
  await page.emulateMedia({ media: "screen" });
  await page.evaluate(() => {
    document.documentElement.classList.add("cp-print");
    // Typographer's quotes on paper: the site's copy uses straight ones.
    const walker = document.createTreeWalker(document.querySelector(".cp"), NodeFilter.SHOW_TEXT);
    for (let node = walker.nextNode(); node; node = walker.nextNode()) {
      node.textContent = node.textContent
        .replace(/(\p{L})'(\p{L})/gu, "$1\u2019$2")
        .replace(/(^|[\s(])'/gu, "$1\u2018")
        .replace(/'/g, "\u2019")
        .replace(/(^|[\s(])"/gu, "$1\u201C")
        .replace(/"/g, "\u201D");
    }
  });
  const pdf = await page.pdf({ preferCSSPageSize: true, printBackground: true, tagged: true, outline: true });
  await writeFile(pdfPath, pdf);
  const sheets = await page.locator(".cp-sheet").count();
  await context.close();
  console.log(`Printed ${sheets} pages to ${path.relative(root, pdfPath)} (${(pdf.length / 1024 / 1024).toFixed(1)} MB)`);
}

const browser = await chromium.launch();
try {
  if (process.argv.includes("--form") || !(await exists(formPath))) await captureForm(browser);
  await printProfile(browser);
} finally {
  await browser.close();
}
