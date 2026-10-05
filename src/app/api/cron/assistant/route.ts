import { NextResponse, type NextRequest } from "next/server";
import { safeEqual } from "@/lib/admin-session";
import { deleteExpiredChats, isMonday, sendWeeklyNote } from "@/lib/assistant/housekeeping";
import { digestHour } from "@/lib/outreach/digest";
import { createServerClient } from "@/lib/supabase";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

/**
 * Ask Craefto's housekeeping (vercel.json crons, 21:45 and 22:45 UTC; the one
 * that lands in Sydney's 8 o'clock hour runs): expired chats deleted every
 * day, and Monday's note on the questions it couldn't answer.
 */
export async function GET(request: NextRequest) {
  const secret = process.env.CRON_SECRET;
  const given = request.headers.get("authorization")?.match(/^Bearer\s+(.+)$/i)?.[1];
  if (!secret || !given || !(await safeEqual(given, secret))) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!digestHour()) return NextResponse.json({ ran: false, reason: "Not 8 o'clock in Sydney" });
  try {
    const db = createServerClient();
    const deleted = await deleteExpiredChats(db);
    const weekly = isMonday() ? await sendWeeklyNote(db) : { sent: false, reason: "Not Monday" };
    if (deleted || weekly.sent) console.log("Ask Craefto housekeeping:", JSON.stringify({ deleted, weekly }));
    return NextResponse.json({ ran: true, deleted, weekly });
  } catch (error) {
    console.error("Ask Craefto housekeeping failed:", error);
    return NextResponse.json({ error: "Housekeeping failed" }, { status: 500 });
  }
}
