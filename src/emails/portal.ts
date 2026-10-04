import { escapeHtml } from "./_escape";
import { hello, layout, paragraph, quote, facts, type Email } from "./layout";

export type { Email } from "./layout";

// Emails for the client portal: to clients (welcome, sign-in, request
// updates, replies) and to Craefto (new subscribers, requests, messages and
// billing changes), in the shared layout (./layout.ts).

// ── To clients ────────────────────────────────────────────────────────────

export function welcomeEmail({ name, planName, portalUrl }: { name: string | null; planName: string; portalUrl: string }): Email {
  return {
    subject: `Welcome to Craefto ${planName}`,
    html: layout({
      eyebrow: `${planName} plan`,
      heading: "You're all set",
      body:
        paragraph(hello(name)) +
        paragraph(`Thanks for subscribing to the ${escapeHtml(planName)} plan. Your portal is where you send requests, follow their progress, message us and manage billing.`) +
        paragraph("Send your first request whenever you're ready, and we'll take it from there."),
      action: { label: "Open your portal", href: portalUrl },
      footnote: "You can sign in any time with this email address; we'll send you a link, so there's no password to remember.",
    }),
  };
}

export function signInEmail({ name, link }: { name: string | null; link: string }): Email {
  return {
    subject: "Your sign-in link for Craefto",
    html: layout({
      eyebrow: "Client portal",
      heading: "Sign in to your portal",
      body: paragraph(hello(name)) + paragraph("Here's your link to sign in. It works once and expires in an hour."),
      action: { label: "Sign in", href: link },
      footnote: "If you didn't ask for this, you can ignore this email.",
    }),
  };
}

export function requestUpdateEmail({
  name,
  title,
  statusLabel,
  link,
}: {
  name: string | null;
  title: string;
  statusLabel: string;
  link: string;
}): Email {
  return {
    subject: `${statusLabel}: ${title}`,
    html: layout({
      eyebrow: statusLabel,
      heading: title,
      body: paragraph(hello(name)) + paragraph(`Your request is now <strong>${escapeHtml(statusLabel.toLowerCase())}</strong>.`),
      action: { label: "View request", href: link },
    }),
  };
}

export function replyEmail({
  name,
  about,
  body,
  link,
  files,
  statusLabel,
}: {
  name: string | null;
  about: string | null;
  body: string;
  link: string;
  /** Names of files sent with it. */
  files?: string[];
  /** Set when the reply also moved the request on. */
  statusLabel?: string;
}): Email {
  const status = statusLabel ? paragraph(`Your request is now <strong>${escapeHtml(statusLabel.toLowerCase())}</strong>.`) : "";
  const attached = files?.length
    ? paragraph(`${files.length === 1 ? "A file is" : `${files.length} files are`} attached: ${files.map(escapeHtml).join(", ")}. Download ${files.length === 1 ? "it" : "them"} from your portal.`)
    : "";
  return {
    subject: about ? `Re: ${about}` : "New message from Craefto",
    html: layout({
      eyebrow: statusLabel ?? "New message",
      heading: about ?? "A message from Craefto",
      body: paragraph(hello(name)) + status + (body ? quote(body) : "") + attached,
      action: { label: "Reply in your portal", href: link },
    }),
  };
}

// ── To Craefto ────────────────────────────────────────────────────────────

export function alertEmail({
  eyebrow,
  subject,
  heading,
  rows,
  text,
  link,
}: {
  eyebrow: string;
  subject: string;
  heading: string;
  rows: Array<[string, string | null | undefined]>;
  text?: string;
  link: string;
}): Email {
  return {
    subject,
    html: layout({
      eyebrow,
      heading,
      body: facts(rows) + (text ? quote(text) : ""),
      action: { label: "Open in admin", href: link },
    }),
  };
}
