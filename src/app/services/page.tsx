"use client";

import Link from "next/link";
import { useState, useEffect, useCallback } from "react";
import { Header, Footer, Container, Section } from "@/components/layout";
import { Separator, PageTransition, AnimatedSection, HeroText, SectionLabel } from "@/components/ui";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { RevealText } from "@/components/editorial/reveal-text";
import { Glide } from "@/components/editorial/glide";
import { priceRanges, rangeLabel, weeksLabel } from "@/lib/pricing";

const services = [
  {
    id: "web",
    number: "01",
    title: "Web Design & Development",
    tagline: "Design and engineering as one",
    description:
      "Your website doesn\u2019t reflect who you are anymore, or you are launching something new and need it built right the first time. We design and build marketing sites, SaaS platforms, and dashboards end to end.",
    includes: [
      "Information architecture & UX",
      "Visual design & prototyping",
      "Frontend development (React, Next.js)",
      "Backend & API development",
      "Payment integration (Stripe)",
      "Real time dashboards & portals",
      "Performance optimization",
    ],
    scenarios: [
      "Our site looks dated and we are losing credibility",
      "We need a web app but don\u2019t know where to start",
      "We have a design but need someone to build it properly",
    ],
  },
  {
    id: "brand",
    number: "02",
    title: "Brand Identity",
    tagline: "Strategic foundations",
    description:
      "Your brand feels inconsistent across touchpoints. Your website says one thing, your pitch deck says another. We align everything into a cohesive identity that communicates clearly.",
    includes: [
      "Brand strategy & positioning",
      "Logo & visual identity",
      "Design system & components",
      "Brand guidelines",
    ],
    scenarios: [
      "We don\u2019t have a real brand, just a logo",
      "Our visual identity is all over the place",
      "We are rebranding and need it done professionally",
    ],
  },
  {
    id: "products",
    number: "03",
    title: "Digital Products",
    tagline: "From concept to launch",
    description:
      "You have a product idea but no technical team to build it. Or an existing product that needs a serious upgrade. We handle full stack product development from scoping to deployment.",
    includes: [
      "Product strategy & scoping",
      "Full stack development",
      "Interactive experiences & WebGL",
      "API integrations",
      "Workflow automation",
      "Stakeholder portals & client dashboards",
    ],
    scenarios: [
      "We have an idea but no technical co founder",
      "Our current product is held together with duct tape",
      "We need an MVP to validate our concept before raising",
    ],
  },
  {
    id: "ai",
    number: "04",
    title: "AI & Automation",
    tagline: "Intelligent systems",
    description:
      "You keep hearing about AI but don\u2019t know what is actually useful for your business. We cut through the hype and build agents and automations that save real time.",
    includes: [
      "AI strategy & discovery",
      "Custom agent development",
      "LLM integrations",
      "Process automation",
    ],
    scenarios: [
      "We want to use AI but don\u2019t know how",
      "We are doing manual work that could be automated",
      "We need a custom AI tool for our team",
    ],
  },
  {
    id: "security",
    number: "05",
    title: "Security & Pen Testing",
    tagline: "We don\u2019t just build it, we secure it",
    description:
      "You know security matters but aren\u2019t sure where the vulnerabilities are. Or you need compliance for enterprise clients. We make enterprise grade security accessible.",
    includes: [
      "Web application security assessment",
      "Vulnerability report & remediation guide",
      "Executive summary (investor/board ready)",
      "30 day re test after fixes",
      "ISO 27001 & SOC 2 readiness",
      "Essential Eight compliance",
      "PCI DSS assessment",
      "OSCP/CREST certified testers",
    ],
    scenarios: [
      "We need a security audit before onboarding enterprise clients",
      "We have never tested our application for vulnerabilities",
      "We need compliance documentation for investors or partners",
    ],
  },
];

const workProcess = [
  { number: "01", title: "Discovery", description: "Understand goals and constraints" },
  { number: "02", title: "Proposal", description: "Clear scope and investment" },
  { number: "03", title: "Execution", description: "Build in focused sprints" },
  { number: "04", title: "Launch", description: "Deploy and support" },
];

const pricingData = priceRanges.map((range) => ({
  type: range.label,
  range: rangeLabel(range),
  min: range.min,
  max: range.max,
  timeline: weeksLabel(range),
}));

// Every range bar shares one scale, so the rows compare at a glance.
const PRICE_SCALE = Math.max(...pricingData.map((row) => row.max));

const faqs = [
  {
    question: "Do I need to have a clear brief before reaching out?",
    answer: "No. Many clients start with just an idea or a frustration. We help shape the direction during our initial conversation, so you don\u2019t need anything polished before getting in touch.",
  },
  {
    question: "How much does a typical project cost?",
    answer: "It depends on scope, but we are transparent about pricing from the first conversation. See our pricing ranges above for starting points. We will give you a clear, fixed price proposal before any work begins.",
  },
  {
    question: "Can you handle just design, or just development?",
    answer: "Yes, but we work best when we can do both. Fewer handoffs means better results, faster delivery, and less risk of things getting lost in translation between teams.",
  },
  {
    question: "What is your typical timeline?",
    answer: "4 to 12 weeks depending on complexity. We set realistic expectations upfront and keep you informed throughout. You will never be left wondering what is happening with your project.",
  },
  {
    question: "Do you support the project after launch?",
    answer: "Yes. Every project includes 30 days of post launch support. After that, we offer ongoing retainers for maintenance, optimization, and continued development.",
  },
  {
    question: "What technologies do you use?",
    answer: "We primarily work with React, Next.js, TypeScript, and Tailwind on the frontend, with Node.js, Supabase, and various APIs on the backend. We choose the best tools for each project rather than forcing a one size fits all stack.",
  },
  {
    question: "How does payment work?",
    answer: "We split projects into milestones so you are never paying for work that has not been delivered. A typical schedule: 30% upfront to begin, 40% at design approval, and 30% on launch. For larger projects, we can break it into more milestones. Retainers are billed monthly in advance. We accept bank transfer and can provide invoices with flexible terms for enterprise clients.",
  },
];

// Service Card Component
function ServiceCard({
  service,
  className,
}: {
  service: typeof services[0];
  className?: string;
}) {
  return (
    <div
      id={service.id}
      className={cn(
        "group relative rounded-2xl border border-[hsl(var(--color-border))] bg-[hsl(var(--color-background))] transition-colors duration-300",
        "hover:border-[hsl(var(--color-accent))]",
        className
      )}
    >
      <div className="h-full flex flex-col p-6 lg:p-8">
        {/* Header */}
        <div className="flex items-start justify-between mb-4">
          <span className="font-mono font-medium text-[hsl(var(--color-accent))] text-xs">
            {service.number}
          </span>
          <div className="w-2 h-2 rounded-full bg-[hsl(var(--color-accent))] transition-transform duration-300 group-hover:scale-150" />
        </div>

        {/* Title */}
        <h3 className="font-heading font-semibold tracking-tight text-[hsl(var(--color-foreground))] text-lg lg:text-xl mb-2">
          {service.title}
        </h3>

        {/* Tagline */}
        <p className="text-[hsl(var(--color-accent))] font-medium uppercase font-mono tracking-[0.06em] text-xs mb-4">
          {service.tagline}
        </p>

        {/* Description */}
        <p className="text-sm text-[hsl(var(--color-foreground-muted))] leading-relaxed mb-6">
          {service.description}
        </p>

        {/* Scenarios */}
        <div className="pt-4 border-t border-[hsl(var(--color-border))]">
          <p className="text-xs font-medium text-[hsl(var(--color-foreground-subtle))] uppercase font-mono tracking-[0.06em] mb-3">
            Common scenarios
          </p>
          <div className="space-y-2">
            {service.scenarios.map((scenario) => (
              <p
                key={scenario}
                className="text-sm text-[hsl(var(--color-foreground-muted))] leading-relaxed flex items-start gap-2"
              >
                <span className="w-1 h-1 rounded-full bg-[hsl(var(--color-accent))] mt-2 flex-shrink-0" />
                &ldquo;{scenario}&rdquo;
              </p>
            ))}
          </div>
        </div>

        {/* Includes */}
        <div className="pt-4 border-t border-[hsl(var(--color-border))] mt-4">
          <p className="text-xs font-medium text-[hsl(var(--color-foreground-subtle))] uppercase font-mono tracking-[0.06em] mb-3">
            Includes
          </p>
          <div className="flex flex-wrap gap-2">
            {service.includes.map((item) => (
              <span
                key={item}
                className="px-3 py-1.5 text-xs rounded-full bg-[hsl(var(--color-background-muted))] text-[hsl(var(--color-foreground-muted))] border border-[hsl(var(--color-border-subtle))]"
              >
                {item}
              </span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// FAQ Item Component
function FAQItem({ faq, index }: { faq: typeof faqs[0]; index: number }) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div
      data-glide-item
      className={cn(
        "-mx-2.5 sm:-mx-5 px-2.5 sm:px-5 rounded-2xl transition-colors duration-500",
        isOpen && "bg-[hsl(var(--color-accent-subtle))]"
      )}
    >
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center gap-5 py-5 text-left group"
        aria-expanded={isOpen}
      >
        <span
          className={cn(
            "w-5 font-mono text-xs tabular-nums shrink-0 transition-colors duration-300 group-hover:text-[hsl(var(--color-accent))]",
            isOpen ? "text-[hsl(var(--color-accent))]" : "text-[hsl(var(--color-foreground-subtle))]"
          )}
        >
          {String(index + 1).padStart(2, "0")}
        </span>
        <span className="flex-1 font-medium text-[hsl(var(--color-foreground))] group-hover:text-[hsl(var(--color-accent))] transition-colors pr-4">
          {faq.question}
        </span>
        <span
          className={cn(
            "w-8 h-8 rounded-full flex items-center justify-center shrink-0 transition-colors duration-300 group-hover:bg-[hsl(var(--color-accent))] group-hover:text-white",
            isOpen
              ? "bg-[hsl(var(--color-accent))] text-white"
              : "bg-[hsl(var(--color-background-muted))] text-[hsl(var(--color-foreground))]"
          )}
        >
          <svg
            className={cn("w-4 h-4 transition-transform duration-300", isOpen && "rotate-45")}
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            aria-hidden="true"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
        </span>
      </button>
      <div data-no-reveal className={cn(
        "overflow-hidden transition-all duration-300",
        isOpen ? "max-h-[300px] opacity-100 pb-6" : "max-h-0 opacity-0"
      )}>
        <p className="pl-10 text-[hsl(var(--color-foreground-muted))] leading-relaxed">
          {faq.answer}
        </p>
      </div>
    </div>
  );
}

export default function ServicesPage() {
  const scrollToSection = useCallback((targetId: string, onScrolled?: () => void) => {
    // Wait for page transition animation (300ms) + layout to settle
    const timer = setTimeout(() => {
      onScrolled?.();
      const element = document.getElementById(targetId);
      if (element) {
        const headerOffset = 100;
        const elementPosition = element.getBoundingClientRect().top + window.scrollY;
        window.scrollTo({
          top: elementPosition - headerOffset,
          behavior: "smooth",
        });
      }
    }, 450);
    return timer;
  }, []);

  // Handle scroll from /start page via sessionStorage (no hash in URL)
  useEffect(() => {
    const target = sessionStorage.getItem("scrollToService");
    if (target) {
      // Cleared only once the scroll runs, so a re-run effect (Strict Mode,
      // fast refresh) still finds it.
      const timer = scrollToSection(target, () => sessionStorage.removeItem("scrollToService"));
      return () => clearTimeout(timer);
    }

    // Also handle direct URL hash (e.g. shared link /services#web)
    const hash = window.location.hash?.replace("#", "");
    if (hash) {
      // Reset scroll position immediately to prevent native hash jump
      window.scrollTo(0, 0);
      const timer = scrollToSection(hash);
      return () => clearTimeout(timer);
    }
  }, [scrollToSection]);

  return (
    <>
      <Header />
      <PageTransition>
        <main id="main-content" className="pt-20">
          {/* Hero - Compact */}
          <Section spacing="sm" className="pb-12 md:pb-20">
            <Container>
              <div className="max-w-3xl">
                <nav className="mb-6" aria-label="Breadcrumb">
                  <ol className="flex items-center gap-2 text-sm text-[hsl(var(--color-foreground-muted))]">
                    <li>
                      <Link href="/" className="hover:text-[hsl(var(--color-foreground))] transition-colors">
                        Home
                      </Link>
                    </li>
                    <li><span className="mx-2">/</span></li>
                    <li className="text-[hsl(var(--color-foreground))] font-medium">Services</li>
                  </ol>
                </nav>

                <h1 className="font-semibold tracking-tight mb-4"><RevealText text={"Services"} mode="load" /></h1>
                <HeroText delay={0.1}>
                  <p className="text-lg text-[hsl(var(--color-foreground-muted))] leading-relaxed max-w-xl">
                    Tailored systems, not templates. Each project approached from first principles.
                  </p>
                </HeroText>
              </div>
            </Container>
          </Section>

          {/* Bento Grid */}
          <Section spacing="lg" className="pt-0 md:pt-0">
            <Container>
              {/* Desktop Grid - Row 1 */}
              <AnimatedSection>
                <div className="hidden lg:grid lg:grid-cols-12 gap-4 lg:gap-5">
                  <ServiceCard
                    service={services[0]}
                    className="lg:col-span-4"
                  />
                  <ServiceCard
                    service={services[1]}
                    className="lg:col-span-4"
                  />
                  <ServiceCard
                    service={services[2]}
                    className="lg:col-span-4"
                  />
                </div>
              </AnimatedSection>

              {/* Desktop Grid - Row 2 */}
              <AnimatedSection>
                <div className="hidden lg:grid lg:grid-cols-12 gap-4 lg:gap-5 mt-4 lg:mt-5">
                  <ServiceCard
                    service={services[3]}
                    className="lg:col-span-4"
                  />
                  <ServiceCard
                    service={services[4]}
                    className="lg:col-span-4"
                  />

                  {/* Process Card */}
                  <div className="lg:col-span-4 rounded-2xl border border-[hsl(var(--color-border))] bg-[hsl(var(--color-background-subtle))] p-6 lg:p-8">
                    <p className="text-xs font-medium text-[hsl(var(--color-accent))] uppercase font-mono tracking-[0.06em] mb-5">
                      How we work
                    </p>
                    <div className="space-y-4">
                      {workProcess.map((step) => (
                        <div key={step.title} className="flex items-center gap-3">
                          <span className="flex-shrink-0 w-6 h-6 rounded-full bg-[hsl(var(--color-accent))] flex items-center justify-center text-[10px] font-semibold text-white">
                            {step.number}
                          </span>
                          <div className="flex-1 min-w-0">
                            <span className="font-medium text-sm text-[hsl(var(--color-foreground))]">{step.title}</span>
                            <span className="text-[hsl(var(--color-foreground-muted))] text-sm"> · {step.description}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                    <div className="mt-5">
                      <Link
                        href="/process"
                        className="text-sm font-medium text-[hsl(var(--color-accent))] hover:underline inline-flex items-center gap-1"
                      >
                        See full process
                        <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                        </svg>
                      </Link>
                    </div>
                  </div>
                </div>
              </AnimatedSection>

              {/* Mobile Layout - Each card animates individually */}
              <div className="lg:hidden space-y-4">
                {services.map((service) => (
                  <AnimatedSection key={service.id}>
                    <ServiceCard service={service} />
                  </AnimatedSection>
                ))}

                {/* Mobile Process */}
                <AnimatedSection>
                  <div className="rounded-2xl border border-[hsl(var(--color-border))] bg-[hsl(var(--color-background-subtle))] p-6">
                    <p className="text-xs font-medium text-[hsl(var(--color-accent))] uppercase font-mono tracking-[0.06em] mb-5">
                      How we work
                    </p>
                    <div className="grid grid-cols-2 gap-4">
                      {workProcess.map((step) => (
                        <div key={step.title} className="flex items-start gap-3">
                          <span className="flex-shrink-0 w-6 h-6 rounded-full bg-[hsl(var(--color-accent))] flex items-center justify-center text-[10px] font-semibold text-white">
                            {step.number}
                          </span>
                          <div>
                            <p className="font-medium text-sm text-[hsl(var(--color-foreground))]">{step.title}</p>
                            <p className="text-xs text-[hsl(var(--color-foreground-muted))]">{step.description}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                    <div className="mt-5">
                      <Link
                        href="/process"
                        className="text-sm font-medium text-[hsl(var(--color-accent))] hover:underline inline-flex items-center gap-1"
                      >
                        See full process
                        <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                        </svg>
                      </Link>
                    </div>
                  </div>
                </AnimatedSection>
              </div>
            </Container>
          </Section>

          {/* Pricing Section */}
          <Section spacing="lg">
            <Container>
              <div className="flex flex-col gap-14 md:gap-10">
                <AnimatedSection>
                  <div className="flex flex-col gap-4">
                    <SectionLabel number="06" label="Investment" />
                    <h2 className="font-semibold tracking-tight"><RevealText text={"Transparent pricing"} /></h2>
                    <p data-ink className="text-lg text-[hsl(var(--color-foreground-muted))] leading-relaxed max-w-xl">
                      Every project is different, but here is what to expect. We will give you a precise quote after our discovery call.
                    </p>
                  </div>
                </AnimatedSection>

                <Separator />

                <AnimatedSection delay={0.1}>
                  <Glide bleed={16} className="pricing-rows">
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b border-[hsl(var(--color-border))]">
                          <th className="text-left py-4 pr-6 text-xs font-medium uppercase font-mono tracking-[0.06em] text-[hsl(var(--color-foreground-subtle))]">
                            Project Type
                          </th>
                          <th className="text-left py-4 pr-6 text-xs font-medium uppercase font-mono tracking-[0.06em] text-[hsl(var(--color-foreground-subtle))]">
                            Typical Range
                          </th>
                          <th className="text-left py-4 text-xs font-medium uppercase font-mono tracking-[0.06em] text-[hsl(var(--color-foreground-subtle))]">
                            Timeline
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {pricingData.map((row) => (
                          <tr key={row.type} data-glide-item>
                            <td className="py-5 pr-6 font-medium text-[hsl(var(--color-foreground))]">
                              {row.type}
                            </td>
                            <td className="py-5 pr-6">
                              <span className="block text-[hsl(var(--color-accent))] font-medium tabular-nums">{row.range}</span>
                              <span className="relative mt-2.5 block h-2 w-full max-w-[240px]" aria-hidden="true">
                                <span
                                  className="range-bar absolute inset-y-0 rounded-full bg-[hsl(var(--color-accent))]/35"
                                  style={{
                                    left: `${(row.min / PRICE_SCALE) * 100}%`,
                                    width: `${((row.max - row.min) / PRICE_SCALE) * 100}%`,
                                  }}
                                />
                              </span>
                            </td>
                            <td className="py-5 text-[hsl(var(--color-foreground-muted))]">
                              {row.timeline}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  </Glide>
                  <p className="mt-6 text-sm text-[hsl(var(--color-foreground-muted))]">
                    These are starting points. Pricing is always fixed and agreed upon before work begins.
                  </p>
                </AnimatedSection>
              </div>
            </Container>
          </Section>

          {/* FAQ Section */}
          <Section spacing="lg">
            <Container>
              <div className="flex flex-col gap-14 md:gap-10">
                <AnimatedSection>
                  <div className="flex flex-col gap-4">
                    <SectionLabel number="07" label="FAQ" />
                    <h2 className="font-semibold tracking-tight"><RevealText text={"Common questions"} /></h2>
                  </div>
                </AnimatedSection>

                <Separator />

                <AnimatedSection delay={0.1}>
                  <Glide bleed={0} className="max-w-2xl">
                    {faqs.map((faq, index) => (
                      <FAQItem key={faq.question} faq={faq} index={index} />
                    ))}
                  </Glide>
                </AnimatedSection>
              </div>
            </Container>
          </Section>

          {/* CTA */}
          <Section spacing="lg" className="pt-8 md:pt-12">
            <Container>
              <AnimatedSection variant="scaleIn">
                <div className="rounded-2xl bg-[hsl(var(--color-accent))] p-8 sm:p-10 lg:p-12">
                  <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
                    <div className="max-w-xl">
                      <h2 className="text-2xl sm:text-3xl font-semibold tracking-tight !text-white mb-2"><RevealText text={"Ready to start?"} /></h2>
                      <p data-ink className="text-white/80 text-base lg:text-lg leading-relaxed">
                        You don&apos;t need a finished brief. Start with what you are thinking about, and we will shape it together.
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
                            Get in touch
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                            </svg>
                          </span>
                          <span className="btn-text-secondary" aria-hidden="true">
                            Let&apos;s connect
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
