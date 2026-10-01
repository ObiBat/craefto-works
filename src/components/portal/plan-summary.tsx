import Link from "next/link";
import { formatPrice, monthlyPlans } from "@/lib/pricing";
import { subscriptionLabel, type ClientSubscription } from "@/lib/portal/types";
import { StatusPill, type Tone } from "./status-pill";
import { sydneyDate } from "./thread";

function Tick() {
  return (
    <span className="tick mt-0.5" aria-hidden="true">
      <svg className="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
      </svg>
    </span>
  );
}

function tone(subscription: ClientSubscription): Tone {
  if (subscription.status === "canceled" || subscription.status === "incomplete_expired") return "quiet";
  if (subscription.cancel_at_period_end || ["past_due", "unpaid", "incomplete"].includes(subscription.status)) return "attention";
  return "active";
}

/** The client's plan, in the plan cards' style: what it is, what it costs, where it stands. */
export function PlanSummary({ subscription, children }: { subscription: ClientSubscription | null; children?: React.ReactNode }) {
  if (!subscription) {
    return (
      <div className="rounded-3xl bg-[hsl(var(--color-background-subtle))] p-6 md:p-8">
        <p className="font-medium">No plan yet</p>
        <p className="mt-2 text-[hsl(var(--color-foreground-muted))]">
          <Link href="/services#plans" className="font-medium text-[hsl(var(--color-accent))] hover:underline">
            See the monthly plans
          </Link>
        </p>
      </div>
    );
  }
  const plan = monthlyPlans.find((entry) => entry.id === subscription.plan)!;
  const ended = subscription.status === "canceled";
  const date = subscription.current_period_end ? sydneyDate(subscription.current_period_end) : null;
  return (
    <div className="rounded-3xl bg-[hsl(var(--color-background-subtle))] p-2">
      <div className="rounded-[1.25rem] bg-[hsl(var(--color-accent-subtle))] px-6 pb-7 pt-6">
        <div className="flex items-center justify-between gap-3">
          <p className="font-mono text-xs uppercase tracking-[0.06em] text-[hsl(var(--color-foreground-subtle))]">Your plan</p>
          <StatusPill tone={tone(subscription)} className={tone(subscription) === "active" ? "bg-[hsl(var(--color-background))]" : undefined}>
            {subscriptionLabel(subscription)}
          </StatusPill>
        </div>
        <p className="mt-3 font-[family-name:var(--font-heading)] text-4xl font-semibold tracking-tight text-[hsl(var(--color-accent))]">
          {plan.name}
        </p>
        <p className="mt-2 text-sm leading-relaxed text-[hsl(var(--color-foreground-muted))]">{plan.bestFor}</p>
        <p className="mt-6 flex items-baseline gap-1.5">
          <span className="text-3xl font-semibold tracking-tight tabular-nums">{formatPrice(plan.price)}</span>
          <span className="text-sm text-[hsl(var(--color-foreground-muted))]">/ month</span>
        </p>
        {date && (
          <p className="mt-2 text-sm text-[hsl(var(--color-foreground-muted))]">
            {ended ? `Ended ${date}` : subscription.cancel_at_period_end ? `Ends ${date}` : `Renews ${date}`}
          </p>
        )}
      </div>
      <div className="flex flex-col gap-6 p-6">
        <ul className="space-y-3">
          {plan.includes.map((item) => (
            <li key={item} className="flex gap-3 text-sm text-[hsl(var(--color-foreground))]">
              <Tick />
              {item}
            </li>
          ))}
        </ul>
        {children}
      </div>
    </div>
  );
}
