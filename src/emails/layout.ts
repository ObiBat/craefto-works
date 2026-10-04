import { escapeHtml, safeUrl } from "./_escape";

// The one layout for Craefto's emails, in the site's colours and type: the
// portal's (./portal.ts) and the enquiry emails (./enquiry.ts). Everything a
// person typed passes through escapeHtml before it reaches the HTML.

const INK = "#161615";
const MUTED = "#686862";
const GREEN = "#4B6C59";
const SAGE = "#EEF2EF";
const PAPER = "#F6F6F2";
const BODY_FONT = "'DM Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif";
const HEAD_FONT = "'Archivo', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif";

export interface Email {
  subject: string;
  html: string;
}

export function layout({ eyebrow, heading, body, action, footnote }: {
  eyebrow: string;
  heading: string;
  body: string;
  action?: { label: string; href: string };
  footnote?: string;
}): string {
  const button = action
    ? `<tr><td style="padding: 8px 0 4px;">
        <a href="${safeUrl(action.href)}" style="display: inline-block; padding: 14px 26px; background-color: ${INK}; color: #FFFFFF; font-family: ${BODY_FONT}; font-size: 15px; font-weight: 600; text-decoration: none; border-radius: 999px;">${escapeHtml(action.label)}</a>
      </td></tr>`
    : "";
  const note = footnote
    ? `<tr><td style="padding-top: 24px; font-family: ${BODY_FONT}; font-size: 13px; line-height: 1.6; color: ${MUTED};">${footnote}</td></tr>`
    : "";
  return `<!DOCTYPE html>
<html lang="en-AU">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta name="color-scheme" content="light">
  <title>${escapeHtml(heading)}</title>
  <link href="https://fonts.googleapis.com/css2?family=Archivo:wght@600&family=DM+Sans:wght@400;600&display=swap" rel="stylesheet">
</head>
<body style="margin: 0; padding: 0; background-color: ${PAPER};">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color: ${PAPER};">
    <tr><td align="center" style="padding: 40px 16px;">
      <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width: 560px;">
        <tr><td style="padding: 0 8px 20px; font-family: ${HEAD_FONT}; font-size: 18px; font-weight: 600; letter-spacing: -0.01em; color: ${INK};">Craefto</td></tr>
        <tr><td style="background-color: #FFFFFF; border-radius: 20px; padding: 36px 32px;">
          <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
            <tr><td style="padding-bottom: 14px;">
              <span style="display: inline-block; padding: 5px 10px; border-radius: 999px; background-color: ${SAGE}; font-family: 'Geist Mono', ui-monospace, Menlo, monospace; font-size: 11px; letter-spacing: 0.06em; text-transform: uppercase; color: ${GREEN};">${escapeHtml(eyebrow)}</span>
            </td></tr>
            <tr><td style="padding-bottom: 14px; font-family: ${HEAD_FONT}; font-size: 26px; font-weight: 600; letter-spacing: -0.02em; line-height: 1.2; color: ${INK};">${escapeHtml(heading)}</td></tr>
            <tr><td style="padding-bottom: 20px; font-family: ${BODY_FONT}; font-size: 16px; line-height: 1.65; color: ${INK};">${body}</td></tr>
            ${button}
            ${note}
          </table>
        </td></tr>
        <tr><td style="padding: 20px 8px 0; font-family: ${BODY_FONT}; font-size: 12px; line-height: 1.6; color: ${MUTED};">
          Craefto Works · Sydney, Australia · <a href="https://www.craefto.com" style="color: ${MUTED};">craefto.com</a>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;
}

export const paragraph = (text: string) => `<p style="margin: 0 0 12px;">${text}</p>`;

/** A block quote of what someone wrote, cut to a readable length. */
export function quote(text: string): string {
  const cut = text.length > 600 ? `${text.slice(0, 600).trimEnd()}…` : text;
  return `<div style="margin: 4px 0 12px; padding: 16px 18px; border-radius: 14px; background-color: ${SAGE}; white-space: pre-wrap; font-size: 15px; line-height: 1.6;">${escapeHtml(cut)}</div>`;
}

/** Label and value rows, for alerts. */
export function facts(rows: Array<[string, string | null | undefined]>): string {
  const cells = rows
    .filter(([, value]) => value)
    .map(
      ([label, value]) =>
        `<tr><td style="padding: 4px 16px 4px 0; font-family: ${BODY_FONT}; font-size: 14px; color: ${MUTED}; white-space: nowrap; vertical-align: top;">${escapeHtml(label)}</td><td style="padding: 4px 0; font-family: ${BODY_FONT}; font-size: 14px; color: ${INK};">${escapeHtml(value!)}</td></tr>`
    )
    .join("");
  return `<table role="presentation" cellspacing="0" cellpadding="0" style="margin: 0 0 8px;">${cells}</table>`;
}

export const hello = (name: string | null) => `Hi ${escapeHtml(name?.split(" ")[0] || "there")},`;
