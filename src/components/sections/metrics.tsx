"use client";

import { Container } from "@/components/layout/container";
import { Section } from "@/components/layout/section";
import { Separator } from "@/components/ui/separator";
import { AnimatedSection, StaggeredGrid, StaggeredItem, AnimatedCounter } from "@/components/ui/motion";
import { RevealText } from "@/components/editorial/reveal-text";

const metrics = [
  {
    value: 50,
    suffix: "+",
    label: "Projects delivered",
    description: "From MVPs to full-scale platforms",
  },
  {
    value: 98,
    suffix: "%",
    label: "Client satisfaction",
    description: "Based on post-project surveys",
  },
  {
    value: 4,
    suffix: "-5 wks",
    label: "Average delivery",
    description: "From kickoff to launch",
  },
  {
    value: 5,
    suffix: "+",
    label: "Years experience",
    description: "In design & development",
  },
];

export function Metrics() {
  return (
    <Section spacing="lg">
      <Container>
        <div className="flex flex-col gap-14">
          <AnimatedSection>
            <div className="flex flex-col gap-4 text-center max-w-2xl mx-auto">
              <h2 className="font-semibold tracking-tight"><RevealText text={"Building track record"} /></h2>
              <p data-ink className="text-lg text-[hsl(var(--color-foreground-muted))] leading-relaxed">
                Numbers that reflect our commitment to quality and long-term partnerships.
              </p>
            </div>
          </AnimatedSection>

          <Separator />

          <StaggeredGrid className="grid grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-12">
            {metrics.map((metric) => (
              <StaggeredItem key={metric.label}>
                <div className="flex flex-col gap-2 text-center">
                  <div className="flex items-baseline justify-center gap-1">
                    <span className="text-4xl sm:text-5xl font-semibold tracking-tight text-[hsl(var(--color-foreground))]">
                      <AnimatedCounter value={metric.value} />
                    </span>
                    <span className="text-2xl sm:text-3xl font-semibold text-[hsl(var(--color-accent))]">
                      {metric.suffix}
                    </span>
                  </div>
                  <h3 className="text-base font-semibold tracking-tight">
                    {metric.label}
                  </h3>
                  <p className="text-sm text-[hsl(var(--color-foreground-muted))]">
                    {metric.description}
                  </p>
                </div>
              </StaggeredItem>
            ))}
          </StaggeredGrid>
        </div>
      </Container>
    </Section>
  );
}
