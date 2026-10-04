import { EMAIL_LOGO_PNG } from "./email-logo";

// The HTML version of an outreach email: the approved text exactly as
// written, then a footer with the Craefto mark beside the signature, then the
// opt-out line. The plain-text version is the approved text itself; mail apps
// show this one. One embedded image (no remote images, no tracking), system
// fonts, spacing rather than rules, and nothing that isn't in the text.

export const LOGO_CID = "craefto-logo@craefto.com";

/** The logo as an inline attachment the HTML points at (cid:). */
export const logoAttachment = () => ({
  filename: "craefto.png",
  content: Buffer.from(EMAIL_LOGO_PNG, "base64"),
  contentType: "image/png",
  cid: LOGO_CID,
  contentDisposition: "inline" as const,
});

const FONT = "-apple-system, BlinkMacSystemFont, 'Segoe UI', Helvetica, Arial, sans-serif";
const INK = "#1a1a1a";
const MUTED = "#5c5c5c";
const QUIET = "#808080";

/** Used when an email's own signature can't be found, so the footer still says who it's from. */
const DEFAULT_SIGNATURE = ["Craefto Works", "craefto.com · ABN 81 278 859 855"];
/** Where the studio is, as the site says it (the about page). */
const LOCATION = "Sydney, Australia";

const escape = (text: string) => text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

const paragraphs = (text: string, style: string) =>
  text
    .split(/\n{2,}/)
    .map((block) => block.trim())
    .filter(Boolean)
    .map((block) => `<p style="${style}">${block.split("\n").map(escape).join("<br>")}</p>`)
    .join("\n");

/**
 * Splits off the signature: the last unquoted line that names Obi, followed by
 * a line naming Craefto Works, through to the next blank line.
 */
export function splitSignature(text: string): { body: string; signature: string[]; after: string } | null {
  const lines = text.split("\n");
  for (let i = lines.length - 2; i >= 0; i--) {
    if (lines[i].trim() !== "Obi Batbileg" || !/craefto works/i.test(lines[i + 1] ?? "")) continue;
    let end = i;
    while (end < lines.length && lines[end].trim() !== "") end++;
    return { body: lines.slice(0, i).join("\n").trimEnd(), signature: lines.slice(i, end).map((line) => line.trim()), after: lines.slice(end).join("\n").trim() };
  }
  return null;
}

/** What follows the signature: the opt-out line in small print, then any quoted earlier email, Gmail-style. */
function afterSignature(text: string) {
  const lines = text.split("\n");
  const quoteStart = lines.findIndex((line, i) => /wrote:$/.test(line.trim()) && (lines[i + 2] ?? lines[i + 1] ?? "").startsWith(">"));
  const small = `margin:0 0 10px;font-size:12px;line-height:1.5;color:${QUIET};`;
  if (quoteStart === -1) return paragraphs(text, small);
  const before = lines.slice(0, quoteStart).join("\n");
  const quoted = lines
    .slice(quoteStart + 1)
    .map((line) => line.replace(/^>\s?/, ""))
    .join("\n");
  return `${paragraphs(before, small)}
<div class="gmail_quote" style="margin:22px 0 0;">
<div style="font-size:13px;line-height:1.5;color:${MUTED};">${escape(lines[quoteStart].trim())}</div>
<blockquote class="gmail_quote" style="margin:8px 0 0 0.8ex;border-left:1px solid #d0d0d0;padding-left:1ex;color:${MUTED};">
${paragraphs(quoted, `margin:0 0 12px;font-size:14px;line-height:1.55;color:${MUTED};`)}
</blockquote>
</div>`;
}

function footer(signature: string[]) {
  const [first, ...rest] = signature.some((line) => /sydney/i.test(line)) ? signature : [...signature, LOCATION];
  const lines = [`<span style="font-weight:600;color:${INK};">${escape(first)}</span>`, ...rest.map((line) => `<span style="color:${MUTED};">${escape(line)}</span>`)].join("<br>");
  return `<table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin:26px 0 18px;border-collapse:collapse;">
<tr>
<td style="padding:0 14px 0 0;vertical-align:top;"><img src="cid:${LOGO_CID}" width="44" height="44" alt="Craefto Works" style="display:block;width:44px;height:44px;border:0;outline:none;"></td>
<td style="vertical-align:top;font-family:${FONT};font-size:13px;line-height:1.55;color:${INK};">${lines}</td>
</tr>
</table>`;
}

/** The HTML version of an outreach email's text (the approved text, follow-ups and their quote included). */
export function renderEmailHtml(text: string, subject: string): string {
  const split = splitSignature(text);
  const body = paragraphs(split ? split.body : text, `margin:0 0 14px;font-size:15px;line-height:1.6;color:${INK};`);
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="color-scheme" content="light dark">
<meta name="supported-color-schemes" content="light dark">
<title>${escape(subject)}</title>
</head>
<body style="margin:0;padding:0;background:#ffffff;">
<div style="max-width:600px;padding:4px 0;font-family:${FONT};font-size:15px;line-height:1.6;color:${INK};text-align:left;">
${body}
${footer(split?.signature.length ? split.signature : DEFAULT_SIGNATURE)}
${split?.after ? afterSignature(split.after) : ""}
</div>
</body>
</html>`;
}
