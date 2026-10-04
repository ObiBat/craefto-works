import { createHash } from "node:crypto";
import { EDITABLE, type ApprovalCheck, type Actor, type BulkAction, type Priority, type Prospect, type ProspectStatus, type Research, type StatusAction } from "./types";

// The rules every change to a prospect goes through, from the command centre
// or from craefto.com/admin alike: which status changes are allowed, what has
// to be true before an email is approved, and what goes in its history. Pure
// functions on a prospect; the store (store.ts) reads and saves.

/** A refusal to show as it is: the request asked for something the rules don't allow. */
export class OutreachError extends Error {
  constructor(
    message: string,
    readonly status = 409,
  ) {
    super(message);
  }
}

export const FOLLOW_UP_TEMPLATE = `Hi again,

Just bringing my note below back to the top of your inbox in case it got buried. If a one-page list of fixes for your site would help, reply and I'll send it over.

Obi

If you'd rather not hear from me, reply "no thanks" and I won't write again.`;

export const ACTION_LABEL: Record<StatusAction, string> = {
  approve: "Email approved",
  draft: "Back to draft",
  sent: "Marked as sent",
  "followup-sent": "Follow-up marked as sent",
  replied: "Replied",
  meeting: "Meeting booked",
  won: "Won",
  lost: "Lost",
  "not-a-fit": "Marked not a fit",
  reopen: "Reopened",
};

const CLOSED: ProspectStatus[] = ["won", "lost", "not-a-fit"];

/** The statuses each action can start from. */
const FROM: Record<Exclude<StatusAction, "followup-sent">, ProspectStatus[]> = {
  approve: ["drafted"],
  draft: ["approved"],
  sent: ["approved"],
  replied: ["sent"],
  meeting: ["sent", "replied"],
  won: ["sent", "replied", "meeting"],
  lost: ["sent", "replied", "meeting"],
  "not-a-fit": ["researched", "drafted", "approved", "sent", "replied", "meeting", "lost"],
  reopen: CLOSED,
};

const TARGET: Record<Exclude<StatusAction, "followup-sent" | "reopen">, ProspectStatus> = {
  approve: "approved",
  draft: "drafted",
  sent: "sent",
  replied: "replied",
  meeting: "meeting",
  won: "won",
  lost: "lost",
  "not-a-fit": "not-a-fit",
};

const REFUSAL: Record<Exclude<StatusAction, "followup-sent">, string> = {
  approve: "Only a draft can be approved",
  draft: "Only an approved email can go back to draft",
  sent: "Approve the email before marking it sent",
  replied: "Mark the email sent before recording a reply",
  meeting: "Mark the email sent before booking a meeting",
  won: "Mark the email sent before marking it won",
  lost: "Mark the email sent before marking it lost",
  "not-a-fit": "This prospect is already closed",
  reopen: "Only a closed prospect can be reopened",
};

/** Text in square brackets that still needs writing. */
export const PLACEHOLDER = /\[[^\]\n]{2,800}\]/;
export const hasPlaceholders = (...texts: string[]) => texts.some((text) => PLACEHOLDER.test(text));

/** The opt-out line the Spam Act requires (s18). */
const OPT_OUT = /no thanks|unsubscribe/i;
/** Who it's from, which the Spam Act requires (s17). */
const SENDER = /craefto/i;
const ADDRESS = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;

/** Shared mailbox names, as the command centre's research records them (systems.ts). */
const SHARED_MAILBOX =
  /^(info|admin|office|reception|enquiries|enquiry|hello|contact|sales|rentals|rental|leasing|lease|pm|property|properties|propertymanagement|management|accounts|maintenance|repairs|applications|apply|team|mail|general)$/i;
/** Words that mark a longer mailbox name as a role's, like info2024@ or rentalreception@. */
const ROLE_WORD = /info|admin|office|reception|enquir|hello|contact|sales|rental|leasing|propert|manage|account|maintenance|repair|applica|team|mail|general|assist|strata|export|support|service|booking/i;

/** Whether an address looks like a shared mailbox rather than a person's own. */
export function looksShared(address: string) {
  const local = address.split("@")[0] ?? "";
  return SHARED_MAILBOX.test(local) || ROLE_WORD.test(local.replace(/[^a-z]/gi, ""));
}

export function hostOf(url: string) {
  try {
    return new URL(url).hostname.replace(/^www\./, "").toLowerCase();
  } catch {
    return "";
  }
}

/** The do-not-email entries that would cover this prospect: its address and its domain. */
export function suppressionKeys(p: Pick<Prospect, "contact" | "website">): string[] {
  if (p.contact.kind === "email") {
    const address = p.contact.value.trim().toLowerCase();
    const domain = address.split("@")[1];
    return domain ? [address, `@${domain}`] : [address];
  }
  const host = hostOf(p.website);
  return host ? [`@${host}`] : [];
}

/** Today in Sydney, YYYY-MM-DD. */
export function sydneyDate(at: Date = new Date()) {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "Australia/Sydney", year: "numeric", month: "2-digit", day: "2-digit" }).format(at);
}

export function addDays(day: string, days: number) {
  const date = new Date(`${day}T00:00:00Z`);
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString().slice(0, 10);
}

/** A fingerprint of an email exactly as it would go out: recipient, subject and body. */
export function emailHash(to: string, subject: string, body: string) {
  return createHash("sha256").update(JSON.stringify([to.trim().toLowerCase(), subject, body])).digest("hex");
}

export const hashOf = (p: Pick<Prospect, "contact" | "email">) => (p.email ? emailHash(p.contact.value, p.email.subject, p.email.body) : undefined);

const REASON: Record<string, string> = { "opt-out": "they opted out", bounce: "it bounced", complaint: "they complained", manual: "added by hand" };

/**
 * What has to be true before an email is approved. Blocks stop the approval;
 * warnings are shown next to it. The same check runs again before sending.
 */
export function approvalCheck(p: Prospect, suppressed?: { value: string; reason: string } | null): ApprovalCheck {
  const blocks: string[] = [];
  const warnings: string[] = [];
  const subject = p.email?.subject.trim() ?? "";
  const body = p.email?.body.trim() ?? "";

  if (p.email?.sentAt) blocks.push(`This email was already sent, on ${p.email.sentAt}`);
  if (!subject || !body) blocks.push("Write the email before approving it");
  else {
    if (hasPlaceholders(subject, body)) blocks.push("Fill in the [bracketed] parts before approving");
    if (!OPT_OUT.test(body)) blocks.push('Keep the line that lets them opt out (reply "no thanks")');
    if (!SENDER.test(body)) blocks.push("Sign it from Craefto Works, so they know who it's from");
  }

  const { kind, value, source } = p.contact;
  if (kind === "none") blocks.push("There's no published way to contact them");
  if (kind === "email") {
    if (!ADDRESS.test(value.trim())) blocks.push(`${value || "The address"} isn't a valid email address`);
    else if (!looksShared(value)) warnings.push(`Check ${value} is a shared mailbox, not a person's own address`);
    if (!source?.trim()) blocks.push("Record where the address is published before approving");
  }
  if (suppressed) {
    const who = suppressed.value.startsWith("@") ? `Everyone at ${suppressed.value.slice(1)}` : suppressed.value;
    blocks.push(`${who} is on the do-not-email list (${REASON[suppressed.reason] ?? suppressed.reason})`);
  }
  warnings.push(...(p.flags ?? []));
  return { blocks, warnings };
}

function clearApproval(p: Prospect) {
  if (!p.email) return;
  const email = { ...p.email };
  delete email.approvedAt;
  delete email.approvedBy;
  delete email.approvedHash;
  p.email = email;
}

export interface ProspectPatch {
  email?: { subject: string; body: string };
  notes?: string;
  priority?: Priority;
  followUpBody?: string;
}

/** Applies edits and returns the history lines. Changing an approved email sends it back for approval. */
export function applyEdit(p: Prospect, patch: ProspectPatch): string[] {
  const lines: string[] = [];
  if (patch.email) {
    const changed = !p.email || p.email.subject !== patch.email.subject || p.email.body !== patch.email.body;
    if (changed) {
      if (!EDITABLE.includes(p.status)) throw new OutreachError("This email has gone out, so it can't be changed");
      p.email = { ...p.email, subject: patch.email.subject, body: patch.email.body };
      if (p.status === "approved") {
        p.status = "drafted";
        clearApproval(p);
        lines.push("Email edited after approval, so it needs approving again");
      } else if (p.status === "researched") {
        p.status = "drafted";
        lines.push("Email drafted");
      } else lines.push("Email edited");
    }
  }
  if (patch.notes !== undefined) p.notes = patch.notes;
  if (patch.priority && patch.priority !== p.priority) {
    lines.push(`Priority ${p.priority} → ${patch.priority}`);
    p.priority = patch.priority;
  }
  if (patch.followUpBody !== undefined && p.followUp && patch.followUpBody !== p.followUp.body) {
    if (p.followUp.sentAt) throw new OutreachError("The follow-up has gone out, so it can't be changed");
    p.followUp = { ...p.followUp, body: patch.followUpBody };
  }
  return lines;
}

export interface ActionOptions {
  actor: Actor;
  now: Date;
  /** "sent": the day it went out, YYYY-MM-DD (today when left out). */
  sentOn?: string;
  /** "approve": the fingerprint of the email the approver saw. */
  hash?: string;
  /** "approve": the approval check, with the do-not-email list consulted. */
  check?: ApprovalCheck;
}

/** Where "reopen" goes back to: sent if it went out, otherwise its draft or the research. */
const reopenTo = (p: Prospect): ProspectStatus => (p.email?.sentAt ? "sent" : p.email ? "drafted" : "researched");

/** Applies a status action and returns its history line, or null when it was already done. */
export function applyAction(p: Prospect, action: StatusAction, options: ActionOptions): string | null {
  const today = sydneyDate(options.now);
  if (action === "followup-sent") {
    if (!p.followUp) throw new OutreachError("There's no follow-up to mark");
    if (p.followUp.sentAt) return null;
    p.followUp = { ...p.followUp, sentAt: today };
    return ACTION_LABEL[action];
  }

  const target = action === "reopen" ? reopenTo(p) : TARGET[action];
  if (p.status === target) return null;
  if (!FROM[action].includes(p.status)) throw new OutreachError(REFUSAL[action]);

  switch (action) {
    case "approve": {
      const hash = hashOf(p);
      if (options.hash && options.hash !== hash) throw new OutreachError("The email changed since you opened it. Reload to see the latest version.");
      const check = options.check ?? approvalCheck(p);
      if (check.blocks.length) throw new OutreachError(check.blocks[0]);
      p.email = { ...p.email!, approvedAt: options.now.toISOString(), approvedBy: options.actor, approvedHash: hash };
      break;
    }
    case "draft":
      clearApproval(p);
      break;
    case "sent": {
      if (options.sentOn && options.sentOn > today) throw new OutreachError("The day it was sent can't be in the future", 400);
      const day = options.sentOn ?? today;
      p.email = { ...p.email!, sentAt: day };
      p.followUp = p.followUp ?? { dueAt: addDays(day, 7), body: FOLLOW_UP_TEMPLATE };
      break;
    }
    case "reopen":
    case "not-a-fit":
      // An approval that was sent stays on record; an unsent one has to be given again.
      if (!p.email?.sentAt) clearApproval(p);
      break;
  }
  p.status = target;
  return ACTION_LABEL[action];
}

export interface BulkOptions extends ActionOptions {
  priority?: Priority;
}

/**
 * One bulk action on one prospect: its history line, or null when it doesn't
 * apply (skipped). Approving in bulk skips any draft with something to read
 * first (a flag from the research, an address that may be a person's): those
 * are approved one at a time, with the warnings beside the button.
 */
export function applyBulk(p: Prospect, action: BulkAction, options: BulkOptions): string | null {
  switch (action) {
    case "approve": {
      if (p.status !== "drafted") return null;
      if (options.hash && options.hash !== hashOf(p)) return null;
      const check = options.check ?? approvalCheck(p);
      if (check.blocks.length || check.warnings.length) return null;
      return applyAction(p, "approve", { ...options, check });
    }
    case "priority": {
      if (!options.priority || options.priority === p.priority) return null;
      const line = `Priority ${p.priority} → ${options.priority}`;
      p.priority = options.priority;
      return line;
    }
    case "not-a-fit":
      return FROM["not-a-fit"].includes(p.status) ? applyAction(p, "not-a-fit", options) : null;
    case "reopen":
      return CLOSED.includes(p.status) ? applyAction(p, "reopen", options) : null;
  }
}

export type ResearchUpdate = Pick<Research, "checkedAt" | "metrics" | "systems" | "journey" | "shots">;

/** A website recheck from the command centre: newer evidence, merged screenshots, one history line. */
export function applyResearch(p: Prospect, update: ResearchUpdate, line: string): string {
  if (update.checkedAt !== undefined) p.checkedAt = update.checkedAt;
  if (update.metrics !== undefined) p.metrics = update.metrics;
  if (update.systems !== undefined) p.systems = update.systems;
  if (update.journey !== undefined) p.journey = update.journey;
  if (update.shots !== undefined) p.shots = { ...p.shots, ...update.shots };
  return line;
}
