"use client";

import { useId, useState } from "react";
import Link from "next/link";
import { Container } from "@/components/layout/container";
import { Section } from "@/components/layout/section";
import { SectionLabel } from "@/components/ui/section-label";
import { AnimatedSection } from "@/components/ui/motion";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { services } from "@/lib/constants";
import { RevealText } from "@/components/editorial/reveal-text";
import { Glide } from "@/components/editorial/glide";
import { cn } from "@/lib/utils";
import { formatPrice, priceFor, weeksLabel } from "@/lib/pricing";


function AccordionItem({
  service,
  index,
  isOpen,
  onToggle,
}: {
  service: typeof services[0];
  index: number;
  isOpen: boolean;
  onToggle: () => void;
}) {
  const number = String(index + 1).padStart(2, "0");
  const price = priceFor(service.icon);
  const panelId = useId();

  return (
    <div
      data-glide-item
      className={cn(
        "-mx-2.5 sm:-mx-6 px-2.5 sm:px-6 rounded-2xl transition-colors duration-500",
        isOpen && "bg-[hsl(var(--color-accent-subtle))]"
      )}
    >
      <button
        type="button"
        onClick={onToggle}
        className="w-full py-6 sm:py-8 flex items-center gap-4 sm:gap-8 text-left group transition-colors"
        aria-expanded={isOpen}
        aria-controls={panelId}
      >
        {/* Number */}
        <span
          className={cn(
            "font-mono text-sm font-medium tabular-nums w-8 shrink-0 transition-colors duration-300 group-hover:text-[hsl(var(--color-accent))]",
            isOpen ? "text-[hsl(var(--color-accent))]" : "text-[hsl(var(--color-foreground-subtle))]"
          )}
        >
          {number}
        </span>

        {/* Title + Badge */}
        <div className="flex-1 flex items-center gap-3">
          <h3 className="text-xl sm:text-2xl md:text-3xl font-semibold tracking-tight">
            {service.title}
          </h3>
          {service.badge && (
            <Badge variant="accent" className="hidden sm:inline-flex">
              {service.badge}
            </Badge>
          )}
        </div>

        {/* Toggle Icon - green accent on hover; turns into a cross when open */}
        <div
          data-open={isOpen ? "" : undefined}
          className={cn(
            "acc-toggle w-8 h-8 sm:w-10 sm:h-10 rounded-full flex items-center justify-center shrink-0 group-hover:bg-[hsl(var(--color-accent))] group-hover:text-white",
            isOpen
              ? "bg-[hsl(var(--color-accent))] text-white"
              : "bg-[hsl(var(--color-background-muted))] text-[hsl(var(--color-foreground))]"
          )}
        >
          <svg
            className="w-4 h-4 sm:w-5 sm:h-5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M12 6v12m6-6H6"
            />
          </svg>
        </div>
      </button>

      {/* Expandable content: always in the page (and in the HTML for search),
          opened and closed by a CSS grid-row transition; inert while closed so
          it's out of the tab order and hidden from screen readers. */}
      <div id={panelId} data-open={isOpen ? "" : undefined} inert={!isOpen} className="acc-panel">
        <div className="overflow-hidden">
          <div data-no-reveal className="pl-12 sm:pl-16 pb-8 sm:pb-10">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8 pt-6">
              {/* Description + CTA */}
              <div className="flex flex-col gap-5 lg:col-span-1">
                <p className="text-lg text-[hsl(var(--color-foreground-muted))] leading-relaxed">
                  {service.description}
                </p>
                
                {/* Pricing & Timeline */}
                <div className="flex flex-col gap-2">
                  <div className="flex items-center gap-2 text-sm">
                    <span className="text-[hsl(var(--color-foreground-subtle))]">Starting from</span>
                    <span className="font-semibold text-[hsl(var(--color-foreground))]">
                      {price && formatPrice(price.min)}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <span className="text-[hsl(var(--color-foreground-subtle))]">Typical timeline</span>
                    <span className="font-medium text-[hsl(var(--color-foreground))]">
                      {price && weeksLabel(price)}
                    </span>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex flex-col sm:flex-row gap-3 pt-2">
                  <Link href={`/contact?service=${service.icon}`}>
                    <Button size="sm" hoverText="Let's talk">
                      Get a quote
                    </Button>
                  </Link>
                  <Link
                    href={service.href}
                    className="inline-flex items-center justify-center gap-2 text-sm font-medium text-[hsl(var(--color-foreground-muted))] hover:text-[hsl(var(--color-foreground))] transition-colors py-2"
                  >
                    Learn more
                    <svg
                      className="w-4 h-4 transition-transform group-hover/link:translate-x-1"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={1.5}
                        d="M17 8l4 4m0 0l-4 4m4-4H3"
                      />
                    </svg>
                  </Link>
                </div>
              </div>

              {/* Capabilities */}
              <div className="lg:col-span-2 flex flex-wrap items-start content-start justify-start lg:justify-end gap-2">
                {service.capabilities?.map((capability) => (
                  <span
                    key={capability}
                    className="px-3 py-1.5 text-sm font-medium rounded-full border border-[hsl(var(--color-border))] text-[hsl(var(--color-foreground-muted))] bg-[hsl(var(--color-background))] whitespace-nowrap"
                  >
                    {capability}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export function ServicesOverview() {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  const handleToggle = (index: number) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  return (
    <Section spacing="lg">
      <Container>
        <div className="flex flex-col gap-14">
          {/* Header */}
          <AnimatedSection>
            <div className="flex flex-col gap-4">
              <SectionLabel number="01" label="Services" />
              <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
                <div>
                  <h2 className="font-semibold tracking-tight"><RevealText text={"What we build"} /></h2>
                  <p data-ink className="text-lg text-[hsl(var(--color-foreground-muted))] max-w-xl leading-relaxed mt-3">
                    End-to-end capabilities from brand to product.
                  </p>
                </div>
                <Link
                  href="/services"
                  className="text-sm text-[hsl(var(--color-foreground-muted))] hover:text-[hsl(var(--color-foreground))] transition-colors group flex items-center gap-2 shrink-0"
                >
                  View all services
                  <svg
                    className="w-4 h-4 transition-transform group-hover:translate-x-1"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={1.5}
                      d="M17 8l4 4m0 0l-4 4m4-4H3"
                    />
                  </svg>
                </Link>
              </div>
            </div>
          </AnimatedSection>

          {/* Services Accordion */}
          <AnimatedSection>
            <Glide bleed={0}>
              {services.map((service, index) => (
                <AccordionItem
                  key={service.title}
                  service={service}
                  index={index}
                  isOpen={openIndex === index}
                  onToggle={() => handleToggle(index)}
                />
              ))}
            </Glide>
          </AnimatedSection>
        </div>
      </Container>
    </Section>
  );
}
