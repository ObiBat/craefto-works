import type { CSSProperties } from "react";
import Link from "next/link";
import { Container, Section } from "@/components/layout";
import { Separator, AnimatedSection, SectionLabel } from "@/components/ui";
import { Button } from "@/components/ui/button";
import { RevealText } from "@/components/editorial/reveal-text";
import { ScrollSpotlight } from "@/components/editorial/scroll-spotlight";
import { chargesGst } from "@/lib/stripe";
import { aiAutomationProject, formatPrice, monthlyPlans, priceFor, rangeLabel, weeksLabel, type MonthlyPlan } from "@/lib/pricing";
import { cn } from "@/lib/utils";

// The monthly plans and the AI Automation project (lib/pricing.ts), shown on
// the home page and on /services. A server component: whether GST applies
// comes from the Stripe settings.

/** A plan card's header. The copy, laid over it, is decoration: no heading. */
function PlanHead({ plan, copy = false }: { plan: MonthlyPlan; copy?: boolean }) {
  const name = <span className="plan-name block text-4xl font-semibold tracking-tight">{plan.name}</span>;
  return (
    <>
      {copy ? name : <h3>{name}</h3>}
      <p className="plan-for mt-2 text-sm leading-relaxed md:min-h-[3lh] xl:min-h-[2lh]">{plan.bestFor}</p>
      <p className="mt-6 flex items-baseline gap-1.5">
        <span className="plan-price text-3xl font-semibold tracking-tight tabular-nums">{formatPrice(plan.price)}</span>
        <span className="plan-per text-sm">/ month</span>
      </p>
    </>
  );
}

/** The AI Automation project's header, laid out like a plan's. The copy, laid over it, is decoration: no heading. */
function ProjectHead({ copy = false }: { copy?: boolean }) {
  const range = priceFor(aiAutomationProject.service)!;
  const name = <span className="plan-name block text-4xl font-semibold tracking-tight">{aiAutomationProject.name}</span>;
  return (
    <>
      <p className="mb-3">
        <span className="plan-label inline-flex rounded-full px-2.5 py-1 font-mono text-[0.6875rem] uppercase leading-none tracking-[0.06em]">
          One-off project
        </span>
      </p>
      {copy ? name : <h3>{name}</h3>}
      <p className="plan-for mt-2 text-sm leading-relaxed">{aiAutomationProject.bestFor}</p>
      <p className="mt-6">
        <span className="plan-price text-3xl font-semibold tracking-tight tabular-nums">{rangeLabel(range)}</span>
      </p>
      <p className="plan-per mt-1 text-sm">Fixed price, {weeksLabel(range)}</p>
    </>
  );
}

function CheckMark() {
  return (
    <svg className="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
    </svg>
  );
}

/** A tick in a list; fills in after the ticks before it once its card or section is on (see .tick). */
export function Tick({ index, className }: { index: number; className?: string }) {
  return (
    <span className={cn("tick", className)} style={{ "--i": index } as CSSProperties} aria-hidden="true">
      <CheckMark />
    </span>
  );
}

interface MonthlyPlansProps {
  /** The section's number in the page's running order. */
  number: string;
  /** Where "All five capabilities" leads: the list on /services, from either page. */
  capabilitiesHref?: string;
}

export function MonthlyPlans({ number, capabilitiesHref = "/services#capabilities" }: MonthlyPlansProps) {
  return (
    <Section spacing="lg" className="pt-0 md:pt-0" aria-labelledby="plans">
      <Container>
        <div className="flex flex-col gap-14 md:gap-10">
          <AnimatedSection>
            <div className="flex flex-col gap-4">
              <SectionLabel number={number} label="Plans" />
              <h2 id="plans" className="scroll-mt-8 font-semibold tracking-tight"><RevealText text={"Monthly plans"} /></h2>
              <p data-ink className="text-lg text-[hsl(var(--color-foreground-muted))] leading-relaxed max-w-xl">
                Choose the support you can budget for each month. Every plan draws on all five capabilities, and we help you decide where that budget will have the most impact.
              </p>
            </div>
          </AnimatedSection>

          <Separator />

          <ul className="grid grid-cols-1 md:grid-cols-3 gap-4 lg:gap-5">
            {monthlyPlans.map((plan) => (
              <li key={plan.id} className="plan-card flex flex-col rounded-3xl bg-[hsl(var(--color-background-subtle))] p-2">
                <div className="plan-card-head rounded-[1.25rem] bg-[hsl(var(--color-accent-subtle))] px-6 pt-6 pb-7">
                  <PlanHead plan={plan} />
                  {/* The same header in white on green, uncovered while the card is on. */}
                  <div className="plan-card-flood px-6 pt-6 pb-7" aria-hidden="true">
                    <PlanHead plan={plan} copy />
                  </div>
                </div>
                <div className="flex flex-1 flex-col p-6">
                  <ul className="space-y-3">
                    {plan.includes.map((item, index) => (
                      <li key={item} className="flex gap-3 text-sm text-[hsl(var(--color-foreground))]">
                        <Tick index={index} />
                        {item}
                      </li>
                    ))}
                  </ul>
                  <p className="mt-6">
                    <a
                      href={capabilitiesHref}
                      className="inline-flex items-center gap-1.5 rounded-full bg-[hsl(var(--color-background-muted))] px-3 py-1.5 text-xs font-medium text-[hsl(var(--color-foreground-muted))] transition-colors hover:text-[hsl(var(--color-accent))]"
                    >
                      <span className="font-mono text-[hsl(var(--color-accent))]" aria-hidden="true">
                        01&ndash;05
                      </span>
                      All five capabilities
                    </a>
                  </p>
                  <div className="mt-auto pt-8">
                    <Button asChild size="md" className="w-full">
                      <Link href={`/subscribe/${plan.id}`}>Choose this plan</Link>
                    </Button>
                  </div>
                </div>
              </li>
            ))}
          </ul>
          {/* Phones can't hover: there the plan in mid-screen lights up instead. */}
          <ScrollSpotlight selector=".plan-card" media="(hover: none) and (max-width: 767px)" />

          {/* A one-off project rather than a plan. It lights up like the plans (a plan-card). */}
          <AnimatedSection>
            <div className="plan-card grid rounded-3xl bg-[hsl(var(--color-background-subtle))] p-2 md:grid-cols-[minmax(0,5fr)_minmax(0,7fr)]">
              <div className="plan-card-head rounded-[1.25rem] bg-[hsl(var(--color-accent-subtle))] px-6 pt-6 pb-7 md:px-8 md:pt-8">
                <ProjectHead />
                {/* The same header in white on green, uncovered while the card is on. */}
                <div className="plan-card-flood px-6 pt-6 pb-7 md:px-8 md:pt-8" aria-hidden="true">
                  <ProjectHead copy />
                </div>
              </div>
              <div className="flex flex-col gap-8 p-6 md:p-8">
                <ul className="space-y-3">
                  {aiAutomationProject.includes.map((item, index) => (
                    <li key={item} className="flex gap-3 text-sm text-[hsl(var(--color-foreground))]">
                      <Tick index={index} />
                      {item}
                    </li>
                  ))}
                </ul>
                <div className="mt-auto">
                  <Button asChild size="md">
                    <Link href="/contact?service=ai">Discuss your project</Link>
                  </Button>
                </div>
              </div>
            </div>
          </AnimatedSection>

          <p className="text-sm text-[hsl(var(--color-foreground-muted))] max-w-2xl">
            Monthly plans are billed in advance, in AUD{chargesGst() ? " excluding GST" : ""}. Studio time covers planning, revisions, testing and meetings, and we estimate each piece of work before starting. Advertising, software, AI usage, hosting and production costs are budgeted separately. Prefer a single fixed-price project?{" "}
            <Link href="/contact" className="font-medium text-[hsl(var(--color-accent))] hover:underline">
              Tell us what you&apos;re working on
            </Link>
            .
          </p>
        </div>
      </Container>
    </Section>
  );
}
