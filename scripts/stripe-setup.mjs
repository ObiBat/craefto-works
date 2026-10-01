#!/usr/bin/env node
/**
 * Sets Stripe up for the monthly plans. Safe to run again at any time:
 *
 *   node --no-warnings scripts/stripe-setup.mjs
 *   node --no-warnings scripts/stripe-setup.mjs --webhook https://www.craefto.com/api/stripe/webhook
 *
 * - A product and a monthly AUD price for each plan in src/lib/pricing.ts,
 *   found again by the price's lookup key (craefto_<plan>_monthly). When a
 *   plan's price changes there, a new price takes over the lookup key and the
 *   old one is archived; existing subscribers keep paying the old price until
 *   they're moved.
 * - The billing portal clients reach from the site's Billing page: invoices,
 *   card updates, cancelling at the end of the period, and switching plans
 *   (upgrades charged straight away, downgrades from the next renewal).
 * - With --webhook, the endpoint Stripe notifies. Its signing secret is then
 *   in the dashboard (Developers > Webhooks > the endpoint): set it as
 *   STRIPE_WEBHOOK_SECRET where the site runs.
 *
 * Reads STRIPE_SECRET_KEY from the environment or .env.local; a test key sets
 * up test mode, a live key live mode. Prints IDs only, never keys or secrets.
 */
import { readFileSync } from "node:fs";
import Stripe from "stripe";
import { monthlyPlans } from "../src/lib/pricing.ts";

const SITE = "https://www.craefto.com";
const PORTAL_NAME = "Craefto plans";
const EVENTS = [
  "checkout.session.completed",
  "customer.subscription.updated",
  "customer.subscription.deleted",
  "invoice.payment_failed",
];

function env(name) {
  if (process.env[name]) return process.env[name];
  try {
    const line = readFileSync(new URL("../.env.local", import.meta.url), "utf8")
      .split("\n")
      .find((entry) => entry.startsWith(`${name}=`));
    return line?.slice(name.length + 1).trim().replace(/^["']|["']$/g, "") || undefined;
  } catch {
    return undefined;
  }
}

const key = env("STRIPE_SECRET_KEY");
if (!key) {
  console.error("Set STRIPE_SECRET_KEY in .env.local (or the environment) first.");
  process.exit(1);
}
const stripe = new Stripe(key);
console.log(`Stripe, ${/_test_/.test(key) ? "test" : "live"} mode\n`);

// ── Products and prices ───────────────────────────────────────────────────

const products = await stripe.products.list({ limit: 100 }).autoPagingToArray({ limit: 1000 });
const portalProducts = [];

for (const plan of monthlyPlans) {
  const name = `${plan.name} plan`;
  let product = products.find((entry) => entry.metadata.craefto_plan === plan.id);
  if (!product) {
    product = await stripe.products.create({ name, description: plan.bestFor, metadata: { craefto_plan: plan.id } });
  } else if (product.name !== name || product.description !== plan.bestFor || !product.active) {
    product = await stripe.products.update(product.id, { name, description: plan.bestFor, active: true });
  }

  const lookupKey = `craefto_${plan.id}_monthly`;
  const amount = Math.round(plan.price * 100);
  const [current] = (await stripe.prices.list({ lookup_keys: [lookupKey], limit: 1 })).data;
  let price = current;
  const upToDate =
    current?.active &&
    current.unit_amount === amount &&
    current.currency === "aud" &&
    current.recurring?.interval === "month" &&
    current.product === product.id;
  if (upToDate) {
    console.log(`${plan.name}: A$${plan.price} a month, up to date (${price.id})`);
  } else {
    price = await stripe.prices.create({
      product: product.id,
      currency: "aud",
      unit_amount: amount,
      recurring: { interval: "month" },
      // Listed prices are before GST (none is charged until Craefto registers).
      tax_behavior: "exclusive",
      nickname: `${plan.name} monthly`,
      lookup_key: lookupKey,
      transfer_lookup_key: true,
    });
    if (current?.active) await stripe.prices.update(current.id, { active: false });
    console.log(`${plan.name}: A$${plan.price} a month (${price.id})${current ? `, replacing ${current.id}` : ""}`);
  }
  portalProducts.push({ product: product.id, prices: [price.id] });
}

// ── Billing portal ────────────────────────────────────────────────────────

const portal = {
  name: PORTAL_NAME,
  business_profile: {
    headline: "Manage your Craefto plan",
    privacy_policy_url: `${SITE}/privacy`,
    terms_of_service_url: `${SITE}/terms`,
  },
  default_return_url: `${SITE}/portal/billing`,
  features: {
    // Not the email: it's how the client signs in to the portal.
    customer_update: { enabled: true, allowed_updates: ["name", "address", "tax_id"] },
    invoice_history: { enabled: true },
    payment_method_update: { enabled: true },
    subscription_cancel: {
      enabled: true,
      mode: "at_period_end",
      proration_behavior: "none",
      cancellation_reason: {
        enabled: true,
        options: ["too_expensive", "missing_features", "switched_service", "unused", "other"],
      },
    },
    subscription_update: {
      enabled: true,
      default_allowed_updates: ["price"],
      products: portalProducts,
      proration_behavior: "always_invoice",
      schedule_at_period_end: { conditions: [{ type: "decreasing_item_amount" }] },
    },
  },
};
const configurations = await stripe.billingPortal.configurations.list({ limit: 100 });
const existing = configurations.data.find((entry) => entry.name === PORTAL_NAME);
const configuration = existing
  ? await stripe.billingPortal.configurations.update(existing.id, { ...portal, active: true })
  : await stripe.billingPortal.configurations.create(portal);
console.log(`\nBilling portal: ${existing ? "updated" : "created"} (${configuration.id})`);

// ── Webhook ───────────────────────────────────────────────────────────────

const webhookFlag = process.argv.indexOf("--webhook");
if (webhookFlag !== -1) {
  const url = process.argv[webhookFlag + 1];
  if (!url?.startsWith("https://")) {
    console.error("\n--webhook needs the endpoint's https URL.");
    process.exit(1);
  }
  const endpoints = await stripe.webhookEndpoints.list({ limit: 100 });
  const endpoint = endpoints.data.find((entry) => entry.url === url);
  if (endpoint) {
    await stripe.webhookEndpoints.update(endpoint.id, { enabled_events: EVENTS, disabled: false });
    console.log(`Webhook: updated (${endpoint.id})`);
  } else {
    const created = await stripe.webhookEndpoints.create({ url, enabled_events: EVENTS, description: "Craefto client portal" });
    console.log(`Webhook: created (${created.id}). Copy its signing secret from the dashboard into STRIPE_WEBHOOK_SECRET.`);
  }
}

console.log("\nDone.");
