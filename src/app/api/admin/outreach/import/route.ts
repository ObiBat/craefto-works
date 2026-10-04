import type { NextRequest } from "next/server";
import { z } from "zod";
import { handle, idSchema, ok, prioritySchema } from "@/lib/outreach/http";
import { OutreachError } from "@/lib/outreach/rules";
import { importCampaign } from "@/lib/outreach/store";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

const text = (max: number) => z.string().max(max);
const at = z.iso.datetime({ offset: true });

const Prospect = z.object({
  id: idSchema,
  company: text(200).min(1),
  segment: text(200),
  state: text(40).optional(),
  location: text(200).optional(),
  website: text(500),
  businessType: text(300).optional(),
  size: z.object({ text: text(500), source: text(1000).optional() }).optional(),
  journey: z.array(text(200)).max(50).optional(),
  systems: z.array(z.object({ name: text(200), category: text(100), evidence: text(1000).optional() })).max(100).optional(),
  applicationMethod: text(2000).optional(),
  metrics: z
    .object({ mobileSeconds: z.number().optional(), mobileMB: z.number().optional(), overflowPx: z.number().optional(), footerYear: z.number().nullable().optional() })
    .optional(),
  findings: z.array(z.object({ text: text(3000), checkedAt: text(40), source: text(1000).optional() })).max(50),
  branding: text(3000).optional(),
  whyFit: text(3000).optional(),
  contact: z.object({ kind: z.enum(["email", "form", "none"]), value: text(500), source: text(1000).optional() }),
  priority: prioritySchema,
  status: z.enum(["researched", "drafted", "approved", "sent", "replied", "meeting", "won", "lost", "not-a-fit"]),
  email: z.object({ subject: text(200), body: text(6000), language: text(60).optional(), sentAt: text(40).optional() }).optional(),
  followUp: z.object({ dueAt: z.string().regex(/^\d{4}-\d{2}-\d{2}$/), body: text(3000), sentAt: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional() }).optional(),
  flags: z.array(text(1000)).max(20).optional(),
  shots: z.object({ mobile: text(300).optional(), desktop: text(300).optional(), apply: text(300).optional() }).optional(),
  notes: text(5000).optional(),
  checkedAt: text(40).optional(),
  timeline: z.array(z.object({ at, event: text(500) })).max(500),
});

const Campaign = z.object({
  id: idSchema.refine((id) => !["import", "bulk", "settings", "messages", "suppressions"].includes(id), "That name is taken by the API"),
  name: text(200).min(1),
  description: text(2000),
  createdAt: at,
  prospects: z.array(Prospect).min(1).max(1000),
});

/**
 * Adds a researched campaign (the command centre's campaign JSON): new
 * prospects and their history, never touching ones already here.
 */
export const POST = (request: NextRequest) =>
  handle(request, async (actor) => {
    if (actor !== "command-centre") throw new OutreachError("Import with the API token", 403);
    const campaign = Campaign.parse(await request.json());
    const seen = new Set<string>();
    for (const p of campaign.prospects) {
      if (seen.has(p.id)) throw new OutreachError(`${p.id} appears twice`, 400);
      seen.add(p.id);
    }
    return ok(await importCampaign(campaign));
  });
