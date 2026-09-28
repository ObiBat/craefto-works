"use client";

import Link from "next/link";
import { Header, Footer, Container, Section } from "@/components/layout";
import { Separator, PageTransition, AnimatedSection, StaggeredGrid, StaggeredItem, HeroText, SectionLabel } from "@/components/ui";
import { Button } from "@/components/ui/button";
import { Team } from "@/components/sections/team";
import { RevealText } from "@/components/editorial/reveal-text";

const values = [
  {
    number: "01",
    title: "Clarity over cleverness",
    description: "If it can't be explained simply, it's not ready. We prioritize understanding over complexity.",
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
      </svg>
    ),
  },
  {
    number: "02",
    title: "Systems over shortcuts",
    description: "Foundations that scale, not fixes that create debt. We build for the long term.",
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
      </svg>
    ),
  },
  {
    number: "03",
    title: "Craft over speed",
    description: "We ship when it's right, not when it's fast. Details matter in everything we create.",
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
      </svg>
    ),
  },
  {
    number: "04",
    title: "Partnership over transactions",
    description: "We work with clients, not for them. True collaboration creates the best outcomes.",
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
      </svg>
    ),
  },
];

const whatWeDontDo = [
  {
    text: "Rush to ship half-baked work",
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
      </svg>
    ),
  },
  {
    text: "Follow trends without purpose",
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
      </svg>
    ),
  },
  {
    text: "Disappear after delivery",
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
      </svg>
    ),
  },
  {
    text: "Treat your project as just another job",
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
      </svg>
    ),
  },
];

const lookingAhead = [
  {
    title: "Beyond services",
    description: "We're building toward our own products, tools, and systems we can release into the world.",
  },
  {
    title: "The Lab",
    description: "Experiments, R&D projects, and open resources. Building in public and sharing what we learn.",
  },
  {
    title: "Community",
    description: "Growing a network of founders and creators who share our values and approach to building.",
  },
];

export default function AboutPage() {
  return (
    <>
      <Header />
      <PageTransition>
        <main id="main-content" className="pt-20">
          {/* Hero */}
          <Section spacing="sm">
            <Container>
              <div className="max-w-3xl">
                {/* Breadcrumb */}
                <nav className="mb-8" aria-label="Breadcrumb">
                  <ol className="flex items-center gap-2 text-sm text-[hsl(var(--color-foreground-muted))]">
                    <li>
                      <Link href="/" className="hover:text-[hsl(var(--color-foreground))] transition-colors">
                        Home
                      </Link>
                    </li>
                    <li>
                      <span className="mx-2">/</span>
                    </li>
                    <li className="text-[hsl(var(--color-foreground))] font-medium">About</li>
                  </ol>
                </nav>

                <h1 className="font-semibold tracking-tight mb-6"><RevealText text={"About Us"} mode="load" /></h1>
                <HeroText delay={0.1}>
                  <p className="text-xl text-[hsl(var(--color-foreground-muted))] leading-relaxed max-w-xl">
                    A creative tech studio building systems for founders who think long-term.
                  </p>
                </HeroText>
              </div>
            </Container>
          </Section>

          {/* The Story */}
          <Section spacing="lg" className="pt-0 md:pt-0">
            <Container>
              <div className="flex flex-col gap-14 md:gap-10">
                <AnimatedSection>
                  <div className="flex flex-col gap-4">
                    <SectionLabel number="01" label="The Story" />
                    <h2 className="font-semibold tracking-tight"><RevealText text={"Where it started"} /></h2>
                  </div>
                </AnimatedSection>

                <Separator />

                <AnimatedSection delay={0.1}>
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-20">
                    <div className="space-y-6 text-lg text-[hsl(var(--color-foreground-muted))] leading-relaxed">
                      <p>
                        <strong className="text-[hsl(var(--color-foreground))]">Founded in Sydney by Obi Batbileg</strong> after graduating from Western Sydney University. Built from the belief that businesses deserve better than overpriced templates and disconnected teams.
                      </p>
                    </div>
                    <div className="space-y-6 text-lg text-[hsl(var(--color-foreground-muted))] leading-relaxed">
                      <p>
                        <strong className="text-[hsl(var(--color-foreground))]">Every project gets the same attention:</strong> understand deeply, design intentionally, build precisely. No shortcuts, no outsourcing the hard parts, no disappearing after launch.
                      </p>
                    </div>
                  </div>
                </AnimatedSection>
              </div>
            </Container>
          </Section>

          {/* Philosophy */}
          <Section spacing="lg">
            <Container>
              <div className="flex flex-col gap-14">
                <AnimatedSection>
                  <div className="flex flex-col gap-4">
                    <SectionLabel number="02" label="Philosophy" />
                    <h2 className="font-semibold tracking-tight"><RevealText text={"How we think"} /></h2>
                  </div>
                </AnimatedSection>

                <Separator />

                <AnimatedSection delay={0.1}>
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-20">
                    <div className="space-y-6 text-lg text-[hsl(var(--color-foreground-muted))] leading-relaxed">
                      <p>
                        <strong className="text-[hsl(var(--color-foreground))]">Design and engineering as one.</strong> The best digital products come from treating them as one discipline, not separate departments.
                      </p>
                      <p>
                        <strong className="text-[hsl(var(--color-foreground))]">Systems, not templates.</strong> Every project starts with understanding: what are you actually building, and why?
                      </p>
                    </div>
                    <div className="space-y-6 text-lg text-[hsl(var(--color-foreground-muted))] leading-relaxed">
                      <p>
                        <strong className="text-[hsl(var(--color-foreground))]">Intentional foundations.</strong> We design systems that scale, maintain consistency, and evolve with your business.
                      </p>
                      <p>
                        <strong className="text-[hsl(var(--color-foreground))]">Long-term thinking.</strong> The time we invest in foundations pays off in speed, quality, and longevity.
                      </p>
                    </div>
                  </div>
                </AnimatedSection>
              </div>
            </Container>
          </Section>

          {/* Values */}
          <Section spacing="lg">
            <Container>
              <div className="flex flex-col gap-14">
                <AnimatedSection>
                  <div className="flex flex-col gap-4">
                    <SectionLabel number="03" label="Values" />
                    <h2 className="font-semibold tracking-tight"><RevealText text={"What we believe"} /></h2>
                    <p data-ink className="text-lg text-[hsl(var(--color-foreground-muted))] max-w-xl leading-relaxed mt-2">
                      The principles that guide every decision we make.
                    </p>
                  </div>
                </AnimatedSection>

                <Separator />

                <StaggeredGrid className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  {values.map((value) => (
                    <StaggeredItem key={value.title}>
                      <div className="group p-6 rounded-xl border border-[hsl(var(--color-border))] bg-[hsl(var(--color-background))] hover:border-[hsl(var(--color-border-hover))] hover:shadow-sm transition-all">
                        <div className="flex items-start gap-4">
                          <div className="w-12 h-12 rounded-lg bg-[hsl(var(--color-background-muted))] flex items-center justify-center text-[hsl(var(--color-foreground-muted))] group-hover:text-[hsl(var(--color-accent))] transition-colors flex-shrink-0">
                            {value.icon}
                          </div>
                          <div>
                            <span className="text-xs font-semibold text-[hsl(var(--color-accent))] tabular-nums">
                              {value.number}
                            </span>
                            <h3 className="font-semibold tracking-tight mt-1 mb-2">
                              {value.title}
                            </h3>
                            <p className="text-sm text-[hsl(var(--color-foreground-muted))] leading-relaxed">
                              {value.description}
                            </p>
                          </div>
                        </div>
                      </div>
                    </StaggeredItem>
                  ))}
                </StaggeredGrid>
              </div>
            </Container>
          </Section>

          {/* What We Don't Do */}
          <Section spacing="lg">
            <Container>
              <div className="flex flex-col gap-14">
                <AnimatedSection>
                  <div className="flex flex-col gap-4">
                    <SectionLabel number="04" label="Boundaries" />
                    <h2 className="font-semibold tracking-tight"><RevealText text={"What we don't do"} /></h2>
                    <p data-ink className="text-lg text-[hsl(var(--color-foreground-muted))] max-w-xl leading-relaxed mt-2">
                      Being clear about what we won&apos;t do helps us focus on what we do best.
                    </p>
                  </div>
                </AnimatedSection>

                <Separator />

                <StaggeredGrid className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {whatWeDontDo.map((item) => (
                    <StaggeredItem key={item.text}>
                      <div className="flex items-center gap-4 p-5 rounded-xl border border-[hsl(var(--color-border))] bg-[hsl(var(--color-background))]">
                        <div className="w-10 h-10 rounded-lg bg-[hsl(var(--color-background-muted))] flex items-center justify-center text-[hsl(var(--color-foreground-subtle))] flex-shrink-0">
                          {item.icon}
                        </div>
                        <span className="text-[hsl(var(--color-foreground-muted))]">
                          {item.text}
                        </span>
                      </div>
                    </StaggeredItem>
                  ))}
                </StaggeredGrid>
              </div>
            </Container>
          </Section>

          {/* Looking Ahead */}
          <Section spacing="lg">
            <Container>
              <div className="flex flex-col gap-14">
                <AnimatedSection>
                  <div className="flex flex-col gap-4">
                    <SectionLabel number="05" label="Future" />
                    <h2 className="font-semibold tracking-tight"><RevealText text={"Looking ahead"} /></h2>
                  </div>
                </AnimatedSection>

                <Separator />

                <StaggeredGrid className="grid grid-cols-1 sm:grid-cols-3 gap-8">
                  {lookingAhead.map((item, index) => (
                    <StaggeredItem key={item.title}>
                      <div className="flex flex-col gap-3">
                        <span className="text-xs font-semibold text-[hsl(var(--color-accent))] tabular-nums">
                          {String(index + 1).padStart(2, "0")}
                        </span>
                        <h3 className="font-semibold tracking-tight">{item.title}</h3>
                        <p className="text-sm text-[hsl(var(--color-foreground-muted))] leading-relaxed">
                          {item.description}
                        </p>
                      </div>
                    </StaggeredItem>
                  ))}
                </StaggeredGrid>

                <AnimatedSection delay={0.2}>
                  <div className="max-w-2xl">
                    <p className="text-lg text-[hsl(var(--color-foreground-muted))] leading-relaxed">
                      If you&apos;re a founder building something meaningful, we&apos;d love to hear from you.
                    </p>
                  </div>
                </AnimatedSection>
              </div>
            </Container>
          </Section>

          {/* Team */}
          <Team sectionNumber="06" />

          {/* CTA */}
          <Section spacing="xl">
            <Container>
              <AnimatedSection variant="scaleIn">
                <div className="rounded-2xl bg-[hsl(var(--color-accent))] p-10 sm:p-14 md:p-20">
                  <div className="flex flex-col items-center text-center gap-8 max-w-2xl mx-auto">
                    <span className="text-xs font-medium uppercase font-mono tracking-[0.06em] text-white/70">
                      Connect
                    </span>
                    <h2 className="font-semibold tracking-tight !text-white"><RevealText text={"Let's build something together"} /></h2>
                    <p data-ink className="text-white/80 text-lg leading-relaxed max-w-lg">
                      Interested in new projects and collaborations with people who care about craft.
                    </p>
                    <Button size="lg" variant="secondary" className="mt-2 !bg-white !text-[hsl(var(--color-accent))] hover:!bg-[hsl(var(--color-foreground))] hover:!text-white" asChild>
                      <Link href="/contact">
                        <span className="btn-text-wrapper">
                          <span className="btn-text-primary">
                            Start a conversation
                            <svg
                              className="w-4 h-4"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M17 8l4 4m0 0l-4 4m4-4H3"
                              />
                            </svg>
                          </span>
                          <span className="btn-text-secondary" aria-hidden="true">
                            Say hello
                            <svg
                              className="w-4 h-4"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M17 8l4 4m0 0l-4 4m4-4H3"
                              />
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
