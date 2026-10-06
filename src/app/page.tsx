import type { Metadata } from "next";
import { Header, Footer, Container } from "@/components/layout";
import { BrandIntro } from "@/components/editorial/brand-intro";
import { Hero } from "@/components/sections/hero";
import { caseStudies } from "@/content/case-studies";
import { capabilities } from "@/content/capabilities";
import { ServicesOverview } from "@/components/sections/services-overview";
import { SelectedWork } from "@/components/sections/selected-work";
import { StackMarquee } from "@/components/sections/team";
import { CTABlock } from "@/components/sections/cta-block";
import { JournalStrip } from "@/components/sections/journal-strip";
import { MonthlyPlans } from "@/components/sections/monthly-plans";

// The journal strip reads the newest articles: rebuild at most every 5 minutes.
export const revalidate = 300;

// Stated outright: the layout's relative "./" resolves to "/index" when
// Vercel regenerates this page, which made /index the canonical.
export const metadata: Metadata = {
  alternates: { canonical: "/" },
  openGraph: {
    type: "website",
    locale: "en_AU",
    url: "/",
    siteName: "Craefto Works",
    title: "Craefto Works | Creative & Technology Studio",
    description: "We build how businesses look, communicate and operate: brand, product, systems, media and growth, brought together under one studio.",
  },
};

export default function Home() {
  return (
    <>
      <BrandIntro />
      <Header />
      <main id="main-content">
        <Hero projectCount={caseStudies.length} capabilityNames={capabilities.map((capability) => capability.name)} />
        <ServicesOverview />
        <SelectedWork />
        <MonthlyPlans number="03" />
        <JournalStrip />
        <Container>
          <StackMarquee />
        </Container>
        <CTABlock />
      </main>
      <Footer />
    </>
  );
}
