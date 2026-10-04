import type { NextRequest } from "next/server";
import { z } from "zod";
import { handle, ids, ok } from "@/lib/outreach/http";
import { checkEvidence, sourceUrl } from "@/lib/outreach/evidence";
import { checkProspect, getProspect, updateProspect } from "@/lib/outreach/store";
import { OutreachError } from "@/lib/outreach/rules";

export const dynamic = "force-dynamic";
export const maxDuration = 30;

const Body = z.object({ action: z.enum(["check", "confirm"]) });

/**
 * The published-address evidence. "check" fetches the page again now;
 * "confirm" records that you checked it yourself (for pages that turn away
 * automated checks), good for 30 days of sending.
 */
export const POST = (request: NextRequest, { params }: { params: Promise<{ campaignId: string; prospectId: string }> }) =>
  handle(request, async (actor) => {
    const { campaignId, prospectId } = await ids(params);
    const { action } = Body.parse(await request.json());
    const current = await getProspect(campaignId, prospectId);
    if (!current) throw new OutreachError("No such prospect", 404);
    if (current.contact.kind !== "email") throw new OutreachError("Only an email address needs this check");
    const fresh = action === "check" ? await checkEvidence(current.contact.value, current.contact.source) : null;
    const prospect = await updateProspect(campaignId, prospectId, actor, (p) => {
      if (fresh) {
        p.evidence = p.evidence?.manual ? { ...fresh, manual: p.evidence.manual } : fresh;
        return fresh.ok ? `Checked: ${p.contact.value} is published at ${fresh.url}` : `Checked: couldn't confirm ${p.contact.value} is published (${fresh.error ?? "a notice refuses unsolicited email"})`;
      }
      const now = new Date().toISOString();
      p.evidence = { ...(p.evidence ?? { url: sourceUrl(p.contact.source), checkedAt: now, addressFound: false, notice: null, pageHash: null, status: null }), ok: true, manual: { by: actor, at: now } };
      return `Confirmed by hand that ${p.contact.value} is published${p.contact.source ? ` (${p.contact.source})` : ""}`;
    });
    return ok({ prospect, check: await checkProspect(prospect) });
  });
