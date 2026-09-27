"use client";

import Link from "next/link";
import { Header, Footer, Container, Section } from "@/components/layout";
import {
  Separator,
  PageTransition,
  AnimatedSection,
  StaggeredGrid,
  StaggeredItem,
  HeroText,
  SectionLabel,
  Badge,
} from "@/components/ui";
import { Button } from "@/components/ui/button";
import { roles } from "@/lib/careers";

const principles = [
  { text: "Ship real work. No spec projects, no fake briefs." },
  { text: "Trust taste over process. We hire creatives, not task completers." },
  { text: "Small team means your voice carries. Every opinion shapes the output." },
  { text: "Remote by default. Your best work happens where you feel best." },
];

const perks = [
  { label: "Flexible hours", detail: "Work around your energy, not a clock" },
  { label: "Remote first", detail: "Sydney, Melbourne, anywhere with WiFi" },
  { label: "Learning budget", detail: "Tools, courses, conferences on us" },
  { label: "Creative ownership", detail: "Your name on the work, your call on the craft" },
  { label: "No meeting culture", detail: "We write things down. Your calendar stays clean" },
  { label: "Modern tools", detail: "Figma, Adobe CC, the best gear for the job" },
];

export default function CareersPage() {
  return (
    <>
      <Header />
      <PageTransition>
        <main id="main-content" className="pt-20">

          {/* ── HERO ── */}
          <Section spacing="lg">
            <Container>
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-8 items-end">
                {/* Left: headline */}
                <div className="lg:col-span-8">
                  <nav className="mb-10" aria-label="Breadcrumb">
                    <ol className="flex items-center gap-2 text-sm text-[hsl(var(--color-foreground-muted))]">
                      <li>
                        <Link href="/" className="hover:text-[hsl(var(--color-foreground))] transition-colors">Home</Link>
                      </li>
                      <li><span className="mx-2">/</span></li>
                      <li className="text-[hsl(var(--color-foreground))] font-medium">Careers</li>
                    </ol>
                  </nav>

                  <HeroText>
                    <h1 className="font-semibold tracking-tight mb-0 leading-[0.92]">
                      We make things
                      <br />
                      <span className="text-[hsl(var(--color-accent))]">worth looking at.</span>
                      <br />
                      Join us.
                    </h1>
                  </HeroText>
                </div>

                {/* Right: supporting text */}
                <div className="lg:col-span-4">
                  <HeroText delay={0.15}>
                    <p className="text-lg text-[hsl(var(--color-foreground-muted))] leading-relaxed">
                      Craefto is a creative tech studio where design is not decoration. We build brands, products, and visual systems for companies that take craft seriously.
                    </p>
                  </HeroText>
                  <HeroText delay={0.25}>
                    <div className="mt-8 flex items-center gap-4">
                      <span className="inline-flex items-center gap-2 text-sm font-medium text-[hsl(var(--color-foreground-muted))]">
                        <span className="w-2 h-2 rounded-full bg-[hsl(var(--color-accent))] animate-pulse" />
                        {roles.length} open {roles.length === 1 ? "role" : "roles"}
                      </span>
                      <span className="text-sm text-[hsl(var(--color-foreground-subtle))]">·</span>
                      <span className="text-sm text-[hsl(var(--color-foreground-muted))]">Remote</span>
                    </div>
                  </HeroText>
                </div>
              </div>
            </Container>
          </Section>

          {/* ── FULL WIDTH DIVIDER ── */}
          <Container>
            <Separator />
          </Container>

          {/* ── PHILOSOPHY — EDITORIAL PROSE ── */}
          <Section spacing="lg">
            <Container>
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-8">
                <div className="lg:col-span-4">
                  <AnimatedSection>
                    <SectionLabel number="01" label="Philosophy" />
                    <h2 className="font-semibold tracking-tight mt-4">
                      Built for the
                      <br />
                      obsessive
                    </h2>
                  </AnimatedSection>
                </div>

                <div className="lg:col-span-7 lg:col-start-6">
                  <AnimatedSection delay={0.1}>
                    <div className="space-y-8 text-lg text-[hsl(var(--color-foreground-muted))] leading-[1.8]">
                      <p>
                        Most agencies hire creatives then micromanage them into mediocrity. We do the opposite. We set the vision together, then get out of your way. No design by committee. No pixel policing. If we hired you, we trust your taste.
                      </p>
                      <p>
                        Projects here go live. You will build real brands, real campaigns, and real products that people actually see and interact with. Not pitch decks that collect dust in someone&apos;s inbox.
                      </p>
                      <p>
                        One week you might be crafting a fintech brand identity. The next, social campaigns for a wellness startup. Then a presentation deck for a Series A raise. The variety keeps things fresh and your portfolio stacked.
                      </p>
                    </div>
                  </AnimatedSection>
                </div>
              </div>
            </Container>
          </Section>

          {/* ── PRINCIPLES — LINEAR STYLE NUMBERED LIST ── */}
          <Section spacing="lg">
            <Container>
              <AnimatedSection>
                <SectionLabel number="02" label="How we work" />
              </AnimatedSection>

              <div className="mt-12 border-t border-[hsl(var(--color-border))]">
                {principles.map((p, i) => (
                  <AnimatedSection key={i} delay={i * 0.05}>
                    <div className="flex items-start gap-4 py-6 border-b border-[hsl(var(--color-border))]">
                      <span className="mt-2.5 w-1.5 h-1.5 rounded-full bg-[hsl(var(--color-accent))] flex-shrink-0" />
                      <p className="text-lg md:text-xl font-medium text-[hsl(var(--color-foreground))] leading-snug tracking-tight">
                        {p.text}
                      </p>
                    </div>
                  </AnimatedSection>
                ))}
              </div>
            </Container>
          </Section>

          {/* ── OPEN POSITIONS ── */}
          <Section spacing="lg">
            <Container>
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-8">
                <div className="lg:col-span-4">
                  <AnimatedSection>
                    <SectionLabel number="03" label="Open roles" />
                    <h2 className="font-semibold tracking-tight mt-4">
                      Current openings
                    </h2>
                  </AnimatedSection>
                </div>

                <div className="lg:col-span-7 lg:col-start-6">
                  {roles.length > 0 ? (
                    <div className="flex flex-col">
                      {roles.map((role, i) => (
                        <AnimatedSection key={role.slug} delay={i * 0.08}>
                          <Link
                            href={`/careers/${role.slug}`}
                            className="group block py-8 border-b border-[hsl(var(--color-border))] first:pt-0 last:border-b-0 transition-colors"
                          >
                            {/* Department + Meta */}
                            <div className="flex flex-wrap items-center gap-3 mb-4">
                              <Badge variant="accent">{role.department}</Badge>
                              <span className="text-xs text-[hsl(var(--color-foreground-subtle))]">{role.location}</span>
                              <span className="text-xs text-[hsl(var(--color-foreground-subtle))]">·</span>
                              <span className="text-xs text-[hsl(var(--color-foreground-subtle))]">{role.type}</span>
                            </div>

                            {/* Title */}
                            <div className="flex items-center justify-between gap-6">
                              <h3 className="text-2xl md:text-3xl font-semibold tracking-tight group-hover:text-[hsl(var(--color-accent))] transition-colors duration-300">
                                {role.title}
                              </h3>
                              <div className="flex-shrink-0 w-10 h-10 rounded-full border border-[hsl(var(--color-border-strong))] flex items-center justify-center group-hover:bg-[hsl(var(--color-foreground))] group-hover:border-[hsl(var(--color-foreground))] transition-all duration-300">
                                <svg
                                  className="w-4 h-4 text-[hsl(var(--color-foreground-muted))] group-hover:text-[hsl(var(--color-background))] transition-all duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
                                  fill="none"
                                  stroke="currentColor"
                                  viewBox="0 0 24 24"
                                >
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 17L17 7M17 7H7M17 7v10" />
                                </svg>
                              </div>
                            </div>

                            {/* Description */}
                            <p className="mt-3 text-[hsl(var(--color-foreground-muted))] leading-relaxed max-w-lg">
                              {role.description.length > 160
                                ? role.description.slice(0, 160).trim() + "..."
                                : role.description}
                            </p>
                          </Link>
                        </AnimatedSection>
                      ))}
                    </div>
                  ) : (
                    <AnimatedSection delay={0.1}>
                      <div className="py-16 text-center">
                        <p className="text-lg text-[hsl(var(--color-foreground-muted))] mb-6">
                          No open positions right now.
                        </p>
                        <Button asChild>
                          <Link href="/contact">
                            <span className="btn-text-wrapper">
                              <span className="btn-text-primary">Send a general application</span>
                              <span className="btn-text-secondary" aria-hidden="true">Introduce yourself</span>
                            </span>
                          </Link>
                        </Button>
                      </div>
                    </AnimatedSection>
                  )}
                </div>
              </div>
            </Container>
          </Section>

          {/* ── PERKS — MINIMAL GRID ── */}
          <Section spacing="lg">
            <Container>
              <AnimatedSection>
                <SectionLabel number="04" label="What you get" />
              </AnimatedSection>

              <StaggeredGrid className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-0 mt-12 border-t border-[hsl(var(--color-border))]">
                {perks.map((perk, i) => (
                  <StaggeredItem key={perk.label}>
                    <div className={`py-8 px-1 border-b border-[hsl(var(--color-border))] ${
                      i % 3 !== 2 ? "lg:border-r" : ""
                    } ${i % 2 !== 1 ? "sm:border-r lg:border-r-0" : "sm:border-r-0"} ${
                      i % 3 !== 2 ? "lg:border-r" : "lg:border-r-0"
                    } sm:px-6 lg:px-8`}>
                      <p className="font-semibold tracking-tight text-[hsl(var(--color-foreground))] mb-2">
                        {perk.label}
                      </p>
                      <p className="text-sm text-[hsl(var(--color-foreground-muted))] leading-relaxed">
                        {perk.detail}
                      </p>
                    </div>
                  </StaggeredItem>
                ))}
              </StaggeredGrid>
            </Container>
          </Section>

          {/* ── OPEN APPLICATION CTA — FULL BLEED ── */}
          <Section spacing="xl">
            <Container>
              <AnimatedSection variant="scaleIn">
                <div className="relative overflow-hidden rounded-2xl bg-[hsl(var(--color-foreground))] p-10 sm:p-16 md:p-24">
                  {/* Decorative grid */}
                  <div className="absolute inset-0 opacity-[0.03]" style={{
                    backgroundImage: `linear-gradient(hsl(var(--color-background)) 1px, transparent 1px), linear-gradient(90deg, hsl(var(--color-background)) 1px, transparent 1px)`,
                    backgroundSize: "60px 60px",
                  }} />

                  <div className="relative z-10 max-w-2xl">
                    <span className="text-xs font-medium uppercase font-mono tracking-[0.06em] text-white/40 mb-6 block">
                      Open application
                    </span>
                    <h2 className="font-semibold tracking-tight !text-white text-3xl md:text-4xl lg:text-5xl leading-[1.05] mb-6">
                      Don&apos;t see your role?
                      <br />
                      <span className="text-white/50">Introduce yourself.</span>
                    </h2>
                    <p className="text-white/60 text-lg leading-relaxed mb-10 max-w-md">
                      We are always looking for people with sharp taste and genuine craft. If that is you, we want to hear from you.
                    </p>
                    <Button
                      size="lg"
                      variant="secondary"
                      className="!bg-white !text-[hsl(var(--color-foreground))] hover:!bg-[hsl(var(--color-accent))] hover:!text-white !border-0"
                      asChild
                    >
                      <Link href="/contact">
                        <span className="btn-text-wrapper">
                          <span className="btn-text-primary">
                            Get in touch
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 17L17 7M17 7H7M17 7v10" />
                            </svg>
                          </span>
                          <span className="btn-text-secondary" aria-hidden="true">
                            Say hello
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 17L17 7M17 7H7M17 7v10" />
                            </svg>
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
