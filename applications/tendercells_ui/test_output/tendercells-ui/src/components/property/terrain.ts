// terrain.ts - terrain zones and elevation for a property (shared by the 2D editor and 3D view).
//
// Users start in 2D: they paint rectangular terrain zones (lawn, mulch, gravel, garden
// soil ...) and drop elevation points (a mound, a dip, a slope's high side). Later a
// mapping robot (e.g. Roaming Roost driving the yard, a gantry probing a bed) can report
// an elevation grid and zone polygons with source 'robot'; the same heightAt() then uses
// the measured grid where it has one and the hand-drawn points everywhere else.
//
// Coordinates are property feet from the top-left corner (same as PropertyItem x/y).

export type TerrainKind =
  | 'lawn' | 'pasture' | 'dry' | 'snow'
  | 'garden-soil' | 'mulch' | 'gravel' | 'sand' | 'paved' | 'woods' | 'wetland';

export const TERRAIN_KINDS: Record<TerrainKind, { label: string; color: string }> = {
  lawn: { label: 'Lawn', color: '#3f7d3a' },
  pasture: { label: 'Pasture', color: '#6b8a44' },
  dry: { label: 'Dry dirt', color: '#8c7650' },
  snow: { label: 'Snow', color: '#e9eef2' },
  'garden-soil': { label: 'Garden soil', color: '#5a3d26' },
  mulch: { label: 'Mulch', color: '#7a4a2a' },
  gravel: { label: 'Gravel', color: '#9a968c' },
  sand: { label: 'Sand', color: '#d8c38f' },
  paved: { label: 'Paved / concrete', color: '#8f9193' },
  woods: { label: 'Woods floor', color: '#3b4a2a' },
  wetland: { label: 'Wet / boggy', color: '#4f6b4a' },
};

export type TerrainSource = 'user' | 'robot';

/** A region of the property with its own surface and (optionally) its own height. */
export interface TerrainZone {
  id: string;
  name: string;
  kind: TerrainKind;
  x: number;
  y: number;
  width: number;
  depth: number;
  /** Raise (+) or lower (-) the whole zone, feet. Edges blend over ~2 ft. */
  elevationFt?: number;
  /** Robot-mapped outline (property ft); when present it is drawn instead of the rect. */
  polygon?: Array<{ x: number; y: number }>;
  source?: TerrainSource;
}

/** A hand-placed height: a mound (+) or dip (-) that falls off smoothly to 0 at radiusFt. */
export interface ElevationPoint {
  id: string;
  x: number;
  y: number;
  heightFt: number;
  radiusFt: number;
  label?: string;
  source?: TerrainSource;
}

/** Measured heights on a regular grid (row-major), e.g. from a mapping robot. */
export interface ElevationGrid {
  originX: number;
  originY: number;
  stepFt: number;
  cols: number;
  rows: number;
  heightsFt: number[];
  source: TerrainSource;
  deviceId?: string;
  capturedAt?: number;
}

export interface TerrainLayers {
  terrainZones?: TerrainZone[];
  elevationPoints?: ElevationPoint[];
  elevationGrid?: ElevationGrid;
}

const EDGE_FT = 2;
export const MAX_ELEVATION_FT = 20;

const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v));
const smooth = (t: number) => t * t * (3 - 2 * t);

function pointInPolygon(x: number, y: number, poly: Array<{ x: number; y: number }>): boolean {
  let inside = false;
  for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
    const a = poly[i], b = poly[j];
    if ((a.y > y) !== (b.y > y) && x < ((b.x - a.x) * (y - a.y)) / (b.y - a.y) + a.x) inside = !inside;
  }
  return inside;
}

/** Topmost zone under a point (later zones win), or undefined. */
export function zoneAt(t: TerrainLayers, x: number, y: number): TerrainZone | undefined {
  const zones = t.terrainZones ?? [];
  for (let i = zones.length - 1; i >= 0; i--) {
    const z = zones[i];
    const inside = z.polygon && z.polygon.length >= 3
      ? pointInPolygon(x, y, z.polygon)
      : x >= z.x && x <= z.x + z.width && y >= z.y && y <= z.y + z.depth;
    if (inside) return z;
  }
  return undefined;
}

function gridHeight(g: ElevationGrid, x: number, y: number): number | undefined {
  const gx = (x - g.originX) / g.stepFt;
  const gy = (y - g.originY) / g.stepFt;
  if (gx < 0 || gy < 0 || gx > g.cols - 1 || gy > g.rows - 1 || g.heightsFt.length < g.cols * g.rows) return undefined;
  const x0 = Math.floor(gx), y0 = Math.floor(gy);
  const x1 = Math.min(g.cols - 1, x0 + 1), y1 = Math.min(g.rows - 1, y0 + 1);
  const fx = gx - x0, fy = gy - y0;
  const h = (c: number, r: number) => g.heightsFt[r * g.cols + c];
  return (h(x0, y0) * (1 - fx) + h(x1, y0) * fx) * (1 - fy) + (h(x0, y1) * (1 - fx) + h(x1, y1) * fx) * fy;
}

/**
 * Ground height (feet) at a property point: a robot-measured grid where it covers the
 * point, otherwise hand-placed elevation points plus raised/lowered zones.
 */
export function heightAt(t: TerrainLayers, x: number, y: number): number {
  if (t.elevationGrid) {
    const g = gridHeight(t.elevationGrid, x, y);
    if (g !== undefined) return clamp(g, -MAX_ELEVATION_FT, MAX_ELEVATION_FT);
  }
  let h = 0;
  for (const p of t.elevationPoints ?? []) {
    const d = Math.hypot(x - p.x, y - p.y);
    if (d < p.radiusFt) h += p.heightFt * 0.5 * (1 + Math.cos((Math.PI * d) / p.radiusFt));
  }
  for (const z of t.terrainZones ?? []) {
    if (!z.elevationFt || z.polygon) continue;
    // Distance inside the rect edge -> 0..1 blend over EDGE_FT.
    const inset = Math.min(x - z.x, z.x + z.width - x, y - z.y, z.y + z.depth - y);
    if (inset > -EDGE_FT) h += z.elevationFt * smooth(clamp((inset + EDGE_FT) / EDGE_FT, 0, 1));
  }
  return clamp(h, -MAX_ELEVATION_FT, MAX_ELEVATION_FT);
}

/** True when the property has any terrain beyond the single base preset. */
export const hasTerrainDetail = (t: TerrainLayers): boolean =>
  !!(t.terrainZones?.length || t.elevationPoints?.length || t.elevationGrid);

/** Clamp a zone into the property and fix bad numbers (from the editor or a robot). */
export function normalizeZone(z: TerrainZone, widthFt: number, depthFt: number): TerrainZone {
  const width = clamp(Number(z.width) || 1, 1, widthFt);
  const depth = clamp(Number(z.depth) || 1, 1, depthFt);
  return {
    ...z,
    kind: z.kind in TERRAIN_KINDS ? z.kind : 'lawn',
    x: clamp(Number(z.x) || 0, 0, widthFt - width),
    y: clamp(Number(z.y) || 0, 0, depthFt - depth),
    width, depth,
    elevationFt: z.elevationFt ? clamp(Number(z.elevationFt), -MAX_ELEVATION_FT, MAX_ELEVATION_FT) : undefined,
  };
}

/** Clamp an elevation point into the property. */
export function normalizePoint(p: ElevationPoint, widthFt: number, depthFt: number): ElevationPoint {
  return {
    ...p,
    x: clamp(Number(p.x) || 0, 0, widthFt),
    y: clamp(Number(p.y) || 0, 0, depthFt),
    heightFt: clamp(Number(p.heightFt) || 0, -MAX_ELEVATION_FT, MAX_ELEVATION_FT),
    radiusFt: clamp(Number(p.radiusFt) || 1, 1, Math.max(widthFt, depthFt)),
  };
}
