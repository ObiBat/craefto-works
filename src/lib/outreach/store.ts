import "server-only";
import { createServerClient } from "@/lib/supabase";
import { approvalCheck, applyBulk, hashOf, OutreachError, suppressionKeys, sydneyDate, type BulkOptions } from "./rules";
import type { Actor, ApprovalCheck, BulkAction, Campaign, Contact, FollowUp, Priority, Prospect, ProspectStatus, ProspectSummary, Research } from "./types";

// Outreach in Supabase (migration 022). Reads return the command centre's
// shapes; every change goes through updateProspect, which applies one of the
// rules in rules.ts to the latest copy, saves it only if nobody changed the
// prospect in the meantime, and adds the history lines.

type Db = ReturnType<typeof createServerClient>;

interface CampaignRow {
  id: string;
  name: string;
  description: string;
  created_at: string;
  updated_at: string;
}

interface ProspectRow {
  campaign_id: string;
  id: string;
  company: string;
  segment: string;
  state: string | null;
  location: string | null;
  website: string;
  research: Partial<Research>;
  contact_kind: Contact["kind"];
  contact_value: string;
  contact_source: string | null;
  priority: Priority;
  status: ProspectStatus;
  email_subject: string | null;
  email_body: string | null;
  email_language: string | null;
  approved_at: string | null;
  approved_by: string | null;
  approved_hash: string | null;
  sent_at: string | null;
  follow_up: FollowUp | null;
  flags: string[];
  notes: string | null;
  created_at: string;
  updated_at: string;
}

interface EventRow {
  campaign_id: string;
  prospect_id: string;
  at: string;
  event: string;
}

const RESEARCH_KEYS = ["businessType", "size", "journey", "systems", "applicationMethod", "metrics", "findings", "branding", "whyFit", "shots", "checkedAt"] as const satisfies readonly (keyof Research)[];

function researchOf(source: Partial<Research>): Research {
  const research: Partial<Research> = {};
  for (const key of RESEARCH_KEYS) if (source[key] !== undefined) Object.assign(research, { [key]: source[key] });
  return { ...research, findings: research.findings ?? [] };
}

/** A sent day (YYYY-MM-DD) as a time: now when it's today, otherwise midday in Sydney. */
function sentTime(day: string, now = new Date()) {
  return day === sydneyDate(now) ? now.toISOString() : new Date(`${day}T02:00:00Z`).toISOString();
}

const iso = (value: string) => new Date(value).toISOString();

function toProspect(row: ProspectRow, events: EventRow[]): Prospect {
  const hasEmail = row.email_subject !== null || row.email_body !== null;
  const prospect: Prospect = {
    ...researchOf(row.research),
    id: row.id,
    campaignId: row.campaign_id,
    company: row.company,
    segment: row.segment,
    ...(row.state ? { state: row.state } : {}),
    ...(row.location ? { location: row.location } : {}),
    website: row.website,
    contact: { kind: row.contact_kind, value: row.contact_value, ...(row.contact_source ? { source: row.contact_source } : {}) },
    priority: row.priority,
    status: row.status,
    ...(hasEmail
      ? {
          email: {
            subject: row.email_subject ?? "",
            body: row.email_body ?? "",
            ...(row.email_language ? { language: row.email_language } : {}),
            ...(row.approved_at ? { approvedAt: iso(row.approved_at) } : {}),
            ...(row.approved_by ? { approvedBy: row.approved_by } : {}),
            ...(row.approved_hash ? { approvedHash: row.approved_hash } : {}),
            ...(row.sent_at ? { sentAt: sydneyDate(new Date(row.sent_at)) } : {}),
          },
        }
      : {}),
    ...(row.follow_up ? { followUp: row.follow_up } : {}),
    flags: row.flags ?? [],
    ...(row.notes !== null ? { notes: row.notes } : {}),
    timeline: events.map((event) => ({ at: iso(event.at), event: event.event })),
    // Kept exactly as stored: it's the version a save checks against.
    updatedAt: row.updated_at,
  };
  const hash = hashOf(prospect);
  return hash ? { ...prospect, emailHash: hash } : prospect;
}

/** The columns a change can write (sent_at is handled on its own, see updateProspect). */
function columnsOf(p: Prospect) {
  return {
    company: p.company,
    segment: p.segment,
    state: p.state ?? null,
    location: p.location ?? null,
    website: p.website,
    research: researchOf(p),
    contact_kind: p.contact.kind,
    contact_value: p.contact.value,
    contact_source: p.contact.source ?? null,
    priority: p.priority,
    status: p.status,
    email_subject: p.email?.subject ?? null,
    email_body: p.email?.body ?? null,
    email_language: p.email?.language ?? null,
    approved_at: p.email?.approvedAt ?? null,
    approved_by: p.email?.approvedBy ?? null,
    approved_hash: p.email?.approvedHash ?? null,
    follow_up: p.followUp ?? null,
    flags: p.flags ?? [],
    notes: p.notes ?? null,
  };
}

/** Reads every row a query returns, a page at a time: the API returns at most 1,000 per request. */
async function everyRow<T>(page: (from: number, to: number) => PromiseLike<{ data: T[] | null; error: unknown }>): Promise<T[]> {
  const size = 1000;
  const rows: T[] = [];
  for (let from = 0; ; from += size) {
    const { data, error } = await page(from, from + size - 1);
    if (error) throw error;
    rows.push(...(data ?? []));
    if (!data || data.length < size) return rows;
  }
}

const key = (campaignId: string, prospectId: string) => `${campaignId}/${prospectId}`;

function byProspect(events: EventRow[]) {
  const grouped = new Map<string, EventRow[]>();
  for (const event of events) {
    const k = key(event.campaign_id, event.prospect_id);
    grouped.set(k, [...(grouped.get(k) ?? []), event]);
  }
  return grouped;
}

function toCampaign(row: CampaignRow, prospects: Prospect[]): Campaign {
  const latest = prospects.reduce((at, p) => (p.updatedAt > at ? p.updatedAt : at), row.updated_at);
  return { id: row.id, name: row.name, description: row.description, createdAt: iso(row.created_at), updatedAt: iso(latest), prospects };
}

const EVENT_COLUMNS = "campaign_id, prospect_id, at, event";

async function readEvents(db: Db, filter: { campaignId?: string; prospectId?: string } = {}) {
  return everyRow<EventRow>((from, to) => {
    let query = db.from("outreach_events").select(EVENT_COLUMNS);
    if (filter.campaignId) query = query.eq("campaign_id", filter.campaignId);
    if (filter.prospectId) query = query.eq("prospect_id", filter.prospectId);
    return query.order("at", { ascending: false }).order("id", { ascending: false }).range(from, to);
  });
}

/** Every campaign, newest first, with its prospects and their history. */
export async function listCampaigns(): Promise<Campaign[]> {
  const db = createServerClient();
  const [campaigns, prospects, events] = await Promise.all([
    everyRow<CampaignRow>((from, to) => db.from("outreach_campaigns").select("*").order("created_at", { ascending: false }).range(from, to)),
    everyRow<ProspectRow>((from, to) => db.from("outreach_prospects").select("*").order("campaign_id").order("id").range(from, to)),
    readEvents(db),
  ]);
  const history = byProspect(events);
  return campaigns.map((campaign) =>
    toCampaign(
      campaign,
      prospects.filter((p) => p.campaign_id === campaign.id).map((p) => toProspect(p, history.get(key(p.campaign_id, p.id)) ?? [])),
    ),
  );
}

export async function getCampaign(id: string): Promise<Campaign | null> {
  const db = createServerClient();
  const { data: campaign, error } = await db.from("outreach_campaigns").select("*").eq("id", id).maybeSingle<CampaignRow>();
  if (error) throw error;
  if (!campaign) return null;
  const [prospects, events] = await Promise.all([
    everyRow<ProspectRow>((from, to) => db.from("outreach_prospects").select("*").eq("campaign_id", id).order("id").range(from, to)),
    readEvents(db, { campaignId: id }),
  ]);
  const history = byProspect(events);
  return toCampaign(
    campaign,
    prospects.map((p) => toProspect(p, history.get(key(p.campaign_id, p.id)) ?? [])),
  );
}

const SUMMARY_COLUMNS = "campaign_id, id, company, segment, location, website, contact_kind, contact_value, contact_source, priority, status, email_subject, flags, updated_at";

/** The admin queue: campaigns, and every prospect without its research, email body or history. */
export async function listSummaries() {
  const db = createServerClient();
  const [campaigns, prospects] = await Promise.all([
    everyRow<CampaignRow>((from, to) => db.from("outreach_campaigns").select("*").order("created_at", { ascending: false }).range(from, to)),
    everyRow<Pick<ProspectRow, "campaign_id" | "id" | "company" | "segment" | "location" | "website" | "contact_kind" | "contact_value" | "contact_source" | "priority" | "status" | "email_subject" | "flags" | "updated_at">>((from, to) =>
      db.from("outreach_prospects").select(SUMMARY_COLUMNS).order("campaign_id").order("id").range(from, to),
    ),
  ]);
  return {
    campaigns: campaigns.map((c) => ({ id: c.id, name: c.name, description: c.description, createdAt: iso(c.created_at) })),
    prospects: prospects.map(
      (p): ProspectSummary => ({
        campaignId: p.campaign_id,
        id: p.id,
        company: p.company,
        segment: p.segment,
        ...(p.location ? { location: p.location } : {}),
        website: p.website,
        contact: { kind: p.contact_kind, value: p.contact_value, ...(p.contact_source ? { source: p.contact_source } : {}) },
        priority: p.priority,
        status: p.status,
        ...(p.email_subject ? { subject: p.email_subject } : {}),
        flags: p.flags ?? [],
        updatedAt: p.updated_at,
      }),
    ),
  };
}

async function readRow(db: Db, campaignId: string, id: string) {
  const { data, error } = await db.from("outreach_prospects").select("*").eq("campaign_id", campaignId).eq("id", id).maybeSingle<ProspectRow>();
  if (error) throw error;
  if (!data) throw new OutreachError("No such prospect", 404);
  return data;
}

async function withHistory(db: Db, row: ProspectRow) {
  return toProspect(row, await readEvents(db, { campaignId: row.campaign_id, prospectId: row.id }));
}

export async function getProspect(campaignId: string, id: string): Promise<Prospect | null> {
  const db = createServerClient();
  try {
    return await withHistory(db, await readRow(db, campaignId, id));
  } catch (error) {
    if (error instanceof OutreachError && error.status === 404) return null;
    throw error;
  }
}

type Suppression = { value: string; reason: string };

/** The do-not-email entries covering these addresses and domains, by value. */
async function suppressions(db: Db, values: string[]) {
  const found = new Map<string, Suppression>();
  if (!values.length) return found;
  const { data, error } = await db.from("outreach_suppressions").select("value, reason").in("value", [...new Set(values)]);
  if (error) throw error;
  for (const row of (data ?? []) as Suppression[]) found.set(row.value, row);
  return found;
}

const coveredBy = (p: Prospect, list: Map<string, Suppression>) => suppressionKeys(p).map((value) => list.get(value)).find(Boolean) ?? null;

/** The approval check for a prospect, with the do-not-email list consulted. */
export async function checkProspect(p: Prospect): Promise<ApprovalCheck> {
  return approvalCheck(p, coveredBy(p, await suppressions(createServerClient(), suppressionKeys(p))));
}

export type Change = (prospect: Prospect, context: { check: () => Promise<ApprovalCheck> }) => string | string[] | null | void | Promise<string | string[] | null | void>;

/**
 * Applies a change to the latest copy of a prospect and saves it, provided
 * nobody saved it in between (otherwise it starts again from their version).
 * Returns the saved row and whether anything changed.
 */
async function save(db: Db, campaignId: string, id: string, actor: Actor, change: Change, now = new Date()) {
  for (let attempt = 0; attempt < 3; attempt++) {
    const row = await readRow(db, campaignId, id);
    const before = toProspect(row, []);
    const after = structuredClone(before);
    const result = await change(after, {
      check: async () => approvalCheck(after, coveredBy(after, await suppressions(db, suppressionKeys(after)))),
    });
    const lines = [result].flat().filter((line): line is string => typeof line === "string" && line.length > 0);

    const next = columnsOf(after) as Record<string, unknown>;
    const prev = columnsOf(before) as Record<string, unknown>;
    const patch: Record<string, unknown> = {};
    for (const column of Object.keys(next)) if (JSON.stringify(next[column]) !== JSON.stringify(prev[column])) patch[column] = next[column];
    if (before.email?.sentAt !== after.email?.sentAt) patch.sent_at = after.email?.sentAt ? sentTime(after.email.sentAt, now) : null;
    if (!Object.keys(patch).length && !lines.length) return { row, changed: false };

    let saved = row;
    if (Object.keys(patch).length) {
      const { data, error } = await db.from("outreach_prospects").update(patch).eq("campaign_id", campaignId).eq("id", id).eq("updated_at", row.updated_at).select("*");
      if (error) throw error;
      if (!data?.length) continue;
      saved = data[0] as ProspectRow;
    }
    if (lines.length) {
      const at = now.toISOString();
      const { error } = await db.from("outreach_events").insert(lines.map((event) => ({ campaign_id: campaignId, prospect_id: id, at, event, actor })));
      if (error) console.error(`Outreach ${campaignId}/${id}: saved, but its history didn't record "${lines.join('", "')}":`, error);
    }
    return { row: saved, changed: true };
  }
  throw new OutreachError("Someone else is changing this prospect right now. Try again in a moment.");
}

/** Applies a change to one prospect and returns it as saved, with its history. */
export async function updateProspect(campaignId: string, id: string, actor: Actor, change: Change): Promise<Prospect> {
  const db = createServerClient();
  const { row } = await save(db, campaignId, id, actor, change);
  return withHistory(db, row);
}

/** Runs tasks a few at a time. */
async function pool<T, R>(items: T[], size: number, task: (item: T) => Promise<R>): Promise<R[]> {
  const results: R[] = new Array(items.length);
  let next = 0;
  await Promise.all(
    Array.from({ length: Math.min(size, items.length) }, async () => {
      while (next < items.length) {
        const index = next++;
        results[index] = await task(items[index]);
      }
    }),
  );
  return results;
}

export interface BulkItem {
  campaignId: string;
  id: string;
  /** "approve": the fingerprint of the email as shown; a changed email is skipped. */
  hash?: string;
}

/** One action across many prospects. Returns how many changed; the rest didn't apply. */
export async function bulkUpdate(items: BulkItem[], action: BulkAction, options: Omit<BulkOptions, "now" | "check" | "hash">) {
  const db = createServerClient();
  const unique = [...new Map(items.map((item) => [key(item.campaignId, item.id), item])).values()];
  const results = await pool(unique, 6, async (item) => {
    try {
      const { changed } = await save(db, item.campaignId, item.id, options.actor, async (p, { check }) =>
        applyBulk(p, action, { ...options, now: new Date(), hash: item.hash, check: action === "approve" && p.status === "drafted" ? await check() : undefined }),
      );
      return changed;
    } catch (error) {
      if (error instanceof OutreachError) return false;
      throw error;
    }
  });
  const changed = results.filter(Boolean).length;
  return { changed, skipped: items.length - changed };
}

/** The research a campaign file holds for one prospect, as the command centre writes it. */
export interface ImportedProspect extends Research {
  id: string;
  company: string;
  segment: string;
  state?: string;
  location?: string;
  website: string;
  contact: Contact;
  priority: Priority;
  status: ProspectStatus;
  email?: { subject: string; body: string; language?: string; sentAt?: string };
  followUp?: FollowUp;
  flags?: string[];
  notes?: string;
  timeline: { at: string; event: string }[];
}

export interface ImportedCampaign {
  id: string;
  name: string;
  description: string;
  createdAt: string;
  prospects: ImportedProspect[];
}

const APPROVAL_CLEARED = "Approval cleared when outreach moved to craefto.com: approve it again";

/**
 * Adds a researched campaign: the campaign if it's new, the prospects it
 * doesn't have yet and their history. Never changes what's already there, so
 * running it twice adds nothing. Approvals don't carry over: they're given
 * again here, against the email's fingerprint.
 */
export async function importCampaign(campaign: ImportedCampaign) {
  const db = createServerClient();
  const { data: created, error: campaignError } = await db
    .from("outreach_campaigns")
    .upsert({ id: campaign.id, name: campaign.name, description: campaign.description, created_at: campaign.createdAt }, { onConflict: "id", ignoreDuplicates: true })
    .select("id");
  if (campaignError) throw campaignError;

  const rows = campaign.prospects.map((p) => {
    const sentDay = p.email?.sentAt?.slice(0, 10);
    const first = p.timeline.map((entry) => entry.at).sort()[0];
    return {
      campaign_id: campaign.id,
      id: p.id,
      company: p.company,
      segment: p.segment,
      state: p.state ?? null,
      location: p.location ?? null,
      website: p.website,
      research: researchOf(p),
      contact_kind: p.contact.kind,
      contact_value: p.contact.kind === "email" ? p.contact.value.trim().toLowerCase() : p.contact.value.trim(),
      contact_source: p.contact.source ?? null,
      priority: p.priority,
      status: p.status === "approved" ? "drafted" : p.status,
      email_subject: p.email?.subject ?? null,
      email_body: p.email?.body ?? null,
      email_language: p.email?.language ?? null,
      sent_at: sentDay ? sentTime(sentDay) : null,
      follow_up: p.followUp ?? null,
      flags: p.flags ?? [],
      notes: p.notes ?? null,
      created_at: first ?? campaign.createdAt,
    };
  });
  const { data: added, error: prospectError } = await db.from("outreach_prospects").upsert(rows, { onConflict: "campaign_id,id", ignoreDuplicates: true }).select("id");
  if (prospectError) throw prospectError;
  const addedIds = new Set((added ?? []).map((row) => row.id as string));

  // History for the prospects that have none yet: the ones just added, or
  // ones whose history didn't arrive on an earlier run.
  const recorded = new Set((await readEvents(db, { campaignId: campaign.id })).map((event) => event.prospect_id));
  const now = new Date().toISOString();
  const events = campaign.prospects
    .filter((p) => !recorded.has(p.id))
    .flatMap((p) => [
      // Oldest first, so lines with the same time keep the file's order (newest has the highest id).
      ...[...p.timeline].reverse().map((entry) => ({ campaign_id: campaign.id, prospect_id: p.id, at: entry.at, event: entry.event, actor: "import" })),
      ...(p.status === "approved" && addedIds.has(p.id) ? [{ campaign_id: campaign.id, prospect_id: p.id, at: now, event: APPROVAL_CLEARED, actor: "import" }] : []),
    ]);
  for (let i = 0; i < events.length; i += 500) {
    const { error } = await db.from("outreach_events").upsert(events.slice(i, i + 500), { onConflict: "campaign_id,prospect_id,at,event", ignoreDuplicates: true });
    if (error) throw error;
  }

  return {
    created: (created ?? []).length > 0,
    added: addedIds.size,
    kept: campaign.prospects.length - addedIds.size,
    history: events.length,
    approvalsCleared: campaign.prospects.filter((p) => p.status === "approved" && addedIds.has(p.id)).length,
  };
}
