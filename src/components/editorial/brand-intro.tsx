import { MARK_CENTER, MARK_COUNTER, MARK_OUTER, MARK_PATH } from "@/components/ui/logo-paths";

// Geometry of the mark in its 400 × 400 viewBox. Its four extremities sit on
// the corners of its bounding square: the flat tails at top-left and
// bottom-right, the leaf tips at top-right and bottom-left.
const C = MARK_CENTER;
const L = 61.5;
const T = 61.5;
const R = 337.5;
const B = 338;
const R_OUTER = Math.hypot(C.x - L, C.y - T); // circle through all four corners
const R_INNER = (R - L) / 2; // circle touching the square's sides
const FLIP = "translate(0,400) scale(0.1,-0.1)";
const HALF_TURN = `rotate(180 ${C.x} ${C.y})`;

/** One outline pen (outer contour + one leaf counter) with a stylus point on its tip. */
function Pen() {
  return (
    <g transform={FLIP}>
      <path className="intro-pen-outer" pathLength={1} d={MARK_OUTER} />
      <path className="intro-pen-counter" pathLength={1} d={MARK_COUNTER} />
      <circle className="intro-tip" r={36} cx={0} cy={0} opacity={0}>
        <animateMotion
          path={MARK_OUTER}
          begin="0.48s"
          dur="1.08s"
          fill="freeze"
          calcMode="spline"
          keyPoints="0;0.5"
          keyTimes="0;1"
          keySplines="0.5 0 0.2 1"
        />
        <animate attributeName="opacity" values="0;1;1;0" keyTimes="0;0.08;0.82;1" begin="0.48s" dur="1.08s" fill="freeze" />
      </circle>
    </g>
  );
}

/**
 * Home page intro, on every full page load (the boot script sets
 * html.logo-intro-home and clears it when the intro ends; skipped with
 * reduced motion). A construction drawing of the mark: centre point, axes to
 * the four corners, the bounding square and the circle through its corners,
 * then two mirrored pens trace the outline from the tails, the counters
 * follow, the fill blooms from the centre and a light passes over it. A
 * hairline cut runs along the leaf diagonal, the veil parts along it, and the
 * mark glides into the header, landing on the real logo.
 *
 * Rendered at full display size and only ever scaled down, so it stays sharp
 * at any pixel density. Pure CSS and SMIL: it plays from the first paint and
 * clicks pass straight through.
 */
export function BrandIntro() {
  const corners: [number, number][] = [
    [L, T],
    [R, T],
    [R, B],
    [L, B],
  ];
  return (
    <div className="brand-intro" aria-hidden="true">
      <span className="brand-intro-veil brand-intro-veil-a" />
      <span className="brand-intro-veil brand-intro-veil-b" />
      <span className="brand-intro-seam" />
      <div className="brand-intro-stage">
        <div className="brand-intro-art">
          {/* Construction */}
          <svg className="intro-construct" viewBox="0 0 400 400" shapeRendering="geometricPrecision" fill="none">
            {corners.map(([x, y]) => (
              <path key={`${x}-${y}`} className="intro-ray" pathLength={1} d={`M${C.x} ${C.y} L${x} ${y}`} />
            ))}
            <path className="intro-square" pathLength={1} d={`M${L} ${T} H${R} V${B}`} />
            <path className="intro-square" pathLength={1} d={`M${R} ${B} H${L} V${T}`} />
            <path className="intro-ring-outer" pathLength={1} d={`M${L} ${T} A${R_OUTER} ${R_OUTER} 0 0 1 ${R} ${B}`} />
            <path className="intro-ring-outer" pathLength={1} d={`M${R} ${B} A${R_OUTER} ${R_OUTER} 0 0 1 ${L} ${T}`} />
            <path className="intro-ring-inner" pathLength={1} d={`M${L} ${C.y} A${R_INNER} ${R_INNER} 0 0 1 ${R} ${C.y}`} />
            <path className="intro-ring-inner" pathLength={1} d={`M${R} ${C.y} A${R_INNER} ${R_INNER} 0 0 1 ${L} ${C.y}`} />
            <circle className="intro-centre" cx={C.x} cy={C.y} r={3} />
          </svg>
          {/* Two mirrored pens: the second is the first turned a half-turn */}
          <svg className="intro-pens" viewBox="0 0 400 400" shapeRendering="geometricPrecision" fill="none" strokeLinecap="round" strokeLinejoin="round">
            <Pen />
            <g transform={HALF_TURN}>
              <Pen />
            </g>
          </svg>
          {/* The mark itself, blooming from the centre, with one pass of light */}
          <svg className="intro-fill" viewBox="0 0 400 400" shapeRendering="geometricPrecision">
            <defs>
              <clipPath id="brand-intro-mark">
                <path transform={FLIP} d={MARK_PATH} />
              </clipPath>
              <linearGradient id="brand-intro-sheen" x1="0" y1="0" x2="1" y2="0">
                <stop offset="0" stopColor="#fff" stopOpacity="0" />
                <stop offset="0.5" stopColor="#fff" stopOpacity="0.42" />
                <stop offset="1" stopColor="#fff" stopOpacity="0" />
              </linearGradient>
            </defs>
            <path transform={FLIP} d={MARK_PATH} fill="currentColor" />
            <g clipPath="url(#brand-intro-mark)">
              <g transform={`rotate(24 ${C.x} ${C.y})`}>
                <rect className="intro-sheen" x={-60} y={-120} width={110} height={640} fill="url(#brand-intro-sheen)" />
              </g>
            </g>
          </svg>
        </div>
      </div>
    </div>
  );
}
