import "server-only";
import { createServerClient } from "@/lib/supabase";
import { monthlyPlans } from "@/lib/pricing";
import { isLive, type ClientAccount, type ClientFile, type ClientMeeting, type ClientMessage, type ClientRequest, type ClientSubscription } from "./types";

// Reads for the admin's Members screens (service role; the admin API is
// guarded by src/proxy.ts).

const db = () => createServerClient();

export interface MemberSummary {
  account: ClientAccount;
  subscriptions: ClientSubscription[];
  open: number;
  waiting: number;
  delivered: number;
  /** Requests that haven't been picked up yet. */
  fresh: number;
  /** A conversation whose latest message is the client's. */
  awaitingReply: boolean;
  lastActivity: string;
}

export interface MembersOverview {
  members: MemberSummary[];
  /** Monthly revenue from running plans, at list price. */
  monthly: number;
}

export async function membersOverview(): Promise<MembersOverview> {
  const [accounts, subscriptions, requests, messages] = await Promise.all([
    db().from("client_accounts").select("*").order("created_at", { ascending: false }),
    db().from("client_subscriptions").select("*").order("created_at", { ascending: false }),
    db().from("client_requests").select("id, account_id, status, updated_at"),
    db().from("client_messages").select("account_id, request_id, author, created_at").order("created_at", { ascending: false }),
  ]);
  const error = accounts.error ?? subscriptions.error ?? requests.error ?? messages.error;
  if (error) throw error;

  // The newest message in each conversation (a request's, or the general one).
  const latest = new Map<string, { author: string; created_at: string }>();
  for (const message of messages.data ?? []) {
    const thread = `${message.account_id}:${message.request_id ?? "general"}`;
    if (!latest.has(thread)) latest.set(thread, message);
  }

  let monthly = 0;
  const members = ((accounts.data ?? []) as ClientAccount[]).map((account) => {
    const own = ((subscriptions.data ?? []) as ClientSubscription[]).filter((row) => row.account_id === account.id);
    const theirRequests = (requests.data ?? []).filter((row) => row.account_id === account.id);
    const threads = [...latest].filter(([thread]) => thread.startsWith(`${account.id}:`)).map(([, message]) => message);
    for (const running of own.filter(isLive)) monthly += monthlyPlans.find((plan) => plan.id === running.plan)?.price ?? 0;
    const times = [account.created_at, ...theirRequests.map((row) => row.updated_at), ...threads.map((message) => message.created_at)];
    return {
      account,
      subscriptions: own,
      open: theirRequests.filter((row) => row.status === "received" || row.status === "in_progress").length,
      waiting: theirRequests.filter((row) => row.status === "needs_info").length,
      delivered: theirRequests.filter((row) => row.status === "delivered").length,
      fresh: theirRequests.filter((row) => row.status === "received").length,
      awaitingReply: threads.some((message) => message.author === "client"),
      lastActivity: times.sort().at(-1)!,
    };
  });
  members.sort((a, b) => b.lastActivity.localeCompare(a.lastActivity));
  return { members, monthly };
}

export interface MemberDetail {
  account: ClientAccount;
  subscriptions: ClientSubscription[];
  requests: ClientRequest[];
  messages: ClientMessage[];
  /** Files shared either way, oldest first. */
  files: ClientFile[];
  /** Calls booked and still to come, soonest first. */
  upcomingCalls: ClientMeeting[];
  /** The customer in the Stripe dashboard (test or live, matching the key). */
  stripeUrl: string | null;
}

export async function memberDetail(id: string): Promise<MemberDetail | null> {
  const { data: account } = await db().from("client_accounts").select("*").eq("id", id).maybeSingle();
  if (!account) return null;
  const [subscriptions, requests, messages, files, calls] = await Promise.all([
    db().from("client_subscriptions").select("*").eq("account_id", id).order("created_at", { ascending: false }),
    db().from("client_requests").select("*").eq("account_id", id).order("updated_at", { ascending: false }),
    db().from("client_messages").select("*").eq("account_id", id).order("created_at"),
    db().from("client_files").select("*").eq("account_id", id).eq("status", "attached").order("created_at"),
    db()
      .from("client_meetings")
      .select("*")
      .eq("account_id", id)
      .eq("status", "booked")
      .gte("ends_at", new Date().toISOString())
      .order("starts_at"),
  ]);
  const testMode = /^(sk|rk)_test_/.test(process.env.STRIPE_SECRET_KEY ?? "");
  return {
    account: account as ClientAccount,
    subscriptions: (subscriptions.data ?? []) as ClientSubscription[],
    requests: (requests.data ?? []) as ClientRequest[],
    messages: (messages.data ?? []) as ClientMessage[],
    files: (files.data ?? []) as ClientFile[],
    upcomingCalls: (calls.data ?? []) as ClientMeeting[],
    stripeUrl: account.stripe_customer_id
      ? `https://dashboard.stripe.com/${testMode ? "test/" : ""}customers/${account.stripe_customer_id}`
      : null,
  };
}
