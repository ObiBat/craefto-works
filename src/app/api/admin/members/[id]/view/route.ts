import { NextRequest, NextResponse } from "next/server";
import { accountById } from "@/lib/portal/accounts";
import { UUID, VIEW_COOKIE, VIEW_SECONDS } from "@/lib/portal/preview";

export const dynamic = "force-dynamic";

/**
 * GET /api/admin/members/[id]/view - Open their portal as they see it, read only
 * (lib/portal/preview.ts). Admin only, like all of /api/admin (src/proxy.ts).
 * ?invoice=<id> opens that invoice in their Billing.
 */
export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!UUID.test(id) || !(await accountById(id))) return NextResponse.json({ error: "Member not found" }, { status: 404 });
  const invoice = request.nextUrl.searchParams.get("invoice");
  const response = NextResponse.redirect(new URL(invoice && UUID.test(invoice) ? `/portal/billing/${invoice}` : "/portal", request.nextUrl.origin));
  response.cookies.set(VIEW_COOKIE, id, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/portal",
    maxAge: VIEW_SECONDS,
  });
  return response;
}
