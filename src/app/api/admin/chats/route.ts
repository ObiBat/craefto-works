import type { NextRequest } from "next/server";
import { listChats } from "@/lib/assistant/store";
import { handle, ok } from "@/lib/outreach/http";

export const dynamic = "force-dynamic";

/** Ask Craefto's conversations, newest first. */
export const GET = (request: NextRequest) => handle(request, async () => ok({ chats: await listChats(200) }));
