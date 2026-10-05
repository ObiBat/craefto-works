import { checkBotId } from "botid/server";
import type { NextRequest } from "next/server";
import { ASSISTANT_MODEL, chatHistory, handleAssistant } from "@/lib/assistant/agent";
import { createServerClient } from "@/lib/supabase";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

/** Vercel BotID's verdict (the client side is src/instrumentation-client.ts). Off Vercel there's nothing to ask. */
async function isBot() {
  if (!process.env.VERCEL) return false;
  try {
    return (await checkBotId()).isBot;
  } catch (error) {
    // BotID unreachable: the rate limits still apply.
    console.error("Ask Craefto: BotID check failed:", error);
    return false;
  }
}

/** One turn of Ask Craefto, streamed (lib/assistant/agent.ts). */
export function POST(request: NextRequest) {
  return handleAssistant(request, { db: createServerClient(), model: ASSISTANT_MODEL, now: () => new Date(), isBot });
}

/** A chat's transcript so far, for a page that reloads mid-conversation. The id is the browser's own. */
export async function GET(request: NextRequest) {
  const messages = await chatHistory(createServerClient(), request.nextUrl.searchParams.get("id") ?? "").catch((error) => {
    console.error("Ask Craefto: couldn't load a transcript:", error);
    return null;
  });
  return messages
    ? Response.json({ messages }, { headers: { "Cache-Control": "no-store" } })
    : Response.json({ error: "No such chat" }, { status: 404, headers: { "Cache-Control": "no-store" } });
}
