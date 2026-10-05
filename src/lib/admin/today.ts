import "server-only";
import { LEAD_SOURCES, enquiryLabel } from "@/lib/enquiry";
import { createServerClient } from "@/lib/supabase";
import { sendingStatus } from "@/lib/outreach/sender";
import type { SendingMode } from "@/lib/outreach/types";
import { allowanceFor, minutesByRequest, shortHours, sydneyToday, usageFor } from "@/lib/portal/hours";
import {
  isLive,
  isOpen,
  isWaitingOnClient,
  type ClientAccount,
  type ClientMeeting,
  type ClientMessage,
  type ClientRequest,
  type ClientSubscription,
  type ClientTimeEntry,
} from "@/lib/portal/types";

// The admin's Today screen: everything that needs Obi across the systems
// (portal clients, enquiries, outreach replies, Ask Craefto, applications),
// what's coming up, and how the month and the site are going. Service role;
// the admin API is guarded by src/proxy.ts.

const DAY = 86_400_000;

export type NeedKind = "client-message" | "estimate" | "overrun" | "reply" | "enquiry" | "handoff" | "application" | "drafts";

export interface Need {
  id: string;
  kind: NeedKind;
  title: string;
  detail: string;
  href: string;
  /** When it happened, if it's one thing. */
  at: string | null;
}

export type UpcomingKind = "client-call" | "discovery-call" | "target" | "needed-by";

export interface Upcoming {
  id: string;
  kind: UpcomingKind;
  title: string;
  detail: string;
  href: string;
  /** A time (calls) or a yyyy-mm-dd date (deliveries). */
  at: string;
  allDay: boolean;
}

export interface ClientGlance {
  id: string;
  name: string;
  allowance: number | null;
  allowanceLabel: string | null;
  used: number;
  /** Approved work still to do this month, at the top of its estimates. */
  committed: number;
  open: number;
  waitingOnThem: number;
  href: string;
}

export interface Today {
  needs: Need[];
  upcoming: Upcoming[];
  clients: ClientGlance[];
  numbers: {
    views: number;
    viewsBefore: number;
    /** Visits: a visitor counts once a day. */
    visits: number;
    enquiries: number;
    chats: number;
    unanswered: number;
  };
  outreach: {
    mode: SendingMode;
    sentToday: number;
    queued: number;
    drafts: number;
    openReplies: number;
    inboxReadAt: string | null;
    inboxError: string | null;
  };
}

/** The sidebar's badges: what needs Obi in each section. */
export interface TodayCounts {
  leads: number;
  outreach: number;
  chats: number;
  clients: number;
  applications: number;
}




/** Replies worth Obi's time: the ones the sender couldn't settle by itself. */
const OPEN_LABELS = ["interested", "question", "referral", "unclear"];

const excerpt = (text: string, length = 110) => {
  const flat = text.replace(/\s+/g, " ").trim();
  return flat.length > length ? `${flat.slice(0, length - 1).trimEnd()}…` : flat;
};

const clientName = (account: Pick<ClientAccount, "name" | "company" | "email">) => account.company || account.name || account.email;

const requestHref = (request: Pick<ClientRequest, "id" | "account_id">) => `/admin/members/${request.account_id}#request-${request.id}`;

// A non-breaking space keeps "h" with its number.
const range = (low: number, high: number) => (low === high ? `${low}\u00a0h` : `${low}–${high}\u00a0h`);

interface LeadRow {
  id: string;
  name: string;
  company: string | null;
  source: string | null;
  service_interest: string | null;
  budget_range: string | null;
  created_at: string;
}

interface ReplyRow {
  id: string;
  campaign_id: string;
  prospect_id: string;
  from_name: string | null;
  from_address: string | null;
  label: string | null;
  summary: string | null;
  received_at: string | null;
  created_at: string;
}

interface MeetingActivity {
  id: string;
  lead_id: string;
  type: "meeting_scheduled" | "meeting_cancelled";
  metadata: { cal_uid?: string; starts_at?: string | null; replaces?: string | null } | null;
}

/** Leads still in the pipeline's first stage: nobody has got back to them yet. */
async function freshLeads(db: ReturnType<typeof createServerClient>) {
  const { data: stage } = await db.from("pipeline_stages").select("id").eq("slug", "new").maybeSingle();
  let query = db.from("leads").select("id, name, company, source, service_interest, budget_range, created_at").order("created_at", { ascending: false }).limit(20);
  query = stage ? query.or(`stage_id.eq.${stage.id},stage_id.is.null`) : query.is("stage_id", null);
  const { data } = await query;
  return (data ?? []) as LeadRow[];
}

function openReplies(db: ReturnType<typeof createServerClient>) {
  return db
    .from("outreach_replies")
    .select("id, campaign_id, prospect_id, from_name, from_address, label, summary, received_at, created_at")
    .is("handled_at", null)
    .eq("mode", "live")
    .in("label", OPEN_LABELS)
    .order("created_at", { ascending: false })
    .limit(20);
}

/** Visits in a window: page views carry a session id, one per visitor per day (a hash of their address and browser). */
async function visitsSince(db: ReturnType<typeof createServerClient>, since: string) {
  const ids = new Set<string>();
  for (let from = 0; from < 20_000; from += 1000) {
    const { data } = await db.from("page_views").select("session_id").gte("created_at", since).order("created_at").range(from, from + 999);
    for (const row of data ?? []) if (row.session_id) ids.add(row.session_id);
    if (!data || data.length < 1000) break;
  }
  return ids.size;
}

export async function todayCounts(): Promise<TodayCounts> {
  const db = createServerClient();
  const since = new Date(Date.now() - 7 * DAY).toISOString();
  const [leads, replies, handoffs, received, messages, applications] = await Promise.all([
    freshLeads(db),
    db.from("outreach_replies").select("id", { count: "exact", head: true }).is("handled_at", null).eq("mode", "live").in("label", OPEN_LABELS),
    db.from("assistant_chats").select("id", { count: "exact", head: true }).eq("status", "handoff").is("lead_id", null).gte("updated_at", since),
    db.from("client_requests").select("id", { count: "exact", head: true }).eq("status", "received"),
    db.from("client_messages").select("account_id, request_id, author").order("created_at", { ascending: false }).limit(500),
    db.from("job_applications").select("id", { count: "exact", head: true }).eq("status", "new"),
  ]);
  return {
    leads: leads.length,
    outreach: replies.count ?? 0,
    chats: handoffs.count ?? 0,
    clients: (received.count ?? 0) + awaitingThreads((messages.data ?? []) as ClientMessage[]).length,
    applications: applications.count ?? 0,
  };
}

/** Conversations whose newest message is the client's, newest first. */
function awaitingThreads(messages: Array<Pick<ClientMessage, "account_id" | "request_id" | "author"> & Partial<ClientMessage>>) {
  const latest = new Map<string, (typeof messages)[number]>();
  for (const message of messages) {
    const thread = `${message.account_id}:${message.request_id ?? "general"}`;
    if (!latest.has(thread)) latest.set(thread, message);
  }
  return [...latest.values()].filter((message) => message.author === "client");
}

export async function today(): Promise<Today> {
  const db = createServerClient();
  const now = new Date();
  const weekAgo = new Date(now.getTime() - 7 * DAY).toISOString();
  const fortnightAgo = new Date(now.getTime() - 14 * DAY).toISOString();
  const monthAgo = new Date(now.getTime() - 30 * DAY).toISOString();
  const fortnightOn = new Date(now.getTime() + 14 * DAY);

  const [
    leads,
    replies,
    drafts,
    sending,
    chats,
    applications,
    accounts,
    subscriptions,
    requests,
    messages,
    entries,
    meetings,
    meetingActivities,
    views,
    viewsBefore,
    visits,
    enquiries,
  ] = await Promise.all([
    freshLeads(db),
    openReplies(db),
    db.from("outreach_prospects").select("id", { count: "exact", head: true }).eq("status", "drafted"),
    sendingStatus(),
    db.from("assistant_chats").select("id, page, status, lead_id, gaps, messages, created_at, updated_at").gte("updated_at", weekAgo).order("updated_at", { ascending: false }),
    db.from("job_applications").select("id, full_name, role_title, created_at").eq("status", "new").order("created_at", { ascending: false }).limit(20),
    db.from("client_accounts").select("*"),
    db.from("client_subscriptions").select("*"),
    db.from("client_requests").select("*"),
    db.from("client_messages").select("id, account_id, request_id, author, body, created_at").order("created_at", { ascending: false }).limit(500),
    db.from("client_time_entries").select("*"),
    db.from("client_meetings").select("*").eq("status", "booked").gte("ends_at", now.toISOString()).lte("starts_at", fortnightOn.toISOString()).order("starts_at"),
    db.from("lead_activities").select("id, lead_id, type, metadata").in("type", ["meeting_scheduled", "meeting_cancelled"]).gte("created_at", new Date(now.getTime() - 90 * DAY).toISOString()),
    db.from("page_views").select("id", { count: "exact", head: true }).gte("created_at", weekAgo),
    db.from("page_views").select("id", { count: "exact", head: true }).gte("created_at", fortnightAgo).lt("created_at", weekAgo),
    visitsSince(db, weekAgo),
    db.from("leads").select("id", { count: "exact", head: true }).gte("created_at", monthAgo),
  ]);

  const accountRows = (accounts.data ?? []) as ClientAccount[];
  const accountById = new Map(accountRows.map((account) => [account.id, account]));
  const requestRows = (requests.data ?? []) as ClientRequest[];
  const requestById = new Map(requestRows.map((request) => [request.id, request]));
  const entryRows = (entries.data ?? []) as ClientTimeEntry[];
  const logged = minutesByRequest(entryRows);
  const needs: Need[] = [];

  // Clients first: they're paying for the time.
  for (const message of awaitingThreads((messages.data ?? []) as ClientMessage[])) {
    const account = accountById.get(message.account_id);
    if (!account) continue;
    const request = message.request_id ? requestById.get(message.request_id) : null;
    needs.push({
      id: `message-${message.id}`,
      kind: "client-message",
      title: `${clientName(account)} wrote${request ? ` about ${request.title}` : ""}`,
      detail: excerpt(message.body ?? ""),
      href: request ? requestHref(request) : `/admin/members/${account.id}`,
      at: message.created_at ?? null,
    });
  }
  for (const request of requestRows.filter((row) => row.status === "received")) {
    const account = accountById.get(request.account_id);
    const read =
      request.estimate_state === "initial" && request.estimate_low != null && request.estimate_high != null
        ? `Ask Craefto's read: ${range(Number(request.estimate_low), Number(request.estimate_high))}. Confirm it`
        : "Add an estimate";
    needs.push({
      id: `estimate-${request.id}`,
      kind: "estimate",
      title: request.title,
      detail: `${account ? clientName(account) : "A client"} · ${read}`,
      href: requestHref(request),
      at: request.created_at,
    });
  }
  for (const request of requestRows) {
    if (!isOpen(request) || request.estimate_state !== "approved" || request.estimate_high == null) continue;
    const hours = (logged.get(request.id) ?? 0) / 60;
    if (hours <= Number(request.estimate_high)) continue;
    const account = accountById.get(request.account_id);
    needs.push({
      id: `overrun-${request.id}`,
      kind: "overrun",
      title: `${request.title} is over its estimate`,
      detail: `${account ? clientName(account) : "A client"} · ${shortHours(hours)} logged of up to ${shortHours(Number(request.estimate_high))}. Talk it through with them`,
      href: requestHref(request),
      at: request.updated_at,
    });
  }

  // Warm replies to outreach, then new enquiries.
  const replyRows = (replies.data ?? []) as ReplyRow[];
  const prospectIds = [...new Set(replyRows.map((reply) => reply.prospect_id))];
  const { data: prospects } = prospectIds.length
    ? await db.from("outreach_prospects").select("campaign_id, id, company").in("id", prospectIds)
    : { data: [] as Array<{ campaign_id: string; id: string; company: string }> };
  const companyOf = new Map((prospects ?? []).map((prospect) => [`${prospect.campaign_id}/${prospect.id}`, prospect.company]));
  for (const reply of replyRows) {
    const company = companyOf.get(`${reply.campaign_id}/${reply.prospect_id}`);
    const who = reply.from_name || reply.from_address || "Someone";
    needs.push({
      id: `reply-${reply.id}`,
      kind: "reply",
      title: `${who}${company ? ` at ${company}` : ""} replied`,
      detail: [reply.label ? reply.label.charAt(0).toUpperCase() + reply.label.slice(1) : null, reply.summary ? excerpt(reply.summary, 90) : null].filter(Boolean).join(" · "),
      href: `/admin/outreach/replies/${reply.id}`,
      at: reply.received_at ?? reply.created_at,
    });
  }
  for (const lead of leads) {
    needs.push({
      id: `lead-${lead.id}`,
      kind: "enquiry",
      title: lead.company ? `${lead.name} · ${lead.company}` : lead.name,
      detail: [LEAD_SOURCES[lead.source ?? ""] ?? "Enquiry", enquiryLabel(lead.service_interest), enquiryLabel(lead.budget_range)].filter(Boolean).join(" · "),
      href: `/admin/leads/${lead.id}`,
      at: lead.created_at,
    });
  }

  // Ask Craefto: people who asked for a person but left no details yet.
  const chatRows = (chats.data ?? []) as Array<{ id: string; page: string | null; status: string; lead_id: string | null; gaps: string[]; messages: Array<{ role: string; parts: Array<{ type: string; text?: string }> }>; created_at: string; updated_at: string }>;
  for (const chat of chatRows.filter((row) => row.status === "handoff" && !row.lead_id)) {
    const first = chat.messages.find((message) => message.role === "user")?.parts.find((part) => part.type === "text")?.text;
    needs.push({
      id: `chat-${chat.id}`,
      kind: "handoff",
      title: `Someone asked Ask Craefto for a person${chat.page ? ` on ${chat.page}` : ""}`,
      detail: first ? `“${excerpt(first, 90)}”` : "Read the conversation",
      href: `/admin/chats/${chat.id}`,
      at: chat.updated_at,
    });
  }

  // Applications: one by one when there are a couple, as one line when they've piled up.
  const newApplications = (applications.data ?? []) as Array<{ id: string; full_name: string; role_title: string | null; created_at: string }>;
  if (newApplications.length > 2) {
    const [newest] = newApplications;
    needs.push({
      id: "applications",
      kind: "application",
      title: `${newApplications.length} applications to review`,
      detail: `Newest: ${newest.full_name}${newest.role_title ? `, ${newest.role_title}` : ""}`,
      href: "/admin/applications",
      at: newest.created_at,
    });
  } else {
    for (const application of newApplications) {
      needs.push({
        id: `application-${application.id}`,
        kind: "application",
        title: `${application.full_name} applied`,
        detail: application.role_title ?? "A role at Craefto",
        href: `/admin/applications/${application.id}`,
        at: application.created_at,
      });
    }
  }

  if ((drafts.count ?? 0) > 0) {
    needs.push({
      id: "drafts",
      kind: "drafts",
      title: `${drafts.count} outreach email${drafts.count === 1 ? "" : "s"} to approve`,
      detail: "Nothing is sent until you approve it",
      href: "/admin/outreach",
      at: null,
    });
  }

  // Coming up in the next fortnight: calls first, then delivery dates.
  const upcoming: Upcoming[] = [];
  for (const meeting of (meetings.data ?? []) as ClientMeeting[]) {
    const account = accountById.get(meeting.account_id);
    upcoming.push({
      id: `meeting-${meeting.id}`,
      kind: "client-call",
      title: meeting.title || "Call",
      detail: account ? clientName(account) : "Client call",
      href: `/admin/members/${meeting.account_id}`,
      at: meeting.starts_at,
      allDay: false,
    });
  }
  const activities = (meetingActivities.data ?? []) as MeetingActivity[];
  const cancelled = new Set(activities.filter((row) => row.type === "meeting_cancelled").map((row) => row.metadata?.cal_uid));
  const replaced = new Set(activities.map((row) => row.metadata?.replaces).filter(Boolean));
  const discovery = activities.filter((row) => {
    const uid = row.metadata?.cal_uid;
    const starts = row.metadata?.starts_at;
    return row.type === "meeting_scheduled" && uid && starts && !cancelled.has(uid) && !replaced.has(uid) && new Date(starts) >= now && new Date(starts) <= fortnightOn;
  });
  if (discovery.length) {
    const { data: callers } = await db.from("leads").select("id, name, company").in("id", [...new Set(discovery.map((row) => row.lead_id))]);
    const callerById = new Map((callers ?? []).map((lead) => [lead.id, lead]));
    for (const row of discovery) {
      const lead = callerById.get(row.lead_id);
      upcoming.push({
        id: `discovery-${row.id}`,
        kind: "discovery-call",
        title: "Discovery Call",
        detail: lead ? (lead.company ? `${lead.name} · ${lead.company}` : lead.name) : "A new enquiry",
        href: `/admin/leads/${row.lead_id}`,
        at: row.metadata!.starts_at!,
        allDay: false,
      });
    }
  }
  const todayDate = sydneyToday(now);
  const lastDate = sydneyToday(fortnightOn);
  for (const request of requestRows.filter(isOpen)) {
    const account = accountById.get(request.account_id);
    const who = account ? clientName(account) : "A client";
    if (request.estimate_state === "approved" && request.target_date && request.target_date >= todayDate && request.target_date <= lastDate) {
      upcoming.push({ id: `target-${request.id}`, kind: "target", title: request.title, detail: who, href: requestHref(request), at: request.target_date, allDay: true });
    } else if (request.needed_by && request.needed_by >= todayDate && request.needed_by <= lastDate) {
      upcoming.push({ id: `needed-${request.id}`, kind: "needed-by", title: request.title, detail: who, href: requestHref(request), at: request.needed_by, allDay: true });
    }
  }
  // By day in Sydney; a day's delivery dates before its calls.
  const dayOf = (item: Upcoming) => (item.allDay ? item.at : sydneyToday(new Date(item.at)));
  upcoming.sort((a, b) => dayOf(a).localeCompare(dayOf(b)) || Number(a.allDay ? 0 : 1) - Number(b.allDay ? 0 : 1) || a.at.localeCompare(b.at));

  // The month for each client with hours: used, still to come, what's open.
  const subscriptionRows = (subscriptions.data ?? []) as ClientSubscription[];
  const clients: ClientGlance[] = accountRows
    .map((account) => {
      const own = subscriptionRows.filter((row) => row.account_id === account.id);
      const allowance = allowanceFor(account, own);
      if (!allowance && !own.some(isLive)) return null;
      const theirs = requestRows.filter((row) => row.account_id === account.id);
      const usage = usageFor(allowance, entryRows.filter((entry) => entry.account_id === account.id), theirs);
      return {
        id: account.id,
        name: clientName(account),
        allowance: allowance?.hours ?? null,
        allowanceLabel: allowance?.label ?? null,
        used: usage.used,
        committed: usage.committedHigh,
        open: theirs.filter(isOpen).length,
        waitingOnThem: theirs.filter(isWaitingOnClient).length,
        href: `/admin/members/${account.id}`,
      };
    })
    .filter((client): client is ClientGlance => client !== null)
    .sort((a, b) => a.name.localeCompare(b.name));

  return {
    needs,
    upcoming,
    clients,
    numbers: {
      views: views.count ?? 0,
      viewsBefore: viewsBefore.count ?? 0,
      visits,
      enquiries: enquiries.count ?? 0,
      chats: chatRows.filter((chat) => chat.created_at >= weekAgo).length,
      unanswered: chatRows.reduce((total, chat) => total + (chat.gaps?.length ?? 0), 0),
    },
    outreach: {
      mode: sending.settings.mode,
      sentToday: sending.sentToday,
      queued: sending.queued,
      drafts: drafts.count ?? 0,
      openReplies: replyRows.length,
      inboxReadAt: sending.inbox.readAt,
      inboxError: sending.inbox.error,
    },
  };
}
