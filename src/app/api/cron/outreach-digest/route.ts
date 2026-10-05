import { NextResponse, type NextRequest } from "next/server";
import { safeEqual } from "@/lib/admin-session";
import { digestHour, sendDigest } from "@/lib/outreach/digest";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

/**
 * The morning outreach digest (vercel.json crons, 21:30 and 22:30 UTC). Only
 * the call that lands at 8:30 in Sydney sends it, so it keeps time across
 * daylight saving; it goes once a day.
 */
export async function GET(request: NextRequest) {
  const secret = process.env.CRON_SECRET;
  const given = request.headers.get("authorization")?.match(/^Bearer\s+(.+)$/i)?.[1];
  if (!secret || !given || !(await safeEqual(given, secret))) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!digestHour()) return NextResponse.json({ sent: false, reason: "Not 8 o'clock in Sydney" });
  try {
    const outcome = await sendDigest();
    console.log("Outreach digest:", JSON.stringify(outcome));
    return NextResponse.json(outcome);
  } catch (error) {
    console.error("Outreach digest failed:", error);
    return NextResponse.json({ error: "The digest failed" }, { status: 500 });
  }
}
