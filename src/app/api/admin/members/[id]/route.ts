import { NextRequest, NextResponse } from "next/server";
import { ClientInputError, memberDetail, updateClient } from "@/lib/portal/admin";

export const dynamic = "force-dynamic";

/**
 * GET /api/admin/members/[id] - A member's plans, hours, requests, time and messages
 */
export async function GET(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  try {
    const member = await memberDetail(id);
    if (!member) return NextResponse.json({ error: "Member not found" }, { status: 404 });
    return NextResponse.json(member);
  } catch (error) {
    console.error("Loading a member failed:", error);
    return NextResponse.json({ error: "Failed to load member" }, { status: 500 });
  }
}

/**
 * PATCH /api/admin/members/[id] - Their settings
 * Body: any of { name, company, monthly_hours, engagement, time_zone, weekly_email }.
 */
export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body = await request.json().catch(() => null);
  if (!body || typeof body !== "object") return NextResponse.json({ error: "That couldn't be read." }, { status: 400 });
  try {
    const account = await updateClient(id, body);
    if (!account) return NextResponse.json({ error: "Member not found" }, { status: 404 });
    return NextResponse.json(account);
  } catch (error) {
    if (error instanceof ClientInputError) return NextResponse.json({ error: error.message }, { status: 400 });
    console.error("Updating a member failed:", error);
    return NextResponse.json({ error: "Failed to save" }, { status: 500 });
  }
}
