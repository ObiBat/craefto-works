import { redirect } from "next/navigation";
import type { NextRequest } from "next/server";
import type { EmailOtpType } from "@supabase/supabase-js";
import { portalDb } from "@/lib/portal/session";

const TYPES: EmailOtpType[] = ["magiclink", "email", "signup"];

/** A sign-in link from the portal's email: exchange its token for a session. */
export async function GET(request: NextRequest) {
  const tokenHash = request.nextUrl.searchParams.get("token_hash");
  const type = request.nextUrl.searchParams.get("type") as EmailOtpType | null;
  if (tokenHash && type && TYPES.includes(type)) {
    const { error } = await (await portalDb()).auth.verifyOtp({ token_hash: tokenHash, type });
    if (!error) redirect("/portal");
  }
  redirect("/portal/login?expired=1");
}
