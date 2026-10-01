// Published prices: the one source for the prices in each capability and
// the monthly plans on /services, and for the contact form's budget hint.
// AUD, excluding GST. Set in September 2026 against Australian market rates:
// projects sit below typical agency ranges, since AI-assisted production
// shortens the routine work; the monthly plans are fuller bundles, priced at
// mid-market retainer levels. Change prices here.

import type { CapabilityId } from "@/content/capabilities";

export type ServiceKey = "brand" | "web" | "product" | "ai" | "tools" | "photo" | "video" | "landing" | "seo";

export interface PriceRange {
  service: ServiceKey;
  /** Row label in the pricing table. */
  label: string;
  /** AUD, excluding GST. */
  min: number;
  max: number;
  /** Typical timeline in weeks: [from, to]. */
  weeks: [number, number];
}

export const priceRanges: PriceRange[] = [
  { service: "brand", label: "Brand identity", min: 1900, max: 5500, weeks: [2, 4] },
  { service: "web", label: "Marketing website", min: 2900, max: 8500, weeks: [2, 5] },
  { service: "product", label: "Web app, SaaS or MVP", min: 7500, max: 25000, weeks: [3, 10] },
  { service: "ai", label: "Workflow automation and AI", min: 1500, max: 7500, weeks: [1, 4] },
  { service: "tools", label: "Internal tools and dashboards", min: 6000, max: 18000, weeks: [3, 8] },
  { service: "photo", label: "Brand photography", min: 900, max: 2500, weeks: [1, 2] },
  { service: "video", label: "Video production", min: 2500, max: 9500, weeks: [2, 4] },
  { service: "landing", label: "Landing page", min: 1200, max: 3500, weeks: [1, 2] },
  { service: "seo", label: "SEO and analytics setup", min: 1500, max: 4500, weeks: [1, 3] },
];

export interface MonthlyPlan {
  id: "media" | "growth" | "studio";
  name: string;
  /** AUD a month, excluding GST. */
  price: number;
  /** Who it suits, in one short line. */
  bestFor: string;
  /** The capabilities it draws on (content/capabilities.ts). */
  capabilities: CapabilityId[];
  /** The headline inclusions. */
  includes: string[];
}

/**
 * Subscriptions for ongoing work, billed monthly in advance, each drawing on
 * several capabilities. Larger sizes are quoted on request.
 */
export const monthlyPlans: MonthlyPlan[] = [
  {
    id: "media",
    name: "Media",
    price: 2400,
    bestFor: "For brands that need fresh content every month, from shoots to motion design.",
    capabilities: ["media", "brand", "growth"],
    includes: [
      "1\u20132 half-day shoots a month, people or products",
      "Photo and video editing, ready to publish",
      "Motion design and marketing videos",
      "Cuts sized for web, social and ads",
    ],
  },
  {
    id: "growth",
    name: "Growth",
    price: 2900,
    bestFor: "For businesses that want more enquiries from their website.",
    capabilities: ["growth", "product", "media", "brand"],
    includes: [
      "A campaign and landing page each month",
      "SEO improvements and on-brand campaign creative",
      "Tracking and data capture across your site",
      "Data analysis and a monthly report",
    ],
  },
  {
    id: "studio",
    name: "Studio",
    price: 4900,
    bestFor: "For teams that need design and development on call.",
    capabilities: ["brand", "product", "systems", "media", "growth"],
    includes: [
      "Unlimited requests",
      "Work across all five capabilities",
      "Hosting care for what we build",
      "Deliveries every few business days",
    ],
  },
];

export function priceFor(service: string): PriceRange | undefined {
  return priceRanges.find((range) => range.service === service);
}

/** Several published ranges as one: the lowest start, the highest end. */
export function combinedRange(services: ServiceKey[], label: string): PriceRange | null {
  const ranges = priceRanges.filter((range) => services.includes(range.service));
  if (ranges.length === 0) return null;
  return {
    service: ranges[0].service,
    label,
    min: Math.min(...ranges.map((range) => range.min)),
    max: Math.max(...ranges.map((range) => range.max)),
    weeks: [Math.min(...ranges.map((range) => range.weeks[0])), Math.max(...ranges.map((range) => range.weeks[1]))],
  };
}

const aud = new Intl.NumberFormat("en-AU", {
  style: "currency",
  currency: "AUD",
  minimumFractionDigits: 0,
  maximumFractionDigits: 0,
});

/** "$3,000" */
export function formatPrice(amount: number): string {
  return aud.format(amount);
}

/** "$3,000 to $8,000" */
export function rangeLabel(range: PriceRange): string {
  return `${formatPrice(range.min)} to ${formatPrice(range.max)}`;
}

/** "3 to 6 weeks", or "1 to 2 weeks" */
export function weeksLabel(range: PriceRange): string {
  return `${range.weeks[0]} to ${range.weeks[1]} weeks`;
}
