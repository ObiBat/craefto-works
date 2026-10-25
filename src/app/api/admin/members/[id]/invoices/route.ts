import { NextRequest, NextResponse } from "next/server";
import { InvoiceInputError, createDraft } from "@/lib/portal/invoices";

export const dynamic = "force-dynamic";

/**
 * POST /api/admin/members/[id]/invoices - A new draft invoice
 * Body: { kind: "retainer" } for the month billed in advance at their monthly fee, or { kind: "blank" }.
 * Nothing reaches the client until it's issued.
 */
export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body = await request.json().catch(() => null);
  try {
    const invoice = await createDraft(id, body?.kind === "retainer" ? "retainer" : "blank");
    return NextResponse.json(invoice, { status: 201 });
  } catch (error) {
    if (error instanceof InvoiceInputError) return NextResponse.json({ error: error.message }, { status: 400 });
    console.error("Drafting an invoice failed:", error);
    return NextResponse.json({ error: "Failed to draft the invoice" }, { status: 500 });
  }
}
