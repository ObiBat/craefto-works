// What an enquiry is about: the contact form's project types, grouped by
// capability (content/capabilities.ts). The values are stored on leads and
// read by admin, so the original ones (brand, web, saas, ai, other) keep their
// meaning; media and growth arrived with the five capabilities.

import { combinedRange, monthlyPlans, type MonthlyPlan, type PriceRange, type ServiceKey } from "@/lib/pricing";

export interface EnquiryType {
  value: string;
  label: string;
  /** How the confirmation email refers to it: "your message about a website". */
  phrase: string | null;
  /** Published price rows (lib/pricing.ts) the form's budget hint quotes. */
  pricing: ServiceKey[];
  /** The hint's name for it: "Website projects usually run…". */
  pricingLabel: string;
}

export const ENQUIRY_GROUPS: { capability: string; types: EnquiryType[] }[] = [
  {
    capability: "Brand",
    types: [{ value: "brand", label: "Brand identity or design system", phrase: "your brand", pricing: ["brand"], pricingLabel: "Brand identity" }],
  },
  {
    capability: "Product",
    types: [
      { value: "web", label: "Website", phrase: "a website", pricing: ["web"], pricingLabel: "Website" },
      { value: "saas", label: "App, SaaS or MVP", phrase: "an app or platform", pricing: ["product"], pricingLabel: "App and platform" },
    ],
  },
  {
    capability: "Systems",
    types: [
      { value: "ai", label: "Software, automation or AI", phrase: "software and automation", pricing: ["ai", "tools"], pricingLabel: "Software and automation" },
      // The construction solution (content/construction.ts), priced from the same Systems rows.
      { value: "construction", label: "Construction operations", phrase: "construction operations", pricing: ["ai", "tools"], pricingLabel: "Construction operations" },
    ],
  },
  {
    capability: "Media",
    types: [{ value: "media", label: "Content, photography or video", phrase: "content, photography and video", pricing: ["photo", "video"], pricingLabel: "Photography and video" }],
  },
  {
    capability: "Growth",
    types: [{ value: "growth", label: "Marketing and growth", phrase: "marketing and growth", pricing: ["landing", "seo"], pricingLabel: "Growth" }],
  },
];

export const ENQUIRY_UNSURE = { value: "other", label: "Not sure yet" };

const ENQUIRY_TYPES = ENQUIRY_GROUPS.flatMap((group) => group.types);

/** Every value a lead's service_interest can hold. */
export const ENQUIRY_VALUES: string[] = [...ENQUIRY_TYPES.map((type) => type.value), ENQUIRY_UNSURE.value];

/** The form's budget bands and timelines, as stored on leads (budget_range, timeline). */
export const BUDGETS = [
  { value: "under-3k", label: "Under A$3k" },
  { value: "3-5k", label: "A$3k – A$5k" },
  { value: "5-10k", label: "A$5k – A$10k" },
  { value: "10-25k", label: "A$10k – A$25k" },
  { value: "25-50k", label: "A$25k – A$50k" },
  { value: "50k+", label: "A$50k+" },
  { value: "monthly", label: "Monthly plan" },
  { value: "discuss", label: "Let's discuss" },
];

export const TIMELINES = [
  { value: "asap", label: "ASAP" },
  { value: "1-3months", label: "1-3 months" },
  { value: "3-6months", label: "3-6 months" },
  { value: "flexible", label: "Flexible" },
];

/** Where a lead came from (leads.source), as admin shows it. */
export const LEAD_SOURCES: Record<string, string> = {
  website: "Website form",
  chat: "Ask Craefto",
  cal: "Booked a call",
  outreach: "Outreach reply",
};

/** The label for a stored value, for alerts and admin. */
export function enquiryLabel(value: string | null | undefined): string | null {
  if (!value) return null;
  return (
    ENQUIRY_TYPES.find((type) => type.value === value)?.label ??
    (value === ENQUIRY_UNSURE.value ? ENQUIRY_UNSURE.label : null) ??
    BUDGETS.find((band) => band.value === value)?.label ??
    TIMELINES.find((timeline) => timeline.value === value)?.label ??
    value
  );
}

/**
 * /contact?service=… to a project type: capability ids and the older service
 * keys. "product" covers both a website and an app, so it preselects nothing.
 */
export const ENQUIRY_PRESELECT: Record<string, string> = {
  brand: "brand",
  web: "web",
  saas: "saas",
  ai: "ai",
  systems: "ai",
  construction: "construction",
  media: "media",
  growth: "growth",
};

/** /contact?plan=… to the plan, and the project type it usually concerns. */
export const PLAN_PROJECT_TYPE: Record<MonthlyPlan["id"], string> = {
  essential: "",
  studio: "",
  partner: "",
};

export function enquiryPlan(id: string | null): MonthlyPlan | undefined {
  return monthlyPlans.find((plan) => plan.id === id);
}

export function enquiryPhrase(value: string | null | undefined): string | undefined {
  return ENQUIRY_TYPES.find((type) => type.value === value)?.phrase ?? undefined;
}

/** The published price span for a project type, for the form's budget hint. */
export function enquiryPriceRange(value: string): PriceRange | null {
  const type = ENQUIRY_TYPES.find((entry) => entry.value === value);
  return type ? combinedRange(type.pricing, type.pricingLabel) : null;
}

// ── Construction operations ───────────────────────────────────────────────
// Optional questions on a construction operations enquiry, kept with the
// lead's first history entry (lib/leads.ts) and shown in the owner's alert
// and admin. Nothing here is required, and other enquiries never see them.

type Option = { value: string; label: string };

export const CONSTRUCTION_TRADES: Option[] = [
  { value: "steel-fixing", label: "Steel fixing" },
  { value: "formwork", label: "Formwork" },
  { value: "concreting", label: "Concreting" },
  { value: "scaffolding", label: "Scaffolding" },
  { value: "carpentry", label: "Carpentry" },
  { value: "electrical", label: "Electrical" },
  { value: "plumbing", label: "Plumbing" },
  { value: "civil", label: "Civil works" },
  { value: "other", label: "Another trade" },
];

export const WORKFORCE_SIZES: Option[] = [
  { value: "1-10", label: "1 to 10 workers" },
  { value: "11-25", label: "11 to 25 workers" },
  { value: "26-50", label: "26 to 50 workers" },
  { value: "51-100", label: "51 to 100 workers" },
  { value: "100+", label: "More than 100 workers" },
];

export const ACTIVE_SITES: Option[] = [
  { value: "1", label: "1 site" },
  { value: "2-3", label: "2 or 3 sites" },
  { value: "4-10", label: "4 to 10 sites" },
  { value: "10+", label: "More than 10 sites" },
];

export const PREFERRED_LANGUAGES: Option[] = [
  { value: "en", label: "English" },
  { value: "mn", label: "Mongolian (Монгол)" },
];

export interface ConstructionDetails {
  trade: string | null;
  workforce: string | null;
  sites: string | null;
  tools: string | null;
  bottleneck: string | null;
  language: string | null;
}

const labelIn = (list: Option[], value: string | null | undefined) => (value ? (list.find((option) => option.value === value)?.label ?? null) : null);

/** The answers given, as labelled rows for the owner's alert and admin. */
export function constructionRows(details: Partial<ConstructionDetails> | null | undefined): Array<[string, string]> {
  if (!details) return [];
  const rows: Array<[string, string | null | undefined]> = [
    ["Trade", labelIn(CONSTRUCTION_TRADES, details.trade)],
    ["Workforce", labelIn(WORKFORCE_SIZES, details.workforce)],
    ["Active sites", labelIn(ACTIVE_SITES, details.sites)],
    ["Current tools", details.tools],
    ["Biggest bottleneck", details.bottleneck],
    ["Preferred language", labelIn(PREFERRED_LANGUAGES, details.language)],
  ];
  return rows.filter((row): row is [string, string] => Boolean(row[1]));
}
