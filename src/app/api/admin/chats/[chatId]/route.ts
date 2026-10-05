import type { NextRequest } from "next/server";
import { z } from "zod";
import { getChat } from "@/lib/assistant/store";
import { fail, handle, ok } from "@/lib/outreach/http";

export const dynamic = "force-dynamic";
type Context = { params: Promise<{ chatId: string }> };

/** One conversation's transcript, as the visitor saw it. */
export const GET = (request: NextRequest, { params }: Context) =>
  handle(request, async () => {
    const id = z.uuid().safeParse((await params).chatId);
    const chat = id.success ? await getChat(id.data) : null;
    return chat ? ok({ chat }) : fail("No such chat", 404);
  });
