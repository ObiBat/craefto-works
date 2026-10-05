import type { NextRequest } from "next/server";
import { z } from "zod";
import { handle, ok, replyIdOf } from "@/lib/outreach/http";
import { getConversation, relabel, saveSuggestion, setHandled } from "@/lib/outreach/conversation";
import { REPLY_LABELS, type ReplyLabel } from "@/lib/outreach/types";

export const dynamic = "force-dynamic";
type Context = { params: Promise<{ replyId: string }> };

/** One reply with the whole conversation around it. */
export const GET = (request: NextRequest, { params }: Context) => handle(request, async () => ok(await getConversation(await replyIdOf(params))));

const Patch = z.object({
  label: z.enum(REPLY_LABELS as [ReplyLabel, ...ReplyLabel[]]).optional(),
  returnOn: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Use YYYY-MM-DD").nullable().optional(),
  handled: z.boolean().optional(),
  suggestedReply: z.string().max(8000).optional(),
});

/** Corrects the label (and its date), marks it handled or not, or keeps an edited answer. */
export const PATCH = (request: NextRequest, { params }: Context) =>
  handle(request, async (actor) => {
    const id = await replyIdOf(params);
    const patch = Patch.parse(await request.json());
    if (patch.label !== undefined || patch.returnOn !== undefined) await relabel(id, patch.label, patch.returnOn, actor);
    if (patch.suggestedReply !== undefined) await saveSuggestion(id, patch.suggestedReply);
    if (patch.handled !== undefined) await setHandled(id, patch.handled, actor);
    return ok(await getConversation(id));
  });
