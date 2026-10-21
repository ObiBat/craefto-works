import { NextRequest, NextResponse } from "next/server";
import { UUID, VIEW_COOKIE } from "@/lib/portal/preview";

export const dynamic = "force-dynamic";

/** Stop viewing as a client: back to their page in admin. */
export async function GET(request: NextRequest) {
  const id = request.cookies.get(VIEW_COOKIE)?.value;
  const target = id && UUID.test(id) ? `/admin/members/${id}` : "/admin/members";
  const response = NextResponse.redirect(new URL(target, request.nextUrl.origin));
  response.cookies.set(VIEW_COOKIE, "", { path: "/portal", maxAge: 0 });
  return response;
}
