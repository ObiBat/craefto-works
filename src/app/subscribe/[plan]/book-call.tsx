"use client";

import { useEffect, useState, type MouseEvent } from "react";
import { getCalApi } from "@calcom/embed-react";
import { Button } from "@/components/ui/button";

const NAMESPACE = "craefto-discovery";
/** Craefto's public Discovery Call on Cal.com: 30 minutes, on Google Meet. */
const CAL_LINK = "craefto/discovery-call";
/** The booking question the plan is written into. */
const PROJECT_FIELD = "Tell-us-about-your-project";

type CalGlobal = { ns?: Record<string, { instance?: unknown } | undefined> };

/**
 * Book the Discovery Call in a Cal.com pop-up, with the plan already written
 * into the project question. Until Cal.com's script has loaded (or where it's
 * blocked), the button is a plain link to the booking page, in a new tab.
 */
export function BookCall({ project }: { project: string }) {
  const [booked, setBooked] = useState(false);

  useEffect(() => {
    let live = true;
    getCalApi({ namespace: NAMESPACE }).then((cal) => {
      if (!live) return;
      cal("ui", {
        theme: "light",
        layout: "month_view",
        hideEventTypeDetails: false,
        cssVarsPerTheme: { light: { "cal-brand": "#121110" }, dark: { "cal-brand": "#FDFCFA" } },
      });
      cal("on", { action: "bookingSuccessfulV2", callback: () => setBooked(true) });
    });
    return () => {
      live = false;
    };
  }, []);

  const open = (event: MouseEvent<HTMLAnchorElement>) => {
    const loaded = (window as unknown as { Cal?: CalGlobal }).Cal?.ns?.[NAMESPACE]?.instance;
    if (!loaded) return;
    event.preventDefault();
    getCalApi({ namespace: NAMESPACE }).then((cal) =>
      cal("modal", { calLink: CAL_LINK, config: { layout: "month_view", theme: "light", [PROJECT_FIELD]: project } }),
    );
  };

  return (
    <>
      <div role="status">
        {booked && (
          <p className="rounded-2xl bg-[hsl(var(--color-accent-subtle))] px-4 py-3 text-sm leading-relaxed text-[hsl(var(--color-foreground))]">
            <span className="font-medium">You&apos;re booked.</span> Your invite, with the Google Meet link, is on its way to your
            inbox. Start your plan whenever you&apos;re ready.
          </p>
        )}
      </div>
      {!booked && (
        <Button asChild variant="secondary" size="md" className="w-full">
          <a
            href={`https://cal.com/${CAL_LINK}?${new URLSearchParams({ [PROJECT_FIELD]: project })}`}
            target="_blank"
            rel="noopener noreferrer"
            onClick={open}
          >
            Book a call
          </a>
        </Button>
      )}
    </>
  );
}
