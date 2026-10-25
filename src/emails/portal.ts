import { escapeHtml } from "./_escape";
import { aside, hello, layout, paragraph, quote, facts, type Email } from "./layout";

export type { Email } from "./layout";

// Emails for the client portal: to clients (welcome, sign-in, request
// updates, replies, invoices and receipts) and to Craefto (new subscribers,
// requests, messages, billing changes and payments), in the shared layout
// (./layout.ts).

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
  outcome,
  detail,
}: {
  name: string | null;
  title: string;
  statusLabel: string;
  link: string;
  /** What was delivered, as Craefto wrote it for the client's Past work. */
  outcome?: string | null;
  /** A line more, e.g. the hours logged on a delivered request. */
  detail?: string;
}): Email {
  return {
    subject: `${statusLabel}: ${title}`,
    html: layout({
      eyebrow: statusLabel,
      heading: title,
      body:
        paragraph(hello(name)) +
        paragraph(`Your request is now <strong>${escapeHtml(statusLabel.toLowerCase())}</strong>.`) +
        (outcome ? quote(outcome) : "") +
        (detail ? paragraph(escapeHtml(detail)) : ""),
      action: { label: "View request", href: link },
    }),
  };
}

/** Craefto confirmed an estimate: the client approves it before work starts. */
export function estimateEmail({
  name,
  title,
  estimate,
  note,
  targetDate,
  link,
}: {
  name: string | null;
  title: string;
  /** "4 to 6 hours" */
  estimate: string;
  note: string | null;
  /** "Thursday 15 October" */
  targetDate: string | null;
  link: string;
}): Email {
  return {
    subject: `Estimate ready: ${title}`,
    html: layout({
      eyebrow: "Estimate ready",
      heading: title,
      body:
        paragraph(hello(name)) +
        paragraph(`Craefto Works has confirmed the estimate for this request: <strong>${escapeHtml(estimate)}</strong> of studio time.`) +
        (note ? quote(note) : "") +
        (targetDate ? paragraph(`Once it's approved, Craefto Works aims to deliver it by ${escapeHtml(targetDate)}.`) : "") +
        paragraph("Approve it in your portal and it joins your queue. Nothing starts before you do."),
      action: { label: "Review and approve", href: link },
    }),
  };
}

/** For a client Craefto adds directly (no plan bought online): their first sign-in. */
export function inviteEmail({ name, engagement, link }: { name: string | null; engagement: string | null; link: string }): Email {
  return {
    subject: "Your Craefto client portal is ready",
    html: layout({
      eyebrow: engagement ?? "Client portal",
      heading: "Your portal is ready",
      body:
        paragraph(hello(name)) +
        paragraph(
          "Your Craefto client portal is where you send requests and follow each one: its estimate before work starts, the time we put in, your queue and calendar, and messages with the team."
        ) +
        paragraph("This button signs you in. Next time, sign in with your email address and we'll send you a fresh link, so there's no password to remember."),
      action: { label: "Open your portal", href: link },
      footnote: "This link works once and expires in an hour.",
    }),
  };
}

/** An invoice issued: what it's for, what's due and how to pay. The PDF is attached. */
export function invoiceEmail({
  name,
  from,
  number,
  amount,
  due,
  summary,
  bank,
  card,
  message,
  link,
  preview,
}: {
  name: string | null;
  /** Craefto's name on the invoice: "Craefto Works" */
  from: string;
  number: string;
  /** "$3,000.00" */
  amount: string;
  /** "25 October 2026" */
  due: string;
  /** What it's for: its line, or its period. */
  summary: string;
  bank: { name: string; account_name: string; bsb: string; account_number: string } | null;
  /** Whether it can be paid by card in the portal. */
  card: boolean;
  /** A note from Craefto, above the invoice's details. */
  message?: string;
  link: string;
  /** When Craefto sends it to themselves before issuing: what the preview is, above it all. */
  preview?: string;
}): Email {
  return {
    subject: `${preview ? "Preview: " : ""}Invoice ${number} from ${from}: ${amount}`,
    html: layout({
      eyebrow: `Invoice ${number}`,
      heading: `${amount} due ${due}`,
      body:
        (preview ? aside(preview) : "") +
        paragraph(hello(name)) +
        (message ? quote(message) : "") +
        paragraph(`Here's invoice ${escapeHtml(number)}: ${escapeHtml(summary)}. The PDF is attached.`) +
        facts([
          ["Amount", amount],
          ["Due", due],
          ["Bank", bank?.name],
          ["Account name", bank?.account_name],
          ["BSB", bank?.bsb],
          ["Account", bank?.account_number],
          ["Reference", number],
        ]) +
        paragraph(card ? "Pay by bank transfer with the details above, or by card from your portal." : "Pay by bank transfer with the details above."),
      action: { label: "View invoice", href: link },
      footnote: "Questions about this invoice? Just reply to this email.",
    }),
  };
}

/** A payment arrived: the client's receipt. */
export function paymentReceivedEmail({ name, number, amount, paidOn, via, link }: { name: string | null; number: string; amount: string; paidOn: string; via: string | null; link: string }): Email {
  return {
    subject: `Payment received: invoice ${number}`,
    html: layout({
      eyebrow: "Payment received",
      heading: "Thank you",
      body:
        paragraph(hello(name)) +
        paragraph(`We've received your payment of <strong>${escapeHtml(amount)}</strong> for invoice ${escapeHtml(number)}${via ? ` by ${escapeHtml(via.toLowerCase())}` : ""}, on ${escapeHtml(paidOn)}.`) +
        paragraph("It's marked paid in your portal, where the invoice is ready to download any time."),
      action: { label: "View invoice", href: link },
    }),
  };
}

/** A titled list inside an email (the weekly summary's sections). */
function listBlock(title: string, items: string[]) {
  if (items.length === 0) return "";
  return (
    `<p style="margin: 20px 0 6px; font-size: 12px; letter-spacing: 0.06em; text-transform: uppercase; color: #686862;">${escapeHtml(title)}</p>` +
    `<ul style="margin: 0 0 8px; padding-left: 18px;">${items.map((item) => `<li style="margin: 0 0 4px;">${escapeHtml(item)}</li>`).join("")}</ul>`
  );
}

/** Friday's summary of the week's studio time: what it went into, and what's next. */
export function weeklyEmail({
  name,
  weekLabel,
  hoursWeek,
  monthLine,
  delivered,
  inProgress,
  next,
  waiting,
  link,
}: {
  name: string | null;
  /** "Week ending Friday 10 October" */
  weekLabel: string;
  /** "6.5 hours", or null for a week with no time logged (something still waits on them). */
  hoursWeek: string | null;
  monthLine: string | null;
  delivered: string[];
  inProgress: string[];
  next: string[];
  waiting: string[];
  link: string;
}): Email {
  return {
    subject: hoursWeek ? `Your week with Craefto: ${hoursWeek} of studio time` : "Your week with Craefto",
    html: layout({
      eyebrow: weekLabel,
      heading: hoursWeek ? `${hoursWeek} of studio time this week` : "Your week with Craefto",
      body:
        paragraph(hello(name)) +
        paragraph("Here's where your work stands this week.") +
        (monthLine ? paragraph(escapeHtml(monthLine)) : "") +
        listBlock("Waiting on you", waiting) +
        listBlock("Delivered this week", delivered) +
        listBlock("In progress", inProgress) +
        listBlock("Up next", next),
      action: { label: "Open your portal", href: link },
      footnote: "You get this summary on Fridays. Ask us any time if you'd rather not.",
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
