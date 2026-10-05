"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";

/**
 * While Ask Craefto writes its first reply to a new request (a few seconds,
 * after the page has loaded), say so, and look again until it's there. Gives
 * up after a minute and a half: the reply then shows on the next visit.
 */
export function AssistantPending() {
  const router = useRouter();
  useEffect(() => {
    const started = Date.now();
    const timer = window.setInterval(() => {
      if (Date.now() - started > 90_000) window.clearInterval(timer);
      else router.refresh();
    }, 2500);
    return () => window.clearInterval(timer);
  }, [router]);
  return (
    <div role="status" className="portal-assistant flex items-center gap-3 rounded-2xl px-5 py-4 text-sm text-[hsl(var(--color-foreground-muted))]">
      <span className="inline-flex gap-1" aria-hidden="true">
        <span className="ask-craefto-dot size-1.5 rounded-full bg-[hsl(var(--color-accent))]" />
        <span className="ask-craefto-dot size-1.5 rounded-full bg-[hsl(var(--color-accent))] [animation-delay:150ms]" />
        <span className="ask-craefto-dot size-1.5 rounded-full bg-[hsl(var(--color-accent))] [animation-delay:300ms]" />
      </span>
      Ask Craefto is reading your request and working out an initial estimate…
    </div>
  );
}
