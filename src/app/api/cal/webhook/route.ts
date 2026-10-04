import { createHmac, timingSafeEqual } from "node:crypto";
import { NextResponse, type NextRequest } from "next/server";
import { accountForBooking, cancelBooking, recordBooking } from "@/lib/portal/meetings";
import { recordDiscoveryCall, type DiscoveryBooking } from "@/lib/discovery-calls";

/**
 * Cal.com's webhook (set up by scripts/cal-setup.mjs, signed with
 * CAL_WEBHOOK_SECRET). Clients' calls keep the portal in step with bookings,
 * reschedules and cancellations; everyone else's are Discovery Calls, which
 * reach the sales pipeline (lib/discovery-calls.ts).
 */
export async function POST(request: NextRequest) {
  const secret = process.env.CAL_WEBHOOK_SECRET;
  if (!secret) return NextResponse.json({ error: "Webhook not configured" }, { status: 400 });

  const raw = await request.text();
  const given = Buffer.from(request.headers.get("x-cal-signature-256") ?? "", "utf8");
  const expected = Buffer.from(createHmac("sha256", secret).update(raw).digest("hex"), "utf8");
  if (given.length !== expected.length || !timingSafeEqual(given, expected)) {
    return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
  }

  let event: { triggerEvent?: string; payload?: DiscoveryBooking };
  try {
    event = JSON.parse(raw);
  } catch {
    return NextResponse.json({ error: "Invalid body" }, { status: 400 });
  }
  const booking = event.payload ?? {};

  try {
    switch (event.triggerEvent) {
      case "BOOKING_CREATED":
      case "BOOKING_RESCHEDULED": {
        const account = await accountForBooking(booking);
        if (!account) {
          await recordDiscoveryCall(booking, event.triggerEvent);
          break;
        }
        // A reschedule is a new booking replacing the old one.
        if (booking.rescheduleUid) await cancelBooking(booking.rescheduleUid);
        await recordBooking(account, booking);
        break;
      }
      case "BOOKING_CANCELLED": {
        await cancelBooking(booking.uid);
        if (!(await accountForBooking(booking))) await recordDiscoveryCall(booking, "BOOKING_CANCELLED");
        break;
      }
    }
  } catch (error) {
    console.error(`Cal.com webhook ${event.triggerEvent} failed:`, error);
    return NextResponse.json({ error: "Handler failed" }, { status: 500 });
  }
  return NextResponse.json({ received: true });
}
