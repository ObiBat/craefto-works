import { NextResponse } from "next/server";
import { workOverview } from "@/lib/portal/work";

export const dynamic = "force-dynamic";

/** GET /api/admin/work - Shipped work: drafts waiting to publish, and the last month's published and dismissed. */
export async function GET() {
  try {
    return NextResponse.json(await workOverview(), { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    console.error("Loading shipped work failed:", error);
    return NextResponse.json({ error: "Failed to load" }, { status: 500 });
  }
}
