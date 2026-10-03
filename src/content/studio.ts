// The studio's own claims, shared by /about and the company profile
// (/company-profile). The numbers come from the case studies, and the
// commitments from the services FAQ and the Terms: change those first, then
// this file.

import type { Icon } from "@phosphor-icons/react";
import {
  Aperture,
  Browsers,
  ChartLineUp,
  ChatCircleText,
  Compass,
  FileText,
  Flag,
  FlowArrow,
  Key,
  Lifebuoy,
  PenNib,
  Receipt,
  RocketLaunch,
  UsersThree,
  VideoCamera,
} from "@phosphor-icons/react/dist/ssr";
import type { CapabilityId } from "./capabilities";
import { caseStudies } from "./case-studies";

/** Work for clients, and products of our own (an "Internal …" client). */
export const clientWork = caseStudies.filter((study) => !/^internal/i.test(study.client));
export const ownWork = caseStudies.filter((study) => /^internal/i.test(study.client));

export const studioFacts = [
  { value: caseStudies.length, label: "Projects shipped" },
  { value: clientWork.length, label: "For clients" },
  { value: ownWork.length, label: "Products of our own" },
  // MNG Steel's site launched in Mongolian, English and Chinese.
  { value: 3, label: "Languages launched" },
];

export const capabilityIcons: Record<CapabilityId, Icon> = {
  brand: PenNib,
  product: Browsers,
  systems: FlowArrow,
  media: Aperture,
  growth: ChartLineUp,
};

export const beliefs = [
  { title: "Clarity over cleverness.", text: "If it can't be explained simply, it isn't ready." },
  { title: "Systems over shortcuts.", text: "Foundations that hold as you grow, not fixes that turn into debt." },
  { title: "Craft over speed.", text: "We ship when it's right, not when it's rushed. The details are the work." },
  { title: "Partnership over transactions.", text: "We work with you, not just for you, and plan for the years after launch." },
];

export const commitments: { icon: Icon; title: string; text: string }[] = [
  {
    icon: Receipt,
    title: "A fixed price before we start",
    text: "We scope the work with you and give you a fixed price before any of it begins.",
  },
  {
    icon: Flag,
    title: "You pay as work is delivered",
    text: "Projects run in milestones, typically 30% upfront, 40% at design approval and 30% on launch, so you never pay ahead of the work.",
  },
  {
    icon: UsersThree,
    title: "One team, no handoffs",
    text: "Design and development happen in the same studio, as one continuous conversation, so nothing gets lost between teams.",
  },
  {
    icon: Compass,
    title: "No surprises",
    text: "Your timeline is confirmed in the proposal, and we keep you informed throughout, in plain language.",
  },
  {
    icon: Lifebuoy,
    title: "We stay after launch",
    text: "Every project includes 30 days of support. After that, a monthly plan covers fixes, updates and new work.",
  },
  {
    icon: Key,
    title: "What we make is yours",
    text: "On full payment, the final work belongs to you, and we hand over the accounts we set up for you.",
  },
];

/** Why the studio exists, as the About page tells it. */
export const studioStory = {
  founded: "Obi Batbileg founded Craefto Works in Sydney in 2025",
  belief: "on a simple belief: businesses deserve better than overpriced templates and a different supplier for every part of the job.",
  why: "A brand, a website, the systems behind it and the content that fills it too often come from different places, and they never quite fit together. So we brought all five capabilities into one studio, where design and engineering are one discipline and every piece is built to work with the next.",
};

/** How a project starts, on /start and in the company profile. */
export const startSteps: { icon: Icon; title: string; text: string }[] = [
  { icon: ChatCircleText, title: "Tell us what you have in mind", text: "A sentence is enough. You don't need a polished brief." },
  {
    icon: VideoCamera,
    title: "We talk it through",
    text: "A free 30-minute discovery call on Google Meet, about your business and your goals.",
  },
  { icon: FileText, title: "You get a proposal", text: "A fixed price and a timeline, so you can decide with everything on the table." },
  { icon: RocketLaunch, title: "We get to work", text: "You work directly with the people doing the work, and hear from us throughout." },
];
