import type { NextRequest } from "next/server";
import { handle, idSchema, ok } from "@/lib/outreach/http";
import { listMessages } from "@/lib/outreach/sender";

export const dynamic = "force-dynamic";

/** Emails the sender sent or tried, newest first (?campaignId=&prospectId=&limit=). */
export const GET = (request: NextRequest) =>
  handle(request, async () => {
    const params = request.nextUrl.searchParams;
    const campaignId = params.get("campaignId");
    const prospectId = params.get("prospectId");
    return ok({
      messages: await listMessages({
        campaignId: campaignId ? idSchema.parse(campaignId) : undefined,
        prospectId: prospectId ? idSchema.parse(prospectId) : undefined,
        limit: Math.min(Number(params.get("limit")) || 50, 200),
      }),
    });
  });
