import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase";
import { accountById } from "@/lib/portal/accounts";
import { attachUploads, readyUploads } from "@/lib/portal/files";
import { sendReply } from "@/lib/portal/notify";
import { siteOrigin } from "@/lib/portal/origin";
import { isRequestStatus, type ClientMessage, type ClientRequest } from "@/lib/portal/types";

export const dynamic = "force-dynamic";

/**
 * POST /api/admin/members/[id]/messages - Reply as Craefto
 * Body: { body, request_id?, status?, files? }. Without request_id it goes to
 * the general conversation. A status moves the request on in the same step,
 * so the client gets one email rather than two. `files` are upload ids from
 * POST /api/admin/members/[id]/files; a reply can be files alone.
 */
export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const input = await request.json().catch(() => null);
  const text = typeof input?.body === "string" ? input.body.trim() : "";
  const requestId = typeof input?.request_id === "string" && input.request_id ? input.request_id : null;
  const fileIds: string[] = Array.isArray(input?.files) ? input.files.filter((id: unknown) => typeof id === "string") : [];
  if ((!text && fileIds.length === 0) || text.length > 10000) {
    return NextResponse.json({ error: "Write a message (up to 10,000 characters) or attach a file" }, { status: 400 });
  }
  if (input?.status !== undefined && !isRequestStatus(input.status)) return NextResponse.json({ error: "Unknown status" }, { status: 400 });

  const account = await accountById(id);
  if (!account) return NextResponse.json({ error: "Member not found" }, { status: 404 });

  const uploads = await readyUploads(account, fileIds, "craefto");
  if (!text && uploads.length === 0) return NextResponse.json({ error: "The files didn't finish uploading" }, { status: 400 });

  const db = createServerClient();
  let thread: ClientRequest | null = null;
  if (requestId) {
    const { data } = await db.from("client_requests").select("*").eq("id", requestId).eq("account_id", id).maybeSingle();
    if (!data) return NextResponse.json({ error: "Request not found" }, { status: 404 });
    thread = data as ClientRequest;
  }

  const { data: message, error } = await db
    .from("client_messages")
    .insert({ account_id: id, request_id: requestId, author: "craefto", body: text })
    .select("*")
    .single();
  if (error || !message) {
    console.error("Saving a reply failed:", error);
    return NextResponse.json({ error: "Failed to send" }, { status: 500 });
  }

  let statusChanged = false;
  if (thread) {
    statusChanged = Boolean(input?.status && input.status !== thread.status);
    const { data } = await db
      .from("client_requests")
      .update({ updated_at: new Date().toISOString(), ...(statusChanged ? { status: input.status } : {}) })
      .eq("id", thread.id)
      .select("*")
      .single();
    if (data) thread = data as ClientRequest;
  }

  const files = await attachUploads(uploads, { requestId, messageId: message.id });
  await sendReply(account, message as ClientMessage, thread, files, await siteOrigin(), statusChanged);
  return NextResponse.json({ message, request: thread, files });
}
