import Link from "next/link";
import type { Icon } from "@phosphor-icons/react";
import {
  ArrowRight,
  ArrowUpRight,
  CalendarCheck,
  CheckCircle,
  Cube,
  Lightbulb,
  Lightning,
  MapPin,
  SmileyMeh,
  Stack,
  Target,
  XCircle,
} from "@phosphor-icons/react/dist/ssr";
import { Header, Footer, Container, Section } from "@/components/layout";
import { AnimatedSection, HeroText, PageTransition, SectionLabel } from "@/components/ui";
import { Button } from "@/components/ui/button";
import { LogoMark } from "@/components/ui/logo-mark";
import { BookCall } from "@/components/book-call";
import { Glide } from "@/components/editorial/glide";
import { RevealText } from "@/components/editorial/reveal-text";
import { ScrollSpotlight } from "@/components/editorial/scroll-spotlight";
import { caseStudies } from "@/content/case-studies";
import { startSteps } from "@/content/studio";
import { formatPrice, monthlyPlans, plansFrom, priceFor, priceRanges, rangeLabel } from "@/lib/pricing";

// "First time here?": the orientation page. Who we are in brief, the ways to
// work with us and what they cost, what's different, and how to start. Every
// claim matches the services FAQ, the case studies and the Discovery Call.

const WORDS = ["no", "one", "two", "three", "four", "five", "six", "seven", "eight", "nine"];
const inWords = (n: number) => WORDS[n] ?? String(n);
const list = (items: string[]) => (items.length > 1 ? `${items.slice(0, -1).join(", ")} and ${items.at(-1)}` : items.join(""));

const ownCount = caseStudies.filter((study) => /^internal/i.test(study.client)).length;
const clientCount = caseStudies.length - ownCount;
const projectMin = Math.min(...priceRanges.map((range) => range.min));
const projectMax = Math.max(...priceRanges.map((range) => range.max));
const automation = priceFor("ai")!;

const muted = "text-[hsl(var(--color-foreground-muted))]";

const jumps = [
  { href: "#short-version", label: "The short version", note: "Who we are, in three facts" },
  { href: "#ways", label: "Ways to work with us", note: "Projects, plans and AI, with prices" },
  { href: "#different", label: "What's different", note: "Four things you can hold us to" },
  { href: "#how-to-start", label: "How to start", note: "From a sentence to a proposal" },
];

const facts: { icon: Icon; title: string; text: string }[] = [
  { icon: MapPin, title: "Sydney, since 2025", text: "A small studio, founded by Obi Batbileg, a design technologist." },
  {
    icon: Stack,
    title: "Five services, one team",
    text: "Brand, product, systems, media and growth, designed and built by the same people.",
  },
  {
    icon: CheckCircle,
    title: `${caseStudies.length} projects shipped`,
    text: `${inWords(clientCount).replace(/^./, (c) => c.toUpperCase())} for clients and ${inWords(ownCount)} products of our own, each with a case study.`,
  },
];

const ways: { icon: Icon; title: string; price: string; text: string; href: string; cta: string }[] = [
  {
    icon: Cube,
    title: "A fixed-price project",
    price: `Most from ${formatPrice(projectMin)} to ${formatPrice(projectMax)}`,
    text: "For work with a clear finish line: a brand, a website, an app or a shoot. You get a fixed price before any work begins.",
    href: "/services",
    cta: "Services and prices",
  },
  {
    icon: CalendarCheck,
    title: "A monthly plan",
    price: `From ${formatPrice(plansFrom)} a month`,
    text: `Ongoing help across all five services, within a budget you choose: ${list(monthlyPlans.map((plan) => plan.name))}.`,
    href: "/services#plans",
    cta: "Compare the plans",
  },
  {
    icon: Lightning,
    title: "AI Automation",
    price: rangeLabel(automation),
    text: "A one-off project to take repetitive work off your team. We start with one workflow and measure the time it saves.",
    href: "/services#plans",
    cta: "See how it works",
  },
];

const differences = [
  {
    elsewhere: "A designer hands a mockup to a developer, and context gets lost on the way.",
    ours: "The same team designs and builds, so nothing gets lost.",
  },
  {
    elsewhere: "Strategy is a separate phase, done by a separate team.",
    ours: "Strategy, design and code happen as one continuous conversation.",
  },
  {
    elsewhere: "Quotes are estimates, and the final invoice can be a surprise.",
    ours: "A fixed price before any work begins, paid in milestones as work is delivered.",
  },
  {
    elsewhere: "The relationship ends at launch.",
    ours: "Thirty days of support are included, and a monthly plan keeps us close after that.",
  },
];

const startingPoints: { icon: Icon; text: string }[] = [
  { icon: Lightbulb, text: "An idea you can't quite put into words" },
  { icon: SmileyMeh, text: "A frustration with your current site" },
  { icon: Target, text: "A goal without a plan yet" },
];


function SectionIntro({ id, number, label, title, children }: { id: string; number: string; label: string; title: string; children?: React.ReactNode }) {
  return (
    <AnimatedSection>
      <div id={id} className="flex max-w-3xl scroll-mt-28 flex-col gap-4">
        <SectionLabel number={number} label={label} />
        <h2>
          <RevealText text={title} />
        </h2>
        {children && <p className={`text-lg leading-relaxed ${muted}`}>{children}</p>}
      </div>
    </AnimatedSection>
  );
}

export default function StartPage() {
  return (
    <>
      <Header />
      <PageTransition>
        <main id="main-content" className="pt-20">
          {/* Hero: a welcome, and a way straight to what you came for. */}
          <Section spacing="sm">
            <Container>
              <div className="grid gap-14 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)] lg:items-end lg:gap-16">
                <div>
                  <p className="mb-6 font-mono text-xs font-medium uppercase tracking-[0.06em] text-[hsl(var(--color-foreground-subtle))]">
                    First time here?
                  </p>
                  <h1 className="font-semibold tracking-tight">
                    <RevealText text={"Welcome. Here's the short version."} mode="load" />
                  </h1>
                  <HeroText delay={0.15}>
                    <p className={`mt-8 max-w-2xl text-xl leading-relaxed ${muted}`}>
                      Craefto Works is a Sydney studio for brand, digital products, business systems, media and growth. In two minutes:
                      who we are, how you can work with us, what it costs, and how to start.
                    </p>
                  </HeroText>
                </div>
                <HeroText delay={0.3}>
                  <nav aria-label="On this page">
                    <p className="font-mono text-xs uppercase tracking-[0.06em] text-[hsl(var(--color-foreground-subtle))]">On this page</p>
                    <Glide bleed={16}>
                      <ul className="mt-3">
                        {jumps.map((jump, index) => (
                          <li key={jump.href} data-glide-item className="rounded-2xl">
                            <a href={jump.href} className="group flex items-center gap-5 py-4">
                              <span className="font-mono text-xs text-[hsl(var(--color-accent))] tabular-nums">
                                {String(index + 1).padStart(2, "0")}
                              </span>
                              <span className="flex min-w-0 flex-1 flex-col">
                                <span className="font-[family-name:var(--font-heading)] text-xl font-semibold tracking-tight">{jump.label}</span>
                                <span className={`text-sm ${muted}`}>{jump.note}</span>
                              </span>
                              <ArrowRight
                                size={18}
                                aria-hidden="true"
                                className="shrink-0 rotate-90 text-[hsl(var(--color-foreground-subtle))] transition-[transform,color] duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:translate-y-1 group-hover:text-[hsl(var(--color-accent))]"
                              />
                            </a>
                          </li>
                        ))}
                      </ul>
                    </Glide>
                  </nav>
                </HeroText>
              </div>
            </Container>
          </Section>

          {/* 01: who we are, in three facts. */}
          <Section spacing="lg">
            <Container>
              <SectionIntro id="short-version" number="01" label="The short version" title="Who we are" />
              <ul className="mt-12 grid gap-4 md:grid-cols-3">
                {facts.map((fact) => {
                  const FactIcon = fact.icon;
                  return (
                    <li key={fact.title} className="lit-card flex flex-col gap-10 rounded-3xl p-7">
                      <span className="icon-tile">
                        <FactIcon size={30} weight="duotone" aria-hidden="true" />
                      </span>
                      <span className="flex flex-col gap-2">
                        <span className="lit-card-title font-[family-name:var(--font-heading)] text-2xl font-semibold tracking-tight">
                          {fact.title}
                        </span>
                        <span className={`text-sm leading-relaxed ${muted}`}>{fact.text}</span>
                      </span>
                    </li>
                  );
                })}
              </ul>
              <AnimatedSection delay={0.1}>
                <Link href="/about" className="group mt-10 inline-flex items-center gap-2 text-sm font-medium text-[hsl(var(--color-accent))]">
                  Read our story
                  <ArrowRight size={16} aria-hidden="true" className="transition-transform duration-500 group-hover:translate-x-1" />
                </Link>
              </AnimatedSection>
            </Container>
          </Section>

          {/* 02: the three ways in, with what they cost. */}
          <Section spacing="lg">
            <Container>
              <SectionIntro id="ways" number="02" label="Ways to work with us" title="Three ways to start">
                Pick whichever fits. You can always move from one to another.
              </SectionIntro>
              <ul className="mt-12 grid gap-4 md:grid-cols-3">
                {ways.map((way) => {
                  const WayIcon = way.icon;
                  return (
                    <li key={way.title} className="lit-card rounded-3xl">
                      <Link href={way.href} className="flex h-full flex-col gap-10 rounded-3xl p-7 focus-visible:outline-none">
                        <span className="flex items-start justify-between">
                          <span className="icon-tile">
                            <WayIcon size={30} weight="duotone" aria-hidden="true" />
                          </span>
                          <ArrowUpRight size={20} className="lit-card-arrow" aria-hidden="true" />
                        </span>
                        <span className="flex flex-1 flex-col gap-2">
                          <span className="font-mono text-xs text-[hsl(var(--color-accent))] tabular-nums">{way.price}</span>
                          <span className="lit-card-title font-[family-name:var(--font-heading)] text-2xl font-semibold tracking-tight">
                            {way.title}
                          </span>
                          <span className={`text-sm leading-relaxed ${muted}`}>{way.text}</span>
                        </span>
                        <span className="text-sm font-medium text-[hsl(var(--color-foreground))]">{way.cta}</span>
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </Container>
          </Section>

          {/* 03: what's different, as things you can hold us to. */}
          <Section spacing="lg">
            <Container>
              <SectionIntro id="different" number="03" label="What's different" title="One team, start to finish" />
              <div className="mt-10 hidden grid-cols-[minmax(0,1fr)_minmax(0,1fr)] gap-10 px-0 md:grid">
                <p className="font-mono text-xs uppercase tracking-[0.06em] text-[hsl(var(--color-foreground-subtle))]">Often elsewhere</p>
                <p className="font-mono text-xs uppercase tracking-[0.06em] text-[hsl(var(--color-accent))]">With us</p>
              </div>
              <Glide bleed={20}>
                <ul className="mt-4">
                  {differences.map((difference) => (
                    <li key={difference.ours} data-glide-item className="grid gap-4 rounded-2xl py-6 md:grid-cols-2 md:gap-10">
                      <span className="flex gap-3">
                        <XCircle size={24} weight="duotone" aria-hidden="true" className="mt-0.5 shrink-0 text-[hsl(var(--color-foreground-subtle))]" />
                        <span className={`leading-relaxed ${muted}`}>
                          <span className="sr-only">Often elsewhere: </span>
                          {difference.elsewhere}
                        </span>
                      </span>
                      <span className="flex gap-3">
                        <CheckCircle size={24} weight="duotone" aria-hidden="true" className="mt-0.5 shrink-0 text-[hsl(var(--color-accent))]" />
                        <span className="font-medium leading-relaxed text-[hsl(var(--color-foreground))]">
                          <span className="sr-only">With us: </span>
                          {difference.ours}
                        </span>
                      </span>
                    </li>
                  ))}
                </ul>
              </Glide>
            </Container>
          </Section>

          {/* 04: how to start, from whatever you have. */}
          <Section spacing="lg">
            <Container>
              <SectionIntro id="how-to-start" number="04" label="How to start" title="Bring whatever you have">
                You don&apos;t need a polished brief. Many clients start with one of these:
              </SectionIntro>
              <AnimatedSection delay={0.1}>
                <ul className="mt-8 flex flex-wrap gap-3">
                  {startingPoints.map((point) => {
                    const PointIcon = point.icon;
                    return (
                      <li
                        key={point.text}
                        className="inline-flex items-center gap-3 rounded-full bg-[hsl(var(--color-accent-subtle))] py-2.5 pr-5 pl-3 text-sm text-[hsl(var(--color-foreground))]"
                      >
                        <PointIcon size={22} weight="duotone" aria-hidden="true" className="text-[hsl(var(--color-accent))]" />
                        {point.text}
                      </li>
                    );
                  })}
                </ul>
              </AnimatedSection>
              <ol className="mt-14 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                {startSteps.map((step, index) => {
                  const StepIcon = step.icon;
                  return (
                    <li key={step.title} className="lit-card flex flex-col gap-10 rounded-3xl p-7">
                      <span className="flex items-start justify-between">
                        <span className="icon-tile">
                          <StepIcon size={30} weight="duotone" aria-hidden="true" />
                        </span>
                        <span className="font-mono text-xs text-[hsl(var(--color-accent))] tabular-nums" aria-hidden="true">
                          {String(index + 1).padStart(2, "0")}
                        </span>
                      </span>
                      <span className="flex flex-col gap-2">
                        <span className="lit-card-title font-[family-name:var(--font-heading)] text-xl font-semibold tracking-tight">
                          {step.title}
                        </span>
                        <span className={`text-sm leading-relaxed ${muted}`}>{step.text}</span>
                      </span>
                    </li>
                  );
                })}
              </ol>
              <AnimatedSection delay={0.1}>
                <Link href="/process" className="group mt-10 inline-flex items-center gap-2 text-sm font-medium text-[hsl(var(--color-accent))]">
                  How a project runs, phase by phase
                  <ArrowRight size={16} aria-hidden="true" className="transition-transform duration-500 group-hover:translate-x-1" />
                </Link>
              </AnimatedSection>
            </Container>
          </Section>

          {/* Next step: a call or a message. */}
          <Section spacing="xl">
            <Container>
              <AnimatedSection variant="scaleIn">
                <div className="group relative overflow-hidden rounded-3xl bg-[hsl(var(--color-accent))] px-8 py-14 sm:px-14 md:px-20 md:py-20">
                  <LogoMark
                    width={420}
                    height={420}
                    className="pointer-events-none absolute -right-20 -bottom-24 hidden text-white/[0.09] transition-transform duration-[1600ms] ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:rotate-[20deg] md:block"
                  />
                  <div className="relative max-w-2xl">
                    <p className="font-mono text-xs font-medium uppercase tracking-[0.06em] text-white/70">Start a conversation</p>
                    <h2 className="mt-5 !text-white">
                      <RevealText text={"Ready when you are."} />
                    </h2>
                    <p data-no-reveal className="mt-5 max-w-xl text-lg leading-relaxed text-white/80">
                      Book a free 30-minute call, or send us a message. No pressure and no commitment, just a conversation about what
                      you need.
                    </p>
                    <div className="mt-10 flex flex-wrap items-start gap-3">
                      <BookCall size="lg" onDark className="!bg-white !text-[hsl(var(--color-accent))]">
                        Book a free call
                      </BookCall>
                      <Button asChild size="lg" variant="ghost" className="!text-white hover:!bg-white/10">
                        <Link href="/contact">
                          Send a message
                          <ArrowRight size={16} aria-hidden="true" />
                        </Link>
                      </Button>
                    </div>
                    <p data-no-reveal className="mt-10 text-sm text-white/70">
                      Rather look around first?{" "}
                      <Link href="/work" className="text-white underline-offset-4 hover:underline">
                        Case studies
                      </Link>
                      ,{" "}
                      <Link href="/services" className="text-white underline-offset-4 hover:underline">
                        services
                      </Link>{" "}
                      or the{" "}
                      <Link href="/journal" className="text-white underline-offset-4 hover:underline">
                        journal
                      </Link>
                      .
                    </p>
                  </div>
                </div>
              </AnimatedSection>
            </Container>
          </Section>
          <ScrollSpotlight selector=".lit-card" media="(hover: none) and (max-width: 767px)" />
        </main>
      </PageTransition>
      <Footer />
    </>
  );
}
