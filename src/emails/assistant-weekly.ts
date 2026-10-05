import { escapeHtml } from "./_escape";
import { facts, layout, paragraph, type Email } from "./layout";

// Monday's note on Ask Craefto (lib/assistant/housekeeping.ts): how the week's
// chats went, and the questions it couldn't answer from the site, which show
// where the site needs better content.

const MUTED = "#686862";

export function assistantWeeklyEmail({
  week,
  numbers,
  gaps,
  link,
}: {
  /** "29 Sep – 5 Oct" */
  week: string;
  numbers: Array<[string, string]>;
  gaps: string[];
  link: string;
}): Email {
  const list = gaps.length
    ? `<ul style="margin: 0 0 12px; padding-left: 20px;">${gaps.map((gap) => `<li style="margin: 0 0 6px;">“${escapeHtml(gap)}”</li>`).join("")}</ul>`
    : paragraph(`<span style="color: ${MUTED};">None: it could answer everything it was asked about Craefto.</span>`);
  return {
    subject: `Ask Craefto, ${week}: ${gaps.length ? `${gaps.length} question${gaps.length === 1 ? "" : "s"} it couldn't answer` : "every question answered"}`,
    html: layout({
      eyebrow: "Ask Craefto · weekly",
      heading: gaps.length ? "What people asked that the site doesn't say" : "A quiet week for questions",
      body:
        facts(numbers) +
        paragraph("<strong>Questions it couldn't answer from the site</strong>") +
        list +
        paragraph(`<span style="color: ${MUTED};">Adding the answers to the site's pages teaches the assistant too: it only knows what they say.</span>`),
      action: { label: "Open the chats", href: link },
    }),
  };
}
