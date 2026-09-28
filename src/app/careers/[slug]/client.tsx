"use client";

import Link from "next/link";
import { Container, Section } from "@/components/layout";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { SectionLabel } from "@/components/ui/section-label";
import {
  PageTransition,
  AnimatedSection,
  HeroText,
} from "@/components/ui";
import type { Role } from "@/lib/careers";
import { RevealText } from "@/components/editorial/reveal-text";

function formatDate(dateString: string): string {
  const date = new Date(dateString + "T00:00:00");
  return date.toLocaleDateString("en-AU", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

interface RolePageClientProps {
  role: Role;
  applyHref: string;
}

export function RolePageClient({ role, applyHref }: RolePageClientProps) {
  return (
    <PageTransition>
      <main id="main-content" className="pt-20">

        {/* ── HERO ── */}
        <Section spacing="lg">
          <Container>
            {/* Breadcrumb */}
            <nav className="mb-10" aria-label="Breadcrumb">
              <ol className="flex items-center gap-2 text-sm text-[hsl(var(--color-foreground-muted))]">
                <li>
                  <Link href="/" className="hover:text-[hsl(var(--color-foreground))] transition-colors">Home</Link>
                </li>
                <li><span className="mx-2">/</span></li>
                <li>
                  <Link href="/careers" className="hover:text-[hsl(var(--color-foreground))] transition-colors">Careers</Link>
                </li>
                <li><span className="mx-2">/</span></li>
                <li className="text-[hsl(var(--color-foreground))] font-medium">{role.title}</li>
              </ol>
            </nav>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-8 items-end">
              {/* Left: Title */}
              <div className="lg:col-span-8">
                <HeroText>
                  <div className="flex flex-wrap items-center gap-3 mb-6">
                    <Badge variant="accent">{role.department}</Badge>
                    <Badge variant="secondary">{role.location}</Badge>
                    <Badge variant="secondary">{role.type}</Badge>
                  </div>
                </HeroText>
                <HeroText delay={0.1}>
                  <h1 className="font-semibold tracking-tight leading-[0.95]">
                    <RevealText text={role.title} mode="load" />
                  </h1>
                </HeroText>
              </div>

              {/* Right: Meta + Apply */}
              <div className="lg:col-span-4 flex flex-col gap-6">
                <HeroText delay={0.2}>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-[hsl(var(--color-foreground-subtle))]">Posted</span>
                      <span className="text-[hsl(var(--color-foreground))] font-medium">{formatDate(role.postedDate)}</span>
                    </div>
                    <div className="h-px bg-[hsl(var(--color-border))]" />
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-[hsl(var(--color-foreground-subtle))]">Location</span>
                      <span className="text-[hsl(var(--color-foreground))] font-medium">{role.location}</span>
                    </div>
                    <div className="h-px bg-[hsl(var(--color-border))]" />
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-[hsl(var(--color-foreground-subtle))]">Type</span>
                      <span className="text-[hsl(var(--color-foreground))] font-medium">{role.type}</span>
                    </div>
                  </div>
                </HeroText>

                <HeroText delay={0.3}>
                  <Button size="lg" className="w-full" asChild>
                    <Link href={applyHref}>
                      <span className="btn-text-wrapper">
                        <span className="btn-text-primary">
                          Apply now
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 17L17 7M17 7H7M17 7v10" />
                          </svg>
                        </span>
                        <span className="btn-text-secondary" aria-hidden="true">
                          Send application
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 17L17 7M17 7H7M17 7v10" />
                          </svg>
                        </span>
                      </span>
                    </Link>
                  </Button>
                </HeroText>
              </div>
            </div>
          </Container>
        </Section>

        <Container>
          <Separator />
        </Container>

        {/* ── ABOUT THE ROLE ── */}
        <Section spacing="lg">
          <Container>
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-8">
              <div className="lg:col-span-4">
                <AnimatedSection>
                  <SectionLabel number="01" label="About the role" />
                </AnimatedSection>
              </div>
              <div className="lg:col-span-7 lg:col-start-6">
                <AnimatedSection delay={0.1}>
                  <p className="text-lg text-[hsl(var(--color-foreground-muted))] leading-[1.8]">
                    {role.description}
                  </p>
                </AnimatedSection>
              </div>
            </div>
          </Container>
        </Section>

        {/* ── WHAT YOU'LL DO ── */}
        <Section spacing="lg">
          <Container>
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-8">
              <div className="lg:col-span-4">
                <AnimatedSection>
                  <SectionLabel number="02" label="Responsibilities" />
                  <h2 className="font-semibold tracking-tight mt-4 text-2xl"><RevealText text={"What you'll do"} /></h2>
                </AnimatedSection>
              </div>
              <div className="lg:col-span-7 lg:col-start-6">
                <div className="border-t border-[hsl(var(--color-border))]">
                  {role.responsibilities.map((item, i) => (
                    <AnimatedSection key={i} delay={i * 0.03}>
                      <div className="flex items-baseline gap-5 py-5 border-b border-[hsl(var(--color-border))]">
                        <span className="text-xs font-semibold text-[hsl(var(--color-foreground-subtle))] tabular-nums flex-shrink-0 w-5 leading-relaxed">
                          {String(i + 1).padStart(2, "0")}
                        </span>
                        <p className="text-[hsl(var(--color-foreground-muted))] leading-relaxed">
                          {item}
                        </p>
                      </div>
                    </AnimatedSection>
                  ))}
                </div>
              </div>
            </div>
          </Container>
        </Section>

        {/* ── REQUIREMENTS ── */}
        <Section spacing="lg">
          <Container>
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-8">
              <div className="lg:col-span-4">
                <AnimatedSection>
                  <SectionLabel number="03" label="Requirements" />
                  <h2 className="font-semibold tracking-tight mt-4 text-2xl"><RevealText text={"What we're looking for"} /></h2>
                </AnimatedSection>
              </div>
              <div className="lg:col-span-7 lg:col-start-6">
                <AnimatedSection delay={0.1}>
                  <ul className="space-y-4">
                    {role.requirements.map((item, i) => (
                      <li key={i} className="flex items-baseline gap-4">
                        <span className="relative top-[-1px] w-1.5 h-1.5 rounded-full bg-[hsl(var(--color-accent))] flex-shrink-0" />
                        <p className="text-[hsl(var(--color-foreground-muted))] leading-relaxed">
                          {item}
                        </p>
                      </li>
                    ))}
                  </ul>
                </AnimatedSection>
              </div>
            </div>
          </Container>
        </Section>

        {/* ── NICE TO HAVES ── */}
        {role.niceToHaves.length > 0 && (
          <Section spacing="lg">
            <Container>
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-8">
                <div className="lg:col-span-4">
                  <AnimatedSection>
                    <SectionLabel number="04" label="Bonus" />
                    <h2 className="font-semibold tracking-tight mt-4 text-2xl"><RevealText text={"Nice to have"} /></h2>
                  </AnimatedSection>
                </div>
                <div className="lg:col-span-7 lg:col-start-6">
                  <AnimatedSection delay={0.1}>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {role.niceToHaves.map((item, i) => (
                        <div key={i} className="flex items-start gap-3 p-4 rounded-lg bg-[hsl(var(--color-background-subtle))]">
                          <svg className="w-4 h-4 mt-0.5 text-[hsl(var(--color-accent))] flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                          <p className="text-sm text-[hsl(var(--color-foreground-muted))] leading-relaxed">
                            {item}
                          </p>
                        </div>
                      ))}
                    </div>
                  </AnimatedSection>
                </div>
              </div>
            </Container>
          </Section>
        )}

        {/* ── APPLY CTA — DARK BANNER ── */}
        <Section spacing="xl">
          <Container>
            <AnimatedSection variant="scaleIn">
              <div className="relative overflow-hidden rounded-2xl bg-[hsl(var(--color-foreground))] p-10 sm:p-16 md:p-20">
                {/* Decorative grid */}
                <div className="absolute inset-0 opacity-[0.03]" style={{
                  backgroundImage: `linear-gradient(hsl(var(--color-background)) 1px, transparent 1px), linear-gradient(90deg, hsl(var(--color-background)) 1px, transparent 1px)`,
                  backgroundSize: "60px 60px",
                }} />

                <div className="relative z-10 flex flex-col md:flex-row md:items-center md:justify-between gap-8">
                  <div className="max-w-lg">
                    <h2 className="font-semibold tracking-tight !text-white text-2xl md:text-3xl mb-3"><RevealText text={"Sounds like you?"} /></h2>
                    <p data-ink className="text-white/60 leading-relaxed">
                      Send your portfolio and a few words about yourself. We read every application.
                    </p>
                  </div>
                  <div className="flex flex-col sm:flex-row gap-4">
                    <Button
                      size="lg"
                      variant="secondary"
                      className="!bg-white !text-[hsl(var(--color-foreground))] hover:!bg-[hsl(var(--color-accent))] hover:!text-white !border-0"
                      asChild
                    >
                      <Link href={applyHref}>
                        <span className="btn-text-wrapper">
                          <span className="btn-text-primary">
                            Apply for this role
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 17L17 7M17 7H7M17 7v10" />
                            </svg>
                          </span>
                          <span className="btn-text-secondary" aria-hidden="true">
                            Send application
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 17L17 7M17 7H7M17 7v10" />
                            </svg>
                          </span>
                        </span>
                      </Link>
                    </Button>
                    <Button
                      size="lg"
                      variant="ghost"
                      className="!text-white/70 hover:!text-white hover:!bg-white/10"
                      asChild
                    >
                      <Link href="/careers">
                        ← All roles
                      </Link>
                    </Button>
                  </div>
                </div>
              </div>
            </AnimatedSection>
          </Container>
        </Section>

      </main>
    </PageTransition>
  );
}
