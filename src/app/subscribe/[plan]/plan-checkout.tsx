"use client";

import Link from "next/link";
import { useId, useState } from "react";
import { useFormStatus } from "react-dom";
import { Button } from "@/components/ui/button";
import { PLAN_TERMS_VERSION } from "@/content/plan-terms";
import { startCheckout } from "../checkout";

function Pay() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" size="lg" className="w-full" disabled={pending} aria-busy={pending}>
      {pending ? "Opening secure checkout…" : "Continue to payment"}
    </Button>
  );
}

function Lock() {
  return (
    <svg className="mt-0.5 h-3.5 w-3.5 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} aria-hidden="true">
      <rect x="4" y="10.5" width="16" height="10.5" rx="2.5" />
      <path strokeLinecap="round" d="M8 10.5V7.5a4 4 0 0 1 8 0v3" />
    </svg>
  );
}

/**
 * Agree to the plan terms, then pay through Stripe Checkout. The box is
 * required: without JavaScript the browser checks it, with it this form shows
 * its own message, and startCheckout checks it again (with the terms version
 * this page showed).
 */
export function PlanCheckout({ plan }: { plan: string }) {
  const id = useId();
  const [missing, setMissing] = useState(false);

  return (
    <form action={startCheckout} className="flex flex-col gap-6">
      <input type="hidden" name="plan" value={plan} />
      <input type="hidden" name="terms" value={PLAN_TERMS_VERSION} />
      <div>
        <div className="flex items-start gap-3">
          <input
            id={`${id}-agree`}
            type="checkbox"
            name="agree"
            value="yes"
            required
            aria-invalid={missing || undefined}
            aria-describedby={missing ? `${id}-missing` : undefined}
            onInvalid={(event) => {
              event.preventDefault();
              setMissing(true);
              event.currentTarget.focus();
            }}
            onChange={(event) => event.currentTarget.checked && setMissing(false)}
            className="mt-0.5 size-[1.125rem] shrink-0 cursor-pointer accent-[hsl(var(--color-accent))]"
          />
          <label htmlFor={`${id}-agree`} className="cursor-pointer text-sm leading-relaxed text-[hsl(var(--color-foreground))]">
            I&apos;ve reviewed the scope and agree to the{" "}
            <a href="#plan-terms" className="font-medium underline decoration-[hsl(var(--color-foreground-subtle))] underline-offset-4 hover:text-[hsl(var(--color-accent))]">
              plan terms
            </a>{" "}
            and the{" "}
            <Link
              href="/terms#monthly-plans"
              target="_blank"
              className="font-medium underline decoration-[hsl(var(--color-foreground-subtle))] underline-offset-4 hover:text-[hsl(var(--color-accent))]"
            >
              Terms of Service
            </Link>
            .
          </label>
        </div>
        {missing && (
          <p id={`${id}-missing`} role="alert" className="mt-2 pl-[1.875rem] text-sm text-[hsl(var(--color-error))]">
            Tick the box to agree to the plan terms first.
          </p>
        )}
      </div>
      <Pay />
      <p className="flex gap-2 text-xs leading-relaxed text-[hsl(var(--color-foreground-muted))]">
        <Lock />
        <span>
          Secure payment through Stripe. Once it&apos;s complete, you&apos;ll go straight to your client portal to make your first
          request.
        </span>
      </p>
    </form>
  );
}
