"use client";

import dynamic from "next/dynamic";
import { usePathname } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";

// Ask Craefto's button, on every public page. The panel's code loads the
// first time someone opens it (or points at the button), so pages carry
// none of it until then; once opened it stays mounted, so closing and
// reopening keeps the conversation. The button stays put under the panel,
// which grows over it and folds back onto it, so nothing blinks out while
// the panel's code loads or its exit plays.

const loadPanel = () => import("./chat-panel");
const ChatPanel = dynamic(loadPanel, { ssr: false, loading: () => null });

/** Where it doesn't belong: admin, the client portal, the opt-out page and the printable profile. */
const HIDDEN = [/^\/admin(\/|$)/, /^\/portal(\/|$)/, /^\/optout(\/|$)/, /^\/company-profile(\/|$)/];

export function AskCraefto() {
  const pathname = usePathname();
  const hidden = HIDDEN.some((pattern) => pattern.test(pathname));
  // closed → open → closing (the panel's exit plays) → closed.
  const [state, setState] = useState<"open" | "closing" | "closed">("closed");
  const [started, setStarted] = useState(false);
  const launcher = useRef<HTMLButtonElement>(null);

  // Back to top steps up above the button (globals.css).
  useEffect(() => {
    document.documentElement.classList.toggle("has-assistant", !hidden);
    return () => document.documentElement.classList.remove("has-assistant");
  }, [hidden]);

  const close = useCallback(() => setState((current) => (current === "open" ? "closing" : current)), []);

  // The panel says when its exit has played.
  const closed = useCallback(() => setState((current) => (current === "closing" ? "closed" : current)), []);

  // Then the button, within reach again, takes the focus back.
  const wasOpen = useRef(false);
  useEffect(() => {
    if (state !== "closed") wasOpen.current = true;
    else if (wasOpen.current) {
      wasOpen.current = false;
      launcher.current?.focus();
    }
  }, [state]);

  if (hidden) return null;

  return (
    <>
      <button
        ref={launcher}
        type="button"
        aria-haspopup="dialog"
        aria-expanded={state === "open"}
        // Under the open panel: out of reach until it has closed.
        inert={state !== "closed"}
        onClick={() => {
          setStarted(true);
          setState("open");
        }}
        onPointerEnter={() => void loadPanel()}
        onFocus={() => void loadPanel()}
        className="ask-craefto-launcher fixed bottom-4 right-4 z-40 inline-flex h-12 items-center gap-2 rounded-full bg-[hsl(var(--color-foreground))] px-5 text-sm font-medium text-[hsl(var(--color-background))] shadow-lg shadow-black/15 hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[hsl(var(--color-accent))] focus-visible:ring-offset-2 sm:bottom-6 sm:right-6"
      >
        <svg aria-hidden="true" viewBox="0 0 24 24" className="size-[18px]" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round">
          <path d="M4 5.5A2.5 2.5 0 0 1 6.5 3h11A2.5 2.5 0 0 1 20 5.5v8a2.5 2.5 0 0 1-2.5 2.5H10l-4.5 4v-4h0A2.5 2.5 0 0 1 4 13.5z" />
        </svg>
        Ask Craefto
      </button>
      {started && <ChatPanel state={state} onClose={close} onClosed={closed} />}
    </>
  );
}
