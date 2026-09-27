// watershed.ts - rain, puddles, flow and erosion on the property (pure, no DOM).
//
// Input: the property's terrain (zones, hand-placed elevation, or a robot-measured
// elevation grid - the more accurate the terrain, the more accurate this is), the
// items (roofs shed water, ponds collect it) and any drainage fixes the user is trying.
//
// Model (grid of square cells, property feet):
//   1. Runoff per cell   = max(0, rain rate - infiltration of its surface) x duration
//   2. Depressions       = priority-flood fill (Barnes et al. 2014); property edges,
//                          ponds, drains and rain gardens are outlets
//   3. Puddles           = each depression's catchment runoff fills it from the
//                          bottom up to the level that holds that volume (capped at spill)
//   4. Flow              = D8 flow accumulation of runoff on the filled surface
//   5. Erosion index     = erodibility(surface) x sqrt(flow) x slope (stream-power style)
// Rates and factors are planning-grade defaults for comparing options on one yard,
// not engineering design values.
import type { PropertyItem } from './propertyLayoutStore';
import { heightAt, zoneAt, type TerrainKind, type TerrainLayers } from './terrain';

export type RainScenario = 'light' | 'heavy' | 'storm';

export const RAIN_SCENARIOS: Record<RainScenario, { label: string; inPerHr: number; hours: number; note: string }> = {
  light: { label: 'Light rain', inPerHr: 0.25, hours: 1, note: '1/4 in over an hour' },
  heavy: { label: 'Heavy rain', inPerHr: 1.0, hours: 1, note: '1 in in an hour' },
  storm: { label: 'Flood storm', inPerHr: 2.0, hours: 2, note: '4 in over two hours (flood-level)' },
};

/** Infiltration (in/hr) and erodibility (0..1) by surface. */
export const SURFACE_HYDRO: Record<TerrainKind | 'roof', { infilInHr: number; erodibility: number }> = {
  lawn: { infilInHr: 0.5, erodibility: 0.15 },
  pasture: { infilInHr: 0.6, erodibility: 0.2 },
  dry: { infilInHr: 0.2, erodibility: 1.0 },
  snow: { infilInHr: 0.0, erodibility: 0.05 },
  'garden-soil': { infilInHr: 0.8, erodibility: 0.8 },
  mulch: { infilInHr: 1.2, erodibility: 0.2 },
  gravel: { infilInHr: 1.5, erodibility: 0.1 },
  sand: { infilInHr: 2.0, erodibility: 0.7 },
  paved: { infilInHr: 0.0, erodibility: 0.0 },
  woods: { infilInHr: 1.0, erodibility: 0.1 },
  wetland: { infilInHr: 0.05, erodibility: 0.3 },
  roof: { infilInHr: 0.0, erodibility: 0.0 },
};

export type FixKind = 'drain' | 'rain-garden' | 'swale' | 'berm' | 'fill';

/** A drainage change the user is trying (planned, not built). */
export interface DrainageFix {
  id: string;
  kind: FixKind;
  x: number;
  y: number;
  /** End point for swales and berms. */
  x2?: number;
  y2?: number;
  /** Radius (drain, rain garden, fill) or half-width (swale, berm), feet. */
  sizeFt: number;
  /** Swale depth / berm height / fill height, feet. */
  depthFt: number;
  label?: string;
}

export const FIX_INFO: Record<FixKind, { label: string; help: string; linear: boolean }> = {
  drain: { label: 'Drain / dry well', help: 'Takes water away at a point (French drain inlet, dry well).', linear: false },
  'rain-garden': { label: 'Rain garden', help: 'Planted basin that soaks water in; never erodes.', linear: false },
  swale: { label: 'Grassed swale', help: 'Shallow planted channel that carries water gently downhill.', linear: true },
  berm: { label: 'Berm', help: 'Low raised strip that redirects surface water.', linear: true },
  fill: { label: 'Fill / regrade', help: 'Raise a low spot so it no longer holds water.', linear: false },
};

export interface HydrologyInput {
  widthFt: number;
  depthFt: number;
  terrain: TerrainLayers;
  items: Pick<PropertyItem, 'type' | 'kind' | 'x' | 'y' | 'width' | 'depth'>[];
  baseSurface?: TerrainKind;
  fixes?: DrainageFix[];
  scenario: RainScenario;
  /** Cell size in feet (auto from property size when omitted). */
  cellFt?: number;
}

export interface Puddle { id: number; cells: number; areaSqFt: number; maxDepthIn: number; volumeGal: number; x: number; y: number }

export interface HydrologyResult {
  cols: number;
  rows: number;
  cellFt: number;
  /** Ground height after fixes, feet (row-major). */
  ground: Float32Array;
  /** Standing water depth, feet. */
  water: Float32Array;
  /** Upslope runoff volume passing through each cell, cubic feet. */
  flow: Float32Array;
  /** 0 none/low, 1 moderate, 2 high. */
  erosion: Uint8Array;
  /** D8 downstream cell index (-1 = outlet). */
  down: Int32Array;
  puddles: Puddle[];
  summary: {
    rainIn: number;
    runoffGal: number;
    pondedGal: number;
    puddleAreaSqFt: number;
    maxPuddleDepthIn: number;
    erosionHighSqFt: number;
    erosionModerateSqFt: number;
    erosionIndexTotal: number;
    source: 'robot-grid' | 'hand-drawn';
  };
}

const GAL_PER_FT3 = 7.48052;
const WET_FT = 0.25 / 12; // count water deeper than 1/4 in as a puddle

const segDist = (px: number, py: number, ax: number, ay: number, bx: number, by: number) => {
  const dx = bx - ax, dy = by - ay;
  const len2 = dx * dx + dy * dy || 1;
  const t = Math.max(0, Math.min(1, ((px - ax) * dx + (py - ay) * dy) / len2));
  return Math.hypot(px - (ax + t * dx), py - (ay + t * dy));
};

export const SWALE_GRADE = 0.01; // 1% fall: carries water without scouring a grassed channel
export const MAX_CUT_FT = 3;

const swaleInvert = (f: DrainageFix, t: number, baseAt: (x: number, y: number) => number) => {
  const len = Math.hypot((f.x2 ?? f.x) - f.x, (f.y2 ?? f.y) - f.y);
  return baseAt(f.x, f.y) - f.depthFt - SWALE_GRADE * len * t;
};

/**
 * What a swale takes to build: its bottom starts depthFt below the ground at (x,y) and
 * falls 1% toward (x2,y2), cutting through any rim on the way (capped at 3 ft).
 *
 * @returns Length, deepest cut below existing ground, and whether the cap was hit
 */
export function swalePlan(f: DrainageFix, baseAt: (x: number, y: number) => number) {
  const x2 = f.x2 ?? f.x, y2 = f.y2 ?? f.y;
  const lengthFt = Math.hypot(x2 - f.x, y2 - f.y);
  let maxCutFt = 0;
  for (let i = 0; i <= 40; i++) {
    const t = i / 40;
    maxCutFt = Math.max(maxCutFt, baseAt(f.x + (x2 - f.x) * t, f.y + (y2 - f.y) * t) - swaleInvert(f, t, baseAt));
  }
  return { lengthFt, maxCutFt: Math.min(maxCutFt, MAX_CUT_FT), capped: maxCutFt > MAX_CUT_FT };
}

/** Height change a fix makes at a point (feet), and whether the point is its outlet. */
function fixEffect(f: DrainageFix, x: number, y: number, z: number,
  baseAt: (x: number, y: number) => number): { dz: number; outlet: boolean; surface?: TerrainKind } {
  if (FIX_INFO[f.kind].linear) {
    const x2 = f.x2 ?? f.x, y2 = f.y2 ?? f.y;
    const d = segDist(x, y, f.x, f.y, x2, y2);
    if (d > f.sizeFt) return { dz: 0, outlet: false };
    const shape = 0.5 * (1 + Math.cos((Math.PI * d) / f.sizeFt)); // smooth cross-section
    if (f.kind === 'berm') return { dz: f.depthFt * shape, outlet: false };
    // Graded, grass-lined swale: bottom falls 1% from start to end (see swalePlan).
    const len2 = (x2 - f.x) ** 2 + (y2 - f.y) ** 2 || 1;
    const t = Math.max(0, Math.min(1, ((x - f.x) * (x2 - f.x) + (y - f.y) * (y2 - f.y)) / len2));
    const invert = Math.max(swaleInvert(f, t, baseAt), baseAt(x, y) - MAX_CUT_FT);
    const target = invert * shape + z * (1 - shape);
    return { dz: Math.min(0, target - z), outlet: false, surface: 'lawn' };
  }
  const d = Math.hypot(x - f.x, y - f.y);
  if (d > f.sizeFt) return { dz: 0, outlet: false };
  const shape = 0.5 * (1 + Math.cos((Math.PI * d) / f.sizeFt));
  if (f.kind === 'fill') return { dz: f.depthFt * shape, outlet: false };
  if (f.kind === 'rain-garden') return { dz: -Math.min(0.5, f.depthFt) * shape, outlet: d < f.sizeFt * 0.6, surface: 'mulch' };
  return { dz: 0, outlet: d < Math.max(0.75, f.sizeFt * 0.5) }; // drain
}

/** Binary min-heap on (height, index) for the priority flood. */
class Heap {
  private h: number[] = [];
  private i: number[] = [];
  get size() { return this.h.length; }
  push(height: number, idx: number) {
    const h = this.h, ix = this.i;
    let n = h.length; h.push(height); ix.push(idx);
    while (n > 0) {
      const p = (n - 1) >> 1;
      if (h[p] <= h[n]) break;
      [h[p], h[n]] = [h[n], h[p]]; [ix[p], ix[n]] = [ix[n], ix[p]]; n = p;
    }
  }
  pop(): [number, number] {
    const h = this.h, ix = this.i;
    const top: [number, number] = [h[0], ix[0]];
    const lh = h.pop()!, li = ix.pop()!;
    if (h.length) {
      h[0] = lh; ix[0] = li;
      let n = 0;
      for (;;) {
        const l = 2 * n + 1, r = l + 1;
        let m = n;
        if (l < h.length && h[l] < h[m]) m = l;
        if (r < h.length && h[r] < h[m]) m = r;
        if (m === n) break;
        [h[m], h[n]] = [h[n], h[m]]; [ix[m], ix[n]] = [ix[n], ix[m]]; n = m;
      }
    }
    return top;
  }
}

const NB = [[1, 0], [-1, 0], [0, 1], [0, -1], [1, 1], [1, -1], [-1, 1], [-1, -1]] as const;

/**
 * Run the watershed model for one rain scenario.
 *
 * @param input - Property size, terrain, items, fixes and scenario
 * @returns Per-cell ground/water/flow/erosion grids, puddles and a summary
 */
export function analyzeWatershed(input: HydrologyInput): HydrologyResult {
  const { widthFt: W, depthFt: D, terrain, items, fixes = [], scenario } = input;
  const cellFt = input.cellFt ?? Math.max(1, Math.ceil(Math.sqrt((W * D) / 20000)));
  const cols = Math.max(2, Math.round(W / cellFt)), rows = Math.max(2, Math.round(D / cellFt));
  const n = cols * rows;
  const area = cellFt * cellFt;
  const rain = RAIN_SCENARIOS[scenario];
  const ground = new Float32Array(n);
  const runoff = new Float32Array(n); // ft³ generated in the cell
  const erod = new Float32Array(n);
  const outlet = new Uint8Array(n);

  const ponds = items.filter((i) => i.type === 'pond');
  const roofs = items.filter((i) => i.kind === 'hardware' || i.type === 'building');
  const inside = (i: HydrologyInput['items'][number], x: number, y: number) =>
    x >= i.x && x <= i.x + i.width && y >= i.y && y <= i.y + i.depth;

  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const k = r * cols + c;
      const x = (c + 0.5) * cellFt, y = (r + 0.5) * cellFt;
      let z = heightAt(terrain, x, y);
      let surface: TerrainKind | 'roof' = zoneAt(terrain, x, y)?.kind ?? input.baseSurface ?? 'lawn';
      if (roofs.some((i) => inside(i, x, y))) surface = 'roof';
      const baseAt = (px: number, py: number) => heightAt(terrain, px, py);
      for (const f of fixes) {
        const e = fixEffect(f, x, y, z, baseAt);
        z += e.dz;
        if (e.outlet) outlet[k] = 1;
        if (e.surface && e.dz !== 0) surface = e.surface;
      }
      if (ponds.some((i) => inside(i, x, y))) outlet[k] = 1;
      ground[k] = z;
      const s = SURFACE_HYDRO[surface];
      runoff[k] = (Math.max(0, rain.inPerHr - s.infilInHr) * rain.hours / 12) * area;
      erod[k] = s.erodibility;
      if (r === 0 || c === 0 || r === rows - 1 || c === cols - 1) outlet[k] = 1; // water leaves the property
    }
  }

  // 1) Priority flood: filled[k] = spill level of the depression containing k.
  //    drainE is the same surface nudged by a tiny epsilon per step, so every cell has a
  //    strictly lower neighbour on its way to an outlet (flow crosses flats and full ponds).
  const filled = new Float32Array(ground);
  const drainE = new Float64Array(ground);
  const done = new Uint8Array(n);
  const heap = new Heap();
  for (let k = 0; k < n; k++) if (outlet[k]) { heap.push(filled[k], k); done[k] = 1; }
  while (heap.size) {
    const [h, k] = heap.pop();
    const hE = drainE[k];
    const r = Math.floor(k / cols), c = k % cols;
    for (const [dc, dr] of NB) {
      const cc = c + dc, rr = r + dr;
      if (cc < 0 || rr < 0 || cc >= cols || rr >= rows) continue;
      const j = rr * cols + cc;
      if (done[j]) continue;
      done[j] = 1;
      filled[j] = Math.max(filled[j], h);
      drainE[j] = Math.max(drainE[j], hE + 1e-5);
      heap.push(filled[j], j);
    }
  }

  // 2) D8 flow direction on the raw ground (steepest descent); pits have none.
  const down = new Int32Array(n).fill(-1);
  const slope = new Float32Array(n);
  for (let k = 0; k < n; k++) {
    const r = Math.floor(k / cols), c = k % cols;
    let best = -1, bestDrop = 0;
    for (const [dc, dr] of NB) {
      const cc = c + dc, rr = r + dr;
      if (cc < 0 || rr < 0 || cc >= cols || rr >= rows) continue;
      const j = rr * cols + cc;
      const drop = (ground[k] - ground[j]) / (Math.hypot(dc, dr) * cellFt);
      if (drop > bestDrop) { bestDrop = drop; best = j; }
    }
    slope[k] = bestDrop;
    down[k] = outlet[k] ? -1 : best;
  }

  // 3) Depressions: connected cells where the fill is above the ground; each pit's
  //    catchment (cells whose downhill path ends in it) supplies its water.
  const depId = new Int32Array(n).fill(-1);
  const deps: number[][] = [];
  for (let k = 0; k < n; k++) {
    if (depId[k] >= 0 || filled[k] - ground[k] < 1e-4 || outlet[k]) continue;
    const id = deps.length, cells: number[] = [], stack = [k];
    depId[k] = id;
    while (stack.length) {
      const q = stack.pop()!;
      cells.push(q);
      const r = Math.floor(q / cols), c = q % cols;
      for (const [dc, dr] of NB) {
        const cc = c + dc, rr = r + dr;
        if (cc < 0 || rr < 0 || cc >= cols || rr >= rows) continue;
        const j = rr * cols + cc;
        if (depId[j] < 0 && !outlet[j] && filled[j] - ground[j] >= 1e-4 && Math.abs(filled[j] - filled[k]) < 1e-3) {
          depId[j] = id; stack.push(j);
        }
      }
    }
    deps.push(cells);
  }
  const terminal = new Int32Array(n).fill(-2); // memo: where a cell's water ends up
  const endOf = (k: number): number => {
    const path: number[] = [];
    let q = k;
    while (terminal[q] === -2 && down[q] >= 0 && depId[q] < 0 && path.length < n) { path.push(q); q = down[q]; }
    const end = terminal[q] !== -2 ? terminal[q] : depId[q] >= 0 ? depId[q] : -1;
    terminal[q] = end;
    for (const p of path) terminal[p] = end;
    return end;
  };
  const inflow = new Float64Array(deps.length);
  for (let k = 0; k < n; k++) { const e = endOf(k); if (e >= 0) inflow[e] += runoff[k]; }

  const water = new Float32Array(n);
  const puddles: Puddle[] = [];
  deps.forEach((cells, id) => {
    const spill = filled[cells[0]];
    const capacity = cells.reduce((s, q) => s + (spill - ground[q]) * area, 0);
    const vol = Math.min(inflow[id], capacity);
    if (vol <= 0) return;
    let lo = Math.min(...cells.map((q) => ground[q])), hi = spill;
    for (let it = 0; it < 40; it++) {
      const mid = (lo + hi) / 2;
      const v = cells.reduce((s, q) => s + Math.max(0, mid - ground[q]) * area, 0);
      if (v > vol) hi = mid; else lo = mid;
    }
    let wet = 0, maxD = 0, sx = 0, sy = 0;
    for (const q of cells) {
      const d = Math.max(0, lo - ground[q]);
      water[q] = d;
      if (d > WET_FT) { wet++; maxD = Math.max(maxD, d); sx += q % cols; sy += Math.floor(q / cols); }
    }
    if (wet) {
      puddles.push({
        id, cells: wet, areaSqFt: wet * area, maxDepthIn: maxD * 12, volumeGal: vol * GAL_PER_FT3,
        x: (sx / wet + 0.5) * cellFt, y: (sy / wet + 0.5) * cellFt,
      });
    }
  });

  // 4) Flow accumulation on the drainable surface (water crosses flats and full ponds).
  const fdown = new Int32Array(n).fill(-1);
  for (let k = 0; k < n; k++) {
    if (outlet[k]) continue;
    const r = Math.floor(k / cols), c = k % cols;
    let best = -1, bestDrop = 0;
    for (const [dc, dr] of NB) {
      const cc = c + dc, rr = r + dr;
      if (cc < 0 || rr < 0 || cc >= cols || rr >= rows) continue;
      const j = rr * cols + cc;
      const drop = (drainE[k] - drainE[j]) / Math.hypot(dc, dr);
      if (drop > bestDrop) { bestDrop = drop; best = j; }
    }
    fdown[k] = best;
  }
  const order = Array.from({ length: n }, (_, k) => k).sort((a, b) => drainE[b] - drainE[a]);
  const flow = new Float32Array(runoff);
  for (const k of order) { const j = fdown[k]; if (j >= 0 && j !== k) flow[j] += flow[k]; }

  // 5) Erosion: erodibility x sqrt(flow) x slope; standing water does not erode.
  const erosion = new Uint8Array(n);
  let highCells = 0, modCells = 0, eTotal = 0;
  for (let k = 0; k < n; k++) {
    if (water[k] > WET_FT || outlet[k]) continue;
    const e = erod[k] * Math.sqrt(flow[k]) * slope[k];
    eTotal += e;
    if (e > 0.6) { erosion[k] = 2; highCells++; } else if (e > 0.2) { erosion[k] = 1; modCells++; }
  }

  const runoffFt3 = runoff.reduce((s, v) => s + v, 0);
  const pondedFt3 = water.reduce((s, v) => s + v * area, 0);
  return {
    cols, rows, cellFt, ground, water, flow, erosion, down: fdown,
    puddles: puddles.sort((a, b) => b.volumeGal - a.volumeGal),
    summary: {
      rainIn: rain.inPerHr * rain.hours,
      runoffGal: runoffFt3 * GAL_PER_FT3,
      pondedGal: pondedFt3 * GAL_PER_FT3,
      puddleAreaSqFt: puddles.reduce((s, p) => s + p.areaSqFt, 0),
      maxPuddleDepthIn: puddles.reduce((m, p) => Math.max(m, p.maxDepthIn), 0),
      erosionHighSqFt: highCells * area,
      erosionModerateSqFt: modCells * area,
      erosionIndexTotal: eTotal,
      source: terrain.elevationGrid ? 'robot-grid' : 'hand-drawn',
    },
  };
}

/**
 * Compare a plan with fixes against the current yard.
 *
 * @returns Puddle and erosion changes; `erosionWorse` flags a plan that trades puddles for erosion
 */
export function compareWatershed(before: HydrologyResult, after: HydrologyResult) {
  const b = before.summary, a = after.summary;
  const pct = (x: number, y: number) => (y > 0 ? ((x - y) / y) * 100 : x > 0 ? 100 : 0);
  return {
    puddleAreaChangeSqFt: a.puddleAreaSqFt - b.puddleAreaSqFt,
    pondedChangeGal: a.pondedGal - b.pondedGal,
    erosionHighChangeSqFt: a.erosionHighSqFt - b.erosionHighSqFt,
    erosionIndexChangePct: pct(a.erosionIndexTotal, b.erosionIndexTotal),
    // Worse = more ground actually moves into a risk class (the index alone moves with any
    // change in where water runs, which is expected when draining a puddle).
    erosionWorse: a.erosionHighSqFt > b.erosionHighSqFt
      || a.erosionHighSqFt + a.erosionModerateSqFt > b.erosionHighSqFt + b.erosionModerateSqFt + 2 * after.cellFt * after.cellFt,
  };
}
