import { NextResponse, type NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { isAdminRequest } from "@/lib/admin-session";

/**
 * Server-side guard for the admin API, and for the analytics reads the admin
 * screens use. Without it these routes (which use the service-role database
 * client) would answer anyone who knows the URL. Requests pass with a signed
 * admin session cookie or the admin API token (see lib/admin-session.ts).
 *
 * It also keeps client portal sessions fresh (see refreshPortalSession).
 */
export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (pathname === "/portal" || pathname.startsWith("/portal/")) return refreshPortalSession(request);

  // Signing in and out.
  if (pathname === "/api/admin/auth") return NextResponse.next();
  // Public: the journal records reading events here (reading them back is admin-only).
  if (pathname === "/api/analytics/article" && request.method === "POST") return NextResponse.next();

  if (await isAdminRequest(request)) return NextResponse.next();
  return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
}

/**
 * Client portal pages read the client's Supabase session from cookies, but
 * Server Components can't write cookies. Checking the session here first
 * refreshes an expiring one and hands the new cookies to both the page and the
 * browser (see lib/portal/session.ts). Pages still check who is signed in.
 */
async function refreshPortalSession(request: NextRequest) {
  let response = NextResponse.next({ request });
  const supabase = createServerClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, {
    cookies: {
      getAll: () => request.cookies.getAll(),
      setAll: (cookies) => {
        cookies.forEach(({ name, value }) => request.cookies.set(name, value));
        response = NextResponse.next({ request });
        cookies.forEach(({ name, value, options }) => response.cookies.set(name, value, options));
      },
    },
    cookieOptions: { httpOnly: true, secure: process.env.NODE_ENV === "production", sameSite: "lax", path: "/" },
  });
  await supabase.auth.getUser();
  return response;
}

export const config = {
  matcher: [
    "/api/admin/:path*",
    "/api/analytics/ab-test",
    "/api/analytics/feedback",
    "/api/analytics/article",
    "/portal",
    "/portal/:path*",
  ],
};
