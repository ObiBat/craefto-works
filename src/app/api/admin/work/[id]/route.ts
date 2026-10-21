import { NextRequest, NextResponse } from "next/server";
import { siteOrigin } from "@/lib/portal/origin";
import { WorkError, dismissDraft, editDraft, publishDraft, undoDraft, type PublishMode } from "@/lib/portal/work";

export const dynamic = "force-dynamic";

const MODES: PublishMode[] = ["past_work", "deliver", "time"];

/**
 * PATCH /api/admin/work/[id] - Check shipped work
 * Body, one of:
 *   { title?, outcome?, outcome_links?, minutes?, internal?, request_ref? }: edit it while it waits.
 *   { action: "publish", mode: "past_work" | "deliver" | "time", minutes }: publish it
 *     (delivering its request emails the client, as delivering in admin does).
 *   { action: "dismiss" } or { action: "undo" }.
 */
export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body = await request.json().catch(() => null);
  if (!body || typeof body !== "object") return NextResponse.json({ error: "That couldn't be read." }, { status: 400 });
  try {
    if (body.action === "publish") {
      if (!MODES.includes(body.mode)) return NextResponse.json({ error: "Choose how to publish it." }, { status: 400 });
      return NextResponse.json(await publishDraft(id, { mode: body.mode, minutes: Number(body.minutes ?? 0) }, await siteOrigin()));
    }
    if (body.action === "dismiss") return NextResponse.json({ draft: await dismissDraft(id) });
    if (body.action === "undo") return NextResponse.json({ draft: await undoDraft(id) });
    if (body.action !== undefined) return NextResponse.json({ error: "Unknown action" }, { status: 400 });
    return NextResponse.json({ draft: await editDraft(id, body) });
  } catch (error) {
    if (error instanceof WorkError) return NextResponse.json({ error: error.message }, { status: 400 });
    console.error("Updating shipped work failed:", error);
    return NextResponse.json({ error: "Failed to update" }, { status: 500 });
  }
}
