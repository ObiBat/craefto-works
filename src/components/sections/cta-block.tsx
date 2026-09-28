"use client";

import Link from "next/link";
import { Container } from "@/components/layout/container";
import { Section } from "@/components/layout/section";
import { Button } from "@/components/ui/button";
import { AnimatedSection } from "@/components/ui/motion";
import { RevealText } from "@/components/editorial/reveal-text";

export function CTABlock() {
  return (
    <Section spacing="lg" className="pt-8 md:pt-12">
      <Container>
        <AnimatedSection>
          <div className="rounded-2xl bg-[hsl(var(--color-accent))] p-10 sm:p-14 md:p-16">
            <div className="flex flex-col items-center text-center gap-8 max-w-2xl mx-auto">
              <span className="text-xs font-medium uppercase font-mono tracking-[0.06em] text-white/70">
                Start a project
              </span>
              <h2 className="font-semibold tracking-tight !text-white"><RevealText text={"Ready to build something that lasts?"} /></h2>
              <p data-ink className="text-white/80 text-lg leading-relaxed max-w-lg">
                You don&apos;t need a finished brief. Start with what you are thinking about, and we will shape it together.
              </p>
              <Button size="lg" variant="secondary" className="mt-2 !bg-white !text-[hsl(var(--color-accent))] hover:!bg-[hsl(var(--color-foreground))] hover:!text-white" asChild>
                <Link href="/contact">
                  <span className="btn-text-wrapper">
                    <span className="btn-text-primary">
                      Start a conversation
                      <svg
                        className="w-4 h-4"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M17 8l4 4m0 0l-4 4m4-4H3"
                        />
                      </svg>
                    </span>
                    <span className="btn-text-secondary" aria-hidden="true">
                      Say hello
                      <svg
                        className="w-4 h-4"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M17 8l4 4m0 0l-4 4m4-4H3"
                        />
                      </svg>
                    </span>
                  </span>
                </Link>
              </Button>
            </div>
          </div>
        </AnimatedSection>
      </Container>
    </Section>
  );
}
