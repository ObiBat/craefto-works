import "server-only";
import { ImapFlow, type FetchMessageObject } from "imapflow";
import nodemailer from "nodemailer";
import MailComposer from "nodemailer/lib/mail-composer";

// The outreach mailbox, obi@craefto.com on Spacemail, spoken to over the
// standard protocols (Spacemail's own settings: SMTP 465 SSL, IMAP 993 SSL,
// the full address as the login). Sending and filing a copy in Sent go
// through the Mailer interface, reading replies through the Inbox, so both
// can be tested without a mailbox.

/** The name inboxes show: the business (the signature inside still names Obi). */
export const SENDER = { name: "Craefto Works", address: process.env.OUTREACH_MAILBOX_USER || "obi@craefto.com" };
const HOST = process.env.OUTREACH_MAIL_HOST || "mail.spacemail.com";

export interface OutgoingEmail {
  messageId: string;
  to: string[];
  subject: string;
  text: string;
  inReplyTo?: string;
  references?: string[];
  headers?: Record<string, string>;
  /** The HTML version mail apps show (lib/outreach/email-html.ts); the text stays the approved words. */
  html?: string;
  /** Inline images the HTML refers to by cid:. */
  attachments?: { filename: string; content: Buffer; contentType: string; cid: string; contentDisposition: "inline" }[];
}

export type SendResult =
  | { ok: true; response: string }
  /** bounce: the server refused the recipient; auth: the mailbox login failed; rejected: the message itself was refused; temporary: try later. */
  | { ok: false; kind: "bounce" | "auth" | "rejected" | "temporary"; error: string; response?: string };

export interface Mailer {
  /** Sends the exact bytes given (the same bytes are filed in Sent). */
  send(raw: Buffer, envelope: { from: string; to: string[] }): Promise<SendResult>;
  /** Files a copy in the mailbox's Sent folder. */
  saveToSent(raw: Buffer): Promise<boolean>;
}

/** What the inbox shows of a message before it's opened: enough to tell whether it answers outreach. */
export interface InboxHeader {
  mailbox: string;
  uid: number;
  size: number;
  messageId: string | null;
  inReplyTo: string | null;
  references: string[];
  from: { address: string; name: string | null } | null;
  subject: string;
  date: Date | null;
  /** "multipart/report" for delivery reports. */
  contentType: string;
}

/** Where reading a mailbox got to. UIDs only mean something with their UIDVALIDITY. */
export interface Cursor {
  mailbox: string;
  uidValidity: string | null;
  lastUid: number;
}

export interface InboxBatch {
  mailbox: string;
  uidValidity: string;
  /** Everything up to this UID has been looked at, wanted or not. */
  lastUid: number;
  /** The wanted messages, oldest first. */
  messages: { header: InboxHeader; raw: Buffer }[];
}

export interface Inbox {
  /**
   * What's new in the inbox and spam since each cursor (from `since` when a
   * mailbox has none, or its UIDVALIDITY changed): headers first, then whole
   * messages only for the ones `wanted` keeps, at most `limit` of them. Opens
   * the mailboxes read-only, so nothing is marked read or moved.
   */
  read(options: { cursors: Cursor[]; since: Date; wanted: (header: InboxHeader) => boolean; limit: number }): Promise<InboxBatch[]>;
}

/** The RFC 5322 message: the plain text, plus an HTML version when given. No tracking. */
export function compose(email: OutgoingEmail): Promise<Buffer> {
  const composer = new MailComposer({
    from: SENDER,
    to: email.to,
    subject: email.subject,
    text: email.text,
    html: email.html,
    attachments: email.attachments,
    messageId: email.messageId,
    inReplyTo: email.inReplyTo,
    references: email.references,
    date: new Date(),
    headers: email.headers,
  });
  return new Promise((resolve, reject) => composer.compile().build((error, message) => (error ? reject(error) : resolve(message))));
}

export function mailboxConfigured() {
  return Boolean(process.env.OUTREACH_MAILBOX_PASSWORD);
}

const auth = () => ({ user: SENDER.address, pass: process.env.OUTREACH_MAILBOX_PASSWORD ?? "" });

interface SmtpError extends Error {
  code?: string;
  command?: string;
  response?: string;
  responseCode?: number;
  rejected?: string[];
}

function classify(error: SmtpError): SendResult {
  const response = error.response ?? error.message;
  if (error.code === "EAUTH") return { ok: false, kind: "auth", error: "Spacemail refused the mailbox login", response };
  if ((error.responseCode ?? 0) >= 500) {
    const recipient = error.code === "EENVELOPE" || error.command === "RCPT TO" || (error.rejected?.length ?? 0) > 0;
    return { ok: false, kind: recipient ? "bounce" : "rejected", error: recipient ? "The recipient's server refused the address" : "The message was refused", response };
  }
  return { ok: false, kind: "temporary", error: error.code ? `${error.code}: ${error.message}` : error.message, response };
}

async function withImap<T>(run: (client: ImapFlow) => Promise<T>): Promise<T> {
  const client = new ImapFlow({ host: HOST, port: 993, secure: true, auth: auth(), logger: false, socketTimeout: 30_000 });
  await client.connect();
  try {
    return await run(client);
  } finally {
    await client.logout().catch(() => client.close());
  }
}

/** The real mailbox. */
export function spacemail(): Mailer {
  return {
    async send(raw, envelope) {
      const transport = nodemailer.createTransport({ host: HOST, port: 465, secure: true, auth: auth(), connectionTimeout: 20_000, socketTimeout: 30_000 });
      try {
        const info = await transport.sendMail({ envelope, raw });
        return { ok: true, response: info.response };
      } catch (error) {
        return classify(error as SmtpError);
      } finally {
        transport.close();
      }
    },

    async saveToSent(raw) {
      try {
        return await withImap(async (client) => {
          const folders = await client.list();
          const sent = folders.find((folder) => folder.specialUse === "\\Sent")?.path ?? "Sent";
          await client.append(sent, raw, ["\\Seen"]);
          return true;
        });
      } catch (error) {
        console.error("Outreach: couldn't file a copy in Sent:", (error as Error).message);
        return false;
      }
    },

  };
}

/** At most this many new headers are looked at per mailbox per read; the rest wait for the next. */
const HEADER_BATCH = 500;
/** Anything bigger is read only this far: the words come first, attachments after. */
const MAX_SOURCE = 2_000_000;

const ids = (value: string) => value.match(/<[^<>\s]+>/g) ?? [];

/** Unfolds the header lines fetched with HEADER.FIELDS into lowercase name → value. */
function headerFields(buffer: Buffer | undefined) {
  const fields = new Map<string, string>();
  const text = (buffer?.toString("utf8") ?? "").replace(/\r?\n[ \t]+/g, " ");
  for (const line of text.split(/\r?\n/)) {
    const at = line.indexOf(":");
    if (at > 0) fields.set(line.slice(0, at).trim().toLowerCase(), line.slice(at + 1).trim());
  }
  return fields;
}

function toHeader(mailbox: string, message: FetchMessageObject): InboxHeader {
  const envelope = message.envelope;
  const fields = headerFields(message.headers);
  const from = envelope?.from?.[0];
  return {
    mailbox,
    uid: message.uid,
    size: message.size ?? 0,
    messageId: envelope?.messageId ?? null,
    inReplyTo: envelope?.inReplyTo ? (ids(envelope.inReplyTo)[0] ?? envelope.inReplyTo) : null,
    references: ids(fields.get("references") ?? ""),
    from: from?.address ? { address: from.address.toLowerCase(), name: from.name || null } : null,
    subject: envelope?.subject ?? "",
    date: envelope?.date ? new Date(envelope.date) : null,
    contentType: (fields.get("content-type") ?? "").split(";")[0].trim().toLowerCase(),
  };
}

/** The real mailbox's inbox and spam folder. */
export function spacemailInbox(): Inbox {
  return {
    async read({ cursors, since, wanted, limit }) {
      return withImap(async (client) => {
        const folders = await client.list();
        const boxes = ["INBOX", ...folders.filter((folder) => folder.specialUse === "\\Junk").map((folder) => folder.path)];
        const batches: InboxBatch[] = [];
        let left = limit;
        for (const box of boxes) {
          const lock = await client.getMailboxLock(box, { readOnly: true });
          try {
            if (!client.mailbox) continue;
            const uidValidity = String(client.mailbox.uidValidity);
            const cursor = cursors.find((c) => c.mailbox === box && c.uidValidity === uidValidity);
            const from = cursor?.lastUid ?? 0;
            const batch: InboxBatch = { mailbox: box, uidValidity, lastUid: from, messages: [] };
            batches.push(batch);
            if (cursor && client.mailbox.uidNext <= from + 1) continue;

            // Without a cursor, only what arrived since `since`; with one, everything after it.
            const range = cursor ? `${from + 1}:*` : (await client.search({ since }, { uid: true })) || [];
            if (Array.isArray(range) && !range.length) {
              batch.lastUid = Math.max(from, client.mailbox.uidNext - 1);
              continue;
            }
            const headers: InboxHeader[] = [];
            for await (const message of client.fetch(range, { uid: true, envelope: true, size: true, headers: ["references", "content-type"] }, { uid: true })) {
              // "n:*" returns the newest message even when it's older than n.
              if (message.uid > from) headers.push(toHeader(box, message));
            }
            headers.sort((a, b) => a.uid - b.uid);
            for (const header of headers.slice(0, HEADER_BATCH)) {
              if (wanted(header)) {
                if (left <= 0) break;
                const full = await client.fetchOne(String(header.uid), { source: header.size > MAX_SOURCE ? { maxLength: MAX_SOURCE } : true }, { uid: true });
                if (full && full.source) batch.messages.push({ header, raw: full.source });
                left--;
              }
              batch.lastUid = header.uid;
            }
          } finally {
            lock.release();
          }
        }
        return batches;
      });
    },
  };
}
