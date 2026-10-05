import { NextRequest, NextResponse } from "next/server";
import { ClientInputError, createClient, membersOverview } from "@/lib/portal/admin";

export const dynamic = "force-dynamic";

/**
 * GET /api/admin/members - Clients, busiest first
 */
export async function GET() {
  try {
    return NextResponse.json(await membersOverview());
  } catch (error) {
    console.error("Loading members failed:", error);
    return NextResponse.json({ error: "Failed to load members" }, { status: 500 });
  }
}

/**
 * POST /api/admin/members - Add a client Craefto works with directly
 * Body: { email, name?, company?, monthly_hours, engagement?, time_zone? }. No email goes out until they're invited.
 */
export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => null);
  if (!body || typeof body !== "object") return NextResponse.json({ error: "That couldn't be read." }, { status: 400 });
  try {
    return NextResponse.json(await createClient(body), { status: 201 });
  } catch (error) {
    if (error instanceof ClientInputError) return NextResponse.json({ error: error.message }, { status: 400 });
    console.error("Adding a client failed:", error);
    return NextResponse.json({ error: "Failed to add the client" }, { status: 500 });
  }
}
