import { NextRequest, NextResponse } from "next/server";
import { ClientInputError, addPastWork, addRequest } from "@/lib/portal/admin";
import { accountById } from "@/lib/portal/accounts";
import { siteOrigin } from "@/lib/portal/origin";

export const dynamic = "force-dynamic";

/**
 * POST /api/admin/members/[id]/requests - Add a request for the client, or record past work
 * Body, one of:
 *   { kind: "request", title, details?, estimate_low?, estimate_high?, estimate_note?, target_date? }
 *     a request in their portal, added by Craefto; with an estimate, it waits
 *     for their approval and they're emailed. Answers { request, emailed }.
 *   { title, delivered_on (yyyy-mm-dd), details?, hours?, outcome?, outcome_links? }
 *     work delivered before the portal: delivered, with its outcome, under
 *     their Past work. No email.
 */
export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!(await accountById(id))) return NextResponse.json({ error: "Member not found" }, { status: 404 });
  const body = await request.json().catch(() => null);
  if (!body || typeof body !== "object") return NextResponse.json({ error: "That couldn't be read." }, { status: 400 });
  try {
    if (body.kind === "request") return NextResponse.json(await addRequest(id, body, await siteOrigin()), { status: 201 });
    return NextResponse.json(await addPastWork(id, body), { status: 201 });
  } catch (error) {
    if (error instanceof ClientInputError) return NextResponse.json({ error: error.message }, { status: 400 });
    console.error(body.kind === "request" ? "Adding a request failed:" : "Adding past work failed:", error);
    return NextResponse.json({ error: "Failed to save" }, { status: 500 });
  }
}
