import "server-only";
import { createServerClient } from "@/lib/supabase";
import { planById } from "@/lib/pricing";
import { chargesGst } from "@/lib/stripe";
import { allowanceFor, usageFor, type Usage } from "./hours";
import { parseMoney } from "./invoice-rules";
import { cardPayments, currentIssuer, invoicesOf } from "./invoices";
import { CRAEFTO_INBOX, sendEstimateReady } from "./notify";
import { OutcomeInputError, outcomeInput } from "./outcome";
import { projectsOf, type ClientProject } from "./work";
import { confirmEstimate, recordEvent } from "./workflow";
import {
  isLive,
  isOpen,
  isWaitingOnClient,
  type ClientAccount,
  type ClientFile,
  type ClientInvoice,
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
  /** Their code repositories, whose merged pull requests become shipped work to publish. */
  projects: ClientProject[];
  /** Their shipped work waiting to publish. */
  pendingWork: number;
  /** Invoices, drafts included, newest first. */
  invoices: ClientInvoice[];
  /** What Craefto's invoices need that isn't set (Vercel environment variables), whether clients can pay by card, and whether GST is charged. */
  /** What invoices need set (env), and where a draft's preview goes unless told otherwise. */
  billing: { missing: string[]; card: boolean; gst: boolean; inbox: string };
}

export async function memberDetail(id: string): Promise<MemberDetail | null> {
  const { data: account } = await db().from("client_accounts").select("*").eq("id", id).maybeSingle();
  if (!account) return null;
  const [subscriptions, requests, messages, files, calls, entries, projects, pendingWork, invoices] = await Promise.all([
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
    projectsOf(id),
    db().from("client_work_drafts").select("id", { count: "exact", head: true }).eq("account_id", id).eq("status", "pending"),
    invoicesOf(id),
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
    projects,
    pendingWork: pendingWork.count ?? 0,
    invoices,
    billing: { missing: currentIssuer().missing, card: cardPayments(), gst: chargesGst(), inbox: CRAEFTO_INBOX },
  };
}

// ── Clients Craefto adds directly ─────────────────────────────────────────

export class ClientInputError extends Error {}

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export interface ClientSettings {
  name?: string | null;
  company?: string | null;
  monthly_hours?: number | null;
  no_hour_limit?: boolean;
  engagement?: string | null;
  time_zone?: string;
  weekly_email?: boolean;
  cycle_day?: number;
  billing_name?: string | null;
  billing_address?: string | null;
  billing_email?: string | null;
  monthly_fee?: number | null;
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
  if ("no_hour_limit" in input) {
    settings.no_hour_limit = input.no_hour_limit === true;
    // No limit means no number either, so none shows anywhere.
    if (settings.no_hour_limit) settings.monthly_hours = null;
  }
  if ("weekly_email" in input) settings.weekly_email = Boolean(input.weekly_email);
  if ("cycle_day" in input) {
    const day = Number(input.cycle_day);
    if (!(Number.isInteger(day) && day >= 1 && day <= 28)) throw new ClientInputError("Hours refresh on a day from the 1st to the 28th.");
    settings.cycle_day = day;
  }
  // Who invoices are made out to, and the fee each month's is drafted at.
  if ("billing_name" in input) settings.billing_name = text(input.billing_name, 200);
  if ("billing_address" in input) {
    const lines = typeof input.billing_address === "string" ? input.billing_address.split("\n").map((line) => line.trim()).filter(Boolean).join("\n") : "";
    if (lines.length > 500) throw new ClientInputError("Keep the address under 500 characters.");
    settings.billing_address = lines || null;
  }
  if ("billing_email" in input) {
    const email = text(input.billing_email, 320)?.toLowerCase() ?? null;
    if (email && !EMAIL.test(email)) throw new ClientInputError("That invoices email doesn't look right. Leave it empty to use their own.");
    settings.billing_email = email;
  }
  if ("monthly_fee" in input) {
    const empty = input.monthly_fee === null || input.monthly_fee === "";
    const fee = empty ? null : parseMoney(input.monthly_fee);
    if (!empty && !(fee !== null && fee > 0 && fee <= 100_000_000)) throw new ClientInputError("Give the monthly fee in dollars, like 3000, or leave it empty.");
    settings.monthly_fee = fee;
  }
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

/**
 * Their settings, and their email. A new email moves the portal to that
 * address: the old address's login stops opening it, and the next invite
 * makes a login for the new one (lib/portal/accounts.ts, createSignIn).
 */
export async function updateClient(id: string, input: Record<string, unknown>): Promise<ClientAccount | null> {
  const changes: Partial<ClientAccount> = clientSettings(input);
  if ("email" in input) {
    const email = typeof input.email === "string" ? input.email.trim().toLowerCase() : "";
    if (!EMAIL.test(email)) throw new ClientInputError("Enter the client's email address.");
    const { data: current } = await db().from("client_accounts").select("email").eq("id", id).maybeSingle();
    if (!current) return null;
    if (email !== current.email) {
      const { data: taken } = await db().from("client_accounts").select("id").eq("email", email).neq("id", id).maybeSingle();
      if (taken) throw new ClientInputError("Another client already has that email.");
      changes.email = email;
      changes.user_id = null;
    }
  }
  const { data, error } = await db().from("client_accounts").update(changes).eq("id", id).select("*").maybeSingle();
  if (error) throw error;
  return data as ClientAccount | null;
}

/**
 * Work Craefto delivered before the client's portal, recorded as a delivered
 * request: its outcome and links, and the time it took (logged on the day it
 * was delivered, so it counts in that month).
 */
/**
 * A request Craefto adds to a client's portal for them, to save them writing
 * it up. With an estimate it waits for their approval (and they're emailed);
 * without one it's received, to estimate from its card. Theirs from then on
 * to approve, order or withdraw. Whether the email went, when there was one.
 */
export async function addRequest(accountId: string, input: Record<string, unknown>, origin: string): Promise<{ request: ClientRequest; emailed: boolean | null }> {
  const title = typeof input.title === "string" ? input.title.trim() : "";
  if (!title) throw new ClientInputError("Give the request a title.");
  if (title.length > 200) throw new ClientInputError("Keep the title under 200 characters.");
  const details = typeof input.details === "string" ? input.details.trim().slice(0, 10000) : "";
  const given = (value: unknown) => value !== "" && value != null;
  const estimated = given(input.estimate_low) || given(input.estimate_high);
  const low = Number(input.estimate_low);
  const high = Number(input.estimate_high);
  if (estimated && !(low >= 0.5 && high >= low && high <= 400)) throw new ClientInputError("Give the estimate in hours, low to high (0.5 to 400), or leave both empty.");
  const target = typeof input.target_date === "string" && /^\d{4}-\d{2}-\d{2}$/.test(input.target_date) ? input.target_date : null;
  const note = typeof input.estimate_note === "string" ? input.estimate_note.trim() : "";
  const { data, error } = await db().from("client_requests").insert({ account_id: accountId, title, details, added_by: "craefto" }).select("*").single();
  if (error) throw error;
  const request = data as ClientRequest;
  await recordEvent(request, "sent", { by: "craefto" });
  if (!estimated) return { request, emailed: null };
  const ready = await confirmEstimate(request, { low, high, note: note || null, targetDate: target });
  const { data: account } = await db().from("client_accounts").select("*").eq("id", accountId).single();
  const emailed = await sendEstimateReady(account as ClientAccount, ready, origin);
  return { request: ready, emailed };
}

export async function addPastWork(accountId: string, input: Record<string, unknown>): Promise<ClientRequest> {
  const title = typeof input.title === "string" ? input.title.trim() : "";
  if (!title) throw new ClientInputError("Give the work a title.");
  if (title.length > 200) throw new ClientInputError("Keep the title under 200 characters.");
  const details = typeof input.details === "string" ? input.details.trim().slice(0, 10000) : "";
  const deliveredOn = typeof input.delivered_on === "string" && /^\d{4}-\d{2}-\d{2}$/.test(input.delivered_on) ? input.delivered_on : "";
  if (!deliveredOn || Number.isNaN(Date.parse(`${deliveredOn}T00:00:00Z`))) throw new ClientInputError("Give the day it was delivered.");
  const hours = input.hours === "" || input.hours == null ? null : Number(input.hours);
  if (hours !== null && !(hours > 0 && hours <= 400)) throw new ClientInputError("Hours must be between 0.25 and 400, or empty.");
  let outcome: ReturnType<typeof outcomeInput>;
  try {
    outcome = outcomeInput({ outcome: input.outcome ?? null, outcome_links: input.outcome_links ?? [] });
  } catch (error) {
    if (error instanceof OutcomeInputError) throw new ClientInputError(error.message);
    throw error;
  }
  // Midday in Sydney on the day, so the date reads the same everywhere.
  const at = new Date(`${deliveredOn}T02:00:00Z`).toISOString();
  const { data, error } = await db()
    .from("client_requests")
    .insert({ account_id: accountId, title, details, status: "delivered", delivered_at: at, created_at: at, updated_at: at, ...outcome })
    .select("*")
    .single();
  if (error) throw error;
  const request = data as ClientRequest;
  const writes = [db().from("client_request_events").insert({ account_id: accountId, request_id: request.id, kind: "delivered", detail: { by: "craefto" }, created_at: at })];
  if (hours !== null) {
    writes.push(
      db().from("client_time_entries").insert({ account_id: accountId, request_id: request.id, minutes: Math.round(hours * 60), note: "Delivered before the portal", worked_on: deliveredOn })
    );
  }
  for (const result of await Promise.all(writes)) if (result.error) throw result.error;
  return request;
}

