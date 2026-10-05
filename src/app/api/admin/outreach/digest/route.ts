import type { NextRequest } from "next/server";
import { handle, ok } from "@/lib/outreach/http";
import { sendDigest } from "@/lib/outreach/digest";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

/** Sends the morning digest now, to check how it reads (it still goes at 8:30 as usual). */
export const POST = (request: NextRequest) => handle(request, async () => ok(await sendDigest(new Date(), { force: true })));
