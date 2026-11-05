import Image from "next/image";
import Link from "next/link";
import { ArrowRight, InstagramLogo } from "@phosphor-icons/react/dist/ssr";
import { Header, Footer, Container, Section } from "@/components/layout";
import { HeroText, PageTransition } from "@/components/ui";
import { buttonVariants } from "@/components/ui/button";
import { RevealText } from "@/components/editorial/reveal-text";
import { StudioCta } from "@/components/sections/studio-cta";
import { freePacks } from "@/content/free-packs";

// Everything we give away, newest first. Each pack has its own page.

const muted = "text-[hsl(var(--color-foreground-muted))]";
const subtle = "text-[hsl(var(--color-foreground-subtle))]";

export default function FreePage() {
  const packs = [...freePacks].sort((a, b) => b.released.localeCompare(a.released));
  return (
    <>
      <Header />
      <PageTransition>
        <main id="main-content" className="pt-20">
          <Section spacing="sm">
            <Container>
              <div className="max-w-4xl">
                <p className={`mb-6 font-mono text-xs font-medium uppercase tracking-[0.06em] ${subtle}`}>Free</p>
                <h1 className="font-semibold tracking-tight">
                  <RevealText text={"Things we made, yours to use."} mode="load" />
                </h1>
                <HeroText delay={0.15}>
                  <p className={`mt-8 max-w-2xl text-xl leading-relaxed ${muted}`}>
                    Backgrounds, templates and tools from the studio, free for personal and client work. New packs drop on Instagram first.
                  </p>
                  <a
                    href="https://www.instagram.com/craefto/"
                    target="_blank"
                    rel="noopener noreferrer"
                    className={`mt-8 ${buttonVariants({ variant: "ghost" })} -ml-6`}
                  >
                    <InstagramLogo size={18} aria-hidden="true" />
                    Follow @craefto
                    <ArrowRight size={16} aria-hidden="true" />
                  </a>
                </HeroText>
              </div>

              <ul data-no-reveal className="mt-14 grid gap-6 md:mt-20 md:grid-cols-2">
                {packs.map((pack) => (
                  <li key={pack.slug}>
                    <Link href={`/free/${pack.slug}`} className="group block rounded-3xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[hsl(var(--color-accent))]">
                      <span className="grid grid-cols-4 gap-2 overflow-hidden rounded-3xl">
                        {pack.items.slice(0, 4).map((item) => (
                          <span key={item.number} className="relative block aspect-[1290/2796] overflow-hidden">
                            <Image
                              src={item.phone}
                              alt=""
                              fill
                              sizes="(min-width: 768px) 12vw, 24vw"
                              className="object-cover transition-transform duration-700 ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:scale-[1.04]"
                            />
                          </span>
                        ))}
                      </span>
                      <span className="mt-5 flex items-end justify-between gap-4">
                        <span>
                          <span className="block font-mono text-xs uppercase tracking-[0.06em] text-[hsl(var(--color-accent))]">{pack.issue}</span>
                          <span className="mt-1 block font-[family-name:var(--font-heading)] text-2xl font-semibold tracking-tight">{pack.kind}</span>
                          <span className={`mt-1 block ${muted}`}>{pack.items.length} pieces · desktop and phone</span>
                        </span>
                        <ArrowRight size={22} aria-hidden="true" className="mb-1 transition-transform duration-300 group-hover:translate-x-1" />
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            </Container>
          </Section>

          <StudioCta
            eyebrow="Made by Craefto"
            title="Want work like this for your brand?"
            text="We're a design and technology studio in Sydney. Brand identities, websites and the systems behind them."
            secondary={{ href: "/work", label: "See our work" }}
          />
        </main>
      </PageTransition>
      <Footer />
    </>
  );
}
