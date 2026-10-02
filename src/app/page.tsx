import type { Metadata } from "next";
import { Header, Footer, Container } from "@/components/layout";
import { BrandIntro } from "@/components/editorial/brand-intro";
import { Hero } from "@/components/sections/hero";
import { caseStudies } from "@/content/case-studies";
import { ServicesOverview } from "@/components/sections/services-overview";
import { SelectedWork } from "@/components/sections/selected-work";
import { StackMarquee } from "@/components/sections/team";
import { CTABlock } from "@/components/sections/cta-block";
import { JournalStrip } from "@/components/sections/journal-strip";

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
    siteName: "Craefto",
    title: "Craefto | Creative Tech Studio",
    description: "We design and build brands, products, and tools for founders and teams who value craft.",
  },
};

export default function Home() {
  return (
    <>
      <BrandIntro />
      <Header />
      <main id="main-content">
        <Hero projectCount={caseStudies.length} />
        <ServicesOverview />
        <SelectedWork />
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
