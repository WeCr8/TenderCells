// boundary.ts - the property boundary every mobile product must stay inside (geofence), and
// how a robot's survey can refine it with measured dimensions.
//
// The boundary is one of:
//   layout  the property rectangle from the layout (default)
//   drawn   corners the owner typed / drew
//   survey  a robot's measured outline the owner reviewed and accepted
// Robots also keep `marginFt` away from every edge. It is sent inside the retained zones payload
// (tc/{id}/cfg/zones -> boundary) and enforced on the robot (firmware/jetson-nano/zones.py), so
// it holds offline.
//
// A survey never changes the boundary by itself. It becomes a *proposal*: the measured outline,
// width / depth / area, elevation range, steepest slope, low and wet spots, coverage and the
// keep-out zones it suggests (too steep, standing water). The owner accepts or discards it.
// Shrinking is always allowed (safer); widening needs explicit confirmation AND enough coverage,
// because robots are held inside the old boundary and only *see* past it with their sensors.
//
// Units: property feet, origin top-left, x right, y down (same as PropertyItem).
import type { PropertyLayoutState, PropertyItem } from '../../components/property/propertyLayoutStore';
import type { ElevationGrid } from '../../components/property/terrain';

export type Pt = [number, number];
export type BoundarySource = 'layout' | 'drawn' | 'survey';

export interface PropertyBoundary {
  poly: Pt[];
  source: BoundarySource;
  /** Robots keep at least this far from every edge. */
  marginFt: number;
  surveyedAt?: number;
  deviceId?: string;
  /** Survey confidence 0..1 when source is 'survey'. */
  confidence?: number;
}

export const DEFAULT_MARGIN_FT = 2;
/** Steeper than this (rise / run) is suggested as a keep-out: most mowers and rovers are rated ~35%. */
export const MAX_SLOPE_PCT = 35;
/** Standing water deeper than this is suggested as a no-go. */
export const WATER_DEPTH_FT = 0.25;
/** Widening needs at least this much of the proposed area actually driven over and measured. */
export const MIN_COVERAGE_TO_WIDEN = 0.5;

// ── geometry ─────────────────────────────────────────────────────────────────
export const rectPoly = (x: number, y: number, w: number, d: number): Pt[] => [[x, y], [x + w, y], [x + w, y + d], [x, y + d]];

export function inPoly(x: number, y: number, poly: Pt[]): boolean {
  let inside = false;
  for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
    const [xi, yi] = poly[i], [xj, yj] = poly[j];
    if ((yi > y) !== (yj > y) && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) inside = !inside;
  }
  return inside;
}

/** Shortest distance from a point to the polygon's edges. */
export function distToEdges(x: number, y: number, poly: Pt[]): number {
  let best = Infinity;
  for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
    const [ax, ay] = poly[j], [bx, by] = poly[i];
    const dx = bx - ax, dy = by - ay;
    const t = dx || dy ? Math.max(0, Math.min(1, ((x - ax) * dx + (y - ay) * dy) / (dx * dx + dy * dy))) : 0;
    best = Math.min(best, Math.hypot(x - (ax + t * dx), y - (ay + t * dy)));
  }
  return best;
}

export const polyArea = (p: Pt[]) => Math.abs(p.reduce((s, [x, y], i) => { const [nx, ny] = p[(i + 1) % p.length]; return s + x * ny - nx * y; }, 0)) / 2;
export const polyPerimeter = (p: Pt[]) => p.reduce((s, [x, y], i) => { const [nx, ny] = p[(i + 1) % p.length]; return s + Math.hypot(nx - x, ny - y); }, 0);
export function bbox(p: Pt[]): { x: number; y: number; width: number; depth: number } {
  const xs = p.map((q) => q[0]), ys = p.map((q) => q[1]);
  const x = Math.min(...xs), y = Math.min(...ys);
  return { x, y, width: Math.max(...xs) - x, depth: Math.max(...ys) - y };
}

/** Convex hull (monotone chain) - fallback outline when a survey has too few edge points. */
export function convexHull(points: Pt[]): Pt[] {
  const p = [...points].sort((a, b) => a[0] - b[0] || a[1] - b[1]);
  if (p.length < 3) return p;
  const cross = (o: Pt, a: Pt, b: Pt) => (a[0] - o[0]) * (b[1] - o[1]) - (a[1] - o[1]) * (b[0] - o[0]);
  const lower: Pt[] = [], upper: Pt[] = [];
  for (const q of p) { while (lower.length >= 2 && cross(lower[lower.length - 2], lower[lower.length - 1], q) <= 0) lower.pop(); lower.push(q); }
  for (const q of [...p].reverse()) { while (upper.length >= 2 && cross(upper[upper.length - 2], upper[upper.length - 1], q) <= 0) upper.pop(); upper.push(q); }
  return [...lower.slice(0, -1), ...upper.slice(0, -1)];
}

// ── the boundary in force ────────────────────────────────────────────────────
/** The boundary robots must stay inside: the saved one, else the property rectangle. */
export function effectiveBoundary(layout: PropertyLayoutState): PropertyBoundary {
  const b = (layout.property as { boundary?: PropertyBoundary }).boundary;
  if (b && b.poly.length >= 3) return b;
  return { poly: rectPoly(0, 0, layout.property.widthFt, layout.property.depthFt), source: 'layout', marginFt: DEFAULT_MARGIN_FT };
}

/** True when a point is inside the boundary and at least marginFt from its edges. */
export function insideBoundary(b: PropertyBoundary, x: number, y: number): boolean {
  return inPoly(x, y, b.poly) && distToEdges(x, y, b.poly) >= b.marginFt;
}

/**
 * First point where a path leaves the boundary (sampled every 0.5 ft), for route checks.
 *
 * @returns Segment index and the point, or undefined when the path stays inside
 */
export function pathLeavesBoundary(b: PropertyBoundary, path: Array<{ x: number; y: number }>): { segment: number; x: number; y: number } | undefined {
  for (let i = 0; i < path.length; i++) {
    const a = path[Math.max(0, i - 1)], c = path[i];
    const steps = Math.max(1, Math.ceil(Math.hypot(c.x - a.x, c.y - a.y) / 0.5));
    for (let s = 0; s <= steps; s++) {
      const t = s / steps, x = a.x + (c.x - a.x) * t, y = a.y + (c.y - a.y) * t;
      if (!insideBoundary(b, x, y)) return { segment: Math.max(0, i - 1), x, y };
    }
  }
  return undefined;
}

/** Items (products, gardens, obstacles) sitting partly outside the boundary. */
export const itemsOutside = (layout: PropertyLayoutState, b = effectiveBoundary(layout)): PropertyItem[] =>
  layout.items.filter((it) => rectPoly(it.x, it.y, it.width, it.depth).some(([x, y]) => !inPoly(x, y, b.poly) && distToEdges(x, y, b.poly) > 0.01));

// ── surveys ──────────────────────────────────────────────────────────────────
/** What a mobile robot reports after a survey pass (tc/{id}/state/survey). */
export interface Survey {
  deviceId: string;
  at: number;
  /** Edge / fence line its sensors measured (lidar, camera, bump), property ft. May lie past the old boundary. */
  edge: Pt[];
  /** Grid spacing of the ground samples. */
  stepFt: number;
  /** Ground it drove over: elevation (ft, relative) and standing-water depth where sensed. */
  samples: Array<{ x: number; y: number; z: number; depthFt?: number }>;
}

export interface SuggestedZone { id: string; name: string; reason: 'steep' | 'water'; poly: Pt[] }

export interface BoundaryProposal {
  poly: Pt[];
  widthFt: number;
  depthFt: number;
  areaSqFt: number;
  perimeterFt: number;
  elevation: { minFt: number; maxFt: number; meanFt: number };
  maxSlopePct: number;
  lowSpots: number;
  wetSpots: number;
  coveragePct: number;
  confidence: number;
  /** How far the proposal reaches past the current boundary (0 = never). */
  expandsFt: number;
  /** How far the current boundary reaches past the proposal (0 = never). */
  shrinksFt: number;
  suggestedZones: SuggestedZone[];
  grid: ElevationGrid;
  deviceId: string;
  at: number;
}

const round = (v: number, d = 1) => Math.round(v * 10 ** d) / 10 ** d;

/** Order edge points around their centroid into a polygon (fine for yard-shaped outlines). */
function orderAround(points: Pt[]): Pt[] {
  const cx = points.reduce((s, p) => s + p[0], 0) / points.length, cy = points.reduce((s, p) => s + p[1], 0) / points.length;
  return [...points].sort((a, b) => Math.atan2(a[1] - cy, a[0] - cx) - Math.atan2(b[1] - cy, b[0] - cx));
}

/** Drop near-duplicate / collinear-ish points so the outline stays light (robots take <= 256). */
function simplify(poly: Pt[], tolFt = 0.75): Pt[] {
  const out: Pt[] = [];
  for (const p of poly) {
    const prev = out[out.length - 1];
    if (!prev || Math.hypot(p[0] - prev[0], p[1] - prev[1]) >= tolFt) out.push(p);
  }
  return out.slice(0, 256);
}

/**
 * Turn a survey into a proposal the owner can review. Nothing is changed.
 *
 * @param layout - Current layout (for the boundary in force)
 * @param s      - The robot's survey
 * @returns Measured outline, dimensions, terrain stats, suggested zones and the change vs today
 */
export function proposalFromSurvey(layout: PropertyLayoutState, s: Survey): BoundaryProposal {
  const current = effectiveBoundary(layout);
  const raw = s.edge.length >= 3 ? orderAround(s.edge) : convexHull(s.samples.map((q) => [q.x, q.y] as Pt));
  const poly = simplify(raw.map(([x, y]) => [Math.max(0, round(x, 2)), Math.max(0, round(y, 2))] as Pt));
  const bb = bbox(poly);
  const area = polyArea(poly);

  // Terrain from the samples, on a grid over the outline.
  const step = s.stepFt;
  const cols = Math.floor((bb.x + bb.width) / step) + 1, rows = Math.floor((bb.y + bb.depth) / step) + 1;
  const key = (c: number, r: number) => r * cols + c;
  const cell = new Map<number, { z: number; depthFt?: number }>();
  for (const q of s.samples) cell.set(key(Math.round(q.x / step), Math.round(q.y / step)), { z: q.z, depthFt: q.depthFt });
  const zs = s.samples.map((q) => q.z);
  const mean = zs.length ? zs.reduce((a, b) => a + b, 0) / zs.length : 0;
  const heightsFt = Array.from({ length: rows * cols }, (_, i) => cell.get(i)?.z ?? mean);

  // Slope between neighbouring samples; flag steep and wet cells.
  let maxSlope = 0;
  const flagged = new Map<number, 'steep' | 'water'>();
  for (const [k, v] of cell) {
    const c = k % cols, r = Math.floor(k / cols);
    for (const [dc, dr] of [[1, 0], [0, 1]] as const) {
      const n = cell.get(key(c + dc, r + dr));
      if (!n) continue;
      const slope = (Math.abs(n.z - v.z) / step) * 100;
      maxSlope = Math.max(maxSlope, slope);
      if (slope > MAX_SLOPE_PCT) flagged.set(k, 'steep');
    }
    if ((v.depthFt ?? 0) > WATER_DEPTH_FT) flagged.set(k, 'water');
  }

  // Cluster flagged cells (4-neighbour flood fill) into rectangles.
  const suggestedZones: SuggestedZone[] = [];
  const seen = new Set<number>();
  for (const [start, reason] of flagged) {
    if (seen.has(start)) continue;
    const stack = [start];
    let minC = Infinity, maxC = -Infinity, minR = Infinity, maxR = -Infinity;
    while (stack.length) {
      const k = stack.pop()!;
      if (seen.has(k) || flagged.get(k) !== reason) continue;
      seen.add(k);
      const c = k % cols, r = Math.floor(k / cols);
      minC = Math.min(minC, c); maxC = Math.max(maxC, c); minR = Math.min(minR, r); maxR = Math.max(maxR, r);
      stack.push(key(c + 1, r), key(c - 1, r), key(c, r + 1), key(c, r - 1));
    }
    const x = Math.max(0, (minC - 0.5) * step), y = Math.max(0, (minR - 0.5) * step);
    suggestedZones.push({
      id: `survey-${reason}-${suggestedZones.length + 1}`,
      name: reason === 'steep' ? `Steep slope (survey)` : `Standing water (survey)`,
      reason, poly: rectPoly(round(x), round(y), round((maxC - minC + 1) * step), round((maxR - minR + 1) * step)),
    });
  }

  const coverage = area > 0 ? Math.min(1, (s.samples.length * step * step) / area) : 0;
  const confidence = round(coverage * (s.edge.length >= 8 ? 1 : 0.6), 2);
  const outside = (p: Pt, of: Pt[]) => (inPoly(p[0], p[1], of) ? 0 : distToEdges(p[0], p[1], of));
  const expandsFt = round(Math.max(0, ...poly.map((p) => outside(p, current.poly))));
  const shrinksFt = round(Math.max(0, ...current.poly.map((p) => outside(p, poly))));

  return {
    poly, widthFt: round(bb.width), depthFt: round(bb.depth), areaSqFt: Math.round(area), perimeterFt: round(polyPerimeter(poly)),
    elevation: { minFt: round(zs.length ? Math.min(...zs) : 0, 2), maxFt: round(zs.length ? Math.max(...zs) : 0, 2), meanFt: round(mean, 2) },
    maxSlopePct: round(maxSlope), lowSpots: s.samples.filter((q) => q.z < mean - 0.25).length,
    wetSpots: s.samples.filter((q) => (q.depthFt ?? 0) > WATER_DEPTH_FT).length,
    coveragePct: Math.round(coverage * 100), confidence, expandsFt, shrinksFt, suggestedZones,
    grid: { originX: 0, originY: 0, stepFt: step, cols, rows, heightsFt, source: 'robot', deviceId: s.deviceId, capturedAt: s.at },
    deviceId: s.deviceId, at: s.at,
  };
}

/** Why a proposal cannot be accepted as asked, or null. */
export function acceptBlocker(p: BoundaryProposal, confirmExpansion: boolean): string | null {
  if (p.poly.length < 3 || p.areaSqFt < 25) return 'The survey outline is too small to use - run a longer survey.';
  if (p.expandsFt > 0.5) {
    if (!confirmExpansion) return `This widens the boundary by up to ${p.expandsFt} ft - confirm the new area is yours and safe for robots.`;
    if (p.confidence < MIN_COVERAGE_TO_WIDEN) {
      return `Coverage is ${p.coveragePct}% - too little to widen the boundary. Accept it only where it shrinks, or survey more.`;
    }
  }
  return null;
}

/**
 * Apply an accepted proposal: new boundary, measured elevation grid, the map grown to fit and
 * (optionally) the suggested zones added as No-Go Zones. Returns a new layout; the caller saves it.
 *
 * @throws Error with the blocker when acceptBlocker() is not null
 */
export function applyProposal(layout: PropertyLayoutState, p: BoundaryProposal, opts: { confirmExpansion: boolean; addZones: boolean }): PropertyLayoutState {
  const blocker = acceptBlocker(p, opts.confirmExpansion);
  if (blocker) throw new Error(blocker);
  const bb = bbox(p.poly);
  const margin = effectiveBoundary(layout).marginFt;
  const boundary: PropertyBoundary = { poly: p.poly, source: 'survey', marginFt: margin, surveyedAt: p.at, deviceId: p.deviceId, confidence: p.confidence };
  const zones: PropertyItem[] = opts.addZones ? p.suggestedZones.map((z) => {
    const zb = bbox(z.poly);
    return { id: z.id, kind: 'obstacle', type: 'no-go-zone', name: z.name, x: zb.x, y: zb.y, width: zb.width, depth: zb.depth, shape: 'rect' } as PropertyItem;
  }) : [];
  return {
    property: {
      ...layout.property,
      widthFt: Math.max(layout.property.widthFt, Math.ceil(bb.x + bb.width)),
      depthFt: Math.max(layout.property.depthFt, Math.ceil(bb.y + bb.depth)),
      elevationGrid: p.grid,
      boundary,
    } as PropertyLayoutState['property'],
    items: [...layout.items.filter((it) => !zones.some((z) => z.id === it.id)), ...zones],
  };
}

/**
 * Demo survey: a rover drives the ground inside today's boundary (it may not leave it) and its
 * lidar measures the real fence line, which is a little different from the drawn rectangle -
 * one side runs 4 ft further, a corner is cut, and there is a steep bank and a wet dip.
 */
export function simulateSurvey(layout: PropertyLayoutState, deviceId = 'rv_001 (demo survey)', seed = 11): Survey {
  const { widthFt: W, depthFt: D } = layout.property;
  let s = seed >>> 0 || 1;
  const rnd = () => { s ^= s << 13; s ^= s >>> 17; s ^= s << 5; return ((s >>> 0) % 100000) / 100000; };
  const truth: Pt[] = [[0.6, 0.4], [W - 1.5, 0.3], [W + 4, D * 0.35], [W + 4, D - 0.5], [W * 0.3, D - 0.4], [0.5, D * 0.8]];
  const edge: Pt[] = [];
  for (let i = 0; i < truth.length; i++) {
    const a = truth[i], b = truth[(i + 1) % truth.length];
    const n = Math.max(2, Math.ceil(Math.hypot(b[0] - a[0], b[1] - a[1]) / 6));
    for (let k = 0; k < n; k++) edge.push([a[0] + ((b[0] - a[0]) * k) / n + (rnd() - 0.5) * 0.3, a[1] + ((b[1] - a[1]) * k) / n + (rnd() - 0.5) * 0.3]);
  }
  const current = effectiveBoundary(layout);
  const bank = { x: W * 0.7, y: D * 0.15, r: 5 }, dip = { x: W * 0.25, y: D * 0.6, r: 4 };
  const samples: Survey['samples'] = [];
  const step = 2;
  for (let y = step; y < D; y += step) {
    for (let x = step; x < W; x += step) {
      if (!insideBoundary(current, x, y) || !inPoly(x, y, truth)) continue;   // the robot never leaves the boundary
      let z = 0.004 * x - 0.008 * y + (rnd() - 0.5) * 0.02;
      const db = Math.hypot(x - bank.x, y - bank.y);
      if (db < bank.r) z += (bank.r - db) * 1.1;                              // a short, steep bank
      const dd = Math.hypot(x - dip.x, y - dip.y);
      const depthFt = dd < dip.r ? round((dip.r - dd) * 0.15, 2) : undefined; // standing water in a dip
      if (depthFt) z -= depthFt;
      samples.push({ x, y, z: round(z, 3), ...(depthFt ? { depthFt } : {}) });
    }
  }
  return { deviceId, at: Date.now(), edge, stepFt: step, samples };
}
