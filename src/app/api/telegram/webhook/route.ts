import { NextResponse, type NextRequest } from "next/server";
import { safeEqual } from "@/lib/admin-session";
import { leadUrl, telegram, threadUrl } from "@/lib/outreach/alerts";
import { handOver } from "@/lib/outreach/conversation";
import { OutreachError } from "@/lib/outreach/rules";

export const dynamic = "force-dynamic";

interface Update {
  callback_query?: {
    id: string;
    data?: string;
    from?: { id: number };
    message?: { message_id: number; chat: { id: number } };
  };
  message?: { chat: { id: number }; text?: string };
}

/**
 * The outreach bot's buttons (lib/outreach/alerts.ts). Telegram signs each
 * call with the secret given when the webhook was set; only the owner may
 * press anything. "Hand over to Leads" files the lead and swaps the button
 * for a link to it.
 */
export async function POST(request: NextRequest) {
  const secret = process.env.TELEGRAM_WEBHOOK_SECRET;
  const given = request.headers.get("x-telegram-bot-api-secret-token");
  if (!secret || !given || !(await safeEqual(given, secret))) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const update = (await request.json().catch(() => null)) as Update | null;
  const owner = process.env.TELEGRAM_CHAT_ID;
  const query = update?.callback_query;
  if (query) {
    const answer = (text: string) => telegram("answerCallbackQuery", { callback_query_id: query.id, text }).catch(() => undefined);
    if (!owner || String(query.from?.id) !== owner) {
      await answer("Only the owner can do that.");
      return NextResponse.json({ ok: true });
    }
    const replyId = query.data?.match(/^handover:([0-9a-f-]{36})$/)?.[1];
    if (!replyId) {
      await answer("That button has expired.");
      return NextResponse.json({ ok: true });
    }
    try {
      const result = await handOver(replyId, "admin");
      await answer(result.test ? "A test reply: marked handled, no lead filed." : result.created ? "Handed over: a new lead." : "Handed over to their existing lead.");
      if (query.message) {
        await telegram("editMessageReplyMarkup", {
          chat_id: query.message.chat.id,
          message_id: query.message.message_id,
          reply_markup: { inline_keyboard: [[{ text: "Open thread", url: threadUrl(replyId) }, ...(result.leadId ? [{ text: "Open lead", url: leadUrl(result.leadId) }] : [])]] },
        }).catch(() => undefined);
      }
    } catch (error) {
      if (!(error instanceof OutreachError)) console.error("Telegram handover failed:", error);
      await answer(error instanceof OutreachError ? error.message : "That didn't work. Try it in admin.");
    }
    return NextResponse.json({ ok: true });
  }
  if (owner && String(update?.message?.chat.id) === owner && update?.message?.text?.startsWith("/start")) {
    await telegram("sendMessage", { chat_id: owner, text: "Craefto outreach alerts are on: replies that need you arrive here." }).catch(() => undefined);
  }
  return NextResponse.json({ ok: true });
}
