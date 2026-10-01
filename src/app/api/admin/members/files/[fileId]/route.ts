import { NextRequest, NextResponse } from "next/server";
import { downloadLink, fileById } from "@/lib/portal/files";

export const dynamic = "force-dynamic";

/** GET /api/admin/members/files/[fileId] - Download a member's shared file (a link for a minute) */
export async function GET(_request: NextRequest, { params }: { params: Promise<{ fileId: string }> }) {
  const { fileId } = await params;
  const file = await fileById(fileId);
  if (!file) return NextResponse.json({ error: "File not found" }, { status: 404 });
  const url = await downloadLink(file);
  if (!url) return NextResponse.json({ error: "File isn't available right now" }, { status: 503 });
  return NextResponse.redirect(url, { headers: { "cache-control": "no-store" } });
}
