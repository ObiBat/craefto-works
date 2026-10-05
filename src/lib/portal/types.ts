// Rows of the client portal tables (supabase/migrations/014_client_portal.sql).

export interface ClientAccount {
  id: string;
  user_id: string | null;
  email: string;
  name: string | null;
  company: string | null;
  stripe_customer_id: string | null;
  /** The checkout that made the account (only its return page signs the payer in). */
  created_by_checkout: string | null;
  /** Hours a month Craefto agreed outside the Stripe plans (null: the running plans' hours). */
  monthly_hours: number | null;
  /** What that arrangement is called, e.g. "JapanoMa monthly hours". */
  engagement: string | null;
  /** Where the client is, for their calendar. */
  time_zone: string;
  /** The Friday effort email. */
  weekly_email: boolean;
  weekly_sent_on: string | null;
  created_at: string;
}

export interface ClientSubscription {
  id: string;
  account_id: string;
  /** The Stripe customer paying for it (a returning client may have a second). */
  stripe_customer_id: string | null;
  /** A plan id from lib/pricing.ts, current or retired. */
  plan: string;
  status: string;
  /** When it renews or ends; for an ended plan, when it ended. */
  current_period_end: string | null;
  cancel_at_period_end: boolean;
  /** When its welcome emails went out. */
  welcomed_at: string | null;
  created_at: string;
  updated_at: string;
}

export type RequestStatus = "received" | "estimated" | "queued" | "in_progress" | "needs_info" | "delivered" | "withdrawn";

/** None yet; Ask Craefto's initial range; confirmed by Craefto; approved by the client. */
export type EstimateState = "none" | "initial" | "confirmed" | "approved";

export interface ClientRequest {
  id: string;
  account_id: string;
  title: string;
  details: string;
  status: RequestStatus;
  /** Hours of studio time, a range. */
  estimate_low: number | null;
  estimate_high: number | null;
  estimate_state: EstimateState;
  /** What the estimate covers and assumes. */
  estimate_note: string | null;
  /** Its place in the work queue (1 first), while approved and open. */
  queue_position: number | null;
  /** When Craefto aims to deliver (a date, not a promise of the hour). */
  target_date: string | null;
  /** When the client said they need it. */
  needed_by: string | null;
  approved_at: string | null;
  delivered_at: string | null;
  created_at: string;
  updated_at: string;
}

/** Time Craefto logged, against a request or the account generally. */
export interface ClientTimeEntry {
  id: string;
  account_id: string;
  request_id: string | null;
  minutes: number;
  note: string;
  /** The day the work was done (Sydney). */
  worked_on: string;
  created_at: string;
}

export type RequestEventKind = "sent" | "estimated" | "confirmed" | "approved" | "started" | "needs_info" | "delivered" | "withdrawn" | "reopened";

/** A move a request made, for its timeline. */
export interface ClientRequestEvent {
  id: string;
  account_id: string;
  request_id: string;
  kind: RequestEventKind;
  detail: { low?: number; high?: number; by?: "assistant" | "craefto" | "client"; position?: number; target_date?: string | null };
  created_at: string;
}

export interface ClientMessage {
  id: string;
  account_id: string;
  request_id: string | null;
  /** The client, the Craefto team, or Ask Craefto (the AI assistant). */
  author: "client" | "craefto" | "assistant";
  body: string;
  created_at: string;
}

export interface ClientFile {
  id: string;
  account_id: string;
  request_id: string | null;
  message_id: string | null;
  uploaded_by: "client" | "craefto";
  name: string;
  size: number;
  content_type: string | null;
  path: string;
  status: "pending" | "attached";
  created_at: string;
}

export interface ClientMeeting {
  id: string;
  account_id: string;
  cal_uid: string;
  title: string;
  starts_at: string;
  ends_at: string;
  time_zone: string | null;
  status: "booked" | "cancelled";
  join_url: string | null;
  created_at: string;
  updated_at: string;
}

/** How each request status reads to the client, in the order work moves through them. */
export const REQUEST_STATUSES: Record<RequestStatus, { label: string; tone: "quiet" | "active" | "attention" | "done"; hint: string }> = {
  received: { label: "Received", tone: "quiet", hint: "It's with the team. An initial estimate follows within a minute, and Craefto confirms it." },
  estimated: { label: "Estimate ready", tone: "attention", hint: "Approve the confirmed estimate and it joins your queue. Nothing starts before you do." },
  queued: { label: "Queued", tone: "quiet", hint: "Approved, and waiting its turn in your queue." },
  in_progress: { label: "In progress", tone: "active", hint: "We're working on it. The time we log shows here as it goes." },
  needs_info: { label: "Needs your input", tone: "attention", hint: "We need something from you to keep going." },
  delivered: { label: "Delivered", tone: "done", hint: "Done and handed over." },
  withdrawn: { label: "Withdrawn", tone: "quiet", hint: "Not going ahead." },
};

/** Requests still on the go (not delivered or withdrawn). */
export const isOpen = (request: Pick<ClientRequest, "status">) => request.status !== "delivered" && request.status !== "withdrawn";

/** Waiting on the client: an estimate to approve, or a question to answer. */
export const isWaitingOnClient = (request: Pick<ClientRequest, "status">) => request.status === "estimated" || request.status === "needs_info";

/** "3 to 5 hours", "1 hour", "1.5 hours" */
export function estimateLabel(request: Pick<ClientRequest, "estimate_low" | "estimate_high">) {
  const { estimate_low: low, estimate_high: high } = request;
  if (low == null || high == null) return null;
  const hours = (value: number) => (Number.isInteger(value) ? String(value) : value.toFixed(1));
  return low === high ? `${hours(low)} hour${low === 1 ? "" : "s"}` : `${hours(low)} to ${hours(high)} hours`;
}

export const isRequestStatus = (value: unknown): value is RequestStatus =>
  typeof value === "string" && value in REQUEST_STATUSES;

/** Stripe subscription statuses, in plain words. */
export function subscriptionLabel(subscription: Pick<ClientSubscription, "status" | "cancel_at_period_end">): string {
  if (subscription.status === "active" && subscription.cancel_at_period_end) return "Ending";
  const labels: Record<string, string> = {
    active: "Active",
    trialing: "Active",
    past_due: "Payment due",
    unpaid: "Payment due",
    incomplete: "Awaiting payment",
    incomplete_expired: "Not started",
    canceled: "Cancelled",
    paused: "Paused",
  };
  return labels[subscription.status] ?? subscription.status;
}

/** Whether the plan is current: the client can send requests. */
export const isLive = (subscription: ClientSubscription | null) =>
  Boolean(subscription && ["active", "trialing", "past_due"].includes(subscription.status));

/** Whether a payment is overdue on any of these subscriptions. */
export const isOwing = (subscriptions: ClientSubscription[]) =>
  subscriptions.some((subscription) => subscription.status === "past_due" || subscription.status === "unpaid");

/** The plans to show: those running now, or else the most recent one. */
export const shownPlans = ({ subscriptions, plans }: { subscriptions: ClientSubscription[]; plans: ClientSubscription[] }) =>
  plans.length ? plans : subscriptions.slice(0, 1);
