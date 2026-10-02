"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { PLAN_TERMS_VERSION } from "@/content/plan-terms";
import { gstTaxRates, isPlanId, isStripeConfigured, planPrice, stripe } from "@/lib/stripe";
import { siteOrigin } from "@/lib/portal/origin";
import { CHECKOUT_COOKIE, currentMember } from "@/lib/portal/session";

/**
 * A plan's start page (/subscribe/[plan]), once the scope is reviewed and the
 * plan terms agreed: create a Stripe Checkout Session for the plan and send
 * the visitor to it. The agreement (and the version of the terms the page
 * showed) is recorded on the subscription. A client already on that plan goes
 * to their billing page instead (another plan goes through: plans can be
 * combined), and without Stripe set up the button falls back to an enquiry.
 */
export async function startCheckout(formData: FormData) {
  const plan = formData.get("plan");
  if (!isPlanId(plan)) redirect("/services#plans");
  if (formData.get("agree") !== "yes" || formData.get("terms") !== PLAN_TERMS_VERSION) redirect(`/subscribe/${plan}`);
  if (!isStripeConfigured()) redirect(`/contact?plan=${plan}`);

  const member = await currentMember();
  if (member?.plans.some((running) => running.plan === plan)) redirect("/portal/billing");

  let url: string | null = null;
  try {
    const origin = await siteOrigin();
    const price = await planPrice(plan);
    const taxRates = gstTaxRates();
    const agreed = { terms_version: PLAN_TERMS_VERSION, terms_agreed_at: new Date().toISOString() };
    const session = await stripe().checkout.sessions.create({
      mode: "subscription",
      // Craefto sells its own services at the listed price, so Stripe's
      // merchant-of-record option (on by default for new accounts, adding
      // its own tax and fees) stays off.
      managed_payments: { enabled: false },
      line_items: [{ price: price.id, quantity: 1 }],
      // A returning client keeps their Stripe customer (and its invoices).
      ...(member?.account.stripe_customer_id
        ? { customer: member.account.stripe_customer_id }
        : { customer_email: member?.account.email }),
      ...(member ? { client_reference_id: member.account.id } : {}),
      metadata: { plan, ...agreed },
      subscription_data: { metadata: { plan, ...agreed }, ...(taxRates.length ? { default_tax_rates: taxRates } : {}) },
      custom_fields: [{ key: "company", label: { type: "custom", custom: "Company" }, type: "text", optional: true }],
      custom_text: {
        submit: {
          message: "Billed monthly in advance. Once you've paid, you'll go straight to your client portal to make your first request.",
        },
      },
      // Checkout in the site's colours (fonts are Stripe's own; Be Vietnam Pro is nearest to DM Sans).
      branding_settings: {
        display_name: "Craefto",
        icon: { type: "url", url: "https://www.craefto.com/android-chrome-512x512.png" },
        background_color: "#FDFCFA",
        button_color: "#121110",
        border_style: "rounded",
        font_family: "be_vietnam_pro",
      },
      allow_promotion_codes: true,
      billing_address_collection: "auto",
      success_url: `${origin}/portal/welcome?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}/subscribe/${plan}`,
    });
    url = session.url;
    (await cookies()).set(CHECKOUT_COOKIE, session.id, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/portal/welcome",
      maxAge: 60 * 60 * 6,
    });
  } catch (error) {
    console.error(`Checkout for the ${plan} plan failed:`, error);
  }
  redirect(url ?? `/contact?plan=${plan}`);
}
