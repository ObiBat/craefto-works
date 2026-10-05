import "server-only";
import { createHash } from "node:crypto";
import type { UIMessage } from "ai";
import { createServerClient } from "@/lib/supabase";

// Ask Craefto's conversations in Supabase (migration 027): the transcript as
// the visitor saw it, kept by the server, and what limits need to count.

type Db = ReturnType<typeof createServerClient>;

export interface ChatRow {
  id: string;
  messages: UIMessage[];
  turns: number;
  page: string | null;
  ip_hash: string | null;
  user_agent: string | null;
  status: "open" | "enquiry" | "handoff";
  lead_id: string | null;
  gaps: string[];
  blocked: string[];
  newsletter: boolean;
  created_at: string;
  updated_at: string;
}

/** A one-way fingerprint of the visitor's address, different every day: enough to count, not to track. */
export function ipHash(ip: string | null, now = new Date()) {
  const day = now.toISOString().slice(0, 10);
  const salt = process.env.CRON_SECRET ?? "craefto";
  return createHash("sha256").update(`${ip ?? "unknown"}|${day}|${salt}`).digest("hex").slice(0, 32);
}

export async function loadChat(db: Db, id: string): Promise<ChatRow | null> {
  const { data, error } = await db.from("assistant_chats").select("*").eq("id", id).maybeSingle<ChatRow>();
  if (error) throw error;
  return data;
}

/** Saves the transcript after a turn (creating the chat on its first). */
export async function saveChat(db: Db, id: string, row: Partial<Omit<ChatRow, "id" | "created_at">>) {
  const { error } = await db.from("assistant_chats").upsert({ id, ...row, updated_at: new Date().toISOString() }, { onConflict: "id" });
  if (error) throw error;
}

/** Marks what a chat became (an enquiry or a request for a person) without touching its transcript. */
export async function markChat(db: Db, id: string, patch: Pick<Partial<ChatRow>, "status" | "lead_id" | "newsletter">) {
  const { error } = await db.from("assistant_chats").update({ ...patch, updated_at: new Date().toISOString() }).eq("id", id);
  if (error) throw error;
}

/** Records a question the assistant couldn't answer from the site, once. */
export async function addGap(db: Db, id: string, question: string) {
  const chat = await loadChat(db, id);
  if (!chat || chat.gaps.includes(question)) return;
  await db.from("assistant_chats").update({ gaps: [...chat.gaps, question].slice(-20) }).eq("id", id);
}

/** Visitor messages from one fingerprint in the last hour, and chats it started today. */
export async function usageFrom(db: Db, hash: string, now = new Date()) {
  const hourAgo = new Date(now.getTime() - 3600_000).toISOString();
  const dayAgo = new Date(now.getTime() - 86_400_000).toISOString();
  const [recent, today] = await Promise.all([
    db.from("assistant_chats").select("turns").eq("ip_hash", hash).gte("updated_at", hourAgo),
    db.from("assistant_chats").select("id", { count: "exact", head: true }).eq("ip_hash", hash).gte("created_at", dayAgo),
  ]);
  return {
    turnsLastHour: (recent.data ?? []).reduce((total, row) => total + (row.turns ?? 0), 0),
    chatsToday: today.count ?? 0,
  };
}

// ── Admin ─────────────────────────────────────────────────────────────────

export interface ChatSummary {
  id: string;
  page: string | null;
  turns: number;
  status: ChatRow["status"];
  leadId: string | null;
  gaps: string[];
  blocked: number;
  firstQuestion: string | null;
  createdAt: string;
  updatedAt: string;
}

const firstText = (messages: UIMessage[]) => {
  const first = messages.find((message) => message.role === "user");
  const part = first?.parts.find((p) => p.type === "text") as { text?: string } | undefined;
  return part?.text?.slice(0, 200) ?? null;
};

export async function listChats(limit = 100): Promise<ChatSummary[]> {
  const { data, error } = await createServerClient().from("assistant_chats").select("*").order("updated_at", { ascending: false }).limit(limit);
  if (error) throw error;
  return ((data ?? []) as ChatRow[]).map((row) => ({
    id: row.id,
    page: row.page,
    turns: row.turns,
    status: row.status,
    leadId: row.lead_id,
    gaps: row.gaps,
    blocked: row.blocked.length,
    firstQuestion: firstText(row.messages),
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }));
}

export async function getChat(id: string) {
  return loadChat(createServerClient(), id);
}

/** The chat that became this lead, if one did. */
export async function chatForLead(leadId: string) {
  const { data } = await createServerClient().from("assistant_chats").select("*").eq("lead_id", leadId).order("updated_at", { ascending: false }).limit(1).maybeSingle<ChatRow>();
  return data;
}
