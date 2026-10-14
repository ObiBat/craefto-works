// The workflow graph on /solutions/construction: what it shows and in what
// order, kept apart from how it's drawn (graph.tsx) and played
// (use-workflow.ts). Operations run in cycles, not in a line: jobs, rosters,
// crews and hours turn over every working day, extra hands are hired when the
// crew is short, and pay runs weekly or fortnightly. The demo plays one week
// on a loop. Stage names and descriptions come from content/construction.ts;
// every name, figure and time below is fictional, and nothing here sends a
// message or touches real records.

import { construction } from "@/content/construction";
import type { AppId } from "./apps";

export type NodeId = "jobs" | "scheduling" | "approval" | "crew" | "timesheets" | "hire" | "payroll";
export type NodeState = "idle" | "active" | "waiting" | "done";
export type LaneId = "daily" | "demand" | "pay";
export type EdgeId =
  | "jobs-scheduling"
  | "scheduling-approval"
  | "approval-crew"
  | "crew-timesheets"
  | "next-day"
  | "scheduling-hire"
  | "hire-scheduling"
  | "timesheets-payroll";

export interface GraphNode {
  id: NodeId;
  /** "01" to "06" for the six stages; day hire is on demand, outside the sequence. */
  number: string | null;
  /** The card's title in the graph. */
  short: string;
  /** The full name, for the details. */
  title: string;
  category: string;
  /** Who acts at this stage. */
  who: string;
  /** What the stage does, for the details. */
  detail: string;
  lane: LaneId;
  /** Software the stage could exchange data with, where it offers an API. */
  apps: AppId[];
}

export interface Lane {
  id: LaneId;
  label: string;
  note: string;
}

export const LANES: Lane[] = [
  { id: "daily", label: "Every working day", note: "Jobs, rosters, crews and hours, approved by a person" },
  { id: "demand", label: "When the crew is short", note: "Extra hands for the day" },
  { id: "pay", label: "Weekly or fortnightly", note: "The pay run" },
];

const stage = (id: NodeId) => {
  const entry = construction.workflow.find((step) => step.id === id);
  if (!entry) throw new Error(`No workflow stage "${id}" in content/construction.ts`);
  return entry;
};

const fromContent = (id: NodeId, short: string, lane: LaneId, apps: AppId[]): GraphNode => {
  const entry = stage(id);
  const number = String(construction.workflow.indexOf(entry) + 1).padStart(2, "0");
  return { id, number, short, title: entry.title, category: entry.category, who: entry.who, detail: entry.text, lane, apps };
};

/** In reading order, lane by lane: the order of the phone layout and of the page's text. */
export const NODES: GraphNode[] = [
  fromContent("jobs", "Jobs and sites", "daily", ["procore", "drive", "excel", "sheets"]),
  fromContent("scheduling", "Scheduling", "daily", ["assignar", "deputy", "calendar", "outlook"]),
  fromContent("approval", "Supervisor approval", "daily", ["teams", "slack", "gmail"]),
  fromContent("crew", "Crew and attendance", "daily", ["whatsapp", "twilio", "maps", "hammertech"]),
  fromContent("timesheets", "Timesheets and costing", "daily", ["powerbi", "procore", "excel"]),
  {
    id: "hire",
    number: null,
    short: "Day hire",
    title: "Day hire",
    category: "On demand",
    who: "Office",
    detail:
      "When a job needs more hands than the crew has, the shift goes to your casual pool on WhatsApp, your Facebook page and your labour-hire agencies. Facebook doesn’t let apps post in groups, so a person shares those posts. A person checks tickets and site induction before anyone is rostered.",
    lane: "demand",
    apps: ["facebook", "whatsapp", "gmail", "hammertech"],
  },
  fromContent("payroll", "Payroll and accounts", "pay", ["xero", "myob", "quickbooks", "employmenthero", "reckon"]),
];

export const node = (id: NodeId) => NODES.find((entry) => entry.id === id)!;

export interface GraphEdge {
  id: EdgeId;
  from: NodeId;
  to: NodeId;
  /** How it's drawn: side to side, over the top back to the start, or straight down or up between lanes. */
  kind: "across" | "loop" | "down" | "up";
}

export const EDGES: GraphEdge[] = [
  { id: "jobs-scheduling", from: "jobs", to: "scheduling", kind: "across" },
  { id: "scheduling-approval", from: "scheduling", to: "approval", kind: "across" },
  { id: "approval-crew", from: "approval", to: "crew", kind: "across" },
  { id: "crew-timesheets", from: "crew", to: "timesheets", kind: "across" },
  { id: "next-day", from: "timesheets", to: "jobs", kind: "loop" },
  { id: "scheduling-hire", from: "scheduling", to: "hire", kind: "down" },
  { id: "hire-scheduling", from: "hire", to: "scheduling", kind: "up" },
  { id: "timesheets-payroll", from: "timesheets", to: "payroll", kind: "down" },
];

/** The stages connected to one in focus. */
export function related(id: NodeId): Set<NodeId> {
  const ids = new Set<NodeId>([id]);
  for (const edge of EDGES) {
    if (edge.kind === "loop") continue;
    if (edge.from === id) ids.add(edge.to);
    if (edge.to === id) ids.add(edge.from);
  }
  return ids;
}

// ── The week ───────────────────────────────────────────────────────────────

export const SCENARIO = "A week on Site A: a sick day, a pour brought forward and a pay run.";
export const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri"] as const;
/** Approved hours each day: six fixers for seven hours, and on Thursday three day-hire fixers as well. */
export const CREW_HOURS = [42, 42, 42, 42, 42];
export const DAY_HIRE_HOURS = [0, 0, 0, 21, 0];

export interface Phase {
  id: string;
  /** 0 is Monday. */
  day: number;
  caption: string;
  /** The stage acting, for the details. */
  focus: NodeId;
  /** States that change on entering. */
  set: Partial<Record<NodeId, NodeState>>;
  /** Connectors a signal travels along on entering, one after another. */
  signals?: EdgeId[];
  /** How long it holds, in ms, before the next phase. */
  hold: number;
}

/** A new day: the daily stages start over, the other lanes keep what they hold. */
const MORNING: Partial<Record<NodeId, NodeState>> = { jobs: "active", scheduling: "idle", approval: "idle", crew: "idle", timesheets: "idle" };

/** A routine day runs through on its own: rostered, approved, on site, hours approved. */
function routine(day: number, caption: string, extra: Partial<Record<NodeId, NodeState>> = {}): Phase[] {
  const name = DAYS[day].toLowerCase();
  return [
    { id: `${name}-jobs`, day, caption, focus: "jobs", set: { ...MORNING, ...extra }, signals: ["jobs-scheduling"], hold: 600 },
    { id: `${name}-roster`, day, caption, focus: "scheduling", set: { jobs: "done", scheduling: "active" }, signals: ["scheduling-approval"], hold: 600 },
    { id: `${name}-approve`, day, caption, focus: "approval", set: { scheduling: "done", approval: "done" }, signals: ["approval-crew"], hold: 650 },
    { id: `${name}-crew`, day, caption, focus: "crew", set: { crew: "active" }, signals: ["crew-timesheets"], hold: 650 },
    { id: `${name}-hours`, day, caption, focus: "timesheets", set: { crew: "done", timesheets: "active" }, signals: ["timesheets-payroll"], hold: 900 },
    { id: `${name}-next`, day, caption, focus: "timesheets", set: { timesheets: "done" }, signals: ["next-day"], hold: 750 },
  ];
}

export const PHASES: Phase[] = [
  ...routine(0, "Mon · A routine day. Six fixers are rostered, approved and on site, and their hours are costed to the job.", { hire: "idle", payroll: "idle" }),

  { id: "tue-jobs", day: 1, caption: "Tue · Before the shift, two fixers call in sick.", focus: "jobs", set: MORNING, signals: ["jobs-scheduling"], hold: 900 },
  { id: "tue-gap", day: 1, caption: "Tue · The schedule spots the gap, and AI suggests moving two fixers from Site B.", focus: "scheduling", set: { jobs: "done", scheduling: "waiting" }, hold: 1800 },
  { id: "tue-review", day: 1, caption: "Tue · A supervisor reviews the suggestion. Nothing changes until they approve it.", focus: "approval", set: { scheduling: "done", approval: "waiting" }, signals: ["scheduling-approval"], hold: 1800 },
  { id: "tue-approved", day: 1, caption: "Tue · Approved. The two fixers get their new site and start time.", focus: "approval", set: { approval: "done" }, signals: ["approval-crew"], hold: 900 },
  { id: "tue-crew", day: 1, caption: "Tue · Approved. The two fixers get their new site and start time.", focus: "crew", set: { crew: "active" }, signals: ["crew-timesheets"], hold: 800 },
  { id: "tue-hours", day: 1, caption: "Tue · Six fixers on site; 42 hours approved and costed.", focus: "timesheets", set: { crew: "done", timesheets: "active" }, signals: ["timesheets-payroll"], hold: 900 },
  { id: "tue-next", day: 1, caption: "Tue · Six fixers on site; 42 hours approved and costed.", focus: "timesheets", set: { timesheets: "done" }, signals: ["next-day"], hold: 750 },

  ...routine(2, "Wed · Another routine day, with nothing for anyone to chase."),

  { id: "thu-jobs", day: 3, caption: "Thu · The pour is brought forward: Site A needs nine fixers today, three more than the crew.", focus: "jobs", set: MORNING, hold: 1500 },
  { id: "thu-short", day: 3, caption: "Thu · Six on the roster, three short. AI suggests hiring three for the day.", focus: "scheduling", set: { jobs: "done", scheduling: "waiting" }, signals: ["jobs-scheduling"], hold: 1500 },
  { id: "thu-post", day: 3, caption: "Thu · The shift goes to the casual pool on WhatsApp, the Facebook page and the labour-hire agencies.", focus: "hire", set: { hire: "active" }, signals: ["scheduling-hire"], hold: 1800 },
  { id: "thu-check", day: 3, caption: "Thu · Three fixers confirm. The office checks their tickets and site induction.", focus: "hire", set: { hire: "waiting" }, hold: 1800 },
  { id: "thu-rostered", day: 3, caption: "Thu · Three day-hire fixers join the roster: nine of nine.", focus: "scheduling", set: { hire: "done", scheduling: "active" }, signals: ["hire-scheduling"], hold: 1200 },
  { id: "thu-review", day: 3, caption: "Thu · The supervisor approves the roster for the pour.", focus: "approval", set: { scheduling: "done", approval: "waiting" }, signals: ["scheduling-approval"], hold: 1400 },
  { id: "thu-approved", day: 3, caption: "Thu · The supervisor approves the roster for the pour.", focus: "approval", set: { approval: "done" }, signals: ["approval-crew"], hold: 800 },
  { id: "thu-crew", day: 3, caption: "Thu · Nine fixers on site.", focus: "crew", set: { crew: "active" }, signals: ["crew-timesheets"], hold: 900 },
  { id: "thu-hours", day: 3, caption: "Thu · 63 hours approved. The 21 day-hire hours are kept apart for the agency’s invoice.", focus: "timesheets", set: { crew: "done", timesheets: "active" }, signals: ["timesheets-payroll"], hold: 1300 },
  { id: "thu-next", day: 3, caption: "Thu · 63 hours approved. The 21 day-hire hours are kept apart for the agency’s invoice.", focus: "timesheets", set: { timesheets: "done" }, signals: ["next-day"], hold: 750 },

  ...routine(4, "Fri · A routine day, and the end of the pay week.").slice(0, 5),
  { id: "fri-pay", day: 4, caption: "Fri · The week closes with 210 hours approved for the pay run.", focus: "payroll", set: { timesheets: "done", payroll: "active" }, hold: 1400 },
  { id: "fri-signoff", day: 4, caption: "Fri · The office checks the pay run and signs it off. Nothing is paid automatically.", focus: "payroll", set: { payroll: "waiting" }, hold: 1800 },
  { id: "fri-paid", day: 4, caption: "Fri · The pay run goes to Xero, and the agency’s invoice is matched to the 21 day-hire hours. Then a new week.", focus: "payroll", set: { payroll: "done" }, hold: 2800 },
];

export const phaseIndex = (id: string) => {
  const index = PHASES.findIndex((phase) => phase.id === id);
  if (index < 0) throw new Error(`No phase "${id}"`);
  return index;
};
export const LAST = PHASES.length - 1;

const IDLE = Object.fromEntries(NODES.map((entry) => [entry.id, "idle"])) as Record<NodeId, NodeState>;

/** Every stage's state after each phase, worked out once: SNAPSHOTS[i] is the graph after phase i. */
const SNAPSHOTS: Record<NodeId, NodeState>[] = PHASES.reduce<Record<NodeId, NodeState>[]>((all, phase) => {
  all.push({ ...(all.at(-1) ?? IDLE), ...phase.set });
  return all;
}, []);

/** The graph at a cursor: -1 is before the week starts. */
export const statesAt = (cursor: number) => (cursor < 0 ? IDLE : SNAPSHOTS[Math.min(cursor, LAST)]);

export type EdgeState = "idle" | "active" | "done";

/** Connectors light up as data moves along them: for the day, or for the week between lanes. */
const EDGE_STATES: Record<EdgeId, EdgeState>[] = (() => {
  const weekly = new Set<EdgeId>(["scheduling-hire", "hire-scheduling"]);
  const last: Partial<Record<EdgeId, number>> = {};
  return PHASES.map((phase, index) => {
    if (index > 0 && PHASES[index - 1].day !== phase.day) {
      for (const id of Object.keys(last) as EdgeId[]) if (!weekly.has(id)) delete last[id];
    }
    for (const id of phase.signals ?? []) last[id] = index;
    return Object.fromEntries(
      EDGES.map(({ id }) => {
        const at = last[id];
        const state: EdgeState = at === index ? "active" : at === undefined || id === "next-day" ? "idle" : "done";
        return [id, state];
      }),
    ) as Record<EdgeId, EdgeState>;
  });
})();

const NO_EDGES = Object.fromEntries(EDGES.map(({ id }) => [id, "idle"])) as Record<EdgeId, EdgeState>;

export const edgeStatesAt = (cursor: number) => (cursor < 0 ? NO_EDGES : EDGE_STATES[Math.min(cursor, LAST)]);

/** Approved hours in the pay week so far, for the crew and for day hire, and which days are in. */
export function hoursAt(cursor: number) {
  let crew = 0;
  let dayHire = 0;
  const days = DAYS.map((day, index) => {
    const counted = cursor >= phaseIndex(`${day.toLowerCase()}-hours`);
    if (counted) {
      crew += CREW_HOURS[index];
      dayHire += DAY_HIRE_HOURS[index];
    }
    return counted;
  });
  return { crew, dayHire, days };
}

// ── Timing ─────────────────────────────────────────────────────────────────

export const MOTION = {
  /** The graph's entrance, from the grid to the last connector. */
  reveal: 1400,
  /** How long a signal takes along a connector between neighbours. */
  signal: 750,
  /** How long it takes over the top, back to the start of the next day. */
  loop: 1100,
  /** The gap between signals that leave in the same phase. */
  stagger: 420,
  /** The site's slow-in, slow-out curve (--ease-soft). */
  ease: "cubic-bezier(0.65, 0, 0.35, 1)",
};
