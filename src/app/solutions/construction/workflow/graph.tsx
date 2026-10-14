"use client";

import { useCallback, useEffect, useId, useMemo, useRef, useState, type CSSProperties, type ReactNode, type RefObject } from "react";
import Image from "next/image";
import {
  ArrowsClockwise,
  Buildings,
  CalendarCheck,
  CalendarDots,
  DeviceMobileSpeaker,
  Lightning,
  Pause,
  Play,
  Receipt,
  Timer,
  UserCheck,
  UserPlus,
  type Icon,
} from "@phosphor-icons/react";
import { cn } from "@/lib/utils";
import { APPS } from "./apps";
import { across, over, vertical, type Box, type Route } from "./geometry";
import {
  DAYS,
  DAY_HIRE_HOURS,
  CREW_HOURS,
  EDGES,
  LANES,
  LAST,
  NODES,
  PHASES,
  SCENARIO,
  edgeStatesAt,
  hoursAt,
  phaseIndex,
  related,
  statesAt,
  type EdgeId,
  type GraphNode,
  type LaneId,
  type NodeId,
  type NodeState,
} from "./model";
import { useWorkflow } from "./use-workflow";

// The construction page's workflow graph (section 03), in three layers: the
// daily cycle (jobs to hours, then round again the next working day), day
// hire when the crew is short, and the pay run each week or fortnight. It
// plays one demonstration week on a loop. Cards are HTML in lanes on a grid;
// connectors are SVG drawn from the measured cards. See model.ts for the
// story and use-workflow.ts for how it plays.

const mono = "font-mono text-[0.6875rem] uppercase tracking-[0.06em]";

const ICONS: Record<NodeId, Icon> = {
  jobs: Buildings,
  scheduling: CalendarDots,
  approval: UserCheck,
  crew: DeviceMobileSpeaker,
  timesheets: Timer,
  hire: UserPlus,
  payroll: Receipt,
};

const LANE_ICONS: Record<LaneId, Icon> = {
  daily: ArrowsClockwise,
  demand: Lightning,
  pay: CalendarCheck,
};

/** States that need attention: a card in one of these never fades behind another in focus. */
const WORKING = new Set<NodeState>(["active", "waiting"]);

/** The entrance, in ms: the daily cards left to right, then the layers below. */
const ENTRANCE: Record<NodeId, number> = {
  jobs: 0,
  scheduling: 80,
  approval: 160,
  crew: 240,
  timesheets: 320,
  hire: 520,
  payroll: 600,
};

interface Geometry {
  width: number;
  height: number;
  edges: Partial<Record<EdgeId, Route>>;
  /** Where the "next working day" label sits on the way back. */
  loop: { x: number; y: number } | null;
}

/** The connectors, measured from the cards whenever anything changes size; only where the daily cards share a row. */
function useGeometry(layout: RefObject<HTMLElement | null>, cards: RefObject<Map<NodeId, HTMLElement>>) {
  const [geometry, setGeometry] = useState<Geometry | null>(null);
  useEffect(() => {
    const container = layout.current;
    if (!container) return;
    let frame = 0;
    const measure = () => {
      frame = 0;
      // Offsets up to the layout, which ignore transforms: a lifted card keeps its connectors.
      const box = (id: NodeId): Box | null => {
        const element = cards.current?.get(id);
        if (!element || !element.offsetParent) return null;
        let x = 0;
        let y = 0;
        for (let at: HTMLElement | null = element; at && at !== container; at = at.offsetParent as HTMLElement | null) {
          x += at.offsetLeft;
          y += at.offsetTop;
        }
        return { x, y, w: element.offsetWidth, h: element.offsetHeight };
      };
      const boxes = Object.fromEntries(NODES.map((entry) => [entry.id, box(entry.id)])) as Record<NodeId, Box | null>;
      const daily = NODES.filter((entry) => entry.lane === "daily").map((entry) => boxes[entry.id]);
      const edges: Geometry["edges"] = {};
      let loop: Geometry["loop"] = null;
      if (daily.every((entry) => entry && Math.abs(entry.y - daily[0]!.y) < 2)) {
        const { jobs, scheduling, timesheets, hire, payroll } = boxes;
        for (const edge of EDGES) {
          const from = boxes[edge.from];
          const to = boxes[edge.to];
          if (!from || !to) continue;
          if (edge.kind === "across") edges[edge.id] = across(from, to);
        }
        if (jobs && timesheets) {
          const y = jobs.y - 15;
          edges["next-day"] = over(timesheets, jobs, y);
          loop = {
            x: (jobs.x + jobs.w / 2 + timesheets.x + timesheets.w / 2) / 2,
            y,
          };
        }
        if (scheduling && hire) {
          const middle = scheduling.x + scheduling.w / 2;
          edges["scheduling-hire"] = vertical(scheduling, hire, middle - 9);
          edges["hire-scheduling"] = vertical(hire, scheduling, middle + 9);
        }
        if (timesheets && payroll) edges["timesheets-payroll"] = vertical(timesheets, payroll, timesheets.x + timesheets.w / 2);
      }
      setGeometry({
        width: container.offsetWidth,
        height: container.offsetHeight,
        edges,
        loop,
      });
    };
    const schedule = () => {
      if (!frame) frame = requestAnimationFrame(measure);
    };
    const observer = new ResizeObserver(schedule);
    observer.observe(container);
    for (const [, element] of cards.current ?? []) observer.observe(element);
    schedule();
    return () => {
      observer.disconnect();
      cancelAnimationFrame(frame);
    };
  }, [layout, cards]);
  return geometry;
}

/** A card's lines at this point in the week; a new set slides in. */
function Lines({ swap, children }: { swap: string; children: ReactNode }) {
  return (
    <ul key={swap} className="wf-lines wf-swap">
      {children}
    </ul>
  );
}

const Strong = ({ children }: { children: ReactNode }) => <li className="wf-line-strong">{children}</li>;
const Quiet = ({ children }: { children: ReactNode }) => <li className="wf-line-quiet">{children}</li>;
const Warn = ({ children }: { children: ReactNode }) => <li className="wf-line-warn">{children}</li>;
const Ai = ({ children }: { children: ReactNode }) => (
  <li className="wf-line-strong">
    <span className="wf-ai">AI</span>
    {children}
  </li>
);

interface View {
  cursor: number;
  day: number;
  state: NodeState;
  after: (phase: string) => boolean;
}

/** What each card says. Every name, figure and time is fictional. */
function Body({ id, view }: { id: NodeId; view: View }) {
  const { day, state, after } = view;
  const thursday = day === 3;
  switch (id) {
    case "jobs":
      return thursday && after("thu-jobs") ? (
        <Lines swap="pour">
          <Warn>Pour brought forward</Warn>
          <Quiet>Site A · 9 fixers today</Quiet>
        </Lines>
      ) : (
        <Lines swap="routine">
          <Strong>Site A · 6 fixers</Strong>
          <Quiet>Job list in sync</Quiet>
        </Lines>
      );
    case "scheduling":
      if (day === 1 && after("tue-gap")) {
        if (after("tue-approved"))
          return (
            <Lines swap="tue-done">
              <Strong>6 of 6 rostered</Strong>
              <Quiet>2 moved from Site B</Quiet>
            </Lines>
          );
        if (after("tue-review"))
          return (
            <Lines swap="tue-sent">
              <Strong>Suggestion sent</Strong>
              <Quiet>For the supervisor</Quiet>
            </Lines>
          );
        return (
          <Lines swap="tue-gap">
            <Warn>2 off sick · 4 of 6</Warn>
            <Ai>Move 2 from Site B</Ai>
          </Lines>
        );
      }
      if (thursday && after("thu-short"))
        return after("thu-rostered") ? (
          <Lines swap="thu-done">
            <Strong>9 of 9 rostered</Strong>
            <Quiet>Incl. 3 day hire</Quiet>
          </Lines>
        ) : (
          <Lines swap="thu-short">
            <Warn>6 of 9 · 3 short</Warn>
            <Ai>Hire 3 for the day</Ai>
          </Lines>
        );
      return (
        <Lines swap="routine">
          <Strong>6 of 6 rostered</Strong>
          <Quiet>No clashes</Quiet>
        </Lines>
      );
    case "approval":
      if (state === "waiting")
        return thursday ? (
          <Lines swap="thu-review">
            <Strong>Roster of 9 for the pour?</Strong>
            <Quiet>Supervisor reviewing</Quiet>
          </Lines>
        ) : (
          <Lines swap="tue-review">
            <Ai>Move 2 to Site A?</Ai>
            <Quiet>Supervisor reviewing</Quiet>
          </Lines>
        );
      if (state === "done")
        return (
          <Lines swap="approved">
            <Strong>Approved by the supervisor</Strong>
            <Quiet>{day === 1 ? "2 fixers move sites" : thursday ? "9 rostered for the pour" : "Today’s roster"}</Quiet>
          </Lines>
        );
      return (
        <Lines swap="rest">
          <Strong>A person decides</Strong>
          <Quiet>Nothing moves before this</Quiet>
        </Lines>
      );
    case "crew": {
      const crew = thursday ? 9 : 6;
      if (state === "active")
        return (
          <div key="sent" className="wf-swap">
            <p className="wf-message">{DAYS[day]} 6 AM · Site A</p>
            <ul className="wf-lines">
              <Quiet>Sent to {crew}</Quiet>
            </ul>
          </div>
        );
      if (state === "done")
        return (
          <Lines swap="on-site">
            <Strong>
              {crew} of {crew} on site
            </Strong>
            <Quiet>{thursday ? "Incl. 3 day hire" : day === 1 ? "Incl. 2 from Site B" : "Signed in by 6 AM"}</Quiet>
          </Lines>
        );
      return (
        <Lines swap="rest">
          <Quiet>Waits for approval</Quiet>
          <Quiet>Nothing sent yet</Quiet>
        </Lines>
      );
    }
    case "timesheets":
      if (state === "idle")
        return (
          <Lines swap="rest">
            <Quiet>Waits for hours</Quiet>
            <Quiet>Approved hours only</Quiet>
          </Lines>
        );
      return (
        <Lines swap={`hours-${day}`}>
          <Strong>{CREW_HOURS[day] + DAY_HIRE_HOURS[day]} h approved</Strong>
          <Quiet>{thursday ? "21 h day hire kept apart" : "Costed to the job"}</Quiet>
        </Lines>
      );
    case "hire":
      if (state === "active")
        return (
          <Lines swap="post">
            <Strong>3 fixers for Thursday</Strong>
            <Quiet>Posted to WhatsApp, Facebook and agencies</Quiet>
          </Lines>
        );
      if (state === "waiting")
        return (
          <Lines swap="check">
            <Strong>3 fixers confirmed</Strong>
            <Quiet>The office checks tickets and induction</Quiet>
          </Lines>
        );
      if (state === "done")
        return (
          <Lines swap="rostered">
            <Strong>3 day-hire fixers</Strong>
            <Quiet>On Thursday’s roster</Quiet>
          </Lines>
        );
      return (
        <Lines swap="standby">
          <Strong>On standby</Strong>
          <Quiet>Casual pool, Facebook page, agencies</Quiet>
        </Lines>
      );
    case "payroll": {
      const hours = hoursAt(view.cursor);
      const bars = (
        <ol className="wf-bars" aria-label={`Approved hours this week: ${hours.crew} for the crew${hours.dayHire ? `, ${hours.dayHire} on day hire` : ""}`}>
          {DAYS.map((label, index) => (
            <li
              key={label}
              data-in={hours.days[index] ? "" : undefined}
              style={
                {
                  "--crew": CREW_HOURS[index] / 63,
                  "--hire": DAY_HIRE_HOURS[index] / 63,
                } as CSSProperties
              }
            >
              <span className="wf-bar" aria-hidden="true">
                {DAY_HIRE_HOURS[index] ? <span className="wf-bar-hire" /> : null}
                <span className="wf-bar-crew" />
              </span>
              <span className="wf-bar-day" aria-hidden="true">
                {label[0]}
              </span>
            </li>
          ))}
        </ol>
      );
      let lines: ReactNode;
      if (state === "done")
        lines = (
          <Lines swap="paid">
            <Strong>Sent to Xero</Strong>
            <Quiet>Agency invoice: 21 h matched</Quiet>
          </Lines>
        );
      else if (state === "waiting")
        lines = (
          <Lines swap="signoff">
            <Strong>The office signs off</Strong>
            <Quiet>Nothing paid automatically</Quiet>
          </Lines>
        );
      else if (state === "active")
        lines = (
          <Lines swap="ready">
            <Strong>{hours.crew} h approved</Strong>
            <Quiet>Pay run ready</Quiet>
          </Lines>
        );
      else if (hours.crew === 0)
        lines = (
          <Lines swap="new">
            <Strong>A new pay week</Strong>
            <Quiet>Hours add up as they’re approved</Quiet>
          </Lines>
        );
      else
        lines = (
          <Lines swap="collecting">
            <Strong>{hours.crew} h this week</Strong>
            <Quiet>{hours.dayHire ? `+ ${hours.dayHire} h day hire` : "Pay run on Friday"}</Quiet>
          </Lines>
        );
      return (
        <div className="wf-pay">
          {lines}
          {bars}
        </div>
      );
    }
  }
}

function statusLabel(id: NodeId, state: NodeState, collecting: boolean) {
  if (state === "idle") return id === "payroll" && collecting ? "Collecting" : id === "hire" ? "Standby" : "Idle";
  if (state === "active") return "Active";
  if (state === "waiting")
    return (
      {
        approval: "Reviewing",
        hire: "Checking",
        payroll: "Sign-off",
        scheduling: "Needs cover",
      }[id as string] ?? "Waiting"
    );
  return { approval: "Approved", payroll: "Exported", hire: "Rostered" }[id as string] ?? "Done";
}

interface CardProps {
  node: GraphNode;
  state: NodeState;
  status: string;
  selected: boolean;
  dimmed: boolean;
  timer: number | null;
  phase: number;
  panelId: string;
  register: (id: NodeId, element: HTMLElement | null) => void;
  onSelect: (id: NodeId) => void;
  onEmphasis: (id: NodeId | null) => void;
  children: ReactNode;
}

function Card({ node, state, status, selected, dimmed, timer, phase, panelId, register, onSelect, onEmphasis, children }: CardProps) {
  const NodeIcon = ICONS[node.id];
  return (
    <article
      ref={(element) => register(node.id, element)}
      className="wf-node"
      // States show in the card's hairline, which the site's editorial layer would otherwise clear.
      data-keep-border=""
      data-node={node.id}
      data-state={state}
      data-wide={node.lane === "daily" ? undefined : ""}
      data-selected={selected ? "" : undefined}
      data-dim={dimmed ? "" : undefined}
      style={
        {
          "--wf-delay": `${ENTRANCE[node.id]}ms`,
          "--wf-hold": `${timer ?? 0}ms`,
        } as CSSProperties
      }
      onClick={() => onSelect(node.id)}
      onPointerEnter={() => onEmphasis(node.id)}
      onPointerLeave={() => onEmphasis(null)}
    >
      <div className="wf-node-head">
        <span className="wf-icon" aria-hidden="true">
          <NodeIcon size={16} weight="duotone" />
        </span>
        <span className="wf-meta" aria-hidden="true">
          <span className="wf-num">{node.number ?? <Lightning size={11} weight="fill" />}</span>
          <span className="wf-who">{node.who}</span>
        </span>
        <span className="wf-status" data-state={state} aria-hidden="true">
          <span className="wf-status-mark" />
          {status}
        </span>
      </div>
      <h4 className="wf-node-title">
        <button
          type="button"
          className="wf-title"
          aria-pressed={selected}
          aria-controls={panelId}
          onClick={(event) => {
            event.stopPropagation();
            onSelect(node.id);
          }}
          onFocus={() => onEmphasis(node.id)}
          onBlur={() => onEmphasis(null)}
        >
          {node.number ? <span className="sr-only">{node.number} </span> : null}
          {node.short}
          <span className="sr-only">, {status.toLowerCase()}. Show details</span>
        </button>
      </h4>
      <div className="wf-node-main">
        <div className="wf-node-body">{children}</div>
        <div className="wf-apps" data-lit={state === "idle" ? undefined : ""}>
          {node.apps.map((id, index) => {
            const app = APPS[id];
            return (
              <span
                key={id}
                className="wf-app"
                data-tile={"tile" in app && app.tile ? "" : undefined}
                data-name={app.name}
                style={{ "--i": index } as CSSProperties}
              >
                <Image src={app.src} alt={app.name} width={40} height={40} unoptimized />
              </span>
            );
          })}
        </div>
      </div>
      {/* Phones: the description opens in the card itself. */}
      {selected ? <p className="wf-inline-detail">{node.detail}</p> : null}
      {/* A thin timer while the stage works: restarts with every phase. */}
      {timer ? <span key={phase} className="wf-timer" aria-hidden="true" /> : null}
    </article>
  );
}

export function ConstructionWorkflow() {
  const root = useRef<HTMLDivElement>(null);
  const layout = useRef<HTMLDivElement>(null);
  const cards = useRef(new Map<NodeId, HTMLElement>());
  const signals = useRef(new Map<string, SVGPathElement>());
  const panelId = useId();
  const laneId = useId();
  const player = useWorkflow(root, signals);
  const geometry = useGeometry(layout, cards);
  const [selected, setSelected] = useState<NodeId | null>(null);
  const [emphasis, setEmphasis] = useState<NodeId | null>(null);

  const register = useCallback((id: NodeId, element: HTMLElement | null) => {
    if (element) cards.current.set(id, element);
    else cards.current.delete(id);
  }, []);
  const registerSignal = useCallback((key: string, element: SVGPathElement | null) => {
    if (element) signals.current.set(key, element);
    else signals.current.delete(key);
  }, []);
  const select = useCallback((id: NodeId) => setSelected((current) => (current === id ? null : id)), []);

  const { mode, cursor } = player;
  const states = statesAt(cursor);
  const edges = edgeStatesAt(cursor);
  const phase = cursor >= 0 ? PHASES[cursor] : null;
  const day = phase?.day ?? 0;
  const after = useCallback((id: string) => cursor >= phaseIndex(id), [cursor]);
  const collecting = hoursAt(cursor).crew > 0;
  const near = useMemo(() => (emphasis ? related(emphasis) : null), [emphasis]);

  const shown = NODES.find((entry) => entry.id === (selected ?? phase?.focus ?? "approval"))!;
  const caption =
    mode === "static"
      ? "One week: every working day runs round the same cycle, day hire fills a gap, and the pay run closes the week."
      : (phase?.caption ?? "The week starts as it comes into view.");

  const gate = geometry?.edges["approval-crew"];
  const gateAt = gate ? { x: (gate.start.x + gate.end.x) / 2, y: (gate.start.y + gate.end.y) / 2 } : null;

  return (
    <div ref={root} className="wf" data-mode={mode} data-running={player.running ? "" : undefined}>
      {/* The week, where it's up to, and the control */}
      <div className="wf-top">
        <div className="min-w-0">
          <p className={cn(mono, "text-[hsl(var(--color-accent))]")}>Demo week · fictional data</p>
          <p className="wf-scenario">{SCENARIO}</p>
        </div>
        {mode === "autoplay" && player.started ? (
          <button type="button" className="wf-control" onClick={player.togglePause} aria-label={player.paused ? "Play the demo" : "Pause the demo"}>
            {player.paused ? <Play size={12} weight="fill" aria-hidden="true" /> : <Pause size={12} weight="fill" aria-hidden="true" />}
            <span aria-hidden="true">{player.paused ? "Play" : "Pause"}</span>
          </button>
        ) : null}
      </div>

      <div className="wf-week">
        <ol className="wf-days" aria-label="Days of the demo week">
          {DAYS.map((label, index) => {
            const state = mode === "static" || index < day || (index === day && cursor === LAST) ? "done" : index === day && cursor >= 0 ? "current" : "next";
            return (
              <li key={label} data-state={state}>
                {label}
                {state === "current" ? <span className="sr-only"> (today in the demo)</span> : null}
              </li>
            );
          })}
        </ol>
        <p className="wf-caption">
          <span key={caption} className="wf-caption-text">
            {caption}
          </span>
        </p>
      </div>

      {/* The graph */}
      <div className="wf-canvas" data-reveal={player.reveal}>
        <div className="wf-grid" aria-hidden="true" />
        <div ref={layout} className="wf-layout">
          {geometry ? (
            <svg className="wf-edges" width={geometry.width} height={geometry.height} viewBox={`0 0 ${geometry.width} ${geometry.height}`} aria-hidden="true">
              {EDGES.map((edge) => {
                const path = geometry.edges[edge.id];
                if (!path) return null;
                const quiet = near && !(near.has(edge.from) && near.has(edge.to));
                return (
                  <g
                    key={edge.id}
                    className="wf-edge-group"
                    data-kind={edge.kind}
                    data-state={edges[edge.id]}
                    data-quiet={quiet ? "" : undefined}
                    data-tone={edge.from === "hire" || edge.to === "hire" ? "warning" : undefined}
                    style={
                      {
                        "--wf-delay": `${Math.max(ENTRANCE[edge.from], ENTRANCE[edge.to]) + 300}ms`,
                      } as CSSProperties
                    }
                  >
                    <path className="wf-track" d={path.d} />
                    <path className="wf-edge" d={path.d} pathLength={100} />
                    <path className="wf-signal-halo" d={path.d} ref={(element) => registerSignal(`${edge.id}:halo`, element)} />
                    <path className="wf-signal" d={path.d} ref={(element) => registerSignal(`${edge.id}:core`, element)} />
                    {edge.kind !== "loop" ? <circle className="wf-port" cx={path.end.x} cy={path.end.y} r={3} /> : null}
                  </g>
                );
              })}
              {/* The gate: nothing reaches the crew until a person approves. */}
              {gateAt ? (
                <g
                  className="wf-gate"
                  data-state={states.approval}
                  style={{ "--wf-delay": "600ms" } as CSSProperties}
                  transform={`translate(${gateAt.x} ${gateAt.y})`}
                >
                  <circle r={9} />
                  {states.approval === "done" ? <path d="M-3.4 0.2 L-1 2.6 L3.5 -2.4" /> : <path d="M-1.9 -3.1 V3.1 M1.9 -3.1 V3.1" />}
                </g>
              ) : null}
            </svg>
          ) : null}
          {geometry?.loop ? (
            <span className="wf-loop" data-state={edges["next-day"]} style={{ left: geometry.loop.x, top: geometry.loop.y }} aria-hidden="true">
              <ArrowsClockwise size={12} weight="bold" />
              Next working day
            </span>
          ) : null}

          {LANES.map((lane) => {
            const LaneIcon = LANE_ICONS[lane.id];
            return (
              <section key={lane.id} className="wf-lane" data-lane={lane.id} aria-labelledby={`${laneId}-${lane.id}`}>
                <header className="wf-lane-head">
                  <LaneIcon size={14} weight="bold" aria-hidden="true" />
                  <h3 id={`${laneId}-${lane.id}`} className="wf-lane-label">
                    {lane.label}
                  </h3>
                  <span className="wf-lane-note">{lane.note}</span>
                </header>
                {NODES.filter((entry) => entry.lane === lane.id).map((entry) => {
                  const state = states[entry.id];
                  const focus = mode === "autoplay" && phase?.focus === entry.id && WORKING.has(state);
                  return (
                    <Card
                      key={entry.id}
                      node={entry}
                      state={state}
                      status={statusLabel(entry.id, state, collecting)}
                      selected={selected === entry.id}
                      dimmed={Boolean(near && !near.has(entry.id)) && !WORKING.has(state)}
                      timer={focus ? phase!.hold : null}
                      phase={cursor}
                      panelId={panelId}
                      register={register}
                      onSelect={select}
                      onEmphasis={setEmphasis}
                    >
                      <Body id={entry.id} view={{ cursor, day, state, after }} />
                    </Card>
                  );
                })}
                {lane.id === "daily" ? (
                  <p className="wf-loop-note">
                    <ArrowsClockwise size={12} weight="bold" aria-hidden="true" />
                    Round again the next working day
                  </p>
                ) : null}
              </section>
            );
          })}
        </div>
      </div>

      {/* What the selected stage does (phones open it in the card), and what the demo is */}
      <div className="wf-info">
        <section id={panelId} aria-label="Stage details" className="wf-detail">
          <p className={cn(mono, "text-[hsl(var(--color-accent))]")}>
            {shown.number ? `${shown.number} · ` : ""}
            {shown.category}
          </p>
          <p className="wf-detail-text">
            <strong>{shown.title}.</strong> {shown.detail}
          </p>
        </section>
        <p className="wf-note">
          {selected ? "Select the stage again to follow the demo. " : "Select a stage for its details. "}
          The names, times and figures are fictional, and the demo sends nothing. Built to connect with tools you already use, where they offer an API. Logos
          are trademarks of their owners.
        </p>
      </div>
    </div>
  );
}
