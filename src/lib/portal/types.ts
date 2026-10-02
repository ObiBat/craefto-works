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

export type RequestStatus = "received" | "in_progress" | "needs_info" | "delivered";

export interface ClientRequest {
  id: string;
  account_id: string;
  title: string;
  details: string;
  status: RequestStatus;
  created_at: string;
  updated_at: string;
}

export interface ClientMessage {
  id: string;
  account_id: string;
  request_id: string | null;
  author: "client" | "craefto";
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
  received: { label: "Received", tone: "quiet", hint: "We have it and will plan it in." },
  in_progress: { label: "In progress", tone: "active", hint: "We're working on it." },
  needs_info: { label: "Needs your input", tone: "attention", hint: "We need something from you to keep going." },
  delivered: { label: "Delivered", tone: "done", hint: "Done and handed over." },
};

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
