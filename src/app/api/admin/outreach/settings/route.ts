import type { NextRequest } from "next/server";
import { z } from "zod";
import { handle, ok } from "@/lib/outreach/http";
import { sendingStatus, updateSettings } from "@/lib/outreach/sender";

export const dynamic = "force-dynamic";

/** The sender's mode and limits, with today's numbers. */
export const GET = (request: NextRequest) => handle(request, async () => ok(await sendingStatus()));

const time = z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/, "Use HH:MM");
const Patch = z
  .object({
    mode: z.enum(["off", "test", "live"]).optional(),
    dailyCap: z.number().int().min(1).max(25).optional(),
    testRecipients: z.array(z.email().max(254)).max(5).optional(),
    windowStart: time.optional(),
    windowEnd: time.optional(),
    followUps: z.boolean().optional(),
    resume: z.boolean().optional(),
  })
  .refine((patch) => !patch.windowStart || !patch.windowEnd || patch.windowStart < patch.windowEnd, "The window has to end after it starts");

/** Changes how the sender runs. Going live needs a test sent first. */
export const PUT = (request: NextRequest) =>
  handle(request, async (actor) => {
    const patch = Patch.parse(await request.json());
    await updateSettings({ ...patch, testRecipients: patch.testRecipients?.map((address) => address.toLowerCase()) }, actor);
    return ok(await sendingStatus());
  });
