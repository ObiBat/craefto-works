import type { NextRequest } from "next/server";
import { handle, idSchema, ok } from "@/lib/outreach/http";
import { listReplies } from "@/lib/outreach/conversation";

export const dynamic = "force-dynamic";

/** Replies, newest first (?open=1 for the ones not handled; ?mode=test|live; ?campaignId=&prospectId=). */
export const GET = (request: NextRequest) =>
  handle(request, async () => {
    const params = request.nextUrl.searchParams;
    const mode = params.get("mode");
    const campaignId = params.get("campaignId");
    const prospectId = params.get("prospectId");
    return ok({
      replies: await listReplies({
        open: params.get("open") === "1",
        mode: mode === "test" || mode === "live" ? mode : undefined,
        campaignId: campaignId ? idSchema.parse(campaignId) : undefined,
        prospectId: prospectId ? idSchema.parse(prospectId) : undefined,
        limit: Math.min(Number(params.get("limit")) || 100, 300),
      }),
    });
  });
