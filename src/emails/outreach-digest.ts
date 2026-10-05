import { escapeHtml, safeUrl } from "./_escape";
import { facts, layout, paragraph, type Email } from "./layout";

// The morning outreach digest (lib/outreach/digest.ts): what needs Obi, what
// was handled by itself since yesterday, reminders that came due, and how
// sending went. Short on purpose: the admin has the detail.

export interface DigestLine {
  company: string;
  label: string;
  line: string | null;
  link: string;
}

const MUTED = "#686862";
const INK = "#161615";

const heading = (text: string) =>
  `<p style="margin: 22px 0 8px; font-family: 'Geist Mono', ui-monospace, Menlo, monospace; font-size: 11px; letter-spacing: 0.06em; text-transform: uppercase; color: ${MUTED};">${escapeHtml(text)}</p>`;

const item = ({ company, label, line, link }: DigestLine) =>
  `<p style="margin: 0 0 10px;"><a href="${safeUrl(link)}" style="color: ${INK}; font-weight: 600; text-decoration: none;">${escapeHtml(company)}</a> <span style="color: ${MUTED};">· ${escapeHtml(label)}</span>${
    line ? `<br><span style="font-size: 15px; color: ${MUTED};">${escapeHtml(line)}</span>` : ""
  }</p>`;

const section = (title: string, lines: DigestLine[]) => (lines.length ? heading(title) + lines.map(item).join("") : "");

export function outreachDigestEmail({
  day,
  needsYou,
  handled,
  due,
  sending,
  link,
}: {
  /** "Tue 6 Oct" */
  day: string;
  needsYou: DigestLine[];
  handled: DigestLine[];
  due: DigestLine[];
  sending: Array<[string, string | null | undefined]>;
  link: string;
}): Email {
  const parts = [needsYou.length ? `${needsYou.length} need${needsYou.length === 1 ? "s" : ""} you` : "", handled.length ? `${handled.length} handled` : "", due.length ? `${due.length} to try again` : ""].filter(Boolean);
  return {
    subject: `Outreach, ${day}: ${parts.length ? parts.join(", ") : "nothing needs you"}`,
    html: layout({
      eyebrow: "Outreach digest",
      heading: needsYou.length ? `${needsYou.length} ${needsYou.length === 1 ? "reply needs" : "replies need"} you` : "Nothing needs you",
      body:
        (needsYou.length || handled.length || due.length ? "" : paragraph("No replies since yesterday's digest.")) +
        section("Needs you", needsYou) +
        section("Due to try again", due) +
        section("Handled by itself", handled) +
        heading("Sending") +
        facts(sending),
      action: { label: "Open replies", href: link },
    }),
  };
}
