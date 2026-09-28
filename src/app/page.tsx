import { Header, Footer, Container } from "@/components/layout";
import { BrandIntro } from "@/components/editorial/brand-intro";
import {
  Hero,
  ServicesOverview,
  SelectedWork,
  StackMarquee,
  CTABlock,
} from "@/components/sections";

export default function Home() {
  return (
    <>
      <BrandIntro />
      <Header />
      <main id="main-content">
        <Hero />
        <ServicesOverview />
        <SelectedWork />
        <Container>
          <StackMarquee />
        </Container>
        <CTABlock />
      </main>
      <Footer />
    </>
  );
}
