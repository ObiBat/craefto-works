import { NextRequest, NextResponse } from "next/server";
import {
  ADMIN_COOKIE,
  ADMIN_SESSION_SECONDS,
  createAdminSession,
  safeEqual,
  verifyAdminSession,
} from "@/lib/admin-session";

const cookie = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "strict" as const,
  path: "/",
};

/** Sign in: checks the password and sets the signed, httpOnly session cookie. */
export async function POST(request: NextRequest) {
  const adminPassword = process.env.ADMIN_PASSWORD;
  if (!adminPassword) {
    console.error("ADMIN_PASSWORD not configured");
    return NextResponse.json({ error: "Server configuration error" }, { status: 500 });
  }

  let password: unknown;
  try {
    ({ password } = await request.json());
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  if (typeof password !== "string" || !(await safeEqual(password, adminPassword))) {
    // Slow down guessing.
    await new Promise((resolve) => setTimeout(resolve, 800));
    return NextResponse.json({ error: "Invalid password" }, { status: 401 });
  }

  const token = await createAdminSession();
  if (!token) return NextResponse.json({ error: "Server configuration error" }, { status: 500 });
  const response = NextResponse.json({ success: true });
  response.cookies.set(ADMIN_COOKIE, token, { ...cookie, maxAge: ADMIN_SESSION_SECONDS });
  return response;
}

/** Whether this browser has a valid admin session. */
export async function GET(request: NextRequest) {
  const authenticated = await verifyAdminSession(request.cookies.get(ADMIN_COOKIE)?.value);
  return NextResponse.json({ authenticated }, { status: authenticated ? 200 : 401 });
}

/** Sign out. */
export async function DELETE() {
  const response = NextResponse.json({ success: true });
  response.cookies.set(ADMIN_COOKIE, "", { ...cookie, maxAge: 0 });
  return response;
}
