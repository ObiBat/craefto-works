import "server-only";
import { siteConfig } from "@/lib/constants";
import { telegram, telegramConfigured, telegramHtml } from "@/lib/telegram";
import { ADMIN_EMAIL, EMAIL_FROM, isEmailEnabled, resend } from "@/lib/resend";
import { alertEmail } from "@/emails/portal";
import { REPLY_LABEL, type OutreachReply } from "./types";

// Telling Obi a reply came in. Interested, questions, referrals and anything
// unclear go to the phone straight away: a Telegram message with buttons
// (open the thread, hand it over to Leads) when the bot is set up, otherwise
// an email. Everything else waits for the morning digest (digest.ts).

export type Alerter = (reply: OutreachReply, company: string) => Promise<boolean>;

export { telegram, telegramConfigured };

export const threadUrl = (replyId: string) => `${siteConfig.url}/admin/outreach/replies/${replyId}`;
export const leadUrl = (leadId: string) => `${siteConfig.url}/admin/leads/${leadId}`;

const html = telegramHtml;

/** Replies worth handing over to Leads from the phone. */
export const canHandOver = (reply: Pick<OutreachReply, "label" | "leadId">) => !reply.leadId && ["interested", "question", "referral"].includes(reply.label);

export function alertText(reply: OutreachReply, company: string) {
  const from = reply.fromName ? `${reply.fromName} <${reply.fromAddress}>` : reply.fromAddress;
  const pointed = reply.referral ? [reply.referral.name, reply.referral.role, reply.referral.email].filter(Boolean).join(", ") : "";
  return [
    `<b>${reply.mode === "test" ? "Test reply · " : ""}${html(REPLY_LABEL[reply.label])}</b> · ${html(company)}`,
    html(from),
    reply.quote ? `\n“${html(reply.quote)}”` : "",
    reply.summary ? html(reply.summary) : "",
    pointed ? `They pointed to ${html(pointed)}. Not emailed automatically.` : "",
    reply.suggestedReply ? "\nA suggested answer is ready in admin." : "",
  ]
    .filter(Boolean)
    .join("\n");
}

export function alertButtons(reply: OutreachReply) {
  return {
    inline_keyboard: [
      [
        { text: "Open thread", url: threadUrl(reply.id) },
        ...(reply.leadId ? [{ text: "Open lead", url: leadUrl(reply.leadId) }] : canHandOver(reply) ? [{ text: "Hand over to Leads", callback_data: `handover:${reply.id}` }] : []),
      ],
    ],
  };
}

/** The alert for one reply: Telegram when it's set up, otherwise email. False when neither can send. */
export const alertReply: Alerter = async (reply, company) => {
  if (telegramConfigured()) {
    await telegram("sendMessage", {
      chat_id: process.env.TELEGRAM_CHAT_ID,
      text: alertText(reply, company),
      parse_mode: "HTML",
      link_preview_options: { is_disabled: true },
      reply_markup: alertButtons(reply),
    });
    return true;
  }
  if (!isEmailEnabled()) return false;
  const label = REPLY_LABEL[reply.label];
  const email = alertEmail({
    eyebrow: reply.mode === "test" ? `Test reply · ${label}` : `Outreach reply · ${label}`,
    subject: `${label}: ${company}${reply.mode === "test" ? " (test)" : ""}`,
    heading: company,
    rows: [
      ["From", reply.fromName ? `${reply.fromName} <${reply.fromAddress}>` : reply.fromAddress],
      ["Summary", reply.summary],
      ["The line", reply.quote],
      ["Answer", reply.suggestedReply ? "A suggested answer is ready" : null],
    ],
    text: reply.body,
    link: threadUrl(reply.id),
  });
  const result = await resend.emails.send({ from: EMAIL_FROM, to: ADMIN_EMAIL, subject: email.subject, html: email.html });
  if (result.error) throw new Error(`Resend: ${result.error.message}`);
  return true;
};
