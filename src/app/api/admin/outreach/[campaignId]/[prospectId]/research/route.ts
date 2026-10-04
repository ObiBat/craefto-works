import type { NextRequest } from "next/server";
import { z } from "zod";
import { handle, ids, ok } from "@/lib/outreach/http";
import { applyResearch } from "@/lib/outreach/rules";
import { updateProspect } from "@/lib/outreach/store";

export const dynamic = "force-dynamic";

const text = (max: number) => z.string().max(max);
const Body = z.object({
  research: z.object({
    checkedAt: text(40).optional(),
    metrics: z
      .object({ mobileSeconds: z.number().optional(), mobileMB: z.number().optional(), overflowPx: z.number().optional(), footerYear: z.number().nullable().optional() })
      .optional(),
    systems: z.array(z.object({ name: text(200), category: text(100), evidence: text(1000).optional() })).max(100).optional(),
    journey: z.array(text(200)).max(50).optional(),
    shots: z.object({ mobile: text(300).optional(), desktop: text(300).optional(), apply: text(300).optional() }).optional(),
  }),
  /** The history line, such as "Website rechecked: homepage loaded in 2.1s". */
  event: z.string().trim().min(1).max(500),
});

/** A website recheck from the command centre: the newer evidence and a history line. */
export const POST = (request: NextRequest, { params }: { params: Promise<{ campaignId: string; prospectId: string }> }) =>
  handle(request, async (actor) => {
    const { campaignId, prospectId } = await ids(params);
    const { research, event } = Body.parse(await request.json());
    return ok({ prospect: await updateProspect(campaignId, prospectId, actor, (p) => applyResearch(p, research, event)) });
  });
