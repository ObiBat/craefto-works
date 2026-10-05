import type { NextRequest } from "next/server";
import { handle, ok } from "@/lib/outreach/http";
import { openReplyCount } from "@/lib/outreach/conversation";
import { listCampaigns, listSummaries } from "@/lib/outreach/store";
import { getSettings } from "@/lib/outreach/sender";

export const dynamic = "force-dynamic";

/**
 * Outreach campaigns. The command centre reads everything (prospects with
 * their research and history); ?view=summary is the admin queue's light list.
 */
export const GET = (request: NextRequest) =>
  handle(request, async () => {
    const [data, settings, openReplies] = await Promise.all([
      request.nextUrl.searchParams.get("view") === "summary" ? listSummaries() : listCampaigns().then((campaigns) => ({ campaigns })),
      getSettings(),
      openReplyCount(),
    ]);
    // The command centre hides "Open in Mail" for what the sender will send itself.
    return ok({ ...data, sending: { mode: settings.mode }, replies: { open: openReplies } });
  });
