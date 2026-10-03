// How an engagement runs: one set of stages for every kind of work, shaped
// by the capability. The single source for /process. Every promise here is
// one the site already makes: the free Discovery Call (/start), a fixed price
// before work begins, milestone payments and 30 days of support (the
// capabilities FAQ and /about), and monthly plans (lib/pricing.ts).

import type { CapabilityId } from "./capabilities";

export interface StageWork {
  /** What happens in this stage for this kind of work. */
  activities: string[];
  /** What you have at the end of it. */
  outcome: string;
}

export interface Stage {
  id: string;
  number: string;
  name: string;
  /** One line: what the stage is for. */
  purpose: string;
  /** What happens, whatever the work. */
  general: string;
  byCapability: Record<CapabilityId, StageWork>;
}

export const stages: Stage[] = [
  {
    id: "discover",
    number: "01",
    name: "Discover",
    purpose: "Understand the business, the people it serves and what success looks like.",
    general:
      "It starts with a free 30-minute call, then whatever research the work needs: your goals, your audience, what already exists and what is getting in the way.",
    byCapability: {
      brand: {
        activities: [
          "The business, its story and where it is heading",
          "Competitors and the visual habits of your category",
          "What you already use: logo files, website, documents",
        ],
        outcome: "A shared view of what the brand needs to say, and where",
      },
      product: {
        activities: [
          "Who uses it, and what they need to get done",
          "Your current site or app, its content and its analytics",
          "Technical constraints: hosting, integrations, data",
        ],
        outcome: "Clear goals, users and constraints",
      },
      systems: {
        activities: [
          "How the work happens today: who does what, in which tools",
          "Where time goes: copying, chasing and re-keying",
          "What your apps and data allow",
        ],
        outcome: "A map of the workflow and the best place to start",
      },
      media: {
        activities: [
          "What the content is for, and where it will run",
          "References, mood and the brand rules to follow",
          "Practicalities: people, products, locations and dates",
        ],
        outcome: "A brief everyone agrees on",
      },
      growth: {
        activities: [
          "Who you want to reach, and what you want them to do",
          "How people find and use your site today",
          "How others in your market reach the same people",
        ],
        outcome: "A baseline to measure against",
      },
    },
  },
  {
    id: "define",
    number: "02",
    name: "Define",
    purpose: "Agree the scope, the approach and the price before anything is made.",
    general:
      "We turn what we learned into a plan: what we will make, how we will know it worked, what it costs and when it lands. You get a fixed price before any work begins.",
    byCapability: {
      brand: {
        activities: [
          "Positioning, and the personality the identity should carry",
          "The pieces in scope: logo suite, typography, colour, guidelines",
          "The proposal and its milestones",
        ],
        outcome: "Positioning agreed, and a fixed-price proposal",
      },
      product: {
        activities: [
          "The site map or feature list, and what goes in the first release",
          "The technical approach and the tools we will use",
          "The proposal and its milestones",
        ],
        outcome: "A first release scoped, and a fixed-price proposal",
      },
      systems: {
        activities: [
          "The first workflow to automate, and how we will measure the time it saves",
          "The data involved, who can see it and where people check the work",
          "The proposal and its milestones",
        ],
        outcome: "The first workflow chosen, and a fixed-price proposal",
      },
      media: {
        activities: [
          "Shot list or storyboard, formats and lengths",
          "Crew, locations, schedule and where the content will be used",
          "The proposal and its milestones",
        ],
        outcome: "A shot list and schedule, and a fixed-price proposal",
      },
      growth: {
        activities: [
          "Channels, messages and the first campaign",
          "What we will track, and the numbers that define success",
          "The proposal, or the first month's work under a plan",
        ],
        outcome: "A plan, and a way to measure it",
      },
    },
  },
  {
    id: "create",
    number: "03",
    name: "Create",
    purpose: "Explore and design with you until the direction is right.",
    general:
      "Concepts, designs and prototypes, shared early and refined with your feedback. Nothing goes into production until you have approved the direction.",
    byCapability: {
      brand: {
        activities: ["Identity routes, with type and colour studies", "Refining the chosen route with your feedback", "The visual system: how the pieces work together"],
        outcome: "An approved identity",
      },
      product: {
        activities: ["Wireframes, then interface design", "Clickable prototypes of the important flows", "The design system the build will use"],
        outcome: "Approved designs, ready to build",
      },
      systems: {
        activities: [
          "The workflow redesigned: steps, triggers and people",
          "Prototypes of the screens people will use, such as dashboards and forms",
          "What happens when something goes wrong",
        ],
        outcome: "An agreed design for the system",
      },
      media: {
        activities: ["Mood boards, shot lists and storyboards", "Scripts and motion style frames where needed", "Casting, styling and locations"],
        outcome: "An approved plan for the shoot or the edit",
      },
      growth: {
        activities: ["Campaign concepts and key messages", "Drafts of ads and landing pages", "Content plans for each channel"],
        outcome: "Approved creative",
      },
    },
  },
  {
    id: "build",
    number: "04",
    name: "Build / Produce",
    purpose: "Make it real: build it, shoot it, edit it or set it up.",
    general:
      "The approved direction becomes the finished thing, by the same people who designed it. You review it before anything goes live.",
    byCapability: {
      brand: {
        activities: ["Final logo files and asset packs", "Guidelines that show the rules in use", "Templates for documents, decks and social"],
        outcome: "A finished identity, and the files to use it",
      },
      product: {
        activities: ["Front-end and back-end development", "Content, integrations and analytics", "Testing on real devices and browsers"],
        outcome: "A tested build to review before launch",
      },
      systems: {
        activities: ["Building the automations, tools and integrations", "Running them on real data alongside the old way", "Showing your team how to use them"],
        outcome: "A working system, tested on your data",
      },
      media: {
        activities: ["The shoot or the recording", "Editing, colour, sound and motion", "Captions, and versions sized for each channel"],
        outcome: "Finished photos and edits, ready to publish",
      },
      growth: {
        activities: ["Landing pages and tracking", "Ads and content", "Campaign set-up in each channel"],
        outcome: "A campaign ready to go live",
      },
    },
  },
  {
    id: "launch",
    number: "05",
    name: "Launch",
    purpose: "Put it into the world, carefully.",
    general:
      "We handle the release and the handover, so the switch is smooth and you know how everything works. Every project includes 30 days of support after launch.",
    byCapability: {
      brand: {
        activities: ["Rolling the identity out across your website, documents and signage", "Handing over files, fonts and guidelines", "30 days of support"],
        outcome: "A brand in use, with everything handed over",
      },
      product: {
        activities: ["Deployment, domains and monitoring", "Handing over accounts and documentation", "30 days of support"],
        outcome: "Live, and yours",
      },
      systems: {
        activities: ["Switching over from the old process", "Handing over documentation and accounts", "30 days of support"],
        outcome: "The new process in daily use",
      },
      media: {
        activities: ["Delivery in every format and size you need", "Files organised, with notes on where each can be used", "30 days of support"],
        outcome: "Content in place on every channel",
      },
      growth: {
        activities: ["The campaign goes live", "Tracking checked from end to end", "Early results reviewed together"],
        outcome: "A live campaign, measured from day one",
      },
    },
  },
  {
    id: "evolve",
    number: "06",
    name: "Evolve",
    purpose: "Learn from what is live, and keep improving it.",
    general:
      "After launch we look at what is working. Many clients continue on a monthly plan, where new work is planned, made and launched every month within an agreed budget.",
    byCapability: {
      brand: {
        activities: ["New uses of the identity as the business grows", "Keeping the design system in step with the product", "Refreshes when the business changes"],
        outcome: "A brand that stays consistent as it grows",
      },
      product: {
        activities: ["Fixes, updates and new features", "Improvements based on analytics and feedback", "Keeping the site and its software up to date"],
        outcome: "A product that keeps improving",
      },
      systems: {
        activities: ["Automating the next workflow", "Adjusting as volumes and tools change", "Adding AI where it saves real time"],
        outcome: "More time back, one workflow at a time",
      },
      media: {
        activities: ["Regular shoots and edits", "Content for new campaigns and launches", "Replacing what has dated"],
        outcome: "A steady supply of content",
      },
      growth: {
        activities: ["Monthly reporting and planning", "Testing the pages and messages that underperform", "New campaigns as the plan evolves"],
        outcome: "Improvement you can measure",
      },
    },
  },
];

/** How each kind of work moves through the stages. */
export const shapes: Record<CapabilityId | "all", string> = {
  all: "Every engagement moves through the same six stages. What happens in each, and how long it takes, depends on the work.",
  brand: "Brand work spends most of its time in Discover, Define and Create, because the thinking is the work.",
  product: "Product work runs through every stage, with the most time in Create and Build.",
  systems: "Systems work starts small: one workflow, designed, built and tested on real data before the next.",
  media: "Media work moves quickly from planning to production. Most of the effort goes into preparing the shoot, then the shoot itself.",
  growth: "Growth work loops: Launch and Evolve repeat as the results come in.",
};

/** What helps us do our best work, whatever the project. */
export const clientChecklist: string[] = [
  "One person who can approve the work",
  "What you already have: logo files, guidelines, photos and content",
  "Access to the accounts involved, from your domain to the tools your team uses",
  "Feedback within 48 hours during reviews",
  "For shoots: people, products and locations ready on the day",
  "Honest answers about goals, budget and timing",
];
