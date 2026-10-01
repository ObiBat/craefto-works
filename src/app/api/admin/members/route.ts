import { NextResponse } from "next/server";
import { membersOverview } from "@/lib/portal/admin";

export const dynamic = "force-dynamic";

/**
 * GET /api/admin/members - Clients on monthly plans, busiest first
 */
export async function GET() {
  try {
    return NextResponse.json(await membersOverview());
  } catch (error) {
    console.error("Loading members failed:", error);
    return NextResponse.json({ error: "Failed to load members" }, { status: 500 });
  }
}
