// Outreach records as the admin API serves them: the command centre's own
// shapes (~/Developer/craefto-social/lib/outreach/types.ts), plus a few
// fields only the server knows (campaignId, updatedAt, emailHash, approvedBy).
// Safe to import from client components.

export type ProspectStatus = "researched" | "drafted" | "approved" | "sent" | "replied" | "meeting" | "won" | "lost" | "not-a-fit";
export type Priority = "A" | "B" | "C";
export type StatusAction = "approve" | "draft" | "sent" | "followup-sent" | "replied" | "meeting" | "won" | "lost" | "not-a-fit" | "reopen";
export type BulkAction = "approve" | "priority" | "not-a-fit" | "reopen";
/** Who made a change: the site's admin, the command centre (API token), an import or the system. */
export type Actor = "admin" | "command-centre" | "import" | "system";

export interface Finding {
  text: string;
  /** Date the finding was last confirmed, YYYY-MM-DD. */
  checkedAt: string;
  source?: string;
}

export interface DetectedSystem {
  name: string;
  category: string;
  evidence?: string;
}

export interface Email {
  subject: string;
  body: string;
  language?: string;
  approvedAt?: string;
  approvedBy?: string;
  /** The fingerprint of what was approved (emailHash at the time). */
  approvedHash?: string;
  /** The day it was sent, YYYY-MM-DD in Sydney. */
  sentAt?: string;
}

export interface FollowUp {
  /** YYYY-MM-DD */
  dueAt: string;
  body: string;
  sentAt?: string;
}

/** What the research found, stored as one record (outreach_prospects.research). */
export interface Research {
  businessType?: string;
  size?: { text: string; source?: string };
  /** Customer-facing platforms a renter or owner passes through. */
  journey?: string[];
  systems?: DetectedSystem[];
  applicationMethod?: string;
  metrics?: { mobileSeconds?: number; mobileMB?: number; overflowPx?: number; footerYear?: number | null };
  findings: Finding[];
  branding?: string;
  whyFit?: string;
  shots?: { mobile?: string; desktop?: string; apply?: string };
  checkedAt?: string;
}

export interface Contact {
  kind: "email" | "form" | "none";
  value: string;
  /** Where the address is published: the evidence for consent. */
  source?: string;
}

/** The published-address check made before sending (lib/outreach/evidence.ts). */
export interface Evidence {
  url: string | null;
  checkedAt: string;
  /** The address is on the page and no notice refuses unsolicited email. */
  ok: boolean;
  addressFound: boolean;
  /** The sentence refusing unsolicited email, when one is found. */
  notice: string | null;
  /** sha256 of the page's text, so what was seen can be shown later. */
  pageHash: string | null;
  /** Addresses at the same domain the page does show, to fix a stale one. */
  otherAddresses?: string[];
  status: number | null;
  error?: string;
  /** Confirmed by hand instead (the page blocks automated checks). */
  manual?: { by: string; at: string };
}

export interface Prospect extends Research {
  id: string;
  campaignId: string;
  company: string;
  segment: string;
  state?: string;
  location?: string;
  website: string;
  contact: Contact;
  priority: Priority;
  status: ProspectStatus;
  email?: Email;
  /** Fingerprint of the recipient, subject and body. Approving with it approves exactly that email. */
  emailHash?: string;
  followUp?: FollowUp;
  /** Warnings to read before sending, such as an address found only in a news article. */
  flags?: string[];
  notes?: string;
  timeline: { at: string; event: string }[];
  /** The latest published-address check, or a confirmation by hand. */
  evidence?: Evidence;
  updatedAt: string;
}

export interface Campaign {
  id: string;
  name: string;
  description: string;
  createdAt: string;
  updatedAt?: string;
  prospects: Prospect[];
}

/** What stands between a draft and approval. Blocks stop it; warnings are for reading first. */
export interface ApprovalCheck {
  blocks: string[];
  warnings: string[];
}

/** A prospect without its research, email body or history: one row of the admin queue. */
export interface ProspectSummary {
  campaignId: string;
  id: string;
  company: string;
  segment: string;
  location?: string;
  website: string;
  contact: Contact;
  priority: Priority;
  status: ProspectStatus;
  subject?: string;
  flags: string[];
  updatedAt: string;
}

export const STATUS_LABEL: Record<ProspectStatus, string> = {
  researched: "Researched",
  drafted: "Needs approval",
  approved: "Approved",
  sent: "Sent",
  replied: "Replied",
  meeting: "Meeting",
  won: "Won",
  lost: "Lost",
  "not-a-fit": "Not a fit",
};

/** The statuses whose email can still be edited. */
export const EDITABLE: ProspectStatus[] = ["researched", "drafted", "approved"];

export type SendingMode = "off" | "test" | "live";

export interface SendingSettings {
  mode: SendingMode;
  dailyCap: number;
  testRecipients: string[];
  windowStart: string;
  windowEnd: string;
  followUps: boolean;
  nextSendAt: string | null;
  pausedReason: string | null;
  updatedAt: string;
  updatedBy: string | null;
}

/** One email the sender sent (or tried to), as kept on record. */
export interface OutreachMessage {
  id: string;
  campaignId: string;
  prospectId: string;
  kind: "initial" | "follow-up";
  mode: "test" | "live";
  status: "sending" | "sent" | "failed" | "bounced";
  messageId: string;
  to: string;
  subject: string;
  body: string;
  evidence: Evidence | null;
  error: string | null;
  savedToSent: boolean;
  createdAt: string;
  sentAt: string | null;
}

