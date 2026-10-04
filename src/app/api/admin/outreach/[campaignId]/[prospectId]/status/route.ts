import type { NextRequest } from "next/server";
import { z } from "zod";
import { handle, hashSchema, ids, ok } from "@/lib/outreach/http";
import { applyAction } from "@/lib/outreach/rules";
import { checkProspect, updateProspect } from "@/lib/outreach/store";

export const dynamic = "force-dynamic";

const Body = z.object({
  action: z.enum(["approve", "draft", "sent", "followup-sent", "replied", "meeting", "won", "lost", "not-a-fit", "reopen"]),
  /** "sent": the day it went out. */
  sentOn: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Use YYYY-MM-DD").optional(),
  /** "approve": the fingerprint of the email as you saw it (emailHash). */
  hash: hashSchema.optional(),
});

/** Moves a prospect along: approve, back to draft, sent, replied, won, lost, not a fit, reopen. */
export const POST = (request: NextRequest, { params }: { params: Promise<{ campaignId: string; prospectId: string }> }) =>
  handle(request, async (actor) => {
    const { campaignId, prospectId } = await ids(params);
    const { action, sentOn, hash } = Body.parse(await request.json());
    const prospect = await updateProspect(campaignId, prospectId, actor, async (p, { check }) =>
      applyAction(p, action, { actor, now: new Date(), sentOn, hash, check: action === "approve" && p.status === "drafted" ? await check() : undefined }),
    );
    return ok({ prospect, check: await checkProspect(prospect) });
  });
