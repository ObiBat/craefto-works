// Tiny blurred previews for the case study images (next/image placeholder="blur").
// Run after adding or replacing images under public/images/projects:
//   npm run images:placeholders
import { readdir, writeFile } from "node:fs/promises";
import { join, relative } from "node:path";
import sharp from "sharp";

const ROOT = new URL("..", import.meta.url).pathname;
const DIR = join(ROOT, "public/images/projects");
const OUT = join(ROOT, "src/content/image-placeholders.json");

async function* walk(dir) {
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    const path = join(dir, entry.name);
    if (entry.isDirectory()) yield* walk(path);
    else if (/\.(jpe?g|png|webp)$/i.test(entry.name)) yield path;
  }
}

const placeholders = {};
for await (const file of walk(DIR)) {
  const buffer = await sharp(file).resize({ width: 16 }).webp({ quality: 50 }).toBuffer();
  placeholders[`/${relative(join(ROOT, "public"), file)}`] = `data:image/webp;base64,${buffer.toString("base64")}`;
}

const sorted = Object.fromEntries(Object.entries(placeholders).sort(([a], [b]) => a.localeCompare(b)));
await writeFile(OUT, `${JSON.stringify(sorted, null, 2)}\n`);
console.log(`Wrote ${Object.keys(sorted).length} placeholders to ${relative(ROOT, OUT)}`);
