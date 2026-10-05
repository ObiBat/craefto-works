import type { NextRequest } from "next/server";
import { handle, ok, replyIdOf } from "@/lib/outreach/http";
import { getConversation, handOver } from "@/lib/outreach/conversation";

export const dynamic = "force-dynamic";
type Context = { params: Promise<{ replyId: string }> };

/** Files the reply as a lead (or adds it to their lead) and marks it handled. */
export const POST = (request: NextRequest, { params }: Context) =>
  handle(request, async (actor) => {
    const id = await replyIdOf(params);
    const handover = await handOver(id, actor);
    return ok({ ...(await getConversation(id)), handover });
  });
