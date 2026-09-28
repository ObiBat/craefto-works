// Published price ranges: the one source for the services pricing table, the
// home services list and the contact form's budget hint. Change prices here.

export type ServiceKey = "brand" | "web" | "product" | "ai" | "security";

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
  { service: "brand", label: "Brand Identity", min: 3000, max: 8000, weeks: [3, 6] },
  { service: "web", label: "Marketing Website", min: 5000, max: 15000, weeks: [4, 8] },
  { service: "product", label: "Web Application / SaaS", min: 10000, max: 30000, weeks: [8, 16] },
  { service: "ai", label: "AI & Automation", min: 3000, max: 12000, weeks: [2, 8] },
  { service: "security", label: "Security Audit", min: 2000, max: 6000, weeks: [1, 3] },
];

export function priceFor(service: string): PriceRange | undefined {
  return priceRanges.find((range) => range.service === service);
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

/** "3 to 6 weeks" */
export function weeksLabel(range: PriceRange): string {
  return `${range.weeks[0]} to ${range.weeks[1]} weeks`;
}
