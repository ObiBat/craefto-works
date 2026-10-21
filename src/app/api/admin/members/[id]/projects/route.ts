import { NextRequest, NextResponse } from "next/server";
import { accountById } from "@/lib/portal/accounts";
import { WorkError, connectProject, removeProject } from "@/lib/portal/work";

export const dynamic = "force-dynamic";

async function run(id: string, work: () => Promise<unknown>, status = 200) {
  if (!(await accountById(id))) return NextResponse.json({ error: "Member not found" }, { status: 404 });
  try {
    return NextResponse.json((await work()) ?? { ok: true }, { status });
  } catch (error) {
    if (error instanceof WorkError) return NextResponse.json({ error: error.message }, { status: 400 });
    console.error("Changing a client's projects failed:", error);
    return NextResponse.json({ error: "Failed to save" }, { status: 500 });
  }
}

/** POST /api/admin/members/[id]/projects - Connect a GitHub repository. Body: { repo: "owner/name" or its GitHub address }. */
export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body = await request.json().catch(() => null);
  return run(id, () => connectProject(id, typeof body?.repo === "string" ? body.repo : ""), 201);
}

/** DELETE /api/admin/members/[id]/projects?project=<id> - Disconnect one (its drafts stay). */
export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return run(id, () => removeProject(id, request.nextUrl.searchParams.get("project") ?? ""));
}
