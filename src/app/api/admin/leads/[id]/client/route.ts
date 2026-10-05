import type { NextRequest } from "next/server";
import { z } from "zod";
import { logActivity } from "@/lib/leads";
import { ClientInputError, createClient } from "@/lib/portal/admin";
import { createServerClient } from "@/lib/supabase";
import { fail, handle, ok } from "@/lib/outreach/http";

export const dynamic = "force-dynamic";

/**
 * A lead becomes a client: a portal account with their monthly hours (nothing
 * is sent; they're invited from their client page), and the lead moves to Won.
 */
export const POST = (request: NextRequest, { params }: { params: Promise<{ id: string }> }) =>
  handle(request, async () => {
    const id = z.uuid().safeParse((await params).id);
    if (!id.success) return fail("Lead not found", 404);
    const input = (await request.json()) as Record<string, unknown>;
    const db = createServerClient();
    const { data: lead } = await db.from("leads").select("id, name, email, company").eq("id", id.data).maybeSingle();
    if (!lead) return fail("Lead not found", 404);

    let account;
    try {
      account = await createClient({
        email: lead.email,
        name: lead.name,
        company: lead.company,
        monthly_hours: input.monthly_hours,
        engagement: input.engagement,
      });
    } catch (error) {
      if (error instanceof ClientInputError) return fail(error.message, 400);
      throw error;
    }

    const { data: won } = await db.from("pipeline_stages").select("id").eq("slug", "won").maybeSingle();
    if (won) await db.from("leads").update({ stage_id: won.id, updated_at: new Date().toISOString() }).eq("id", lead.id);
    await logActivity(
      db,
      lead.id,
      {
        type: "stage_changed",
        title: "Became a client",
        description: `Added to the client portal with ${account.monthly_hours} hours a month`,
        metadata: { client_account_id: account.id },
      },
      "admin"
    );
    return ok({ id: account.id });
  });
