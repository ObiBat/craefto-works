import type { NextRequest } from "next/server";
import { z } from "zod";
import { createServerClient } from "@/lib/supabase";
import { handle, ok } from "@/lib/outreach/http";

export const dynamic = "force-dynamic";

/** The do-not-email list, newest first. */
export const GET = (request: NextRequest) =>
  handle(request, async () => {
    const { data, error } = await createServerClient().from("outreach_suppressions").select("value, reason, note, created_at").order("created_at", { ascending: false }).limit(500);
    if (error) throw error;
    return ok({ suppressions: data });
  });

const Body = z.object({
  /** An address, or "@domain" for everyone there. */
  value: z
    .string()
    .trim()
    .toLowerCase()
    .regex(/^([^@\s]+)?@[^@\s]+\.[^@\s]+$/, "Use an email address, or @domain for a whole business"),
  note: z.string().trim().max(500).optional(),
});

/** Adds an address or domain by hand (an opt-out by phone or reply, say). Entries are never removed automatically. */
export const POST = (request: NextRequest) =>
  handle(request, async (actor) => {
    const { value, note } = Body.parse(await request.json());
    const { error } = await createServerClient()
      .from("outreach_suppressions")
      .upsert({ value, reason: "manual", note: note || `Added by hand (${actor}) on ${new Date().toISOString().slice(0, 10)}` }, { onConflict: "value", ignoreDuplicates: true });
    if (error) throw error;
    return ok({ added: value });
  });
