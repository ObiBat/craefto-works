import "server-only";
import { siteConfig } from "@/lib/constants";
import { createServerClient } from "@/lib/supabase";
import { chargesGst, isStripeConfigured, stripe } from "@/lib/stripe";
import { sydneyToday } from "./hours";
import { InvoiceInputError, addDays, draftInput, invoiceFileName, invoiceSummary, invoiceTotals, issueProblem, periodLabel, retainerMonth, sydneyDay } from "./invoice-rules";
import { CRAEFTO_INBOX, alertInvoicePaid, sendInvoice, sendInvoicePreview, sendPaymentReceived } from "./notify";
import type { ClientAccount, ClientInvoice, ClientRequest, InvoiceIssuer, InvoiceItem, InvoiceWork } from "./types";

// Invoices Craefto issues from admin (supabase/migrations/033_client_invoices.sql):
// drafted (a retainer's month in one step), issued with the next number and
// emailed with the PDF, then paid by bank transfer (marked in admin) or by
// card through Stripe Checkout (marked by the webhook). Service role; the
// admin API is guarded by src/proxy.ts, and the portal reads only a client's
// own issued invoices.

export { InvoiceInputError } from "./invoice-rules";

const db = () => createServerClient();

/** A retainer line's detail until the client has an invoice to carry it over from. */
const RETAINER_DETAIL = "Studio time across design, development and content, planned with you each week.";

/**
 * Craefto's details for invoices, from the environment (set in Vercel), so
 * the bank account stays out of the repository. `missing` names what's unset
 * that an invoice can't go out without.
 */
export function currentIssuer(): { issuer: InvoiceIssuer; missing: string[] } {
  const env = (name: string) => process.env[name]?.trim() || "";
  const bank = { name: env("BILLING_BANK"), account_name: env("BILLING_ACCOUNT_NAME"), bsb: env("BILLING_BSB"), account_number: env("BILLING_ACCOUNT_NUMBER") };
  return {
    issuer: {
      name: env("BILLING_NAME") || siteConfig.studioName,
      abn: env("BILLING_ABN"),
      // "48 Atchison Street, St Leonards NSW 2065": a line at each comma.
      address: env("BILLING_ADDRESS").split(/\s*[,\n]\s*/).filter(Boolean),
      email: env("BILLING_EMAIL") || CRAEFTO_INBOX,
      gst_registered: chargesGst(),
      bank: bank.bsb && bank.account_number ? bank : null,
    },
    missing: ["BILLING_ABN", "BILLING_ACCOUNT_NAME", "BILLING_BSB", "BILLING_ACCOUNT_NUMBER"].filter((name) => !env(name)),
  };
}

/** Whether clients can pay invoices by card (Stripe is set up). */
export const cardPayments = () => isStripeConfigured();

/** Where the PDF tells clients to pay by card: the live portal, wherever it was made. */
const PAY_ONLINE = `${siteConfig.url.replace(/^https?:\/\//, "")}/portal/billing`;

// ── Reading ────────────────────────────────────────────────────────────────

/** Every invoice of an account, drafts included, newest first (admin). */
export async function invoicesOf(accountId: string): Promise<ClientInvoice[]> {
  const { data, error } = await db().from("client_invoices").select("*").eq("account_id", accountId).order("issue_date", { ascending: false }).order("created_at", { ascending: false });
  if (error) throw error;
  return (data ?? []) as ClientInvoice[];
}

async function own(accountId: string, id: string): Promise<ClientInvoice> {
  const { data } = await db().from("client_invoices").select("*").eq("id", id).eq("account_id", accountId).maybeSingle();
  if (!data) throw new InvoiceInputError("That invoice isn't there any more.");
  return data as ClientInvoice;
}

async function accountOf(accountId: string): Promise<ClientAccount> {
  const { data, error } = await db().from("client_accounts").select("*").eq("id", accountId).single();
  if (error) throw error;
  return data as ClientAccount;
}

/** The requests delivered between two days (Sydney), oldest first, as an invoice lists them. */
export async function workBetween(accountId: string, start: string, end: string): Promise<InvoiceWork[]> {
  // A day either side in UTC covers Sydney's offset; the exact days are checked below.
  const { data, error } = await db()
    .from("client_requests")
    .select("id, title, delivered_at")
    .eq("account_id", accountId)
    .eq("status", "delivered")
    .gte("delivered_at", `${addDays(start, -1)}T00:00:00Z`)
    .lte("delivered_at", `${addDays(end, 1)}T23:59:59Z`)
    .order("delivered_at");
  if (error) throw error;
  return ((data ?? []) as Array<Pick<ClientRequest, "id" | "title" | "delivered_at">>)
    .map((request) => ({ request_id: request.id, title: request.title, delivered_on: sydneyDay(request.delivered_at!) }))
    .filter((item) => item.delivered_on >= start && item.delivered_on <= end);
}

/** The invoice as a PDF, with its file name ("INV-2026-011-JapanoMa.pdf"). */
export async function invoicePdf(invoice: ClientInvoice): Promise<{ pdf: Buffer; filename: string }> {
  const account = await accountOf(invoice.account_id);
  const work = invoice.status !== "draft" ? invoice.work : invoice.work_start && invoice.work_end ? await workBetween(invoice.account_id, invoice.work_start, invoice.work_end) : [];
  // Loaded when a PDF is made, so the routes that only read invoices don't load the renderer.
  const { renderInvoicePdf } = await import("./invoice-pdf");
  const pdf = await renderInvoicePdf({
    invoice,
    issuer: invoice.issuer ?? currentIssuer().issuer,
    work,
    payOnline: cardPayments() ? PAY_ONLINE : null,
    today: sydneyToday(),
  });
  return { pdf, filename: invoiceFileName(invoice, account.company || account.name) };
}

// ── Drafting ───────────────────────────────────────────────────────────────

/** Who an account's invoices are made out to, unless an invoice says otherwise. */
const billTo = (account: ClientAccount) => ({
  bill_to_name: account.billing_name || account.company || account.name || account.email,
  bill_to_address: account.billing_address ?? "",
  bill_to_email: account.billing_email || account.email,
});

/**
 * A new draft. A retainer's is the month billed in advance at the agreed fee,
 * due as the month starts, listing the month before's delivered work, in the
 * words of the client's last invoice. A blank one has a line to fill in.
 */
export async function createDraft(accountId: string, kind: "retainer" | "blank"): Promise<ClientInvoice> {
  const account = await accountOf(accountId);
  const today = sydneyToday();
  const invoices = await invoicesOf(accountId);
  const last = invoices.find((invoice) => invoice.status !== "draft" && invoice.status !== "void");
  let fields: Partial<ClientInvoice>;
  if (kind === "retainer") {
    if (!account.monthly_fee) throw new InvoiceInputError("Set their monthly fee under Billing details first.");
    const month = retainerMonth(today, account.cycle_day ?? 1);
    const taken = invoices.find((invoice) => invoice.status !== "void" && invoice.period_start === month.start);
    if (taken) throw new InvoiceInputError(`${periodLabel(month.start, month.end)} already has ${taken.number ? `invoice ${taken.number}` : "a draft"}.`);
    const lastRetainer = invoices.find((invoice) => invoice.status !== "void" && invoice.period_start);
    const items: InvoiceItem[] = [
      {
        description: `${account.company || account.engagement || "Studio"} monthly retainer, ${periodLabel(month.start, month.end)}`,
        detail: lastRetainer?.items[0]?.detail ?? RETAINER_DETAIL,
        quantity: 1,
        unit_amount: account.monthly_fee,
      },
    ];
    fields = {
      issue_date: today,
      due_date: month.start > today ? month.start : today,
      period_start: month.start,
      period_end: month.end,
      items,
      ...invoiceTotals(items, chargesGst()),
      notes: lastRetainer?.notes ?? last?.notes ?? "",
      work_start: month.workStart,
      work_end: month.workEnd,
    };
  } else {
    fields = { issue_date: today, due_date: addDays(today, 14), items: [{ description: "", detail: "", quantity: 1, unit_amount: 0 }], notes: last?.notes ?? "" };
  }
  const { data, error } = await db()
    .from("client_invoices")
    .insert({ account_id: accountId, ...billTo(account), ...fields })
    .select("*")
    .single();
  if (error) throw error;
  return data as ClientInvoice;
}

/** A draft's fields, from admin's editor. Issued invoices don't change. */
export async function updateDraft(accountId: string, id: string, input: Record<string, unknown>): Promise<ClientInvoice> {
  const fields = draftInput(input);
  const { data, error } = await db()
    .from("client_invoices")
    .update({ ...fields, ...invoiceTotals(fields.items, chargesGst()), updated_at: new Date().toISOString() })
    .eq("id", id)
    .eq("account_id", accountId)
    .eq("status", "draft")
    .select("*")
    .maybeSingle();
  if (error) throw error;
  if (!data) throw new InvoiceInputError("Only a draft can be changed, and this one has been issued.");
  return data as ClientInvoice;
}

export async function deleteDraft(accountId: string, id: string): Promise<void> {
  const { data, error } = await db().from("client_invoices").delete().eq("id", id).eq("account_id", accountId).eq("status", "draft").select("id");
  if (error) throw error;
  if (!data?.length) throw new InvoiceInputError("Only a draft can be deleted. Void an issued invoice instead.");
}

// ── Issuing and sending ────────────────────────────────────────────────────

export interface Sent {
  invoice: ClientInvoice;
  /** Whether the email went: false when it was asked for and failed. */
  emailed: boolean;
}

/**
 * What issuing makes of a draft: dated today (a due date already past moves
 * to today), its totals and delivered work fixed, Craefto's details recorded.
 */
async function issuedFields(draft: ClientInvoice) {
  if (draft.status !== "draft") throw new InvoiceInputError("It's already been issued.");
  const problem = issueProblem(draft);
  if (problem) throw new InvoiceInputError(problem);
  const { issuer, missing } = currentIssuer();
  if (missing.length) throw new InvoiceInputError(`Set ${missing.join(", ")} in Vercel first: an invoice can't go out without Craefto's ABN and bank details.`);
  const today = sydneyToday();
  const work = draft.work_start && draft.work_end ? await workBetween(draft.account_id, draft.work_start, draft.work_end) : [];
  return { issuer, fields: { issue_date: today, due_date: draft.due_date < today ? today : draft.due_date, ...invoiceTotals(draft.items, issuer.gst_registered), work } };
}

/**
 * Issue a draft (issuedFields) with the next number. It shows in the
 * client's portal from now; emailed if asked.
 */
export async function issueInvoice(accountId: string, id: string, options: { email: boolean; message?: string; origin: string }): Promise<Sent> {
  const { issuer, fields } = await issuedFields(await own(accountId, id));
  const { error } = await db()
    .from("client_invoices")
    .update({ ...fields, updated_at: new Date().toISOString() })
    .eq("id", id)
    .eq("status", "draft");
  if (error) throw error;
  const { data, error: issueError } = await db().rpc("issue_client_invoice", { invoice_id: id, from_issuer: issuer });
  if (issueError) throw issueError;
  const invoice = (data as ClientInvoice[] | null)?.[0];
  if (!invoice) throw new InvoiceInputError("It was issued a moment ago.");
  if (!options.email) return { invoice, emailed: false };
  return emailInvoice(accountId, invoice.id, options);
}

/**
 * Before issuing: the email a draft will go out with, sent to Craefto alone,
 * its PDF as it will be issued (dated today, with the number it should get)
 * and the note as written. The draft doesn't change. Whether it went.
 */
export async function previewInvoice(accountId: string, id: string, { message, origin }: { message?: string; origin: string }): Promise<boolean> {
  const draft = await own(accountId, id);
  const { issuer, fields } = await issuedFields(draft);
  const invoice: ClientInvoice = { ...draft, ...fields, status: "issued", number: await nextNumber(fields.issue_date), issuer };
  return sendInvoicePreview(await accountOf(accountId), invoice, await invoicePdf(invoice), origin, message?.trim().slice(0, 2000) || undefined);
}

/** The number the next invoice issued on a day gets, unless another is issued first (issue_client_invoice gives it for real). */
async function nextNumber(day: string): Promise<string> {
  const year = Number(day.slice(0, 4));
  const { data, error } = await db().from("invoice_numbers").select("last").eq("year", year).maybeSingle();
  if (error) throw error;
  return `INV-${year}-${String(((data as { last: number } | null)?.last ?? 0) + 1).padStart(3, "0")}`;
}

/** Email an issued invoice with its PDF (again, if it's been sent before), with a note from Craefto if given. */
export async function emailInvoice(accountId: string, id: string, { message, origin }: { message?: string; origin: string }): Promise<Sent> {
  const invoice = await own(accountId, id);
  // The email asks for payment: a paid invoice's record is its receipt and PDF.
  if (invoice.status !== "issued") throw new InvoiceInputError("Only an invoice waiting for payment can be emailed.");
  const account = await accountOf(accountId);
  const attachment = await invoicePdf(invoice);
  const emailed = await sendInvoice(account, invoice, attachment, origin, message?.trim().slice(0, 2000) || undefined);
  if (!emailed) return { invoice, emailed };
  const { data, error } = await db().from("client_invoices").update({ sent_at: new Date().toISOString() }).eq("id", id).select("*").single();
  if (error) throw error;
  return { invoice: data as ClientInvoice, emailed };
}

// ── Payment ────────────────────────────────────────────────────────────────

/** Paid by bank transfer (or otherwise), on a day, with the bank's reference; the client is thanked if asked. */
export async function markPaid(
  accountId: string,
  id: string,
  { paidOn, via, reference, receipt, origin }: { paidOn: string; via: "bank_transfer" | "other"; reference: string; receipt: boolean; origin: string }
): Promise<Sent> {
  const invoice = await own(accountId, id);
  if (invoice.status !== "issued") throw new InvoiceInputError(invoice.status === "paid" ? "It's already marked paid." : "Only an issued invoice can be paid.");
  if (!/^\d{4}-\d{2}-\d{2}$/.test(paidOn) || paidOn > sydneyToday()) throw new InvoiceInputError("Give the day the payment arrived (today or earlier).");
  const { data, error } = await db()
    .from("client_invoices")
    // Midday in Sydney on the day, so it reads the same everywhere.
    .update({ status: "paid", paid_at: `${paidOn}T02:00:00Z`, paid_via: via, payment_reference: reference.trim().slice(0, 200) || null, updated_at: new Date().toISOString() })
    .eq("id", id)
    .eq("status", "issued")
    .select("*")
    .maybeSingle();
  if (error) throw error;
  if (!data) throw new InvoiceInputError("It changed a moment ago: reload and check.");
  const paid = data as ClientInvoice;
  const emailed = receipt ? await sendPaymentReceived(await accountOf(accountId), paid, origin) : false;
  return { invoice: paid, emailed };
}

/** Undo a payment marked by mistake (a card payment stays: refund it in Stripe instead). */
export async function markUnpaid(accountId: string, id: string): Promise<ClientInvoice> {
  const { data, error } = await db()
    .from("client_invoices")
    .update({ status: "issued", paid_at: null, paid_via: null, payment_reference: null, updated_at: new Date().toISOString() })
    .eq("id", id)
    .eq("account_id", accountId)
    .eq("status", "paid")
    .neq("paid_via", "card")
    .select("*")
    .maybeSingle();
  if (error) throw error;
  if (!data) throw new InvoiceInputError("Only a payment marked here can be undone; a card payment is refunded in Stripe.");
  return data as ClientInvoice;
}

/** Cancel an issued invoice: it keeps its number, shows as void and can't be paid. */
export async function voidInvoice(accountId: string, id: string): Promise<ClientInvoice> {
  const { data, error } = await db()
    .from("client_invoices")
    .update({ status: "void", voided_at: new Date().toISOString(), updated_at: new Date().toISOString() })
    .eq("id", id)
    .eq("account_id", accountId)
    .eq("status", "issued")
    .select("*")
    .maybeSingle();
  if (error) throw error;
  if (!data) throw new InvoiceInputError("Only an unpaid, issued invoice can be voided. Delete a draft instead.");
  return data as ClientInvoice;
}

/** A Stripe Checkout page to pay an issued invoice by card; the webhook marks it paid (recordCardPayment). */
export async function cardCheckoutUrl(invoice: ClientInvoice, account: ClientAccount, origin: string): Promise<string> {
  if (invoice.status !== "issued") throw new InvoiceInputError("This invoice isn't waiting for payment.");
  const metadata = { craefto_invoice: invoice.id, invoice_number: invoice.number! };
  const session = await stripe().checkout.sessions.create({
    mode: "payment",
    // Craefto's own invoice at its own price: Stripe's merchant-of-record option stays off, as for the plans.
    managed_payments: { enabled: false },
    // Cards (and the wallets that carry them) only: paid there and then, so the webhook can mark it paid at once.
    allowed_payment_method_types: ["card"],
    ...(account.stripe_customer_id ? { customer: account.stripe_customer_id } : { customer_email: invoice.bill_to_email }),
    client_reference_id: invoice.id,
    line_items: [
      {
        quantity: 1,
        price_data: { currency: "aud", unit_amount: invoice.total, product_data: { name: `Invoice ${invoice.number}`, description: `${invoice.bill_to_name} · ${invoiceSummary(invoice)}` } },
      },
    ],
    metadata,
    payment_intent_data: { description: `Invoice ${invoice.number} (${invoice.bill_to_name})`, metadata },
    success_url: `${origin}/portal/billing/${invoice.id}?paid=1`,
    cancel_url: `${origin}/portal/billing/${invoice.id}`,
  });
  await db().from("client_invoices").update({ stripe_checkout_session: session.id }).eq("id", invoice.id);
  if (!session.url) throw new Error("Stripe gave no checkout address.");
  return session.url;
}

/**
 * A card payment for an invoice (checkout.session.completed, payment mode).
 * The session is read back from Stripe, and the invoice is marked paid once
 * however often Stripe delivers the event; then the client is thanked and
 * Craefto told. A payment for an invoice that's void, or already paid another
 * way, is flagged to Craefto to refund. False when the session isn't an invoice's.
 */
export async function recordCardPayment(sessionId: string, origin: string): Promise<boolean> {
  const session = await stripe().checkout.sessions.retrieve(sessionId);
  const id = session.metadata?.craefto_invoice;
  if (!id) return false;
  if (session.payment_status !== "paid") return true;
  const reference = typeof session.payment_intent === "string" ? session.payment_intent : (session.payment_intent?.id ?? session.id);
  const { data, error } = await db()
    .from("client_invoices")
    .update({ status: "paid", paid_at: new Date().toISOString(), paid_via: "card", payment_reference: reference, updated_at: new Date().toISOString() })
    .eq("id", id)
    .eq("status", "issued")
    .select("*")
    .maybeSingle();
  if (error) throw error;
  if (data) {
    const invoice = data as ClientInvoice;
    const account = await accountOf(invoice.account_id);
    await sendPaymentReceived(account, invoice, origin);
    await alertInvoicePaid(account, invoice, origin);
    return true;
  }
  // Not waiting for payment: paid already (this event again, or by transfer too), or void.
  const { data: current } = await db().from("client_invoices").select("*").eq("id", id).maybeSingle();
  const invoice = current as ClientInvoice | null;
  if (invoice && invoice.payment_reference !== reference) {
    await alertInvoicePaid(await accountOf(invoice.account_id), invoice, origin, `A card payment (${reference}) arrived for an invoice that's ${invoice.status === "void" ? "void" : "already paid"}. Refund it in Stripe.`);
  }
  return true;
}
