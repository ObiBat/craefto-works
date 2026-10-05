import "server-only";
import { EMAIL_FROM, isEmailEnabled, resend } from "@/lib/resend";
import { formatPrice, planById } from "@/lib/pricing";
import * as emails from "@/emails/portal";
import { formatBytes } from "./file-rules";
import { alertOwnerTelegram, telegramConfigured, telegramHtml } from "@/lib/telegram";
import { REQUEST_STATUSES, estimateLabel, type ClientAccount, type ClientFile, type ClientMessage, type ClientRequest, type ClientSubscription } from "./types";

// Portal email: to clients from hello@, with replies going to Craefto's inbox,
// and every alert to that inbox. `origin` is the site the request came in on,
// so links work locally as well as on www.craefto.com.

/** Where portal alerts go, and where clients' replies land. */
export const CRAEFTO_INBOX = process.env.PORTAL_ALERTS_EMAIL || "obi@craefto.com";

export const planName = (plan: string) => planById(plan)?.name ?? plan;
const planPrice = (plan: string) => planById(plan)?.price;

const dateLabel = (iso: string | null) =>
  iso ? new Date(iso).toLocaleDateString("en-AU", { day: "numeric", month: "long", year: "numeric", timeZone: "Australia/Sydney" }) : null;

const who = (account: ClientAccount) => account.name || account.email;

/** "brief.pdf (1.2 MB), logo.ai (840 KB)" */
const fileLine = (files: ClientFile[]) => (files.length ? files.map((file) => `${file.name} (${formatBytes(file.size)})`).join(", ") : null);

async function send(to: string, email: emails.Email, replyTo: string = CRAEFTO_INBOX) {
  if (!isEmailEnabled()) {
    // No Resend key (local development): show the email and its links instead.
    if (process.env.NODE_ENV !== "production") {
      const links = [...email.html.matchAll(/href="(http[^"]+)"/g)].map((match) => match[1].replace(/&amp;/g, "&"));
      console.info(`[portal email → ${to}] ${email.subject}\n${links.filter((link) => !link.includes("fonts.googleapis")).join("\n")}`);
    }
    return;
  }
  // Subjects carry what clients typed: one line, always.
  const subject = email.subject.replace(/\s+/g, " ").trim();
  const { error } = await resend.emails.send({ from: EMAIL_FROM, to, subject, html: email.html, replyTo });
  if (error) console.error(`Portal email "${email.subject}" to ${to} failed:`, error);
}

// ── Clients ───────────────────────────────────────────────────────────────

export const sendWelcome = (account: ClientAccount, subscription: ClientSubscription, origin: string) =>
  send(
    account.email,
    emails.welcomeEmail({
      name: account.name,
      planName: planName(subscription.plan),
      portalUrl: `${origin}/portal/login?email=${encodeURIComponent(account.email)}`,
    })
  );

export const sendSignInLink = (account: ClientAccount, link: string) =>
  send(account.email, emails.signInEmail({ name: account.name, link }));

export const sendRequestUpdate = (account: ClientAccount, request: ClientRequest, origin: string, detail?: string) =>
  send(
    account.email,
    emails.requestUpdateEmail({
      name: account.name,
      title: request.title,
      statusLabel: REQUEST_STATUSES[request.status].label,
      link: `${origin}/portal/requests/${request.id}`,
      detail,
    })
  );

/** "Thursday 15 October" for a yyyy-mm-dd date. */
const dayLabel = (date: string | null) =>
  date ? new Date(`${date}T12:00:00Z`).toLocaleDateString("en-AU", { weekday: "long", day: "numeric", month: "long", timeZone: "UTC" }) : null;

export const sendEstimateReady = (account: ClientAccount, request: ClientRequest, origin: string) =>
  send(
    account.email,
    emails.estimateEmail({
      name: account.name,
      title: request.title,
      estimate: estimateLabel(request) ?? "an estimate",
      note: request.estimate_note,
      targetDate: dayLabel(request.target_date),
      link: `${origin}/portal/requests/${request.id}`,
    })
  );

export const sendInvite = (account: ClientAccount, link: string) =>
  send(account.email, emails.inviteEmail({ name: account.name, engagement: account.engagement, link }));

export const sendWeekly = (account: ClientAccount, email: emails.Email) => send(account.email, email);

/** Craefto's reply; `statusChanged` when it also moved the request on (one email, not two). */
export const sendReply = (
  account: ClientAccount,
  message: ClientMessage,
  request: ClientRequest | null,
  files: ClientFile[],
  origin: string,
  statusChanged = false
) =>
  send(
    account.email,
    emails.replyEmail({
      name: account.name,
      about: request?.title ?? null,
      body: message.body,
      files: files.map((file) => file.name),
      link: request ? `${origin}/portal/requests/${request.id}` : `${origin}/portal/messages`,
      statusLabel: request && statusChanged ? REQUEST_STATUSES[request.status].label : undefined,
    })
  );

// ── Craefto ───────────────────────────────────────────────────────────────

const adminLink = (origin: string, account: ClientAccount) => `${origin}/admin/members/${account.id}`;

export function alertNewSubscriber(account: ClientAccount, subscription: ClientSubscription, origin: string) {
  const plan = planName(subscription.plan);
  const price = planPrice(subscription.plan);
  return send(
    CRAEFTO_INBOX,
    emails.alertEmail({
      eyebrow: "New subscriber",
      subject: `New ${plan} subscriber: ${who(account)}`,
      heading: `${who(account)} joined ${plan}`,
      rows: [
        ["Plan", price ? `${plan}, ${formatPrice(price)} a month` : plan],
        ["Name", account.name],
        ["Email", account.email],
        ["Company", account.company],
        ["Renews", dateLabel(subscription.current_period_end)],
      ],
      link: adminLink(origin, account),
    }),
    account.email
  );
}

export const alertRequest = (account: ClientAccount, request: ClientRequest, files: ClientFile[], origin: string) =>
  send(
    CRAEFTO_INBOX,
    emails.alertEmail({
      eyebrow: "New request",
      subject: `Request from ${who(account)}: ${request.title}`,
      heading: request.title,
      rows: [
        ["From", who(account)],
        ["Email", account.email],
        ["Files", fileLine(files)],
      ],
      text: request.details || undefined,
      link: adminLink(origin, account),
    }),
    account.email
  );

export const alertMessage = (account: ClientAccount, message: ClientMessage, request: ClientRequest | null, files: ClientFile[], origin: string) =>
  send(
    CRAEFTO_INBOX,
    emails.alertEmail({
      eyebrow: "New message",
      subject: request ? `Re: ${request.title} (${who(account)})` : `Message from ${who(account)}`,
      heading: request ? request.title : `Message from ${who(account)}`,
      rows: [
        ["From", who(account)],
        ["Email", account.email],
        ["Files", fileLine(files)],
      ],
      text: message.body || undefined,
      link: adminLink(origin, account),
    }),
    account.email
  );

/** The client approved an estimate: the request is in their queue. */
export async function alertApproved(account: ClientAccount, request: ClientRequest, origin: string) {
  const estimate = estimateLabel(request) ?? "no estimate";
  const place = request.queue_position ? `#${request.queue_position} in their queue` : "in their queue";
  if (telegramConfigured()) {
    await alertOwnerTelegram(
      [`<b>Approved · ${telegramHtml(who(account))}</b>`, telegramHtml(request.title), `${telegramHtml(estimate)} · ${place}`].join("\n"),
      [{ text: "Open in admin", url: adminLink(origin, account) }]
    ).catch((error) => console.error("The approval alert failed:", error));
  }
  await send(
    CRAEFTO_INBOX,
    emails.alertEmail({
      eyebrow: "Estimate approved",
      subject: `${who(account)} approved: ${request.title}`,
      heading: request.title,
      rows: [
        ["From", who(account)],
        ["Estimate", estimate],
        ["Queue", place],
      ],
      link: adminLink(origin, account),
    }),
    account.email
  );
}

export type BillingChange = "cancelling" | "resumed" | "ended" | "payment_failed" | "plan_changed";

export function alertBilling(change: BillingChange, account: ClientAccount, subscription: ClientSubscription, origin: string) {
  const plan = planName(subscription.plan);
  const copy: Record<BillingChange, { eyebrow: string; subject: string; heading: string }> = {
    cancelling: {
      eyebrow: "Cancelling",
      subject: `${who(account)} is cancelling ${plan}`,
      heading: `${who(account)} cancelled; the plan ends ${dateLabel(subscription.current_period_end) ?? "at the end of the period"}`,
    },
    resumed: { eyebrow: "Resumed", subject: `${who(account)} kept ${plan}`, heading: `${who(account)} undid their cancellation` },
    ended: { eyebrow: "Plan ended", subject: `${who(account)}'s ${plan} plan has ended`, heading: `${who(account)}'s plan has ended` },
    payment_failed: { eyebrow: "Payment failed", subject: `Payment failed: ${who(account)} (${plan})`, heading: `A payment from ${who(account)} failed` },
    plan_changed: { eyebrow: "Plan changed", subject: `${who(account)} moved to ${plan}`, heading: `${who(account)} is now on ${plan}` },
  };
  return send(
    CRAEFTO_INBOX,
    emails.alertEmail({
      ...copy[change],
      rows: [
        ["Plan", plan],
        ["Email", account.email],
        ["Status", subscription.status],
        ["Period ends", dateLabel(subscription.current_period_end)],
      ],
      link: adminLink(origin, account),
    }),
    account.email
  );
}
