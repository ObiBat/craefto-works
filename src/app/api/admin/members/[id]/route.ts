import { NextRequest, NextResponse } from "next/server";
import { memberDetail } from "@/lib/portal/admin";

export const dynamic = "force-dynamic";

/**
 * GET /api/admin/members/[id] - A member's plans, requests and messages
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
