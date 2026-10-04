import type { NextRequest } from "next/server";
import { handle, ok } from "@/lib/outreach/http";
import { listCampaigns, listSummaries } from "@/lib/outreach/store";

export const dynamic = "force-dynamic";

/**
 * Outreach campaigns. The command centre reads everything (prospects with
 * their research and history); ?view=summary is the admin queue's light list.
 */
export const GET = (request: NextRequest) =>
  handle(request, async () => {
    if (request.nextUrl.searchParams.get("view") === "summary") return ok(await listSummaries());
    return ok({ campaigns: await listCampaigns() });
  });
