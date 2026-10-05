import type { NextRequest } from "next/server";
import { handle, ok, replyIdOf } from "@/lib/outreach/http";
import { getConversation, redraft } from "@/lib/outreach/conversation";

export const dynamic = "force-dynamic";
export const maxDuration = 60;
type Context = { params: Promise<{ replyId: string }> };

/** A fresh suggested answer from the AI. */
export const POST = (request: NextRequest, { params }: Context) =>
  handle(request, async () => {
    const id = await replyIdOf(params);
    await redraft(id);
    return ok(await getConversation(id));
  });
