import Image from "next/image";
import Link from "next/link";
import { ArrowRight, InstagramLogo } from "@phosphor-icons/react/dist/ssr";
import { Header, Footer, Container, Section } from "@/components/layout";
import { HeroText, PageTransition } from "@/components/ui";
import { buttonVariants } from "@/components/ui/button";
import { RevealText } from "@/components/editorial/reveal-text";
import { StudioCta } from "@/components/sections/studio-cta";
import { freeResources } from "@/content/free-packs";

// Everything we give away, newest first. Each one has its own page.

const muted = "text-[hsl(var(--color-foreground-muted))]";
const subtle = "text-[hsl(var(--color-foreground-subtle))]";

export default function FreePage() {
  const resources = [...freeResources].sort((a, b) => b.released.localeCompare(a.released));
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
                    Backgrounds, tool lists and type picks from the studio, free for personal and client work. New ones drop on Instagram first.
                  </p>
                  <a
                    href="https://www.instagram.com/craefto/"
                    target="_blank"
                    rel="noopener noreferrer"
                    className={`mt-8 -ml-6 ${buttonVariants({ variant: "ghost" })}`}
                  >
                    <InstagramLogo size={18} aria-hidden="true" />
                    Follow @craefto
                    <ArrowRight size={16} aria-hidden="true" />
                  </a>
                </HeroText>
              </div>

              <ul data-no-reveal className="mt-14 grid gap-x-6 gap-y-12 sm:grid-cols-2 md:mt-20 lg:grid-cols-3">
                {resources.map((resource, index) => (
                  <li key={resource.slug}>
                    <Link
                      href={`/free/${resource.slug}`}
                      className="group block rounded-3xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[hsl(var(--color-accent))]"
                    >
                      <span className="relative block aspect-[4/5] overflow-hidden rounded-3xl bg-[hsl(var(--color-background-subtle))]">
                        <Image
                          src={resource.cover.src}
                          alt={resource.cover.alt}
                          fill
                          sizes="(min-width: 1024px) 30vw, (min-width: 640px) 46vw, 92vw"
                          className="object-cover transition-transform duration-700 ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:scale-[1.03]"
                          priority={index < 3}
                        />
                      </span>
                      <span className="mt-5 flex items-end justify-between gap-4">
                        <span>
                          <span className="block font-mono text-xs uppercase tracking-[0.06em] text-[hsl(var(--color-accent))]">{resource.issue}</span>
                          <span className="mt-1 block font-[family-name:var(--font-heading)] text-2xl font-semibold tracking-tight">{resource.kind}</span>
                          <span className={`mt-1 block ${muted}`}>
                            {resource.type === "download" ? `${resource.items.length} pieces to download` : resource.summary[0]}
                          </span>
                        </span>
                        <ArrowRight size={22} aria-hidden="true" className="mb-1 shrink-0 transition-transform duration-300 group-hover:translate-x-1" />
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
