import "server-only";
import { createServerClient } from "@/lib/supabase";
import { planById } from "@/lib/pricing";
import { allowanceFor, usageFor, type Usage } from "./hours";
import {
  isLive,
  isOpen,
  isWaitingOnClient,
  type ClientAccount,
  type ClientFile,
  type ClientMeeting,
  type ClientMessage,
  type ClientRequest,
  type ClientSubscription,
  type ClientTimeEntry,
} from "./types";

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
    db().from("client_requests").select("id, account_id, status, estimate_state, updated_at"),
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
    for (const running of own.filter(isLive)) monthly += planById(running.plan)?.price ?? 0;
    const times = [account.created_at, ...theirRequests.map((row) => row.updated_at), ...threads.map((message) => message.created_at)];
    return {
      account,
      subscriptions: own,
      open: theirRequests.filter(isOpen).length,
      waiting: theirRequests.filter(isWaitingOnClient).length,
      delivered: theirRequests.filter((row) => row.status === "delivered").length,
      // New requests whose estimate Craefto hasn't confirmed yet.
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
  /** Time logged, newest day first. */
  entries: ClientTimeEntry[];
  /** The month's hours: allowance, used, approved in the queue. */
  usage: Usage;
  /** The customer in the Stripe dashboard (test or live, matching the key). */
  stripeUrl: string | null;
}

export async function memberDetail(id: string): Promise<MemberDetail | null> {
  const { data: account } = await db().from("client_accounts").select("*").eq("id", id).maybeSingle();
  if (!account) return null;
  const [subscriptions, requests, messages, files, calls, entries] = await Promise.all([
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
    db().from("client_time_entries").select("*").eq("account_id", id).order("worked_on", { ascending: false }).order("created_at", { ascending: false }),
  ]);
  const testMode = /^(sk|rk)_test_/.test(process.env.STRIPE_SECRET_KEY ?? "");
  return {
    account: account as ClientAccount,
    subscriptions: (subscriptions.data ?? []) as ClientSubscription[],
    requests: (requests.data ?? []) as ClientRequest[],
    messages: (messages.data ?? []) as ClientMessage[],
    files: (files.data ?? []) as ClientFile[],
    upcomingCalls: (calls.data ?? []) as ClientMeeting[],
    entries: (entries.data ?? []) as ClientTimeEntry[],
    usage: usageFor(
      allowanceFor(account as ClientAccount, (subscriptions.data ?? []) as ClientSubscription[]),
      (entries.data ?? []) as ClientTimeEntry[],
      (requests.data ?? []) as ClientRequest[]
    ),
    stripeUrl: account.stripe_customer_id
      ? `https://dashboard.stripe.com/${testMode ? "test/" : ""}customers/${account.stripe_customer_id}`
      : null,
  };
}

// ── Clients Craefto adds directly ─────────────────────────────────────────

export class ClientInputError extends Error {}

export interface ClientSettings {
  name?: string | null;
  company?: string | null;
  monthly_hours?: number | null;
  engagement?: string | null;
  time_zone?: string;
  weekly_email?: boolean;
}

const validZone = (zone: string) => {
  try {
    new Intl.DateTimeFormat("en-AU", { timeZone: zone });
    return true;
  } catch {
    return false;
  }
};

/** Checked, trimmed settings for an account (only the fields given). */
export function clientSettings(input: Record<string, unknown>): ClientSettings {
  const settings: ClientSettings = {};
  const text = (value: unknown, max: number) => (typeof value === "string" && value.trim() ? value.trim().slice(0, max) : null);
  if ("name" in input) settings.name = text(input.name, 120);
  if ("company" in input) settings.company = text(input.company, 120);
  if ("engagement" in input) settings.engagement = text(input.engagement, 120);
  if ("monthly_hours" in input) {
    const hours = input.monthly_hours === null || input.monthly_hours === "" ? null : Number(input.monthly_hours);
    if (hours !== null && !(hours > 0 && hours <= 400)) throw new ClientInputError("Monthly hours must be between 0.5 and 400, or empty for the plan's hours.");
    settings.monthly_hours = hours === null ? null : Math.round(hours * 2) / 2;
  }
  if ("time_zone" in input) {
    const zone = typeof input.time_zone === "string" ? input.time_zone.trim() : "";
    if (!validZone(zone)) throw new ClientInputError("That time zone isn't one we know. Use a name like Asia/Tokyo or Australia/Sydney.");
    settings.time_zone = zone;
  }
  if ("weekly_email" in input) settings.weekly_email = Boolean(input.weekly_email);
  return settings;
}

/** A client Craefto works with directly (no plan bought online): their account, ready for an invite. */
export async function createClient(input: Record<string, unknown>): Promise<ClientAccount> {
  const email = typeof input.email === "string" ? input.email.trim().toLowerCase() : "";
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) throw new ClientInputError("Enter the client's email address.");
  const settings = clientSettings({ time_zone: "Australia/Sydney", ...input });
  if (!settings.monthly_hours) throw new ClientInputError("Set their monthly hours: it's what their requests count against.");
  const { data: existing } = await db().from("client_accounts").select("id").eq("email", email).maybeSingle();
  if (existing) throw new ClientInputError("There's already a client with that email.");
  const { data, error } = await db().from("client_accounts").insert({ email, ...settings }).select("*").single();
  if (error) throw error;
  return data as ClientAccount;
}

export async function updateClient(id: string, input: Record<string, unknown>): Promise<ClientAccount | null> {
  const settings = clientSettings(input);
  const { data, error } = await db().from("client_accounts").update(settings).eq("id", id).select("*").maybeSingle();
  if (error) throw error;
  return data as ClientAccount | null;
}

