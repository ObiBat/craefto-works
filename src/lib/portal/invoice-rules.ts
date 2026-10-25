import { periodOf } from "./hours";
import type { ClientInvoice, InvoiceItem } from "./types";

// Invoices' rules (lib/portal/invoices.ts): their lines and totals, money and
// dates as they read, where an invoice stands, and the month a retainer
// invoice covers. No server imports, so admin's editor and the portal share
// them.

export class InvoiceInputError extends Error {}

/** GST, once Craefto is registered for it. */
export const GST_RATE = 0.1;

const MAX_ITEMS = 20;

/** A line's amount: its quantity at its unit price, to the cent. */
export const lineAmount = (item: Pick<InvoiceItem, "quantity" | "unit_amount">) => Math.round(item.quantity * item.unit_amount);

/** The lines' subtotal, the GST on it (when charged) and the total, in cents. */
export function invoiceTotals(items: Array<Pick<InvoiceItem, "quantity" | "unit_amount">>, chargesGst: boolean) {
  const subtotal = items.reduce((sum, item) => sum + lineAmount(item), 0);
  const gst = chargesGst ? Math.round(subtotal * GST_RATE) : 0;
  return { subtotal, gst, total: subtotal + gst };
}

const aud = new Intl.NumberFormat("en-AU", { style: "currency", currency: "AUD", minimumFractionDigits: 2, maximumFractionDigits: 2 });

/** "$3,000.00" for 300000 cents. */
export const formatMoney = (cents: number) => aud.format(cents / 100);

/** Cents from what someone typed: "3000", "$3,000.50", "3 000". Null if it isn't an amount. */
export function parseMoney(value: unknown): number | null {
  const text = typeof value === "number" ? String(value) : typeof value === "string" ? value.replace(/[$,\s]|AUD/gi, "") : "";
  if (!/^-?\d+(\.\d{1,2})?$/.test(text)) return null;
  return Math.round(Number(text) * 100);
}

/** Dollars for an input field: 300000 → "3000", 12345 → "123.45". */
export const moneyInput = (cents: number) => (cents % 100 === 0 ? String(cents / 100) : (cents / 100).toFixed(2));

const isDate = (value: unknown): value is string => typeof value === "string" && /^\d{4}-\d{2}-\d{2}$/.test(value) && !Number.isNaN(Date.parse(`${value}T00:00:00Z`));

/** A yyyy-mm-dd date as words: "25 October 2026", or "25 Oct 2026" short. */
export function invoiceDate(date: string, short = false) {
  return new Date(`${date}T12:00:00Z`).toLocaleDateString("en-AU", { day: "numeric", month: short ? "short" : "long", year: "numeric", timeZone: "UTC" });
}

/** "25 October to 24 November 2026"; across a new year, each date has its year. Short: "25 Oct – 24 Nov 2026". */
export function periodLabel(start: string, end: string, short = false) {
  const month = short ? "short" : "long";
  const sameYear = start.slice(0, 4) === end.slice(0, 4);
  const from = new Date(`${start}T12:00:00Z`).toLocaleDateString("en-AU", { day: "numeric", month, ...(sameYear ? {} : { year: "numeric" }), timeZone: "UTC" });
  return `${from}${short ? " – " : " to "}${invoiceDate(end, short)}`;
}

/** The day after (or before, with -1) a yyyy-mm-dd date. */
export function addDays(date: string, days: number) {
  const next = new Date(`${date}T00:00:00Z`);
  next.setUTCDate(next.getUTCDate() + days);
  return next.toISOString().slice(0, 10);
}

/** The day a timestamp falls on in Sydney, yyyy-mm-dd. */
export const sydneyDay = (iso: string) =>
  new Intl.DateTimeFormat("en-CA", { timeZone: "Australia/Sydney", year: "numeric", month: "2-digit", day: "2-digit" }).format(new Date(iso));

export type Standing = "draft" | "due" | "overdue" | "paid" | "void";

/** Where an invoice stands today: an issued one is due until its due date, then overdue. */
export function standingOf(invoice: Pick<ClientInvoice, "status" | "due_date">, today: string): Standing {
  if (invoice.status === "issued") return invoice.due_date < today ? "overdue" : "due";
  return invoice.status;
}

/** How each standing reads, and its tone (the portal's StatusPill tones). */
export const STANDINGS: Record<Standing, { label: string; tone: "quiet" | "active" | "attention" | "done" }> = {
  draft: { label: "Draft", tone: "quiet" },
  due: { label: "Due", tone: "active" },
  overdue: { label: "Overdue", tone: "attention" },
  paid: { label: "Paid", tone: "done" },
  void: { label: "Void", tone: "quiet" },
};

export const PAID_VIA = { bank_transfer: "Bank transfer", card: "Card", other: "Other" } as const;

/** What an invoice is for, in a few words: its period, or its first line. */
export const invoiceSummary = (invoice: Pick<ClientInvoice, "period_start" | "period_end" | "items">) =>
  invoice.period_start && invoice.period_end ? periodLabel(invoice.period_start, invoice.period_end, true) : invoice.items[0]?.description || "Invoice";

/** "INV-2026-011-JapanoMa.pdf", or "Draft-invoice-JapanoMa.pdf" before it has a number. */
export function invoiceFileName(invoice: Pick<ClientInvoice, "number">, client: string | null) {
  const who = (client ?? "").normalize("NFKD").replace(/[^\w-]+/g, "");
  return `${invoice.number ?? "Draft-invoice"}${who ? `-${who}` : ""}.pdf`;
}

/** A line's detail as paragraphs and list items: lines starting "- ", "• " or "* " are list items. */
export function detailBlocks(detail: string): Array<{ list: boolean; text: string }> {
  return detail
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => {
      const item = line.match(/^(?:[-•*])\s+(.*)$/);
      return item ? { list: true, text: item[1] } : { list: false, text: line };
    });
}

/**
 * The month a retainer invoice covers on a given day, billed in advance: the
 * month running now, or the next one once it starts within the week. With the
 * month before it, whose delivered work the invoice lists.
 */
export function retainerMonth(today: string, cycleDay: number) {
  const current = periodOf(today, cycleDay);
  const period = addDays(today, 7) >= current.renews ? periodOf(current.renews, cycleDay) : current;
  const before = periodOf(addDays(period.from, -1), cycleDay);
  return { start: period.from, end: period.to, workStart: before.from, workEnd: before.to };
}

/** An invoice's editable fields, checked: what admin sends to save a draft. */
export interface DraftInput {
  bill_to_name: string;
  bill_to_address: string;
  bill_to_email: string;
  issue_date: string;
  due_date: string;
  period_start: string | null;
  period_end: string | null;
  items: InvoiceItem[];
  notes: string;
  work_start: string | null;
  work_end: string | null;
}

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function itemsInput(value: unknown): InvoiceItem[] {
  if (!Array.isArray(value)) throw new InvoiceInputError("The invoice's lines didn't come through.");
  if (value.length > MAX_ITEMS) throw new InvoiceInputError(`An invoice can have up to ${MAX_ITEMS} lines.`);
  return value.map((raw, index) => {
    const row = (raw ?? {}) as Record<string, unknown>;
    const description = typeof row.description === "string" ? row.description.trim() : "";
    const detail = typeof row.detail === "string" ? row.detail.trim() : "";
    const quantity = Number(row.quantity ?? 1);
    const unit = typeof row.unit_amount === "number" ? row.unit_amount : parseMoney(row.unit_amount);
    const which = `Line ${index + 1}`;
    if (!description) throw new InvoiceInputError(`${which} needs a description.`);
    if (description.length > 200) throw new InvoiceInputError(`${which}: keep the description under 200 characters; the detail can say more.`);
    if (detail.length > 2000) throw new InvoiceInputError(`${which}: keep the detail under 2,000 characters.`);
    if (!(Number.isFinite(quantity) && quantity > 0 && quantity <= 10000)) throw new InvoiceInputError(`${which}: the quantity must be more than 0.`);
    if (unit === null || !Number.isInteger(unit) || unit < 0 || unit > 100_000_000) throw new InvoiceInputError(`${which}: enter its price in dollars, like 3000 or 150.50.`);
    return { description, detail, quantity: Math.round(quantity * 100) / 100, unit_amount: unit };
  });
}

/** Two optional dates that go together: both or neither, the second not before the first. */
function dateWindow(start: unknown, end: unknown, what: string): [string | null, string | null] {
  const from = start ? start : null;
  const to = end ? end : null;
  if (from === null && to === null) return [null, null];
  if (!isDate(from) || !isDate(to)) throw new InvoiceInputError(`Give the ${what} both days, or neither.`);
  if (to < from) throw new InvoiceInputError(`The ${what} ends before it starts.`);
  return [from, to];
}

/** A draft's fields from admin's editor, checked and trimmed. */
export function draftInput(input: Record<string, unknown>): DraftInput {
  const text = (value: unknown, max: number) => (typeof value === "string" ? value.trim().slice(0, max) : "");
  const billToName = text(input.bill_to_name, 200);
  const billToEmail = text(input.bill_to_email, 320).toLowerCase();
  if (!billToName) throw new InvoiceInputError("Who is it made out to? Give the business's name.");
  if (!EMAIL.test(billToEmail)) throw new InvoiceInputError("Give the email the invoice goes to.");
  if (!isDate(input.issue_date) || !isDate(input.due_date)) throw new InvoiceInputError("Give the invoice its issue and due dates.");
  if (input.due_date < input.issue_date) throw new InvoiceInputError("The due date can't come before the issue date.");
  const [periodStart, periodEnd] = dateWindow(input.period_start, input.period_end, "period");
  const [workStart, workEnd] = dateWindow(input.work_start, input.work_end, "delivered work");
  return {
    bill_to_name: billToName,
    bill_to_address: text(input.bill_to_address, 500)
      .split("\n")
      .map((line) => line.trim())
      .filter(Boolean)
      .join("\n"),
    bill_to_email: billToEmail,
    issue_date: input.issue_date,
    due_date: input.due_date,
    period_start: periodStart,
    period_end: periodEnd,
    items: itemsInput(input.items),
    notes: text(input.notes, 2000),
    work_start: workStart,
    work_end: workEnd,
  };
}

/** What stops a draft being issued, if anything. */
export function issueProblem(invoice: Pick<ClientInvoice, "items" | "total">): string | null {
  if (invoice.items.length === 0) return "Add a line before issuing it.";
  if (invoice.total <= 0) return "The invoice comes to nothing: give its lines their prices.";
  return null;
}
