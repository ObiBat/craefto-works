"use client";

import { useEffect, useRef, type RefObject } from "react";
import { WEEK, type Hop, type Timeline } from "./model";

// Plays an information-flow diagram on a loop: one clock and a timeline
// (model.ts's week by default), and everything on screen worked out from them
// each frame — where each signal is along its line, how lit each stage and its
// software are, which badges show, how full the pay week is. It drives
// whatever it finds in the SVG by data attributes, and writes straight to it
// through CSS custom properties, so React doesn't re-render while it plays.
// It runs only while enabled (in view, not paused, motion allowed); the clock
// keeps its place in between.

const ease = (p: number) => (p < 0.5 ? 4 * p * p * p : 1 - (-2 * p + 2) ** 3 / 2);
const smooth = (p: number) => p * p * (3 - 2 * p);
const clamp = (value: number) => Math.min(1, Math.max(0, value));

/** 0 to 1: up quickly, held, then down slowly. */
function envelope(t: number, start: number, duration: number, rise = 200, fall = 700) {
  if (t < start) return 0;
  if (t <= start + duration) return smooth(clamp((t - start) / rise));
  return smooth(clamp(1 - (t - start - duration) / fall));
}

/** A badge that pops in at `at` and fades after `hold`. */
const pop = (t: number, at: number, hold: number) => envelope(t, at, hold, 260, 500);

/** The custom property each kind of pulse drives, beside --a. */
const KINDS: Record<string, string> = { wait: "--w", ai: "--ai", hire: "--hot" };
/** How long a badge holds, in ms. */
const HOLD: Record<string, number> = { hired: 1100 };

interface Comet {
  halo: SVGPathElement;
  core: SVGPathElement;
  head: SVGCircleElement;
  length: number;
  shown: boolean;
}

interface Options {
  enabled: boolean;
  /** Which layout is drawn, so a new one is measured afresh. */
  layout: string;
  timeline?: Timeline;
}

export function useFlow(svg: RefObject<SVGSVGElement | null>, { enabled, layout, timeline = WEEK }: Options) {
  // Where the loop is, kept across pauses, scrolls and re-renders.
  const clock = useRef(0);
  // The first time it plays, the software eases down from full colour rather than snapping.
  const warmed = useRef(false);

  useEffect(() => {
    const root = svg.current;
    if (!root || !enabled) return;

    const hops = timeline.hops.reduce(
      (all, hop) => {
        (all[hop.id] ??= []).push(hop);
        return all;
      },
      {} as Record<string, Hop[]>,
    );
    const kinds = timeline.pulses.reduce(
      (all, pulse) => {
        if (pulse.kind) (all[pulse.node] ??= new Set()).add(pulse.kind);
        return all;
      },
      {} as Record<string, Set<string>>,
    );

    const comets = new Map<string, Comet>();
    for (const core of root.querySelectorAll<SVGPathElement>("[data-comet-core]")) {
      const id = core.dataset.cometCore!;
      const halo = root.querySelector<SVGPathElement>(`[data-comet-halo="${id}"]`);
      const head = root.querySelector<SVGCircleElement>(`[data-comet-head="${id}"]`);
      const length = core.getTotalLength();
      if (halo && head && length) comets.set(id, { halo, core, head, length, shown: true });
    }
    const select = <T extends Element>(selector: string) => [...root.querySelectorAll<T>(selector)];
    const nodes = new Map(select<SVGGElement>("[data-node]").map((element) => [element.dataset.node!, element]));
    const apps = new Map(select<SVGGElement>("[data-apps]").map((element) => [element.dataset.apps!, element]));
    const tracks = new Map(select<SVGPathElement>("[data-track]").map((element) => [element.dataset.track!, element]));
    const badges = new Map(select<SVGGElement>("[data-badge]").map((element) => [element.dataset.badge!, element]));
    const days = select<SVGTextElement>("[data-day]");
    const progress = root.querySelector<SVGCircleElement>("[data-progress]");
    const progressLength = progress ? 2 * Math.PI * Number(progress.getAttribute("r")) : 0;

    // Only write what changed.
    const written = new Map<Element, Map<string, string>>();
    const write = (element: Element | undefined | null, property: string, value: number | string) => {
      if (!element) return;
      const text = typeof value === "number" ? value.toFixed(3) : value;
      let previous = written.get(element);
      if (!previous) written.set(element, (previous = new Map()));
      if (previous.get(property) === text) return;
      previous.set(property, text);
      (element as SVGElement).style.setProperty(property, text);
    };

    const activity = (id: string, t: number, kind?: string) => {
      let value = 0;
      for (const pulse of timeline.pulses) {
        if (pulse.node !== id || (kind && pulse.kind !== kind)) continue;
        value = Math.max(value, envelope(t, pulse.start, pulse.duration), envelope(t + timeline.loop, pulse.start, pulse.duration));
      }
      return value;
    };

    const render = (t: number) => {
      // Signals along their lines.
      for (const [id, comet] of comets) {
        const hop = (hops[id] ?? []).find((entry) => t >= entry.start && t < entry.start + entry.duration);
        if (!hop) {
          if (comet.shown) {
            for (const part of [comet.halo, comet.core, comet.head]) part.style.opacity = "0";
            comet.shown = false;
          }
          continue;
        }
        const raw = (t - hop.start) / hop.duration;
        const progressed = ease(raw);
        const along = (hop.reverse ? 1 - progressed : progressed) * comet.length;
        const tail = Math.min(hop.faint ? 22 : 44, comet.length * 0.45);
        const offset = hop.reverse ? -along : tail - along;
        const fade = Math.min(1, raw / 0.08, (1 - raw) / 0.08) * (hop.faint ? 0.55 : 1);
        for (const part of [comet.halo, comet.core]) {
          part.style.strokeDasharray = `${tail} ${comet.length + tail}`;
          part.style.strokeDashoffset = `${offset}`;
        }
        const point = comet.core.getPointAtLength(along);
        comet.head.setAttribute("cx", point.x.toFixed(2));
        comet.head.setAttribute("cy", point.y.toFixed(2));
        comet.halo.style.opacity = `${fade}`;
        comet.core.style.opacity = `${fade}`;
        comet.head.style.opacity = `${fade}`;
        comet.shown = true;
      }

      // Lines brighten as a signal passes, then settle.
      for (const [id, track] of tracks) {
        let lit = 0;
        for (const hop of hops[id] ?? []) {
          if (hop.faint) continue;
          lit = Math.max(lit, envelope(t, hop.start, hop.duration, 300, 900));
        }
        write(track, "--e", lit);
      }

      // Stages light as the signal arrives, and their software with them.
      for (const [id, element] of nodes) {
        write(element, "--a", activity(id, t));
        for (const kind of kinds[id] ?? []) write(element, KINDS[kind], activity(id, t, kind));
      }
      for (const [id, element] of apps) write(element, "--lit", Math.max(activity(id, t), warmth));

      // Badges: a person approved, three hired, sent, paid.
      for (const [kind, element] of badges) {
        const hold = HOLD[kind] ?? 900;
        write(element, "--pop", timeline.marks.reduce((most, mark) => (mark.kind === kind ? Math.max(most, pop(t, mark.at, hold)) : most), 0));
      }

      // The pay week fills a day at a time, and empties once the pay run is out.
      if (progress && timeline.hours?.length) {
        let filled = 0;
        for (const at of timeline.hours) filled += smooth(clamp((t - at) / 600));
        const reset = timeline.paid === undefined ? 0 : smooth(clamp((t - timeline.paid) / 700));
        const share = (filled / timeline.hours.length) * (1 - reset);
        write(progress, "stroke-dashoffset", `${(progressLength * (1 - share)).toFixed(2)}`);
      }

      // Which day it is.
      if (timeline.days?.length) {
        const today = timeline.days.reduce((current, start, index) => (t >= start ? index : current), 0);
        days.forEach((element, index) => {
          const state = index < today ? "done" : index === today ? "on" : "next";
          if (element.getAttribute("data-state") !== state) element.setAttribute("data-state", state);
        });
      }
    };

    let frame = 0;
    let last = performance.now();
    const began = last;
    let warmth = warmed.current ? 0 : 1;
    const tick = (now: number) => {
      // A long gap (a hidden tab) doesn't skip the loop ahead.
      clock.current = (clock.current + Math.min(now - last, 64)) % timeline.loop;
      last = now;
      if (!warmed.current) {
        warmth = smooth(clamp(1 - (now - began) / 1100));
        if (warmth === 0) warmed.current = true;
      }
      render(clock.current);
      frame = requestAnimationFrame(tick);
    };
    render(clock.current);
    frame = requestAnimationFrame((now) => {
      last = now;
      frame = requestAnimationFrame(tick);
    });
    root.setAttribute("data-playing", "");
    return () => {
      cancelAnimationFrame(frame);
      root.removeAttribute("data-playing");
    };
  }, [svg, enabled, layout, timeline]);
}
