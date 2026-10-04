import type { NextRequest } from "next/server";
import { fail, handle, ids, ok } from "@/lib/outreach/http";
import { getCampaign } from "@/lib/outreach/store";

export const dynamic = "force-dynamic";

export const GET = (request: NextRequest, { params }: { params: Promise<{ campaignId: string }> }) =>
  handle(request, async () => {
    const { campaignId } = await ids(params);
    const campaign = await getCampaign(campaignId);
    return campaign ? ok({ campaign }) : fail("No such campaign", 404);
  });
