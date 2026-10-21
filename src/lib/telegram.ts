import "server-only";

// The owner's alert channel: a private Telegram bot (@CraeftoBot) that
// messages Obi's own chat. Outreach replies (lib/outreach/alerts.ts), the
// website assistant (lib/assistant) and the client portal
// (lib/portal/telegram-cards.ts) alert through it. TELEGRAM_API_URL points it
// at a local stand-in when testing.

export const telegramConfigured = () => Boolean(process.env.TELEGRAM_BOT_TOKEN && process.env.TELEGRAM_CHAT_ID);

/** Calls the Telegram Bot API; throws with Telegram's own reason when it refuses. */
export async function telegram<T = unknown>(method: string, body: Record<string, unknown>): Promise<T> {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  if (!token) throw new Error("TELEGRAM_BOT_TOKEN isn't set");
  const res = await fetch(`${process.env.TELEGRAM_API_URL || "https://api.telegram.org"}/bot${token}/${method}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
    signal: AbortSignal.timeout(10_000),
  });
  const data = (await res.json().catch(() => null)) as { ok?: boolean; result?: T; description?: string } | null;
  if (!res.ok || !data?.ok) throw new Error(`Telegram ${method}: ${data?.description ?? `HTTP ${res.status}`}`);
  return data.result as T;
}

/** Telegram's HTML mode: only these three need escaping. */
export const telegramHtml = (text: string) => text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

export interface TelegramButton {
  text: string;
  url?: string;
  /** Up to 64 bytes, sent back to the webhook when it's pressed. */
  callback_data?: string;
}

/** A message to Obi's chat, with buttons: one row, or rows of them. Returns the message (its id, to edit it later). */
export async function alertOwnerTelegram(text: string, buttons: TelegramButton[] | TelegramButton[][] = []) {
  const rows = (buttons.length === 0 ? [] : Array.isArray(buttons[0]) ? buttons : [buttons]) as TelegramButton[][];
  return telegram<{ message_id: number }>("sendMessage", {
    chat_id: process.env.TELEGRAM_CHAT_ID,
    text,
    parse_mode: "HTML",
    link_preview_options: { is_disabled: true },
    ...(rows.length ? { reply_markup: { inline_keyboard: rows } } : {}),
  });
}
