import { escapeHtml } from "./_escape";
import { layout, paragraph, type Email } from "./layout";

// The email an enquirer gets back. It goes to whatever address was typed on
// the form, so it repeats nothing they wrote except a first name cleaned down
// to letters: the form can't be used to send our branding with someone
// else's words in it.

/** A first name safe to print: letters, apostrophes and hyphens, at most 30. */
export function safeFirstName(name: string | null | undefined): string | null {
  const first = (name ?? "").trim().split(/\s+/)[0] ?? "";
  const clean = first.normalize("NFC").replace(/[^\p{L}\p{M}'’-]/gu, "").slice(0, 30);
  return clean ? clean : null;
}

export function enquiryConfirmationEmail({
  name,
  phrase,
  bookingUrl,
}: {
  name: string | null;
  /** What the enquiry is about, from lib/enquiry.ts ("a website"). */
  phrase?: string | null;
  bookingUrl: string;
}): Email {
  const first = safeFirstName(name) ?? "there";
  const thanks = (about: string) => `Thanks for your enquiry${about}. We read every one ourselves, and you'll hear back within one to two business days.`;
  const call = "If it's easier to talk it through, book a free 30-minute call at a time that suits you";
  const why = "You're receiving this because this address was given with an enquiry at craefto.com. If that wasn't you, you can ignore this email.";
  return {
    subject: "We've received your enquiry",
    html: layout({
      eyebrow: "Enquiry received",
      heading: "Thanks for getting in touch",
      body: paragraph(`Hi ${escapeHtml(first)},`) + paragraph(thanks(phrase ? ` about ${escapeHtml(phrase)}` : "")) + paragraph(`${call}.`),
      action: { label: "Book a free call", href: bookingUrl },
      footnote: why,
    }),
    // Written out rather than left to the sender to derive from the HTML, which runs the heading and button into the text.
    text: [`Hi ${first},`, thanks(phrase ? ` about ${phrase}` : ""), `${call}:\n${bookingUrl}`, "Craefto Works\nSydney, Australia\nhttps://www.craefto.com", why].join("\n\n"),
  };
}
