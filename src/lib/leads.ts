import "server-only";
import { z } from "zod";
import { createServerClient } from "@/lib/supabase";
import { resend, EMAIL_FROM, ADMIN_EMAIL, isEmailEnabled } from "@/lib/resend";
import { siteConfig } from "@/lib/constants";
import { BUDGETS, ENQUIRY_VALUES, TIMELINES, enquiryLabel, enquiryPhrase } from "@/lib/enquiry";
import { enquiryConfirmationEmail } from "@/emails/enquiry";
import { alertEmail } from "@/emails/portal";

// Leads: the one way into the sales pipeline. The website form uses it now;
// Discovery Call bookings (api/cal/webhook), and later the website assistant
// and outreach replies, file their leads through createLead, so every lead is
// validated, scored, logged and announced the same way.

type Db = ReturnType<typeof createServerClient>;

export type LeadSource = "website" | "cal" | "chat" | "outreach";

const SOURCE_LABELS: Record<LeadSource, string> = {
  website: "Website form",
  cal: "Discovery Call booking",
  chat: "Website assistant",
  outreach: "Outreach reply",
};

export const BOOKING_URL = `https://cal.com/${siteConfig.calLink}`;

// ── Input ─────────────────────────────────────────────────────────────────

/** Control characters out, and single-line fields kept to one line. */
const oneLine = (value: string) => value.replace(/[\u0000-\u001f\u007f]+/g, " ").trim();
const multiLine = (value: string) => value.replace(/[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f]+/g, "").trim();

const optionalLine = (max: number) =>
  z
    .string()
    .max(max)
    .nullish()
    .transform((value) => (value ? oneLine(value) || null : null));

/** A known value, or nothing: an unknown one is dropped rather than refused. */
const oneOf = (values: string[]) =>
  z
    .string()
    .nullish()
    .transform((value) => (value && values.includes(value) ? value : null));

export const leadInputSchema = z.object({
  name: z.string({ error: "Please tell us your name." }).max(100, "That name is too long.").transform(oneLine).pipe(z.string().min(1, "Please tell us your name.")),
  email: z
    .string({ error: "Please enter your email address." })
    .max(254, "That email address is too long.")
    .transform((value) => value.trim().toLowerCase())
    .pipe(z.email("Please enter a valid email address.")),
  company: optionalLine(120),
  phone: optionalLine(40),
  service: oneOf(ENQUIRY_VALUES),
  budget: oneOf(BUDGETS.map((band) => band.value)),
  timeline: oneOf(TIMELINES.map((timeline) => timeline.value)),
  message: z
    .string()
    .max(5000, "That message is too long. Please keep it under 5,000 characters.")
    .nullish()
    .transform((value) => (value ? multiLine(value) || null : null)),
  utm_source: optionalLine(200),
  utm_medium: optionalLine(200),
  utm_campaign: optionalLine(200),
  utm_content: optionalLine(200),
  landing_page: optionalLine(500),
});

export type LeadInput = z.output<typeof leadInputSchema>;

const CHECK_THE_FORM = "Please check the form and try again.";

/**
 * The first problem with a submission, in words a visitor can act on. Zod's
 * own messages ("Invalid input: expected string…") only come from malformed
 * requests, never the form, so they get the general one.
 */
export function firstProblem(error: z.ZodError): string {
  const message = error.issues[0]?.message;
  return message && !message.startsWith("Invalid input") ? message : CHECK_THE_FORM;
}

// ── Scoring ───────────────────────────────────────────────────────────────

export function calculateLeadScore(data: Pick<LeadInput, "budget" | "timeline" | "service" | "company" | "message">): number {
  const budgetScores: Record<string, number> = {
    "50k+": 40,
    "25-50k": 35,
    "10-25k": 25,
    "5-10k": 15,
    "3-5k": 10,
    "under-3k": 5,
    // A monthly plan is recurring: a year of the smallest is about A$29k.
    monthly: 35,
    discuss: 5,
  };
  const timelineScores: Record<string, number> = { asap: 25, "1-3months": 20, "3-6months": 10, flexible: 5 };
  const serviceScores: Record<string, number> = { saas: 15, ai: 15, web: 12, brand: 10, media: 10, growth: 10, other: 5 };

  let score = budgetScores[data.budget ?? ""] ?? 0;
  score += timelineScores[data.timeline ?? ""] ?? 0;
  score += serviceScores[data.service ?? ""] ?? 0;
  if (data.company) score += 10;
  const length = data.message?.length ?? 0;
  score += length > 200 ? 10 : length > 100 ? 7 : length > 50 ? 4 : 0;
  return Math.min(score, 100);
}

// ── Rate limit ────────────────────────────────────────────────────────────

const LIMIT = 5;
const WINDOW_MS = 60 * 60 * 1000;

/**
 * Five leads an hour from one address, counted in the leads table itself so
 * the limit holds across serverless instances and cold starts.
 */
export async function tooManyFrom(ip: string | null): Promise<boolean> {
  if (!ip || ip === "unknown") return false;
  const since = new Date(Date.now() - WINDOW_MS).toISOString();
  const { count, error } = await createServerClient()
    .from("leads")
    .select("id", { count: "exact", head: true })
    .eq("ip_address", ip)
    .gte("created_at", since);
  return !error && typeof count === "number" && count >= LIMIT;
}

// ── Creating a lead ───────────────────────────────────────────────────────

type ActivityType =
  | "form_submission"
  | "email_sent"
  | "note_added"
  | "meeting_scheduled"
  | "meeting_cancelled"
  | "stage_changed";

export interface Activity {
  type: ActivityType;
  title: string;
  description?: string;
  metadata?: Record<string, unknown>;
}

export interface LeadRow {
  id: string;
  name: string;
  email: string;
  company: string | null;
  phone: string | null;
  service_interest: string | null;
  budget_range: string | null;
  timeline: string | null;
  message: string | null;
  score: number;
  source: string;
  landing_page: string | null;
  stage_id: string | null;
}

export async function logActivity(db: Db, leadId: string, activity: Activity, actor: "system" | "admin" | "lead" = "system") {
  const { error } = await db.from("lead_activities").insert({
    lead_id: leadId,
    type: activity.type,
    title: activity.title,
    description: activity.description ?? null,
    metadata: activity.metadata ?? {},
    actor_type: actor,
  });
  if (error) console.error(`Failed to log "${activity.type}" for lead ${leadId}:`, error);
}

/** The owner's alert: who it is, what they want, and a link straight to the lead. */
function leadAlert(lead: LeadRow, eyebrow: string, extra: Array<[string, string | null | undefined]> = []) {
  const budget = enquiryLabel(lead.budget_range);
  return alertEmail({
    eyebrow,
    subject: `${eyebrow}: ${lead.name}${lead.company ? ` (${lead.company})` : ""}${budget ? ` · ${budget}` : ""}`,
    heading: lead.name,
    rows: [
      ...extra,
      ["Email", lead.email],
      ["Company", lead.company],
      ["Phone", lead.phone],
      ["About", enquiryLabel(lead.service_interest)],
      ["Budget", budget],
      ["Timeline", enquiryLabel(lead.timeline)],
      ["Score", `${lead.score} / 100`],
      ["Source", SOURCE_LABELS[lead.source as LeadSource] ?? lead.source],
      ["Page", lead.landing_page],
    ],
    text: lead.message ?? undefined,
    link: `${siteConfig.url}/admin/leads/${lead.id}`,
  });
}

async function sendLogged(db: Db, leadId: string, template: string, message: { to: string; subject: string; html: string; replyTo?: string }) {
  try {
    const result = await resend.emails.send({ from: EMAIL_FROM, ...message });
    if (result.error) throw result.error;
    await db.from("email_logs").insert({
      lead_id: leadId,
      to_email: message.to,
      from_email: EMAIL_FROM,
      subject: message.subject,
      template,
      status: "sent",
      resend_id: result.data?.id ?? null,
    });
    return true;
  } catch (error) {
    console.error(`Failed to send ${template} for lead ${leadId}:`, error);
    return false;
  }
}

/** Tells the owner about a lead, with replies going straight to the person. */
export async function alertOwner(db: Db, lead: LeadRow, eyebrow: string, extra?: Array<[string, string | null | undefined]>) {
  if (!isEmailEnabled()) return;
  const email = leadAlert(lead, eyebrow, extra);
  await sendLogged(db, lead.id, "admin-notification", { to: ADMIN_EMAIL, subject: email.subject, html: email.html, replyTo: lead.email });
}

export interface LeadContext {
  source: LeadSource;
  ip?: string | null;
  userAgent?: string | null;
  referrer?: string | null;
  /** Send the enquirer the "we've received it" email (off for bookings: Cal.com confirms those). */
  confirm?: boolean;
  /** The first entry in the lead's history. */
  activity?: Activity;
  /** The alert's eyebrow and subject prefix ("New enquiry"). */
  alert?: string;
  alertRows?: Array<[string, string | null | undefined]>;
}

export async function createLead(input: LeadInput, context: LeadContext): Promise<LeadRow> {
  const db = createServerClient();
  const row = {
    name: input.name,
    email: input.email,
    company: input.company,
    phone: input.phone,
    service_interest: input.service,
    budget_range: input.budget,
    timeline: input.timeline,
    message: input.message,
    score: calculateLeadScore(input),
    source: context.source,
    utm_source: input.utm_source,
    utm_medium: input.utm_medium,
    utm_campaign: input.utm_campaign,
    utm_content: input.utm_content,
    referrer: context.referrer ?? null,
    landing_page: input.landing_page,
    ip_address: context.ip ?? null,
    user_agent: context.userAgent ?? null,
  };

  const { data: lead, error } = await db.from("leads").insert(row).select().single<LeadRow>();
  if (error || !lead) throw error ?? new Error("Lead insert returned nothing");

  await logActivity(
    db,
    lead.id,
    context.activity ?? {
      type: "form_submission",
      title: "Enquiry received",
      description: `Submitted through the ${SOURCE_LABELS[context.source].toLowerCase()}`,
      metadata: { page: input.landing_page, utm_source: input.utm_source, utm_campaign: input.utm_campaign },
    }
  );

  if (isEmailEnabled()) {
    if (context.confirm !== false) {
      const email = enquiryConfirmationEmail({ name: lead.name, phrase: enquiryPhrase(lead.service_interest), bookingUrl: BOOKING_URL });
      const sent = await sendLogged(db, lead.id, "lead-confirmation", { to: lead.email, subject: email.subject, html: email.html });
      if (sent) await logActivity(db, lead.id, { type: "email_sent", title: "Confirmation email sent" });
    }
    await alertOwner(db, lead, context.alert ?? "New enquiry", context.alertRows);
  }

  return lead;
}
