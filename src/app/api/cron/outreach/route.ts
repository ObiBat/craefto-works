import { NextResponse, type NextRequest } from "next/server";
import { safeEqual } from "@/lib/admin-session";
import { syncReplies } from "@/lib/outreach/replies";
import { tick } from "@/lib/outreach/sender";

export const dynamic = "force-dynamic";
export const maxDuration = 120;

/**
 * The outreach clock (vercel.json crons, every 3 minutes). Vercel signs each
 * call with CRON_SECRET; anything else is refused. Each turn reads the
 * mailbox first (lib/outreach/replies.ts), so a reply is on record before
 * any follow-up could go, then sends at most one email (lib/outreach/sender.ts).
 */
export async function GET(request: NextRequest) {
  const secret = process.env.CRON_SECRET;
  const given = request.headers.get("authorization")?.match(/^Bearer\s+(.+)$/i)?.[1];
  if (!secret || !given || !(await safeEqual(given, secret))) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  let replies;
  try {
    replies = await syncReplies();
    if (replies.stored || replies.waiting || replies.result === "failed") console.log("Outreach replies:", JSON.stringify(replies));
  } catch (error) {
    // The sender still runs: follow-ups hold by themselves while the inbox can't be read.
    console.error("Outreach replies failed:", error);
    replies = { result: "failed" };
  }
  try {
    const outcome = await tick();
    if (!["off", "waiting", "nothing-due"].includes(outcome.result)) console.log("Outreach sender:", JSON.stringify(outcome));
    return NextResponse.json({ ...outcome, replies });
  } catch (error) {
    console.error("Outreach sender failed:", error);
    return NextResponse.json({ error: "The sender failed", replies }, { status: 500 });
  }
}
