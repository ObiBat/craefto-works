import { NextResponse, type NextRequest } from "next/server";
import type Stripe from "stripe";
import { stripe } from "@/lib/stripe";
import { accountByCustomer, claimWelcomeEmails, latestSubscription, provisionCheckout, syncSubscription } from "@/lib/portal/accounts";
import { alertBilling, alertNewSubscriber, sendWelcome } from "@/lib/portal/notify";
import { siteOrigin } from "@/lib/portal/origin";

/**
 * Stripe's webhook. It sets clients up when they subscribe, keeps their plans
 * in step (plan changes, cancelling, ending) and emails Craefto about each.
 * The endpoint (scripts/stripe-setup.mjs creates it) listens for:
 * checkout.session.completed, customer.subscription.updated,
 * customer.subscription.deleted and invoice.payment_failed.
 *
 * Stripe may deliver an event twice or out of order, so subscriptions are
 * read back from Stripe as they are now (never from the event's copy), and
 * each email goes out on a change, or once per plan for the welcome.
 *
 * A handler that throws answers 500, so Stripe tries again later.
 */
export async function POST(request: NextRequest) {
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  const signature = request.headers.get("stripe-signature");
  if (!secret || !signature) return NextResponse.json({ error: "Webhook not configured" }, { status: 400 });

  let event: Stripe.Event;
  try {
    event = stripe().webhooks.constructEvent(await request.text(), signature, secret);
  } catch {
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  const origin = await siteOrigin();
  try {
    switch (event.type) {
      case "checkout.session.completed": {
        if (event.data.object.mode !== "subscription") break;
        const result = await provisionCheckout(event.data.object.id);
        if (!result || !(await claimWelcomeEmails(result.sync.subscription.id))) break;
        await sendWelcome(result.account, result.sync.subscription, origin);
        await alertNewSubscriber(result.account, result.sync.subscription, origin);
        break;
      }

      case "customer.subscription.updated": {
        // Also fires as a new subscription starts and at each renewal, which
        // need no email. Before checkout.session.completed has set the account
        // up there's nothing to update yet.
        const result = await syncSubscription(await stripe().subscriptions.retrieve(event.data.object.id));
        if (!result?.previous) break;
        const { account, subscription, previous } = result;
        if (subscription.cancel_at_period_end && !previous.cancel_at_period_end) {
          await alertBilling("cancelling", account, subscription, origin);
        } else if (!subscription.cancel_at_period_end && previous.cancel_at_period_end && subscription.status !== "canceled") {
          await alertBilling("resumed", account, subscription, origin);
        }
        if (subscription.plan !== previous.plan) await alertBilling("plan_changed", account, subscription, origin);
        break;
      }

      case "customer.subscription.deleted": {
        const result = await syncSubscription(await stripe().subscriptions.retrieve(event.data.object.id));
        if (result && result.subscription.status === "canceled" && result.previous?.status !== "canceled") {
          await alertBilling("ended", result.account, result.subscription, origin);
        }
        break;
      }

      case "invoice.payment_failed": {
        const customer = event.data.object.customer;
        const account = customer ? await accountByCustomer(typeof customer === "string" ? customer : customer.id) : null;
        const subscription = account ? await latestSubscription(account.id) : null;
        if (account && subscription) await alertBilling("payment_failed", account, subscription, origin);
        break;
      }
    }
  } catch (error) {
    console.error(`Stripe webhook ${event.type} (${event.id}) failed:`, error);
    return NextResponse.json({ error: "Handler failed" }, { status: 500 });
  }
  return NextResponse.json({ received: true });
}
