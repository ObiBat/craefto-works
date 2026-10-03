import Link from "next/link";
import { Header, Footer, Container, Section } from "@/components/layout";
import { HeroText, PageTransition } from "@/components/ui";
import { RevealText } from "@/components/editorial/reveal-text";
import { StudioCta } from "@/components/sections/studio-cta";
import { caseStudies } from "@/content/case-studies";
import { WorkGrid, type WorkCard } from "./work-grid";

// Every case study, from content/case-studies.ts (the single source for
// /work/[slug] too), tagged with the capabilities each one shows.

const WORDS = ["no", "one", "two", "three", "four", "five", "six", "seven", "eight", "nine", "ten", "eleven", "twelve"];
const inWords = (n: number) => WORDS[n] ?? String(n);
const ownCount = caseStudies.filter((study) => /^internal/i.test(study.client)).length;
const clientCount = caseStudies.length - ownCount;

const cards: WorkCard[] = caseStudies.map((study) => ({
  slug: study.slug,
  title: study.title,
  description: study.description,
  industry: study.industry,
  year: study.year,
  thumbnail: study.thumbnail,
  accentColor: study.accentColor,
  capabilities: study.capabilities,
  engagement: study.engagement ?? "project",
}));

export default function WorkPage() {
  return (
    <>
      <Header />
      <PageTransition>
        <main id="main-content" className="pt-20">
          <Section spacing="sm">
            <Container>
              <div className="max-w-4xl">
                <p className="mb-6 font-mono text-xs font-medium uppercase tracking-[0.06em] text-[hsl(var(--color-foreground-subtle))]">
                  Case studies
                </p>
                <h1 className="font-semibold tracking-tight">
                  <RevealText text={"Work across brand, product, systems, media and growth."} mode="load" />
                </h1>
                <HeroText delay={0.15}>
                  <p className="mt-8 max-w-2xl text-xl leading-relaxed text-[hsl(var(--color-foreground-muted))]">
                    Identities and websites, apps and the systems behind them, photography and film, and the work that brings people
                    in. {caseStudies.length} projects so far, {inWords(clientCount)} for clients and {inWords(ownCount)} products of our
                    own, each written up as a case study.
                  </p>
                </HeroText>
              </div>
            </Container>
          </Section>

          <Section spacing="md" className="pt-0">
            <Container>
              <WorkGrid studies={cards} />
            </Container>
          </Section>

          <StudioCta
            eyebrow="Start here"
            title="Have something in mind?"
            text="A brand, a product, a system, a shoot or a campaign: tell us where you are and what you need, and we'll tell you plainly what it would take."
            footnote={
              <>
                Want to see how a project runs first?{" "}
                <Link href="/process" className="text-white underline-offset-4 hover:underline">
                  How we work
                </Link>
                .
              </>
            }
          />
        </main>
      </PageTransition>
      <Footer />
    </>
  );
}
