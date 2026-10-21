import "server-only";
import { createServerClient } from "@/lib/supabase";
import { alertOwnerTelegram, telegram, telegramConfigured, telegramHtml as html, type TelegramButton } from "@/lib/telegram";
import { allowanceFor, usageFor } from "./hours";
import { minutesLabel } from "./work-rules";
import { REQUEST_STATUSES, isOpen, type ClientAccount, type ClientFile, type ClientMessage, type ClientRequest, type ClientSubscription, type ClientTimeEntry } from "./types";
import type { WorkDraft } from "./work";

// Obi's phone: the portal's Telegram alerts, as cards with buttons to act on
// them there (lib/portal/telegram-actions.ts handles the taps and the typed
// replies). A card is drawn from the database, so after a tap it's redrawn
// with where things stand and the buttons that make sense next.

const db = () => createServerClient();

export const clientName = (account: Pick<ClientAccount, "company" | "name" | "email">) => account.company || account.name || account.email;
/** "Kaz", for "Reply to Kaz"; the client's name when there's no first name. */
export const firstName = (account: Pick<ClientAccount, "company" | "name" | "email">) => account.name?.trim().split(/\s+/)[0] || clientName(account);

const hours = (value: number) => String(Number(value.toFixed(2)));
/** "2–3 h", "2 h" */
export const range = (low: number, high: number) => (low === high ? `${hours(low)} h` : `${hours(low)}–${hours(high)} h`);

const excerpt = (text: string, length: number) => {
  const flat = text.trim();
  return flat.length > length ? `${flat.slice(0, length - 1).trimEnd()}…` : flat;
};

/** The portal's little Markdown (bold, "- " lists) in Telegram's HTML. */
const formatted = (text: string) =>
  html(text)
    .replace(/\*\*([^*\n]+)\*\*/g, "<b>$1</b>")
    .replace(/^- /gm, "• ");

const attribute = (url: string) => html(url).replace(/"/g, "&quot;");

export const requestUrl = (origin: string, request: Pick<ClientRequest, "id" | "account_id">) => `${origin}/admin/members/${request.account_id}#request-${request.id}`;
export const draftUrl = (origin: string, draft: Pick<WorkDraft, "id">) => `${origin}/admin/work#draft-${draft.id}`;
const clientUrl = (origin: string, accountId: string) => `${origin}/admin/members/${accountId}`;

/** Where a request stands, in a line. */
export function requestState(request: ClientRequest, minutes: number): string {
  const estimate = request.estimate_low != null && request.estimate_high != null ? range(Number(request.estimate_low), Number(request.estimate_high)) : null;
  const logged = minutes > 0 ? `${minutesLabel(minutes)} logged` : null;
  switch (request.status) {
    case "received":
      return request.estimate_state === "initial" && estimate ? `AI initial estimate ${estimate}` : "No estimate yet";
    case "estimated":
      return estimate ? `Confirmed ${estimate}, waiting for their approval` : "Waiting for their approval";
    case "queued":
      return [`Approved${estimate ? ` ${estimate}` : ""}`, request.queue_position ? `#${request.queue_position} in their queue` : null].filter(Boolean).join(" · ");
    case "in_progress":
      return ["In progress", logged && estimate ? `${logged} of ${estimate}` : (logged ?? (estimate ? `estimate ${estimate}` : null))].filter(Boolean).join(" · ");
    case "needs_info":
      return ["Waiting on their input", logged].filter(Boolean).join(" · ");
    case "delivered":
      return ["Delivered", logged].filter(Boolean).join(" · ");
    case "withdrawn":
      return "Withdrawn";
  }
}

/** The buttons that make sense for where a request is. */
export function requestKeyboard(request: ClientRequest, origin: string): TelegramButton[][] {
  const { id } = request;
  const open: TelegramButton = { text: "Open in admin", url: requestUrl(origin, request) };
  const low = request.estimate_low != null ? Number(request.estimate_low) : null;
  const high = request.estimate_high != null ? Number(request.estimate_high) : null;
  switch (request.status) {
    case "received":
      return [
        request.estimate_state === "initial" && low != null && high != null
          ? [
              { text: `Confirm ${range(low, high)}`, callback_data: `rq:c:${id}:${low}:${high}` },
              { text: "Change hours", callback_data: `rq:e:${id}` },
            ]
          : [{ text: "Set the hours", callback_data: `rq:e:${id}` }],
        [{ text: "Ask a question", callback_data: `rq:a:${id}` }, open],
      ];
    case "estimated":
      return [[{ text: "Change hours", callback_data: `rq:e:${id}` }, open]];
    case "queued":
      return [
        [
          { text: "Start now", callback_data: `rq:s:${id}` },
          { text: "Message them", callback_data: `rq:a:${id}` },
        ],
        [open],
      ];
    case "in_progress":
      return [
        [
          { text: "Log time", callback_data: `rq:l:${id}` },
          { text: "Delivered", callback_data: `rq:d:${id}` },
        ],
        [{ text: "Message them", callback_data: `rq:a:${id}` }, open],
      ];
    case "needs_info":
      return [
        [
          { text: "Log time", callback_data: `rq:l:${id}` },
          { text: "Message them", callback_data: `rq:a:${id}` },
        ],
        [open],
      ];
    default:
      return [[open]];
  }
}

/** "12.5/40 h used this month", for a client with hours. */
async function monthLine(account: ClientAccount): Promise<string | null> {
  const [{ data: subscriptions }, { data: entries }, { data: requests }] = await Promise.all([
    db().from("client_subscriptions").select("*").eq("account_id", account.id),
    db().from("client_time_entries").select("*").eq("account_id", account.id),
    db().from("client_requests").select("*").eq("account_id", account.id).in("status", ["queued", "in_progress", "needs_info"]),
  ]);
  const allowance = allowanceFor(account, (subscriptions ?? []) as ClientSubscription[]);
  if (!allowance) return null;
  const usage = usageFor(allowance, (entries ?? []) as ClientTimeEntry[], (requests ?? []) as ClientRequest[]);
  const used = hours(Math.round(usage.used * 4) / 4);
  return allowance.hours == null ? `${used} h used this month, no limit` : `${used}/${hours(allowance.hours)} h used this month`;
}

async function loggedOn(requestId: string) {
  const { data } = await db().from("client_time_entries").select("minutes").eq("request_id", requestId);
  return (data ?? []).reduce((total, entry) => total + entry.minutes, 0);
}

/** A request's card: who, what they asked, where it stands and their month, with its buttons. */
export async function requestCard(requestId: string, origin: string, options: { heading?: string; note?: string | null } = {}) {
  const { data: request } = await db().from("client_requests").select("*").eq("id", requestId).maybeSingle<ClientRequest>();
  if (!request) return null;
  const { data: account } = await db().from("client_accounts").select("*").eq("id", request.account_id).maybeSingle<ClientAccount>();
  if (!account) return null;
  const [minutes, month] = await Promise.all([loggedOn(request.id), monthLine(account)]);
  const text = [
    `<b>${html(options.heading ?? "Request")} · ${html(clientName(account))}</b>`,
    `<b>${html(request.title)}</b>`,
    request.details ? `<i>${html(excerpt(request.details, 300))}</i>` : "",
    [options.note ?? requestState(request, minutes), month].filter(Boolean).map((part) => html(part!)).join(" · "),
  ]
    .filter(Boolean)
    .join("\n");
  return { text, keyboard: requestKeyboard(request, origin), request, account, minutes };
}

/** A new request or an approval, to Obi's phone. */
export async function alertRequestCard(requestId: string, origin: string, options: { heading: string; note?: string | null }) {
  const card = await requestCard(requestId, origin, options);
  if (card) await alertOwnerTelegram(card.text, card.keyboard);
}

export interface CardMessage {
  chat_id: number;
  message_id: number;
}

/** Redraw a request's card after a tap or a typed reply (Telegram refuses an unchanged one, which is fine). */
export async function redrawRequest(target: CardMessage, requestId: string, origin: string) {
  const card = await requestCard(requestId, origin);
  if (!card) return;
  await telegram("editMessageText", {
    ...target,
    text: card.text,
    parse_mode: "HTML",
    link_preview_options: { is_disabled: true },
    reply_markup: { inline_keyboard: card.keyboard },
  }).catch(() => undefined);
}

/** A client's message, with a button to reply. */
export async function alertClientMessage(account: ClientAccount, message: ClientMessage, request: ClientRequest | null, files: ClientFile[], origin: string) {
  const attached = files.length ? `${files.length} file${files.length === 1 ? "" : "s"} attached` : "";
  const text = [
    `<b>Message · ${html(clientName(account))}</b>`,
    request ? `Re: <b>${html(request.title)}</b>` : "",
    message.body ? `“${html(excerpt(message.body, 700))}”` : "",
    attached,
  ]
    .filter(Boolean)
    .join("\n");
  await alertOwnerTelegram(text, [
    [
      { text: `Reply to ${firstName(account)}`, callback_data: request ? `ms:r:${request.id}` : `ms:g:${account.id}` },
      { text: "Open in admin", url: request ? requestUrl(origin, request) : clientUrl(origin, account.id) },
    ],
  ]);
}

/** "japanoma-com/japanoma #201", from "github:japanoma-com/japanoma#201" */
const sourceLabel = (draft: Pick<WorkDraft, "source_ref">) => draft.source_ref.replace(/^github:/, "").replace("#", " #");

function draftState(draft: WorkDraft, account: ClientAccount, request: Pick<ClientRequest, "title"> | null) {
  if (draft.status === "dismissed") return "<b>Dismissed</b>";
  if (draft.status !== "published") return "";
  const minutes = draft.published_minutes ?? 0;
  const logged = minutes ? `${minutesLabel(minutes)} logged` : "no time logged";
  if (draft.published_mode === "deliver") return `<b>Delivered</b> their request and emailed ${html(firstName(account))} · ${logged}`;
  if (draft.published_mode === "time") return `<b>Logged</b> ${minutesLabel(minutes)} ${request ? `on “${html(request.title)}”` : "as general time"}`;
  return `<b>Published</b> to their Past work · ${logged}`;
}

/** Shipped work's buttons: publish it (or deliver its request), its time only, a different time, or dismiss it. */
export function draftKeyboard(draft: WorkDraft, request: Pick<ClientRequest, "status"> | null, origin: string): TelegramButton[][] {
  const open: TelegramButton = { text: "Open in admin", url: draftUrl(origin, draft) };
  if (draft.status === "dismissed") return [[{ text: "Undo dismiss", callback_data: `wk:u:${draft.id}` }, open]];
  if (draft.status === "published") return draft.published_mode === "deliver" ? [[open]] : [[{ text: "Undo", callback_data: `wk:u:${draft.id}` }, open]];
  const minutes = draft.minutes ?? 0;
  const time = minutes ? ` · ${minutesLabel(minutes)}` : "";
  const deliverable = request !== null && isOpen(request);
  const first: TelegramButton[] = [];
  if (deliverable) first.push({ text: `Deliver request${time}`, callback_data: `wk:d:${draft.id}:${minutes}` });
  else if (!draft.internal) first.push({ text: minutes ? `Publish${time}` : "Publish, no time", callback_data: `wk:p:${draft.id}:${minutes}` });
  if (minutes) first.push({ text: `Time only${time}`, callback_data: `wk:t:${draft.id}:${minutes}` });
  const second: TelegramButton[] = [
    { text: minutes ? "Change time" : "Set time", callback_data: `wk:e:${draft.id}` },
    { text: "Dismiss", callback_data: `wk:x:${draft.id}` },
  ];
  const third: TelegramButton[] = draft.internal && !deliverable ? [{ text: `Publish anyway${time}`, callback_data: `wk:p:${draft.id}:${minutes}` }, open] : [open];
  return [first, second, third].filter((row) => row.length > 0);
}

/** Shipped work's card: what the client would read, the time and why, the request it's for, and the pull request. */
export function draftText(draft: WorkDraft, account: ClientAccount, request: Pick<ClientRequest, "title" | "status"> | null) {
  const links = draft.outcome_links.map((link) => `<a href="${attribute(link.url)}">${html(link.label)}</a>`).join(" · ");
  const time = draft.minutes
    ? `Time: ${minutesLabel(draft.minutes)}${draft.suggestion_note ? ` (${html(draft.suggestion_note)})` : ""}`
    : "No time suggested yet";
  return [
    `<b>Shipped · ${html(clientName(account))}</b>`,
    `<b>${html(draft.title)}</b>`,
    draft.outcome ? formatted(excerpt(draft.outcome, 900)) : "<i>No outcome written: add one in admin, or log its time only.</i>",
    links,
    draft.status === "pending" ? time : "",
    request ? `For their request “${html(request.title)}” (${REQUEST_STATUSES[request.status].label.toLowerCase()})` : "",
    draft.internal && draft.status === "pending" ? "Housekeeping: nothing they'd notice, so its time only" : "",
    draftState(draft, account, request),
    draft.source_url ? `<a href="${attribute(draft.source_url)}">${html(sourceLabel(draft))}</a>` : html(sourceLabel(draft)),
  ]
    .filter(Boolean)
    .join("\n");
}

async function draftParts(draftId: string) {
  const { data: draft } = await db().from("client_work_drafts").select("*").eq("id", draftId).maybeSingle<WorkDraft>();
  if (!draft) return null;
  const requestId = draft.request_id ?? draft.published_request_id;
  const [{ data: account }, { data: request }] = await Promise.all([
    db().from("client_accounts").select("*").eq("id", draft.account_id).maybeSingle<ClientAccount>(),
    requestId ? db().from("client_requests").select("id, title, status").eq("id", requestId).maybeSingle<Pick<ClientRequest, "id" | "title" | "status">>() : Promise.resolve({ data: null }),
  ]);
  return account ? { draft, account, request: request ?? null } : null;
}

/** Shipped work, to Obi's phone. */
export async function alertDraft(draft: WorkDraft, account: ClientAccount, request: Pick<ClientRequest, "title" | "status"> | null, origin: string) {
  if (!telegramConfigured()) return;
  await alertOwnerTelegram(draftText(draft, account, request), draftKeyboard(draft, request, origin));
}

export async function alertDraftById(draftId: string, origin: string) {
  const parts = await draftParts(draftId);
  if (parts) await alertDraft(parts.draft, parts.account, parts.request, origin);
}

/** Redraw a shipped-work card after a tap or a typed reply. */
export async function redrawDraft(target: CardMessage, draftId: string, origin: string) {
  const parts = await draftParts(draftId);
  if (!parts) return;
  await telegram("editMessageText", {
    ...target,
    text: draftText(parts.draft, parts.account, parts.request),
    parse_mode: "HTML",
    link_preview_options: { is_disabled: true },
    reply_markup: { inline_keyboard: draftKeyboard(parts.draft, parts.request, origin) },
  }).catch(() => undefined);
}
