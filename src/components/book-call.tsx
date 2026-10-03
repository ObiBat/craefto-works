"use client";

import { useEffect, useState, type ComponentProps, type MouseEvent, type ReactNode } from "react";
import { getCalApi } from "@calcom/embed-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { siteConfig } from "@/lib/constants";

const NAMESPACE = "craefto-discovery";
const CAL_LINK = siteConfig.calLink;
/** The booking question a page can fill in (a plan's start page names the plan). */
const PROJECT_FIELD = "Tell-us-about-your-project";

type CalGlobal = { ns?: Record<string, { instance?: unknown } | undefined> };
type ButtonProps = ComponentProps<typeof Button>;

/**
 * Book the Discovery Call in a Cal.com pop-up, optionally with the project
 * question already filled in. Until Cal.com's script has loaded (or where
 * it's blocked), the button is a plain link to the booking page, in a new tab.
 */
export function BookCall({
  project,
  children = "Book a call",
  bookedNote,
  onDark = false,
  variant = "secondary",
  size = "md",
  className,
}: {
  project?: string;
  children?: ReactNode;
  /** A line after "You're booked." */
  bookedNote?: string;
  /** On a dark or green surface: the confirmation reads in white. */
  onDark?: boolean;
  variant?: ButtonProps["variant"];
  size?: ButtonProps["size"];
  className?: string;
}) {
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

  const prefill: Record<string, string> = project ? { [PROJECT_FIELD]: project } : {};
  const query = new URLSearchParams(prefill).toString();

  const open = (event: MouseEvent<HTMLAnchorElement>) => {
    const loaded = (window as unknown as { Cal?: CalGlobal }).Cal?.ns?.[NAMESPACE]?.instance;
    if (!loaded) return;
    event.preventDefault();
    getCalApi({ namespace: NAMESPACE }).then((cal) =>
      cal("modal", { calLink: CAL_LINK, config: { layout: "month_view", theme: "light", ...prefill } }),
    );
  };

  return (
    <>
      <div role="status">
        {booked && (
          <p
            className={cn(
              "rounded-2xl px-4 py-3 text-sm leading-relaxed",
              onDark ? "bg-white/15 text-white" : "bg-[hsl(var(--color-accent-subtle))] text-[hsl(var(--color-foreground))]",
            )}
          >
            <span className="font-medium">You&apos;re booked.</span> Your invite, with the Google Meet link, is on its way to your
            inbox.{bookedNote ? ` ${bookedNote}` : ""}
          </p>
        )}
      </div>
      {!booked && (
        <Button asChild variant={variant} size={size} className={className}>
          <a href={`https://cal.com/${CAL_LINK}${query ? `?${query}` : ""}`} target="_blank" rel="noopener noreferrer" onClick={open}>
            {children}
          </a>
        </Button>
      )}
    </>
  );
}
