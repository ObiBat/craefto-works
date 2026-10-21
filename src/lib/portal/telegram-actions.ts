import "server-only";
import { createServerClient } from "@/lib/supabase";
import { telegram, telegramHtml as html } from "@/lib/telegram";
import { allowanceFor, sydneyToday, usageFor } from "./hours";
import { sendEstimateReady, sendReply, sendRequestUpdate } from "./notify";
import { OutcomeInputError, outcomeInput } from "./outcome";
import { alertDraftById, clientName, firstName, range, redrawDraft, redrawRequest, type CardMessage } from "./telegram-cards";
import { WorkError, dismissDraft, editDraft, publishDraft, undoDraft, type PublishMode, type WorkDraft } from "./work";
import { minutesLabel, parseEstimate, splitDuration } from "./work-rules";
import { WorkflowError, confirmEstimate, deliveryDetail, logTime, setStatus } from "./workflow";
import { REQUEST_STATUSES, estimateLabel, isOpen, type ClientAccount, type ClientMessage, type ClientRequest, type ClientSubscription, type ClientTimeEntry } from "./types";

// Acting on the portal from Obi's phone. The cards' buttons
// (lib/portal/telegram-cards.ts) either act at once (confirm an estimate,
// start the work, publish shipped work) or ask for a reply: new hours, a
// message to the client, time to log, what was delivered. A question is a
// message the reply is attached to, remembered in telegram_prompts so the
// reply lands on the right request; each is answered once. Commands: /hours,
// /log, /work and /help. Only the owner's chat reaches here
// (app/api/telegram/webhook).

export interface TelegramCallback {
  id: string;
  data?: string;
  from?: { id: number };
  message?: { message_id: number; chat: { id: number } };
}

export interface TelegramMessage {
  message_id: number;
  chat: { id: number };
  from?: { id: number };
  text?: string;
  reply_to_message?: { message_id: number };
}

type PromptAction = "estimate" | "reply" | "reply_general" | "log" | "deliver" | "draft_time";

interface Prompt {
  chat_id: number;
  message_id: number;
  action: PromptAction;
  target: string;
  origin_message_id: number | null;
  created_at: string;
  used_at: string | null;
}

const db = () => createServerClient();
const now = () => new Date().toISOString();
const DAY = 86_400_000;

/** Refusals worth showing as they are; anything else is logged and gets a general answer. */
const readable = (error: unknown) => error instanceof WorkflowError || error instanceof WorkError || error instanceof OutcomeInputError;

async function requestById(id: string) {
  const { data } = await db().from("client_requests").select("*").eq("id", id).maybeSingle<ClientRequest>();
  return data ?? null;
}

async function accountById(id: string) {
  const { data } = await db().from("client_accounts").select("*").eq("id", id).maybeSingle<ClientAccount>();
  return data ?? null;
}

/** A request and its client, or a refusal when either has gone. */
async function requestAndAccount(id: string) {
  const request = await requestById(id);
  if (!request) throw new WorkError("That request no longer exists.");
  const account = await accountById(request.account_id);
  if (!account) throw new WorkError("That client no longer exists.");
  return { request, account };
}

const statusLabel = (request: ClientRequest) => REQUEST_STATUSES[request.status].label.toLowerCase();

/** Ask for a reply: Telegram opens the reply box on it, and the reply finds its way back by this message. */
async function ask(card: CardMessage, action: PromptAction, target: string, text: string, placeholder: string) {
  const sent = await telegram<{ message_id: number }>("sendMessage", {
    chat_id: card.chat_id,
    text,
    parse_mode: "HTML",
    reply_markup: { force_reply: true, input_field_placeholder: placeholder.slice(0, 64) },
  });
  const { error } = await db().from("telegram_prompts").insert({ chat_id: card.chat_id, message_id: sent.message_id, action, target, origin_message_id: card.message_id });
  if (error) throw error;
  // Questions last three days; a week on, they go.
  await db().from("telegram_prompts").delete().lt("created_at", new Date(Date.now() - 7 * DAY).toISOString());
}

// ── Buttons ───────────────────────────────────────────────────────────────

/** A button on a card: "rq:<verb>:<request>", "ms:<verb>:<request or account>", "wk:<verb>:<draft>", some with numbers after. */
export async function portalCallback(query: TelegramCallback, origin: string) {
  const answer = (text: string) => telegram("answerCallbackQuery", { callback_query_id: query.id, text: text.slice(0, 200) }).catch(() => undefined);
  const match = query.data?.match(/^(rq|ms|wk):([a-z]):([0-9a-f-]{36})(?::(\d+(?:\.\d+)?))?(?::(\d+(?:\.\d+)?))?$/);
  if (!match || !query.message) return answer("That button has expired.");
  const [, kind, verb, id, first, second] = match;
  const card: CardMessage = { chat_id: query.message.chat.id, message_id: query.message.message_id };
  try {
    if (kind === "rq") return answer(await requestButton(verb, id, first, second, card, origin));
    if (kind === "ms") return answer(await messageButton(verb, id, card));
    return answer(await workButton(verb, id, first, card, origin));
  } catch (error) {
    if (!readable(error)) console.error(`The Telegram button "${query.data}" failed:`, error);
    return answer(readable(error) ? (error as Error).message : "That didn't work. Try it in admin.");
  }
}

async function requestButton(verb: string, id: string, first: string | undefined, second: string | undefined, card: CardMessage, origin: string): Promise<string> {
  const { request, account } = await requestAndAccount(id);
  const who = firstName(account);
  const title = `<b>${html(request.title)}</b>`;
  switch (verb) {
    case "c": {
      // The hours on the button: what was tapped is what's confirmed.
      const low = Number(first);
      const high = Number(second);
      if (!(low > 0 && high >= low && high <= 400)) return "That button has expired.";
      if (request.status !== "received") {
        await redrawRequest(card, request.id, origin);
        return `It's ${statusLabel(request)} already.`;
      }
      const saved = await confirmEstimate(request, { low, high, note: request.estimate_note, targetDate: request.target_date });
      if (saved.status === "estimated") await sendEstimateReady(account, saved, origin);
      await redrawRequest(card, saved.id, origin);
      return `Confirmed ${range(Number(saved.estimate_low), Number(saved.estimate_high))}. ${who} has been emailed to approve it.`;
    }
    case "e":
      await ask(card, "estimate", request.id, `Hours for ${title}: reply like 3-5 or 2. A note on what it covers can follow the hours.`, "3-5 what it covers");
      return "Reply with the hours.";
    case "a":
      await ask(card, "reply", request.id, `Your message to ${html(who)} about ${title}: reply here and it goes to them from Craefto Works, by email too.`, `Message to ${who}`);
      return "Write your message.";
    case "s": {
      if (request.status !== "queued") {
        await redrawRequest(card, request.id, origin);
        return `It's ${statusLabel(request)} now.`;
      }
      const started = await setStatus(request, "in_progress");
      await sendRequestUpdate(account, started, origin);
      await redrawRequest(card, started.id, origin);
      return `Started. ${who} has been emailed.`;
    }
    case "l":
      await ask(card, "log", request.id, `Time on ${title}: reply like 1.5, 90m or 1h30, then what you did.`, "1.5 what you did");
      return "Reply with the time.";
    case "d":
      if (!isOpen(request)) {
        await redrawRequest(card, request.id, origin);
        return `It's ${statusLabel(request)} already.`;
      }
      await ask(
        card,
        "deliver",
        request.id,
        `What did we deliver on ${title}? Reply with the outcome: it goes in their Past work and the delivery email. Or reply with a dash (-) to deliver it without one.`,
        "What we delivered"
      );
      return "Reply with what was delivered.";
    default:
      return "That button has expired.";
  }
}

async function messageButton(verb: string, id: string, card: CardMessage): Promise<string> {
  if (verb === "r") {
    const { request, account } = await requestAndAccount(id);
    const who = firstName(account);
    await ask(card, "reply", request.id, `Your reply to ${html(who)} about <b>${html(request.title)}</b>: it goes to them from Craefto Works, by email too.`, `Reply to ${who}`);
    return "Write your reply.";
  }
  const account = await accountById(id);
  if (!account) throw new WorkError("That client no longer exists.");
  const who = firstName(account);
  await ask(card, "reply_general", account.id, `Your reply to ${html(who)}: it goes to them from Craefto Works, by email too.`, `Reply to ${who}`);
  return "Write your reply.";
}

const MODES: Record<string, PublishMode> = { p: "past_work", d: "deliver", t: "time" };

async function workButton(verb: string, id: string, first: string | undefined, card: CardMessage, origin: string): Promise<string> {
  const mode = MODES[verb];
  if (mode) {
    // The time on the button: what was tapped is what's published.
    const minutes = Number(first ?? 0);
    const { draft, request } = await publishDraft(id, { mode, minutes }, origin);
    await redrawDraft(card, draft.id, origin);
    const logged = minutes ? ` with ${minutesLabel(minutes)} logged` : "";
    if (mode === "deliver") return `Delivered${logged}. They've been emailed.`;
    if (mode === "time") return `Logged ${minutesLabel(minutes)}${request ? ` on “${request.title}”` : ""}.`;
    return `Published to their Past work${logged}.`;
  }
  if (verb === "e") {
    const { data: draft } = await db().from("client_work_drafts").select("id, title, status").eq("id", id).maybeSingle<Pick<WorkDraft, "id" | "title" | "status">>();
    if (!draft) throw new WorkError("That draft no longer exists.");
    if (draft.status !== "pending") throw new WorkError("That one's already published or dismissed.");
    await ask(card, "draft_time", draft.id, `Time for <b>${html(draft.title)}</b>: reply like 1.5, 90m or 1h30.`, "1.5");
    return "Reply with the time.";
  }
  if (verb === "x") {
    await dismissDraft(id);
    await redrawDraft(card, id, origin);
    return "Dismissed. Nothing reached them.";
  }
  if (verb === "u") {
    await undoDraft(id);
    await redrawDraft(card, id, origin);
    return "Undone: it's waiting again.";
  }
  return "That button has expired.";
}

// ── Typed replies and commands ────────────────────────────────────────────

/** A message from the owner: a reply to one of the bot's questions, or a command. */
export async function portalMessage(message: TelegramMessage, origin: string) {
  const say = (text: string) =>
    telegram("sendMessage", {
      chat_id: message.chat.id,
      text,
      parse_mode: "HTML",
      link_preview_options: { is_disabled: true },
      reply_parameters: { message_id: message.message_id, allow_sending_without_reply: true },
    }).catch((error) => console.error("A Telegram answer failed:", error));
  const text = message.text?.trim() ?? "";
  try {
    if (message.reply_to_message) return await say(await answerPrompt(message.chat.id, message.reply_to_message.message_id, text, origin));
    if (text.startsWith("/")) return await command(text, origin, say);
    return await say("Reply to one of my questions, or send /help for what I can do here.");
  } catch (error) {
    if (!readable(error)) console.error("A Telegram message failed:", error);
    return say(readable(error) ? html((error as Error).message) : "That didn't work. Try it in admin.");
  }
}

/** The reply to a question: claimed first (so a retried delivery can't apply it twice), released again if it doesn't parse. */
async function answerPrompt(chatId: number, messageId: number, text: string, origin: string): Promise<string> {
  const { data: prompt } = await db().from("telegram_prompts").select("*").eq("chat_id", chatId).eq("message_id", messageId).maybeSingle<Prompt>();
  if (!prompt) return "That isn't one of my questions. Tap a button on an alert, then reply to what I ask.";
  if (prompt.used_at) return "That one's done. Tap the button again to change it.";
  if (Date.now() - Date.parse(prompt.created_at) > 3 * DAY) return "That question has expired. Tap the button again.";
  if (!text) return "Reply with text.";
  const { data: claimed } = await db()
    .from("telegram_prompts")
    .update({ used_at: now() })
    .eq("chat_id", chatId)
    .eq("message_id", messageId)
    .is("used_at", null)
    .select("*")
    .maybeSingle<Prompt>();
  if (!claimed) return "That one's done. Tap the button again to change it.";
  const card = prompt.origin_message_id ? { chat_id: chatId, message_id: prompt.origin_message_id } : null;
  try {
    return await applyReply(prompt, text, card, origin);
  } catch (error) {
    // Not applied: the question stays open for another go.
    await db().from("telegram_prompts").update({ used_at: null }).eq("chat_id", chatId).eq("message_id", messageId);
    throw error;
  }
}

async function applyReply(prompt: Prompt, text: string, card: CardMessage | null, origin: string): Promise<string> {
  switch (prompt.action) {
    case "estimate": {
      const parsed = parseEstimate(text);
      if (!parsed) throw new WorkError("Give the hours like 3-5 or 2, then any note. Reply to my question again.");
      const { request, account } = await requestAndAccount(prompt.target);
      const saved = await confirmEstimate(request, { low: parsed.low, high: parsed.high, note: parsed.note || request.estimate_note, targetDate: request.target_date });
      if (saved.status === "estimated") await sendEstimateReady(account, saved, origin);
      if (card) await redrawRequest(card, saved.id, origin);
      const hours = range(Number(saved.estimate_low), Number(saved.estimate_high));
      return saved.status === "estimated"
        ? `Confirmed ${hours} for <b>${html(saved.title)}</b>. ${html(firstName(account))} has been emailed to approve it.`
        : `Changed to ${hours} for <b>${html(saved.title)}</b>. It's under way, so it stands as approved.`;
    }
    case "reply":
    case "reply_general": {
      if (text.length > 10000) throw new WorkError("Keep a message under 10,000 characters. Reply to my question again.");
      const { request, account } = prompt.action === "reply" ? await requestAndAccount(prompt.target) : { request: null, account: await accountById(prompt.target) };
      if (!account) throw new WorkError("That client no longer exists.");
      const { data: message, error } = await db()
        .from("client_messages")
        .insert({ account_id: account.id, request_id: request?.id ?? null, author: "craefto", body: text })
        .select("*")
        .single();
      if (error || !message) throw error ?? new Error("The message wasn't saved");
      if (request) await db().from("client_requests").update({ updated_at: now() }).eq("id", request.id);
      await sendReply(account, message as ClientMessage, request, [], origin);
      return `Sent to ${html(firstName(account))}${request ? ` about <b>${html(request.title)}</b>` : ""}, by email too.`;
    }
    case "log": {
      const parsed = splitDuration(text);
      if (!parsed) throw new WorkError("Give the time like 1.5, 90m or 1h30, then what you did. Reply to my question again.");
      const { request } = await requestAndAccount(prompt.target);
      await logTime(request.account_id, { requestId: request.id, minutes: parsed.minutes, note: parsed.note, workedOn: sydneyToday() });
      const { data: entries } = await db().from("client_time_entries").select("minutes").eq("request_id", request.id);
      const total = (entries ?? []).reduce((sum, entry) => sum + entry.minutes, 0);
      if (card) await redrawRequest(card, request.id, origin);
      const estimate = estimateLabel(request);
      return `Logged ${minutesLabel(parsed.minutes)} on <b>${html(request.title)}</b>: ${minutesLabel(total)} so far${estimate ? `, of an estimate of ${estimate}` : ""}.`;
    }
    case "deliver": {
      const { request, account } = await requestAndAccount(prompt.target);
      if (!isOpen(request)) throw new WorkError(`It's ${statusLabel(request)} already.`);
      const withOutcome = text !== "-";
      if (withOutcome) {
        const { error } = await db().from("client_requests").update(outcomeInput({ outcome: text })).eq("id", request.id);
        if (error) throw error;
      }
      const fresh = await requestById(request.id);
      const delivered = await setStatus(fresh!, "delivered");
      await sendRequestUpdate(account, delivered, origin, await deliveryDetail(delivered));
      if (card) await redrawRequest(card, delivered.id, origin);
      return `Delivered <b>${html(delivered.title)}</b>. ${html(firstName(account))} has been emailed${withOutcome ? " with what we delivered" : ""}.`;
    }
    case "draft_time": {
      const parsed = splitDuration(text);
      if (!parsed) throw new WorkError("Give the time like 1.5, 90m or 1h30. Reply to my question again.");
      const draft = await editDraft(prompt.target, { minutes: parsed.minutes });
      if (card) await redrawDraft(card, draft.id, origin);
      return `Time set to ${minutesLabel(parsed.minutes)} for <b>${html(draft.title)}</b>. Tap Publish on it when you're ready.`;
    }
  }
}

const HELP = [
  "<b>Craefto on your phone</b>",
  "Client requests, approvals, messages and shipped work arrive here with buttons: confirm or change an estimate, ask them something, start the work, log time, deliver it, and publish shipped work to their Past work. Outreach replies that need you arrive here too.",
  "",
  "When I ask for something, reply to my message:",
  "• hours: 3-5, or 2, then any note",
  "• time: 1.5, 90m or 1h30, then what you did",
  "",
  "/hours: each client's month",
  "/log kaz 1.5 what you did: general time today",
  "/work: shipped work waiting to publish",
].join("\n");

async function command(text: string, origin: string, say: (text: string) => Promise<unknown>) {
  const [name, ...args] = text.split(/\s+/);
  switch (name.toLowerCase().replace(/@\w+$/, "")) {
    case "/start":
    case "/help":
      return say(HELP);
    case "/hours":
      return say(await hoursSummary(args.join(" ")));
    case "/log":
      return say(await logGeneral(args));
    case "/work":
      return sendWaitingWork(origin, say);
    default:
      return say("I don't know that one. Send /help for what I can do here.");
  }
}

const quarter = (hours: number) => String(Math.round(hours * 4) / 4);
const dayLabel = (date: string) => new Date(`${date}T12:00:00Z`).toLocaleDateString("en-AU", { day: "numeric", month: "short", timeZone: "UTC" });

/** Clients a name, company or email word matches: "kaz", "japanoma". */
const matching = (accounts: ClientAccount[], word: string) =>
  accounts.filter((account) =>
    [account.company, account.name, account.email].some((value) =>
      (value ?? "")
        .toLowerCase()
        .split(/[\s@.]+/)
        .some((part) => part && part.startsWith(word.toLowerCase()))
    )
  );

/** Each client with hours: used, left, what's approved to come, and when they renew. */
async function hoursSummary(filter: string) {
  const [{ data: accounts }, { data: subscriptions }, { data: entries }, { data: requests }] = await Promise.all([
    db().from("client_accounts").select("*").order("created_at"),
    db().from("client_subscriptions").select("*"),
    db().from("client_time_entries").select("*"),
    db().from("client_requests").select("*").in("status", ["queued", "in_progress", "needs_info"]),
  ]);
  const chosen = filter ? matching((accounts ?? []) as ClientAccount[], filter) : ((accounts ?? []) as ClientAccount[]);
  const lines: string[] = [];
  for (const account of chosen) {
    const allowance = allowanceFor(account, ((subscriptions ?? []) as ClientSubscription[]).filter((row) => row.account_id === account.id));
    if (!allowance) continue;
    const usage = usageFor(
      allowance,
      ((entries ?? []) as ClientTimeEntry[]).filter((row) => row.account_id === account.id),
      ((requests ?? []) as ClientRequest[]).filter((row) => row.account_id === account.id)
    );
    const used = allowance.hours == null ? `${quarter(usage.used)} h used, no limit` : `${quarter(usage.used)} of ${quarter(allowance.hours)} h used, ${quarter(Math.max(0, usage.left ?? 0))} left`;
    const coming = usage.committedHigh > 0 ? ` · ${range(Math.round(usage.committedLow * 2) / 2, Math.round(usage.committedHigh * 2) / 2)} approved to come` : "";
    lines.push(`<b>${html(clientName(account))}</b>: ${used}${coming} · renews ${dayLabel(usage.month.renews)}`);
  }
  if (lines.length) return lines.join("\n");
  return filter ? `No client with hours matches “${html(filter)}”.` : "No clients with monthly hours yet.";
}

/** "/log kaz 1.5 what you did": general time today, for the client named (or the only one with hours). */
async function logGeneral(args: string[]) {
  const { data } = await db().from("client_accounts").select("*").order("created_at");
  const accounts = (data ?? []) as ClientAccount[];
  let account: ClientAccount | undefined;
  let rest = args;
  if (args.length && !splitDuration(args.join(" "))) {
    const found = matching(accounts, args[0]);
    if (found.length !== 1) {
      return found.length ? `“${html(args[0])}” matches ${found.map((one) => html(clientName(one))).join(", ")}: use more of the name.` : `No client called “${html(args[0])}”.`;
    }
    account = found[0];
    rest = args.slice(1);
  } else {
    const { data: subscriptions } = await db().from("client_subscriptions").select("*");
    const withHours = accounts.filter((one) => allowanceFor(one, ((subscriptions ?? []) as ClientSubscription[]).filter((row) => row.account_id === one.id)));
    if (withHours.length !== 1) return "Which client? Log like this: /log kaz 1.5 what you did";
    account = withHours[0];
  }
  const parsed = splitDuration(rest.join(" "));
  if (!parsed) return "Log like this: /log kaz 1.5 what you did";
  await logTime(account.id, { requestId: null, minutes: parsed.minutes, note: parsed.note || "Studio time", workedOn: sydneyToday() });
  return `Logged ${minutesLabel(parsed.minutes)} for ${html(clientName(account))} today${parsed.note ? `: ${html(parsed.note)}` : ""}.`;
}

/** Shipped work waiting to publish, as cards again (the newest five). */
async function sendWaitingWork(origin: string, say: (text: string) => Promise<unknown>) {
  const { data } = await db().from("client_work_drafts").select("id").eq("status", "pending").order("merged_at", { ascending: false }).limit(50);
  const ids = (data ?? []).map((row) => row.id as string);
  if (ids.length === 0) return say("Nothing waiting: all shipped work is published.");
  for (const id of ids.slice(0, 5)) await alertDraftById(id, origin);
  if (ids.length > 5) await say(`And ${ids.length - 5} more in admin.`);
}
