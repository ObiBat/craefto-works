import { Metadata } from "next";
import { pageMetadata } from "@/lib/seo";
import Link from "next/link";
import { Header, Footer, Container, Section } from "@/components/layout";
import { PageTransition, AnimatedSection, HeroText } from "@/components/ui";
import { Separator } from "@/components/ui/separator";
import { RevealText } from "@/components/editorial/reveal-text";
import { planTerms } from "@/content/plan-terms";
import { monthlyPlans } from "@/lib/pricing";
import { chargesGst } from "@/lib/stripe";

export const metadata: Metadata = pageMetadata({
  title: "Terms of Service",
  description:
    "Terms and conditions for using Craefto services and this website.",
  path: "/terms",
});

interface ContentItem {
  subtitle?: string;
  text: string;
}

interface SectionData {
  id: string;
  title: string;
  content: ContentItem[];
}

const sections: SectionData[] = [
  {
    id: "acceptance",
    title: "Acceptance of Terms",
    content: [
      {
        text: "By accessing or using the Craefto website and services, you agree to be bound by these Terms of Service. If you do not agree to these terms, please do not use our website or services. We reserve the right to update these terms at any time, and your continued use constitutes acceptance of any changes.",
      },
    ],
  },
  {
    id: "services",
    title: "Our Services",
    content: [
      {
        text: "Craefto provides creative and technology services across brand (identity, strategy, design systems and creative direction), product (websites, digital products, applications and digital experiences), systems (AI automation, integrations, internal tools and business systems), media (photography, video, motion and creative content) and growth (campaigns, digital growth, optimisation and ongoing creative support), as fixed-price projects or monthly plans. The specific scope, deliverables, timeline, and fees for any project will be outlined in a separate proposal or statement of work agreed upon by both parties.",
      },
    ],
  },
  {
    id: "client-responsibilities",
    title: "Client Responsibilities",
    content: [
      {
        text: "When engaging our services, you agree to provide accurate and complete information necessary for the project, respond to communications and provide feedback within agreed timeframes, ensure you have the rights to any materials you provide to us, make payments according to the agreed schedule, and designate a primary point of contact for the project.",
      },
    ],
  },
  {
    id: "intellectual-property",
    title: "Intellectual Property",
    content: [
      {
        subtitle: "Client Materials",
        text: "You retain ownership of all materials you provide to us, including logos, content, images, and other assets. You grant us a license to use these materials solely for the purpose of completing your project.",
      },
      {
        subtitle: "Deliverables",
        text: "Upon full payment, you will own the final deliverables created specifically for your project. We retain the right to use the work in our portfolio and marketing materials unless otherwise agreed in writing.",
      },
      {
        subtitle: "Pre-existing Materials",
        text: "We retain ownership of any pre-existing materials, tools, code libraries, or frameworks that we incorporate into your project. You are granted a perpetual, non-exclusive license to use these materials as part of your deliverables.",
      },
    ],
  },
  {
    id: "payment",
    title: "Payment Terms",
    content: [
      {
        text: "Payment terms will be specified in your project proposal. Typically, we require a deposit before work begins, with remaining payments due at agreed milestones or upon project completion. Late payments may result in work suspension and may incur additional fees. All fees are non-refundable once work has commenced, except as otherwise specified. Monthly plans are billed monthly in advance, as set out under Monthly Plans.",
      },
    ],
  },
  {
    id: "monthly-plans",
    title: "Monthly Plans",
    content: [
      {
        text: `These terms apply to our monthly plans (${monthlyPlans.map((plan) => plan.name).join(", ").replace(/, ([^,]*)$/, " and $1")}) alongside the rest of these Terms of Service. You agree to them when you start a plan.`,
      },
      ...planTerms(chargesGst()).map(({ title, text }) => ({ subtitle: title, text })),
    ],
  },
  {
    id: "confidentiality",
    title: "Confidentiality",
    content: [
      {
        text: "We treat all client information as confidential and will not disclose it to third parties without your consent, except as required by law or necessary to complete the project. This includes business strategies, proprietary information, and unpublished work. Confidentiality obligations survive the termination of our engagement.",
      },
    ],
  },
  {
    id: "warranties",
    title: "Warranties & Disclaimers",
    content: [
      {
        text: "We warrant that our services will be performed in a professional and workmanlike manner. However, we do not guarantee specific results, search engine rankings, or business outcomes. Our website and services are provided 'as is' without warranties of any kind, either express or implied, to the fullest extent permitted by law.",
      },
    ],
  },
  {
    id: "limitation",
    title: "Limitation of Liability",
    content: [
      {
        text: "To the maximum extent permitted by law, Craefto shall not be liable for any indirect, incidental, special, consequential, or punitive damages arising from your use of our services or website. Our total liability shall not exceed the amount paid by you for the specific services giving rise to the claim.",
      },
    ],
  },
  {
    id: "termination",
    title: "Termination",
    content: [
      {
        text: "Either party may terminate a project with written notice. Upon termination, you are responsible for payment for all work completed up to the termination date. We will provide you with all completed work and work in progress upon receipt of final payment. Provisions regarding intellectual property, confidentiality, and liability survive termination.",
      },
    ],
  },
  {
    id: "website-use",
    title: "Website Use",
    content: [
      {
        text: "You may use our website for lawful purposes only. You agree not to attempt to gain unauthorized access to our systems, interfere with the proper functioning of the website, use automated systems to access the site without permission, or copy, distribute, or modify any content without authorization.",
      },
    ],
  },
  {
    id: "governing-law",
    title: "Governing Law",
    content: [
      {
        text: "These Terms shall be governed by and construed in accordance with applicable laws. Any disputes arising from these terms or our services shall be resolved through good-faith negotiation. If negotiation fails, disputes shall be submitted to binding arbitration or the appropriate courts.",
      },
    ],
  },
  {
    id: "contact",
    title: "Contact",
    content: [
      {
        text: "If you have questions about these Terms of Service, please contact us at hello@craefto.com. We are committed to addressing any concerns promptly and professionally.",
      },
    ],
  },
];

export default function TermsPage() {
  return (
    <>
      <Header />
      <PageTransition>
        <main id="main-content" className="pt-16">
          {/* Hero */}
          <Section spacing="sm">
            <Container size="md">
              <div className="max-w-2xl">
                <HeroText>
                  <p className="text-sm font-medium uppercase font-mono tracking-[0.06em] text-[hsl(var(--color-foreground-muted))] mb-4">
                    Legal
                  </p>
                </HeroText>
                <h1 className="text-4xl sm:text-5xl font-semibold tracking-tight mb-6"><RevealText text={"Terms of Service"} mode="load" /></h1>
                <HeroText delay={0.2}>
                  <p className="text-lg text-[hsl(var(--color-foreground-muted))] leading-relaxed">
                    These terms govern your use of our website and services. Please read them carefully before engaging with Craefto.
                  </p>
                </HeroText>
                <HeroText delay={0.3}>
                  <p className="text-sm text-[hsl(var(--color-foreground-subtle))] mt-6">
                    Last updated: October 2026
                  </p>
                </HeroText>
              </div>
            </Container>
          </Section>

          {/* Table of Contents */}
          <Section spacing="sm">
            <Container size="md">
              <AnimatedSection>
                <Separator className="mb-8" />
                <nav className="mb-8">
                  <p className="text-xs font-medium uppercase font-mono tracking-[0.06em] text-[hsl(var(--color-foreground-subtle))] mb-4">
                    On this page
                  </p>
                  <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {sections.map((section, index) => (
                      <li key={section.id}>
                        <a
                          href={`#${section.id}`}
                          className="text-sm text-[hsl(var(--color-foreground-muted))] hover:text-[hsl(var(--color-foreground))] transition-colors inline-flex items-center gap-2"
                        >
                          <span className="text-[hsl(var(--color-foreground-subtle))]">
                            {String(index + 1).padStart(2, "0")}
                          </span>
                          {section.title}
                        </a>
                      </li>
                    ))}
                  </ul>
                </nav>
                <Separator />
              </AnimatedSection>
            </Container>
          </Section>

          {/* Content */}
          <Section spacing="md">
            <Container size="md">
              <div className="space-y-16">
                {sections.map((section, index) => (
                  <AnimatedSection key={section.id} className="scroll-mt-24" id={section.id}>
                    <div className="flex gap-6">
                      <span className="text-sm font-medium text-[hsl(var(--color-foreground-subtle))] shrink-0 w-8">
                        {String(index + 1).padStart(2, "0")}
                      </span>
                      <div className="flex-1">
                        <h2 className="text-xl font-semibold tracking-tight mb-6">
                          {section.title}
                        </h2>
                        <div className="space-y-6">
                          {section.content.map((item, i) => (
                            <div key={i}>
                              {item.subtitle && (
                                <h3 className="font-medium mb-2">{item.subtitle}</h3>
                              )}
                              <p className="text-[hsl(var(--color-foreground-muted))] leading-relaxed">
                                {item.text}
                              </p>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </AnimatedSection>
                ))}
              </div>
            </Container>
          </Section>

          {/* Back Link */}
          <Section spacing="md">
            <Container size="md">
              <AnimatedSection>
                <Separator className="mb-8" />
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                  <Link
                    href="/"
                    className="text-sm text-[hsl(var(--color-foreground-muted))] hover:text-[hsl(var(--color-foreground))] transition-colors inline-flex items-center gap-2"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                    </svg>
                    Back to home
                  </Link>
                  <Link
                    href="/privacy"
                    className="text-sm text-[hsl(var(--color-foreground-muted))] hover:text-[hsl(var(--color-foreground))] transition-colors inline-flex items-center gap-2"
                  >
                    Privacy Policy
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                    </svg>
                  </Link>
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
