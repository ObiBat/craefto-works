"use client";

import { Container } from "@/components/layout/container";
import { Section } from "@/components/layout/section";
import { Separator } from "@/components/ui/separator";
import { SectionLabel } from "@/components/ui/section-label";
import { AnimatedSection, StaggeredGrid, StaggeredItem } from "@/components/ui/motion";
import { processSteps } from "@/lib/constants";
import { RevealText } from "@/components/editorial/reveal-text";

export function Process() {
  return (
    <Section spacing="lg">
      <Container>
        <div className="flex flex-col gap-14">
          {/* Header */}
          <AnimatedSection>
            <div className="flex flex-col gap-4">
              <SectionLabel number="04" label="Process" />
              <h2 className="font-semibold tracking-tight"><RevealText text={"How we work"} /></h2>
              <p data-ink className="text-lg text-[hsl(var(--color-foreground-muted))] max-w-2xl leading-relaxed mt-2">
                A clear, collaborative process from discovery to delivery.
              </p>
            </div>
          </AnimatedSection>

          <Separator />

          {/* Process Steps */}
          <StaggeredGrid className="grid grid-cols-1 md:grid-cols-2 gap-x-14 gap-y-12">
            {processSteps.map((step) => (
              <StaggeredItem key={step.number}>
                <div className="flex gap-6">
                  <div className="flex-shrink-0 w-14 h-14 rounded-xl bg-[hsl(var(--color-background-muted))] border border-[hsl(var(--color-border))] flex items-center justify-center">
                    <span className="text-sm font-semibold text-[hsl(var(--color-accent))]">
                      {step.number}
                    </span>
                  </div>
                  <div className="flex flex-col gap-3">
                    <h3 className="font-semibold tracking-tight">
                      {step.title}
                    </h3>
                    <p className="text-[hsl(var(--color-foreground-muted))] leading-relaxed">
                      {step.description}
                    </p>
                  </div>
                </div>
              </StaggeredItem>
            ))}
          </StaggeredGrid>
        </div>
      </Container>
    </Section>
  );
}
