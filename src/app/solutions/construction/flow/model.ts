// The information-flow diagram on /solutions/construction (section 03): what
// it shows, where everything sits, and when each signal moves. Drawn by
// flow-graph.tsx and played by use-flow.ts.
//
// The idea in one picture: every working day goes round a ring (jobs,
// schedule, a person approves, crew, hours); extra hands are hired off the
// ring when the crew is short; approved hours roll into a pay run each week
// or fortnight; and every stage swaps data with tools the business already
// uses. One signal travels round the ring, slowly, a day per lap.

import { construction } from "@/content/construction";
import type { AppId } from "./apps";

export type NodeId = "jobs" | "schedule" | "approve" | "crew" | "hours" | "hire" | "payroll";
export type EdgeId = "jobs-schedule" | "schedule-approve" | "approve-crew" | "crew-hours" | "hours-jobs" | "schedule-hire" | "hours-payroll";

export interface FlowNode {
  id: NodeId;
  /** Its name in the diagram: a word or two. */
  label: string;
  /** A rhythm, for the stages off the ring. */
  tag?: string;
  /** The full name and what it does, on hover or focus. */
  title: string;
  detail: string;
  apps: AppId[];
  /** Whether its software sends data in (the job list) or receives it. */
  flow: "in" | "out";
}

const stage = (id: string) => construction.workflow.find((step) => step.id === id)!;

export const NODES: FlowNode[] = [
  { id: "jobs", label: "Jobs", title: stage("jobs").title, detail: stage("jobs").text, apps: ["procore", "sheets", "outlook"], flow: "in" },
  { id: "schedule", label: "Schedule", title: stage("scheduling").title, detail: stage("scheduling").text, apps: ["assignar", "deputy", "calendar"], flow: "out" },
  { id: "approve", label: "Approve", title: stage("approval").title, detail: stage("approval").text, apps: ["whatsapp", "telegram", "gmail"], flow: "out" },
  { id: "crew", label: "Crew", title: stage("crew").title, detail: stage("crew").text, apps: ["whatsapp", "twilio", "maps"], flow: "out" },
  { id: "hours", label: "Hours", title: stage("timesheets").title, detail: stage("timesheets").text, apps: ["dashpivot", "excel", "powerbi"], flow: "out" },
  {
    id: "hire",
    label: "Day hire",
    tag: "On demand",
    title: "Day hire",
    detail:
      "When a job needs more hands than the crew has, the shift goes to your casual pool on WhatsApp, your Facebook page and your labour-hire agencies, and replies on Messenger land in one list. Facebook doesn’t let apps post in groups, so a person shares those posts. A person checks tickets and induction before anyone is rostered.",
    apps: ["facebook", "messenger", "whatsapp"],
    flow: "out",
  },
  {
    id: "payroll",
    label: "Payroll",
    tag: "Weekly or fortnightly",
    title: stage("payroll").title,
    detail: stage("payroll").text,
    apps: ["xero", "myob", "employmenthero", "reckon"],
    flow: "out",
  },
];

export const node = (id: NodeId) => NODES.find((entry) => entry.id === id)!;

/** The daily ring, in order. */
export const RING = ["jobs", "schedule", "approve", "crew", "hours"] as const satisfies readonly NodeId[];
export const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri"];

// ── Layouts ────────────────────────────────────────────────────────────────

export interface Point {
  x: number;
  y: number;
}

export interface Placed extends Point {
  /** Where its name sits, and which way the text runs from there. */
  label: Point & { anchor: "start" | "middle" | "end" };
  /** Its software, one point per app. */
  apps: Point[];
}

export interface Layout {
  name: "wide" | "narrow";
  width: number;
  height: number;
  center: Point;
  radius: number;
  /** Node and app radii. */
  r: number;
  app: number;
  type: { label: number; tag: number; center: number };
  nodes: Record<NodeId, Placed>;
  edges: Record<EdgeId, string>;
}

const round = (value: number) => Math.round(value * 10) / 10;
const polar = (center: Point, radius: number, degrees: number): Point => ({
  x: round(center.x + radius * Math.cos((degrees * Math.PI) / 180)),
  y: round(center.y + radius * Math.sin((degrees * Math.PI) / 180)),
});
/** Apps fanned round a node at `distance`, at these angles. */
const fan = (at: Point, distance: number, angles: number[]) => angles.map((angle) => polar(at, distance, angle));

/** The ring's five stages, clockwise from the top. */
const RING_ANGLES: Record<(typeof RING)[number], number> = { jobs: -90, schedule: -18, approve: 54, crew: 126, hours: 198 };

function ringArcs(center: Point, radius: number, at: Record<NodeId, Point>) {
  const arc = (from: NodeId, to: NodeId) => `M${at[from].x} ${at[from].y} A${radius} ${radius} 0 0 1 ${at[to].x} ${at[to].y}`;
  return {
    "jobs-schedule": arc("jobs", "schedule"),
    "schedule-approve": arc("schedule", "approve"),
    "approve-crew": arc("approve", "crew"),
    "crew-hours": arc("crew", "hours"),
    "hours-jobs": arc("hours", "jobs"),
  };
}

function wide(): Layout {
  const center = { x: 500, y: 252 };
  const radius = 152;
  const ring = Object.fromEntries(RING.map((id) => [id, polar(center, radius, RING_ANGLES[id])])) as Record<(typeof RING)[number], Point>;
  const hire = { x: 856, y: ring.schedule.y };
  const payroll = { x: 144, y: ring.hours.y };
  const at = { ...ring, hire, payroll } as Record<NodeId, Point>;
  const spoke = 66;
  const nodes: Record<NodeId, Placed> = {
    jobs: { ...at.jobs, label: { x: at.jobs.x, y: at.jobs.y + 52, anchor: "middle" }, apps: fan(at.jobs, spoke, [-124, -90, -56]) },
    schedule: { ...at.schedule, label: { x: at.schedule.x - 46, y: at.schedule.y + 5, anchor: "end" }, apps: fan(at.schedule, spoke, [-92, -62, -32]) },
    approve: { ...at.approve, label: { x: at.approve.x - 8, y: at.approve.y - 46, anchor: "middle" }, apps: fan(at.approve, spoke, [24, 54, 84]) },
    crew: { ...at.crew, label: { x: at.crew.x + 8, y: at.crew.y - 46, anchor: "middle" }, apps: fan(at.crew, spoke, [96, 126, 156]) },
    hours: { ...at.hours, label: { x: at.hours.x + 46, y: at.hours.y + 5, anchor: "start" }, apps: fan(at.hours, spoke, [-86, -118, -150]) },
    hire: { ...at.hire, label: { x: at.hire.x, y: at.hire.y + 56, anchor: "middle" }, apps: fan(at.hire, spoke, [-76, -41, -6]) },
    payroll: { ...at.payroll, label: { x: at.payroll.x, y: at.payroll.y + 60, anchor: "middle" }, apps: fan(at.payroll, spoke + 4, [181, 211, 241, 271]) },
  };
  return {
    name: "wide",
    width: 1000,
    height: 500,
    center,
    radius,
    r: 30,
    app: 14,
    type: { label: 15, tag: 10.5, center: 11 },
    nodes,
    edges: {
      ...ringArcs(center, radius, at),
      "schedule-hire": `M${at.schedule.x} ${at.schedule.y} C${at.schedule.x + 90} ${at.schedule.y - 26} ${hire.x - 90} ${hire.y - 26} ${hire.x} ${hire.y}`,
      "hours-payroll": `M${at.hours.x} ${at.hours.y} C${at.hours.x - 90} ${at.hours.y + 26} ${payroll.x + 90} ${payroll.y + 26} ${payroll.x} ${payroll.y}`,
    },
  };
}

function narrow(): Layout {
  const center = { x: 200, y: 318 };
  const radius = 108;
  const ring = Object.fromEntries(RING.map((id) => [id, polar(center, radius, RING_ANGLES[id])])) as Record<(typeof RING)[number], Point>;
  const hire = { x: 324, y: 116 };
  const payroll = { x: 78, y: 548 };
  const at = { ...ring, hire, payroll } as Record<NodeId, Point>;
  const spoke = 48;
  const nodes: Record<NodeId, Placed> = {
    jobs: { ...at.jobs, label: { x: at.jobs.x, y: at.jobs.y + 41, anchor: "middle" }, apps: fan(at.jobs, spoke, [-126, -90, -54]) },
    schedule: { ...at.schedule, label: { x: at.schedule.x - 34, y: at.schedule.y + 4, anchor: "end" }, apps: fan(at.schedule, spoke, [-12, 22]) },
    approve: { ...at.approve, label: { x: at.approve.x - 6, y: at.approve.y - 35, anchor: "middle" }, apps: fan(at.approve, spoke, [36, 72]) },
    crew: { ...at.crew, label: { x: at.crew.x + 6, y: at.crew.y - 35, anchor: "middle" }, apps: fan(at.crew, spoke, [108, 144]) },
    hours: { ...at.hours, label: { x: at.hours.x + 34, y: at.hours.y + 4, anchor: "start" }, apps: fan(at.hours, spoke, [-118, -152]) },
    hire: { ...at.hire, label: { x: at.hire.x, y: at.hire.y - 52, anchor: "middle" }, apps: fan(at.hire, spoke, [128, 162, 196]) },
    payroll: { ...at.payroll, label: { x: at.payroll.x, y: at.payroll.y + 50, anchor: "middle" }, apps: fan(at.payroll, spoke + 4, [-68, -36, -4, 28]) },
  };
  return {
    name: "narrow",
    width: 400,
    height: 620,
    center,
    radius,
    r: 23,
    app: 11.5,
    type: { label: 14.5, tag: 9.5, center: 10.5 },
    nodes,
    edges: {
      ...ringArcs(center, radius, at),
      "schedule-hire": `M${at.schedule.x} ${at.schedule.y} C${at.schedule.x + 52} ${at.schedule.y - 60} ${hire.x + 30} ${hire.y + 96} ${hire.x} ${hire.y}`,
      "hours-payroll": `M${at.hours.x} ${at.hours.y} C${at.hours.x - 64} ${at.hours.y + 70} ${payroll.x - 48} ${payroll.y - 120} ${payroll.x} ${payroll.y}`,
    },
  };
}

export const LAYOUTS = { wide: wide(), narrow: narrow() };

/** The line between a node and one of its apps: an id for its signal, and the path. */
export const spokeId = (id: NodeId, app: AppId) => `${id}:${app}`;
export function spokes(layout: Layout) {
  // A narrow layout places fewer apps round some stages: those it places.
  return NODES.flatMap((entry) =>
    entry.apps.slice(0, layout.nodes[entry.id].apps.length).map((app, index) => {
      const from = layout.nodes[entry.id];
      const to = layout.nodes[entry.id].apps[index];
      // Data comes in from the job list, and goes out to everything else.
      const [a, b] = entry.flow === "in" ? [to, from] : [from, to];
      return { id: spokeId(entry.id, app), node: entry.id, app, d: `M${a.x} ${a.y} L${b.x} ${b.y}` };
    }),
  );
}

// ── The week, in ms ────────────────────────────────────────────────────────

export interface Hop {
  /** An edge, or a spoke ("node:app"). */
  id: string;
  start: number;
  duration: number;
  /** Back along the same line. */
  reverse?: boolean;
  /** A quiet signal: each day's hours, adding up towards the pay run. */
  faint?: boolean;
}

export interface Pulse {
  /** A stage, or anything else drawn with data-node. */
  node: string;
  start: number;
  duration: number;
  /** Waiting on a person, thinking (AI), or hiring. */
  kind?: "wait" | "ai" | "hire";
}

export interface Mark {
  /** Which badge pops: "approved", "hired", "paid" and so on. */
  kind: string;
  at: number;
}

/** What a diagram plays: signals, stages lighting up and badges, on a loop of `loop` ms. */
export interface Timeline {
  hops: Hop[];
  pulses: Pulse[];
  marks: Mark[];
  loop: number;
  /** When each day starts, for the day letters. */
  days?: number[];
  /** When each day's hours are approved, and when the pay run is out, for the pay-week ring. */
  hours?: number[];
  paid?: number;
}

export const PACE = {
  /** Round the ring from one stage to the next. */
  hop: 1150,
  /** Out to day hire or payroll. */
  branch: 1000,
  /** Between a stage and its software. */
  spoke: 700,
  /** How long a stage holds the signal. */
  dwell: 480,
  /** A routine approval, and one that needs a closer look. */
  approve: 760,
  review: 1500,
  /** From the day's hours back to the next day's jobs. */
  next: 1300,
};

function week() {
  const hops: Hop[] = [];
  const pulses: Pulse[] = [];
  const marks: Mark[] = [];
  const days: number[] = [];
  const hours: number[] = [];
  const out = (id: NodeId, start: number) =>
    node(id).apps.forEach((app, index) => hops.push({ id: spokeId(id, app), start: start + index * 120, duration: PACE.spoke }));
  let t = 0;
  let paid = 0;
  for (let day = 0; day < DAYS.length; day += 1) {
    days.push(t);
    // The day's jobs come in from the job list and plans.
    out("jobs", t);
    t += PACE.spoke * 0.8;
    pulses.push({ node: "jobs", start: t, duration: PACE.dwell + 200 });
    t += PACE.dwell;
    hops.push({ id: "jobs-schedule", start: t, duration: PACE.hop });
    t += PACE.hop;
    // Tuesday: two off sick, and AI works out who could cover.
    const thinking = day === 1 ? 1300 : PACE.dwell;
    pulses.push({ node: "schedule", start: t, duration: thinking + 160, kind: day === 1 || day === 3 ? "ai" : undefined });
    out("schedule", t + 100);
    t += thinking;
    // Thursday: a pour brought forward, and three hired for the day.
    if (day === 3) {
      hops.push({ id: "schedule-hire", start: t, duration: PACE.branch });
      t += PACE.branch;
      pulses.push({ node: "hire", start: t, duration: 1700, kind: "hire" });
      out("hire", t + 120);
      marks.push({ kind: "hired", at: t + 1150 });
      t += 1700;
      hops.push({ id: "schedule-hire", start: t, duration: PACE.branch, reverse: true });
      t += PACE.branch;
      pulses.push({ node: "schedule", start: t, duration: PACE.dwell });
      t += PACE.dwell;
    }
    hops.push({ id: "schedule-approve", start: t, duration: PACE.hop });
    t += PACE.hop;
    // A person approves before anything reaches the crew.
    const review = day === 1 || day === 3 ? PACE.review : PACE.approve;
    pulses.push({ node: "approve", start: t, duration: review + 260, kind: "wait" });
    marks.push({ kind: "approved", at: t + review });
    out("approve", t + review);
    t += review + 140;
    hops.push({ id: "approve-crew", start: t, duration: PACE.hop });
    t += PACE.hop;
    pulses.push({ node: "crew", start: t, duration: PACE.dwell + 260 });
    out("crew", t + 80);
    t += PACE.dwell + 180;
    hops.push({ id: "crew-hours", start: t, duration: PACE.hop });
    t += PACE.hop;
    pulses.push({ node: "hours", start: t, duration: PACE.dwell + 260 });
    out("hours", t + 80);
    // The day's approved hours add up towards the pay run; on Friday, it runs.
    hours.push(t + PACE.branch * 0.9);
    hops.push({ id: "hours-payroll", start: t + 120, duration: PACE.branch, faint: day < 4 });
    if (day === 4) {
      const arrive = t + 120 + PACE.branch;
      pulses.push({ node: "payroll", start: arrive, duration: 1900 });
      marks.push({ kind: "paid", at: arrive + 1100 });
      out("payroll", arrive + 1100);
      paid = arrive + 1900;
    }
    t += PACE.dwell;
    hops.push({ id: "hours-jobs", start: t, duration: PACE.next });
    t += PACE.next;
  }
  // The pay run settles before Monday comes round again.
  const loop = Math.max(t, paid + 900);
  return { hops, pulses, marks, days, hours, paid, loop };
}

export const WEEK: Timeline = week();
