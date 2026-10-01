"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Cal, { getCalApi } from "@calcom/embed-react";
import { Callout } from "./blocks";

const NAMESPACE = "craefto-portal";

/**
 * Craefto's Cal.com calendar, in the site's colours, with the client's name,
 * email and plan filled in. The webhook files the call under the client by
 * that email.
 */
export function CalBooking({
  calLink,
  name,
  email,
  notes,
}: {
  calLink: string;
  name: string;
  email: string;
  notes: string;
}) {
  const router = useRouter();
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
      cal("on", {
        action: "bookingSuccessfulV2",
        callback: () => {
          setBooked(true);
          // Cal.com's webhook records the call a moment later.
          window.setTimeout(() => router.refresh(), 4000);
        },
      });
    });
    return () => {
      live = false;
    };
  }, [router]);

  return (
    <div className="flex flex-col gap-4">
      {booked && (
        <Callout title="You're booked">
          A calendar invite is on its way to {email}. Your call will appear here in a moment.
        </Callout>
      )}
      <div className="overflow-hidden rounded-3xl bg-[hsl(var(--color-background-subtle))] p-1 sm:p-2">
        <Cal
          namespace={NAMESPACE}
          calLink={calLink}
          style={{ width: "100%", minHeight: 560, overflow: "auto" }}
          config={{
            layout: "month_view",
            theme: "light",
            name,
            email,
            notes,
          }}
        />
      </div>
    </div>
  );
}
