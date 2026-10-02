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
    types: [{ value: "ai", label: "Software, automation or AI", phrase: "software and automation", pricing: ["ai", "tools"], pricingLabel: "Software and automation" }],
  },
  {
    capability: "Media",
    types: [{ value: "media", label: "Photography, video or motion", phrase: "photography and video", pricing: ["photo", "video"], pricingLabel: "Photography and video" }],
  },
  {
    capability: "Growth",
    types: [{ value: "growth", label: "Marketing and growth", phrase: "marketing and growth", pricing: ["landing", "seo"], pricingLabel: "Growth" }],
  },
];

export const ENQUIRY_UNSURE = { value: "other", label: "Not sure yet" };

const ENQUIRY_TYPES = ENQUIRY_GROUPS.flatMap((group) => group.types);

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
