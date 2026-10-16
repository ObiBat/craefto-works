"use client";

import { useEffect, useId, useRef, useState, useSyncExternalStore, type CSSProperties } from "react";
import { Pause, Play } from "@phosphor-icons/react";
import { FlowDiagram } from "./diagram";
import { LAYOUTS, NODES, type NodeId } from "./model";
import { useFlow } from "./use-flow";

// The construction page's information-flow diagram (section 03): the working
// day as a ring of five stages, with day hire and the pay run off it, and the
// software each stage connects to around it. A signal travels the ring a day
// at a time, on a loop. One SVG, laid out wide or narrow for the screen;
// buttons over the stages give keyboard and touch access to what each does.

const NARROW = "(max-width: 767px)";
const STILL = "(prefers-reduced-motion: reduce)";
function subscribe(onChange: () => void) {
  const queries = [window.matchMedia(NARROW), window.matchMedia(STILL)];
  for (const query of queries) query.addEventListener("change", onChange);
  return () => {
    for (const query of queries) query.removeEventListener("change", onChange);
  };
}
const snapshot = () => `${window.matchMedia(NARROW).matches ? "narrow" : "wide"}|${window.matchMedia(STILL).matches ? "still" : "move"}`;

const pct = (value: number, of: number) => `${((value / of) * 100).toFixed(3)}%`;

export function ConstructionFlow() {
  const environment = useSyncExternalStore(subscribe, snapshot, () => "wide|still");
  const [name, motion] = environment.split("|") as [keyof typeof LAYOUTS, "still" | "move"];
  const layout = LAYOUTS[name];
  const still = motion === "still";
  const uid = useId().replace(/[^a-zA-Z0-9_-]/g, "");
  const root = useRef<HTMLElement>(null);
  const svg = useRef<SVGSVGElement>(null);
  const [inView, setInView] = useState(false);
  const [paused, setPaused] = useState(false);
  const [focus, setFocus] = useState<NodeId | null>(null);

  useEffect(() => {
    const element = root.current;
    if (!element) return;
    const observer = new IntersectionObserver(([entry]) => setInView(entry.isIntersecting && entry.intersectionRatio >= 0.25), { threshold: [0, 0.25] });
    observer.observe(element);
    return () => observer.disconnect();
  }, []);

  useFlow(svg, { enabled: !still && inView && !paused, layout: layout.name });

  const { width, height, r } = layout;
  const shown = focus ? NODES.find((entry) => entry.id === focus)! : null;
  const tip = shown ? layout.nodes[shown.id] : null;

  return (
    <figure ref={root} className="flow" data-layout={layout.name} data-mode={still ? "still" : "move"}>
      <figcaption className="sr-only">
        How information moves through the system. Every working day goes round the same ring: jobs come in, a schedule is drafted with AI suggestions, a
        supervisor approves it, the crew get their shifts and record their hours, and approved hours are costed, then the next day starts. When the crew is
        short, extra hands are hired for the day. Approved hours roll into the pay run each week or fortnight. Each stage connects with tools such as Procore,
        Deputy, WhatsApp and Xero.
      </figcaption>

      <div className="flow-top">
        <p className="flow-kicker">How information moves</p>
        {!still ? (
          <button
            type="button"
            className="flow-control"
            onClick={() => setPaused((current) => !current)}
            aria-label={paused ? "Play the animation" : "Pause the animation"}
          >
            {paused ? <Play size={12} weight="fill" aria-hidden="true" /> : <Pause size={12} weight="fill" aria-hidden="true" />}
            <span aria-hidden="true">{paused ? "Play" : "Pause"}</span>
          </button>
        ) : null}
      </div>

      <div className="flow-canvas">
        <div className="flow-stage" style={{ aspectRatio: `${width} / ${height}` }}>
          <FlowDiagram svgRef={svg} layout={layout} uid={uid} focus={focus} />

          {/* Each stage, for keyboard, touch and screen readers */}
          {NODES.map((entry) => {
            const at = layout.nodes[entry.id];
            return (
              <button
                key={entry.id}
                type="button"
                className="flow-hit"
                style={{ left: pct(at.x, width), top: pct(at.y, height), width: pct((r + 8) * 2, width) } as CSSProperties}
                aria-label={entry.title}
                aria-describedby={focus === entry.id ? `${uid}-tip` : undefined}
                aria-expanded={focus === entry.id}
                onPointerEnter={(event) => event.pointerType === "mouse" && setFocus(entry.id)}
                onPointerLeave={(event) => event.pointerType === "mouse" && setFocus((current) => (current === entry.id ? null : current))}
                onFocus={() => setFocus(entry.id)}
                onBlur={() => setFocus((current) => (current === entry.id ? null : current))}
                onClick={() => setFocus(entry.id)}
                onKeyDown={(event) => event.key === "Escape" && setFocus(null)}
              />
            );
          })}
          {shown && tip ? (
            <div
              id={`${uid}-tip`}
              role="tooltip"
              className="flow-tip"
              data-side={tip.y > height * 0.55 ? "above" : "below"}
              data-align={tip.x < width * 0.22 ? "start" : tip.x > width * 0.78 ? "end" : "middle"}
              style={{ left: pct(tip.x, width), top: pct(tip.y + (tip.y > height * 0.55 ? -(r + 14) : r + 14), height) }}
            >
              <strong>{shown.title}</strong>
              <span>{shown.detail}</span>
            </div>
          ) : null}
        </div>
      </div>

      <div className="flow-foot">
        <ul className="flow-legend" aria-label="Key">
          <li>
            <span className="flow-key flow-key-signal" aria-hidden="true" />
            Information on the move
          </li>
          <li>
            <span className="flow-key flow-key-person" aria-hidden="true" />A person approves
          </li>
          <li>
            <span className="flow-key flow-key-app" aria-hidden="true" />
            Your existing tools
          </li>
        </ul>
        <p className="flow-note">
          Hover or tap a stage for what it does. A fictional demo, built to connect with tools you already use where they offer an API. Logos are trademarks of
          their owners.
        </p>
      </div>
    </figure>
  );
}
