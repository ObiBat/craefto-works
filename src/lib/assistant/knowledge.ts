import "server-only";
import { siteConfig } from "@/lib/constants";
import { BOOKING_URL } from "@/lib/leads";
import { BUDGETS, ENQUIRY_GROUPS, ENQUIRY_UNSURE, TIMELINES } from "@/lib/enquiry";
import { aiAutomationProject, formatPrice, monthlyPlans, priceFor, priceRanges, rangeLabel, studioTime, weeksLabel } from "@/lib/pricing";
import { chargesGst } from "@/lib/stripe";
import { capabilities, capabilityPrices, engagements } from "@/content/capabilities";
import { caseStudies } from "@/content/case-studies";
import { faqGroups } from "@/content/faq";
import { planTerms } from "@/content/plan-terms";
import { clientChecklist, shapes, stages } from "@/content/process";
import { beliefs, clientWork, commitments, ownWork, startSteps, studioStory } from "@/content/studio";
import { team } from "@/content/team";

// What the website assistant knows: the site's own content files, written
// out as one compact document. It's built from the same files as the pages,
// at deploy, so it can't drift from them. Nothing here is written for the
// assistant alone: if it isn't on the site, the assistant doesn't know it.

const url = (path: string) => `${siteConfig.url}${path}`;

const bullets = (items: string[]) => items.map((item) => `- ${item}`).join("\n");

/** Written for the assistant, it reads the FAQ as it reads the page, without "above". */
const standalone = (text: string) => text.replace(/,? and each capability lists its (prices|timelines) above/g, "");

function aboutStudio() {
  return [
    `# ${siteConfig.studioName}`,
    `${siteConfig.description} Based in Sydney, Australia. ABN 81 278 859 855. Website ${siteConfig.url}, email ${siteConfig.email}.`,
    `${studioStory.founded} ${studioStory.belief} ${studioStory.why}`,
    `Work so far: ${caseStudies.length} projects shipped, ${clientWork.length} for clients and ${ownWork.length} products of our own. Sites launched in three languages (MNG Steel: Mongolian, English and Chinese).`,
    "## The team",
    bullets(team.map((member) => `${member.name}: ${member.role}`)),
    "## What we believe",
    bullets(beliefs.map((belief) => `${belief.title} ${belief.text}`)),
    "## What we commit to",
    bullets(commitments.map((commitment) => `${commitment.title}: ${commitment.text}`)),
    "## How a project starts",
    bullets(startSteps.map((step) => `${step.title}: ${step.text}`)),
    `The Discovery Call is free, 30 minutes, on Google Meet. Book it at ${BOOKING_URL}. Or write through the contact form at ${url("/contact")}, or email ${siteConfig.email}.`,
  ].join("\n\n");
}

function aboutCapabilities() {
  return [
    `# The five services (${url("/services")})`,
    ...capabilities.map((capability) =>
      [
        `## ${capability.number} ${capability.name}: ${capability.serviceName}`,
        `${capability.summary} Scope: ${capability.scope}`,
        capability.description,
        `Deliverables: ${capability.deliverables.join("; ")}.`,
        `When you'd need it: ${capability.example}`,
        `Published prices, AUD before GST: ${capabilityPrices(capability).map((range) => `${range.label} ${rangeLabel(range)}, typically ${weeksLabel(range)}`).join("; ")}.`,
        capability.work.length ? `Related work: ${capability.work.map((work) => `${work.project} (${url(`/work/${work.slug}`)}): ${work.detail}`).join(" ")}` : "",
      ]
        .filter(Boolean)
        .join("\n"),
    ),
    "## How the capabilities combine (illustrations, not past projects)",
    bullets(engagements.map((engagement) => `${engagement.title}: ${engagement.description}`)),
  ].join("\n\n");
}

function aboutPrices() {
  const ai = priceFor(aiAutomationProject.service);
  return [
    `# Published prices (AUD, before GST)`,
    "These are the only prices that exist. Every project gets a fixed price, agreed before any work begins, after the Discovery Call.",
    "## Projects",
    bullets(priceRanges.map((range) => `${range.label}: ${rangeLabel(range)}, typically ${weeksLabel(range)}`)),
    "## Monthly plans",
    bullets(monthlyPlans.map((plan) => `${plan.name}: ${formatPrice(plan.price)} a month, ${studioTime(plan)}. ${plan.bestFor} Includes: ${plan.includes.join("; ")}.`)),
    `## ${aiAutomationProject.name} (a one-off project)`,
    `${aiAutomationProject.bestFor}${ai ? ` Priced as workflow automation and AI: ${rangeLabel(ai)}, typically ${weeksLabel(ai)}.` : ""} ${aiAutomationProject.includes.join(". ")}.`,
    "## Monthly plan terms",
    bullets(planTerms(chargesGst()).map((term) => `${term.title}: ${term.text}`)),
  ].join("\n\n");
}

function aboutProcess() {
  return [
    `# How we work (${url("/process")})`,
    shapes.all,
    ...stages.map((stage) => [`## ${stage.number} ${stage.name}`, `${stage.purpose} ${stage.general}`, `What you have at the end, by capability: ${capabilities.map((capability) => `${capability.name}: ${stage.byCapability[capability.id].outcome}`).join("; ")}.`].join("\n")),
    "## By kind of work",
    bullets(capabilities.map((capability) => `${capability.name}: ${shapes[capability.id]}`)),
    "## What helps us do our best work",
    bullets(clientChecklist),
  ].join("\n\n");
}

function aboutWork() {
  return [
    `# Case studies (${url("/work")})`,
    ...caseStudies.map((study) =>
      [
        `## ${study.title} (${url(`/work/${study.slug}`)})`,
        `${study.description} Client: ${study.client}. Industry: ${study.industry}. ${study.year}, ${study.timeline}.${study.engagement === "ongoing" ? " Ongoing work on a monthly plan." : ""}`,
        `Services: ${study.services.join(", ")}.`,
        `Outcome: ${study.outcome}`,
        study.metrics?.length ? `Figures: ${study.metrics.map((metric) => `${metric.label} ${metric.value}`).join("; ")}.` : "",
        study.liveUrl ? `Live: ${study.liveUrl}` : "",
      ]
        .filter(Boolean)
        .join("\n"),
    ),
  ].join("\n\n");
}

function aboutFaq() {
  return [`# Questions people ask (${url("/services")})`, ...faqGroups.flatMap((group) => group.items.map((item) => `Q: ${item.question}\nA: ${standalone(item.answer)}`))].join("\n\n");
}

function aboutEnquiries() {
  const types = ENQUIRY_GROUPS.flatMap((group) => group.types.map((type) => `${type.value} (${type.label})`));
  return [
    "# Filing an enquiry",
    `What it's about, as the contact form asks: ${[...types, `${ENQUIRY_UNSURE.value} (${ENQUIRY_UNSURE.label})`].join(", ")}.`,
    `Budget bands: ${BUDGETS.map((band) => `${band.value} (${band.label})`).join(", ")}.`,
    `Timelines: ${TIMELINES.map((timeline) => `${timeline.value} (${timeline.label})`).join(", ")}.`,
  ].join("\n\n");
}

/** The whole document, built once per deploy. */
export const KNOWLEDGE = [aboutStudio(), aboutCapabilities(), aboutPrices(), aboutProcess(), aboutWork(), aboutFaq(), aboutEnquiries()].join("\n\n");

// ── Prices it may quote ───────────────────────────────────────────────────

/** A currency figure: $2,900, A$1.9k, AUD 3,900, 2,900 dollars. */
const CURRENCY = /(?:\b(?:A|AU|US|NZ)\$|\$|\b(?:AUD|USD)\s?)\s?(\d[\d,]*(?:\.\d+)?)\s?(k|m|thousand|million)?\b|\b(\d[\d,]*(?:\.\d+)?)\s?(k|m|thousand|million)?\s?(?:AUD|USD|dollars?)\b/gi;
/** A range's second figure, written without its own currency sign: "$2,900 to 8,500". */
const RANGE_TAIL = /^\s?(?:to|–|—|-|and|or)\s?(\d[\d,]*(?:\.\d+)?)\s?(k|m|thousand|million)?\b/i;

const amount = (digits: string, scale?: string) => {
  const value = Number(digits.replace(/,/g, ""));
  const factor = !scale ? 1 : /^k|thousand/i.test(scale) ? 1_000 : 1_000_000;
  return Math.round(value * factor);
};

/** Every currency figure in a text, as whole amounts. */
export function figuresIn(text: string): number[] {
  const figures: number[] = [];
  for (const match of text.matchAll(CURRENCY)) {
    const digits = match[1] ?? match[3];
    if (!digits) continue;
    const scale = match[2] ?? match[4];
    const tail = match[1] ? text.slice((match.index ?? 0) + match[0].length).match(RANGE_TAIL) : null;
    // "$3–5k" is 3,000 to 5,000: the range's scale covers both ends.
    figures.push(amount(digits, scale ?? tail?.[2]));
    if (tail) figures.push(amount(tail[1], tail[2]));
  }
  return figures;
}

/** Every amount the site publishes: the price list, and any figure the knowledge itself quotes. */
export const PUBLISHED_AMOUNTS: Set<number> = new Set([
  0,
  ...priceRanges.flatMap((range) => [range.min, range.max]),
  ...monthlyPlans.map((plan) => plan.price),
  ...figuresIn(KNOWLEDGE),
]);
