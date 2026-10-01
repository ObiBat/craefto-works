import "server-only";
import { createServerClient } from "@/lib/supabase";
import { accountByEmail } from "./accounts";
import type { ClientAccount } from "./types";

// Calls booked from the portal through Cal.com. The booking page is embedded
// (src/components/portal/cal-booking.tsx) and Cal.com's webhook records each
// booking, reschedule and cancellation here (src/app/api/cal/webhook).

/** The Cal.com event clients book: user/event-slug. */
export const CAL_LINK = process.env.CAL_BOOKING_LINK || "craefto/client-call";

const db = () => createServerClient();

/** The parts of a Cal.com webhook payload used here. */
export interface CalBooking {
  uid?: string;
  title?: string;
  startTime?: string;
  endTime?: string;
  rescheduleUid?: string;
  attendees?: Array<{ email?: string; timeZone?: string }>;
  metadata?: Record<string, unknown>;
  location?: string;
  videoCallData?: { url?: string };
}

/**
 * The client a booking belongs to, by the attendee's email (where Cal.com
 * sends the invite); null for anyone else. Never by booking metadata:
 * whoever books can set that through the booking link's query string.
 */
export async function accountForBooking(booking: CalBooking): Promise<ClientAccount | null> {
  for (const attendee of booking.attendees ?? []) {
    const account = attendee.email ? await accountByEmail(attendee.email) : null;
    if (account) return account;
  }
  return null;
}

/** Meeting services whose links are shown as "Join" (others could be planted through booking metadata). */
const MEETING_HOSTS = /^(meet\.google\.com|(app\.)?cal\.com|([a-z0-9-]+\.)?zoom\.us|teams\.microsoft\.com|teams\.live\.com)$/i;

function joinUrl(booking: CalBooking): string | null {
  for (const candidate of [booking.videoCallData?.url, booking.metadata?.videoCallUrl, booking.location]) {
    if (typeof candidate !== "string") continue;
    try {
      const url = new URL(candidate);
      if (url.protocol === "https:" && MEETING_HOSTS.test(url.hostname)) return url.toString();
    } catch {
      // Not a link (a phone number, an address, an integration name).
    }
  }
  return null;
}

export async function recordBooking(account: ClientAccount, booking: CalBooking) {
  if (!booking.uid || !booking.startTime || !booking.endTime) return;
  const { error } = await db()
    .from("client_meetings")
    .upsert(
      {
        account_id: account.id,
        cal_uid: booking.uid,
        title: booking.title || "Call with Craefto",
        starts_at: booking.startTime,
        ends_at: booking.endTime,
        time_zone: booking.attendees?.[0]?.timeZone ?? null,
        status: "booked",
        join_url: joinUrl(booking),
        updated_at: new Date().toISOString(),
      },
      { onConflict: "cal_uid" }
    );
  if (error) throw error;
}

export async function cancelBooking(uid: string | undefined) {
  if (!uid) return;
  const { error } = await db()
    .from("client_meetings")
    .update({ status: "cancelled", updated_at: new Date().toISOString() })
    .eq("cal_uid", uid);
  if (error) throw error;
}
