// When an email may go out: in the recipient's working hours, Monday to
// Friday, not on a public holiday where they are. Pure functions.

const STATE_ZONES: Record<string, string> = {
  NSW: "Australia/Sydney",
  ACT: "Australia/Sydney",
  VIC: "Australia/Melbourne",
  TAS: "Australia/Hobart",
  QLD: "Australia/Brisbane",
  SA: "Australia/Adelaide",
  NT: "Australia/Darwin",
  WA: "Australia/Perth",
};

const CITY_ZONES: [RegExp, string][] = [
  [/mongolia|ulaanbaatar|erdenet|darkhan/i, "Asia/Ulaanbaatar"],
  [/brisbane|gold coast|sunshine coast|noosa|cairns|townsville|toowoomba|ipswich/i, "Australia/Brisbane"],
  [/perth|mandurah|fremantle/i, "Australia/Perth"],
  [/adelaide/i, "Australia/Adelaide"],
  [/darwin/i, "Australia/Darwin"],
  [/hobart|launceston/i, "Australia/Hobart"],
  [/melbourne|geelong|ballarat|bendigo/i, "Australia/Melbourne"],
  [/sydney|newcastle|wollongong|canberra|central coast/i, "Australia/Sydney"],
];

export const DEFAULT_ZONE = "Australia/Sydney";

/** The recipient's time zone, from their state, else their location, else their domain. */
export function zoneFor(p: { state?: string; location?: string; website?: string; contact?: { value: string } }): string {
  const state = p.state?.trim().toUpperCase();
  if (state && STATE_ZONES[state]) return STATE_ZONES[state];
  const location = p.location ?? "";
  const code = location.match(/\b(NSW|ACT|VIC|TAS|QLD|SA|NT|WA)\b/);
  for (const [pattern, zone] of CITY_ZONES) if (pattern.test(location) && (!code || zone === "Asia/Ulaanbaatar")) return zone;
  if (code) return STATE_ZONES[code[1]];
  if (/\.mn(\/|$)/.test(p.website ?? "") || /\.mn$/i.test(p.contact?.value ?? "")) return "Asia/Ulaanbaatar";
  return DEFAULT_ZONE;
}

/** Public holidays to skip, by zone family, as YYYY-MM-DD. National days plus the larger state ones. */
const HOLIDAYS: Record<string, string[]> = {
  AU: [
    "2026-12-25", "2026-12-28",
    "2027-01-01", "2027-01-26", "2027-03-26", "2027-03-29", "2027-04-26", "2027-12-27", "2027-12-28",
  ],
  "Australia/Sydney": ["2026-10-05", "2027-06-14", "2027-10-04"],
  "Australia/Melbourne": ["2026-11-03", "2027-03-08", "2027-06-14", "2027-11-02"],
  "Australia/Hobart": ["2027-03-08", "2027-06-14"],
  "Australia/Brisbane": ["2026-10-05", "2027-05-03", "2027-10-04"],
  "Australia/Adelaide": ["2026-10-05", "2027-03-08", "2027-06-14", "2027-10-04"],
  "Australia/Darwin": ["2027-05-03", "2027-06-14", "2027-08-02"],
  "Australia/Perth": ["2027-03-01", "2027-06-07", "2027-09-27"],
  "Asia/Ulaanbaatar": ["2026-11-26", "2026-12-29", "2027-01-01", "2027-03-08", "2027-06-01", "2027-07-11", "2027-07-12", "2027-07-13", "2027-07-14", "2027-07-15", "2027-11-26", "2027-12-29"],
};

export function isHoliday(day: string, zone: string) {
  return (zone.startsWith("Australia/") && HOLIDAYS.AU.includes(day)) || (HOLIDAYS[zone] ?? []).includes(day);
}

/** The date (YYYY-MM-DD), weekday (1 = Monday) and minutes past midnight at an instant, in a zone. */
export function localParts(at: Date, zone: string) {
  const parts = Object.fromEntries(
    new Intl.DateTimeFormat("en-CA", { timeZone: zone, year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit", weekday: "short", hourCycle: "h23" })
      .formatToParts(at)
      .map((part) => [part.type, part.value]),
  );
  const weekday = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].indexOf(parts.weekday) + 1;
  return { date: `${parts.year}-${parts.month}-${parts.day}`, weekday, minutes: Number(parts.hour) * 60 + Number(parts.minute) };
}

const minutesOf = (time: string) => {
  const [hours, minutes] = time.split(":").map(Number);
  return hours * 60 + (minutes || 0);
};

export interface SendWindow {
  /** "09:00" */
  start: string;
  /** "16:30" */
  end: string;
}

/** Whether it's working time for the recipient: a weekday, not a holiday, inside the window. */
export function isWorkingTime(at: Date, zone: string, window: SendWindow) {
  const { date, weekday, minutes } = localParts(at, zone);
  return weekday >= 1 && weekday <= 5 && !isHoliday(date, zone) && minutes >= minutesOf(window.start) && minutes < minutesOf(window.end);
}

/** A random wait before the next send, 3 to 10 minutes as the plan spaces them. */
export function nextGap(random: () => number = Math.random) {
  return Math.round((3 + random() * 7) * 60_000);
}
