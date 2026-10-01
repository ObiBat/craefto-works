import type { Metadata } from "next";
import Link from "next/link";
import type Stripe from "stripe";
import { Button } from "@/components/ui/button";
import { Callout, Empty, Section } from "@/components/portal/blocks";
import { PageTitle } from "@/components/portal/page-title";
import { PlanSummary } from "@/components/portal/plan-summary";
import { StatusPill, type Tone } from "@/components/portal/status-pill";
import { sydneyDate } from "@/components/portal/thread";
import { requireMember } from "@/lib/portal/session";
import { shownPlans } from "@/lib/portal/types";
import { planName } from "@/lib/portal/notify";
import { isStripeConfigured, stripe } from "@/lib/stripe";
import { openBilling } from "../actions";

export const metadata: Metadata = { title: "Billing" };

const INVOICE_STATUS: Record<string, { label: string; tone: Tone }> = {
  paid: { label: "Paid", tone: "done" },
  open: { label: "Due", tone: "attention" },
  uncollectible: { label: "Unpaid", tone: "attention" },
  void: { label: "Void", tone: "quiet" },
};

const money = (cents: number, currency: string) =>
  new Intl.NumberFormat("en-AU", { style: "currency", currency: currency.toUpperCase() }).format(cents / 100);

/** The client's invoices, newest first, or null when Stripe can't be reached. */
async function invoicesFor(customers: string[]): Promise<Stripe.Invoice[] | null> {
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

export default async function BillingPage({ searchParams }: { searchParams: Promise<{ unavailable?: string }> }) {
  const member = await requireMember();
  const { account } = member;
  const shown = shownPlans(member);
  const customers = [account.stripe_customer_id, ...member.subscriptions.map((subscription) => subscription.stripe_customer_id)];
  const invoices = await invoicesFor([...new Set(customers.filter((customer): customer is string => Boolean(customer)))]);
  const unavailable = Boolean((await searchParams).unavailable);
  const link = "inline-flex items-center text-sm font-medium text-[hsl(var(--color-accent))] hover:underline";
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

  return (
    <>
      <PageTitle title="Billing">
        <p>Your plan, your invoices, and the card you pay with.</p>
      </PageTitle>

      {unavailable && (
        <div className="mb-12">
          <Callout tone="attention" title="Billing settings didn't open">
            Please try again in a moment. If it keeps happening, message us and we&apos;ll sort it out.
          </Callout>
        </div>
      )}

      <div className="grid gap-14 md:grid-cols-[minmax(0,1fr)_20rem] md:gap-12 lg:grid-cols-[minmax(0,1fr)_22rem]">
        <Section title="Invoices">
          {invoices === null ? (
            <p className="text-[hsl(var(--color-foreground-subtle))]">Invoices can&apos;t be shown just now. Please try again shortly.</p>
          ) : invoices.length === 0 ? (
            <Empty title="No invoices yet">Each month&apos;s invoice will appear here once it&apos;s issued.</Empty>
          ) : (
            <ul className="flex flex-col gap-2">
              {invoices.map((invoice) => {
                const status = INVOICE_STATUS[invoice.status ?? ""] ?? { label: invoice.status ?? "", tone: "quiet" as Tone };
                return (
                  <li
                    key={invoice.id}
                    className="flex flex-col gap-3 rounded-2xl bg-[hsl(var(--color-background-subtle))] px-5 py-4 sm:flex-row sm:items-center sm:justify-between sm:gap-6"
                  >
                    <span className="min-w-0">
                      <span className="block font-medium tabular-nums">{money(invoice.total, invoice.currency)}</span>
                      <span className="mt-0.5 block text-sm text-[hsl(var(--color-foreground-subtle))]">
                        {sydneyDate(new Date(invoice.created * 1000).toISOString())}
                        {invoice.number && ` · ${invoice.number}`}
                      </span>
                    </span>
                    <span className="flex items-center gap-5">
                      <StatusPill tone={status.tone}>{status.label}</StatusPill>
                      {invoice.hosted_invoice_url && (
                        <a href={invoice.hosted_invoice_url} target="_blank" rel="noopener noreferrer" className={link}>
                          {invoice.status === "open" ? "Pay" : "View"}
                        </a>
                      )}
                      {invoice.invoice_pdf && (
                        <a href={invoice.invoice_pdf} className={link}>
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
          {(shown.length ? shown : [null]).map((subscription) => (
            <PlanSummary key={subscription?.id ?? "none"} subscription={subscription}>
              {payers.size > 1 && subscription && manage(payer(subscription), `Manage ${planName(subscription.plan)} billing`, "secondary")}
            </PlanSummary>
          ))}
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
