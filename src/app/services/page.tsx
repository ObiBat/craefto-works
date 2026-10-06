import Link from "next/link";
import { Header, Footer, Container, Section } from "@/components/layout";
import { Separator, PageTransition, AnimatedSection, HeroText, SectionLabel } from "@/components/ui";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { RevealText } from "@/components/editorial/reveal-text";
import { Glide } from "@/components/editorial/glide";
import { ScrollSpotlight } from "@/components/editorial/scroll-spotlight";
import { formatPrice, plansFrom, rangeLabel, weeksLabel } from "@/lib/pricing";
import {
  capabilities,
  capabilityPrices,
  engagements,
  getCapability,
  type Capability,
  type CapabilityId,
} from "@/content/capabilities";
import { CapabilityScroll } from "./capability-scroll";
import { faqGroups } from "@/content/faq";
import { Faq } from "./faq";
import { MonthlyPlans, Tick } from "@/components/sections/monthly-plans";

// The Services page: the five services (brand, product, systems, media and
// growth), in code still "capabilities"; the old service anchors are
// rewritten in CapabilityScroll.

function Arrow({ className }: { className?: string }) {
  return (
    <svg className={cn("w-4 h-4 shrink-0", className)} fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 8l4 4m0 0l-4 4m4-4H3" />
    </svg>
  );
}

/** Capability names as links to their sections on this page. */
function CapabilityTags({ ids, label, className }: { ids: CapabilityId[]; label: string; className?: string }) {
  return (
    <ul className={cn("flex flex-wrap gap-2", className)} aria-label={label}>
      {ids.map((id) => {
        const capability = getCapability(id);
        return (
          <li key={id}>
            <a
              href={`#${id}`}
              className="inline-flex items-center gap-1.5 rounded-full bg-[hsl(var(--color-background-muted))] px-3 py-1.5 text-xs font-medium text-[hsl(var(--color-foreground-muted))] transition-colors hover:text-[hsl(var(--color-accent))]"
            >
              <span className="font-mono text-[hsl(var(--color-accent))]" aria-hidden="true">
                {capability.number}
              </span>
              {capability.name}
            </a>
          </li>
        );
      })}
    </ul>
  );
}

function CapabilityDetail({ capability }: { capability: Capability }) {
  return (
    <section aria-labelledby={capability.id} className="capability grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-16">
      <AnimatedSection className="lg:col-span-5">
        <h2
          id={capability.id}
          data-section={capability.name}
          data-section-number={capability.number}
          className="scroll-mt-8 font-semibold tracking-tight"
        >
          <span
            className="capability-number mb-4 flex w-fit rounded-full px-2.5 py-1 font-mono text-xs font-medium tabular-nums tracking-normal"
            aria-hidden="true"
          >
            {capability.number}
          </span>
          <RevealText text={capability.name} />
        </h2>
        <p data-ink className="mt-5 max-w-md text-lg md:text-xl leading-relaxed text-[hsl(var(--color-foreground-muted))]">
          {capability.summary}
        </p>

        <div className="capability-price mt-10 rounded-2xl p-6">
          <h3 className="label-heading mb-4">Pricing, AUD ex GST</h3>
          <ul className="space-y-3">
            {capabilityPrices(capability).map((range) => (
              <li key={range.service}>
                <span className="block font-medium text-[hsl(var(--color-foreground))]">{range.label}</span>
                <span className="text-sm">
                  <span className="font-medium tabular-nums text-[hsl(var(--color-accent))]">{rangeLabel(range)}</span>
                  <span className="text-[hsl(var(--color-foreground-muted))]"> · {weeksLabel(range)}</span>
                </span>
              </li>
            ))}
          </ul>
          <a
            href="#plans"
            className="group mt-5 inline-flex items-center gap-2 text-sm text-[hsl(var(--color-foreground-muted))] transition-colors hover:text-[hsl(var(--color-accent))]"
          >
            Or ongoing, on a monthly plan from {formatPrice(plansFrom)} a month
            <Arrow className="transition-transform group-hover:translate-x-1" />
          </a>
        </div>
      </AnimatedSection>

      <div className="lg:col-span-7 flex flex-col gap-10 lg:pt-11">
        <p className="text-lg leading-relaxed text-[hsl(var(--color-foreground))]">{capability.description}</p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-10">
          <div>
            <h3 className="label-heading mb-4">Deliverables</h3>
            <ul className="space-y-3">
              {capability.deliverables.map((item, index) => (
                <li key={item} className="flex gap-3 text-[hsl(var(--color-foreground))]">
                  <Tick index={index} className="mt-0.5" />
                  {item}
                </li>
              ))}
            </ul>
          </div>
          <div>
            <h3 className="label-heading mb-4">When you&apos;d need it</h3>
            <p className="leading-relaxed text-[hsl(var(--color-foreground-muted))]">{capability.example}</p>
          </div>
        </div>

        <div>
          <h3 className="label-heading mb-4">Related work</h3>
          <ul className="space-y-3">
            {capability.work.map((item) => (
              <li key={item.slug}>
                <Link href={`/work/${item.slug}`} className="group block">
                  <span className="flex items-center gap-2 font-medium text-[hsl(var(--color-foreground))] transition-colors group-hover:text-[hsl(var(--color-accent))]">
                    {item.project}
                    <Arrow className="text-[hsl(var(--color-foreground-subtle))] transition-transform group-hover:translate-x-1 group-hover:text-[hsl(var(--color-accent))]" />
                  </span>
                  <span className="mt-0.5 block leading-relaxed text-[hsl(var(--color-foreground-muted))]">{item.detail}</span>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}

export default function ServicesPage() {
  return (
    <>
      <Header />
      <CapabilityScroll />
      <PageTransition>
        <main id="main-content" className="pt-20">
          {/* Introduction and the five capabilities at a glance */}
          <Section spacing="sm" className="pb-8 md:pb-12">
            <Container>
              <div className="max-w-3xl">
                <nav className="mb-6" aria-label="Breadcrumb">
                  <ol className="flex items-center gap-2 text-sm text-[hsl(var(--color-foreground-muted))]">
                    <li>
                      <Link href="/" className="hover:text-[hsl(var(--color-foreground))] transition-colors">
                        Home
                      </Link>
                    </li>
                    <li aria-hidden="true"><span className="mx-2">/</span></li>
                    <li className="text-[hsl(var(--color-foreground))] font-medium" aria-current="page">Services</li>
                  </ol>
                </nav>

                <h1 className="font-semibold tracking-tight mb-6"><RevealText text={"Services"} mode="load" /></h1>
                <HeroText delay={0.1}>
                  <p className="text-xl md:text-2xl leading-snug text-[hsl(var(--color-foreground))]">
                    Craefto Works brings brand, digital products, business systems and creative content together.
                  </p>
                </HeroText>
                <HeroText delay={0.2}>
                  <p className="mt-4 max-w-2xl text-lg leading-relaxed text-[hsl(var(--color-foreground-muted))]">
                    Commission one service or combine several. When a project needs more than one, we plan them together, so your identity, website, internal tools and content are made to fit.
                  </p>
                </HeroText>
              </div>

              <HeroText delay={0.3}>
                <nav id="capabilities" aria-label="Services on this page" className="mt-14 scroll-mt-8 md:mt-20">
                  <Glide bleed={16}>
                    <ol>
                      {capabilities.map((capability) => (
                        <li key={capability.id} data-glide-item className="rounded-2xl">
                          <a
                            href={`#${capability.id}`}
                            className="group grid grid-cols-[2.5rem_1fr] md:grid-cols-[3rem_12rem_1fr_auto] items-baseline gap-x-4 md:gap-x-8 gap-y-1 py-5 md:py-6"
                          >
                            <span className="font-mono text-sm tabular-nums text-[hsl(var(--color-foreground-subtle))] transition-colors group-hover:text-[hsl(var(--color-accent))]">
                              {capability.number}
                            </span>
                            <span className="text-2xl md:text-3xl font-semibold tracking-tight text-[hsl(var(--color-foreground))] transition-colors group-hover:text-[hsl(var(--color-accent))]">
                              {capability.name}
                            </span>
                            <span className="col-start-2 md:col-start-auto text-[hsl(var(--color-foreground-muted))] leading-relaxed">
                              {capability.summary}
                            </span>
                            {/* A wrapper, since the global svg rule would override hidden */}
                            <span className="hidden md:block self-center">
                              <Arrow className="text-[hsl(var(--color-foreground-subtle))] transition-transform group-hover:translate-x-1 group-hover:text-[hsl(var(--color-accent))]" />
                            </span>
                          </a>
                        </li>
                      ))}
                    </ol>
                  </Glide>
                </nav>
              </HeroText>
            </Container>
          </Section>

          {/* The capabilities in detail */}
          <div className="py-24 md:py-40">
            <Container>
              <div className="flex flex-col gap-24 md:gap-40">
                {capabilities.map((capability) => (
                  <CapabilityDetail key={capability.id} capability={capability} />
                ))}
              </div>
              <ScrollSpotlight selector=".capability" />
            </Container>
          </div>

          {/* How capabilities combine */}
          <Section spacing="lg" className="pt-0 md:pt-0" aria-labelledby="together-heading">
            <Container>
              <div className="flex flex-col gap-14 md:gap-10">
                <AnimatedSection>
                  <div className="flex flex-col gap-4">
                    <SectionLabel number="06" label="Together" />
                    <h2 id="together-heading" className="font-semibold tracking-tight"><RevealText text={"One service, or several"} /></h2>
                    <p data-ink className="text-lg text-[hsl(var(--color-foreground-muted))] leading-relaxed max-w-2xl">
                      Each service can be commissioned on its own. When a project needs more than one, we plan them as one piece of work: the brand rules carry into the product, the systems fit how the product is used, and the media and marketing are made for the same launch.
                    </p>
                  </div>
                </AnimatedSection>

                <Separator />

                <div className="flex flex-col gap-8">
                  <h3 className="label-heading">Illustrative engagements, not past projects</h3>
                  <ul className="grid grid-cols-1 md:grid-cols-3 gap-10 md:gap-8 lg:gap-12">
                    {engagements.map((engagement) => (
                      <li key={engagement.title} className="flex flex-col gap-4">
                        <h4 className="text-xl font-semibold tracking-tight text-[hsl(var(--color-foreground))]">{engagement.title}</h4>
                        <CapabilityTags ids={engagement.capabilities} label={`Services for ${engagement.title.toLowerCase()}`} />
                        <p className="leading-relaxed text-[hsl(var(--color-foreground-muted))]">{engagement.description}</p>
                      </li>
                    ))}
                  </ul>
                  <div className="flex flex-wrap items-center gap-x-8 gap-y-3">
                    <Link
                      href="/process"
                      className="group inline-flex w-fit items-center gap-2 text-sm font-medium text-[hsl(var(--color-accent))]"
                    >
                      How a project runs
                      <Arrow className="transition-transform group-hover:translate-x-1" />
                    </Link>
                    <Link
                      href="/work"
                      className="group inline-flex w-fit items-center gap-2 text-sm font-medium text-[hsl(var(--color-accent))]"
                    >
                      See real projects in our case studies
                      <Arrow className="transition-transform group-hover:translate-x-1" />
                    </Link>
                  </div>
                </div>
              </div>
            </Container>
          </Section>

          {/* Monthly plans and the AI Automation project (shared with the home page) */}
          <MonthlyPlans number="07" capabilitiesHref="#capabilities" />

          {/* FAQ: the heading and a way to ask stay in view beside the questions */}
          <Section spacing="lg" className="pt-0 md:pt-0" aria-labelledby="faq-heading">
            <Container>
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16">
                <div className="lg:col-span-4">
                  <AnimatedSection className="lg:sticky lg:top-28 flex flex-col gap-4">
                    <SectionLabel number="08" label="FAQ" />
                    <h2 id="faq-heading" className="font-semibold tracking-tight"><RevealText text={"Common questions"} /></h2>
                    <p data-ink className="text-lg text-[hsl(var(--color-foreground-muted))] leading-relaxed">
                      Straight answers on pricing, plans and how we work together.
                    </p>
                    <div className="mt-6 rounded-2xl bg-[hsl(var(--color-background-subtle))] p-6">
                      <p className="font-medium text-[hsl(var(--color-foreground))]">Still have a question?</p>
                      <p className="mt-2 text-sm leading-relaxed text-[hsl(var(--color-foreground-muted))]">
                        Send us a message and we&apos;ll reply within 1 to 2 days, or email{" "}
                        <a href="mailto:hello@craefto.com" className="font-medium text-[hsl(var(--color-foreground))] hover:text-[hsl(var(--color-accent))]">
                          hello@craefto.com
                        </a>
                        .
                      </p>
                      <Link
                        href="/contact"
                        className="group mt-4 inline-flex items-center gap-2 text-sm font-medium text-[hsl(var(--color-accent))]"
                      >
                        Ask us
                        <Arrow className="transition-transform group-hover:translate-x-1" />
                      </Link>
                    </div>
                  </AnimatedSection>
                </div>
                <AnimatedSection delay={0.1} className="lg:col-span-8">
                  <Faq groups={faqGroups} />
                </AnimatedSection>
              </div>
            </Container>
          </Section>

          {/* Enquiry */}
          <Section spacing="lg" className="pt-8 md:pt-12">
            <Container>
              <AnimatedSection variant="scaleIn">
                <div className="rounded-2xl bg-[hsl(var(--color-accent))] p-8 sm:p-10 lg:p-12">
                  <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
                    <div className="max-w-xl">
                      <h2 className="text-2xl sm:text-3xl font-semibold tracking-tight !text-white mb-2"><RevealText text={"Tell us what you’re working on"} /></h2>
                      <p data-ink className="text-white/80 text-base lg:text-lg leading-relaxed">
                        Start with the capability you need or the problem in front of you. You don&apos;t need a finished brief.
                      </p>
                    </div>
                    <Button
                      size="lg"
                      variant="secondary"
                      className="!bg-white !text-[hsl(var(--color-accent))] hover:!bg-[hsl(var(--color-foreground))] hover:!text-white flex-shrink-0"
                      asChild
                    >
                      <Link href="/contact">
                        <span className="btn-text-wrapper">
                          <span className="btn-text-primary">
                            Start a project
                            <Arrow />
                          </span>
                          <span className="btn-text-secondary" aria-hidden="true">
                            Let&apos;s talk
                            <Arrow />
                          </span>
                        </span>
                      </Link>
                    </Button>
                  </div>
                </div>
              </AnimatedSection>
            </Container>
          </Section>
        </main>
      </PageTransition>
      <Footer />
    </>
  );
}
