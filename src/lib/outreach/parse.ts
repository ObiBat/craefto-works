import { createHash } from "node:crypto";
import { simpleParser, type Attachment, type Headers } from "mailparser";

// Reading an email that arrived in the outreach mailbox: who it's from, what
// it answers, their new words without the quoted thread under them, and
// whether it's a delivery report or an automatic reply. Pure apart from the
// parsing: it touches nothing.

export interface DeliveryReport {
  /** failed: the address doesn't take mail; delayed: their server is still trying. */
  action: "failed" | "delayed";
  /** The enhanced status code, like 5.1.1. */
  status: string | null;
  recipient: string | null;
  diagnostic: string | null;
}

export interface IncomingEmail {
  messageId: string;
  inReplyTo: string | null;
  references: string[];
  from: { address: string; name: string | null } | null;
  subject: string;
  date: Date | null;
  /** The whole text as it arrived (made from the HTML when there's no plain text). */
  text: string;
  /** Their new words: the text without the quoted thread underneath. */
  body: string;
  /** Sent by a machine on their side: an out-of-office or an acknowledgement. */
  automatic: boolean;
  /** A mailing list or bulk mail rather than a person writing back. */
  bulk: boolean;
  /** A delivery report about one of our emails. */
  report: DeliveryReport | null;
  /** Every Message-ID of ours it mentions anywhere: a bounce quotes the original's headers. */
  mentions: string[];
}

/** Our Message-IDs, as the sender makes them (<uuid@craefto.com>). */
const OUR_ID = /<[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}@craefto\.com>/gi;

const ids = (value: string | string[] | undefined) => [value ?? []].flat().flatMap((item) => item.match(/<[^<>\s]+>/g) ?? []);

const headerText = (headers: Headers, name: string) => {
  const value = headers.get(name);
  if (value === undefined || value === null) return "";
  if (typeof value === "string") return value;
  if (typeof value === "object" && "value" in value && typeof value.value === "string") return value.value;
  return String(value);
};

// ── Quoted text ───────────────────────────────────────────────────────────

/** Lines that start the quoted thread, in the mail apps people use. */
const QUOTE_HEADERS = [
  /^-{2,}\s*original message\s*-{2,}/i,
  /^-{2,}\s*forwarded message\s*-{2,}/i,
  /^_{8,}\s*$/,
  /^(le|am|el|il|op)\s.{0,300}(a écrit|schrieb|escribió|ha scritto|schreef)\s*:?\s*$/i,
];
/** Outlook's "From: … / Sent: …" block above what it quotes. */
const OUTLOOK_FROM = /^\*?from:\*?\s/i;
const OUTLOOK_SENT = /^\*?(sent|date):\*?\s/i;

/**
 * "On Mon, 6 Oct 2026 at 11:02, Craefto Works <obi@craefto.com> wrote:", even
 * when wrapped over two lines: how many lines it takes (0 when it isn't one).
 */
function quoteIntro(lines: string[], i: number) {
  const line = lines[i].trim();
  if (!/^on\s/i.test(line)) return 0;
  if (/\bwrote:?\s*$/i.test(line)) return line.length < 400 ? 1 : 0;
  const joined = `${line} ${(lines[i + 1] ?? "").trim()}`;
  return /\bwrote:?\s*$/i.test(joined) && joined.length < 400 ? 2 : 0;
}

/** Their new words: what's above the quoted thread. Answers written between quoted lines are kept. */
export function newWords(text: string): string {
  const lines = text.replace(/\r\n?/g, "\n").split("\n");
  const quoted = (line: string) => line.trim().startsWith(">");
  let cut = lines.length;
  let span = 1;
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    const intro = quoteIntro(lines, i);
    if (QUOTE_HEADERS.some((pattern) => pattern.test(line)) || intro) {
      cut = i;
      span = intro || 1;
      break;
    }
    if (OUTLOOK_FROM.test(line) && lines.slice(i + 1, i + 5).some((next) => OUTLOOK_SENT.test(next.trim()))) {
      cut = i;
      break;
    }
    if (quoted(line) && lines.slice(i).every((rest) => !rest.trim() || quoted(rest))) {
      cut = i;
      break;
    }
  }
  // Answered inline: their lines sit between quoted ones, so keep every line that isn't quoted.
  const after = lines.slice(cut + span);
  const inline = after.some((line, j) => line.trim() && !quoted(line) && after.slice(j + 1).some(quoted));
  const kept = inline ? lines.filter((line, i) => (i < cut || i >= cut + span) && !quoted(line)) : lines.slice(0, cut).filter((line) => !quoted(line));
  return kept.join("\n").replace(/[ \t]+$/gm, "").replace(/\n{3,}/g, "\n\n").trim();
}

// ── Automatic replies and delivery reports ────────────────────────────────

const AUTO_SUBJECT = /^(\[?auto(matic)?[ -]?(reply|response|answer)|autoreply|autoresponse|out of (the )?office|ooo\b|away from|on leave|annual leave|abwesend|absence|réponse automatique|respuesta automática|auto:)/i;
const ROBOT_SENDER = /^(mailer-daemon|postmaster|mail-daemon|mailerdaemon)@/i;
const BOUNCE_SUBJECT = /undeliver|delivery status notification|delivery (failure|has failed|incomplete)|returned mail|failure notice|mail delivery (failed|subsystem|system)|could not be delivered|delivery to the following recipient/i;

function isAutomatic(headers: Headers, subject: string) {
  const submitted = headerText(headers, "auto-submitted").toLowerCase();
  if (submitted && submitted !== "no") return true;
  if (headers.has("x-autoreply") || headers.has("x-autorespond") || headers.has("x-autogenerated")) return true;
  if (/auto_reply|autoreply/i.test(headerText(headers, "precedence")) || /auto_reply/i.test(headerText(headers, "x-precedence"))) return true;
  if (/\b(oof|autoreply)\b/i.test(headerText(headers, "x-auto-response-suppress")) && AUTO_SUBJECT.test(subject.replace(/^(re|aw|fw|fwd):\s*/i, ""))) return true;
  return AUTO_SUBJECT.test(subject.replace(/^(re|aw|fw|fwd):\s*/i, "").trim());
}

/** Newsletters and other bulk mail: people writing back don't send List- headers (the parser gathers them under "list"). */
function isBulk(headers: Headers) {
  return headers.has("list") || headers.has("list-id") || headers.has("list-unsubscribe") || /^(bulk|list|junk)$/i.test(headerText(headers, "precedence").trim());
}

/** The fields of a message/delivery-status part, one block per recipient. */
function statusBlocks(content: string) {
  return content
    .replace(/\r\n?/g, "\n")
    .replace(/\n[ \t]+/g, " ")
    .split(/\n\s*\n/)
    .map((block) => {
      const fields = new Map<string, string>();
      for (const line of block.split("\n")) {
        const at = line.indexOf(":");
        if (at > 0) fields.set(line.slice(0, at).trim().toLowerCase(), line.slice(at + 1).trim());
      }
      return fields;
    });
}

const addressIn = (value: string | undefined) => value?.replace(/^rfc822;\s*/i, "").replace(/[<>]/g, "").trim().toLowerCase() || null;

function deliveryReport(contentType: string, reportType: string, subject: string, from: string, text: string, parts: Attachment[]): DeliveryReport | null {
  const looksLikeReport = (contentType === "multipart/report" && /delivery-status/i.test(reportType)) || ROBOT_SENDER.test(from) || BOUNCE_SUBJECT.test(subject);
  const statusParts = parts.filter((part) => /^message\/(global-)?delivery-status$/.test(part.contentType)).map((part) => part.content.toString("utf8"));
  if (!looksLikeReport && !statusParts.length) return null;
  // The machine-readable fields, whether the parser kept them as a part or folded them into the text.
  const blocks = [...statusParts, text].flatMap(statusBlocks).filter((block) => block.has("action") && (block.has("final-recipient") || block.has("status")));
  const block = blocks.find((b) => /failed/i.test(b.get("action") ?? "")) ?? blocks.find((b) => /delayed/i.test(b.get("action") ?? ""));
  if (block) {
    return {
      action: /failed/i.test(block.get("action") ?? "") ? "failed" : "delayed",
      status: block.get("status")?.match(/\d\.\d{1,3}\.\d{1,3}/)?.[0] ?? null,
      recipient: addressIn(block.get("final-recipient") ?? block.get("original-recipient")),
      diagnostic: (block.get("diagnostic-code") ?? "").replace(/^smtp;\s*/i, "").slice(0, 300) || null,
    };
  }
  if (!looksLikeReport) return null;
  // A report in plain words: what it says decides it.
  const failed = /\b5\.\d{1,3}\.\d{1,3}\b|\b55[0-4]\b|user unknown|unknown user|does not exist|doesn't exist|no such (user|mailbox|recipient)|address rejected|mailbox (unavailable|not found)|recipient (address )?rejected|permanent(ly)? (error|fail)/i.test(text);
  const delayed = /\bdelay(ed)?\b|will (retry|keep trying)|still trying|\b4\.\d{1,3}\.\d{1,3}\b|temporar/i.test(text);
  if (!failed && !delayed) return null;
  const recipient = (text.match(/[a-z0-9._%+'-]+@[a-z0-9.-]+\.[a-z]{2,}/gi) ?? []).map((address) => address.toLowerCase()).find((address) => !address.endsWith("@craefto.com") && !ROBOT_SENDER.test(address));
  return {
    action: failed ? "failed" : "delayed",
    status: text.match(/\b[45]\.\d{1,3}\.\d{1,3}\b/)?.[0] ?? null,
    recipient: recipient ?? null,
    diagnostic: text.match(/^.*\b(5\d\d|4\d\d)\b.*$/m)?.[0].trim().slice(0, 300) ?? null,
  };
}

// ── The whole message ─────────────────────────────────────────────────────

/** The longest text kept on record. */
const MAX_TEXT = 20_000;

export async function parseEmail(raw: Buffer): Promise<IncomingEmail> {
  const mail = await simpleParser(raw, { skipImageLinks: true, skipTextToHtml: true, skipTextLinks: true });
  const from = mail.from?.value.find((entry) => entry.address);
  const subject = (mail.subject ?? "").trim();
  const contentType = headerText(mail.headers, "content-type").toLowerCase();
  const contentTypeHeader = mail.headers.get("content-type") as { params?: Record<string, string> } | undefined;
  const text = (mail.text ?? "").replace(/\r\n?/g, "\n").trim().slice(0, MAX_TEXT);
  const fromAddress = from?.address?.toLowerCase() ?? "";

  // Our ids anywhere in it: the raw message, and parts a bounce may have encoded.
  const haystack = [raw.toString("latin1"), ...mail.attachments.filter((part) => /^(message|text)\//.test(part.contentType)).map((part) => part.content.toString("utf8"))].join("\n");
  const mentions = [...new Set((haystack.match(OUR_ID) ?? []).map((id) => id.toLowerCase()))];

  const report = deliveryReport(contentType, contentTypeHeader?.params?.["report-type"] ?? "", subject, fromAddress, text, mail.attachments);
  const messageId = mail.messageId?.trim() || null;
  return {
    messageId: messageId && /^<.+>$/.test(messageId) ? messageId : messageId ? `<${messageId}>` : `<no-id-${hashOf(raw)}@craefto.invalid>`,
    inReplyTo: ids(mail.inReplyTo)[0] ?? null,
    references: ids(mail.references),
    from: from?.address ? { address: fromAddress, name: from.name?.trim() || null } : null,
    subject,
    date: mail.date ?? null,
    text,
    body: report ? text : newWords(text) || text,
    automatic: !report && isAutomatic(mail.headers, subject),
    bulk: isBulk(mail.headers),
    report,
    mentions,
  };
}

/** A stand-in id for the rare message without one, the same every time it's read. */
const hashOf = (raw: Buffer) => createHash("sha256").update(raw).digest("hex").slice(0, 32);
