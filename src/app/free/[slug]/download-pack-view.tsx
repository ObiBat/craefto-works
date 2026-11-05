import Image from "next/image";
import Link from "next/link";
import { ArrowDown, ArrowRight, DownloadSimple, InstagramLogo } from "@phosphor-icons/react/dist/ssr";
import { Container, Section } from "@/components/layout";
import { HeroText, AnimatedSection } from "@/components/ui";
import { buttonVariants } from "@/components/ui/button";
import { RevealText } from "@/components/editorial/reveal-text";
import { SectionIntro } from "@/components/editorial/section-intro";
import type { DownloadPack } from "@/content/free-packs";
import { cn } from "@/lib/utils";
import { TrackedLink } from "../tracked-link";

// A pack of our own files: the whole set up top, then each piece with its own
// downloads, then the terms.

const muted = "text-[hsl(var(--color-foreground-muted))]";
const subtle = "text-[hsl(var(--color-foreground-subtle))]";

export function DownloadPackView({ pack }: { pack: DownloadPack }) {
  const base = `/free/${pack.slug}/download`;
  const downloadAll = (
    <TrackedLink href={pack.zip.href} track={`${base}/all`} download className={buttonVariants({ size: "lg" })}>
      <DownloadSimple size={18} weight="bold" aria-hidden="true" />
      Download all {pack.items.length}
      <span className="font-mono text-xs opacity-75">{pack.zip.size}</span>
    </TrackedLink>
  );

  return (
    <>
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
                {downloadAll}
                <Link href="#pack" className={buttonVariants({ size: "lg", variant: "ghost" })}>
                  See them one by one
                  <ArrowDown size={16} aria-hidden="true" />
                </Link>
              </div>
              <ul data-no-reveal className={`mt-8 flex flex-wrap gap-x-6 gap-y-2 font-mono text-xs uppercase tracking-[0.06em] ${subtle}`}>
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
                  <a href={`#item-${item.number}`} className="block overflow-hidden rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[hsl(var(--color-accent))] sm:rounded-2xl">
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

      <Section spacing="lg" id="pack" className="scroll-mt-24">
        <Container>
          <SectionIntro number="01" label="The pack" title={`${pack.items.length} ${pack.kind.toLowerCase()}, two sizes each`}>
            Every one comes as a 4K desktop image and a phone wallpaper. Take only the ones you like.
          </SectionIntro>
          <ul className="mt-12 grid gap-x-6 gap-y-14 md:grid-cols-2">
            {pack.items.map((item) => (
              <li key={item.number} id={`item-${item.number}`} className="scroll-mt-28">
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
                      <TrackedLink
                        href={item.desktop}
                        track={`${base}/${item.number}-desktop`}
                        download={`Craefto ${item.number} ${item.name} 3840x2160.jpg`}
                        className={buttonVariants({ size: "sm", variant: "secondary" })}
                      >
                        <DownloadSimple size={14} weight="bold" aria-hidden="true" />
                        Desktop
                      </TrackedLink>
                      <TrackedLink
                        href={item.phone}
                        track={`${base}/${item.number}-phone`}
                        download={`Craefto ${item.number} ${item.name} 1290x2796.jpg`}
                        className={buttonVariants({ size: "sm", variant: "secondary" })}
                      >
                        <DownloadSimple size={14} weight="bold" aria-hidden="true" />
                        Phone
                      </TrackedLink>
                    </div>
                  </div>
                </AnimatedSection>
              </li>
            ))}
          </ul>
        </Container>
      </Section>

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
            {downloadAll}
            <a href="https://www.instagram.com/craefto/" target="_blank" rel="noopener noreferrer" className={buttonVariants({ size: "lg", variant: "ghost" })}>
              <InstagramLogo size={18} aria-hidden="true" />
              New packs drop on Instagram first
              <ArrowRight size={16} aria-hidden="true" />
            </a>
          </div>
        </Container>
      </Section>
    </>
  );
}
