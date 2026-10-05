import "server-only";
import { createServerClient } from "@/lib/supabase";
import type { CalBooking } from "@/lib/portal/meetings";
import { alertOwner, createLead, leadInputSchema, logActivity, type Activity, type LeadRow } from "@/lib/leads";
import { outreachMeetingBooked } from "@/lib/outreach/conversation";

// Discovery Calls (cal.com/craefto/discovery-call) reach the pipeline here,
// through Cal.com's webhook (api/cal/webhook). A booking finds its lead by the
// attendee's email, or files a new one, records the call in the lead's
// history, alerts the owner and moves the lead on to "Meeting booked". Matched
// by email only, never by booking metadata, which whoever books can set
// through the booking link's query string.

export type BookingTrigger = "BOOKING_CREATED" | "BOOKING_RESCHEDULED" | "BOOKING_CANCELLED";

export interface DiscoveryBooking extends CalBooking {
  attendees?: Array<{ email?: string; name?: string; timeZone?: string }>;
  /** Answers to the booking questions, by field name. */
  responses?: Record<string, string | { value?: unknown } | undefined>;
  additionalNotes?: string;
}

/** The booking question the site's BookCall prefills (components/book-call.tsx). */
const PROJECT_FIELD = "Tell-us-about-your-project";

const MEETING_STAGE = "meeting";

function sydneyTime(iso: string | undefined): string | null {
  if (!iso) return null;
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return null;
  const formatted = new Intl.DateTimeFormat("en-AU", {
    timeZone: "Australia/Sydney",
    weekday: "short",
    day: "numeric",
    month: "short",
    hour: "numeric",
    minute: "2-digit",
  }).format(date);
  return `${formatted} (Sydney)`;
}

function answer(booking: DiscoveryBooking, field: string): string | null {
  const response = booking.responses?.[field];
  const text = typeof response === "string" ? response : typeof response?.value === "string" ? response.value : null;
  return text?.trim() || null;
}

type Db = ReturnType<typeof createServerClient>;

/** Moves the lead to "Meeting booked", unless it is there already or further on. */
async function moveToMeetingBooked(db: Db, lead: LeadRow) {
  const { data: stages } = await db.from("pipeline_stages").select("id, slug, name, order");
  const meeting = stages?.find((stage) => stage.slug === MEETING_STAGE);
  if (!meeting) return;
  const current = stages?.find((stage) => stage.id === lead.stage_id);
  if (current && current.order >= meeting.order) return;
  const { error } = await db.from("leads").update({ stage_id: meeting.id }).eq("id", lead.id);
  if (error) {
    console.error(`Failed to move lead ${lead.id} to ${meeting.name}:`, error);
    return;
  }
  await logActivity(db, lead.id, { type: "stage_changed", title: `Moved to ${meeting.name}`, description: "When the Discovery Call was booked" });
}

export async function recordDiscoveryCall(booking: DiscoveryBooking, trigger: BookingTrigger) {
  const attendee = booking.attendees?.find((person) => person.email);
  if (!attendee?.email || !booking.uid) return;
  const email = attendee.email.trim().toLowerCase();
  const db = createServerClient();

  // Cal.com retries webhooks that time out: each booking event is recorded once.
  const { data: seen } = await db.from("lead_activities").select("id").contains("metadata", { cal_uid: booking.uid, trigger }).limit(1);
  if (seen?.length) return;

  const { data: existing } = await db
    .from("leads")
    .select("*")
    .eq("email", email)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle<LeadRow>();

  const time = sydneyTime(booking.startTime);
  const metadata = {
    cal_uid: booking.uid,
    trigger,
    starts_at: booking.startTime ?? null,
    ends_at: booking.endTime ?? null,
    replaces: booking.rescheduleUid ?? null,
  };

  if (trigger === "BOOKING_CANCELLED") {
    if (!existing) return;
    await logActivity(db, existing.id, {
      type: "meeting_cancelled",
      title: "Discovery Call cancelled",
      description: time ? `It was booked for ${time}` : undefined,
      metadata,
    });
    await alertOwner(db, existing, "Discovery Call cancelled", [["Was booked for", time]]);
    return;
  }

  const activity: Activity = {
    type: "meeting_scheduled",
    title: trigger === "BOOKING_RESCHEDULED" ? "Discovery Call moved" : "Discovery Call booked",
    description: time ? `For ${time}` : undefined,
    metadata,
  };

  let lead = existing;
  if (!lead) {
    const input = leadInputSchema.safeParse({
      name: attendee.name || email.split("@")[0],
      email,
      message: answer(booking, PROJECT_FIELD) ?? booking.additionalNotes ?? null,
    });
    if (!input.success) {
      console.error(`Discovery Call ${booking.uid}: booking details didn't make a valid lead`);
      return;
    }
    lead = await createLead(input.data, { source: "cal", confirm: false, activity, alert: activity.title, alertRows: [["When", time]] });
  } else {
    await logActivity(db, lead.id, activity);
    await alertOwner(db, lead, activity.title, [["When", time]]);
  }
  await moveToMeetingBooked(db, lead);
  // Someone handed over from an outreach reply: their prospect moves on too.
  await outreachMeetingBooked(lead.id).catch((error) => console.error(`Discovery Call ${booking.uid}: couldn't update the outreach prospect:`, error));
}
