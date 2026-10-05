// The questions and answers on the capabilities page (/services), also read
// by the website assistant (lib/assistant/knowledge.ts). The answers quote the
// published prices and timelines (lib/pricing.ts), so they can't drift.

import { formatPrice, priceRanges } from "@/lib/pricing";

export interface FaqEntry {
  question: string;
  answer: string;
}

export interface FaqGroup {
  label: string;
  items: FaqEntry[];
}

const smallest = priceRanges.reduce((a, b) => (b.min < a.min ? b : a));
const largest = priceRanges.reduce((a, b) => (b.max > a.max ? b : a));
const shortestWeeks = Math.min(...priceRanges.map((range) => range.weeks[0]));
const longestWeeks = Math.max(...priceRanges.map((range) => range.weeks[1]));
const midSentence = (label: string) => label.charAt(0).toLowerCase() + label.slice(1);

export const faqGroups: FaqGroup[] = [
  {
    label: "Pricing and plans",
    items: [
      {
        question: "How much does a typical project cost?",
        answer: `Most projects fall between ${formatPrice(smallest.min)} (${midSentence(smallest.label)}) and ${formatPrice(largest.max)} (${midSentence(largest.label)}), and each capability lists its prices above. We give you a fixed price before any work begins. For ongoing work, a monthly plan is usually simpler.`,
      },
      {
        question: "How do you decide what gets done each month?",
        answer: "Together, within the budget you\u2019ve chosen. You add ideas and requests to a shared, prioritised work queue; at each planning session we agree what matters most and estimate it before we start. What fits this month gets done this month, and larger work spans several months with the total estimated upfront.",
      },
      {
        question: "Which monthly plan do I need?",
        answer: "Choose the support you can budget for. Essential suits a short list of improvements, Studio suits consistent work across your website, brand, content and systems, and Partner suits a sustained roadmap. All three draw on all five capabilities; the difference is how much studio time you reserve and how closely we plan together. If you\u2019re unsure, tell us what you\u2019re working on and we\u2019ll suggest one.",
      },
      {
        question: "How do monthly plans work?",
        answer: "Each plan reserves studio time every month: 10 hours on Essential, 20 on Studio and 35 on Partner. That time covers planning, revisions, testing and meetings as well as the work itself, and we agree estimates before starting anything. Advertising, software, AI usage, hosting and production costs (including shoot preparation, travel and editing) are budgeted separately. Plans are billed monthly in advance.",
      },
      {
        question: "What happens if we stop?",
        answer: "Cancelling takes effect at your next renewal. Work that\u2019s complete and paid for is yours, and we hand over the accounts we\u2019ve set up for you. If we built automations, we agree who looks after them, and their running costs stay with your accounts.",
      },
      {
        question: "How does payment work?",
        answer: "Projects are split into milestones so you are never paying for work that has not been delivered: typically 30% upfront, 40% at design approval and 30% on launch, with more milestones for larger projects. Monthly plans are billed in advance each month. We accept bank transfer and can provide invoices with flexible terms for enterprise clients.",
      },
    ],
  },
  {
    label: "Working with us",
    items: [
      {
        question: "Do I need to have a clear brief before reaching out?",
        answer: "No. Many clients start with just an idea or a frustration. We help shape the direction during our initial conversation, so you don\u2019t need anything polished before getting in touch.",
      },
      {
        question: "Can you handle just design, or just development?",
        answer: "Yes, but we work best when we can do both. Fewer handoffs means better results, faster delivery, and less risk of things getting lost in translation between teams.",
      },
      {
        question: "What is your typical timeline?",
        answer: `${shortestWeeks} to ${longestWeeks} weeks for most projects, depending on scope; each capability lists its timelines above. We confirm yours in the proposal and keep you informed throughout.`,
      },
      {
        question: "Do you support the project after launch?",
        answer: "Yes. Every project includes 30 days of post launch support. After that, any monthly plan covers fixes, updates and new work.",
      },
      {
        question: "What technologies do you use?",
        answer: "We primarily work with React, Next.js, TypeScript, and Tailwind on the frontend, with Node.js, Supabase, and various APIs on the backend. We choose the best tools for each project rather than forcing a one size fits all stack.",
      },
    ],
  },
];
