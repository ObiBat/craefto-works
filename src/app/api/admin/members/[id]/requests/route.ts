import { NextRequest, NextResponse } from "next/server";
import { ClientInputError, addPastWork } from "@/lib/portal/admin";
import { accountById } from "@/lib/portal/accounts";

export const dynamic = "force-dynamic";

/**
 * POST /api/admin/members/[id]/requests - Record work delivered before the portal
 * Body: { title, delivered_on (yyyy-mm-dd), details?, hours?, outcome?, outcome_links? }.
 * It shows as delivered, with its outcome, under the client's Past work. No email.
 */
export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!(await accountById(id))) return NextResponse.json({ error: "Member not found" }, { status: 404 });
  const body = await request.json().catch(() => null);
  if (!body || typeof body !== "object") return NextResponse.json({ error: "That couldn't be read." }, { status: 400 });
  try {
    return NextResponse.json(await addPastWork(id, body), { status: 201 });
  } catch (error) {
    if (error instanceof ClientInputError) return NextResponse.json({ error: error.message }, { status: 400 });
    console.error("Adding past work failed:", error);
    return NextResponse.json({ error: "Failed to save" }, { status: 500 });
  }
}
