// Connector geometry for the workflow graph, from boxes measured on the page:
// side to side between neighbours, over the top from the end of the day back
// to its start, and straight down or up between lanes. Corners are rounded.

export interface Box {
  x: number;
  y: number;
  w: number;
  h: number;
}

export interface Point {
  x: number;
  y: number;
}

export interface Route {
  d: string;
  start: Point;
  end: Point;
}

const round = (value: number) => Math.round(value * 2) / 2;
const same = (a: Point, b: Point) => Math.abs(a.x - b.x) < 0.5 && Math.abs(a.y - b.y) < 0.5;

/** A polyline as an SVG path, its corners rounded to at most `radius`. */
function rounded(points: Point[], radius: number): string {
  const path = points.filter((point, index) => index === 0 || !same(point, points[index - 1]));
  if (path.length < 2) return "";
  let d = `M${round(path[0].x)} ${round(path[0].y)}`;
  for (let i = 1; i < path.length - 1; i += 1) {
    const [before, corner, after] = [path[i - 1], path[i], path[i + 1]];
    const lengthIn = Math.hypot(corner.x - before.x, corner.y - before.y);
    const lengthOut = Math.hypot(after.x - corner.x, after.y - corner.y);
    const r = Math.min(radius, lengthIn / 2, lengthOut / 2);
    if (r < 0.5) {
      d += ` L${round(corner.x)} ${round(corner.y)}`;
      continue;
    }
    const start = { x: corner.x - ((corner.x - before.x) / lengthIn) * r, y: corner.y - ((corner.y - before.y) / lengthIn) * r };
    const end = { x: corner.x + ((after.x - corner.x) / lengthOut) * r, y: corner.y + ((after.y - corner.y) / lengthOut) * r };
    d += ` L${round(start.x)} ${round(start.y)} Q${round(corner.x)} ${round(corner.y)} ${round(end.x)} ${round(end.y)}`;
  }
  const last = path.at(-1)!;
  return `${d} L${round(last.x)} ${round(last.y)}`;
}

const line = (points: Point[], radius = 12): Route => ({ d: rounded(points, radius), start: points[0], end: points.at(-1)! });

/** From one box's right side to the next box's left side, turning halfway if they don't line up. */
export function across(from: Box, to: Box): Route {
  const start = { x: from.x + from.w, y: from.y + from.h / 2 };
  const end = { x: to.x, y: to.y + to.h / 2 };
  const turn = (start.x + end.x) / 2;
  return line([start, { x: turn, y: start.y }, { x: turn, y: end.y }, end]);
}

/** Up out of one box's top, along at `y`, and down into another's top: the way back to the start. */
export function over(from: Box, to: Box, y: number): Route {
  const start = { x: from.x + from.w / 2, y: from.y };
  const end = { x: to.x + to.w / 2, y: to.y };
  return line([start, { x: start.x, y }, { x: end.x, y }, end], 16);
}

/** Straight down (or up, from below) at `x`, from one box's edge to another's. */
export function vertical(from: Box, to: Box, x: number): Route {
  const down = to.y > from.y;
  const start = { x, y: down ? from.y + from.h : from.y };
  const end = { x, y: down ? to.y : to.y + to.h };
  return line([start, end]);
}
