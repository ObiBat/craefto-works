import { Header, Footer, Container } from "@/components/layout";
import { BrandIntro } from "@/components/editorial/brand-intro";
import { Hero } from "@/components/sections/hero";
import { ServicesOverview } from "@/components/sections/services-overview";
import { SelectedWork } from "@/components/sections/selected-work";
import { StackMarquee } from "@/components/sections/team";
import { CTABlock } from "@/components/sections/cta-block";
import { JournalStrip } from "@/components/sections/journal-strip";

// The journal strip reads the newest articles: rebuild at most every 5 minutes.
export const revalidate = 300;

export default function Home() {
  return (
    <>
      <BrandIntro />
      <Header />
      <main id="main-content">
        <Hero />
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
