import { monthlyPlans } from "@/lib/pricing";
import { isLive, type ClientSubscription, type RequestStatus } from "@/lib/portal/types";

export const planName = (plan: string) => monthlyPlans.find((entry) => entry.id === plan)?.name ?? plan;

/** A plan's badge colour: running, needing attention (ending, unpaid) or over. */
export function planVariant(subscription: ClientSubscription) {
  if (subscription.status === "canceled" || subscription.status === "incomplete_expired") return "neutral" as const;
  if (subscription.cancel_at_period_end || !isLive(subscription) || subscription.status === "past_due") return "warning" as const;
  return "success" as const;
}

export const REQUEST_VARIANT: Record<RequestStatus, "neutral" | "accent" | "warning" | "success"> = {
  received: "neutral",
  in_progress: "accent",
  needs_info: "warning",
  delivered: "success",
};

export const shortDate = (iso: string, withTime = false) =>
  new Date(iso).toLocaleString("en-AU", {
    day: "numeric",
    month: "short",
    ...(withTime ? { hour: "numeric", minute: "2-digit" } : { year: "numeric" }),
    timeZone: "Australia/Sydney",
  });
