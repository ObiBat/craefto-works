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
