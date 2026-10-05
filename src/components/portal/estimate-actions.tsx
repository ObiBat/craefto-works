"use client";

import { useActionState, useState } from "react";
import { useFormStatus } from "react-dom";
import { Button } from "@/components/ui/button";
import { approveRequest, withdrawRequest, type FormState } from "@/app/portal/actions";

function Pending({ children, busy, variant = "default" }: { children: React.ReactNode; busy: string; variant?: "default" | "secondary" | "ghost" }) {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" size="lg" variant={variant} disabled={pending} aria-busy={pending}>
      {pending ? busy : children}
    </Button>
  );
}

/** Approve the confirmed estimate (the request joins the queue), or ask about it first. */
export function ApproveEstimate({ requestId }: { requestId: string }) {
  const [state, action] = useActionState<FormState, FormData>(approveRequest, {});
  return (
    <form action={action} className="flex flex-col gap-3">
      <input type="hidden" name="request_id" value={requestId} />
      <div className="flex flex-wrap items-center gap-3">
        <Pending busy="Approving…">Approve estimate</Pending>
        <a href="#message" className="text-sm font-medium text-[hsl(var(--color-accent))] hover:underline">
          Ask about it first
        </a>
      </div>
      {state.error && (
        <p role="alert" className="text-sm text-[hsl(var(--color-error))]">
          {state.error}
        </p>
      )}
    </form>
  );
}

/** Withdraw a request that hasn't started, after a second press to be sure. */
export function WithdrawRequest({ requestId }: { requestId: string }) {
  const [state, action] = useActionState<FormState, FormData>(withdrawRequest, {});
  const [sure, setSure] = useState(false);
  if (!sure) {
    return (
      <button
        type="button"
        onClick={() => setSure(true)}
        className="text-sm font-medium text-[hsl(var(--color-foreground-subtle))] transition-colors hover:text-[hsl(var(--color-foreground))]"
      >
        Withdraw this request
      </button>
    );
  }
  return (
    <form action={action} className="flex flex-wrap items-center gap-3 rounded-2xl bg-[hsl(var(--color-background-subtle))] px-4 py-3">
      <input type="hidden" name="request_id" value={requestId} />
      <span className="text-sm text-[hsl(var(--color-foreground-muted))]">Withdraw it? It won&apos;t go ahead.</span>
      <Pending busy="Withdrawing…" variant="secondary">
        Yes, withdraw
      </Pending>
      <button type="button" onClick={() => setSure(false)} className="text-sm font-medium text-[hsl(var(--color-foreground-muted))] hover:text-[hsl(var(--color-foreground))]">
        Keep it
      </button>
      {state.error && (
        <p role="alert" className="w-full text-sm text-[hsl(var(--color-error))]">
          {state.error}
        </p>
      )}
    </form>
  );
}
