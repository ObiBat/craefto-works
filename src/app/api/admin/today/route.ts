import type { NextRequest } from "next/server";
import { today, todayCounts } from "@/lib/admin/today";
import { handle, ok } from "@/lib/outreach/http";

export const dynamic = "force-dynamic";

/** The admin's Today screen; ?view=counts is the sidebar's badges. */
export const GET = (request: NextRequest) =>
  handle(request, async () => ok(request.nextUrl.searchParams.get("view") === "counts" ? { counts: await todayCounts() } : await today()));
