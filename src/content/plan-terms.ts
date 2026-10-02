import { monthlyPlans } from "@/lib/pricing";

// The monthly plan terms, in plain language: shown on each plan's start page
// (/subscribe/[plan]), where clients agree to them before paying, and in the
// Terms of Service (/terms#monthly-plans). The start page sends the version
// it showed, and checkout records it on the Stripe subscription, so change
// the version whenever the terms change.

export const PLAN_TERMS_VERSION = "2026-10-02";

/** "a, b and c" */
const list = (items: string[]) => (items.length > 1 ? `${items.slice(0, -1).join(", ")} and ${items.at(-1)}` : items.join(""));

export function planTerms(chargesGst: boolean): Array<{ title: string; text: string }> {
  const hours = list(monthlyPlans.map((plan, index) => `${plan.hours}${index === 0 ? " hours" : ""} on ${plan.name}`));
  return [
    {
      title: "Billing",
      text: `Plans are billed monthly in advance, in Australian dollars${chargesGst ? " plus GST" : ""}, through Stripe. Your plan renews each month until you cancel.`,
    },
    {
      title: "Studio time",
      text: `Your plan reserves studio time each month: ${hours}. That time covers planning, revisions, testing and meetings as well as the work itself.`,
    },
    {
      title: "Priorities and estimates",
      text: "You add requests to a shared, prioritised work queue, and at each planning session we agree what matters most. We estimate each piece of work before starting; larger work spans several months, with the total estimated upfront.",
    },
    {
      title: "Costs budgeted separately",
      text: "Advertising, software, AI usage, hosting and production costs, including shoot preparation, travel and editing, aren’t part of a plan. We agree them with you before they’re incurred.",
    },
    {
      title: "Changing or cancelling",
      text: "You can change plans or cancel at any time from Billing in your client portal. An upgrade starts straight away, with the difference charged for the rest of the month. A downgrade or cancellation takes effect at your next renewal, so you keep your plan until the end of the month you’ve paid for.",
    },
    {
      title: "Ownership and handover",
      text: "Work that’s complete and paid for is yours. If you cancel, we hand over the accounts we’ve set up for you. If we’ve built automations, we agree who looks after them, and their running costs stay with your accounts.",
    },
  ];
}
