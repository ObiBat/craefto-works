import "server-only";
import { randomBytes } from "node:crypto";
import type Stripe from "stripe";
import type { EmailOtpType } from "@supabase/supabase-js";
import { createServerClient } from "@/lib/supabase";
import { periodEnd, planForPrice, stripe } from "@/lib/stripe";
import type { ClientAccount, ClientSubscription } from "./types";

// Server-side account work with the service role: setting a client up from a
// completed Checkout, keeping their subscription in step with Stripe, and
// one-time sign-in links. Emails are sent by the callers (the webhook), so
// running any of this twice is harmless.

const db = () => createServerClient();

const customerId = (value: string | Stripe.Customer | Stripe.DeletedCustomer | null) =>
  typeof value === "string" ? value : (value?.id ?? null);

/**
 * The account for an email: made now, as the account of the checkout paying
 * for it (`createdBy`), or the existing one filled in with what Stripe knows.
 */
async function upsertAccount(fields: {
  email: string;
  name?: string | null;
  company?: string | null;
  stripeCustomerId?: string | null;
  createdBy: string;
}): Promise<ClientAccount> {
  const email = fields.email.trim().toLowerCase();
  // Does nothing when the account exists (the webhook and the return page can
  // set up the same checkout at the same moment).
  const { error: insertError } = await db().from("client_accounts").upsert(
    {
      email,
      name: fields.name ?? null,
      company: fields.company ?? null,
      stripe_customer_id: fields.stripeCustomerId ?? null,
      created_by_checkout: fields.createdBy,
    },
    { onConflict: "email", ignoreDuplicates: true }
  );
  if (insertError) throw insertError;
  const { data: existing, error } = await db().from("client_accounts").select("*").eq("email", email).single();
  if (error) throw error;
  const patch: Record<string, string> = {};
  if (fields.stripeCustomerId && !existing.stripe_customer_id) patch.stripe_customer_id = fields.stripeCustomerId;
  if (fields.name && !existing.name) patch.name = fields.name;
  if (fields.company && !existing.company) patch.company = fields.company;
  if (Object.keys(patch).length === 0) return existing as ClientAccount;
  const { data, error: updateError } = await db().from("client_accounts").update(patch).eq("id", existing.id).select("*").single();
  if (updateError) throw updateError;
  return data as ClientAccount;
}

export async function accountById(id: string): Promise<ClientAccount | null> {
  const { data } = await db().from("client_accounts").select("*").eq("id", id).maybeSingle();
  return (data as ClientAccount) ?? null;
}

/** The account paying as a Stripe customer: its first one, or one of its plans'. */
export async function accountByCustomer(stripeCustomerId: string): Promise<ClientAccount | null> {
  const { data } = await db().from("client_accounts").select("*").eq("stripe_customer_id", stripeCustomerId).maybeSingle();
  if (data) return data as ClientAccount;
  const { data: plan } = await db()
    .from("client_subscriptions")
    .select("account_id")
    .eq("stripe_customer_id", stripeCustomerId)
    .limit(1)
    .maybeSingle();
  return plan ? accountById(plan.account_id) : null;
}

export async function accountByEmail(email: string): Promise<ClientAccount | null> {
  const { data } = await db().from("client_accounts").select("*").eq("email", email.trim().toLowerCase()).maybeSingle();
  return (data as ClientAccount) ?? null;
}

export async function latestSubscription(accountId: string): Promise<ClientSubscription | null> {
  const { data } = await db()
    .from("client_subscriptions")
    .select("*")
    .eq("account_id", accountId)
    .order("created_at", { ascending: false })
    .limit(1);
  return (data?.[0] as ClientSubscription) ?? null;
}

export interface SyncResult {
  account: ClientAccount;
  subscription: ClientSubscription;
  /** The row as it was before this sync, if there was one. */
  previous: ClientSubscription | null;
}

/**
 * Write a Stripe subscription to client_subscriptions, for `owner` or else
 * the account it already belongs to. Null when no account has it yet (its
 * checkout hasn't been set up).
 */
export async function syncSubscription(subscription: Stripe.Subscription, owner?: ClientAccount): Promise<SyncResult | null> {
  const customer = customerId(subscription.customer);
  const { data: previous } = await db().from("client_subscriptions").select("*").eq("id", subscription.id).maybeSingle();
  const account = owner ?? (previous ? await accountById(previous.account_id) : customer ? await accountByCustomer(customer) : null);
  if (!account) return null;
  const plan = planForPrice(subscription.items.data[0]?.price);
  if (!plan) throw new Error(`Subscription ${subscription.id} isn't on a Craefto plan price.`);
  const row = {
    id: subscription.id,
    account_id: account.id,
    stripe_customer_id: customer,
    plan,
    status: subscription.status,
    // When it renews, or for an ended plan, when it ended (a plan cancelled
    // straight away ends before its paid period does).
    current_period_end: (subscription.ended_at ? new Date(subscription.ended_at * 1000) : periodEnd(subscription))?.toISOString() ?? null,
    cancel_at_period_end: subscription.cancel_at_period_end || Boolean(subscription.cancel_at),
    updated_at: new Date().toISOString(),
  };
  const { data, error } = await db().from("client_subscriptions").upsert(row).select("*").single();
  if (error) throw error;
  return { account, subscription: data as ClientSubscription, previous: (previous as ClientSubscription) ?? null };
}

/**
 * Set a client up from a completed subscription Checkout and record the
 * plan. The plan belongs to the signed-in client who started the checkout,
 * or the client already paying as that Stripe customer, or else the account
 * for the email entered (made now if it's new). Null for a session that
 * isn't a completed Craefto subscription.
 */
export async function provisionCheckout(
  sessionId: string
): Promise<{ account: ClientAccount; sync: SyncResult; session: Stripe.Checkout.Session } | null> {
  const session = await stripe().checkout.sessions.retrieve(sessionId, { expand: ["subscription"] });
  const subscription = session.subscription;
  if (session.mode !== "subscription" || session.status !== "complete" || !subscription || typeof subscription === "string") {
    return null;
  }
  const email = session.customer_details?.email;
  if (!email) return null;
  const customer = customerId(session.customer);
  const account =
    (session.client_reference_id ? await accountById(session.client_reference_id) : null) ??
    (customer ? await accountByCustomer(customer) : null) ??
    (await upsertAccount({
      email,
      name: session.customer_details?.name,
      company: session.custom_fields?.find((field) => field.key === "company")?.text?.value,
      stripeCustomerId: customer,
      createdBy: session.id,
    }));
  const sync = await syncSubscription(subscription, account);
  if (!sync) return null;
  return { account: sync.account, sync, session };
}

/** Claim a plan's welcome emails: true once per subscription, however often Stripe delivers its checkout. */
export async function claimWelcomeEmails(subscriptionId: string): Promise<boolean> {
  const { data } = await db()
    .from("client_subscriptions")
    .update({ welcomed_at: new Date().toISOString() })
    .eq("id", subscriptionId)
    .is("welcomed_at", null)
    .select("id");
  return Boolean(data?.length);
}

/**
 * Claim the one-time sign-in on an account's return from the checkout that
 * created it. True the first time, false after.
 */
export async function claimWelcome(account: ClientAccount, sessionId: string): Promise<boolean> {
  const { data } = await db()
    .from("client_accounts")
    .update({ welcome_session_id: sessionId })
    .eq("id", account.id)
    .is("welcome_session_id", null)
    .select("id");
  return Boolean(data?.length);
}

export interface SignIn {
  tokenHash: string;
  type: EmailOtpType;
}

/** A password no one knows: clients only ever sign in by emailed link. */
const unknowablePassword = () => `${randomBytes(32).toString("base64url")}-Aa1!`;

async function magicLink(email: string) {
  const { data, error } = await db().auth.admin.generateLink({ type: "magiclink", email });
  if (error || !data.properties?.hashed_token) throw error ?? new Error("No sign-in token returned.");
  return data;
}

/** A login of the portal's own for a client's email (marked, with a password no one knows). */
async function createLogin(email: string, allowExisting: boolean) {
  const { error } = await db().auth.admin.createUser({
    email,
    email_confirm: true,
    password: unknowablePassword(),
    app_metadata: { craefto_client: true },
  });
  if (error && !(allowExisting && error.code === "email_exists")) throw error;
}

/**
 * A one-time sign-in token for a client, linking their account to their
 * login. Never call this for an email that isn't a client's: it makes one.
 *
 * Only logins the portal made are ever linked. Another login with the
 * client's email (registered in advance through Supabase's public sign-up,
 * say, or left from the old portal) may have sessions someone else holds, so
 * it's moved aside to an unusable address, keeping its data, and the client
 * gets a fresh login of their own.
 */
export async function createSignIn(account: ClientAccount): Promise<SignIn> {
  if (!account.user_id) await createLogin(account.email, true);
  let link = await magicLink(account.email);
  if (link.user.app_metadata?.craefto_client !== true) {
    const { error } = await db().auth.admin.updateUserById(link.user.id, {
      email: `moved-aside+${link.user.id}@invalid.craefto.com`,
      email_confirm: true,
      password: unknowablePassword(),
    });
    if (error) throw error;
    console.warn(`Moved aside a login for ${account.email} that the portal didn't make (${link.user.id}).`);
    await createLogin(account.email, false);
    link = await magicLink(account.email);
  }
  if (account.user_id !== link.user.id) {
    const { error } = await db().from("client_accounts").update({ user_id: link.user.id }).eq("id", account.id);
    if (error) throw error;
  }
  return { tokenHash: link.properties.hashed_token, type: link.properties.verification_type as EmailOtpType };
}

/** Whether a sign-in link may be emailed now (at most one a minute), recording it if so. */
export async function takeSignInSlot(account: ClientAccount): Promise<boolean> {
  const since = new Date(Date.now() - 60_000).toISOString();
  const { data } = await db()
    .from("client_accounts")
    .update({ sign_in_link_sent_at: new Date().toISOString() })
    .eq("id", account.id)
    .or(`sign_in_link_sent_at.is.null,sign_in_link_sent_at.lt.${since}`)
    .select("id");
  return Boolean(data?.length);
}
