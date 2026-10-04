import { NextResponse, type NextRequest } from "next/server";
import { optOut } from "@/lib/outreach/optout";

export const dynamic = "force-dynamic";

/**
 * The unsubscribe link in every outreach email's List-Unsubscribe header.
 * Mail apps POST to it for one-click unsubscribe (RFC 8058); the opt-out page
 * POSTs its button here too. A plain visit (GET) only opens that page, so
 * link scanners that follow links can't opt anyone out.
 */
export function GET(request: NextRequest) {
  const token = request.nextUrl.searchParams.get("t") ?? "";
  return NextResponse.redirect(new URL(`/optout?t=${encodeURIComponent(token)}`, request.nextUrl.origin), 303);
}

export async function POST(request: NextRequest) {
  const form = await request.formData().catch(() => null);
  const token = request.nextUrl.searchParams.get("t") ?? (form?.get("t") as string | null) ?? "";
  const oneClick = form?.get("List-Unsubscribe") === "One-Click";
  const result = await optOut(token, oneClick ? "one-click" : "link").catch((error) => {
    console.error("Opt-out failed:", error);
    return null;
  });
  if (oneClick) return result?.ok ? new NextResponse(null, { status: 200 }) : NextResponse.json({ error: "That link isn't valid" }, { status: result ? 400 : 500 });
  const outcome = !result ? "error" : !result.ok ? "invalid" : result.test ? "test" : "done";
  return NextResponse.redirect(new URL(`/optout?done=${outcome}`, request.nextUrl.origin), 303);
}
