import { NextResponse, type NextRequest } from "next/server";
import { safeEqual } from "@/lib/admin-session";
import { leadUrl, telegram, threadUrl } from "@/lib/outreach/alerts";
import { handOver } from "@/lib/outreach/conversation";
import { OutreachError } from "@/lib/outreach/rules";
import { siteOrigin } from "@/lib/portal/origin";
import { portalCallback, portalMessage, type TelegramCallback, type TelegramMessage } from "@/lib/portal/telegram-actions";

export const dynamic = "force-dynamic";

interface Update {
  callback_query?: TelegramCallback;
  message?: TelegramMessage;
}

/** "Hand over to Leads" on an outreach reply: files the lead and swaps the button for a link to it. */
async function handOverButton(query: TelegramCallback, replyId: string, answer: (text: string) => Promise<unknown>) {
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
}

/**
 * The bot's buttons and messages. Telegram signs each call with the secret
 * given when the webhook was set; only the owner may press anything or ask
 * for anything. Outreach replies hand over to Leads (lib/outreach/alerts.ts);
 * everything else is the client portal (lib/portal/telegram-actions.ts).
 * Always answers 200, so Telegram doesn't send an update again.
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
    if (replyId) await handOverButton(query, replyId, answer);
    else await portalCallback(query, await siteOrigin());
    return NextResponse.json({ ok: true });
  }
  const message = update?.message;
  if (owner && message && String(message.chat.id) === owner && String(message.from?.id ?? message.chat.id) === owner) {
    await portalMessage(message, await siteOrigin());
  }
  return NextResponse.json({ ok: true });
}
