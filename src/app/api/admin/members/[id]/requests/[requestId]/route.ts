import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase";
import { accountById } from "@/lib/portal/accounts";
import { longHours } from "@/lib/portal/hours";
import { sendEstimateReady, sendRequestUpdate } from "@/lib/portal/notify";
import { siteOrigin } from "@/lib/portal/origin";
import { WorkflowError, confirmEstimate, moveInQueue, recordEvent, setStatus } from "@/lib/portal/workflow";
import { estimateLabel, isRequestStatus, type ClientRequest } from "@/lib/portal/types";

export const dynamic = "force-dynamic";

/**
 * PATCH /api/admin/members/[id]/requests/[requestId] - Move a request on
 * Body, one of:
 *   { status }: the client is emailed unless it moves back to "received". An
 *     estimate the client hasn't approved counts as approved by Craefto when
 *     it's queued or started from here.
 *   { estimate: { low, high, note?, target_date? } }: confirm it, and ask the client to approve.
 *   { move: "up" | "down" }: its place in the queue.
 */
export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string; requestId: string }> }) {
  const { id, requestId } = await params;
  const body = await request.json().catch(() => null);
  const db = createServerClient();
  const { data: current } = await db.from("client_requests").select("*").eq("id", requestId).eq("account_id", id).maybeSingle<ClientRequest>();
  if (!current) return NextResponse.json({ error: "Request not found" }, { status: 404 });
  const origin = await siteOrigin();

  try {
    if (body?.move === "up" || body?.move === "down") {
      await moveInQueue(current, body.move === "up" ? -1 : 1);
      return NextResponse.json({ moved: true });
    }

    if (body?.estimate) {
      const low = Number(body.estimate.low);
      const high = Number(body.estimate.high);
      if (!(low > 0 && high >= low && high <= 400)) return NextResponse.json({ error: "Give a range in hours, low to high." }, { status: 400 });
      const target = typeof body.estimate.target_date === "string" && /^\d{4}-\d{2}-\d{2}$/.test(body.estimate.target_date) ? body.estimate.target_date : null;
      const saved = await confirmEstimate(current, { low, high, note: typeof body.estimate.note === "string" ? body.estimate.note.trim() : null, targetDate: target });
      const account = await accountById(id);
      if (account && saved.status === "estimated") await sendEstimateReady(account, saved, origin);
      return NextResponse.json(saved);
    }

    if (!isRequestStatus(body?.status)) return NextResponse.json({ error: "Unknown status" }, { status: 400 });
    if (body.status === "estimated") return NextResponse.json({ error: "Confirm an estimate to send it for approval." }, { status: 400 });
    if (current.status === body.status) return NextResponse.json(current);

    // Queued or started here without the client's approval: Craefto approved it for them (say, by email).
    let request = current;
    if ((body.status === "queued" || body.status === "in_progress") && current.estimate_state !== "approved" && current.estimate_low != null) {
      const { data } = await db
        .from("client_requests")
        .update({ estimate_state: "approved", approved_at: new Date().toISOString() })
        .eq("id", current.id)
        .select("*")
        .single<ClientRequest>();
      if (data) {
        request = data;
        await recordEvent(request, "approved", { low: Number(request.estimate_low), high: Number(request.estimate_high), by: "craefto" });
      }
    }
    const updated = await setStatus(request, body.status);

    const account = await accountById(id);
    if (account && updated.status !== "received") {
      let detail: string | undefined;
      if (updated.status === "delivered") {
        const { data: entries } = await db.from("client_time_entries").select("minutes").eq("request_id", updated.id);
        const hours = (entries ?? []).reduce((total, entry) => total + entry.minutes, 0) / 60;
        const estimate = estimateLabel(updated);
        if (hours > 0) detail = `We logged ${longHours(hours)} on it${estimate ? `, against an estimate of ${estimate}` : ""}.`;
      }
      await sendRequestUpdate(account, updated, origin, detail);
    }
    return NextResponse.json(updated);
  } catch (error) {
    if (error instanceof WorkflowError) return NextResponse.json({ error: error.message }, { status: 400 });
    console.error("Updating a request failed:", error);
    return NextResponse.json({ error: "Failed to update request" }, { status: 500 });
  }
}
