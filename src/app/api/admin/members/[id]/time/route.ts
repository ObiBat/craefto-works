import { NextRequest, NextResponse } from "next/server";
import { WorkflowError, deleteTime, logTime } from "@/lib/portal/workflow";

export const dynamic = "force-dynamic";

/**
 * POST /api/admin/members/[id]/time - Log time
 * Body: { minutes, note?, request_id?, worked_on? (yyyy-mm-dd, Sydney; today if absent) }. The client sees it in their portal.
 */
export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body = await request.json().catch(() => null);
  try {
    const entry = await logTime(id, {
      requestId: typeof body?.request_id === "string" && body.request_id ? body.request_id : null,
      minutes: Number(body?.minutes),
      note: typeof body?.note === "string" ? body.note : "",
      workedOn: typeof body?.worked_on === "string" ? body.worked_on : null,
    });
    return NextResponse.json(entry, { status: 201 });
  } catch (error) {
    if (error instanceof WorkflowError) return NextResponse.json({ error: error.message }, { status: 400 });
    console.error("Logging time failed:", error);
    return NextResponse.json({ error: "Failed to log time" }, { status: 500 });
  }
}

/**
 * DELETE /api/admin/members/[id]/time?entry=<id> - Remove a time entry logged by mistake
 */
export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const entry = request.nextUrl.searchParams.get("entry");
  if (!entry) return NextResponse.json({ error: "Which entry?" }, { status: 400 });
  try {
    await deleteTime(id, entry);
    return NextResponse.json({ deleted: true });
  } catch (error) {
    console.error("Deleting time failed:", error);
    return NextResponse.json({ error: "Failed to delete" }, { status: 500 });
  }
}
