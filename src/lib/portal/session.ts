import "server-only";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { createServerClient } from "@supabase/ssr";
import type { SupabaseClient, User } from "@supabase/supabase-js";
import { isLive, type ClientAccount, type ClientSubscription } from "./types";

// The client portal's sessions: Supabase Auth in httpOnly cookies, read and
// written only on the server (there is no browser Supabase client). src/proxy.ts
// refreshes the session on every /portal request.

/**
 * Set when a visitor starts Stripe Checkout, holding the session's ID. The
 * return page signs a new client straight in only in that same browser, so a
 * copied or leaked return link can't sign anyone else in.
 */
export const CHECKOUT_COOKIE = "craefto_checkout";

/** A Supabase client acting as the signed-in client: every query goes through RLS. */
export async function portalDb(): Promise<SupabaseClient> {
  const store = await cookies();
  return createServerClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, {
    cookies: {
      getAll: () => store.getAll(),
      setAll: (list) => {
        try {
          list.forEach(({ name, value, options }) => store.set(name, value, options));
        } catch {
          // Called from a Server Component, where cookies are read-only; the
          // proxy has already refreshed the session for this request.
        }
      },
    },
    cookieOptions: { httpOnly: true, secure: process.env.NODE_ENV === "production", sameSite: "lax", path: "/" },
  });
}

export interface Member {
  user: User;
  account: ClientAccount;
  /** Every subscription, newest first, current or not. */
  subscriptions: ClientSubscription[];
  /** The plans running now: usually one, but plans can be combined. */
  plans: ClientSubscription[];
  db: SupabaseClient;
}

/** The signed-in client, or null when signed out or not a client. */
export async function currentMember(): Promise<Member | null> {
  const db = await portalDb();
  const {
    data: { user },
  } = await db.auth.getUser();
  if (!user) return null;
  const { data: account } = await db.from("client_accounts").select("*").eq("user_id", user.id).maybeSingle();
  if (!account) return null;
  const { data } = await db
    .from("client_subscriptions")
    .select("*")
    .eq("account_id", account.id)
    .order("created_at", { ascending: false });
  const subscriptions = (data ?? []) as ClientSubscription[];
  return { user, account: account as ClientAccount, subscriptions, plans: subscriptions.filter(isLive), db };
}

/** For portal pages and actions: the signed-in client, or off to sign in. */
export async function requireMember(): Promise<Member> {
  const member = await currentMember();
  if (!member) redirect("/portal/login");
  return member;
}
