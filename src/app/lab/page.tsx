"use client";

import Link from "next/link";
import { Header, Footer, Container, Section } from "@/components/layout";
import { Separator, PageTransition, AnimatedSection, StaggeredGrid, StaggeredItem, HeroText, SectionLabel } from "@/components/ui";
import { Button } from "@/components/ui/button";
import { Team } from "@/components/sections/team";

const beliefs = [
  {
    title: "Understand before building",
    description: "Rushing to build before understanding the problem always costs more in the end. We invest time upfront to get the foundation right.",
  },
  {
    title: "One team, no handoffs",
    description: "Design and development happen together. Context is never lost between departments or vendors. You talk to the people who do the work.",
  },
  {
    title: "Craft over speed",
    description: "We would rather take an extra week to get it right than ship something average. Quality compounds. Shortcuts don\u2019t.",
  },
];

export default function LabPage() {
  return (
    <>
      <Header />
      <PageTransition>
        <main id="main-content" className="pt-20">
          {/* Hero */}
          <Section spacing="sm" className="pb-8 md:pb-6">
            <Container>
              <div className="max-w-3xl">
                {/* Breadcrumb */}
                <nav className="mb-6 md:mb-4" aria-label="Breadcrumb">
                  <ol className="flex items-center gap-2 text-sm text-[hsl(var(--color-foreground-muted))]">
                    <li>
                      <a href="/" className="hover:text-[hsl(var(--color-foreground))] transition-colors">
                        Home
                      </a>
                    </li>
                    <li>
                      <span className="mx-2">/</span>
                    </li>
                    <li className="text-[hsl(var(--color-foreground))] font-medium">About</li>
                  </ol>
                </nav>

                <HeroText>
                  <h1 className="font-semibold tracking-tight mb-4">
                    About Craefto
                  </h1>
                </HeroText>
                <HeroText delay={0.1}>
                  <p className="text-lg text-[hsl(var(--color-foreground-muted))] leading-relaxed max-w-xl">
                    A small studio built on the belief that businesses deserve better than overpriced templates and disconnected teams.
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
                    <h2 className="font-semibold tracking-tight">
                      Where it started
                    </h2>
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

          {/* How We Think */}
          <Section spacing="lg">
            <Container>
              <div className="flex flex-col gap-14">
                <AnimatedSection>
                  <div className="flex flex-col gap-4">
                    <SectionLabel number="02" label="How We Think" />
                    <h2 className="font-semibold tracking-tight">
                      Beliefs that shape our work
                    </h2>
                  </div>
                </AnimatedSection>

                <Separator />

                <StaggeredGrid className="grid grid-cols-1 sm:grid-cols-3 gap-8">
                  {beliefs.map((belief, index) => (
                    <StaggeredItem key={belief.title}>
                      <div className="flex flex-col gap-3">
                        <span className="text-xs font-semibold text-[hsl(var(--color-accent))] tabular-nums">
                          {String(index + 1).padStart(2, "0")}
                        </span>
                        <h3 className="font-semibold tracking-tight">{belief.title}</h3>
                        <p className="text-sm text-[hsl(var(--color-foreground-muted))] leading-relaxed">
                          {belief.description}
                        </p>
                      </div>
                    </StaggeredItem>
                  ))}
                </StaggeredGrid>
              </div>
            </Container>
          </Section>

          {/* Team */}
          <Team sectionNumber="03" />

          {/* Stay Updated */}
          <Section spacing="lg" className="pt-8 md:pt-12">
            <Container>
              <AnimatedSection variant="scaleIn">
                <div className="rounded-2xl bg-[hsl(var(--color-background-muted))] border border-[hsl(var(--color-border))] p-10 sm:p-14 md:p-16">
                  <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-8">
                    <div className="max-w-xl">
                      <span className="text-xs font-medium uppercase font-mono tracking-[0.06em] text-[hsl(var(--color-foreground-subtle))]">
                        Stay Updated
                      </span>
                      <h2 className="font-semibold tracking-tight mt-3 mb-4">
                        Follow our work
                      </h2>
                      <p className="text-[hsl(var(--color-foreground-muted))] leading-relaxed">
                        We share our process, new projects, and the occasional insight on building better digital products.
                      </p>
                    </div>
                    <div className="flex flex-col sm:flex-row gap-3 lg:flex-shrink-0">
                      <Button size="lg" asChild>
                        <a href="https://x.com/craefto" target="_blank" rel="noopener noreferrer">
                          <span className="btn-text-wrapper">
                            <span className="btn-text-primary">
                              Follow on X
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                              </svg>
                            </span>
                            <span className="btn-text-secondary" aria-hidden="true">
                              Follow on X
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                              </svg>
                            </span>
                          </span>
                        </a>
                      </Button>
                      <Button size="lg" variant="secondary" asChild>
                        <Link href="/journal">
                          <span className="btn-text-wrapper">
                            <span className="btn-text-primary">Read Journal</span>
                            <span className="btn-text-secondary" aria-hidden="true">Read Journal</span>
                          </span>
                        </Link>
                      </Button>
                    </div>
                  </div>
                </div>
              </AnimatedSection>
            </Container>
          </Section>

          {/* CTA */}
          <Section spacing="lg" className="pt-0">
            <Container>
              <AnimatedSection variant="scaleIn">
                <div className="rounded-2xl bg-[hsl(var(--color-accent))] p-10 sm:p-14 md:p-16">
                  <div className="flex flex-col items-center text-center gap-8 max-w-2xl mx-auto">
                    <span className="text-xs font-medium uppercase font-mono tracking-[0.06em] text-white/70">
                      Work With Us
                    </span>
                    <h2 className="font-semibold tracking-tight !text-white">
                      Have a project in mind?
                    </h2>
                    <p className="text-white/80 text-lg leading-relaxed max-w-lg">
                      You don&apos;t need a finished brief. Tell us what you are thinking about and we will figure out the best path forward together.
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
