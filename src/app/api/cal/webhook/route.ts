import { createHmac, timingSafeEqual } from "node:crypto";
import { NextResponse, type NextRequest } from "next/server";
import { accountForBooking, cancelBooking, recordBooking, type CalBooking } from "@/lib/portal/meetings";

/**
 * Cal.com's webhook (Settings > Developer > Webhooks, with the secret in
 * CAL_WEBHOOK_SECRET): keeps clients' calls in the portal in step with
 * bookings, reschedules and cancellations. Bookings by anyone who isn't a
 * client (discovery calls from the website) are ignored.
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

  let event: { triggerEvent?: string; payload?: CalBooking };
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
        if (!account) break;
        // A reschedule is a new booking replacing the old one.
        if (booking.rescheduleUid) await cancelBooking(booking.rescheduleUid);
        await recordBooking(account, booking);
        break;
      }
      case "BOOKING_CANCELLED":
        await cancelBooking(booking.uid);
        break;
    }
  } catch (error) {
    console.error(`Cal.com webhook ${event.triggerEvent} failed:`, error);
    return NextResponse.json({ error: "Handler failed" }, { status: 500 });
  }
  return NextResponse.json({ received: true });
}
