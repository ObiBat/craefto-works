"use client";

import { useState, useEffect, useRef } from "react";
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

const VALUE_PROPS = [
  "Design systems and digital products built with craft and intention.",
  "From brand identity to production-ready code, end to end.",
  "Strategy, design, engineering, and security audit under one roof.",
];

const SOCIAL_PROOF = [
  { value: 12, suffix: "+", label: "Projects delivered" },
  { value: 5, suffix: "", label: "Services, one team" },
  { value: 3, suffix: "-4 weeks", label: "To MVP, then iterate" },
];

export function Hero() {
  // The line on show, and the one leaving (none until the first change).
  const [line, setLine] = useState({ current: 0, previous: -1 });
  const paused = useRef(false);
  // The 3D artwork mounts once the browser is idle, so three.js never
  // competes with the first paint.
  const [showBlob, setShowBlob] = useState(false);

  useEffect(() => {
    const w = window as Window & {
      requestIdleCallback?: (cb: () => void) => number;
      cancelIdleCallback?: (id: number) => void;
    };
    const show = () => setShowBlob(true);
    const idle = w.requestIdleCallback ? w.requestIdleCallback(show) : window.setTimeout(show, 300);
    return () => {
      if (w.cancelIdleCallback) w.cancelIdleCallback(idle);
      else window.clearTimeout(idle);
    };
  }, []);

  // Rotate every 4s; hold while the pointer rests on it, and never with reduced motion.
  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const interval = setInterval(() => {
      if (paused.current) return;
      setLine(({ current }) => ({ current: (current + 1) % VALUE_PROPS.length, previous: current }));
    }, 4000);
    return () => clearInterval(interval);
  }, []);

  return (
    <section className="relative min-h-[100vh] flex items-center pt-20 pb-16 overflow-hidden bg-[hsl(var(--color-background))]">
      {/* 3D artwork: behind the content on phones, the right half on wider screens */}
      <div className="absolute left-0 right-0 top-[15%] bottom-0 z-0 pointer-events-none translate-x-[20%] md:top-0 md:left-auto md:right-0 md:w-[55%] md:translate-x-0" aria-hidden="true">
        {showBlob && <Metaballs className="w-full h-full" />}
      </div>

      {/* Content - left aligned */}
      <Container size="lg" className="relative z-10">
        <div className="flex flex-col items-start text-left gap-6 max-w-xl lg:max-w-2xl">
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

          <h1 className="text-5xl sm:text-6xl md:text-7xl lg:text-8xl font-semibold tracking-tighter leading-[0.95] text-[hsl(var(--color-foreground))]"><RevealText text={"Built to compound."} mode="load" /></h1>

          {/* Rotating value prop */}
          <HeroText delay={0.2}>
            {/* All lines share one grid cell; CSS lifts the old one out, then the
                new one in (see .rotator in globals.css). The first line is the
                one in the HTML, visible from the first paint. */}
            <div
              className="rotator h-[56px] sm:h-[64px] overflow-hidden"
              onPointerEnter={() => {
                paused.current = true;
              }}
              onPointerLeave={() => {
                paused.current = false;
              }}
            >
              {VALUE_PROPS.map((text, i) => (
                <p
                  key={text}
                  data-state={i === line.current ? "active" : i === line.previous ? "leaving" : "idle"}
                  aria-hidden={i !== line.current}
                  className="text-lg sm:text-xl max-w-lg leading-relaxed text-[hsl(var(--color-foreground-muted))]"
                >
                  {text}
                </p>
              ))}
            </div>
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
              {SOCIAL_PROOF.map((stat, index) => (
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
