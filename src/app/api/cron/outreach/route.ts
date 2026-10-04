import { NextResponse, type NextRequest } from "next/server";
import { safeEqual } from "@/lib/admin-session";
import { tick } from "@/lib/outreach/sender";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

/**
 * The outreach sender's clock (vercel.json crons, every 3 minutes). Vercel
 * signs each call with CRON_SECRET; anything else is refused. Each call sends
 * at most one email (lib/outreach/sender.ts).
 */
export async function GET(request: NextRequest) {
  const secret = process.env.CRON_SECRET;
  const given = request.headers.get("authorization")?.match(/^Bearer\s+(.+)$/i)?.[1];
  if (!secret || !given || !(await safeEqual(given, secret))) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  try {
    const outcome = await tick();
    if (!["off", "waiting", "nothing-due"].includes(outcome.result)) console.log("Outreach sender:", JSON.stringify(outcome));
    return NextResponse.json(outcome);
  } catch (error) {
    console.error("Outreach sender failed:", error);
    return NextResponse.json({ error: "The sender failed" }, { status: 500 });
  }
}
