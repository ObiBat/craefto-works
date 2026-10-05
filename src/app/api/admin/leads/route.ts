import type { NextRequest } from "next/server";
import { createServerClient } from "@/lib/supabase";
import { handle, ok } from "@/lib/outreach/http";

export const dynamic = "force-dynamic";

/** Every lead, newest first, with its stage and where it came from. */
export const GET = (request: NextRequest) =>
  handle(request, async () => {
    const { data, error } = await createServerClient()
      .from("leads")
      .select("id, name, email, company, source, service_interest, budget_range, timeline, score, created_at, stage:pipeline_stages(id, name, slug, color)")
      .order("created_at", { ascending: false });
    if (error) throw error;
    return ok({ leads: data ?? [] });
  });
