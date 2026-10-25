import type { Metadata } from "next";
import Link from "next/link";
import type Stripe from "stripe";
import { Button } from "@/components/ui/button";
import { Callout, Empty, Section } from "@/components/portal/blocks";
import { BankDetails, StandingPill } from "@/components/portal/invoice-parts";
import { PageTitle } from "@/components/portal/page-title";
import { PlanSummary } from "@/components/portal/plan-summary";
import { StatusPill, type Tone } from "@/components/portal/status-pill";
import { sydneyDate } from "@/components/portal/thread";
import { sydneyToday } from "@/lib/portal/hours";
import { formatMoney, invoiceDate, invoiceSummary, sydneyDay, standingOf } from "@/lib/portal/invoice-rules";
import { cardPayments, currentIssuer } from "@/lib/portal/invoices";
import { requireMember } from "@/lib/portal/session";
import { shownPlans, type ClientInvoice } from "@/lib/portal/types";
import { planName } from "@/lib/portal/notify";
import { isStripeConfigured, stripe } from "@/lib/stripe";
import { openBilling } from "../actions";

export const metadata: Metadata = { title: "Billing" };

// Billing: Craefto's invoices (a retainer agreed directly, one-off work) and,
// for a monthly plan, Stripe's, in one list; what's waiting for payment; and
// how to pay. Every query names the account and leaves drafts out (when
// Craefto views as the client, reads skip the database's own rules).

const STRIPE_STATUS: Record<string, { label: string; tone: Tone }> = {
  paid: { label: "Paid", tone: "done" },
  open: { label: "Due", tone: "attention" },
  uncollectible: { label: "Unpaid", tone: "attention" },
  void: { label: "Void", tone: "quiet" },
};

const stripeMoney = (cents: number, currency: string) =>
  new Intl.NumberFormat("en-AU", { style: "currency", currency: currency.toUpperCase() }).format(cents / 100);

/** The client's Stripe invoices (their plans'), newest first, or null when Stripe can't be reached. */
async function stripeInvoicesFor(customers: string[]): Promise<Stripe.Invoice[] | null> {
  if (customers.length === 0 || !isStripeConfigured()) return [];
  try {
    const lists = await Promise.all(customers.map((customer) => stripe().invoices.list({ customer, limit: 24 })));
    return lists
      .flatMap((list) => list.data)
      .filter((invoice) => invoice.status !== "draft")
      .sort((a, b) => b.created - a.created)
      .slice(0, 24);
  } catch (error) {
    console.error("Listing invoices failed:", error);
    return null;
  }
}

const link = "inline-flex items-center text-sm font-medium text-[hsl(var(--color-accent))] hover:underline";
const row = "flex flex-col gap-3 rounded-2xl bg-[hsl(var(--color-background-subtle))] px-5 py-4 sm:flex-row sm:items-center sm:justify-between sm:gap-6";

export default async function BillingPage({ searchParams }: { searchParams: Promise<{ unavailable?: string }> }) {
  const member = await requireMember();
  const { account, db } = member;
  const shown = shownPlans(member);
  const customers = [account.stripe_customer_id, ...member.subscriptions.map((subscription) => subscription.stripe_customer_id)];
  const [stripeInvoices, { data: invoiceRows }] = await Promise.all([
    stripeInvoicesFor([...new Set(customers.filter((customer): customer is string => Boolean(customer)))]),
    db.from("client_invoices").select("*").eq("account_id", account.id).neq("status", "draft").order("issue_date", { ascending: false }).order("created_at", { ascending: false }),
  ]);
  const invoices = (invoiceRows ?? []) as ClientInvoice[];
  const unavailable = Boolean((await searchParams).unavailable);
  const today = sydneyToday();
  const outstanding = invoices.filter((invoice) => invoice.status === "issued").sort((a, b) => a.due_date.localeCompare(b.due_date));
  const overdue = outstanding.some((invoice) => invoice.due_date < today);
  const { bank } = currentIssuer().issuer;
  const direct = account.monthly_fee != null || invoices.length > 0;

  // Who pays for each plan shown: usually one Stripe customer, so one button.
  const payer = (subscription: (typeof shown)[number] | null) => subscription?.stripe_customer_id ?? account.stripe_customer_id;
  const payers = new Set(shown.map(payer).filter(Boolean));
  const manage = (customer: string | null, label: string, variant?: "secondary") =>
    customer && (
      <form action={openBilling}>
        <input type="hidden" name="customer" value={customer} />
        <Button type="submit" variant={variant} className="w-full">
          {label}
        </Button>
      </form>
    );

  // Craefto's invoices and Stripe's, newest first.
  const list = [
    ...invoices.map((invoice) => ({ at: `${invoice.issue_date}T12:00:00+10:00`, invoice, stripe: null })),
    ...(stripeInvoices ?? []).map((invoice) => ({ at: new Date(invoice.created * 1000).toISOString(), invoice: null, stripe: invoice })),
  ].sort((a, b) => b.at.localeCompare(a.at));

  return (
    <>
      <PageTitle title="Billing">
        <p>{direct ? "Your invoices, what's due, and how to pay." : "Your plan, your invoices, and the card you pay with."}</p>
      </PageTitle>

      <div className="mb-12 flex flex-col gap-4 empty:hidden">
        {unavailable && (
          <Callout tone="attention" title="Billing settings didn't open">
            Please try again in a moment. If it keeps happening, message us and we&apos;ll sort it out.
          </Callout>
        )}
        {outstanding.length === 1 && (
          <Callout
            tone={overdue ? "attention" : "accent"}
            title={`Invoice ${outstanding[0].number} ${overdue ? "was" : "is"} due ${invoiceDate(outstanding[0].due_date)}`}
            action={
              <Button asChild>
                <Link href={`/portal/billing/${outstanding[0].id}`}>View and pay</Link>
              </Button>
            }
          >
            {formatMoney(outstanding[0].total)} for {invoiceSummary(outstanding[0])}. Pay by bank transfer{cardPayments() ? " or by card" : ""}.
          </Callout>
        )}
        {outstanding.length > 1 && (
          <Callout tone={overdue ? "attention" : "accent"} title={`${outstanding.length} invoices are waiting for payment`}>
            {formatMoney(outstanding.reduce((sum, invoice) => sum + invoice.total, 0))} in all{overdue ? ", some of it overdue" : ""}. Open each below to pay it.
          </Callout>
        )}
      </div>

      <div className="grid gap-14 md:grid-cols-[minmax(0,1fr)_20rem] md:gap-12 lg:grid-cols-[minmax(0,1fr)_22rem]">
        <Section title="Invoices">
          {stripeInvoices === null && <p className="text-[hsl(var(--color-foreground-subtle))]">Your plan&apos;s invoices can&apos;t be shown just now. Please try again shortly.</p>}
          {list.length === 0 ? (
            stripeInvoices !== null && <Empty title="No invoices yet">Each invoice appears here once it&apos;s issued, with its PDF.</Empty>
          ) : (
            <ul className="flex flex-col gap-2">
              {list.map(({ invoice, stripe: plan }) => {
                if (invoice) {
                  const standing = standingOf(invoice, today);
                  return (
                    <li key={invoice.id}>
                      <Link href={`/portal/billing/${invoice.id}`} className={`${row} group transition-colors hover:bg-[hsl(var(--color-background-muted))]`}>
                        <span className="min-w-0">
                          <span className="block font-medium tabular-nums">{formatMoney(invoice.total)}</span>
                          <span className="mt-0.5 block text-sm text-[hsl(var(--color-foreground-subtle))]">
                            {invoice.number} · {invoiceSummary(invoice)}
                          </span>
                        </span>
                        <span className="flex items-center gap-5">
                          <span className="text-sm text-[hsl(var(--color-foreground-subtle))]">
                            {standing === "paid" && invoice.paid_at
                              ? `Paid ${invoiceDate(sydneyDay(invoice.paid_at), true)}`
                              : standing === "void"
                                ? `Issued ${invoiceDate(invoice.issue_date, true)}`
                                : `Due ${invoiceDate(invoice.due_date, true)}`}
                          </span>
                          <StandingPill standing={standing} />
                          <span className={`${link} group-hover:underline`}>{standing === "due" || standing === "overdue" ? "Pay" : "View"}</span>
                        </span>
                      </Link>
                    </li>
                  );
                }
                const status = STRIPE_STATUS[plan!.status ?? ""] ?? { label: plan!.status ?? "", tone: "quiet" as Tone };
                return (
                  <li key={plan!.id} className={row}>
                    <span className="min-w-0">
                      <span className="block font-medium tabular-nums">{stripeMoney(plan!.total, plan!.currency)}</span>
                      <span className="mt-0.5 block text-sm text-[hsl(var(--color-foreground-subtle))]">
                        {sydneyDate(new Date(plan!.created * 1000).toISOString())}
                        {plan!.number && ` · ${plan!.number}`}
                      </span>
                    </span>
                    <span className="flex items-center gap-5">
                      <StatusPill tone={status.tone}>{status.label}</StatusPill>
                      {plan!.hosted_invoice_url && (
                        <a href={plan!.hosted_invoice_url} target="_blank" rel="noopener noreferrer" className={link}>
                          {plan!.status === "open" ? "Pay" : "View"}
                        </a>
                      )}
                      {plan!.invoice_pdf && (
                        <a href={plan!.invoice_pdf} className={link}>
                          PDF
                        </a>
                      )}
                    </span>
                  </li>
                );
              })}
            </ul>
          )}
        </Section>

        <aside className="flex flex-col gap-6">
          {account.monthly_fee != null && (
            <div className="rounded-3xl bg-[hsl(var(--color-accent-subtle))] px-6 pb-7 pt-6">
              <p className="font-mono text-xs uppercase tracking-[0.06em] text-[hsl(var(--color-foreground-subtle))]">Your arrangement</p>
              <p className="mt-3 font-[family-name:var(--font-heading)] text-2xl font-semibold tracking-tight text-[hsl(var(--color-accent))]">
                {account.engagement || "Monthly retainer"}
              </p>
              <p className="mt-5 flex items-baseline gap-1.5">
                <span className="text-3xl font-semibold tracking-tight tabular-nums">{formatMoney(account.monthly_fee).replace(/\.00$/, "")}</span>
                <span className="text-sm text-[hsl(var(--color-foreground-muted))]">/ month</span>
              </p>
              <p className="mt-2 text-sm leading-relaxed text-[hsl(var(--color-foreground-muted))]">
                Invoiced monthly in advance, for the month from the {ordinal(account.cycle_day ?? 1)}.
              </p>
            </div>
          )}
          {shown.length > 0 &&
            shown.map((subscription) => (
              <PlanSummary key={subscription.id} subscription={subscription}>
                {payers.size > 1 && manage(payer(subscription), `Manage ${planName(subscription.plan)} billing`, "secondary")}
              </PlanSummary>
            ))}
          {shown.length === 0 && !direct && <PlanSummary subscription={null} />}
          {direct && bank && (
            <div className="flex flex-col gap-4 rounded-3xl bg-[hsl(var(--color-background-subtle))] p-6">
              <p className="font-semibold tracking-tight">How to pay</p>
              <BankDetails bank={bank} />
              <p className="text-sm leading-relaxed text-[hsl(var(--color-foreground-muted))]">
                Use the invoice&apos;s number as the reference.{cardPayments() ? " Or pay by card from the invoice itself." : ""}
              </p>
            </div>
          )}
          {payers.size > 0 && (
            <div className="flex flex-col gap-3 rounded-3xl bg-[hsl(var(--color-background-subtle))] p-6">
              {payers.size === 1 && manage([...payers][0], "Manage billing")}
              <p className="text-sm leading-relaxed text-[hsl(var(--color-foreground-subtle))]">
                Update your card, switch plans or cancel, on Stripe&apos;s secure billing page. To pause instead,{" "}
                <Link href="/portal/messages" className="font-medium text-[hsl(var(--color-accent))] hover:underline">
                  message us
                </Link>
                .
              </p>
            </div>
          )}
        </aside>
      </div>
    </>
  );
}

/** 1st, 2nd, 3rd, 25th */
function ordinal(day: number) {
  const tens = day % 100;
  const suffix = tens >= 11 && tens <= 13 ? "th" : ({ 1: "st", 2: "nd", 3: "rd" } as Record<number, string>)[day % 10] ?? "th";
  return `${day}${suffix}`;
}
