"use client";

import { useEffect, useId, useRef, useState, useSyncExternalStore, type CSSProperties } from "react";
import { ArrowDown, Check, DeviceMobileSpeaker, Pause, Play, Receipt, UserCheck } from "@phosphor-icons/react";
import { APPS } from "./flow/apps";
import { Comet } from "./flow/diagram";
import { GATE, HERO, HUB, INPUTS, OUT, OUTPUTS, VIEW, inputId } from "./flow/hero";
import { useFlow } from "./flow/use-flow";

// The hero's preview: scattered to connected (flow/hero.ts). Today's tools
// drift on the left, each on its own tangled line; signals race in at odd
// times to one system, then leave in step along one clean line, through a
// person's approval, to the crew and the pay run. It plays while on screen
// (after the hero has settled), pauses on request, holds still for reduced
// motion, and leads to the full flow in section 03.

const STILL = "(prefers-reduced-motion: reduce)";
function subscribe(onChange: () => void) {
  const query = window.matchMedia(STILL);
  query.addEventListener("change", onChange);
  return () => query.removeEventListener("change", onChange);
}

const OUTPUT_ICONS = { crew: DeviceMobileSpeaker, payroll: Receipt };
const RING = [0, 1, 2, 3, 4].map((index) => ((index * 72 - 90) * Math.PI) / 180);

export function FlowPreview() {
  const root = useRef<HTMLElement>(null);
  const svg = useRef<SVGSVGElement>(null);
  const uid = useId().replace(/[^a-zA-Z0-9_-]/g, "");
  const still = useSyncExternalStore(
    subscribe,
    () => window.matchMedia(STILL).matches,
    () => true,
  );
  const [ready, setReady] = useState(false);
  const [onScreen, setOnScreen] = useState(false);
  const [paused, setPaused] = useState(false);

  // Start once the hero has settled (later on a first visit, after the brand intro).
  useEffect(() => {
    if (still) return;
    const intro = document.documentElement.classList.contains("intro-delay") ? 2100 : 0;
    const timer = window.setTimeout(() => setReady(true), 1100 + intro);
    return () => window.clearTimeout(timer);
  }, [still]);

  useEffect(() => {
    const element = root.current;
    if (!element) return;
    const observer = new IntersectionObserver(([entry]) => setOnScreen(entry.isIntersecting), { threshold: 0.3 });
    observer.observe(element);
    return () => observer.disconnect();
  }, []);

  useFlow(svg, { enabled: !still && ready && onScreen && !paused, layout: "hero", timeline: HERO });

  const lift = `url(#${uid}-lift)`;

  return (
    <figure ref={root} className="fp" data-mode={still ? "still" : "move"}>
      <figcaption className="sr-only">
        From scattered to connected: the tools a subcontractor juggles today, such as Procore, spreadsheets, WhatsApp and email, feed one system. A person
        approves, then shifts go to the crew and approved hours to payroll in tools such as Xero. A fictional demo.
      </figcaption>

      <div className="fp-head">
        <span className="fp-kicker">How information moves</span>
        {!still ? (
          <button
            type="button"
            className="fp-toggle"
            aria-label={paused ? "Play the animation" : "Pause the animation"}
            onClick={() => setPaused((current) => !current)}
          >
            {paused ? <Play size={12} weight="fill" aria-hidden="true" /> : <Pause size={12} weight="fill" aria-hidden="true" />}
          </button>
        ) : null}
      </div>

      <div className="fp-stage" style={{ aspectRatio: `${VIEW.width} / ${VIEW.height}` }}>
        <svg ref={svg} className="flow-svg hf" viewBox={`0 0 ${VIEW.width} ${VIEW.height}`} aria-hidden="true" focusable="false">
          <defs>
            <filter id={`${uid}-lift`} x="-50%" y="-50%" width="200%" height="200%">
              <feDropShadow dx="0" dy="5" stdDeviation="6" floodColor="hsl(30 12% 18%)" floodOpacity="0.16" />
            </filter>
            <clipPath id={`${uid}-tool`}>
              <circle r={16} />
            </clipPath>
            <clipPath id={`${uid}-badge`}>
              <circle r={8} />
            </clipPath>
          </defs>

          {/* Each tool on its own tangled line in, and one clean line out */}
          {INPUTS.map((input) => (
            <path key={input.app} className="hf-in" d={input.d} />
          ))}
          {(["gate", "crew", "payroll"] as const).map((id) => (
            <path key={id} className="flow-track hf-out" data-track={id} d={OUT[id]} />
          ))}

          {/* Signals: in at odd times, out in step */}
          {INPUTS.map((input) => (
            <Comet key={input.app} id={inputId(input.app)} d={input.d} small />
          ))}
          {(["gate", "crew", "payroll"] as const).map((id) => (
            <Comet key={id} id={id} d={OUT[id]} />
          ))}

          {/* Today's tools, drifting */}
          {INPUTS.map((input, index) => {
            const app = APPS[input.app];
            const tile = "tile" in app && app.tile;
            const size = tile ? 32 : 19;
            return (
              <g key={input.app} className="hf-tool" data-node={inputId(input.app)} transform={`translate(${input.x} ${input.y})`}>
                <g className="hf-float" style={{ "--d": `${index * -0.9}s`, "--t": `${4.4 + (index % 3) * 0.8}s` } as CSSProperties}>
                  <g className="hf-tool-shape">
                    <circle className="hf-tool-disc" r={16} filter={lift} />
                    <image
                      href={app.src}
                      x={-size / 2}
                      y={-size / 2}
                      width={size}
                      height={size}
                      clipPath={tile ? `url(#${uid}-tool)` : undefined}
                      preserveAspectRatio="xMidYMid meet"
                    />
                  </g>
                </g>
              </g>
            );
          })}

          {/* One system: a small ring turning inside, the working day in miniature */}
          <g className="hf-hub" data-node="hub" transform={`translate(${HUB.x} ${HUB.y})`}>
            <circle className="hf-hub-halo" r={HUB.r + 14} />
            <circle className="hf-hub-body" r={HUB.r} filter={lift} />
            <g className="hf-hub-ring">
              <circle className="hf-hub-orbit" r={12} />
              {RING.map((angle, index) => (
                <circle key={index} className="hf-hub-dot" cx={(12 * Math.cos(angle)).toFixed(2)} cy={(12 * Math.sin(angle)).toFixed(2)} r={2.6} />
              ))}
            </g>
          </g>

          {/* A person approves */}
          <g className="flow-node" data-node="approve" transform={`translate(${GATE.x} ${GATE.y})`}>
            <circle className="flow-node-halo" r={GATE.r + 9} />
            <circle className="flow-node-wait" r={GATE.r + 4} />
            <g className="flow-node-shape">
              <circle className="flow-node-body" r={GATE.r} filter={lift} />
              <g className="flow-icon-rest" transform="translate(-9 -9)">
                <UserCheck size={18} weight="duotone" />
              </g>
              <g className="flow-icon-live" transform="translate(-9 -9)">
                <UserCheck size={18} weight="duotone" />
              </g>
            </g>
            <g data-badge="approved" className="flow-badge" transform={`translate(${GATE.r * 0.8} ${-GATE.r * 0.8})`}>
              <g className="flow-badge-body">
                <circle r={7} />
                <Check x={-5} y={-5} size={10} weight="bold" />
              </g>
            </g>
          </g>

          {/* The crew, and the pay run, each in its own tool */}
          {(["crew", "payroll"] as const).map((id) => {
            const output = OUTPUTS[id];
            const OutputIcon = OUTPUT_ICONS[id];
            const app = APPS[output.app];
            const tile = "tile" in app && app.tile;
            return (
              <g key={id} className="flow-node hf-output" data-node={id} transform={`translate(${output.x} ${output.y})`}>
                <circle className="flow-node-halo" r={output.r + 10} />
                <g className="flow-node-shape">
                  <circle className="flow-node-body" r={output.r} filter={lift} />
                  <g className="flow-icon-rest" transform="translate(-9 -9)">
                    <OutputIcon size={18} weight="duotone" />
                  </g>
                  <g className="flow-icon-live" transform="translate(-9 -9)">
                    <OutputIcon size={18} weight="duotone" />
                  </g>
                </g>
                <g className="hf-app-badge" transform={`translate(${output.r * 0.78} ${output.r * 0.78})`}>
                  <circle className="hf-badge-disc" r={9} />
                  <image
                    href={app.src}
                    x={tile ? -8 : -6}
                    y={tile ? -8 : -6}
                    width={tile ? 16 : 12}
                    height={tile ? 16 : 12}
                    clipPath={tile ? `url(#${uid}-badge)` : undefined}
                    preserveAspectRatio="xMidYMid meet"
                  />
                </g>
                <g data-badge={id === "crew" ? "sent" : "paid"} className="flow-badge" transform={`translate(${output.r * 0.8} ${-output.r * 0.8})`}>
                  <g className="flow-badge-body">
                    <circle r={7} />
                    <Check x={-5} y={-5} size={10} weight="bold" />
                  </g>
                </g>
                <text className="hf-label" y={output.r + 19} textAnchor="middle">
                  {output.label}
                </text>
              </g>
            );
          })}

          {/* Four words */}
          <text className="hf-word" x={74} y={314} textAnchor="middle">
            Scattered
          </text>
          <text className="hf-word hf-word-on" x={HUB.x} y={HUB.y + HUB.r + 26} textAnchor="middle">
            Connected
          </text>
          <text className="hf-label" x={GATE.x} y={GATE.y + GATE.r + 19} textAnchor="middle">
            Approve
          </text>
        </svg>
      </div>

      <div className="fp-foot">
        <a href="#how-it-works" className="fp-link">
          See the full workflow
          <ArrowDown size={14} weight="bold" aria-hidden="true" />
        </a>
        <span className="fp-note">Demo · fictional data</span>
      </div>
    </figure>
  );
}
