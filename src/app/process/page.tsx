"use client";

import Link from "next/link";
import { Header, Footer, Container, Section } from "@/components/layout";
import { Separator, PageTransition, AnimatedSection, StaggeredGrid, StaggeredItem, HeroText, SectionLabel } from "@/components/ui";
import { Button } from "@/components/ui/button";
import { RevealText } from "@/components/editorial/reveal-text";

const phases = [
  {
    number: "01",
    title: "Understand",
    timeline: "Week 1 to 2",
    description: "Before we design or write a single line of code, we make sure we deeply understand your business, your users, and your goals.",
    activities: [
      "Discovery call (free, 30 minutes)",
      "Market research and competitor analysis",
      "Goal definition and success metrics",
      "Technical requirements scoping",
    ],
    deliverable: "Strategy document and detailed proposal with fixed pricing",
  },
  {
    number: "02",
    title: "Design",
    timeline: "Week 2 to 4",
    description: "We turn strategy into structure and visuals. You are involved at every step, so nothing gets built that you have not approved.",
    activities: [
      "Information architecture and sitemap",
      "Wireframes and layout concepts",
      "Visual design and prototyping",
      "Two rounds of review and refinement",
    ],
    deliverable: "Approved designs ready for build",
  },
  {
    number: "03",
    title: "Build",
    timeline: "Week 4 to 8",
    description: "Design and development happen with the same team, so nothing gets lost in translation. We build, test, and iterate until it is right.",
    activities: [
      "Frontend and backend development",
      "CMS setup and content integration",
      "Third party integrations (payments, APIs, analytics)",
      "Internal QA and cross browser testing",
    ],
    deliverable: "Staging site for client review",
  },
  {
    number: "04",
    title: "Launch & Grow",
    timeline: "Week 8+",
    description: "Launch is not the end. We handle deployment, monitor performance, and stay available to help your project evolve.",
    activities: [
      "Deployment, DNS, and SSL configuration",
      "Analytics and tracking setup",
      "30 day post launch support included",
      "Optional ongoing retainer for maintenance and optimization",
    ],
    deliverable: "Live, production ready product with ongoing support",
  },
];

const clientChecklist = [
  "Logo files and brand assets (if available)",
  "Written content or guidance on tone and messaging",
  "Access credentials for existing services (hosting, domain, analytics)",
  "Feedback within 48 hours during review rounds",
  "A single point of contact for decisions",
];

export default function ProcessPage() {
  return (
    <>
      <Header />
      <PageTransition>
        <main id="main-content" className="pt-20">
          {/* Hero */}
          <Section spacing="sm" className="pb-12 md:pb-20">
            <Container>
              <div className="max-w-3xl">
                <nav className="mb-6 md:mb-4" aria-label="Breadcrumb">
                  <ol className="flex items-center gap-2 text-sm text-[hsl(var(--color-foreground-muted))]">
                    <li>
                      <Link href="/" className="hover:text-[hsl(var(--color-foreground))] transition-colors">
                        Home
                      </Link>
                    </li>
                    <li><span className="mx-2">/</span></li>
                    <li className="text-[hsl(var(--color-foreground))] font-medium">How we work</li>
                  </ol>
                </nav>

                <h1 className="font-semibold tracking-tight mb-4"><RevealText text={"How we work"} mode="load" /></h1>
                <HeroText delay={0.1}>
                  <p className="text-lg text-[hsl(var(--color-foreground-muted))] leading-relaxed max-w-xl">
                    Every project follows a clear path. No surprises, no scope creep, no disappearing acts.
                  </p>
                </HeroText>
              </div>
            </Container>
          </Section>

          {/* Phases with Timeline */}
          <Section spacing="lg" className="pt-0 md:pt-0">
            <Container>
              <div className="relative">
                <div className="flex flex-col gap-24 lg:gap-32">
                  {phases.map((phase, index) => (
                    <AnimatedSection key={phase.title} delay={index * 0.1}>
                      <div className="phase grid grid-cols-[3rem_1fr] lg:grid-cols-[4rem_1fr] gap-x-5 lg:gap-x-10">
                        {/* Phase marker: stays beside the phase while you read it,
                            and fills in as the phase arrives (no timeline line). */}
                        <div>
                          <div className="sticky top-28">
                            <div className="phase-marker w-12 h-12 lg:w-16 lg:h-16 rounded-full bg-[hsl(var(--color-accent))] text-white flex items-center justify-center">
                              <span className="text-2xl lg:text-3xl font-bold font-heading">
                                {phase.number}
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* Phase content */}
                        <div className="flex flex-col gap-6">
                          {/* Header with title and timeline badge */}
                          <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                            <h2 className="text-2xl lg:text-3xl font-semibold tracking-tight text-[hsl(var(--color-foreground))]">
                              {phase.title}
                            </h2>
                            <span className="inline-flex items-center px-4 py-1.5 rounded-full text-sm font-semibold bg-[hsl(var(--color-accent))]/15 text-[hsl(var(--color-accent))] border border-[hsl(var(--color-accent))]/25 w-fit">
                              {phase.timeline}
                            </span>
                          </div>

                          <p className="text-lg text-[hsl(var(--color-foreground-muted))] leading-relaxed max-w-2xl">
                            {phase.description}
                          </p>

                          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12">
                            {/* Activities with checkmarks */}
                            <ul className="space-y-3">
                              {phase.activities.map((activity) => (
                                <li key={activity} className="flex items-start gap-3 text-[hsl(var(--color-foreground-muted))]">
                                  <svg className="w-5 h-5 text-[hsl(var(--color-accent))] mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                  </svg>
                                  {activity}
                                </li>
                              ))}
                            </ul>

                            {/* Deliverable card with accent background */}
                            <div className="flex items-start">
                              <div className="rounded-xl bg-[hsl(var(--color-accent))]/10 border border-[hsl(var(--color-accent))]/20 p-6 w-full">
                                <p className="text-xs font-medium text-[hsl(var(--color-accent))] uppercase font-mono tracking-[0.06em] mb-3">
                                  Deliverable
                                </p>
                                <p className="text-[hsl(var(--color-foreground))] font-medium leading-relaxed">
                                  {phase.deliverable}
                                </p>
                              </div>
                            </div>
                          </div>
                        </div>

                      </div>
                    </AnimatedSection>
                  ))}
                </div>
              </div>
            </Container>
          </Section>

          {/* What We Need From You */}
          <Section spacing="lg">
            <Container>
              <div className="flex flex-col gap-14 md:gap-10">
                <AnimatedSection>
                  <div className="flex flex-col gap-4">
                    <SectionLabel number="05" label="Your Part" />
                    <h2 className="font-semibold tracking-tight"><RevealText text={"What we need from you"} /></h2>
                    <p data-ink className="text-lg text-[hsl(var(--color-foreground-muted))] leading-relaxed max-w-xl">
                      Great projects are a collaboration. Here is what helps us deliver our best work.
                    </p>
                  </div>
                </AnimatedSection>

                <Separator />

                <StaggeredGrid className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                  {clientChecklist.map((item, index) => (
                    <StaggeredItem key={item}>
                      <div className="flex items-start gap-3 p-5 rounded-xl border border-[hsl(var(--color-border))] bg-[hsl(var(--color-background))]">
                        <span className="flex-shrink-0 w-6 h-6 rounded-full bg-[hsl(var(--color-accent))]/10 text-[hsl(var(--color-accent))] flex items-center justify-center text-xs font-semibold">
                          {String(index + 1).padStart(2, "0")}
                        </span>
                        <p className="text-sm text-[hsl(var(--color-foreground-muted))] leading-relaxed">
                          {item}
                        </p>
                      </div>
                    </StaggeredItem>
                  ))}
                </StaggeredGrid>
              </div>
            </Container>
          </Section>

          {/* CTA */}
          <Section spacing="lg" className="pt-8 md:pt-12">
            <Container>
              <AnimatedSection variant="scaleIn">
                <div className="rounded-2xl bg-[hsl(var(--color-accent))] p-10 sm:p-14 md:p-16">
                  <div className="flex flex-col items-center text-center gap-8 max-w-2xl mx-auto">
                    <span className="text-xs font-medium uppercase font-mono tracking-[0.06em] text-white/70">
                      Ready?
                    </span>
                    <h2 className="font-semibold tracking-tight !text-white"><RevealText text={"Let's start with a conversation"} /></h2>
                    <p data-ink className="text-white/80 text-lg leading-relaxed max-w-lg">
                      Book a free 30 minute discovery call. We will discuss your goals, answer your questions, and outline next steps.
                    </p>
                    <Button size="lg" variant="secondary" className="mt-2 !bg-white !text-[hsl(var(--color-accent))] hover:!bg-[hsl(var(--color-foreground))] hover:!text-white" asChild>
                      <Link href="/contact">
                        <span className="btn-text-wrapper">
                          <span className="btn-text-primary">
                            Book a discovery call
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                            </svg>
                          </span>
                          <span className="btn-text-secondary" aria-hidden="true">
                            Get in touch
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
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
