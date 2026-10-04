import type { NextRequest } from "next/server";
import { z } from "zod";
import { handle, hashSchema, idSchema, ok, prioritySchema } from "@/lib/outreach/http";
import { OutreachError } from "@/lib/outreach/rules";
import { bulkUpdate } from "@/lib/outreach/store";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

const Body = z.object({
  items: z.array(z.object({ campaignId: idSchema, id: idSchema, hash: hashSchema.optional() })).min(1).max(500),
  action: z.enum(["approve", "priority", "not-a-fit", "reopen"]),
  priority: prioritySchema.optional(),
});

/** One action across many prospects. Approving skips any that don't pass the approval check. */
export const POST = (request: NextRequest) =>
  handle(request, async (actor) => {
    const { items, action, priority } = Body.parse(await request.json());
    if (action === "priority" && !priority) throw new OutreachError("Choose a priority", 400);
    return ok(await bulkUpdate(items, action, { actor, priority }));
  });
