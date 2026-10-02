// Published prices: the one source for the prices in each capability and
// the monthly plans on /services, and for the contact form's budget hint.
// AUD, before GST. Project prices were set in September 2026 against
// Australian market rates, below typical agency ranges since AI-assisted
// production shortens the routine work. Change prices here.
//
// The monthly plans (October 2026) are sold by budget, not by discipline:
// Essential, Studio and Partner each reserve studio time across all five
// capabilities, and priorities are agreed within that budget. AI Automation
// is a one-off custom project at the "ai" price range above. Benchmarks
// (advertised, checked 1 October 2026; scope and staffing differ): Graphiker
// $1,190-$3,490/month design subscriptions; SLICK from $3,990/month; ID
// Digital 30 hours/month at $6,500-$7,300 (2024-25 rate card); Kursol AI
// implementation $1,750/month for 5 hours. At these allowances revenue is
// about $190-$200 a delivery hour before costs.

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
  id: "essential" | "studio" | "partner";
  name: string;
  /** AUD a month, before GST. */
  price: number;
  /** Studio time reserved each month (planning, revisions, testing and meetings included). */
  hours: number;
  /** Who it suits, in one short line. */
  bestFor: string;
  /** The headline inclusions. */
  includes: string[];
}

/**
 * Monthly plans: a budget ladder, each drawing on all five capabilities and
 * billed monthly in advance. Scope is agreed before a plan starts.
 */
export const monthlyPlans: MonthlyPlan[] = [
  {
    id: "essential",
    name: "Essential",
    price: 1900,
    hours: 10,
    bestFor: "For small businesses with a foundation in place and a short list of improvements.",
    includes: ["10 hours of studio time a month", "One active task at a time", "Monthly planning", "Estimates agreed before we start"],
  },
  {
    id: "studio",
    name: "Studio",
    price: 3900,
    hours: 20,
    bestFor: "For consistent work across your website, brand, content and systems.",
    includes: ["20 hours of studio time a month", "One active workstream", "Fortnightly planning", "Shift priorities month to month"],
  },
  {
    id: "partner",
    name: "Partner",
    price: 6900,
    hours: 35,
    bestFor: "For teams with a sustained roadmap and more to deliver.",
    includes: [
      "35 hours of studio time a month",
      "Milestones coordinated across design, development and content",
      "Weekly planning",
      "Larger work delivered in stages",
    ],
  },
];

/** The one-off custom project for AI and automation, priced as the "ai" range above. */
export const aiAutomationProject = {
  name: "AI Automation",
  service: "ai" as ServiceKey,
  bestFor: "For businesses ready to take repetitive work off their team.",
  includes: [
    "We start with one workflow and measure the time it saves",
    "Built, tested and handed over to you",
    "A fixed price agreed before we start",
    "AI and software running costs billed to you directly",
  ],
};

/**
 * Plans no longer offered, so subscriptions still on them read properly in
 * the portal and admin.
 */
const retiredPlans: PlanInfo[] = [
  { id: "media", name: "Media", price: 2400 },
  { id: "growth", name: "Growth", price: 2900 },
];

/** A plan as stored on a subscription: current plans in full, retired ones by name and price. */
export type PlanInfo = Omit<Partial<MonthlyPlan>, "id"> & { id: string; name: string; price: number };

/** A plan by id, current or retired. */
export function planById(id: string): PlanInfo | undefined {
  return monthlyPlans.find((plan) => plan.id === id) ?? retiredPlans.find((plan) => plan.id === id);
}

/** The ids Stripe prices and subscriptions may carry: current and retired plans. */
export const knownPlanIds: string[] = [...monthlyPlans, ...retiredPlans].map((plan) => plan.id);

/** The lowest monthly plan price, for "from" lines. */
export const plansFrom = Math.min(...monthlyPlans.map((plan) => plan.price));

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
