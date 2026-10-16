"use client";

import { useEffect, useRef, type RefObject } from "react";
import { DAYS, NODES, WEEK, type Hop, type NodeId } from "./model";

// Plays the information-flow diagram (model.ts) on a loop: one clock, and
// everything on screen worked out from it each frame — where each signal is
// along its line, how lit each stage and its software are, how full the pay
// week is. It writes straight to the SVG through CSS custom properties, so
// React doesn't re-render while it plays. It runs only while enabled (in
// view, not paused, motion allowed); the clock keeps its place in between.

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

const HOPS = WEEK.hops.reduce((all, hop) => {
  (all[hop.id] ??= []).push(hop);
  return all;
}, {} as Record<string, Hop[]>);

interface Comet {
  halo: SVGPathElement;
  core: SVGPathElement;
  head: SVGCircleElement;
  length: number;
  shown: boolean;
}

export function useFlow(svg: RefObject<SVGSVGElement | null>, { enabled, layout }: { enabled: boolean; layout: string }) {
  // Where the week is, kept across pauses, scrolls and re-renders.
  const clock = useRef(0);

  useEffect(() => {
    const root = svg.current;
    if (!root || !enabled) return;

    const comets = new Map<string, Comet>();
    for (const core of root.querySelectorAll<SVGPathElement>("[data-comet-core]")) {
      const id = core.dataset.cometCore!;
      const halo = root.querySelector<SVGPathElement>(`[data-comet-halo="${id}"]`);
      const head = root.querySelector<SVGCircleElement>(`[data-comet-head="${id}"]`);
      const length = core.getTotalLength();
      if (halo && head && length) comets.set(id, { halo, core, head, length, shown: true });
    }
    const select = <T extends Element>(selector: string) => [...root.querySelectorAll<T>(selector)];
    const nodes = new Map(select<SVGGElement>("[data-node]").map((element) => [element.dataset.node as NodeId, element]));
    const apps = new Map(select<SVGGElement>("[data-apps]").map((element) => [element.dataset.apps as NodeId, element]));
    const tracks = new Map(select<SVGPathElement>("[data-track]").map((element) => [element.dataset.track!, element]));
    const days = select<SVGTextElement>("[data-day]");
    const progress = root.querySelector<SVGCircleElement>("[data-progress]");
    const progressLength = progress ? 2 * Math.PI * Number(progress.getAttribute("r")) : 0;
    const badges = new Map(select<SVGGElement>("[data-badge]").map((element) => [element.dataset.badge!, element]));

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

    const activity = (id: NodeId, t: number, kind?: string) => {
      let value = 0;
      for (const pulse of WEEK.pulses) {
        if (pulse.node !== id || (kind && pulse.kind !== kind)) continue;
        value = Math.max(value, envelope(t, pulse.start, pulse.duration), envelope(t + WEEK.loop, pulse.start, pulse.duration));
      }
      return value;
    };

    const render = (t: number) => {
      // Signals along their lines.
      for (const [id, comet] of comets) {
        const hop = (HOPS[id] ?? []).find((entry) => t >= entry.start && t < entry.start + entry.duration);
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
        for (const hop of HOPS[id] ?? []) {
          if (hop.faint) continue;
          lit = Math.max(lit, envelope(t, hop.start, hop.duration, 300, 900));
        }
        write(track, "--e", lit);
      }

      // Stages light as the signal arrives, and their software with them.
      for (const entry of NODES) {
        const a = activity(entry.id, t);
        write(nodes.get(entry.id), "--a", a);
        write(apps.get(entry.id), "--lit", a);
      }
      write(nodes.get("approve"), "--w", activity("approve", t, "wait"));
      write(nodes.get("schedule"), "--ai", activity("schedule", t, "ai"));
      write(nodes.get("hire"), "--hot", activity("hire", t, "hire"));

      // A person approves; three are hired for the day; the pay run goes out.
      for (const kind of ["approved", "hired", "paid"] as const) {
        const hold = kind === "hired" ? 1100 : 900;
        const value = WEEK.marks.reduce((most, mark) => (mark.kind === kind ? Math.max(most, pop(t, mark.at, hold)) : most), 0);
        write(badges.get(kind), "--pop", value);
      }

      // The pay week fills a day at a time, and empties once the pay run is out.
      if (progress) {
        let filled = 0;
        for (const at of WEEK.hours) filled += smooth(clamp((t - at) / 600));
        const reset = smooth(clamp((t - WEEK.paid) / 700));
        const share = (filled / DAYS.length) * (1 - reset);
        write(progress, "stroke-dashoffset", `${(progressLength * (1 - share)).toFixed(2)}`);
      }

      // Which day it is.
      const today = WEEK.days.reduce((current, start, index) => (t >= start ? index : current), 0);
      days.forEach((element, index) => {
        const state = index < today ? "done" : index === today ? "on" : "next";
        if (element.getAttribute("data-state") !== state) element.setAttribute("data-state", state);
      });
    };

    let frame = 0;
    let last = performance.now();
    const tick = (now: number) => {
      // A long gap (a hidden tab) doesn't skip the week ahead.
      clock.current = (clock.current + Math.min(now - last, 64)) % WEEK.loop;
      last = now;
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
  }, [svg, enabled, layout]);
}
