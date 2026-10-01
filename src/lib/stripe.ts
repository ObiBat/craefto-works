import "server-only";
import Stripe from "stripe";
import { monthlyPlans, type MonthlyPlan } from "@/lib/pricing";

// Stripe for the monthly plans: Checkout to subscribe, webhooks to keep each
// client's subscription in sync, and Stripe's billing portal for invoices,
// cards and cancelling. Test and live mode differ only in the key.

let client: Stripe | null = null;

/** The Stripe client. STRIPE_SECRET_KEY must be set (sk_test_… or sk_live_…). */
export function stripe(): Stripe {
  if (client) return client;
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) throw new Error("STRIPE_SECRET_KEY is not set.");
  client = new Stripe(key, { appInfo: { name: "Craefto Works", url: "https://www.craefto.com" } });
  return client;
}

export const isStripeConfigured = () => Boolean(process.env.STRIPE_SECRET_KEY);

export type PlanId = MonthlyPlan["id"];

/**
 * Each plan's Stripe price is found by lookup key rather than by id, so the
 * same code works in test and live mode (scripts/stripe-setup.mjs creates
 * them, with the amounts from lib/pricing.ts).
 */
export const planLookupKey = (plan: PlanId) => `craefto_${plan}_monthly`;

export function isPlanId(value: unknown): value is PlanId {
  return monthlyPlans.some((plan) => plan.id === value);
}

export async function planPrice(plan: PlanId): Promise<Stripe.Price> {
  const { data } = await stripe().prices.list({ lookup_keys: [planLookupKey(plan)], active: true, limit: 1 });
  if (!data[0]) throw new Error(`No active Stripe price with lookup key ${planLookupKey(plan)}. Run scripts/stripe-setup.mjs.`);
  return data[0];
}

/** The plan a Stripe price belongs to, from its lookup key. */
export function planForPrice(price: Stripe.Price | null | undefined): PlanId | null {
  const match = price?.lookup_key?.match(/^craefto_(\w+)_monthly$/);
  return match && isPlanId(match[1]) ? match[1] : null;
}

/**
 * GST. Craefto isn't registered yet, so nothing is added. Once it is, create a
 * 10% exclusive tax rate in Stripe and set STRIPE_GST_TAX_RATE_ID: new
 * subscriptions then carry GST on their invoices.
 */
let portalConfiguration: Promise<string | undefined> | null = null;

/**
 * The billing portal settings scripts/stripe-setup.mjs keeps (named "Craefto
 * plans"), or undefined for the account's default. Looked up once per server.
 */
export function billingPortalConfiguration(): Promise<string | undefined> {
  portalConfiguration ??= stripe()
    .billingPortal.configurations.list({ active: true, limit: 100 })
    .then(({ data }) => data.find((entry) => entry.name === "Craefto plans")?.id)
    .catch((error) => {
      portalConfiguration = null;
      throw error;
    });
  return portalConfiguration;
}

/** Whether plans are charged GST: the plans' footnote says "excluding GST" only then. */
export const chargesGst = () => Boolean(process.env.STRIPE_GST_TAX_RATE_ID);

export function gstTaxRates(): string[] {
  const rate = process.env.STRIPE_GST_TAX_RATE_ID;
  return rate ? [rate] : [];
}

/** A subscription's current billing period end (it lives on the item since API 2025-03-31). */
export function periodEnd(subscription: Stripe.Subscription): Date | null {
  const end = subscription.items.data[0]?.current_period_end;
  return end ? new Date(end * 1000) : null;
}
