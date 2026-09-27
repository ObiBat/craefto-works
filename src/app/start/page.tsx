"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { Header, Footer, Container, Section } from "@/components/layout";
import { Separator, PageTransition, AnimatedSection, StaggeredGrid, StaggeredItem, HeroText, SectionLabel } from "@/components/ui";
import { Button } from "@/components/ui/button";

const stats = [
  { label: "Founded", value: "2025" },
  { label: "Based in", value: "Sydney" },
  { label: "Capability", value: "Design + Code + Strategy" },
];

const clientBrings = [
  {
    icon: (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 18v-5.25m0 0a6.01 6.01 0 001.5-.189m-1.5.189a6.01 6.01 0 01-1.5-.189m3.75 7.478a12.06 12.06 0 01-4.5 0m3.75 2.383a14.406 14.406 0 01-3 0M14.25 18v-.192c0-.983.658-1.823 1.508-2.316a7.5 7.5 0 10-7.517 0c.85.493 1.509 1.333 1.509 2.316V18" />
      </svg>
    ),
    text: "An idea they can\u2019t articulate",
  },
  {
    icon: (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M15.182 16.318A4.486 4.486 0 0012.016 15a4.486 4.486 0 00-3.198 1.318M21 12a9 9 0 11-18 0 9 9 0 0118 0zM9.75 9.75c0 .414-.168.75-.375.75S9 10.164 9 9.75 9.168 9 9.375 9s.375.336.375.75zm-.375 0h.008v.015h-.008V9.75zm5.625 0c0 .414-.168.75-.375.75s-.375-.336-.375-.75.168-.75.375-.75.375.336.375.75zm-.375 0h.008v.015h-.008V9.75z" />
      </svg>
    ),
    text: "A frustration with their current site",
  },
  {
    icon: (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M3 3v1.5M3 21v-6m0 0l2.77-.693a9 9 0 016.208.682l.108.054a9 9 0 006.086.71l3.114-.732a48.524 48.524 0 01-.005-10.499l-3.11.732a9 9 0 01-6.085-.711l-.108-.054a9 9 0 00-6.208-.682L3 4.5M3 15V4.5" />
      </svg>
    ),
    text: "A goal without a plan",
  },
];

const comparisons = [
  {
    typical: "Designer makes a mockup, hands it to a developer. Context is lost in translation.",
    craefto: "Same team designs and builds. Nothing gets lost.",
  },
  {
    typical: "Strategy is a separate phase, done by a separate team. Disconnected from execution.",
    craefto: "Strategy, design, and code happen as one continuous conversation.",
  },
  {
    typical: "Security is an afterthought. Tested only when something goes wrong.",
    craefto: "Security and AI expertise are built in from day one.",
  },
];

const serviceLinks = [
  { title: "Web Design & Development", href: "/services#web" },
  { title: "Brand Identity", href: "/services#brand" },
  { title: "Digital Products", href: "/services#products" },
  { title: "AI & Automation", href: "/services#ai" },
  { title: "Security & Pen Testing", href: "/services#security" },
];

export default function StartPage() {
  const router = useRouter();

  const handleServiceClick = (e: React.MouseEvent<HTMLAnchorElement>, href: string) => {
    e.preventDefault();
    const hash = href.split("#")[1];
    if (hash) {
      sessionStorage.setItem("scrollToService", hash);
    }
    router.push("/services");
  };

  return (
    <>
      <Header />
      <PageTransition>
        <main id="main-content" className="pt-20">
          {/* Hero */}
          <Section spacing="sm" className="pb-8 md:pb-6">
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
                    <li className="text-[hsl(var(--color-foreground))] font-medium">First Time Here</li>
                  </ol>
                </nav>

                <HeroText>
                  <h1 className="font-semibold tracking-tight mb-4">
                    New here? Let us introduce ourselves.
                  </h1>
                </HeroText>
                <HeroText delay={0.1}>
                  <p className="text-lg text-[hsl(var(--color-foreground-muted))] leading-relaxed max-w-xl">
                    We&apos;re a small, focused team in Sydney that designs and builds digital products for businesses that care about quality.
                  </p>
                </HeroText>
              </div>
            </Container>
          </Section>

          {/* Section 01: Who We Are — paragraph + stat cards */}
          <Section spacing="lg" className="pt-0 md:pt-0">
            <Container>
              <div className="flex flex-col gap-14 md:gap-10">
                <AnimatedSection>
                  <div className="flex flex-col gap-4">
                    <SectionLabel number="01" label="Who We Are" />
                    <h2 className="font-semibold tracking-tight">
                      Design, code, and strategy under one roof
                    </h2>
                  </div>
                </AnimatedSection>

                <Separator />

                <AnimatedSection delay={0.1}>
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-20">
                    <div className="space-y-6 text-lg text-[hsl(var(--color-foreground-muted))] leading-relaxed">
                      <p>
                        <strong className="text-[hsl(var(--color-foreground))]">Small team, full capability.</strong> Founded by Obi Batbileg, a design technologist who builds at the intersection of design, engineering, and systems thinking. We handle design, engineering, and strategy as one continuous conversation. No handoffs between departments, no lost context, no surprises.
                      </p>
                    </div>
                    <StaggeredGrid className="grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-1 gap-4">
                      {stats.map((stat) => (
                        <StaggeredItem key={stat.label}>
                          <div className="rounded-xl border border-[hsl(var(--color-border))] bg-[hsl(var(--color-background-subtle))] p-5">
                            <p className="text-xs font-medium text-[hsl(var(--color-accent))] uppercase font-mono tracking-[0.06em] mb-1">
                              {stat.label}
                            </p>
                            <p className="text-lg font-semibold text-[hsl(var(--color-foreground))]">
                              {stat.value}
                            </p>
                          </div>
                        </StaggeredItem>
                      ))}
                    </StaggeredGrid>
                  </div>
                </AnimatedSection>
              </div>
            </Container>
          </Section>

          {/* Section 02: Our Promise — centered pull quote + icon cards */}
          <Section spacing="lg">
            <Container>
              <div className="flex flex-col gap-14 md:gap-10">
                <AnimatedSection>
                  <div className="flex flex-col gap-4">
                    <SectionLabel number="02" label="Our Promise" />
                    <h2 className="font-semibold tracking-tight">
                      We start with dialogue
                    </h2>
                  </div>
                </AnimatedSection>

                <Separator />

                <AnimatedSection delay={0.1}>
                  <div className="flex flex-col items-center text-center gap-12">
                    <blockquote className="max-w-2xl">
                      <p className="text-2xl sm:text-3xl font-heading font-semibold text-[hsl(var(--color-foreground))] leading-snug tracking-tight">
                        &ldquo;You don&apos;t need a polished brief. Many clients come to us with just an idea.&rdquo;
                      </p>
                      <p className="mt-4 text-lg text-[hsl(var(--color-foreground-muted))]">
                        We help organize your thinking before we start building. Our first conversation is about understanding what matters to you.
                      </p>
                    </blockquote>

                    <StaggeredGrid className="grid grid-cols-1 sm:grid-cols-3 gap-4 w-full max-w-3xl">
                      {clientBrings.map((item) => (
                        <StaggeredItem key={item.text}>
                          <div className="flex flex-col items-center text-center gap-3 rounded-xl border border-[hsl(var(--color-border))] bg-[hsl(var(--color-background-subtle))] p-6">
                            <div className="w-12 h-12 rounded-full bg-[hsl(var(--color-accent))]/10 text-[hsl(var(--color-accent))] flex items-center justify-center">
                              {item.icon}
                            </div>
                            <p className="text-sm font-medium text-[hsl(var(--color-foreground))]">
                              {item.text}
                            </p>
                          </div>
                        </StaggeredItem>
                      ))}
                    </StaggeredGrid>
                  </div>
                </AnimatedSection>
              </div>
            </Container>
          </Section>

          {/* Section 03: What Makes Us Different — comparison cards */}
          <Section spacing="lg">
            <Container>
              <div className="flex flex-col gap-14 md:gap-10">
                <AnimatedSection>
                  <div className="flex flex-col gap-4">
                    <SectionLabel number="03" label="What Makes Us Different" />
                    <h2 className="font-semibold tracking-tight">
                      One team, one conversation, start to finish
                    </h2>
                  </div>
                </AnimatedSection>

                <Separator />

                <StaggeredGrid className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {comparisons.map((comp, i) => (
                    <StaggeredItem key={i}>
                      <div className="rounded-xl border border-[hsl(var(--color-border))] overflow-hidden h-full flex flex-col">
                        {/* Typical */}
                        <div className="p-5 bg-[hsl(var(--color-background-subtle))] flex-1">
                          <p className="text-xs font-medium text-[hsl(var(--color-foreground-subtle))] uppercase font-mono tracking-[0.06em] mb-2">
                            Typical Agency
                          </p>
                          <p className="text-sm text-[hsl(var(--color-foreground-muted))] leading-relaxed">
                            {comp.typical}
                          </p>
                        </div>
                        {/* Craefto */}
                        <div className="p-5 bg-[hsl(var(--color-accent))]/5 border-t border-[hsl(var(--color-accent))]/20 flex-1">
                          <p className="text-xs font-medium text-[hsl(var(--color-accent))] uppercase font-mono tracking-[0.06em] mb-2">
                            Craefto
                          </p>
                          <p className="text-sm text-[hsl(var(--color-foreground))] leading-relaxed font-medium">
                            {comp.craefto}
                          </p>
                        </div>
                      </div>
                    </StaggeredItem>
                  ))}
                </StaggeredGrid>
              </div>
            </Container>
          </Section>

          {/* Section 04: How It Works — link card to /process */}
          <Section spacing="lg">
            <Container>
              <div className="flex flex-col gap-14 md:gap-10">
                <AnimatedSection>
                  <div className="flex flex-col gap-4">
                    <SectionLabel number="04" label="How It Works" />
                  </div>
                </AnimatedSection>

                <AnimatedSection delay={0.1}>
                  <Link
                    href="/process"
                    className="group flex items-center justify-between p-8 sm:p-10 rounded-2xl border border-[hsl(var(--color-border))] bg-[hsl(var(--color-background-subtle))] hover:border-[hsl(var(--color-accent))] transition-all duration-300"
                  >
                    <div>
                      <h3 className="text-xl sm:text-2xl font-semibold tracking-tight text-[hsl(var(--color-foreground))] group-hover:text-[hsl(var(--color-accent))] transition-colors mb-2">
                        Want to know exactly how projects work?
                      </h3>
                      <p className="text-[hsl(var(--color-foreground-muted))]">
                        Four clear phases from discovery to launch. No surprises, no scope creep.
                      </p>
                    </div>
                    <svg className="w-6 h-6 text-[hsl(var(--color-foreground-muted))] group-hover:text-[hsl(var(--color-accent))] group-hover:translate-x-2 transition-all flex-shrink-0 ml-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                    </svg>
                  </Link>
                </AnimatedSection>
              </div>
            </Container>
          </Section>

          {/* Section 05: What We Build */}
          <Section spacing="lg">
            <Container>
              <div className="flex flex-col gap-14 md:gap-10">
                <AnimatedSection>
                  <div className="flex flex-col gap-4">
                    <SectionLabel number="05" label="What We Build" />
                    <h2 className="font-semibold tracking-tight">
                      From brands to platforms
                    </h2>
                  </div>
                </AnimatedSection>

                <Separator />

                <StaggeredGrid className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {serviceLinks.map((service) => (
                    <StaggeredItem key={service.title}>
                      <Link
                        href={service.href}
                        onClick={(e) => handleServiceClick(e, service.href)}
                        className="group flex items-center justify-between p-5 rounded-xl border border-[hsl(var(--color-border))] hover:border-[hsl(var(--color-accent))] transition-all duration-300"
                      >
                        <span className="font-medium text-[hsl(var(--color-foreground))] group-hover:text-[hsl(var(--color-accent))] transition-colors">
                          {service.title}
                        </span>
                        <svg className="w-4 h-4 text-[hsl(var(--color-foreground-muted))] group-hover:text-[hsl(var(--color-accent))] group-hover:translate-x-1 transition-all" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                        </svg>
                      </Link>
                    </StaggeredItem>
                  ))}
                </StaggeredGrid>
              </div>
            </Container>
          </Section>

          {/* Section 06: Start a Conversation CTA */}
          <Section spacing="lg" className="pt-8 md:pt-12">
            <Container>
              <AnimatedSection>
                <div className="flex flex-col gap-4 mb-10">
                  <SectionLabel number="06" label="Start a Conversation" />
                </div>
              </AnimatedSection>
              <AnimatedSection variant="scaleIn">
                <div className="rounded-2xl bg-[hsl(var(--color-accent))] p-10 sm:p-14 md:p-16">
                  <div className="flex flex-col items-center text-center gap-8 max-w-2xl mx-auto">
                    <h2 className="font-semibold tracking-tight !text-white">
                      You don&apos;t need to have everything figured out.
                    </h2>
                    <p className="text-white/80 text-lg leading-relaxed max-w-lg">
                      Just tell us what you are thinking about, and we will take it from there. No pressure, no commitment, just a conversation.
                    </p>
                    <Button size="lg" variant="secondary" className="mt-2 !bg-white !text-[hsl(var(--color-accent))] hover:!bg-[hsl(var(--color-foreground))] hover:!text-white" asChild>
                      <Link href="/contact">
                        <span className="btn-text-wrapper">
                          <span className="btn-text-primary">
                            Get in touch
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                            </svg>
                          </span>
                          <span className="btn-text-secondary" aria-hidden="true">
                            Say hello
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
