// patterns.ts - mowing pattern geometry for the advanced "Mow now" panel: the preview the
// owner sees before starting, and the path the demo simulator shows. Native (Tender Cells
// MQTT) mowers receive the same parameters and plan their own path on board; vendor mowers
// (Husqvarna work areas, Mammotion saved plans) keep the pattern set in their own app.
import type { MowPattern } from "./mower";

export interface Pt { x: number; y: number }
export interface Rect { x: number; y: number; width: number; depth: number }

export const PATTERN_INFO: Record<MowPattern, { label: string; hint: string }> = {
  auto: { label: "Mower's choice", hint: "The mower's own default (random or its app's setting)." },
  stripes: { label: "Stripes", hint: "Parallel lanes - the classic striped lawn." },
  checkerboard: { label: "Checkerboard", hint: "Two passes at right angles." },
  diamond: { label: "Diamonds", hint: "Two diagonal passes crossing at 90 degrees." },
  spiral: { label: "Spiral", hint: "Outside-in loops - good for odd shapes." },
  perimeter: { label: "Edges only", hint: "Laps around the edge - a quick tidy-up." },
};

/** Lanes across `r` at `angleDeg` (0 = lanes run north-south), `spacing` apart, clipped to the rectangle. */
export function lanes(r: Rect, angleDeg: number, spacing: number): Pt[][] {
  const a = (angleDeg * Math.PI) / 180;
  const dir = { x: Math.sin(a), y: -Math.cos(a) };      // along a lane
  const nrm = { x: Math.cos(a), y: Math.sin(a) };       // across lanes
  const cx = r.x + r.width / 2, cy = r.y + r.depth / 2;
  const half = Math.hypot(r.width, r.depth) / 2;
  const out: Pt[][] = [];
  let flip = false;
  for (let o = -half + spacing / 2; o <= half; o += spacing) {
    const seg = clipLine({ x: cx + nrm.x * o, y: cy + nrm.y * o }, dir, r);
    if (!seg) continue;
    out.push(flip ? [seg[1], seg[0]] : seg);            // boustrophedon: alternate direction
    flip = !flip;
  }
  return out;
}

/** Clip the infinite line p + t*d to rectangle r (Liang-Barsky). */
function clipLine(p: Pt, d: Pt, r: Rect): [Pt, Pt] | null {
  let t0 = -Infinity, t1 = Infinity;
  const edges: [number, number][] = [[-d.x, p.x - r.x], [d.x, r.x + r.width - p.x], [-d.y, p.y - r.y], [d.y, r.y + r.depth - p.y]];
  for (const [pp, q] of edges) {
    if (Math.abs(pp) < 1e-9) { if (q < 0) return null; continue; }
    const t = q / pp;
    if (pp < 0) t0 = Math.max(t0, t); else t1 = Math.min(t1, t);
  }
  if (t0 > t1 || !Number.isFinite(t0) || !Number.isFinite(t1)) return null;
  const at = (t: number) => ({ x: p.x + d.x * t, y: p.y + d.y * t });
  return [at(t0), at(t1)];
}

/** One loop around `r` inset by `inset`. */
function loop(r: Rect, inset: number): Pt[] | null {
  const w = r.width - 2 * inset, d = r.depth - 2 * inset;
  if (w <= 0 || d <= 0) return null;
  const x = r.x + inset, y = r.y + inset;
  return [{ x, y }, { x: x + w, y }, { x: x + w, y: y + d }, { x, y: y + d }, { x, y }];
}

/**
 * The paths a pattern produces over an area.
 *
 * @param r          - Area in property feet
 * @param pattern    - Pattern
 * @param angleDeg   - Stripe direction (0-179)
 * @param edgePasses - Laps around the edge first
 * @param spacing    - Lane spacing in feet (blade width minus overlap)
 * @returns Polylines in mowing order
 */
export function patternPaths(r: Rect, pattern: MowPattern, angleDeg = 0, edgePasses = 0, spacing = 2): Pt[][] {
  const edges: Pt[][] = [];
  for (let i = 0; i < edgePasses; i++) { const l = loop(r, spacing * (i + 0.5)); if (l) edges.push(l); }
  const inner = edgePasses ? { x: r.x + spacing * edgePasses, y: r.y + spacing * edgePasses,
    width: r.width - 2 * spacing * edgePasses, depth: r.depth - 2 * spacing * edgePasses } : r;
  if (inner.width <= 0 || inner.depth <= 0) return edges;
  switch (pattern) {
    case "stripes": return [...edges, ...lanes(inner, angleDeg, spacing)];
    case "checkerboard": return [...edges, ...lanes(inner, angleDeg, spacing), ...lanes(inner, (angleDeg + 90) % 180, spacing)];
    case "diamond": return [...edges, ...lanes(inner, (angleDeg + 45) % 180, spacing), ...lanes(inner, (angleDeg + 135) % 180, spacing)];
    case "spiral": {
      const out = [...edges];
      for (let i = 0; ; i++) { const l = loop(inner, spacing * (i + 0.5)); if (!l) break; out.push(l); }
      return out;
    }
    case "perimeter": return edges.length ? edges : [loop(r, spacing / 2)!].filter(Boolean);
    case "auto": return edges;
  }
}

/** Blade width 22 cm is typical; lane spacing in feet for an overlap percentage. */
export const laneSpacingFt = (overlapPct = 10, bladeFt = 0.72) => Math.max(0.2, bladeFt * (1 - overlapPct / 100));

/** Total path length (ft) - used for a rough time estimate. */
export const pathLength = (paths: Pt[][]) =>
  paths.reduce((sum, p) => sum + p.slice(1).reduce((s, q, i) => s + Math.hypot(q.x - p[i].x, q.y - p[i].y), 0), 0);
