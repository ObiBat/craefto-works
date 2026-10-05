import type { NextRequest } from "next/server";
import { z } from "zod";
import { createServerClient } from "@/lib/supabase";
import { fail, handle, ok } from "@/lib/outreach/http";

export const dynamic = "force-dynamic";

/**
 * One lead with everything joined up: its activity, the Ask Craefto chat it
 * came from, its outreach replies, and its client account once it has one.
 */
export const GET = (request: NextRequest, { params }: { params: Promise<{ id: string }> }) =>
  handle(request, async () => {
    const id = z.uuid().safeParse((await params).id);
    if (!id.success) return fail("Lead not found", 404);
    const db = createServerClient();
    const { data: lead, error } = await db.from("leads").select("*, stage:pipeline_stages(id, name, slug, color)").eq("id", id.data).maybeSingle();
    if (error) throw error;
    if (!lead) return fail("Lead not found", 404);
    const [activities, chat, replies, client] = await Promise.all([
      db.from("lead_activities").select("id, type, title, description, metadata, actor_type, created_at").eq("lead_id", id.data).order("created_at", { ascending: false }),
      db.from("assistant_chats").select("id, turns, updated_at").eq("lead_id", id.data).order("updated_at", { ascending: false }).limit(1).maybeSingle(),
      db.from("outreach_replies").select("id, subject, label, summary, received_at, created_at").eq("lead_id", id.data).order("created_at", { ascending: false }),
      db.from("client_accounts").select("id, name, company, user_id, monthly_hours").eq("email", String(lead.email).trim().toLowerCase()).maybeSingle(),
    ]);
    return ok({
      lead,
      activities: activities.data ?? [],
      chat: chat.data ?? null,
      replies: replies.data ?? [],
      client: client.data ?? null,
    });
  });
