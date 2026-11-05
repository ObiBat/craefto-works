import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { ArrowDown, ArrowRight, DownloadSimple, InstagramLogo } from "@phosphor-icons/react/dist/ssr";
import { Header, Footer, Container, Section } from "@/components/layout";
import { HeroText, PageTransition, AnimatedSection } from "@/components/ui";
import { buttonVariants } from "@/components/ui/button";
import { RevealText } from "@/components/editorial/reveal-text";
import { SectionIntro } from "@/components/editorial/section-intro";
import { StudioCta } from "@/components/sections/studio-cta";
import { freePacks, getFreePack } from "@/content/free-packs";
import { pageMetadata } from "@/lib/seo";
import { cn } from "@/lib/utils";
import { DownloadLink } from "../download-link";

// One page per free pack: the whole set up top, then each piece with its own
// downloads, the terms, and the studio behind it. Pack data: content/free-packs.ts.

const muted = "text-[hsl(var(--color-foreground-muted))]";
const subtle = "text-[hsl(var(--color-foreground-subtle))]";

export function generateStaticParams() {
  return freePacks.map((pack) => ({ slug: pack.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const pack = getFreePack(slug);
  if (!pack) return {};
  return pageMetadata({
    title: `${pack.kind}: ${pack.title}`,
    brand: "Craefto Works",
    description: `${pack.issue}. ${pack.lead} Free for personal and client work.`,
    path: `/free/${pack.slug}`,
    image: { url: pack.og.src, width: 1200, height: 630, alt: pack.og.alt },
  });
}

export default async function FreePackPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const pack = getFreePack(slug);
  if (!pack) notFound();
  const base = `/free/${pack.slug}/download`;

  return (
    <>
      <Header />
      <PageTransition>
        <main id="main-content" className="pt-20">
          {/* Hero: what it is, the one button, and the whole set at a glance. */}
          <Section spacing="sm">
            <Container>
              <div className="max-w-4xl">
                <p className={`mb-6 font-mono text-xs font-medium uppercase tracking-[0.06em] ${subtle}`}>
                  <Link href="/free" className="hover:text-[hsl(var(--color-accent))]">Free</Link>
                  <span aria-hidden="true"> / </span>
                  {pack.issue} · {pack.kind}
                </p>
                <h1 className="font-semibold tracking-tight">
                  <RevealText text={pack.title} mode="load" />
                </h1>
                <HeroText delay={0.15}>
                  <p className={`mt-8 max-w-2xl text-xl leading-relaxed ${muted}`}>{pack.lead}</p>
                </HeroText>
                <HeroText delay={0.25}>
                  <div className="mt-10 flex flex-wrap items-center gap-3">
                    <DownloadLink
                      href={pack.zip.href}
                      track={`${base}/all`}
                      className={buttonVariants({ size: "lg" })}
                    >
                      <DownloadSimple size={18} weight="bold" aria-hidden="true" />
                      Download all {pack.items.length}
                      <span className="font-mono text-xs opacity-75">{pack.zip.size}</span>
                    </DownloadLink>
                    <Link href="#pack" className={buttonVariants({ size: "lg", variant: "ghost" })}>
                      See them one by one
                      <ArrowDown size={16} aria-hidden="true" />
                    </Link>
                  </div>
                  <ul className={`mt-8 flex flex-wrap gap-x-6 gap-y-2 font-mono text-xs uppercase tracking-[0.06em] ${subtle}`}>
                    {pack.formats.map((f) => (
                      <li key={f.label}>
                        {f.label} <span className="tabular-nums text-[hsl(var(--color-foreground))]">{f.size}</span>
                      </li>
                    ))}
                    <li>Free for client work</li>
                  </ul>
                </HeroText>
              </div>

              <HeroText delay={0.35}>
                <ul data-no-reveal className="mt-14 grid grid-cols-4 gap-2 sm:gap-3 md:mt-20 md:grid-cols-8" aria-label={`All ${pack.items.length} ${pack.kind.toLowerCase()}`}>
                  {pack.items.map((item, index) => (
                    <li key={item.number} className={cn("group relative", index % 2 === 1 && "md:translate-y-8")}>
                      <a href={`#bg-${item.number}`} className="block overflow-hidden rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[hsl(var(--color-accent))] sm:rounded-2xl">
                        <span className="relative block aspect-[1290/2796]">
                          <Image
                            src={item.phone}
                            alt={`${item.number} ${item.name}`}
                            fill
                            sizes="(min-width: 768px) 12vw, 24vw"
                            className="object-cover transition-transform duration-700 ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:scale-[1.04]"
                            priority={index < 4}
                          />
                        </span>
                      </a>
                      <span className={`mt-2 block font-mono text-[10px] uppercase tracking-[0.06em] sm:text-xs ${subtle}`}>
                        {item.number} {item.name}
                      </span>
                    </li>
                  ))}
                </ul>
              </HeroText>
            </Container>
          </Section>

          {/* 01: each piece, with its own two downloads. */}
          <Section spacing="lg" id="pack" className="scroll-mt-24">
            <Container>
              <SectionIntro number="01" label="The pack" title={`${pack.items.length} ${pack.kind.toLowerCase()}, two sizes each`}>
                Every one comes as a 4K desktop image and a phone wallpaper. Take only the ones you like.
              </SectionIntro>
              <ul className="mt-12 grid gap-x-6 gap-y-14 md:grid-cols-2">
                {pack.items.map((item) => (
                  <li key={item.number} id={`bg-${item.number}`} className="scroll-mt-28">
                    <AnimatedSection>
                      <div className="relative aspect-[16/9] overflow-hidden rounded-3xl bg-[hsl(var(--color-background-subtle))]">
                        <Image src={item.desktop} alt={`${item.name}, desktop size`} fill sizes="(min-width: 768px) 45vw, 92vw" className="object-cover" />
                      </div>
                      <div className="mt-5 flex flex-wrap items-end justify-between gap-4">
                        <div>
                          <p className="font-mono text-xs tabular-nums text-[hsl(var(--color-accent))]">{item.number}</p>
                          <h3 className="mt-1 font-[family-name:var(--font-heading)] text-2xl font-semibold tracking-tight">{item.name}</h3>
                          <p className={`mt-1 ${muted}`}>{item.note}</p>
                        </div>
                        <div className="flex gap-2">
                          <DownloadLink
                            href={item.desktop}
                            track={`${base}/${item.number}-desktop`}
                            filename={`Craefto ${item.number} ${item.name} 3840x2160.jpg`}
                            className={buttonVariants({ size: "sm", variant: "secondary" })}
                          >
                            <DownloadSimple size={14} weight="bold" aria-hidden="true" />
                            Desktop
                          </DownloadLink>
                          <DownloadLink
                            href={item.phone}
                            track={`${base}/${item.number}-phone`}
                            filename={`Craefto ${item.number} ${item.name} 1290x2796.jpg`}
                            className={buttonVariants({ size: "sm", variant: "secondary" })}
                          >
                            <DownloadSimple size={14} weight="bold" aria-hidden="true" />
                            Phone
                          </DownloadLink>
                        </div>
                      </div>
                    </AnimatedSection>
                  </li>
                ))}
              </ul>
            </Container>
          </Section>

          {/* 02: the terms, in plain words. */}
          <Section spacing="md">
            <Container>
              <SectionIntro number="02" label="Using them" title="Free, with one ask" />
              <ul className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                {pack.terms.map((term, index) => (
                  <li key={term} className="lit-card flex flex-col gap-6 rounded-3xl p-7">
                    <span className="font-mono text-xs tabular-nums text-[hsl(var(--color-accent))]">{String(index + 1).padStart(2, "0")}</span>
                    <span className="lit-card-title text-lg font-medium leading-snug tracking-tight">{term}</span>
                  </li>
                ))}
              </ul>
              <div className="mt-12 flex flex-wrap items-center gap-3">
                <DownloadLink href={pack.zip.href} track={`${base}/all`} className={buttonVariants({ size: "lg" })}>
                  <DownloadSimple size={18} weight="bold" aria-hidden="true" />
                  Download all {pack.items.length}
                  <span className="font-mono text-xs opacity-75">{pack.zip.size}</span>
                </DownloadLink>
                <a
                  href="https://www.instagram.com/craefto/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className={buttonVariants({ size: "lg", variant: "ghost" })}
                >
                  <InstagramLogo size={18} aria-hidden="true" />
                  New packs drop on Instagram first
                  <ArrowRight size={16} aria-hidden="true" />
                </a>
              </div>
            </Container>
          </Section>

          <StudioCta
            eyebrow="Made by Craefto"
            title="Your brand deserves visuals nobody else has."
            text="We're a design and technology studio in Sydney. We make brand identities, websites and the systems behind them. If this pack is your taste, you'll like the rest of our work."
            secondary={{ href: "/work", label: "See our work" }}
          />
        </main>
      </PageTransition>
      <Footer />
    </>
  );
}
