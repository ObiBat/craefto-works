import Link from "next/link";
import type { Icon } from "@phosphor-icons/react";
import { ArrowRight, ArrowsClockwise, Cube } from "@phosphor-icons/react/dist/ssr";
import { Header, Footer, Container, Section } from "@/components/layout";
import { HeroText, PageTransition, AnimatedSection } from "@/components/ui";
import { RevealText } from "@/components/editorial/reveal-text";
import { ScrollSpotlight } from "@/components/editorial/scroll-spotlight";
import { SectionIntro } from "@/components/editorial/section-intro";
import { StudioCta } from "@/components/sections/studio-cta";
import { clientChecklist, stages } from "@/content/process";
import { formatPrice, monthlyPlans, plansFrom } from "@/lib/pricing";
import { StageExplorer } from "./stage-explorer";

// One methodology for every kind of work. The stages and what happens in
// each live in content/process.ts; the plan figures come from lib/pricing.ts.

const muted = "text-[hsl(var(--color-foreground-muted))]";
const list = (items: string[]) => (items.length > 1 ? `${items.slice(0, -1).join(", ")} or ${items.at(-1)}` : items.join(""));

const ways: { icon: Icon; title: string; text: string; href: string; cta: string }[] = [
  {
    icon: Cube,
    title: "A fixed-price project",
    text: "Runs through the six stages once. You get a fixed price before any work begins, and pay in milestones as the work is delivered: typically 30% upfront, 40% at design approval and 30% on launch. Every project includes 30 days of support after launch.",
    href: "/services",
    cta: "Capabilities and prices",
  },
  {
    icon: ArrowsClockwise,
    title: "A monthly plan",
    text: `Define, Create, Build / Produce and Launch repeat every month, from a shared, prioritised queue, within the studio time you reserve: ${list(monthlyPlans.map((plan) => `${plan.hours}`))} hours a month, from ${formatPrice(plansFrom)}. Estimates are agreed before anything starts.`,
    href: "/services#plans",
    cta: "Compare the plans",
  },
];

export default function ProcessPage() {
  return (
    <>
      <Header />
      <PageTransition>
        <main id="main-content" className="pt-20">
          {/* Hero: one way of working, and the six stages at a glance. */}
          <Section spacing="sm">
            <Container>
              <div className="max-w-4xl">
                <p className="mb-6 font-mono text-xs font-medium uppercase tracking-[0.06em] text-[hsl(var(--color-foreground-subtle))]">
                  How we work
                </p>
                <h1 className="font-semibold tracking-tight">
                  <RevealText text={"Six stages, shaped to the work."} mode="load" />
                </h1>
                <HeroText delay={0.15}>
                  <p className={`mt-8 max-w-2xl text-xl leading-relaxed ${muted}`}>
                    A brand, a website, an automation, a shoot and a campaign don&apos;t run the same way, so we don&apos;t pretend they
                    do. Every engagement moves through the same six stages, and what happens in each depends on what we&apos;re making.
                  </p>
                </HeroText>
              </div>
              <HeroText delay={0.3}>
                <ol className="mt-12 flex flex-wrap items-center gap-x-3 gap-y-3 md:mt-16" aria-label="The six stages">
                  {stages.map((stage, index) => (
                    <li key={stage.id} className="flex items-center gap-3">
                      <Link
                        href={`#${stage.id}`}
                        className="group inline-flex items-center gap-2 rounded-full bg-[hsl(var(--color-background-subtle))] px-4 py-2 text-sm font-medium transition-colors duration-300 hover:bg-[hsl(var(--color-accent-subtle))] hover:text-[hsl(var(--color-accent))]"
                      >
                        <span className="font-mono text-xs tabular-nums text-[hsl(var(--color-accent))]">{stage.number}</span>
                        {stage.name}
                      </Link>
                      {index < stages.length - 1 && <ArrowRight size={14} aria-hidden="true" className="text-[hsl(var(--color-foreground-subtle))]" />}
                    </li>
                  ))}
                </ol>
              </HeroText>
            </Container>
          </Section>

          {/* 01: the stages, for all work or one capability. */}
          <Section spacing="lg">
            <Container>
              <SectionIntro number="01" label="The stages" title="From the first call to what comes after launch" />
              <StageExplorer />
              <ScrollSpotlight selector=".phase.capability" />
            </Container>
          </Section>

          {/* 02: a project runs through them once; a plan keeps them turning. */}
          <Section spacing="lg">
            <Container>
              <SectionIntro number="02" label="Projects and plans" title="Once, or every month">
                The same stages carry a one-off project and ongoing work. The difference is how often they turn.
              </SectionIntro>
              <ul className="mt-12 grid gap-4 md:grid-cols-2">
                {ways.map((way) => {
                  const WayIcon = way.icon;
                  return (
                    <li key={way.title} className="lit-card rounded-3xl">
                      <Link href={way.href} className="flex h-full flex-col gap-10 rounded-3xl p-7 focus-visible:outline-none md:p-9">
                        <span className="icon-tile">
                          <WayIcon size={30} weight="duotone" aria-hidden="true" />
                        </span>
                        <span className="flex flex-col gap-3">
                          <span className="lit-card-title font-[family-name:var(--font-heading)] text-2xl font-semibold tracking-tight">{way.title}</span>
                          <span className={`leading-relaxed ${muted}`}>{way.text}</span>
                          <span className="mt-2 inline-flex items-center gap-2 text-sm font-medium text-[hsl(var(--color-accent))]">
                            {way.cta}
                            <ArrowRight size={16} aria-hidden="true" className="lit-card-arrow" />
                          </span>
                        </span>
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </Container>
          </Section>

          {/* 03: what helps, whatever the work. */}
          <Section spacing="lg">
            <Container>
              <SectionIntro number="03" label="Your part" title="What we need from you">
                Good work is a collaboration. These help, whatever we&apos;re making together.
              </SectionIntro>
              <AnimatedSection delay={0.1}>
                <ul className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {clientChecklist.map((item, index) => (
                    <li key={item} className="lit-card flex flex-col gap-6 rounded-3xl p-7">
                      <span className="font-mono text-xs tabular-nums text-[hsl(var(--color-accent))]">{String(index + 1).padStart(2, "0")}</span>
                      <span className="lit-card-title text-lg font-medium leading-snug tracking-tight">{item}</span>
                    </li>
                  ))}
                </ul>
              </AnimatedSection>
            </Container>
          </Section>

          <StudioCta
            title="Tell us what you're working on."
            text="Book a free 30-minute call, or send us a message. We'll tell you plainly which stages your work needs, and what it would take."
          />
          <ScrollSpotlight selector=".lit-card" media="(hover: none) and (max-width: 767px)" />
        </main>
      </PageTransition>
      <Footer />
    </>
  );
}
