"use client";

import type { Ref } from "react";
import {
  ArrowsClockwise,
  Buildings,
  CalendarDots,
  Check,
  DeviceMobileSpeaker,
  Receipt,
  Sparkle,
  Timer,
  UserCheck,
  UserPlus,
  type Icon,
} from "@phosphor-icons/react";
import { APPS } from "./apps";
import { DAYS, NODES, spokes, type EdgeId, type Layout, type NodeId } from "./model";

// The information-flow diagram itself: one SVG of the ring, its branches, the
// software round each stage, the signals and the names, for any layout. The
// section's diagram (flow-graph.tsx) and the hero's preview
// (../flow-preview.tsx) both draw it, and use-flow.ts plays it.

const ICONS: Record<NodeId, Icon> = {
  jobs: Buildings,
  schedule: CalendarDots,
  approve: UserCheck,
  crew: DeviceMobileSpeaker,
  hours: Timer,
  hire: UserPlus,
  payroll: Receipt,
};

const EDGES: EdgeId[] = ["jobs-schedule", "schedule-approve", "approve-crew", "crew-hours", "hours-jobs", "schedule-hire", "hours-payroll"];
const BRANCHES = new Set<EdgeId>(["schedule-hire", "hours-payroll"]);

/** A small chevron on each arc of the ring, pointing the way the day goes. */
function chevrons(layout: Layout) {
  const angles = [-90, -18, 54, 126, 198];
  return angles.map((angle) => {
    const middle = angle + 36;
    const radians = (middle * Math.PI) / 180;
    return {
      x: layout.center.x + layout.radius * Math.cos(radians),
      y: layout.center.y + layout.radius * Math.sin(radians),
      rotate: middle + 90,
    };
  });
}

export function Comet({ id, d, small, warm }: { id: string; d: string; small?: boolean; warm?: boolean }) {
  return (
    <g className="flow-comet" data-small={small ? "" : undefined} data-warm={warm ? "" : undefined}>
      <path className="flow-comet-halo" data-comet-halo={id} d={d} />
      <path className="flow-comet-core" data-comet-core={id} d={d} />
      <circle className="flow-comet-head" data-comet-head={id} r={small ? 2.6 : 4.2} />
    </g>
  );
}

interface DiagramProps {
  layout: Layout;
  /** Prefix for the SVG's ids (gradients, filters, clips), unique on the page. */
  uid: string;
  /** The stage being looked at, if any. */
  focus?: NodeId | null;
  svgRef: Ref<SVGSVGElement>;
}

export function FlowDiagram({ layout, uid, focus = null, svgRef }: DiagramProps) {
  const lines = spokes(layout);
  const { width, height, r } = layout;
  return (
    <svg ref={svgRef} className="flow-svg" viewBox={`0 0 ${width} ${height}`} aria-hidden="true" focusable="false">
      <defs>
        <radialGradient id={`${uid}-ring`}>
          <stop offset="0%" stopColor="hsl(var(--color-accent))" stopOpacity="0.1" />
          <stop offset="70%" stopColor="hsl(var(--color-accent))" stopOpacity="0.03" />
          <stop offset="100%" stopColor="hsl(var(--color-accent))" stopOpacity="0" />
        </radialGradient>
        <filter id={`${uid}-lift`} x="-50%" y="-50%" width="200%" height="200%">
          <feDropShadow dx="0" dy="6" stdDeviation="7" floodColor="hsl(30 12% 18%)" floodOpacity="0.16" />
        </filter>
        <clipPath id={`${uid}-app`}>
          <circle r={layout.app} />
        </clipPath>
      </defs>

      {/* A soft light inside the ring */}
      <circle className="flow-ring-light" cx={layout.center.x} cy={layout.center.y} r={layout.radius + 34} fill={`url(#${uid}-ring)`} />

      {/* Lines between the stages, and the way round */}
      {EDGES.map((id) => (
        <path key={id} className="flow-track" data-track={id} data-branch={BRANCHES.has(id) ? "" : undefined} d={layout.edges[id]} />
      ))}
      {chevrons(layout).map((chevron, index) => (
        <path
          key={index}
          className="flow-chevron"
          d="M-2.5 -3.5 L2 0 L-2.5 3.5"
          transform={`translate(${chevron.x.toFixed(1)} ${chevron.y.toFixed(1)}) rotate(${chevron.rotate.toFixed(1)})`}
        />
      ))}

      {/* The software each stage connects to */}
      {NODES.map((entry) => (
        <g key={entry.id} className="flow-apps" data-apps={entry.id}>
          {lines
            .filter((line) => line.node === entry.id)
            .map((line) => (
              <path key={line.id} className="flow-spoke" d={line.d} />
            ))}
          {entry.apps.slice(0, layout.nodes[entry.id].apps.length).map((id, index) => {
            const app = APPS[id];
            const at = layout.nodes[entry.id].apps[index];
            const size = "tile" in app && app.tile ? layout.app * 2 : layout.app * 1.2;
            return (
              <g key={id} className="flow-app" transform={`translate(${at.x} ${at.y})`}>
                <circle className="flow-app-disc" r={layout.app} filter={`url(#${uid}-lift)`} />
                <image
                  href={app.src}
                  x={-size / 2}
                  y={-size / 2}
                  width={size}
                  height={size}
                  clipPath={"tile" in app && app.tile ? `url(#${uid}-app)` : undefined}
                  preserveAspectRatio="xMidYMid meet"
                >
                  <title>{app.name}</title>
                </image>
              </g>
            );
          })}
        </g>
      ))}

      {/* Signals: along the ring and branches, and out to the software */}
      {EDGES.map((id) => (
        <Comet key={id} id={id} d={layout.edges[id]} warm={id === "schedule-hire"} />
      ))}
      {lines.map((line) => (
        <Comet key={line.id} id={line.id} d={line.d} small warm={line.node === "hire"} />
      ))}

      {/* The pay week fills, a day at a time */}
      <circle
        className="flow-progress"
        data-progress=""
        cx={layout.nodes.payroll.x}
        cy={layout.nodes.payroll.y}
        r={r + 7}
        strokeDasharray={`${(2 * Math.PI * (r + 7)).toFixed(2)}`}
        strokeDashoffset={0}
        transform={`rotate(-90 ${layout.nodes.payroll.x} ${layout.nodes.payroll.y})`}
      />

      {/* The stages */}
      {NODES.map((entry) => {
        const NodeIcon = ICONS[entry.id];
        const at = layout.nodes[entry.id];
        const icon = Math.round(r * 0.8);
        return (
          <g
            key={entry.id}
            className="flow-node"
            data-node={entry.id}
            data-focus={focus === entry.id ? "" : undefined}
            transform={`translate(${at.x} ${at.y})`}
          >
            <circle className="flow-node-halo" r={r + 12} />
            {entry.id === "approve" ? <circle className="flow-node-wait" r={r + 5} /> : null}
            <g className="flow-node-shape">
              <circle className="flow-node-body" r={r} filter={`url(#${uid}-lift)`} />
              <g className="flow-icon-rest" transform={`translate(${-icon / 2} ${-icon / 2})`}>
                <NodeIcon size={icon} weight="duotone" />
              </g>
              <g className="flow-icon-live" transform={`translate(${-icon / 2} ${-icon / 2})`}>
                <NodeIcon size={icon} weight="duotone" />
              </g>
            </g>
            {entry.id === "schedule" ? (
              <g transform={`translate(${r * 0.8} ${-r * 0.8})`}>
                <g className="flow-ai">
                  <rect x={-14} y={-8} width={28} height={16} rx={8} />
                  <Sparkle x={-10} y={-5} size={10} weight="fill" />
                  <text x={5} y={3.4} textAnchor="middle">
                    AI
                  </text>
                </g>
              </g>
            ) : null}
            {entry.id === "approve" || entry.id === "payroll" ? (
              <g data-badge={entry.id === "approve" ? "approved" : "paid"} className="flow-badge" transform={`translate(${r * 0.76} ${-r * 0.76})`}>
                <g className="flow-badge-body">
                  <circle r={9} />
                  <Check x={-6} y={-6} size={12} weight="bold" />
                </g>
              </g>
            ) : null}
            {entry.id === "hire" ? (
              <g data-badge="hired" className="flow-badge flow-badge-warm" transform={`translate(${r * 0.82} ${-r * 0.82})`}>
                <g className="flow-badge-body">
                  <rect x={-13} y={-9} width={26} height={18} rx={9} />
                  <text y={3.6} textAnchor="middle">
                    +3
                  </text>
                </g>
              </g>
            ) : null}
          </g>
        );
      })}

      {/* Names: a word or two each */}
      {NODES.map((entry) => {
        const label = layout.nodes[entry.id].label;
        return (
          <g key={entry.id} className="flow-name" data-focus={focus === entry.id ? "" : undefined}>
            <text className="flow-label" x={label.x} y={label.y} textAnchor={label.anchor} fontSize={layout.type.label}>
              {entry.label}
            </text>
            {entry.tag ? (
              <text className="flow-tag" x={label.x} y={label.y + layout.type.tag + 6} textAnchor={label.anchor} fontSize={layout.type.tag}>
                {entry.tag}
              </text>
            ) : null}
          </g>
        );
      })}

      {/* The middle of the ring: the working week */}
      <g className="flow-centre" transform={`translate(${layout.center.x} ${layout.center.y})`}>
        <ArrowsClockwise x={-7} y={-30} size={14} weight="bold" className="flow-centre-icon" />
        <text className="flow-centre-label" y={-1} textAnchor="middle" fontSize={layout.type.center}>
          Every working day
        </text>
        {DAYS.map((day, index) => (
          <text
            key={day}
            className="flow-day"
            data-day={index}
            data-state="done"
            x={(index - 2) * (layout.type.center * 2.5)}
            y={layout.type.center * 2.2}
            textAnchor="middle"
            fontSize={layout.type.center * 0.95}
          >
            {day[0]}
          </text>
        ))}
      </g>
    </svg>
  );
}
