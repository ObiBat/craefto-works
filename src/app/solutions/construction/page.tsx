import Image from "next/image";
import Link from "next/link";
import { Calculator, CalendarCheck, Clock, ListChecks, PlugsConnected, Translate } from "@phosphor-icons/react/dist/ssr";
import type { Icon } from "@phosphor-icons/react";
import { Header, Footer, Container, Section } from "@/components/layout";
import { Separator, PageTransition, AnimatedSection, HeroText, SectionLabel } from "@/components/ui";
import { Button } from "@/components/ui/button";
import { RevealText } from "@/components/editorial/reveal-text";
import { ScrollSpotlight } from "@/components/editorial/scroll-spotlight";
import { Tick } from "@/components/sections/monthly-plans";
import { Faq } from "@/app/services/faq";
import { getCapability } from "@/content/capabilities";
import { getCaseStudy } from "@/content/case-studies";
import { construction, type ConstructionCapabilityId, type ConstructionTier } from "@/content/construction";
import { plansFrom } from "@/lib/pricing";
import { SITE_URL } from "@/lib/seo";
import { cn } from "@/lib/utils";
import { FlowPreview } from "./flow-preview";
import { ConstructionWorkflow } from "./workflow/graph";

// Construction Operations & AI Integration: an industry solution within
// Systems, for construction subcontractors in Sydney and NSW. Everything it
// says comes from content/construction.ts; prices from lib/pricing.ts.

const ENQUIRE = "/contact?service=construction";
const PAGE_URL = `${SITE_URL}${construction.path}`;

const ICONS: Record<ConstructionCapabilityId, Icon> = {
  scheduling: CalendarCheck,
  timesheets: Clock,
  ai: ListChecks,
  costing: Calculator,
  integration: PlugsConnected,
  languages: Translate,
};

const muted = "text-[hsl(var(--color-foreground-muted))]";
const two = (index: number) => String(index + 1).padStart(2, "0");

function Arrow({ className }: { className?: string }) {
  return (
    <svg className={cn("w-4 h-4 shrink-0", className)} fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 8l4 4m0 0l-4 4m4-4H3" />
    </svg>
  );
}

/** A section's number, name, heading and introduction. */
function SectionIntro({ number, label, id, heading, children }: { number: string; label: string; id: string; heading: string; children: React.ReactNode }) {
  return (
    <AnimatedSection>
      <div className="flex flex-col gap-4">
        <SectionLabel number={number} label={label} />
        <h2 id={id} className="scroll-mt-8 font-semibold tracking-tight">
          <RevealText text={heading} />
        </h2>
        <p data-ink className={`max-w-2xl text-lg leading-relaxed ${muted}`}>
          {children}
        </p>
      </div>
    </AnimatedSection>
  );
}

/** A tier card's header. The copy laid over it, white on green while the card is on, is decoration: no heading. */
function TierHead({ tier, copy = false }: { tier: ConstructionTier; copy?: boolean }) {
  const name = <span className="plan-name block text-3xl font-semibold tracking-tight">{tier.name}</span>;
  return (
    <>
      <p className="mb-3">
        <span className="plan-label inline-flex rounded-full px-2.5 py-1 font-mono text-[0.6875rem] uppercase leading-none tracking-[0.06em]">
          {tier.range ? "Indicative price" : "Monthly plan"}
        </span>
      </p>
      {copy ? name : <h3>{name}</h3>}
      <p className="plan-for mt-2 text-sm leading-relaxed md:min-h-[4lh]">{tier.summary}</p>
      <p className="mt-6">
        <span className="plan-price text-2xl font-semibold tracking-tight tabular-nums">{tier.price}</span>
      </p>
      <p className="plan-per mt-1 text-sm">{tier.timing}</p>
    </>
  );
}

function structuredData() {
  const offer = (tier: ConstructionTier) => ({
    "@type": "Offer",
    name: tier.name,
    description: tier.summary,
    priceSpecification: tier.range
      ? { "@type": "PriceSpecification", minPrice: tier.range.min, maxPrice: tier.range.max, priceCurrency: "AUD", valueAddedTaxIncluded: false }
      : { "@type": "UnitPriceSpecification", minPrice: plansFrom, priceCurrency: "AUD", unitCode: "MON", valueAddedTaxIncluded: false },
  });
  return {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Service",
        "@id": `${PAGE_URL}#service`,
        name: construction.name,
        serviceType: "Construction workflow automation and software integration",
        description: construction.summary,
        url: PAGE_URL,
        category: getCapability("systems").serviceName,
        provider: { "@id": `${SITE_URL}/#organization` },
        areaServed: [
          { "@type": "City", name: "Sydney" },
          { "@type": "State", name: "New South Wales" },
          { "@type": "Country", name: "Australia" },
        ],
        audience: { "@type": "BusinessAudience", audienceType: "Construction subcontractors" },
        availableChannel: { "@type": "ServiceChannel", serviceUrl: `${SITE_URL}${ENQUIRE}`, availableLanguage: ["English"] },
        hasOfferCatalog: { "@type": "OfferCatalog", name: "Ways to start", itemListElement: construction.tiers.map(offer) },
      },
      {
        "@type": "FAQPage",
        "@id": `${PAGE_URL}#faq`,
        mainEntity: construction.faq.map((entry) => ({ "@type": "Question", name: entry.question, acceptedAnswer: { "@type": "Answer", text: entry.answer } })),
      },
      {
        "@type": "BreadcrumbList",
        itemListElement: [
          { "@type": "ListItem", position: 1, name: "Home", item: SITE_URL },
          { "@type": "ListItem", position: 2, name: "Services", item: `${SITE_URL}/services` },
          { "@type": "ListItem", position: 3, name: construction.shortName, item: PAGE_URL },
        ],
      },
    ],
  };
}

export default function ConstructionOperationsPage() {
  const systems = getCapability("systems");
  const artisan = getCaseStudy(construction.proof.slug)!;

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData()).replace(/</g, "\\u003c") }} />
      <Header />
      <PageTransition>
        <main id="main-content" className="pt-20">
          {/* Hero: the promise, and how a suggestion reaches a crew */}
          <Section spacing="sm" className="pb-16 md:pb-24">
            <Container>
              <nav className="mb-6" aria-label="Breadcrumb">
                <ol className={`flex items-center gap-2 text-sm ${muted}`}>
                  <li>
                    <Link href="/" className="transition-colors hover:text-[hsl(var(--color-foreground))]">
                      Home
                    </Link>
                  </li>
                  <li aria-hidden="true">
                    <span className="mx-2">/</span>
                  </li>
                  <li>
                    <Link href="/services" className="transition-colors hover:text-[hsl(var(--color-foreground))]">
                      Services
                    </Link>
                  </li>
                  <li aria-hidden="true">
                    <span className="mx-2">/</span>
                  </li>
                  <li className="font-medium text-[hsl(var(--color-foreground))]" aria-current="page">
                    {construction.shortName}
                  </li>
                </ol>
              </nav>

              <div className="grid grid-cols-1 items-center gap-14 lg:grid-cols-12 lg:gap-16">
                <div className="lg:col-span-7">
                  <HeroText>
                    <Link
                      href={`/services#${systems.id}`}
                      className={`mb-6 inline-flex items-center gap-1.5 rounded-full bg-[hsl(var(--color-background-muted))] px-3 py-1.5 text-xs font-medium ${muted} transition-colors hover:text-[hsl(var(--color-accent))]`}
                    >
                      <span className="font-mono text-[hsl(var(--color-accent))]" aria-hidden="true">
                        {systems.number}
                      </span>
                      {systems.name}: industry solution
                    </Link>
                  </HeroText>
                  <h1 className="mb-6 font-semibold tracking-tight">
                    <RevealText text={construction.headline} mode="load" />
                  </h1>
                  <HeroText delay={0.1}>
                    <p className="text-2xl leading-snug text-[hsl(var(--color-foreground))] md:text-3xl">{construction.statement}</p>
                  </HeroText>
                  <HeroText delay={0.2}>
                    <p className={`mt-6 max-w-2xl text-lg leading-relaxed ${muted}`}>{construction.intro}</p>
                  </HeroText>
                  <HeroText delay={0.3}>
                    <div className="mt-10 flex flex-wrap items-center gap-x-6 gap-y-4">
                      <Button
                        asChild
                        size="lg"
                        hoverText={
                          <>
                            Let&apos;s talk
                            <Arrow />
                          </>
                        }
                      >
                        <Link href={ENQUIRE}>
                          Discuss Your Operations
                          <Arrow />
                        </Link>
                      </Button>
                      <a href="#how-it-works" className={`group inline-flex items-center gap-2 text-sm font-medium ${muted} transition-colors hover:text-[hsl(var(--color-accent))]`}>
                        See how it works
                        <Arrow className="rotate-90 transition-transform group-hover:translate-y-0.5" />
                      </a>
                    </div>
                  </HeroText>
                </div>
                <HeroText delay={0.25} className="lg:col-span-5">
                  <FlowPreview />
                </HeroText>
              </div>
            </Container>
          </Section>

          {/* 01 The problem */}
          <Section spacing="lg" className="pt-8 md:pt-12" aria-labelledby="problem-heading">
            <Container>
              <div className="grid grid-cols-1 gap-12 lg:grid-cols-12 lg:gap-16">
                <div className="lg:col-span-5">
                  <div className="lg:sticky lg:top-28">
                    <SectionIntro number="01" label="The problem" id="problem-heading" heading="Where the week goes">
                      Most subcontractors run on calls, group chats, spreadsheets and accounting software. Each one works on its own; the time goes in the gaps between them.
                    </SectionIntro>
                  </div>
                </div>
                <ol className="flex flex-col gap-10 lg:col-span-7 lg:gap-12">
                  {construction.problems.map((problem, index) => (
                    <li key={problem.title}>
                      <AnimatedSection className="grid grid-cols-[2.5rem_1fr] gap-x-4">
                        <span className="pt-1.5 font-mono text-sm tabular-nums text-[hsl(var(--color-foreground-subtle))]" aria-hidden="true">
                          {two(index)}
                        </span>
                        <div>
                          <h3 className="text-xl font-semibold tracking-tight md:text-2xl">{problem.title}</h3>
                          <p className={`mt-2 max-w-xl text-lg leading-relaxed ${muted}`}>{problem.text}</p>
                        </div>
                      </AnimatedSection>
                    </li>
                  ))}
                </ol>
              </div>
            </Container>
          </Section>

          {/* 02 What it includes */}
          <Section spacing="lg" className="pt-0 md:pt-0" aria-labelledby="includes-heading">
            <Container>
              <div className="flex flex-col gap-14 md:gap-10">
                <SectionIntro number="02" label="What it includes" id="includes-heading" heading="Scheduling, timesheets and job costs, connected">
                  Six parts of one system, chosen for your business. Start with the one that costs you the most time, and add the rest when your team is ready.
                </SectionIntro>
                <ul className="construction-includes grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {construction.capabilities.map((item, index) => {
                    const ItemIcon = ICONS[item.id];
                    return (
                      <li key={item.id} className="lit-card flex flex-col gap-10 rounded-3xl p-7">
                        <span className="icon-tile">
                          <ItemIcon size={30} weight="duotone" aria-hidden="true" />
                        </span>
                        <span className="flex flex-col gap-2">
                          <span className="font-mono text-xs tabular-nums text-[hsl(var(--color-accent))]" aria-hidden="true">
                            {two(index)}
                          </span>
                          <h3 className="lit-card-title font-[family-name:var(--font-heading)] text-2xl font-semibold tracking-tight">{item.title}</h3>
                          <span className={`text-sm leading-relaxed ${muted}`}>{item.text}</span>
                        </span>
                      </li>
                    );
                  })}
                </ul>
                <ScrollSpotlight selector=".construction-includes .lit-card" media="(hover: none)" />
              </div>
            </Container>
          </Section>

          {/* 03 How it works: the data flow */}
          <Section spacing="lg" className="pt-0 md:pt-0" aria-labelledby="how-it-works">
            <Container>
              <div className="flex flex-col gap-14 md:gap-12">
                <SectionIntro number="03" label="How it works" id="how-it-works" heading="From the schedule to payroll, without retyping">
                  How scheduling and timesheet data move through a connected system. Each step is built for you or connected to a tool you already use, and people approve at the marked points.
                </SectionIntro>
                <ConstructionWorkflow />
                <div className="grid grid-cols-1 gap-4 lg:grid-cols-12">
                  <AnimatedSection className="flex flex-col gap-5 rounded-3xl bg-[hsl(var(--color-background-subtle))] p-7 sm:flex-row lg:col-span-7">
                    <span className="icon-tile">
                      <ListChecks size={28} weight="duotone" aria-hidden="true" />
                    </span>
                    <div>
                      <h3 className="text-xl font-semibold tracking-tight">AI suggests. People approve.</h3>
                      <p className={`mt-2 leading-relaxed ${muted}`}>
                        AI drafts crew messages and translations, flags clashes and unusual hours, and suggests who could cover a gap. Its suggestions wait at the approval points: nothing is sent, changed or paid until a person approves it. It doesn&apos;t check qualifications or site safety; those stay with your team.
                      </p>
                    </div>
                  </AnimatedSection>
                  <AnimatedSection delay={0.1} className="rounded-3xl bg-[hsl(var(--color-background-subtle))] p-7 lg:col-span-5">
                    <h3 className="text-xl font-semibold tracking-tight">Who sees what</h3>
                    <dl className="mt-4 flex flex-col gap-3">
                      {construction.roles.map((entry) => (
                        <div key={entry.role} className="grid grid-cols-[6.5rem_1fr] gap-3">
                          <dt className="font-medium text-[hsl(var(--color-foreground))]">{entry.role}</dt>
                          <dd className={`leading-relaxed ${muted}`}>{entry.sees}</dd>
                        </div>
                      ))}
                    </dl>
                  </AnimatedSection>
                </div>
              </div>
            </Container>
          </Section>

          {/* 04 Integrate or build */}
          <Section spacing="lg" className="pt-0 md:pt-0" aria-labelledby="paths-heading">
            <Container>
              <div className="flex flex-col gap-14 md:gap-10">
                <SectionIntro number="04" label="Integrate or build" id="paths-heading" heading="Connect what works. Build what’s missing.">
                  Construction software integration where your tools allow it, and new software where nothing fits. We&apos;ll tell you which suits your business, and why.
                </SectionIntro>
                <Separator />
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:gap-5">
                  {construction.paths.map((path, index) => (
                    <AnimatedSection key={path.title} delay={index * 0.08} className="flex flex-col gap-5 rounded-3xl bg-[hsl(var(--color-background-subtle))] p-7 md:p-8">
                      <p className="font-mono text-xs uppercase tracking-[0.06em] text-[hsl(var(--color-accent))]">{path.kicker}</p>
                      <h3 className="text-3xl font-semibold tracking-tight">{path.title}</h3>
                      <p className={`leading-relaxed ${muted}`}>{path.text}</p>
                      <ul className="mt-auto space-y-3 pt-2">
                        {path.points.map((point, pointIndex) => (
                          <li key={point} className="flex gap-3 text-sm text-[hsl(var(--color-foreground))]">
                            <Tick index={pointIndex} className="mt-0.5" />
                            {point}
                          </li>
                        ))}
                      </ul>
                    </AnimatedSection>
                  ))}
                </div>
                <p className={`max-w-2xl text-sm leading-relaxed ${muted}`}>{construction.pathsNote}</p>
              </div>
            </Container>
          </Section>

          {/* 05 Ways to start: three indicative tiers */}
          <Section spacing="lg" className="pt-0 md:pt-0" aria-labelledby="tiers-heading">
            <Container>
              <div className="flex flex-col gap-14 md:gap-10">
                <SectionIntro number="05" label="Ways to start" id="tiers-heading" heading="Start with one workflow, or connect the lot">
                  Three ways to work together, priced from our published ranges. These are indicative: you get a fixed price after the Discovery Call.
                </SectionIntro>
                <ul className="grid grid-cols-1 gap-4 md:grid-cols-3 lg:gap-5">
                  {construction.tiers.map((tier) => (
                    <li key={tier.name} className="plan-card flex flex-col rounded-3xl bg-[hsl(var(--color-background-subtle))] p-2">
                      <div className="plan-card-head rounded-[1.25rem] bg-[hsl(var(--color-accent-subtle))] px-6 pb-7 pt-6">
                        <TierHead tier={tier} />
                        {/* The same header in white on green, uncovered while the card is on. */}
                        <div className="plan-card-flood px-6 pb-7 pt-6" aria-hidden="true">
                          <TierHead tier={tier} copy />
                        </div>
                      </div>
                      <div className="flex flex-1 flex-col p-6">
                        <ul className="space-y-3">
                          {tier.includes.map((item, index) => (
                            <li key={item} className="flex gap-3 text-sm text-[hsl(var(--color-foreground))]">
                              <Tick index={index} />
                              {item}
                            </li>
                          ))}
                        </ul>
                        <div className="mt-auto pt-8">
                          <Button asChild size="md" className="w-full">
                            <Link href={ENQUIRE}>Discuss this option</Link>
                          </Button>
                        </div>
                      </div>
                    </li>
                  ))}
                </ul>
                {/* Phones can't hover: there the card in mid-screen lights up instead. */}
                <ScrollSpotlight selector=".plan-card" media="(hover: none) and (max-width: 767px)" />
                <p className={`max-w-2xl text-sm leading-relaxed ${muted}`}>{construction.tiersNote}</p>
              </div>
            </Container>
          </Section>

          {/* 06 Related work: Artisan */}
          <Section spacing="lg" className="pt-0 md:pt-0" aria-labelledby="proof-heading">
            <Container>
              <div className="flex flex-col gap-14 md:gap-10">
                <SectionIntro number="06" label="Related work" id="proof-heading" heading="Built for the trade before">
                  We&apos;ve designed and built crew software for Sydney&apos;s steel-fixing trade.
                </SectionIntro>
                <AnimatedSection>
                  <Link href={`/work/${artisan.slug}`} className="group grid overflow-hidden rounded-3xl bg-[hsl(var(--color-background-subtle))] lg:grid-cols-2">
                    <span className="relative block aspect-[16/9] overflow-hidden lg:aspect-auto lg:min-h-[24rem]">
                      <Image
                        src={artisan.heroImage}
                        alt="The Artisan crew app's Today, week and jobs screens on three phones, at a steel-fixing site"
                        fill
                        sizes="(min-width: 1024px) 50vw, 100vw"
                        className="object-cover transition-transform duration-700 ease-out group-hover:scale-[1.02]"
                      />
                    </span>
                    <span className="flex flex-col gap-5 p-7 md:p-10">
                      <span className="font-mono text-xs uppercase tracking-[0.06em] text-[hsl(var(--color-accent))]">Case study</span>
                      <span className="text-3xl font-semibold tracking-tight text-[hsl(var(--color-foreground))] transition-colors group-hover:text-[hsl(var(--color-accent))]">
                        {artisan.title}
                      </span>
                      <span className={`leading-relaxed ${muted}`}>{construction.proof.text}</span>
                      <span className="flex flex-col gap-3">
                        {construction.proof.facts.map((fact, index) => (
                          <span key={fact} className="flex gap-3 text-sm text-[hsl(var(--color-foreground))]">
                            <Tick index={index} className="mt-0.5" />
                            {fact}
                          </span>
                        ))}
                      </span>
                      <span className="mt-auto inline-flex items-center gap-2 pt-2 text-sm font-medium text-[hsl(var(--color-accent))]">
                        Read the Artisan case study
                        <Arrow className="transition-transform group-hover:translate-x-1" />
                      </span>
                    </span>
                  </Link>
                </AnimatedSection>
                <p className={`max-w-2xl text-sm leading-relaxed ${muted}`}>{construction.proof.note}</p>
              </div>
            </Container>
          </Section>

          {/* 07 FAQ: the heading and a way to ask stay in view beside the questions */}
          <Section spacing="lg" className="pt-0 md:pt-0" aria-labelledby="faq-heading">
            <Container>
              <div className="grid grid-cols-1 gap-12 lg:grid-cols-12 lg:gap-16">
                <div className="lg:col-span-4">
                  <AnimatedSection className="flex flex-col gap-4 lg:sticky lg:top-28">
                    <SectionLabel number="07" label="FAQ" />
                    <h2 id="faq-heading" className="font-semibold tracking-tight">
                      <RevealText text={"Common questions"} />
                    </h2>
                    <p data-ink className={`text-lg leading-relaxed ${muted}`}>
                      Implementation, integrations, crews, data and price.
                    </p>
                    <div className="mt-6 rounded-2xl bg-[hsl(var(--color-background-subtle))] p-6">
                      <p className="font-medium text-[hsl(var(--color-foreground))]">Still have a question?</p>
                      <p className={`mt-2 text-sm leading-relaxed ${muted}`}>
                        Tell us how your business runs today and we&apos;ll reply within one to two business days.
                      </p>
                      <Link href={ENQUIRE} className="group mt-4 inline-flex items-center gap-2 text-sm font-medium text-[hsl(var(--color-accent))]">
                        Ask us
                        <Arrow className="transition-transform group-hover:translate-x-1" />
                      </Link>
                    </div>
                  </AnimatedSection>
                </div>
                <AnimatedSection delay={0.1} className="lg:col-span-8">
                  <Faq groups={[{ label: construction.shortName, items: construction.faq }]} />
                </AnimatedSection>
              </div>
            </Container>
          </Section>

          {/* Enquiry */}
          <Section spacing="lg" className="pt-8 md:pt-12">
            <Container>
              <AnimatedSection variant="scaleIn">
                <div className="rounded-2xl bg-[hsl(var(--color-accent))] p-8 sm:p-10 lg:p-12">
                  <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
                    <div className="max-w-xl">
                      <h2 className="mb-2 text-2xl font-semibold tracking-tight !text-white sm:text-3xl">
                        <RevealText text={"Tell us how your operations run"} />
                      </h2>
                      <p data-ink className="text-base leading-relaxed text-white/80 lg:text-lg">
                        Start with the bottleneck that costs you the most time. You don&apos;t need a finished brief.
                      </p>
                    </div>
                    <Button
                      size="lg"
                      variant="secondary"
                      className="flex-shrink-0 !bg-white !text-[hsl(var(--color-accent))] hover:!bg-[hsl(var(--color-foreground))] hover:!text-white"
                      asChild
                      hoverText={
                        <>
                          Let&apos;s talk
                          <Arrow />
                        </>
                      }
                    >
                      <Link href={ENQUIRE}>
                        Discuss Your Operations
                        <Arrow />
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
