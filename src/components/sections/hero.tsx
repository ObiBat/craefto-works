"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import dynamic from "next/dynamic";
import { motion, AnimatePresence } from "framer-motion";
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
  const [currentValueProp, setCurrentValueProp] = useState(0);
  const [showBlob, setShowBlob] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia("(min-width: 768px)");
    let idle = 0;
    const update = () => {
      if (!mq.matches) return setShowBlob(false);
      const w = window as Window & { requestIdleCallback?: (cb: () => void) => number };
      idle = w.requestIdleCallback ? w.requestIdleCallback(() => setShowBlob(true)) : window.setTimeout(() => setShowBlob(true), 300);
    };
    update();
    mq.addEventListener("change", update);
    return () => {
      mq.removeEventListener("change", update);
      const w = window as Window & { cancelIdleCallback?: (id: number) => void };
      if (w.cancelIdleCallback) w.cancelIdleCallback(idle);
      else window.clearTimeout(idle);
    };
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentValueProp((prev) => (prev + 1) % VALUE_PROPS.length);
    }, 4000);
    return () => clearInterval(interval);
  }, []);

  return (
    <section className="relative min-h-[100vh] flex items-center pt-20 pb-16 overflow-hidden bg-[hsl(var(--color-background))]">
      {/* 3D animation: tablet and up only (on phones it sat under the buttons),
          mounted once the browser is idle so three.js never competes with the
          first paint, and never downloads on phones at all. */}
      <div className="absolute hidden md:block top-0 right-0 bottom-0 w-[55%] z-0 pointer-events-none" aria-hidden="true">
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
            <div className="h-[56px] sm:h-[64px] overflow-hidden">
              {/* initial={false}: the first line renders visible (server and first
                  paint); only later changes animate. */}
              <AnimatePresence mode="wait" initial={false}>
                <motion.p
                  key={currentValueProp}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ duration: 0.4, ease: "easeOut" }}
                  className="text-lg sm:text-xl max-w-lg leading-relaxed text-[hsl(var(--color-foreground-muted))]"
                >
                  {VALUE_PROPS[currentValueProp]}
                </motion.p>
              </AnimatePresence>
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
