import Image from "next/image";
import Link from "next/link";
import {
  ArrowRight,
  ArrowUpRight,
  ArrowsClockwise,
} from "@phosphor-icons/react/dist/ssr";
import { Header, Footer, Container, Section } from "@/components/layout";
import { AnimatedCounter, AnimatedSection, HeroText, PageTransition, SectionLabel } from "@/components/ui";
import { Button } from "@/components/ui/button";
import { LogoMark } from "@/components/ui/logo-mark";
import { Team } from "@/components/sections/team";
import { Glide } from "@/components/editorial/glide";
import { RevealText } from "@/components/editorial/reveal-text";
import { ScrollSpotlight } from "@/components/editorial/scroll-spotlight";
import { capabilities, capabilityHref } from "@/content/capabilities";
import { caseStudies, type CaseStudy } from "@/content/case-studies";
import { beliefs, capabilityIcons, clientWork, commitments, ownWork, studioFacts, studioStory } from "@/content/studio";
import { formatPrice, plansFrom } from "@/lib/pricing";

// Every claim here is one the site makes elsewhere: the facts, principles
// and commitments live in content/studio.ts, shared with the company profile.


const WORDS = ["no", "one", "two", "three", "four", "five", "six", "seven", "eight", "nine"];
const inWords = (n: number) => WORDS[n] ?? String(n);
const capitalise = (text: string) => text.charAt(0).toUpperCase() + text.slice(1);

// The four fine-art previews from the case studies, as the hero's evidence.
const heroArt = ["fx-foundations", "japanoma", "mng-steel", "tav-partners"]
  .map((slug) => caseStudies.find((study) => study.slug === slug))
  .filter((study): study is CaseStudy => Boolean(study));


const muted = "text-[hsl(var(--color-foreground-muted))]";

function SectionIntro({ number, label, title, children }: { number: string; label: string; title: string; children?: React.ReactNode }) {
  return (
    <AnimatedSection>
      <div className="flex max-w-3xl flex-col gap-4">
        <SectionLabel number={number} label={label} />
        <h2>
          <RevealText text={title} />
        </h2>
        {children && <p className={`text-lg leading-relaxed ${muted}`}>{children}</p>}
      </div>
    </AnimatedSection>
  );
}

function WorkList({ title, items }: { title: string; items: CaseStudy[] }) {
  return (
    <div>
      <h3>
        <span className="block font-mono text-xs font-medium uppercase tracking-[0.06em] text-[hsl(var(--color-foreground-subtle))]">
          {title}
        </span>
      </h3>
      <Glide bleed={16}>
        <ul className="mt-3">
          {items.map((study) => (
            <li key={study.slug} data-glide-item className="rounded-2xl">
              <Link href={`/work/${study.slug}`} className="group flex items-center justify-between gap-6 py-4">
                <span className="flex min-w-0 flex-col gap-0.5 sm:flex-row sm:items-baseline sm:gap-4">
                  <span className="font-[family-name:var(--font-heading)] text-xl font-semibold tracking-tight md:text-2xl">{study.title}</span>
                  <span className={`text-sm ${muted}`}>{study.industry.split(" / ")[0]}</span>
                </span>
                <span className="flex shrink-0 items-center gap-3 text-sm tabular-nums text-[hsl(var(--color-foreground-subtle))]">
                  {study.year}
                  <ArrowUpRight
                    size={18}
                    aria-hidden="true"
                    className="transition-[transform,color] duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-[hsl(var(--color-accent))]"
                  />
                </span>
              </Link>
            </li>
          ))}
        </ul>
      </Glide>
    </div>
  );
}

export default function AboutPage() {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "AboutPage",
    url: "https://www.craefto.com/about",
    name: "About Craefto Works",
    about: { "@id": "https://www.craefto.com/#organization" },
    mainEntity: {
      "@type": "Organization",
      "@id": "https://www.craefto.com/#organization",
      name: "Craefto Works",
      foundingDate: "2025",
      foundingLocation: { "@type": "Place", name: "Sydney, Australia" },
      founder: {
        "@type": "Person",
        name: "Obi Batbileg",
        jobTitle: "Founder & Design Technologist",
        sameAs: ["https://www.linkedin.com/in/obi-batbileg/"],
      },
    },
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <Header />
      <PageTransition>
        <main id="main-content" className="pt-20">
          {/* Hero: what the studio is, then the evidence. */}
          <Section spacing="sm">
            <Container>
              <div className="grid gap-12 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)] lg:items-end lg:gap-16">
                <div>
                  <p className="mb-6 font-mono text-xs font-medium uppercase tracking-[0.06em] text-[hsl(var(--color-foreground-subtle))]">
                    About Craefto Works
                  </p>
                  <h1 className="font-semibold tracking-tight">
                    <RevealText text={"We design it, build it and stay with it."} mode="load" />
                  </h1>
                  <HeroText delay={0.15}>
                    <p className={`mt-8 max-w-2xl text-xl leading-relaxed ${muted}`}>
                      Craefto Works is a Sydney studio for brand, digital products, business systems, media and growth. One team takes
                      your work from the first conversation to launch, and stays with it after.
                    </p>
                  </HeroText>
                </div>
                <HeroText delay={0.3}>
                  <ul className="grid grid-cols-2 gap-3" aria-label="Selected work">
                    {heroArt.map((study, index) => (
                      <li key={study.slug} className={index % 2 === 1 ? "translate-y-6" : undefined}>
                        <Link
                          href={`/work/${study.slug}`}
                          className="group relative block aspect-[4/3] overflow-hidden rounded-2xl bg-[hsl(var(--color-background-muted))]"
                        >
                          <Image
                            src={study.thumbnail}
                            alt={`${study.title} case study`}
                            fill
                            priority={index < 2}
                            sizes="(max-width: 1024px) 50vw, 22vw"
                            className="object-cover transition-transform duration-1000 ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:scale-[1.05]"
                          />
                          <span className="absolute bottom-2.5 left-2.5 rounded-full bg-white/85 px-2.5 py-1 text-xs font-medium text-[hsl(var(--color-foreground))] backdrop-blur-sm transition-[opacity,transform] duration-500 [@media(hover:hover)]:translate-y-1 [@media(hover:hover)]:opacity-0 [@media(hover:hover)]:group-hover:translate-y-0 [@media(hover:hover)]:group-hover:opacity-100">
                            {study.title}
                          </span>
                        </Link>
                      </li>
                    ))}
                  </ul>
                </HeroText>
              </div>

              <dl data-no-reveal className="mt-16 grid grid-cols-2 gap-x-8 gap-y-10 md:mt-24 md:grid-cols-4">
                {studioFacts.map((fact) => (
                  <div key={fact.label} className="flex flex-col-reverse gap-2">
                    <dt className={`text-sm ${muted}`}>{fact.label}</dt>
                    <dd className="font-[family-name:var(--font-heading)] text-5xl font-semibold tracking-tight tabular-nums md:text-6xl">
                      <AnimatedCounter value={fact.value} duration={1.6} />
                    </dd>
                  </div>
                ))}
              </dl>
              <p className="mt-10 font-mono text-xs uppercase tracking-[0.06em] text-[hsl(var(--color-foreground-subtle))]">
                Founded in Sydney · 2025
              </p>
            </Container>
          </Section>

          {/* 01: why the studio exists. */}
          <Section spacing="lg">
            <Container>
              <SectionIntro number="01" label="Our story" title="Why we started" />
              <AnimatedSection delay={0.1}>
                <div className="mt-12 grid gap-8 lg:grid-cols-2 lg:gap-20">
                  <p className={`text-lg leading-relaxed ${muted}`}>
                    <strong className="font-medium text-[hsl(var(--color-foreground))]">{studioStory.founded}</strong>{" "}
                    {studioStory.belief}
                  </p>
                  <p className={`text-lg leading-relaxed ${muted}`}>{studioStory.why}</p>
                </div>
              </AnimatedSection>
              <p
                data-ink
                className="mt-16 max-w-4xl font-[family-name:var(--font-heading)] text-3xl font-semibold leading-tight tracking-tight md:mt-24 md:text-5xl"
              >
                Built to compound: everything we make should keep paying off long after launch.
              </p>
            </Container>
          </Section>

          {/* 02: the five capabilities, and the plans that carry them. */}
          <Section spacing="lg">
            <Container>
              <SectionIntro number="02" label="What we do" title="Five capabilities, one team">
                Start with one and add others as you grow. Because it&apos;s one team, each piece builds on the last.
              </SectionIntro>
              <ul className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {capabilities.map((capability) => {
                  const CapabilityIcon = capabilityIcons[capability.id];
                  return (
                    <li key={capability.id} className="lit-card rounded-3xl">
                      <Link
                        href={capabilityHref(capability.id)}
                        className="flex h-full flex-col gap-10 rounded-3xl p-7 focus-visible:outline-none"
                      >
                        <span className="flex items-start justify-between">
                          <span className="icon-tile">
                            <CapabilityIcon size={30} weight="duotone" aria-hidden="true" />
                          </span>
                          <ArrowUpRight size={20} className="lit-card-arrow" aria-hidden="true" />
                        </span>
                        <span className="flex flex-col gap-2">
                          <span className="font-mono text-xs text-[hsl(var(--color-accent))] tabular-nums">{capability.number}</span>
                          <span className="lit-card-title font-[family-name:var(--font-heading)] text-2xl font-semibold tracking-tight">
                            {capability.name}
                          </span>
                          <span className={`text-sm leading-relaxed ${muted}`}>{capability.summary}</span>
                        </span>
                      </Link>
                    </li>
                  );
                })}
                <li className="lit-card rounded-3xl">
                  <Link href="/services#plans" className="flex h-full flex-col gap-10 rounded-3xl p-7 focus-visible:outline-none">
                    <span className="flex items-start justify-between">
                      <span className="icon-tile">
                        <ArrowsClockwise size={30} weight="duotone" aria-hidden="true" />
                      </span>
                      <ArrowUpRight size={20} className="lit-card-arrow" aria-hidden="true" />
                    </span>
                    <span className="flex flex-col gap-2">
                      <span className="font-mono text-xs text-[hsl(var(--color-accent))]">01&ndash;05</span>
                      <span className="lit-card-title font-[family-name:var(--font-heading)] text-2xl font-semibold tracking-tight">
                        Monthly plans
                      </span>
                      <span className={`text-sm leading-relaxed ${muted}`}>
                        Ongoing work across all five, from {formatPrice(plansFrom)} a month.
                      </span>
                    </span>
                  </Link>
                </li>
              </ul>
            </Container>
          </Section>

          {/* 03: proof, by name. */}
          <Section spacing="lg">
            <Container>
              <SectionIntro number="03" label="Our work" title="Work you can see">
                {capitalise(inWords(clientWork.length))} projects for clients and {inWords(ownWork.length)} products of our own, each
                written up as a case study.
              </SectionIntro>
              <AnimatedSection delay={0.1}>
                <div className="mt-12 grid gap-14 lg:grid-cols-2 lg:gap-20">
                  <WorkList title="For clients" items={clientWork} />
                  <div>
                    <WorkList title="Our own products" items={ownWork} />
                    <p className={`mt-6 max-w-md text-sm leading-relaxed ${muted}`}>
                      We build our own products as well. Living with the same trade-offs we ask clients to make keeps our advice
                      honest.
                    </p>
                  </div>
                </div>
              </AnimatedSection>
              <AnimatedSection delay={0.15}>
                <Link
                  href="/work"
                  className="group mt-12 inline-flex items-center gap-2 text-sm font-medium text-[hsl(var(--color-accent))]"
                >
                  See every case study
                  <ArrowRight size={16} aria-hidden="true" className="transition-transform duration-500 group-hover:translate-x-1" />
                </Link>
              </AnimatedSection>
            </Container>
          </Section>

          {/* 04: values, kept short. */}
          <Section spacing="lg">
            <Container>
              <SectionIntro number="04" label="What we believe" title="Four principles" />
              <Glide bleed={20}>
                <ol className="mt-10">
                  {beliefs.map((belief, index) => (
                    <li
                      key={belief.title}
                      data-glide-item
                      className="grid gap-2 rounded-2xl py-7 md:grid-cols-[4rem_minmax(0,1.15fr)_minmax(0,1fr)] md:items-baseline md:gap-8"
                    >
                      <span className="font-mono text-sm text-[hsl(var(--color-accent))] tabular-nums" aria-hidden="true">
                        {String(index + 1).padStart(2, "0")}
                      </span>
                      <p
                        data-ink
                        className="font-[family-name:var(--font-heading)] text-3xl font-semibold leading-tight tracking-tight md:text-4xl"
                      >
                        {belief.title}
                      </p>
                      <p className={`text-lg leading-relaxed ${muted}`}>{belief.text}</p>
                    </li>
                  ))}
                </ol>
              </Glide>
            </Container>
          </Section>

          {/* 05: the principles as commitments a client can hold us to. */}
          <Section spacing="lg">
            <Container>
              <SectionIntro number="05" label="How we work" title="What you can count on">
                The same commitments on every project, built into how we quote, bill and hand over.
              </SectionIntro>
              <ul className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {commitments.map((commitment) => {
                  const CommitmentIcon = commitment.icon;
                  return (
                    <li key={commitment.title} className="lit-card flex flex-col gap-10 rounded-3xl p-7">
                      <span className="icon-tile">
                        <CommitmentIcon size={30} weight="duotone" aria-hidden="true" />
                      </span>
                      <span className="flex flex-col gap-2">
                        <span className="lit-card-title font-[family-name:var(--font-heading)] text-xl font-semibold tracking-tight">
                          {commitment.title}
                        </span>
                        <span className={`text-sm leading-relaxed ${muted}`}>{commitment.text}</span>
                      </span>
                    </li>
                  );
                })}
              </ul>
            </Container>
          </Section>

          {/* 06: the people. */}
          <Team sectionNumber="06" />

          {/* Next step. */}
          <Section spacing="xl">
            <Container>
              <AnimatedSection variant="scaleIn">
                <div className="group relative overflow-hidden rounded-3xl bg-[hsl(var(--color-accent))] px-8 py-14 sm:px-14 md:px-20 md:py-20">
                  <LogoMark
                    width={420}
                    height={420}
                    className="pointer-events-none absolute -right-20 -bottom-24 hidden text-white/[0.09] transition-transform duration-[1600ms] ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:rotate-[20deg] md:block"
                  />
                  <div className="relative max-w-2xl">
                    <p className="font-mono text-xs font-medium uppercase tracking-[0.06em] text-white/70">Start here</p>
                    <h2 className="mt-5 !text-white">
                      <RevealText text={"Tell us what you're building."} />
                    </h2>
                    <p data-no-reveal className="mt-5 max-w-xl text-lg leading-relaxed text-white/80">
                      Share where you are and what you need. We&apos;ll tell you plainly whether we&apos;re the right fit, and what it
                      would take.
                    </p>
                    <div className="mt-10 flex flex-wrap gap-3">
                      <Button asChild size="lg" variant="secondary" className="!bg-white !text-[hsl(var(--color-accent))]">
                        <Link href="/contact">
                          Start a conversation
                          <ArrowRight size={16} aria-hidden="true" />
                        </Link>
                      </Button>
                      <Button asChild size="lg" variant="ghost" className="!text-white hover:!bg-white/10">
                        <Link href="/services#plans">See plans and pricing</Link>
                      </Button>
                    </div>
                  </div>
                </div>
              </AnimatedSection>
            </Container>
          </Section>
          <ScrollSpotlight selector=".lit-card" media="(hover: none) and (max-width: 767px)" />
        </main>
      </PageTransition>
      <Footer />
    </>
  );
}
