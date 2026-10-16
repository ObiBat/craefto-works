// The hero's preview (../flow-preview.tsx): scattered to connected. On the
// left, the tools a subcontractor juggles today, each on its own tangled line;
// in the middle, one system; on the right, one clean line out through a
// person's approval to the crew and the pay run. Signals arrive at odd times
// and leave in step. Played by use-flow.ts; the full flow is in section 03.

import type { AppId } from "./apps";
import type { Hop, Mark, Pulse, Timeline } from "./model";

export const VIEW = { width: 440, height: 330 };

export const HUB = { x: 214, y: 166, r: 30 };
export const GATE = { x: 300, y: 166, r: 15 };
export const OUTPUTS = {
  crew: { x: 390, y: 96, r: 21, label: "Crew", app: "whatsapp" as AppId },
  payroll: { x: 390, y: 236, r: 21, label: "Payroll", app: "xero" as AppId },
};

/** Today's tools, scattered, each with its own way in. */
export const INPUTS: { app: AppId; x: number; y: number; d: string }[] = [
  { app: "procore", x: 48, y: 58, d: "M48 58 C118 18 150 150 214 166" },
  { app: "sheets", x: 102, y: 100, d: "M102 100 C150 154 158 116 214 166" },
  { app: "whatsapp", x: 42, y: 144, d: "M42 144 C110 206 150 118 214 166" },
  { app: "gmail", x: 98, y: 188, d: "M98 188 C140 140 162 214 214 166" },
  { app: "excel", x: 46, y: 232, d: "M46 232 C108 180 152 236 214 166" },
  { app: "calendar", x: 104, y: 272, d: "M104 272 C164 268 146 196 214 166" },
];

export const OUT = {
  gate: `M${HUB.x} ${HUB.y} L${GATE.x} ${GATE.y}`,
  crew: `M${GATE.x} ${GATE.y} C${GATE.x + 42} ${GATE.y} ${OUTPUTS.crew.x - 46} ${OUTPUTS.crew.y} ${OUTPUTS.crew.x} ${OUTPUTS.crew.y}`,
  payroll: `M${GATE.x} ${GATE.y} C${GATE.x + 42} ${GATE.y} ${OUTPUTS.payroll.x - 46} ${OUTPUTS.payroll.y} ${OUTPUTS.payroll.x} ${OUTPUTS.payroll.y}`,
};

export const inputId = (app: AppId) => `in:${app}`;

function loop(): Timeline {
  const hops: Hop[] = [];
  const pulses: Pulse[] = [];
  const marks: Mark[] = [];
  // In, at odd times and speeds: the scattered part.
  const starts = [0, 260, 520, 780, 1000, 1240];
  const durations = [1300, 1150, 1420, 1180, 1360, 1240];
  INPUTS.forEach((input, index) => {
    hops.push({ id: inputId(input.app), start: starts[index], duration: durations[index] });
    pulses.push({ node: inputId(input.app), start: starts[index], duration: 240 });
  });
  const arrived = Math.max(...starts.map((start, index) => start + durations[index]));
  pulses.push({ node: "hub", start: 1150, duration: arrived - 1150 + 200 });
  // Out, in step: one line, a person approves, then the crew and the pay run.
  let t = arrived + 120;
  hops.push({ id: "gate", start: t, duration: 760 });
  t += 760;
  pulses.push({ node: "approve", start: t, duration: 860, kind: "wait" });
  marks.push({ kind: "approved", at: t + 760 });
  t += 860;
  hops.push({ id: "crew", start: t, duration: 980 });
  hops.push({ id: "payroll", start: t + 180, duration: 980 });
  pulses.push({ node: "crew", start: t + 980, duration: 520 });
  pulses.push({ node: "payroll", start: t + 1160, duration: 520 });
  marks.push({ kind: "sent", at: t + 980 });
  marks.push({ kind: "paid", at: t + 1160 });
  return { hops, pulses, marks, loop: t + 1160 + 1300 };
}

export const HERO = loop();
