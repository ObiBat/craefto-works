// Construction Operations & AI Integration: a specialised solution within
// Systems (content/capabilities.ts) for Australian construction
// subcontractors, starting with steel-fixing businesses in Sydney and NSW.
// Not a sixth service, a separate brand or a product for sale: each system is
// designed and built for one business. The one source for
// /solutions/construction, its structured data and the website assistant
// (lib/assistant/knowledge.ts).
//
// What it may claim:
// - We design and build for a client; nothing here is a finished product.
// - AI drafts and suggests, and a person approves before anything is sent,
//   changed or paid. It never verifies qualifications or safety.
// - Integrations depend on each tool's API or exports, confirmed before a
//   quote. No software vendor is named, so no partnership is implied.
// - No promised savings or returns.
// - Prices are the published ranges in lib/pricing.ts, shown as indicative:
//   every project is quoted at a fixed price after the Discovery Call.

import { formatPrice, plansFrom, priceFor, rangeLabel, weeksLabel, type PriceRange } from "@/lib/pricing";
import type { FaqEntry } from "@/content/faq";

const automation = priceFor("ai")!;
const system = priceFor("tools")!;

export interface ConstructionTier {
  name: string;
  summary: string;
  /** "$1,500 to $7,500", or "From $1,900 a month". */
  price: string;
  timing: string;
  includes: string[];
  /** The published range it's priced from, for structured data; none for the monthly plan. */
  range?: PriceRange;
}

export type ConstructionCapabilityId = "scheduling" | "timesheets" | "ai" | "costing" | "integration" | "languages";

export interface WorkflowStep {
  title: string;
  text: string;
  /** Who does it. */
  who: "Office" | "Supervisor" | "Crew" | "System";
  /** The person who signs it off, where a step waits for approval. */
  approval?: string;
}

export const construction = {
  name: "Construction Operations & AI Integration",
  shortName: "Construction operations",
  path: "/solutions/construction",
  headline: "Construction Operations, Connected.",
  statement: "Less time coordinating. More time building.",
  /** For metadata, the services page and the home page. */
  summary:
    "Crew scheduling, timesheets, job costing and the software you already use, connected for construction subcontractors, with AI that suggests and people who approve.",
  description:
    "Crew scheduling, timesheets, job costing and software integration for construction subcontractors in Sydney and NSW, with AI suggestions your team approves.",
  intro:
    "For Australian construction subcontractors, starting with steel-fixing businesses in Sydney and NSW. We connect your crew scheduling, timesheets, job costs and the tools you already use into one system built around how your business runs, with AI that drafts and suggests while your team decides.",

  problems: [
    {
      title: "Schedules that live in group chats",
      text: "Tomorrow’s crews are sorted by phone calls and late-night messages, and a change doesn’t always reach everyone it affects.",
    },
    {
      title: "Hours entered twice",
      text: "Timesheets arrive as texts, photos and paper, then get typed up again for payroll and invoices.",
    },
    {
      title: "Job costs that arrive late",
      text: "Labour cost per job isn’t clear until the end of the month, when it’s too late to change course.",
    },
    {
      title: "Tools that don’t talk to each other",
      text: "The schedule, the spreadsheets and the accounts each hold part of the picture, so the same details are keyed in more than once.",
    },
    {
      title: "Two languages on every site",
      text: "Instructions written in English reach crews more at home in Mongolian, and details get lost along the way.",
    },
  ],

  capabilities: [
    {
      id: "scheduling",
      title: "Crew scheduling",
      text: "Plan who works where each day on one shared schedule. Changes reach the crews they affect straight away, and the office, supervisors and crews all see the same plan.",
    },
    {
      id: "timesheets",
      title: "Timesheets",
      text: "Workers record start and finish on their own phone. Supervisors check and approve the hours, and approved hours feed payroll and job costs without retyping.",
    },
    {
      id: "ai",
      title: "AI assistance",
      text: "AI drafts crew messages and translations, flags clashes and unusual hours, and suggests who could cover a gap. A supervisor reviews and approves every suggestion before anything is sent or changed.",
    },
    {
      id: "costing",
      title: "Job costing",
      text: "Approved hours and each worker’s rate add up to labour cost per job through the week, so you can compare it with the quote while there’s still time to act.",
    },
    {
      id: "integration",
      title: "Systems integration",
      text: "Connect the accounting, payroll and project software you already use, where it offers an API or a reliable export. We confirm what’s possible before we quote.",
    },
    {
      id: "languages",
      title: "English and Mongolian",
      text: "Crew screens and messages in English and Mongolian. Fixed wording is translated and checked by a fluent speaker, and AI-drafted translations wait for approval before they’re sent.",
    },
  ] satisfies { id: ConstructionCapabilityId; title: string; text: string }[],

  workflow: [
    { title: "Jobs and sites", text: "Job details come in from your quotes or project software, or the office adds them.", who: "Office" },
    { title: "Schedule", text: "Crews are planned for each site. AI can suggest who’s free and flag clashes.", who: "Supervisor", approval: "Supervisor approves" },
    { title: "Crew notified", text: "Each worker gets their site and start time on their phone, in English or Mongolian.", who: "Crew" },
    { title: "Hours recorded", text: "Workers record start and finish, and anything unusual is flagged for a closer look.", who: "Crew", approval: "Supervisor approves" },
    { title: "Job costs", text: "Approved hours and rates become labour cost per job, updated as the week goes.", who: "System" },
    { title: "Payroll and accounts", text: "Approved hours and job codes go to payroll and your accounts, where your software allows.", who: "Office", approval: "Office signs off" },
  ] satisfies WorkflowStep[],

  /** Who sees what: role-based access in every system we propose. */
  roles: [
    { role: "Crew", sees: "Their own sites, shifts, hours and messages." },
    { role: "Supervisors", sees: "The sites and crews they run, and the hours waiting for approval." },
    { role: "Office", sees: "Schedules, costs and rates, limited to the people you choose." },
  ],

  paths: [
    {
      kicker: "Custom integration",
      title: "Connect what you have",
      text: "When your tools mostly work, we join them up: schedule changes reach crews, approved hours reach payroll, and job codes match your accounts. Your team keeps the software it knows.",
      points: [
        "Built on the APIs and exports your tools offer",
        "Usually a workflow automation project",
        "What’s possible depends on each tool, and we check before quoting",
      ],
    },
    {
      kicker: "New software",
      title: "Build what’s missing",
      text: "When nothing fits how you work, we build it: scheduling, timesheets and job costing designed around your crews and sites, connected to the tools you keep.",
      points: [
        "Designed around your process, and yours to keep",
        "Usually an internal system project",
        "Connected to accounting and payroll where they allow it",
      ],
    },
  ],
  pathsNote: "Most businesses start by connecting one workflow and add more from there. If the smaller option does the job, we’ll recommend it.",

  tiers: [
    {
      name: "Automate one workflow",
      summary: "One process connected or automated, such as approved timesheets into payroll, or schedule changes sent to crews.",
      price: rangeLabel(automation),
      timing: weeksLabel(automation),
      includes: ["A map of the workflow as it runs today", "The connection or automation, tested on real data", "Handover and 30 days of support"],
      range: automation,
    },
    {
      name: "Connected operations",
      summary: "Scheduling, timesheets and job costing in one system your team works in every day, connected to your accounts.",
      price: rangeLabel(system),
      timing: weeksLabel(system),
      includes: ["Crew screens in English and Mongolian", "Access by role for crews, supervisors and the office", "Built in stages, tried with one crew first"],
      range: system,
    },
    {
      name: "Ongoing improvement",
      summary: "New connections, refinements and AI features added as your team is ready, within an agreed monthly budget.",
      price: `From ${formatPrice(plansFrom)} a month`,
      timing: "Monthly plan, billed in advance",
      includes: ["Priorities planned with you", "Updates as your tools change", "New workflows as the business grows"],
    },
  ] satisfies ConstructionTier[],
  tiersNote:
    "Indicative ranges in AUD, before GST, from our published prices. Every project is quoted at a fixed price after the Discovery Call, once we’ve seen your tools and processes. Software subscriptions, hosting and AI usage are budgeted separately.",

  /** The case study that shows this kind of work (content/case-studies.ts). */
  proof: {
    slug: "artisan",
    text: "Artisan is a crew and jobs app we built for Sydney construction labour, beginning with the Mongolian steel-fixing community: crew invites by phone, a schedule grid, one-tap attendance on a 6am Today screen, and a backend locked down with row-level security, alongside a bilingual English and Mongolian website.",
    facts: ["37 app screens across boss, worker and sign-in flows", "Security tests run in CI on every change", "A bilingual English and Mongolian website"],
    note: "Artisan shows the kind of system we build. Yours is designed for your business, and it’s yours.",
  },

  faq: [
    {
      question: "How does implementation work?",
      answer:
        "It starts with a free Discovery Call. Then we map how a job moves through your business today: who schedules, how hours are recorded and where costs end up. You get a fixed-price proposal for the first stage. We build in stages, try each one with one crew before rolling it out, and train the office and supervisors as we go.",
    },
    {
      question: "Will it work with the software we already use?",
      answer:
        "Often, but it depends on the software. Where a tool offers an API or a reliable export, we can connect to it. Where it doesn’t, we’ll suggest a workaround, such as a scheduled export and import. We confirm what’s technically possible before quoting. Craefto Works isn’t partnered with or endorsed by any accounting or construction software provider.",
    },
    {
      question: "Will our crews actually use it?",
      answer:
        "Crew screens stick to the few things a worker needs: today’s site, start and finish, and messages, in English or Mongolian, on the phone they already carry. We test the screens with your crews and change what doesn’t work for them. It also needs supervisors who use it every day, so we plan the rollout with them.",
    },
    {
      question: "What does the AI do, and who’s in control?",
      answer:
        "AI drafts and suggests: crew messages and translations, schedule clashes, hours that look unusual, and who could cover a gap. Nothing is sent, changed or paid until a person approves it, and AI features can be switched off.",
    },
    {
      question: "Can it check tickets, licences or safety compliance?",
      answer:
        "It can store the tickets and licences your team records, show them on the schedule and remind you before they expire. It doesn’t verify qualifications or decide whether work is safe: those checks stay with your team and your safety processes.",
    },
    {
      question: "How is worker information kept secure?",
      answer:
        "Access is set by role: workers see their own shifts and hours, supervisors see their sites, and only the people you choose see rates and costs. Data is encrypted in transit and at rest, kept in Australian data centres where the services allow it, and handled in a way that supports your obligations under the Privacy Act. The data is yours, and you can export it.",
    },
    {
      question: "How much does it cost?",
      answer: `Connecting or automating one workflow usually costs ${rangeLabel(automation)}, and a connected system with scheduling, timesheets and job costing ${rangeLabel(system)}, in AUD before GST. These ranges are indicative: you get a fixed price after the Discovery Call. Ongoing improvements and support are available on a monthly plan from ${formatPrice(plansFrom)} a month. Software subscriptions, hosting and AI usage are budgeted separately.`,
    },
    {
      question: "Is this an app we subscribe to?",
      answer:
        "No. It isn’t an off-the-shelf product or a subscription to our software. We connect your tools or build a system for your business, and what we make is yours.",
    },
    {
      question: "Do you only work with steel fixers?",
      answer:
        "We’re starting with steel-fixing businesses in Sydney and NSW, the trade our work on Artisan grew out of. The same approach suits other subcontractors, such as formwork, concreting and scaffolding, and we’re happy to talk.",
    },
  ] satisfies FaqEntry[],
};
