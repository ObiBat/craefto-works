import { NextRequest, NextResponse } from "next/server";
import { InvoiceInputError, deleteDraft, emailInvoice, issueInvoice, markPaid, markUnpaid, previewInvoice, updateDraft, voidInvoice } from "@/lib/portal/invoices";
import { CRAEFTO_INBOX } from "@/lib/portal/notify";
import { siteOrigin } from "@/lib/portal/origin";

export const dynamic = "force-dynamic";

type Params = { params: Promise<{ id: string; invoiceId: string }> };

/**
 * PATCH /api/admin/members/[id]/invoices/[invoiceId] - Change an invoice
 * Body, one of:
 *   { action: "preview", message? }                email Craefto the email a draft will go out with, before issuing it
 *   { action: "issue", email: boolean, message? }  number it; it shows in their portal, and is emailed with its PDF if asked
 *   { action: "send", message? }                   email an issued invoice (again)
 *   { action: "paid", paid_on, via: "bank_transfer" | "other", reference?, receipt: boolean }
 *   { action: "unpaid" }                           undo a payment marked by mistake
 *   { action: "void" }                             cancel an issued invoice
 *   otherwise a draft's fields (lib/portal/invoice-rules.ts, draftInput)
 */
export async function PATCH(request: NextRequest, { params }: Params) {
  const { id, invoiceId } = await params;
  const body = await request.json().catch(() => null);
  if (!body || typeof body !== "object") return NextResponse.json({ error: "That couldn't be read." }, { status: 400 });
  const message = typeof body.message === "string" ? body.message : undefined;
  try {
    switch (body.action) {
      case "preview":
        return NextResponse.json({ emailed: await previewInvoice(id, invoiceId, { message, origin: await siteOrigin() }), to: CRAEFTO_INBOX });
      case "issue":
        return NextResponse.json(await issueInvoice(id, invoiceId, { email: body.email === true, message, origin: await siteOrigin() }));
      case "send":
        return NextResponse.json(await emailInvoice(id, invoiceId, { message, origin: await siteOrigin() }));
      case "paid":
        return NextResponse.json(
          await markPaid(id, invoiceId, {
            paidOn: typeof body.paid_on === "string" ? body.paid_on : "",
            via: body.via === "other" ? "other" : "bank_transfer",
            reference: typeof body.reference === "string" ? body.reference : "",
            receipt: body.receipt === true,
            origin: await siteOrigin(),
          })
        );
      case "unpaid":
        return NextResponse.json({ invoice: await markUnpaid(id, invoiceId) });
      case "void":
        return NextResponse.json({ invoice: await voidInvoice(id, invoiceId) });
      default:
        return NextResponse.json({ invoice: await updateDraft(id, invoiceId, body) });
    }
  } catch (error) {
    if (error instanceof InvoiceInputError) return NextResponse.json({ error: error.message }, { status: 400 });
    console.error("Changing an invoice failed:", error);
    return NextResponse.json({ error: "That didn't save. Try again." }, { status: 500 });
  }
}

/**
 * DELETE /api/admin/members/[id]/invoices/[invoiceId] - Delete a draft (an issued invoice is voided instead)
 */
export async function DELETE(_request: NextRequest, { params }: Params) {
  const { id, invoiceId } = await params;
  try {
    await deleteDraft(id, invoiceId);
    return NextResponse.json({ deleted: true });
  } catch (error) {
    if (error instanceof InvoiceInputError) return NextResponse.json({ error: error.message }, { status: 400 });
    console.error("Deleting a draft invoice failed:", error);
    return NextResponse.json({ error: "Failed to delete" }, { status: 500 });
  }
}
