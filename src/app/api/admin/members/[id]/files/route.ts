import { NextRequest, NextResponse } from "next/server";
import { accountById } from "@/lib/portal/accounts";
import { FileRuleError, prepareUploads } from "@/lib/portal/files";

export const dynamic = "force-dynamic";

/**
 * POST /api/admin/members/[id]/files - Upload links for files to send a member
 * Body: { files: [{ name, size, type }] }. Send the returned ids with the reply.
 */
export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const account = await accountById(id);
  if (!account) return NextResponse.json({ error: "Member not found" }, { status: 404 });
  const input = await request.json().catch(() => null);
  try {
    return NextResponse.json({ slots: await prepareUploads(account, "craefto", input?.files) });
  } catch (error) {
    if (error instanceof FileRuleError) return NextResponse.json({ error: error.message }, { status: 400 });
    console.error("Preparing admin uploads failed:", error);
    return NextResponse.json({ error: "Uploads aren't available just now" }, { status: 500 });
  }
}
