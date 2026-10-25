import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase";
import { invoicePdf } from "@/lib/portal/invoices";
import type { ClientInvoice } from "@/lib/portal/types";

export const dynamic = "force-dynamic";

/**
 * GET /api/admin/members/[id]/invoices/[invoiceId]/pdf - The invoice as its client gets it (a draft marked as one)
 * ?download=1 saves it rather than opening it.
 */
export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string; invoiceId: string }> }) {
  const { id, invoiceId } = await params;
  const { data } = await createServerClient().from("client_invoices").select("*").eq("id", invoiceId).eq("account_id", id).maybeSingle();
  if (!data) return NextResponse.json({ error: "Invoice not found" }, { status: 404 });
  try {
    const { pdf, filename } = await invoicePdf(data as ClientInvoice);
    const disposition = request.nextUrl.searchParams.get("download") ? "attachment" : "inline";
    return new Response(new Uint8Array(pdf), {
      headers: { "Content-Type": "application/pdf", "Content-Disposition": `${disposition}; filename="${filename}"`, "Cache-Control": "private, no-store" },
    });
  } catch (error) {
    console.error("Making an invoice PDF failed:", error);
    return NextResponse.json({ error: "The PDF couldn't be made" }, { status: 500 });
  }
}
