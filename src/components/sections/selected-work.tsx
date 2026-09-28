"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { Container } from "@/components/layout/container";
import { Section } from "@/components/layout/section";
import { Separator } from "@/components/ui/separator";
import { SectionLabel } from "@/components/ui/section-label";
import { Badge } from "@/components/ui/badge";
import { AnimatedSection } from "@/components/ui/motion";
import { ProjectImagePlaceholder } from "@/components/ui/project-image-placeholder";
import { RevealText } from "@/components/editorial/reveal-text";

// Featured projects for the homepage strip, newest first
const featuredProjects = [
  {
    slug: "tav-partners",
    title: "TAV & Partners",
    description: "A typography-led static site and brand system for a new Sydney chartered accounting and tax advisory firm.",
    category: "Web",
    year: 2026,
    accentColor: "224 48% 21%",
    thumbnail: "/images/projects/tav-partners/tav-partners-thumb.jpg",
  },
  {
    slug: "japanoma",
    title: "JapanoMa",
    description: "A decision-aid platform helping Australian skiers weigh a Japan snow-country home base, from quiz to purchase.",
    category: "Product",
    year: 2026,
    accentColor: "211 33% 36%",
    thumbnail: "/images/projects/japanoma/japanoma-thumb.jpg",
  },
  {
    slug: "artisan",
    title: "Artisan",
    description: "Crew OS and spot marketplace for construction labour, built as a mobile app, site, deck and backend.",
    category: "Product",
    year: 2026,
    accentColor: "25 95% 53%",
    thumbnail: "/images/projects/artisan/artisan-thumb.jpg",
  },
  {
    slug: "fx-foundations",
    title: "FX Foundations",
    description: "A bilingual forex education platform with 163 researched lessons, a trading simulator and Pro plans.",
    category: "Product",
    year: 2026,
    accentColor: "153 40% 30%",
    thumbnail: "/images/projects/fx-foundations/fx-foundations-thumb.jpg",
  },
  {
    slug: "fontkin",
    title: "Fontkin",
    description: "Professional font pairing lab for designers & developers with curated combinations and one-click exports.",
    category: "Web",
    year: 2026,
    accentColor: "0 0% 6%",
    thumbnail: "/images/projects/fontkin/fontkin-thumb.jpg",
  },
  {
    slug: "globfam",
    title: "GlobFam",
    description: "Cross-border family finance platform with premium branding & motion design system.",
    category: "Brand",
    year: 2025,
    accentColor: "195 78% 38%",
    thumbnail: "/images/projects/globfam/globfam-thumb.jpg",
  },
  {
    slug: "tactix",
    title: "TACTIX",
    description: "The world's most beautiful 3D chess learning platform with AI-powered coaching.",
    category: "Product",
    year: 2025,
    accentColor: "45 61% 52%",
    thumbnail: "/images/projects/tactix/tactix-thumb.jpg",
  },
  {
    slug: "nuu",
    title: "NUU",
    description: "AI-powered property matching platform for the Australian rental market.",
    category: "SaaS",
    year: 2025,
    accentColor: "90 30% 45%",
    thumbnail: "/images/projects/nuu/nuu-thumb.jpg",
  },
];

// Motion tuning (pixels per second)
const BASE_SPEED = 30; // continuous drift, pixels per second
const TAP_BOOST = 1100; // added on each arrow tap
const MAX_BOOST = 2600; // cap for repeated taps
const BOOST_DECAY = 3.2; // higher decays faster (per second, exponential)

type Project = (typeof featuredProjects)[number];

function ProjectCard({ project, clone = false }: { project: Project; clone?: boolean }) {
  return (
    <Link
      href={`/work/${project.slug}`}
      className="group block w-[78vw] sm:w-[420px] lg:w-[440px] shrink-0"
      aria-hidden={clone || undefined}
      tabIndex={clone ? -1 : undefined}
      draggable={false}
    >
      <div className="aspect-[4/3] rounded-xl mb-5 transition-shadow duration-500 ease-out group-hover:shadow-2xl overflow-hidden relative">
        {project.thumbnail ? (
          <Image
            src={project.thumbnail}
            alt={clone ? "" : `${project.title} thumbnail`}
            fill
            draggable={false}
            className="object-cover transition-all duration-700 ease-[cubic-bezier(0.25,0.1,0.25,1)] group-hover:scale-105"
            sizes="(max-width: 640px) 78vw, 440px"
          />
        ) : (
          <ProjectImagePlaceholder
            projectName={project.title}
            imageType="thumb"
            accentColor={project.accentColor}
          />
        )}
      </div>
      <div className="flex flex-col gap-3">
        <div className="flex items-center gap-3">
          <Badge variant="secondary">{project.category}</Badge>
          <span className="text-sm text-[hsl(var(--color-foreground-subtle))]">{project.year}</span>
        </div>
        <h3 className="text-lg font-semibold tracking-tight">
          <span className="animated-underline">{project.title}</span>
        </h3>
        <p className="text-sm text-[hsl(var(--color-foreground-muted))] leading-relaxed">
          {project.description}
        </p>
      </div>
    </Link>
  );
}

function ArrowButton({
  direction,
  onTap,
  size = "md",
}: {
  direction: "left" | "right";
  onTap: () => void;
  size?: "md" | "lg";
}) {
  return (
    <button
      type="button"
      onClick={onTap}
      aria-label={direction === "left" ? "Move case studies backwards" : "Move case studies forwards"}
      className={`${size === "lg" ? "h-14 w-14" : "h-11 w-11"} rounded-full border border-[hsl(var(--color-border))] bg-[hsl(var(--color-background))] text-[hsl(var(--color-foreground))] flex items-center justify-center transition-colors hover:bg-[hsl(var(--color-background-muted))] active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[hsl(var(--color-foreground))] focus-visible:ring-offset-2 focus-visible:ring-offset-[hsl(var(--color-background))]`}
    >
      <svg className={size === "lg" ? "w-5 h-5" : "w-4 h-4"} fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
        {direction === "left" ? (
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 16l-4-4m0 0l4-4m-4 4h18" />
        ) : (
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 8l4 4m0 0l-4 4m4-4H3" />
        )}
      </svg>
    </button>
  );
}

export function SelectedWork() {
  const trackRef = useRef<HTMLDivElement>(null);
  const offsetRef = useRef(0);
  const boostRef = useRef(0);
  const loopWidthRef = useRef(0);
  const pausedRef = useRef(false);
  const dragRef = useRef<{ active: boolean; lastX: number; lastT: number; velocity: number; moved: number; pointerId: number | null }>({
    active: false, lastX: 0, lastT: 0, velocity: 0, moved: 0, pointerId: null,
  });
  const [reducedMotion, setReducedMotion] = useState(false);

  // Respect the OS reduced-motion preference: no drift, arrows still work.
  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => setReducedMotion(mq.matches);
    update();
    mq.addEventListener("change", update);
    return () => mq.removeEventListener("change", update);
  }, []);

  // Measure one loop (the track holds two copies of the set).
  useEffect(() => {
    const track = trackRef.current;
    if (!track) return;
    const measure = () => {
      // One loop is the distance from the first card to its clone,
      // which already includes every gap in the set.
      const first = track.children[0] as HTMLElement | undefined;
      const clone = track.children[featuredProjects.length] as HTMLElement | undefined;
      loopWidthRef.current = first && clone ? clone.offsetLeft - first.offsetLeft : 0;
    };
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(track);
    return () => ro.disconnect();
  }, []);

  // Animation loop
  useEffect(() => {
    const track = trackRef.current;
    if (!track) return;
    let frame = 0;
    let last = performance.now();

    const tick = (now: number) => {
      const dt = Math.min((now - last) / 1000, 0.05);
      last = now;

      const base = reducedMotion || pausedRef.current ? 0 : BASE_SPEED;
      const speed = base + boostRef.current;

      // Exponential decay of the tap boost back to zero
      boostRef.current *= Math.exp(-BOOST_DECAY * dt);
      if (Math.abs(boostRef.current) < 0.5) boostRef.current = 0;

      const loop = loopWidthRef.current;
      if (loop > 0 && speed !== 0 && !dragRef.current.active) {
        let next = offsetRef.current + speed * dt;
        next = ((next % loop) + loop) % loop;
        offsetRef.current = next;
        track.style.transform = `translate3d(${-next}px, 0, 0)`;
      }
      frame = requestAnimationFrame(tick);
    };

    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [reducedMotion]);

  const nudge = useCallback((direction: 1 | -1) => {
    const next = boostRef.current + direction * TAP_BOOST;
    boostRef.current = Math.max(-MAX_BOOST, Math.min(MAX_BOOST, next));
  }, []);

  const pause = useCallback(() => {
    pausedRef.current = true;
  }, []);
  const resume = useCallback(() => {
    pausedRef.current = false;
  }, []);

  // Swipe / drag: move the strip directly with the pointer, then hand the
  // release velocity to the boost so it glides and eases back to the drift.
  // Moves are tracked on the document rather than with pointer capture, so
  // the click at the end of a plain tap still reaches the card link.
  const onDocMove = useCallback((e: PointerEvent) => {
    const d = dragRef.current;
    if (!d.active || d.pointerId !== e.pointerId) return;
    const now = performance.now();
    const dx = e.clientX - d.lastX;
    const dt = Math.max((now - d.lastT) / 1000, 1 / 240);
    d.velocity = 0.7 * d.velocity + 0.3 * (-dx / dt);
    d.moved += Math.abs(dx);
    d.lastX = e.clientX; d.lastT = now;
    const loop = loopWidthRef.current;
    if (loop > 0) {
      let next = offsetRef.current - dx;
      next = ((next % loop) + loop) % loop;
      offsetRef.current = next;
      if (trackRef.current) trackRef.current.style.transform = `translate3d(${-next}px, 0, 0)`;
    }
  }, []);

  const detachRef = useRef<() => void>(() => {});

  const onDocUp = useCallback((e: PointerEvent) => {
    const d = dragRef.current;
    if (!d.active || d.pointerId !== e.pointerId) return;
    d.active = false; d.pointerId = null;
    detachRef.current();
    // Momentum: carry the release velocity into the boost, capped
    boostRef.current = d.moved > 8 ? Math.max(-MAX_BOOST, Math.min(MAX_BOOST, d.velocity)) : 0;
    // Let the drift resume once the finger lifts (hover keeps it paused on desktop)
    if (e.pointerType !== "mouse") pausedRef.current = false;
  }, []);

  const onPointerDown = useCallback((e: React.PointerEvent<HTMLDivElement>) => {
    if (e.pointerType === "mouse" && e.button !== 0) return;
    const d = dragRef.current;
    d.active = true; d.lastX = e.clientX; d.lastT = performance.now(); d.velocity = 0; d.moved = 0; d.pointerId = e.pointerId;
    boostRef.current = 0;
    pausedRef.current = true;
    document.addEventListener("pointermove", onDocMove);
    document.addEventListener("pointerup", onDocUp);
    document.addEventListener("pointercancel", onDocUp);
    detachRef.current = () => {
      document.removeEventListener("pointermove", onDocMove);
      document.removeEventListener("pointerup", onDocUp);
      document.removeEventListener("pointercancel", onDocUp);
      detachRef.current = () => {};
    };
  }, [onDocMove, onDocUp]);

  useEffect(() => () => detachRef.current(), []);

  // A drag should not open the card under the finger
  const onClickCapture = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (dragRef.current.moved > 8) { e.preventDefault(); e.stopPropagation(); dragRef.current.moved = 0; }
  }, []);

  return (
    <Section spacing="lg">
      <Container>
        <div className="flex flex-col gap-14">
          {/* Header */}
          <AnimatedSection>
            <div className="flex flex-col gap-4">
              <SectionLabel number="02" label="Case studies" />
              <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-6">
                <div>
                  <h2 className="font-semibold tracking-tight"><RevealText text={"Featured case studies"} /></h2>
                  <p data-ink className="text-lg text-[hsl(var(--color-foreground-muted))] max-w-xl leading-relaxed mt-3">
                    Recent projects for founders building the future.
                  </p>
                </div>
                <div className="flex items-center gap-5 shrink-0">
                  <Link
                    href="/work"
                    className="text-sm text-[hsl(var(--color-foreground-muted))] hover:text-[hsl(var(--color-foreground))] transition-colors group flex items-center gap-2"
                  >
                    All case studies
                    <svg
                      className="w-4 h-4 transition-transform group-hover:translate-x-1"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                      aria-hidden="true"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={1.5}
                        d="M17 8l4 4m0 0l-4 4m4-4H3"
                      />
                    </svg>
                  </Link>
                  <div className="hidden sm:flex items-center gap-2">
                    <ArrowButton direction="left" onTap={() => nudge(-1)} />
                    <ArrowButton direction="right" onTap={() => nudge(1)} />
                  </div>
                </div>
              </div>
            </div>
          </AnimatedSection>

          <Separator />
        </div>
      </Container>

      {/* Auto-moving strip, full bleed with faded edges */}
      <div
        className="relative mt-14 overflow-hidden select-none [touch-action:pan-y] cursor-grab active:cursor-grabbing [mask-image:linear-gradient(to_right,transparent,black_6%,black_94%,transparent)]"
        onMouseEnter={pause}
        onMouseLeave={resume}
        onFocusCapture={pause}
        onBlurCapture={resume}
        onPointerDown={onPointerDown}
        onClickCapture={onClickCapture}
      >
        <div
          ref={trackRef}
          className="flex gap-6 lg:gap-8 pl-4 sm:pl-6 lg:pl-8 will-change-transform"
        >
          {featuredProjects.map((project) => (
            <ProjectCard key={project.slug} project={project} />
          ))}
          {featuredProjects.map((project) => (
            <ProjectCard key={`${project.slug}-clone`} project={project} clone />
          ))}
        </div>
      </div>

      {/* Mobile controls: large, centred, right under the strip */}
      <div className="sm:hidden mt-8 flex flex-col items-center gap-3">
        <div className="flex items-center gap-4">
          <ArrowButton direction="left" onTap={() => nudge(-1)} size="lg" />
          <ArrowButton direction="right" onTap={() => nudge(1)} size="lg" />
        </div>
        <p className="text-xs text-[hsl(var(--color-foreground-subtle))]">Swipe or tap the arrows</p>
      </div>
    </Section>
  );
}
