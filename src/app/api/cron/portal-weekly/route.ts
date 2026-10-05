import { NextResponse, type NextRequest } from "next/server";
import { safeEqual } from "@/lib/admin-session";
import { siteOrigin } from "@/lib/portal/origin";
import { sendWeeklySummaries } from "@/lib/portal/weekly";
import { createServerClient } from "@/lib/supabase";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

/** Friday, 4 pm in Sydney (either side of daylight saving). */
function fridayAfternoon(now = new Date()) {
  const parts = new Intl.DateTimeFormat("en-AU", { timeZone: "Australia/Sydney", weekday: "short", hour: "numeric", hour12: false }).formatToParts(now);
  const part = (type: string) => parts.find((entry) => entry.type === type)?.value;
  return part("weekday") === "Fri" && Number(part("hour")) === 16;
}

/**
 * The Friday effort email to clients (vercel.json crons, 05:00 and 06:00 UTC
 * on Fridays; the one that lands at 4 pm in Sydney runs).
 */
export async function GET(request: NextRequest) {
  const secret = process.env.CRON_SECRET;
  const given = request.headers.get("authorization")?.match(/^Bearer\s+(.+)$/i)?.[1];
  if (!secret || !given || !(await safeEqual(given, secret))) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!fridayAfternoon()) return NextResponse.json({ ran: false, reason: "Not 4 pm Friday in Sydney" });
  try {
    const result = await sendWeeklySummaries(createServerClient(), await siteOrigin());
    if (result.sent) console.log("Portal weekly emails:", JSON.stringify(result));
    return NextResponse.json({ ran: true, ...result });
  } catch (error) {
    console.error("Portal weekly emails failed:", error);
    return NextResponse.json({ error: "Weekly emails failed" }, { status: 500 });
  }
}
