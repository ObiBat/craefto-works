import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Button } from "@/components/ui/button";
import { BackLink, Callout, Section } from "@/components/portal/blocks";
import { BankDetails, StandingPill } from "@/components/portal/invoice-parts";
import { PageTitle } from "@/components/portal/page-title";
import { sydneyToday } from "@/lib/portal/hours";
import { PAID_VIA, detailBlocks, formatMoney, invoiceDate, lineAmount, periodLabel, standingOf, sydneyDay } from "@/lib/portal/invoice-rules";
import { cardPayments, currentIssuer, workBetween } from "@/lib/portal/invoices";
import { UUID } from "@/lib/portal/preview";
import { requireMember } from "@/lib/portal/session";
import type { ClientInvoice } from "@/lib/portal/types";
import { payInvoice } from "../../actions";

export const metadata: Metadata = { title: "Invoice" };

/** How many times the page checks back for a card payment's confirmation (Stripe's webhook), a few seconds apart. */
const CHECKS = 5;

const label = "font-mono text-[0.6875rem] uppercase tracking-[0.06em] text-[hsl(var(--color-foreground-subtle))]";

/** One invoice: what it's for, what's due and how to pay it, and the work it lists. */
export default async function InvoicePage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ paid?: string; check?: string; unavailable?: string }> }) {
  const member = await requireMember();
  const { id } = await params;
  if (!UUID.test(id)) notFound();
  const query = member.db.from("client_invoices").select("*").eq("id", id).eq("account_id", member.account.id);
  // A draft is Craefto's alone: shown only in view as client, before it's issued.
  const { data } = await (member.preview ? query : query.neq("status", "draft")).maybeSingle();
  if (!data) notFound();
  const invoice = data as ClientInvoice;
  const draft = invoice.status === "draft";
  const title = draft ? "Draft invoice" : `Invoice ${invoice.number}`;
  // Issuing fixes the delivered work; until then it's what's delivered so far.
  const work = draft && invoice.work_start && invoice.work_end ? await workBetween(invoice.account_id, invoice.work_start, invoice.work_end) : invoice.work;
  const { paid, check, unavailable } = await searchParams;
  const today = sydneyToday();
  const standing = standingOf(invoice, today);
  const open = standing === "due" || standing === "overdue";
  const payable = open || draft;
  const issuer = invoice.issuer ?? currentIssuer().issuer;
  // Pay into the account as it is now; the invoice's own record is its PDF.
  const bank = currentIssuer().issuer.bank ?? issuer.bank;
  const showQuantity = invoice.items.some((item) => item.quantity !== 1);
  const checks = Number(check ?? 0);
  const confirming = Boolean(paid) && open && checks < CHECKS;

  return (
    <>
      {/* Back from Stripe, the webhook can be a moment behind: look again until it's marked paid. */}
      {confirming && <meta httpEquiv="refresh" content={`3;url=/portal/billing/${invoice.id}?paid=1&check=${checks + 1}`} />}
      <BackLink href="/portal/billing">Billing</BackLink>
      <PageTitle
        eyebrow={title}
        title={formatMoney(invoice.total)}
        actions={
          <Button asChild variant="secondary">
            <a href={`/portal/billing/${invoice.id}/pdf?download=1`}>Download PDF</a>
          </Button>
        }
      >
        <p className="flex flex-wrap items-center gap-3">
          <StandingPill standing={standing} />
          <span>
            {standing === "paid" && invoice.paid_at
              ? `Paid ${invoiceDate(sydneyDay(invoice.paid_at))}${invoice.paid_via ? `, by ${PAID_VIA[invoice.paid_via].toLowerCase()}` : ""}. Thank you.`
              : standing === "void"
                ? "Cancelled, so there's nothing to pay."
                : `${standing === "overdue" ? "Was due" : "Due"} ${invoiceDate(invoice.due_date)}`}
          </span>
        </p>
      </PageTitle>

      <div className="mb-12 flex flex-col gap-4 empty:hidden">
        {draft && (
          <Callout tone="attention" title="A draft they can't see yet">
            Issuing it gives it its number and today&apos;s date, and shows it to them here as it looks now.
          </Callout>
        )}
        {paid && standing === "paid" && <Callout title="Payment received">Thank you. A receipt is on its way to your inbox.</Callout>}
        {confirming && <Callout title="Confirming your payment">Thanks. Your card payment is going through; this page updates in a moment.</Callout>}
        {paid && open && !confirming && (
          <Callout tone="attention" title="Your payment is still being confirmed">
            It can take a few minutes. We&apos;ll email your receipt once it&apos;s through; there&apos;s no need to pay again.
          </Callout>
        )}
        {unavailable && (
          <Callout tone="attention" title="Card payment didn't open">
            Please try again in a moment, or pay by bank transfer with the details here.
          </Callout>
        )}
      </div>

      <div className="grid gap-14 md:grid-cols-[minmax(0,1fr)_20rem] md:gap-12 lg:grid-cols-[minmax(0,1fr)_22rem]">
        <div className="flex min-w-0 flex-col gap-14">
          <article className="rounded-3xl bg-[hsl(var(--color-background-subtle))] p-6 md:p-8" aria-label={title}>
            <dl className="flex flex-wrap gap-x-10 gap-y-4 text-sm">
              {[
                ["Issued", invoiceDate(invoice.issue_date, true)],
                ["Due", invoiceDate(invoice.due_date, true)],
                ...(invoice.period_start && invoice.period_end ? [["Period", periodLabel(invoice.period_start, invoice.period_end, true)]] : []),
              ].map(([term, value]) => (
                <div key={term}>
                  <dt className={label}>{term}</dt>
                  <dd className="mt-1.5 whitespace-nowrap font-medium">{value}</dd>
                </div>
              ))}
            </dl>
            <div className="mt-8 grid gap-6 sm:grid-cols-2">
              <div>
                <p className={label}>From</p>
                <p className="mt-2 font-medium">{issuer.name}</p>
                <p className="text-sm leading-relaxed text-[hsl(var(--color-foreground-muted))]">
                  {issuer.abn && (
                    <>
                      ABN {issuer.abn}
                      <br />
                    </>
                  )}
                  {issuer.address.map((line) => (
                    <span key={line} className="block">
                      {line}
                    </span>
                  ))}
                </p>
              </div>
              <div>
                <p className={label}>Bill to</p>
                <p className="mt-2 font-medium">{invoice.bill_to_name}</p>
                <p className="text-sm leading-relaxed text-[hsl(var(--color-foreground-muted))]">
                  {invoice.bill_to_address.split("\n").filter(Boolean).map((line) => (
                    <span key={line} className="block">
                      {line}
                    </span>
                  ))}
                </p>
              </div>
            </div>

            <table className="mt-10 w-full text-left">
              <thead>
                <tr className="border-b border-[hsl(var(--color-foreground))]">
                  <th scope="col" className={`${label} pb-2 font-normal`}>
                    Description
                  </th>
                  {showQuantity && (
                    <th scope="col" className={`${label} hidden pb-2 text-right font-normal sm:table-cell`}>
                      Qty
                    </th>
                  )}
                  <th scope="col" className={`${label} pb-2 text-right font-normal`}>
                    Amount
                  </th>
                </tr>
              </thead>
              <tbody>
                {invoice.items.map((item, index) => (
                  <tr key={index} className="align-top">
                    <td className="pr-4 pt-4">
                      <p className="font-medium leading-snug">{item.description}</p>
                      {item.detail && (
                        <div className="mt-1.5 text-sm leading-relaxed text-[hsl(var(--color-foreground-muted))]">
                          {detailBlocks(item.detail).map((block, at) =>
                            block.list ? (
                              <p key={at} className="flex gap-2">
                                <span aria-hidden="true">•</span>
                                {block.text}
                              </p>
                            ) : (
                              <p key={at} className="mt-1 first:mt-0">
                                {block.text}
                              </p>
                            )
                          )}
                        </div>
                      )}
                    </td>
                    {showQuantity && (
                      <td className="hidden pt-4 text-right tabular-nums sm:table-cell">
                        {item.quantity} × {formatMoney(item.unit_amount)}
                      </td>
                    )}
                    <td className="whitespace-nowrap pt-4 text-right font-medium tabular-nums">{formatMoney(lineAmount(item))}</td>
                  </tr>
                ))}
              </tbody>
            </table>

            <dl className="ml-auto mt-8 grid max-w-xs grid-cols-[1fr_auto] gap-x-6 gap-y-1.5 text-sm">
              <dt className="text-[hsl(var(--color-foreground-muted))]">Subtotal</dt>
              <dd className="text-right tabular-nums">{formatMoney(invoice.subtotal)}</dd>
              <dt className="text-[hsl(var(--color-foreground-muted))]">GST</dt>
              <dd className="text-right tabular-nums">{formatMoney(invoice.gst)}</dd>
              <dt className="mt-2 border-t border-[hsl(var(--color-foreground))] pt-3 font-semibold">Total (AUD)</dt>
              <dd className="mt-2 border-t border-[hsl(var(--color-foreground))] pt-3 text-right text-xl font-semibold tabular-nums">{formatMoney(invoice.total)}</dd>
            </dl>

            {(invoice.notes || !issuer.gst_registered) && (
              <div className="mt-8 space-y-1 border-t border-[hsl(var(--color-border))] pt-5 text-sm leading-relaxed text-[hsl(var(--color-foreground-muted))]">
                {!issuer.gst_registered && <p>No GST charged: {issuer.name} is not registered for GST.</p>}
                {invoice.notes.split("\n").filter(Boolean).map((line, at) => (
                  <p key={at}>{line}</p>
                ))}
              </div>
            )}
          </article>

          {work.length > 0 && invoice.work_start && invoice.work_end && (
            <Section title={`Work delivered · ${periodLabel(invoice.work_start, invoice.work_end, true)}`}>
              <p className="-mt-1 max-w-2xl leading-relaxed text-[hsl(var(--color-foreground-muted))]">
                The month before this invoice&apos;s period, listed with it as a record, not a charge.
              </p>
              <ul className="flex flex-col gap-2">
                {work.map((item) => (
                  <li key={item.request_id}>
                    <Link href={`/portal/requests/${item.request_id}`} className="group flex items-baseline gap-4 rounded-2xl bg-[hsl(var(--color-background-subtle))] px-5 py-3.5">
                      <span className="w-16 shrink-0 font-mono text-[0.6875rem] uppercase tracking-[0.06em] text-[hsl(var(--color-foreground-subtle))]">
                        {invoiceDate(item.delivered_on, true).replace(/ \d{4}$/, "")}
                      </span>
                      <span className="min-w-0 text-[hsl(var(--color-foreground))] transition-colors group-hover:text-[hsl(var(--color-accent))]">{item.title}</span>
                    </Link>
                  </li>
                ))}
              </ul>
            </Section>
          )}
        </div>

        <aside className="flex flex-col gap-6 md:sticky md:top-36 md:self-start">
          {payable ? (
            <div className="flex flex-col gap-5 rounded-3xl bg-[hsl(var(--color-accent-subtle))] p-6">
              <div>
                <p className={label}>Amount due</p>
                <p className="mt-2 text-3xl font-semibold tracking-tight tabular-nums">{formatMoney(invoice.total)}</p>
                <p className="mt-1 text-sm text-[hsl(var(--color-foreground-muted))]">
                  {standing === "overdue" ? "Was due" : "Due"} {invoiceDate(invoice.due_date)}
                </p>
              </div>
              {bank && (
                <div className="flex flex-col gap-3">
                  <p className="text-sm font-semibold">By bank transfer</p>
                  <BankDetails bank={bank} reference={invoice.number} />
                </div>
              )}
              {cardPayments() && (
                <form action={payInvoice} className="flex flex-col gap-2 border-t border-[hsl(var(--color-accent)/0.15)] pt-5">
                  <input type="hidden" name="invoice_id" value={invoice.id} />
                  <Button type="submit" variant="accent" className="w-full" disabled={member.preview}>
                    Pay by card
                  </Button>
                  <p className="text-xs leading-relaxed text-[hsl(var(--color-foreground-subtle))]">On Stripe&apos;s secure checkout. It&apos;s marked paid here straight away.</p>
                </form>
              )}
            </div>
          ) : (
            <div className="flex flex-col gap-2 rounded-3xl bg-[hsl(var(--color-background-subtle))] p-6">
              <p className="font-semibold tracking-tight">{standing === "paid" ? "Paid" : "Void"}</p>
              <p className="text-sm leading-relaxed text-[hsl(var(--color-foreground-muted))]">
                {standing === "paid"
                  ? `${formatMoney(invoice.total)} received${invoice.paid_at ? ` on ${invoiceDate(sydneyDay(invoice.paid_at))}` : ""}. The PDF shows it paid, for your records.`
                  : "This invoice was cancelled and isn't payable. If it was replaced, the new one is under Billing."}
              </p>
            </div>
          )}
          <div className="rounded-3xl bg-[hsl(var(--color-background-subtle))] p-6">
            <p className="font-semibold tracking-tight">A question about it?</p>
            <p className="mt-1.5 text-sm leading-relaxed text-[hsl(var(--color-foreground-muted))]">
              <Link href="/portal/messages" className="font-medium text-[hsl(var(--color-accent))] hover:underline">
                Message us
              </Link>{" "}
              and mention {invoice.number ?? "this invoice"}.
            </p>
          </div>
        </aside>
      </div>
    </>
  );
}
