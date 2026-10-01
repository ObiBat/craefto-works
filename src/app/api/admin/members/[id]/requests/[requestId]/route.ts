import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase";
import { accountById } from "@/lib/portal/accounts";
import { sendRequestUpdate } from "@/lib/portal/notify";
import { siteOrigin } from "@/lib/portal/origin";
import { isRequestStatus, type ClientRequest } from "@/lib/portal/types";

export const dynamic = "force-dynamic";

/**
 * PATCH /api/admin/members/[id]/requests/[requestId] - Move a request on
 * Body: { status }. The client is emailed unless it moves back to "received".
 */
export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string; requestId: string }> }) {
  const { id, requestId } = await params;
  const body = await request.json().catch(() => null);
  if (!isRequestStatus(body?.status)) return NextResponse.json({ error: "Unknown status" }, { status: 400 });

  const db = createServerClient();
  const { data: current } = await db.from("client_requests").select("*").eq("id", requestId).eq("account_id", id).maybeSingle();
  if (!current) return NextResponse.json({ error: "Request not found" }, { status: 404 });
  if (current.status === body.status) return NextResponse.json(current);

  const { data: updated, error } = await db
    .from("client_requests")
    .update({ status: body.status, updated_at: new Date().toISOString() })
    .eq("id", requestId)
    .select("*")
    .single();
  if (error || !updated) {
    console.error("Updating a request failed:", error);
    return NextResponse.json({ error: "Failed to update request" }, { status: 500 });
  }

  const account = await accountById(id);
  if (account && updated.status !== "received") await sendRequestUpdate(account, updated as ClientRequest, await siteOrigin());
  return NextResponse.json(updated);
}
