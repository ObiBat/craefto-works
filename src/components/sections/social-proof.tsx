"use client";

import { Container } from "@/components/layout/container";
import { Section } from "@/components/layout/section";
import { AnimatedSection, StaggeredGrid, StaggeredItem } from "@/components/ui/motion";

// Placeholder client/partner logos - replace with actual logos later
const clients = [
  { name: "TechCorp", placeholder: true },
  { name: "StartupX", placeholder: true },
  { name: "InnovateCo", placeholder: true },
  { name: "FutureLabs", placeholder: true },
  { name: "GrowthHQ", placeholder: true },
];

export function SocialProof() {
  return (
    <Section spacing="md">
      <Container>
        <AnimatedSection>
          <div className="flex flex-col items-center text-center gap-10">
            <p className="text-sm font-medium uppercase font-mono tracking-[0.06em] text-[hsl(var(--color-foreground-subtle))]">
              Trusted by founders building the future
            </p>

            <StaggeredGrid className="flex flex-wrap items-center justify-center gap-x-12 gap-y-8">
              {clients.map((client) => (
                <StaggeredItem key={client.name}>
                  <div className="flex items-center justify-center h-10 px-4 opacity-40 hover:opacity-70 transition-opacity">
                    {/* Placeholder logo - replace with actual logos */}
                    <span className="text-lg font-semibold tracking-tight text-[hsl(var(--color-foreground-muted))]">
                      {client.name}
                    </span>
                  </div>
                </StaggeredItem>
              ))}
            </StaggeredGrid>
          </div>
        </AnimatedSection>
      </Container>
    </Section>
  );
}
