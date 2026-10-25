import { NextResponse, type NextRequest } from "next/server";
import { invoicePdf } from "@/lib/portal/invoices";
import { UUID } from "@/lib/portal/preview";
import { currentMember } from "@/lib/portal/session";
import type { ClientInvoice } from "@/lib/portal/types";

/** An invoice's PDF, for the signed-in client it belongs to (a draft only in view as client). ?download=1 saves it. */
export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const member = await currentMember();
  if (!member) return NextResponse.redirect(new URL("/portal/login", request.nextUrl.origin));
  const { id } = await params;
  const query = member.db.from("client_invoices").select("*").eq("id", id).eq("account_id", member.account.id);
  const { data } = UUID.test(id) ? await (member.preview ? query : query.neq("status", "draft")).maybeSingle() : { data: null };
  if (!data) return NextResponse.json({ error: "Not found" }, { status: 404 });
  try {
    const { pdf, filename } = await invoicePdf(data as ClientInvoice);
    const disposition = request.nextUrl.searchParams.get("download") ? "attachment" : "inline";
    return new Response(new Uint8Array(pdf), {
      headers: { "Content-Type": "application/pdf", "Content-Disposition": `${disposition}; filename="${filename}"`, "Cache-Control": "private, no-store" },
    });
  } catch (error) {
    console.error("Making an invoice PDF failed:", error);
    return NextResponse.json({ error: "The PDF couldn't be made just now. Please try again." }, { status: 500 });
  }
}
