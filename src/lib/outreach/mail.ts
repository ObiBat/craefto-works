import "server-only";
import { ImapFlow } from "imapflow";
import nodemailer from "nodemailer";
import MailComposer from "nodemailer/lib/mail-composer";

// The outreach mailbox, obi@craefto.com on Spacemail, spoken to over the
// standard protocols (Spacemail's own settings: SMTP 465 SSL, IMAP 993 SSL,
// the full address as the login). Sending, filing a copy in Sent, and
// looking for replies all go through the Mailer interface, so the sender can
// be tested without a mailbox.

export const SENDER = { name: "Obi Batbileg", address: process.env.OUTREACH_MAILBOX_USER || "obi@craefto.com" };
const HOST = process.env.OUTREACH_MAIL_HOST || "mail.spacemail.com";

export interface OutgoingEmail {
  messageId: string;
  to: string[];
  subject: string;
  text: string;
  inReplyTo?: string;
  references?: string[];
  headers?: Record<string, string>;
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
  /** How many messages from this address, or anyone at the domain, arrived since a date (inbox and junk). */
  messagesFrom(address: string, domain: string, since: Date): Promise<number>;
}

/** The RFC 5322 message, plain text only: no HTML, no tracking. */
export function compose(email: OutgoingEmail): Promise<Buffer> {
  const composer = new MailComposer({
    from: SENDER,
    to: email.to,
    subject: email.subject,
    text: email.text,
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

    async messagesFrom(address, domain, since) {
      return withImap(async (client) => {
        const folders = await client.list();
        const boxes = ["INBOX", ...folders.filter((folder) => folder.specialUse === "\\Junk").map((folder) => folder.path)];
        let found = 0;
        for (const box of boxes) {
          const lock = await client.getMailboxLock(box);
          try {
            const byAddress = await client.search({ from: address, since }, { uid: true });
            const byDomain = await client.search({ from: `@${domain}`, since }, { uid: true });
            found += new Set([...(byAddress || []), ...(byDomain || [])]).size;
          } finally {
            lock.release();
          }
        }
        return found;
      });
    },
  };
}
