import { Metadata } from "next";
import { pageMetadata } from "@/lib/seo";
import Link from "next/link";
import { Header, Footer, Container, Section } from "@/components/layout";
import { PageTransition, AnimatedSection, HeroText } from "@/components/ui";
import { Separator } from "@/components/ui/separator";
import { RevealText } from "@/components/editorial/reveal-text";

export const metadata: Metadata = pageMetadata({
  title: "Privacy Policy",
  description:
    "How Craefto collects, uses and protects your personal information.",
  path: "/privacy",
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
    id: "information-we-collect",
    title: "Information We Collect",
    content: [
      {
        subtitle: "Information You Provide",
        text: "When you contact us, request a quote, or engage our services, we may collect your name, email address, phone number, company name, and project details. This information is provided voluntarily when you fill out contact forms or communicate with us directly.",
      },
      {
        subtitle: "Automatically Collected Information",
        text: "When you visit our website, we may automatically collect certain information including your IP address, browser type, device information, pages visited, and time spent on our site. This helps us understand how visitors use our website and improve the user experience.",
      },
    ],
  },
  {
    id: "how-we-use",
    title: "How We Use Your Information",
    content: [
      {
        text: "We use the information we collect to respond to your inquiries and provide requested services, communicate with you about projects and opportunities, improve our website and services, send relevant updates about our work (with your consent), and comply with legal obligations.",
      },
    ],
  },
  {
    id: "cookies",
    title: "Cookies & Tracking",
    content: [
      {
        subtitle: "Essential Cookies",
        text: "These cookies are necessary for the website to function properly. They enable basic features like page navigation and access to secure areas. The website cannot function properly without these cookies.",
      },
      {
        subtitle: "Analytics Cookies",
        text: "With your consent, we use analytics cookies to understand how visitors interact with our website. This information helps us improve our site and services. You can manage your cookie preferences at any time through the Cookie Preferences link in our footer.",
      },
      {
        subtitle: "Your Choices",
        text: "When you first visit our website, you will be presented with a cookie consent banner. You can choose to accept all cookies, reject non-essential cookies, or customize your preferences. You can change your cookie settings at any time.",
      },
    ],
  },
  {
    id: "data-sharing",
    title: "Data Sharing & Third Parties",
    content: [
      {
        text: "We do not sell your personal information. We may share your information with trusted service providers who assist us in operating our website and conducting business, but only to the extent necessary for them to provide their services. These providers are bound by confidentiality agreements.",
      },
    ],
  },
  {
    id: "data-security",
    title: "Data Security",
    content: [
      {
        text: "We implement appropriate technical and organizational measures to protect your personal information against unauthorized access, alteration, disclosure, or destruction. However, no method of transmission over the internet is 100% secure, and we cannot guarantee absolute security.",
      },
    ],
  },
  {
    id: "your-rights",
    title: "Your Rights",
    content: [
      {
        text: "Depending on your location, you may have rights regarding your personal information, including the right to access, correct, or delete your data, the right to object to or restrict processing, the right to data portability, and the right to withdraw consent. To exercise these rights, please contact us using the information below.",
      },
    ],
  },
  {
    id: "retention",
    title: "Data Retention",
    content: [
      {
        text: "We retain your personal information only for as long as necessary to fulfill the purposes outlined in this policy, unless a longer retention period is required by law. Project-related communications may be retained for the duration of our business relationship and a reasonable period thereafter.",
      },
    ],
  },
  {
    id: "changes",
    title: "Changes to This Policy",
    content: [
      {
        text: "We may update this Privacy Policy from time to time to reflect changes in our practices or for legal, operational, or regulatory reasons. We will notify you of any material changes by posting the updated policy on our website with a new effective date.",
      },
    ],
  },
  {
    id: "contact",
    title: "Contact Us",
    content: [
      {
        text: "If you have questions about this Privacy Policy or our data practices, please contact us at hello@craefto.com. We will respond to your inquiry within a reasonable timeframe.",
      },
    ],
  },
];

export default function PrivacyPage() {
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
                <h1 className="text-4xl sm:text-5xl font-semibold tracking-tight mb-6"><RevealText text={"Privacy Policy"} mode="load" /></h1>
                <HeroText delay={0.2}>
                  <p className="text-lg text-[hsl(var(--color-foreground-muted))] leading-relaxed">
                    Your privacy matters to us. This policy explains how we collect, use, and protect your information when you visit our website or engage our services.
                  </p>
                </HeroText>
                <HeroText delay={0.3}>
                  <p className="text-sm text-[hsl(var(--color-foreground-subtle))] mt-6">
                    Last updated: January 2026
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
                    href="/terms"
                    className="text-sm text-[hsl(var(--color-foreground-muted))] hover:text-[hsl(var(--color-foreground))] transition-colors inline-flex items-center gap-2"
                  >
                    Terms of Service
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
