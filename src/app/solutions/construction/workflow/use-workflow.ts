"use client";

import { useCallback, useEffect, useRef, useState, useSyncExternalStore, type RefObject } from "react";
import { EDGES, LAST, MOTION, PHASES } from "./model";

// Plays the workflow graph's week (model.ts) on a loop. One cursor walks the
// phases; everything the graph shows is worked out from it.
//
// Modes:
// - "autoplay": the graph enters as it scrolls into view and plays the week
//   over and over, with nothing for the visitor to press. It suspends
//   offscreen, in a hidden tab and while paused.
// - "static" (reduced motion, and the server render): the end of the week at
//   rest, so the server and the first client render agree.
//
// Timing is deterministic: one timer at a time, keyed to the cursor and the
// lap, so pausing resumes where it stopped. Signals are Web Animations on the
// connectors, not React state.

export type Mode = "static" | "autoplay";
export type Reveal = "pending" | "revealing" | "done";

const STILL = "(prefers-reduced-motion: reduce)";

function subscribe(onChange: () => void) {
  const query = window.matchMedia(STILL);
  query.addEventListener("change", onChange);
  return () => query.removeEventListener("change", onChange);
}
const currentMode = (): Mode => (window.matchMedia(STILL).matches ? "static" : "autoplay");
const serverMode = (): Mode => "static";

const LOOPS = new Set(EDGES.filter((edge) => edge.kind === "loop").map((edge) => edge.id));

export function useWorkflow(
  root: RefObject<HTMLElement | null>,
  /** Each connector's signal paths, by "<edge>:<layer>" (a soft halo and a bright core). */
  signals: RefObject<Map<string, SVGPathElement>>,
) {
  const mode = useSyncExternalStore(subscribe, currentMode, serverMode);

  const [timeline, setTimeline] = useState(LAST);
  // Laps of the week, so each one starts its signals afresh.
  const [lap, setLap] = useState(0);
  const [reveal, setReveal] = useState<Reveal>("done");
  const [paused, setPaused] = useState(false);
  // In view: a fifth of the graph showing, enough to watch.
  const [inView, setInView] = useState(false);
  const [pageVisible, setPageVisible] = useState(true);

  // A new mode starts clean: the end of the week when still, before Monday otherwise.
  const [modeShown, setModeShown] = useState<Mode>("static");
  if (mode !== modeShown) {
    setModeShown(mode);
    setTimeline(mode === "static" ? LAST : -1);
    setReveal("done");
    setPaused(false);
  }

  const cursor = timeline;
  const running = mode === "autoplay" && !paused && inView && pageVisible;

  const latest = useRef({ mode, cursor, running });
  useEffect(() => {
    latest.current = { mode, cursor, running };
  }, [mode, cursor, running]);

  // What's left of a phase's hold when it was paused, for that lap and phase only.
  const remaining = useRef<{ lap: number; cursor: number; ms: number } | null>(null);
  const animations = useRef(new Set<Animation>());
  const cancelSignals = useCallback(() => {
    for (const animation of animations.current) {
      const target = (animation.effect as KeyframeEffect | null)?.target as SVGElement | null;
      animation.cancel();
      target?.style.removeProperty("stroke-dasharray");
    }
    animations.current.clear();
  }, []);

  // A change of mode cancels any signal in flight.
  useEffect(() => {
    remaining.current = null;
    cancelSignals();
  }, [mode, cancelSignals]);

  // In view or not. Out of view before it has started, the graph waits
  // hidden, to enter when it arrives; a graph already in view (a jump to
  // #how-it-works) starts as it is, so nothing vanishes in front of anyone.
  useEffect(() => {
    const element = root.current;
    if (!element) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        const visible = entry.isIntersecting && entry.intersectionRatio >= 0.2;
        setInView(visible);
        const { mode: now, cursor: at } = latest.current;
        if (now !== "autoplay" || at !== -1) return;
        setReveal((current) => (visible ? (current === "pending" ? "revealing" : current) : !entry.isIntersecting && current === "done" ? "pending" : current));
      },
      { threshold: [0, 0.2] },
    );
    observer.observe(element);
    const onVisibility = () => setPageVisible(!document.hidden);
    onVisibility();
    document.addEventListener("visibilitychange", onVisibility);
    return () => {
      observer.disconnect();
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, [root]);

  // The entrance settles after its length.
  useEffect(() => {
    if (reveal !== "revealing") return;
    const timer = window.setTimeout(() => setReveal("done"), MOTION.reveal);
    return () => window.clearTimeout(timer);
  }, [reveal]);

  // The week starts once the graph has entered and is playing.
  useEffect(() => {
    if (!running || reveal !== "done" || timeline !== -1) return;
    const timer = window.setTimeout(() => setTimeline(0), 350);
    return () => window.clearTimeout(timer);
  }, [running, reveal, timeline]);

  // Each phase holds for its time, then the next begins; after Friday's pay run, a new week.
  useEffect(() => {
    if (!running || timeline < 0) return;
    const saved = remaining.current;
    const ms = saved && saved.lap === lap && saved.cursor === timeline ? saved.ms : PHASES[timeline].hold;
    const started = performance.now();
    let fired = false;
    const timer = window.setTimeout(() => {
      fired = true;
      remaining.current = null;
      if (timeline === LAST) {
        setLap((current) => current + 1);
        setTimeline(0);
      } else setTimeline(timeline + 1);
    }, ms);
    return () => {
      window.clearTimeout(timer);
      if (!fired) remaining.current = { lap, cursor: timeline, ms: Math.max(0, ms - (performance.now() - started)) };
    };
  }, [running, timeline, lap]);

  // Entering a phase sends its signals along their connectors, one after
  // another: a comet the same size on every connector, however long.
  useEffect(() => {
    if (mode !== "autoplay" || timeline < 0) return;
    (PHASES[timeline].signals ?? []).forEach((id, order) => {
      for (const layer of ["halo", "core"]) {
        const path = signals.current?.get(`${id}:${layer}`);
        if (!path || typeof path.animate !== "function" || typeof path.getTotalLength !== "function") continue;
        const length = path.getTotalLength();
        if (!length) continue;
        const comet = Math.min(layer === "halo" ? 44 : 32, length * 0.6);
        path.style.strokeDasharray = `${comet} ${length + comet * 2}`;
        const animation = path.animate([{ strokeDashoffset: comet + 8 }, { strokeDashoffset: -(length + 8) }], {
          duration: LOOPS.has(id) ? MOTION.loop : MOTION.signal,
          delay: order * MOTION.stagger,
          easing: MOTION.ease,
          fill: "both",
        });
        animations.current.add(animation);
        animation.onfinish = () => {
          animations.current.delete(animation);
          animation.cancel();
          path.style.removeProperty("stroke-dasharray");
        };
        if (!latest.current.running) animation.pause();
      }
    });
  }, [mode, timeline, lap, signals]);

  // Signals in flight hold still while the graph is paused or out of sight.
  useEffect(() => {
    for (const animation of animations.current) {
      if (running) animation.play();
      else animation.pause();
    }
  }, [running]);

  // Leaving the page stops everything.
  useEffect(() => cancelSignals, [cancelSignals]);

  const togglePause = useCallback(() => setPaused((current) => !current), []);

  return { mode, cursor, lap, reveal, paused, running, started: cursor >= 0, togglePause };
}
