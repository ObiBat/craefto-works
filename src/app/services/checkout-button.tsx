"use client";

import Link from "next/link";
import { useFormStatus } from "react-dom";
import { Button } from "@/components/ui/button";
import { startCheckout } from "./checkout";

function Submit({ name }: { name: string }) {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" size="md" className="w-full" disabled={pending} aria-busy={pending} hoverText="Continue to checkout">
      {pending ? "Opening checkout…" : `Start with ${name}`}
    </Button>
  );
}

/** A plan card's actions: subscribe through Stripe Checkout, or ask first. */
export function CheckoutButton({ plan, name }: { plan: string; name: string }) {
  return (
    <div className="flex flex-col items-center gap-3">
      <form action={startCheckout} className="w-full">
        <input type="hidden" name="plan" value={plan} />
        <Submit name={name} />
      </form>
      <Link
        href={`/contact?plan=${plan}`}
        className="text-sm text-[hsl(var(--color-foreground-muted))] transition-colors hover:text-[hsl(var(--color-foreground))]"
      >
        Questions first? Talk to us
      </Link>
    </div>
  );
}
