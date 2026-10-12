// The five capabilities: the one source for the capabilities page
// (/services), the home list, the footer, /start and the structured data.
// Related work points at real case studies (content/case-studies.ts) and
// says only what those pages show. Prices come from lib/pricing.ts.

import { combinedRange, priceRanges, type PriceRange, type ServiceKey } from "@/lib/pricing";

export type CapabilityId = "brand" | "product" | "systems" | "media" | "growth";

export interface Capability {
  id: CapabilityId;
  number: string;
  name: string;
  /** Fuller name for structured data and link text. */
  serviceName: string;
  /** One line: what the capability covers, and where it stops. */
  summary: string;
  /** The capability's scope as a short list, for labels, filters and forms. */
  scope: string;
  description: string;
  deliverables: string[];
  /** When a client would need it. */
  example: string;
  /** Case studies that show this work, and what they show. */
  work: { slug: string; project: string; detail: string }[];
  /** Published price ranges this capability covers. */
  pricing: ServiceKey[];
}

export const capabilities: Capability[] = [
  {
    id: "brand",
    number: "01",
    name: "Brand",
    serviceName: "Brand identity and design systems",
    summary: "The identity and visual rules everything else follows.",
    scope: "Identity, strategy, design systems and creative direction.",
    description:
      "We define how your business looks: the logo, typefaces, colours and the rules for using them together. We document it as a visual system and build it into a design system, so your website, signage, packaging and pitch deck read as the same company.",
    deliverables: [
      "Brand identity and logo suite",
      "Visual direction",
      "Typography and colour",
      "Visual system and brand guidelines",
      "Design system and UI components",
      "Asset pack for print and digital",
    ],
    example:
      "You’re launching or renaming a business, or your website, proposals and signage each look like a different company.",
    work: [
      { slug: "globfam", project: "GlobFam", detail: "Logo with animated variants, a 15-colour palette and a two-typeface system." },
      { slug: "mng-steel", project: "MNG Steel", detail: "A brand mark generated in light, dark and mono variants." },
    ],
    pricing: ["brand"],
  },
  {
    id: "product",
    number: "02",
    name: "Product",
    serviceName: "Websites, apps and digital products",
    summary: "Websites, apps and platforms your customers use.",
    scope: "Websites, digital products, applications and digital experiences.",
    description:
      "We design and build what your customers see and use: marketing websites, web and mobile apps, SaaS platforms and MVPs. UX, interface design and development happen together, and creative development covers the interactive and experimental work, from 3D scenes to custom tools.",
    deliverables: [
      "Website design and development",
      "UX and UI design",
      "Web and mobile apps",
      "SaaS platforms and MVPs",
      "Creative development, 3D and WebGL",
      "Launch, hosting and handover",
    ],
    example:
      "You have an idea to put in front of real users, or a website that no longer explains what you do.",
    work: [
      { slug: "fx-foundations", project: "FX Foundations", detail: "A bilingual education platform with 163 lessons and a trading simulator." },
      { slug: "tactix", project: "TACTIX", detail: "A 3D chess learning platform with interactive lessons." },
    ],
    pricing: ["web", "product"],
  },
  {
    id: "systems",
    number: "03",
    name: "Systems",
    serviceName: "Custom software, automation and AI",
    summary: "Software and automation that runs your operations.",
    scope: "AI automation, integrations, internal tools and business systems.",
    description:
      "We build the tools behind your business: internal software, dashboards, integrations between the apps you already use, and automations that take repetitive work off your team. Where it saves time, we add AI workflows and agents, such as reading incoming documents or drafting first replies for your team to check.",
    deliverables: [
      "Custom software and internal tools",
      "Dashboards and reporting",
      "Integrations and APIs",
      "Workflow automation",
      "AI workflows and agents",
      "Data imports and pipelines",
    ],
    example:
      "Your team copies the same information between spreadsheets, inboxes and apps every week, or the business has outgrown the tool it runs on.",
    work: [
      { slug: "japanoma", project: "JapanoMa", detail: "A weekly partner-workbook pipeline, a Gemini-assisted floor-plan translation pilot and an admin area." },
      { slug: "artisan", project: "Artisan", detail: "A Supabase backend with 40 SQL functions and an operations dashboard." },
    ],
    pricing: ["ai", "tools"],
  },
  {
    id: "media",
    number: "04",
    name: "Media",
    serviceName: "Content, photography and video",
    summary: "Content made for each channel, and scheduled for when your audience is there.",
    scope: "Content creation, channel planning, scheduling, photography, video and motion.",
    description:
      "We make the content your brand needs and plan where it runs. Photography, video, motion and graphics are produced in the formats each channel uses, then built into a content grid for each feed and a stack of ready-to-post pieces with captions. A content calendar schedules them for when your audience is most active, and on a monthly plan we review what performed and shape the next stack.",
    deliverables: [
      "Content strategy and channel plans",
      "Content grids and ready-to-post stacks for each channel",
      "Content calendars and strategic scheduling",
      "Brand and product photography",
      "Video production, editing and captions",
      "Motion design and animated logos",
    ],
    example:
      "Your channels go quiet for weeks and then get a rush of posts, or you’re launching with no photos or video of your team, product or work.",
    work: [
      { slug: "nowuknow", project: "Nowuknow", detail: "A street shoot for a Sydney event collective's new merch: sixteen photographs across eight setups." },
      { slug: "japanoma", project: "JapanoMa", detail: "A 33-second homepage film, and one interview edited into fifteen captioned chapters." },
      { slug: "globfam", project: "GlobFam", detail: "Animated logo variants and a motion language of reusable animation components." },
    ],
    pricing: ["photo", "video"],
  },
  {
    id: "growth",
    number: "05",
    name: "Growth",
    serviceName: "Marketing, SEO and analytics",
    summary: "Marketing that brings the right people in and helps them act.",
    scope: "Campaigns, digital growth, optimisation and ongoing creative support.",
    description:
      "We plan how you reach your audience and make it easier for them to act: marketing strategy, campaign creative, landing pages, SEO foundations and analytics. Then we look at what visitors actually do and improve the pages and messages that aren’t working.",
    deliverables: [
      "Marketing strategy",
      "Campaign creative",
      "Landing pages",
      "SEO foundations",
      "Tracking, data analysis and reporting",
      "Conversion improvements",
    ],
    example:
      "People visit your site but few get in touch, or you’re launching and need a plan for the first campaign.",
    work: [
      { slug: "tav-partners", project: "TAV & Partners", detail: "Metadata, sitemap, social card and structured data set up so indexing was switched on at launch." },
      { slug: "artisan", project: "Artisan", detail: "A bilingual marketing site with SEO and a live Founding-100 counter." },
    ],
    pricing: ["landing", "seo"],
  },
];

export const capabilityHref = (id: CapabilityId) => `/services#${id}`;

export function getCapability(id: CapabilityId): Capability {
  return capabilities.find((capability) => capability.id === id)!;
}

/** A capability's name, for tags and labels: "Brand", "Media". */
export const capabilityName = (id: CapabilityId) => getCapability(id).name;

/** The published ranges a capability covers, folded into one. */
export function capabilityPrice(capability: Capability): PriceRange | null {
  return combinedRange(capability.pricing, capability.name);
}

/** The published price rows for a capability, in table order. */
export function capabilityPrices(capability: Capability): PriceRange[] {
  return priceRanges.filter((range) => capability.pricing.includes(range.service));
}

/** How capabilities combine. Illustrative, not past projects. */
export const engagements: { title: string; capabilities: CapabilityId[]; description: string }[] = [
  {
    title: "Launching a business",
    capabilities: ["brand", "product", "media"],
    description: "An identity and visual rules, a website that takes enquiries, and photography and video ready for launch day.",
  },
  {
    title: "Improving operations",
    capabilities: ["product", "systems"],
    description: "A customer portal on the front, with the dashboards, integrations and automations that run behind it.",
  },
  {
    title: "Growing an existing product",
    capabilities: ["growth", "media", "product"],
    description: "Campaign creative and landing pages, new photography and video, and product changes where analytics shows people dropping off.",
  },
];
