// How calls read, in the portal and in admin (no server code here).

/** "Thu 3 Oct, 10:00 am to 10:30 am AEST", in the time zone the client booked in. */
export function callTime(meeting: { starts_at: string; ends_at: string; time_zone: string | null }) {
  const timeZone = meeting.time_zone || "Australia/Sydney";
  const day = new Date(meeting.starts_at).toLocaleDateString("en-AU", { weekday: "short", day: "numeric", month: "short", timeZone });
  const time = (iso: string, zone = false) =>
    new Date(iso).toLocaleTimeString("en-AU", { hour: "numeric", minute: "2-digit", timeZone, ...(zone ? { timeZoneName: "short" } : {}) });
  return `${day}, ${time(meeting.starts_at)} to ${time(meeting.ends_at, true)}`;
}

/** Cal.com's own pages for changing a booking. */
export const rescheduleUrl = (uid: string) => `https://cal.com/reschedule/${encodeURIComponent(uid)}`;
export const cancelUrl = (uid: string) => `https://cal.com/booking/${encodeURIComponent(uid)}?cancel=true`;
