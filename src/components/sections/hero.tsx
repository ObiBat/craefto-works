"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import dynamic from "next/dynamic";
import { Container } from "@/components/layout/container";
import { Button } from "@/components/ui/button";
import { HeroText, AnimatedCounter } from "@/components/ui/motion";
import { RevealText } from "@/components/editorial/reveal-text";

const Metaballs = dynamic(
  () => import("@/components/ui/metaballs").then((mod) => mod.Metaballs),
  { ssr: false }
);

// The project count comes from the case studies, as on /about and /start,
// so the three pages always agree, and the capabilities from
// content/capabilities.ts. The 30 days of support after launch are a
// commitment on /about and in the services FAQ.
const socialProof = (projectCount: number, capabilityCount: number) => [
  { value: projectCount, suffix: "", label: "Projects shipped" },
  { value: capabilityCount, suffix: "", label: "Capabilities, one team" },
  { value: 30, suffix: "", label: "Days of support after launch" },
];

export function Hero({ projectCount, capabilityNames }: { projectCount: number; capabilityNames: string[] }) {
  // The 3D artwork mounts once the browser is idle, so three.js never
  // competes with the first paint. Starting it is a long task (WebGL context
  // and shaders), so arriving by link it waits until the hero's entrance and
  // counters have played (about 2.4s), then fades in. A full load needn't
  // wait, as the logo intro's veil covers the start, and nor does reduced
  // motion, which has no entrance.
  const [showBlob, setShowBlob] = useState(false);

  useEffect(() => {
    const w = window as Window & {
      requestIdleCallback?: (cb: () => void) => number;
      cancelIdleCallback?: (id: number) => void;
    };
    const show = () => setShowBlob(true);
    const noEntrance =
      document.documentElement.classList.contains("logo-intro-home") ||
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    let idle: number | undefined;
    const wait = window.setTimeout(() => {
      idle = w.requestIdleCallback ? w.requestIdleCallback(show) : window.setTimeout(show, 300);
    }, noEntrance ? 0 : 2400);
    return () => {
      window.clearTimeout(wait);
      if (idle === undefined) return;
      if (w.cancelIdleCallback) w.cancelIdleCallback(idle);
      else window.clearTimeout(idle);
    };
  }, []);

  return (
    <section className="relative min-h-[100vh] flex items-center pt-20 pb-16 overflow-hidden bg-[hsl(var(--color-background))]">
      {/* 3D artwork: behind the content on phones, lowered to sit beside the
          buttons, clear of the text; the right half on wider screens, and a
          smaller box at the right on portrait tablets, where a full-height one
          would grow into the text. */}
      <div className="absolute left-0 right-0 top-[15%] bottom-0 z-0 pointer-events-none translate-x-[20%] translate-y-16 md:top-0 md:left-auto md:right-0 md:w-[55%] md:translate-x-0 md:translate-y-0 md:portrait:top-1/4 md:portrait:bottom-1/4 md:portrait:w-[40%]" aria-hidden="true">
        {showBlob && <Metaballs className="blob-in w-full h-full" />}
      </div>

      {/* Content - left aligned */}
      <Container size="lg" className="relative z-10">
        <div className="flex flex-col items-start text-left gap-6 max-w-xl lg:max-w-[46rem]">
          {/* Badge */}
          <HeroText delay={0}>
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-[hsl(var(--color-accent))]/10 border border-[hsl(var(--color-accent))]/20">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[hsl(var(--color-accent))] opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-[hsl(var(--color-accent))]"></span>
              </span>
              <span className="text-sm font-medium text-[hsl(var(--color-accent))]">
                Available for new projects
              </span>
            </div>
          </HeroText>

          <h1 className="text-5xl sm:text-6xl lg:text-7xl font-semibold tracking-tighter leading-[0.98] text-[hsl(var(--color-foreground))]">
            <RevealText text={"We build how businesses look, communicate and operate."} mode="load" />
          </h1>

          {/* The capabilities, named once: the sections below explain them. */}
          <HeroText delay={0.2}>
            <p className="text-lg sm:text-xl max-w-md leading-relaxed text-[hsl(var(--color-foreground-muted))]">
              {capabilityNames.map((name, i) => (
                <span key={name}>
                  <span className="font-medium text-[hsl(var(--color-foreground))]">{name}</span>
                  {i < capabilityNames.length - 2 ? ", " : i === capabilityNames.length - 2 ? " and " : ""}
                </span>
              ))}
              , brought together under one studio.
            </p>
          </HeroText>

          <HeroText delay={0.35}>
            <div className="flex flex-col sm:flex-row gap-4 mt-2">
              <Button size="lg" asChild>
                <Link href="/contact">
                  <span className="btn-text-wrapper">
                    <span className="btn-text-primary">
                      Start a project
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
                      Let&apos;s build
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
              <Button size="lg" variant="secondary" asChild>
                <Link href="/work">
                  <span className="btn-text-wrapper">
                    <span className="btn-text-primary">Case studies</span>
                    <span className="btn-text-secondary" aria-hidden="true">See our work</span>
                  </span>
                </Link>
              </Button>
            </div>
          </HeroText>

          {/* Social Proof Stats */}
          <HeroText delay={0.5}>
            <div className="flex items-center gap-8 pt-8 border-t-0 md:border-t border-[hsl(var(--color-border))] mt-4">
              {socialProof(projectCount, capabilityNames.length).map((stat, index) => (
                <div key={index} className="flex flex-col">
                  <span className="font-heading text-2xl sm:text-3xl font-semibold text-[hsl(var(--color-foreground))] tabular-nums">
                    <AnimatedCounter value={stat.value} duration={2 + index * 0.2} />
                    {stat.suffix}
                  </span>
                  <span className="text-sm text-[hsl(var(--color-foreground-muted))]">{stat.label}</span>
                </div>
              ))}
            </div>
          </HeroText>
        </div>
      </Container>
    </section>
  );
}
