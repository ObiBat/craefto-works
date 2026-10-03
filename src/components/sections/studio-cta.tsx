import Link from "next/link";
import { ArrowRight } from "@phosphor-icons/react/dist/ssr";
import { Container, Section } from "@/components/layout";
import { AnimatedSection } from "@/components/ui";
import { Button } from "@/components/ui/button";
import { LogoMark } from "@/components/ui/logo-mark";
import { BookCall } from "@/components/book-call";
import { RevealText } from "@/components/editorial/reveal-text";

/**
 * The green closing panel used across the studio pages (/about, /start):
 * the Craefto mark turning in the corner, a heading, a line, and the next step.
 */
export function StudioCta({
  eyebrow = "Start here",
  title,
  text,
  primary = { kind: "call", label: "Book a free call" },
  secondary = { href: "/contact", label: "Send a message" },
  footnote,
}: {
  eyebrow?: string;
  title: string;
  text: string;
  /** A Discovery Call pop-up, or a link. */
  primary?: { kind: "call"; label: string; project?: string } | { kind: "link"; href: string; label: string };
  secondary?: { href: string; label: string } | null;
  footnote?: React.ReactNode;
}) {
  return (
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
              <p className="font-mono text-xs font-medium uppercase tracking-[0.06em] text-white/70">{eyebrow}</p>
              <h2 className="mt-5 !text-white">
                <RevealText text={title} />
              </h2>
              <p data-no-reveal className="mt-5 max-w-xl text-lg leading-relaxed text-white/80">
                {text}
              </p>
              <div className="mt-10 flex flex-wrap items-start gap-3">
                {primary.kind === "call" ? (
                  <BookCall size="lg" onDark project={primary.project} className="!bg-white !text-[hsl(var(--color-accent))]">
                    {primary.label}
                  </BookCall>
                ) : (
                  <Button asChild size="lg" variant="secondary" className="!bg-white !text-[hsl(var(--color-accent))]">
                    <Link href={primary.href}>
                      {primary.label}
                      <ArrowRight size={16} aria-hidden="true" />
                    </Link>
                  </Button>
                )}
                {secondary && (
                  <Button asChild size="lg" variant="ghost" className="!text-white hover:!bg-white/10">
                    <Link href={secondary.href}>
                      {secondary.label}
                      <ArrowRight size={16} aria-hidden="true" />
                    </Link>
                  </Button>
                )}
              </div>
              {footnote && (
                <p data-no-reveal className="mt-10 text-sm text-white/70">
                  {footnote}
                </p>
              )}
            </div>
          </div>
        </AnimatedSection>
      </Container>
    </Section>
  );
}
