import { NextResponse, type NextRequest } from "next/server";
import { redirect } from "next/navigation";
import { downloadLink } from "@/lib/portal/files";
import { currentMember } from "@/lib/portal/session";

/**
 * Download a shared file: only the client it belongs to (the lookup goes
 * through RLS), by a link that works for a minute and saves under the file's
 * own name.
 */
export async function GET(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const member = await currentMember();
  if (!member) redirect("/portal/login");
  if (!/^[0-9a-f-]{36}$/i.test(id)) return new NextResponse("Not found", { status: 404 });
  const { data: file } = await member.db.from("client_files").select("path, name").eq("id", id).maybeSingle();
  if (!file) return new NextResponse("Not found", { status: 404 });
  const url = await downloadLink(file);
  if (!url) return new NextResponse("This file isn't available right now.", { status: 503 });
  return NextResponse.redirect(url, { headers: { "cache-control": "no-store" } });
}
