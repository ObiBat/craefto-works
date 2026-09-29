import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { ImageResponse } from "next/og";
import { MARK_PATH } from "@/components/ui/logo-paths";

/**
 * Branded Open Graph cards (1200 × 630) in the site's own type and colour:
 * Archivo headline, DM Sans description, Geist Mono labels, warm paper and
 * one sage accent. Each route's opengraph-image.tsx calls ogCard(); most are
 * rendered once at build time.
 */

export const OG_SIZE = { width: 1200, height: 630 };
export const OG_CONTENT_TYPE = "image/png";

const PAPER = "#FDFCFA";
const TILE = "#EFECE7";
const INK = "#121110";
const MUTED = "#67615B";
const SAGE = "#4B6C59";

type OgFont = { name: string; data: Buffer; weight: 400 | 500 | 600; style: "normal" };

let fonts: Promise<OgFont[]> | undefined;
function loadFonts(): Promise<OgFont[]> {
  const dir = join(process.cwd(), "src/lib/og/fonts");
  fonts ??= Promise.all([
    readFile(join(dir, "archivo-600.woff")),
    readFile(join(dir, "dm-sans-400.woff")),
    readFile(join(dir, "geist-mono-500.woff")),
  ]).then(([archivo, dmSans, geistMono]) => [
    { name: "Archivo", data: archivo, weight: 600, style: "normal" },
    { name: "DM Sans", data: dmSans, weight: 400, style: "normal" },
    { name: "Geist Mono", data: geistMono, weight: 500, style: "normal" },
  ]);
  return fonts;
}

/** A PNG or JPEG as a data URL: a /public path is read from disk, a URL is fetched. */
async function loadImage(src: string): Promise<string | null> {
  try {
    let bytes: Buffer;
    let type: string;
    if (/^https?:\/\//.test(src)) {
      const res = await fetch(src);
      if (!res.ok) return null;
      bytes = Buffer.from(await res.arrayBuffer());
      type = res.headers.get("content-type") ?? "";
    } else {
      bytes = await readFile(join(process.cwd(), "public", src.replace(/^\//, "").split("?")[0]));
      type = /\.png$/i.test(src) ? "image/png" : /\.jpe?g$/i.test(src) ? "image/jpeg" : "";
    }
    if (!/image\/(png|jpeg)/.test(type)) return null; // the renderer can't draw WebP or AVIF
    return `data:${type};base64,${bytes.toString("base64")}`;
  } catch {
    return null;
  }
}

/** Shorten to at most `max` characters, at a word boundary. */
function clip(text: string, max: number): string {
  if (text.length <= max) return text;
  const cut = text.slice(0, max - 1);
  const space = cut.lastIndexOf(" ");
  return `${(space > max * 0.6 ? cut.slice(0, space) : cut).replace(/[\s,.;:–—-]+$/, "")}…`;
}

export interface OgCardOptions {
  /** Small mono label beside the mark, e.g. "Case study". */
  eyebrow: string;
  title: string;
  description?: string | null;
  /** Optional picture for the right-hand panel: a /public path or an https URL (PNG or JPEG). */
  image?: string | null;
  /** Bottom-right note, e.g. "8 min read". */
  meta?: string | null;
}

export async function ogCard({ eyebrow, title, description, image, meta }: OgCardOptions): Promise<ImageResponse> {
  const [fontList, picture] = await Promise.all([loadFonts(), image ? loadImage(image) : Promise.resolve(null)]);
  const wide = !picture;
  const len = title.length;
  const titleSize = wide ? (len <= 28 ? 92 : len <= 56 ? 72 : 58) : len <= 28 ? 66 : len <= 56 ? 54 : 44;

  return new ImageResponse(
    (
      <div style={{ width: "100%", height: "100%", display: "flex", backgroundColor: PAPER, padding: 56 }}>
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
            width: wide ? 1088 : 560,
            paddingRight: wide ? 0 : 44,
          }}
        >
          <div style={{ display: "flex", alignItems: "center" }}>
            <svg width="46" height="46" viewBox="0 0 400 400">
              <path transform="translate(0,400) scale(0.1,-0.1)" d={MARK_PATH} fill={INK} />
            </svg>
            <div
              style={{
                marginLeft: 22,
                fontFamily: "Geist Mono",
                fontSize: 19,
                letterSpacing: "0.08em",
                textTransform: "uppercase",
                color: SAGE,
              }}
            >
              {eyebrow}
            </div>
          </div>

          <div style={{ display: "flex", flexDirection: "column" }}>
            <div
              style={{
                fontFamily: "Archivo",
                fontSize: titleSize,
                lineHeight: 1.04,
                letterSpacing: "-0.028em",
                color: INK,
              }}
            >
              {clip(title, 90)}
            </div>
            {description ? (
              <div
                style={{
                  marginTop: 24,
                  fontFamily: "DM Sans",
                  fontSize: wide ? 30 : 25,
                  lineHeight: 1.4,
                  color: MUTED,
                  maxWidth: wide ? 900 : 520,
                }}
              >
                {clip(description, wide ? 130 : 110)}
              </div>
            ) : null}
          </div>

          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              fontFamily: "Geist Mono",
              fontSize: 18,
              letterSpacing: "0.04em",
              color: MUTED,
            }}
          >
            <div>craefto.com</div>
            {meta ? <div>{meta}</div> : null}
          </div>
        </div>

        {picture ? (
          <div style={{ display: "flex", flex: 1, borderRadius: 28, overflow: "hidden", backgroundColor: TILE }}>
            {/* eslint-disable-next-line @next/next/no-img-element -- rendered to PNG, not HTML */}
            <img src={picture} alt="" width={528} height={518} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
          </div>
        ) : null}
      </div>
    ),
    { ...OG_SIZE, fonts: fontList }
  );
}
