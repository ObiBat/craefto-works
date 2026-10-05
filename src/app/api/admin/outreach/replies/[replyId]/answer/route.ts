import type { NextRequest } from "next/server";
import { z } from "zod";
import { handle, ok, replyIdOf } from "@/lib/outreach/http";
import { getConversation, sendAnswer } from "@/lib/outreach/conversation";

export const dynamic = "force-dynamic";
export const maxDuration = 60;
type Context = { params: Promise<{ replyId: string }> };

const Body = z.object({ body: z.string().trim().min(1, "Write the answer first").max(8000) });

/** Sends Obi's answer from the outreach mailbox, in the same thread. */
export const POST = (request: NextRequest, { params }: Context) =>
  handle(request, async (actor) => {
    const id = await replyIdOf(params);
    const { body } = Body.parse(await request.json());
    await sendAnswer(id, body, actor);
    return ok(await getConversation(id));
  });
