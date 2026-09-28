import { cn } from "@/lib/utils";
import { MARK_CENTER, MARK_COUNTER, MARK_OUTER, MARK_PATH } from "./logo-paths";

const FLIP = "translate(0,400) scale(0.1,-0.1)";
const HALF_TURN = `rotate(180 ${MARK_CENTER.x} ${MARK_CENTER.y})`;

/**
 * The Craefto mark in two stacked layers: the solid fill, and a "pens" layer
 * used by the load animation (see "Logo intro" in globals.css). The pens are
 * the outer contour and one leaf counter plus the same two paths turned a
 * half-turn, so the outline draws from both tail ends at once, perfectly
 * mirrored, before the fill blooms from the centre. At rest only the fill
 * shows.
 */
export function LogoMark({
  width,
  height,
  className,
}: {
  width: number;
  height: number;
  className?: string;
}) {
  const pens = (
    <g transform={FLIP}>
      <path className="mark-pen-outer" pathLength={1} d={MARK_OUTER} />
      <path className="mark-pen-counter" pathLength={1} d={MARK_COUNTER} />
    </g>
  );
  return (
    <span className={cn("logo-mark", className)} style={{ width, height }} aria-hidden="true">
      <svg className="mark-pens" width={width} height={height} viewBox="0 0 400 400" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round">
        {pens}
        <g transform={HALF_TURN}>{pens}</g>
      </svg>
      <svg className="mark-fill" width={width} height={height} viewBox="0 0 400 400" fill="none">
        <g transform={FLIP} fill="currentColor" fillRule="nonzero">
          <path d={MARK_PATH} />
        </g>
      </svg>
    </span>
  );
}
