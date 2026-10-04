import type { NextRequest } from "next/server";
import { z } from "zod";
import { fail, handle, ids, ok, prioritySchema } from "@/lib/outreach/http";
import { applyEdit } from "@/lib/outreach/rules";
import { checkProspect, getProspect, updateProspect } from "@/lib/outreach/store";
import { listMessages } from "@/lib/outreach/sender";

export const dynamic = "force-dynamic";
type Context = { params: Promise<{ campaignId: string; prospectId: string }> };

/** One prospect, with what stands between its draft and approval. */
export const GET = (request: NextRequest, { params }: Context) =>
  handle(request, async () => {
    const { campaignId, prospectId } = await ids(params);
    const prospect = await getProspect(campaignId, prospectId);
    if (!prospect) return fail("No such prospect", 404);
    const [check, messages] = await Promise.all([checkProspect(prospect), listMessages({ campaignId, prospectId })]);
    return ok({ prospect, check, messages });
  });

const Patch = z.object({
  email: z.object({ subject: z.string().trim().max(200), body: z.string().trim().max(6000) }).optional(),
  notes: z.string().max(5000).optional(),
  priority: prioritySchema.optional(),
  followUpBody: z.string().trim().max(3000).optional(),
});

/** Edits. Changing an approved email sends it back for approval. */
export const PUT = (request: NextRequest, { params }: Context) =>
  handle(request, async (actor) => {
    const { campaignId, prospectId } = await ids(params);
    const patch = Patch.parse(await request.json());
    const prospect = await updateProspect(campaignId, prospectId, actor, (p) => applyEdit(p, patch));
    return ok({ prospect, check: await checkProspect(prospect) });
  });
