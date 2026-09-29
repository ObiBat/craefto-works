import { NextResponse, type NextRequest } from "next/server";
import { isAdminRequest } from "@/lib/admin-session";

/**
 * Server-side guard for the admin API, and for the analytics reads the admin
 * screens use. Without it these routes (which use the service-role database
 * client) would answer anyone who knows the URL. Requests pass with a signed
 * admin session cookie or the admin API token (see lib/admin-session.ts).
 */
export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Signing in and out.
  if (pathname === "/api/admin/auth") return NextResponse.next();
  // Public: the journal records reading events here (reading them back is admin-only).
  if (pathname === "/api/analytics/article" && request.method === "POST") return NextResponse.next();

  if (await isAdminRequest(request)) return NextResponse.next();
  return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
}

export const config = {
  matcher: ["/api/admin/:path*", "/api/analytics/ab-test", "/api/analytics/feedback", "/api/analytics/article"],
};
