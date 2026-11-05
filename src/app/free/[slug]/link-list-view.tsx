import Image from "next/image";
import Link from "next/link";
import { ArrowDown, ArrowUpRight, InstagramLogo } from "@phosphor-icons/react/dist/ssr";
import { Container, Section } from "@/components/layout";
import { HeroText, AnimatedSection } from "@/components/ui";
import { buttonVariants } from "@/components/ui/button";
import { RevealText } from "@/components/editorial/reveal-text";
import { SectionIntro } from "@/components/editorial/section-intro";
import type { LinkList } from "@/content/free-packs";
import { cn } from "@/lib/utils";
import { TrackedLink } from "../tracked-link";

// A curated list of other people's tools or typefaces: an index up top, then
// each one with a picture, what it is, our take, and a link out.

const muted = "text-[hsl(var(--color-foreground-muted))]";
const subtle = "text-[hsl(var(--color-foreground-subtle))]";

export function LinkListView({ list }: { list: LinkList }) {
  const base = `/free/${list.slug}/out`;
  return (
    <>
      <Section spacing="sm">
        <Container>
          <div className="max-w-4xl">
            <p className={`mb-6 font-mono text-xs font-medium uppercase tracking-[0.06em] ${subtle}`}>
              <Link href="/free" className="hover:text-[hsl(var(--color-accent))]">Free</Link>
              <span aria-hidden="true"> / </span>
              {list.issue}
            </p>
            <h1 className="font-semibold tracking-tight">
              <RevealText text={list.title} mode="load" />
            </h1>
            <HeroText delay={0.15}>
              <p className={`mt-8 max-w-2xl text-xl leading-relaxed ${muted}`}>{list.lead}</p>
            </HeroText>
            <HeroText delay={0.25}>
              <ul data-no-reveal className={`mt-8 flex flex-wrap gap-x-6 gap-y-2 font-mono text-xs uppercase tracking-[0.06em] ${subtle}`}>
                {list.summary.map((s) => (
                  <li key={s}>{s}</li>
                ))}
              </ul>
            </HeroText>
          </div>

          {/* The index: every item, one tap to its entry. */}
          <HeroText delay={0.35}>
            <ol data-no-reveal className="mt-12 flex flex-wrap gap-2 md:mt-16" aria-label="Jump to">
              {list.items.map((item) => (
                <li key={item.id}>
                  <a
                    href={`#${item.id}`}
                    className="inline-flex items-center gap-2 rounded-full bg-[hsl(var(--color-background-subtle))] px-4 py-2 text-sm font-medium transition-colors duration-300 hover:bg-[hsl(var(--color-accent-subtle))] hover:text-[hsl(var(--color-accent))]"
                  >
                    <span className="font-mono text-xs tabular-nums text-[hsl(var(--color-accent))]">{item.number}</span>
                    {item.name}
                  </a>
                </li>
              ))}
            </ol>
            <a href="#list" className={`mt-8 -ml-6 ${buttonVariants({ variant: "ghost" })}`}>
              See the list
              <ArrowDown size={16} aria-hidden="true" />
            </a>
          </HeroText>
        </Container>
      </Section>

      <Section spacing="md" id="list" className="scroll-mt-24">
        <Container>
          <ol className="flex flex-col gap-20 md:gap-28">
            {list.items.map((item, index) => (
              <li key={item.id} id={item.id} className="scroll-mt-28">
                <AnimatedSection>
                  <article className="grid items-center gap-8 md:grid-cols-12 md:gap-12">
                    <div className={cn("md:col-span-7", index % 2 === 1 && "md:order-2")}>
                      <div
                        className="relative w-full max-w-full overflow-hidden rounded-3xl bg-[hsl(var(--color-background-subtle))] ring-1 ring-[hsl(var(--color-foreground)/0.08)]"
                        style={{ aspectRatio: list.imageRatio }}
                      >
                        <Image src={item.image} alt={item.imageAlt} fill sizes="(min-width: 768px) 55vw, 92vw" className="object-cover object-top" />
                      </div>
                    </div>
                    <div className={cn("flex flex-col gap-5 md:col-span-5", index % 2 === 1 && "md:order-1")}>
                      <p className="font-mono text-xs uppercase tracking-[0.06em]">
                        <span className="tabular-nums text-[hsl(var(--color-accent))]">{item.number}</span>
                        <span className={subtle}> · {item.category}</span>
                      </p>
                      <h2 className="text-3xl font-semibold tracking-tight md:text-4xl">{item.name}</h2>
                      <p className={`text-lg leading-relaxed ${muted}`}>{item.description}</p>
                      <div className="rounded-2xl bg-[hsl(var(--color-background-subtle))] px-5 py-4">
                        <p className={`font-mono text-xs uppercase tracking-[0.06em] ${subtle}`}>{list.noteLabel}</p>
                        <p className="mt-1.5 text-base font-medium leading-snug">{item.note}</p>
                      </div>
                      {item.facts && (
                        <dl className={`grid grid-cols-2 gap-4 font-mono text-xs uppercase tracking-[0.06em] ${subtle}`}>
                          {item.facts.map((fact) => (
                            <div key={fact.label}>
                              <dt>{fact.label}</dt>
                              <dd className="mt-1 normal-case tracking-normal text-sm text-[hsl(var(--color-foreground))]" data-no-reveal>{fact.value}</dd>
                            </div>
                          ))}
                        </dl>
                      )}
                      <div>
                        <TrackedLink href={item.url} track={`${base}/${item.id}`} external className={buttonVariants({ variant: "secondary" })}>
                          Visit {item.linkLabel}
                          <ArrowUpRight size={16} aria-hidden="true" />
                        </TrackedLink>
                      </div>
                    </div>
                  </article>
                </AnimatedSection>
              </li>
            ))}
          </ol>
        </Container>
      </Section>

      <Section spacing="sm">
        <Container>
          <SectionIntro number="+" label="More like this" title="New lists drop on Instagram first">
            {list.footnote}
          </SectionIntro>
          <div className="mt-10 flex flex-wrap gap-3">
            <a href="https://www.instagram.com/craefto/" target="_blank" rel="noopener noreferrer" className={buttonVariants({ size: "lg" })}>
              <InstagramLogo size={18} aria-hidden="true" />
              Follow @craefto
            </a>
            <Link href="/free" className={buttonVariants({ size: "lg", variant: "ghost" })}>
              Everything that&apos;s free
            </Link>
          </div>
        </Container>
      </Section>
    </>
  );
}
