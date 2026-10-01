// farmAutopilot.ts - the demo's "whole farm running by itself" in the 3D viewer.
//
// When the demo is seeded (and no hub is configured), every unit on the property keeps working:
//   mobile robots   drive their routes (rover: coverage lanes, mower: stripes near its dock,
//                   Roaming Roost: its patrol path or a loop round its spot)
//   garden beds     the tool head sweeps the bed (plant-health scan)
//   stations        coop, duck dock, WatchTower cycle through their automatic jobs
// Routes obey the same rules as real robots: they stay inside the property boundary and its
// margin and never cross a no-go / keep-out zone (gaps are bridged with a grid path search).
// It is purely visual and time-based: no alerts, no detections, no hardware. The mower only
// mows when the demo mower's animal-safety interlock allows it (lib/mower/mowerSim.ts).
import type { HardwareType, PropertyItem, PropertyLayoutState } from '../../components/property/propertyLayoutStore';
import { MOBILE_ROBOT_TYPES } from '../../components/property/propertyLayoutStore';
import { effectiveBoundary, insideBoundary } from '../yard/boundary';
import { blockingZone, zonesFromLayout } from '../yard/exclusionZones';
import { coverageRoute, headingTo } from '../yard/roverPlan';
import { patternPaths } from '../mower/patterns';
import { mowerWorkArea } from '../mower/mower';
import { WEED_BED_TYPES } from '../yard/yardTypes';

export interface Pt { x: number; y: number }
export type Blocked = (x: number, y: number) => boolean;

export const AUTOPILOT_KEY = 'tendercells_demo_autopilot_v1';
export const MM_PER_FT = 304.8;

/** Owner's on/off choice for the demo autopilot (default on). */
export function autopilotEnabled(): boolean {
  try { return localStorage.getItem(AUTOPILOT_KEY) !== 'off'; } catch { return true; }
}
export function setAutopilotEnabled(on: boolean): void {
  try { localStorage.setItem(AUTOPILOT_KEY, on ? 'on' : 'off'); } catch { /* storage unavailable */ }
}

export interface Route { points: Pt[]; cum: number[]; lengthFt: number; speedFtS: number }
export interface AutopilotUnit {
  itemId: string;
  name: string;
  type: string;
  role: 'drive' | 'bed' | 'station';
  /** Drive units: closed loop in property feet. Beds: serpentine in bed mm. */
  route?: Route;
  /** Jobs cycled through (one every JOB_SECONDS). */
  jobs: string[];
  deviceId?: string;
}
export interface AutopilotPlan { units: AutopilotUnit[] }

const JOB_SECONDS = 12;
const STATION_JOBS: Record<string, string[]> = {
  'chicken-tender': ['Monitoring the flock', 'Collecting eggs (arm)', 'Sweeping the floor (gantry)', 'Topping up feed', 'Checking water'],
  'duck-dock': ['Filtering pond water', 'Monitoring ducks', 'Topping up feed'],
  watchtower: ['Scanning 360° for predators', 'Solar charging · still scanning'],
  'predator-monitor': ['Scanning 360° for predators'],
  greenhouse: ['Venting to 75 °F', 'Misting seedlings'],
  'bunny-burrow': ['Holding 65 °F', 'Topping up hay and water'],
  'goat-guardian': ['Monitoring the herd', 'Filling the water trough'],
  'turkey-tower': ['Monitoring the flock', 'Topping up feed'],
  'pigeon-palace': ['Counting birds home', 'Topping up feed and grit'],
};
const DRIVE_JOBS: Record<string, string[]> = {
  'roaming-roost': ['Moving the flock to fresh grass'],
  'weed-rover': ['Weed scan · you approve each weed', 'Checking water points'],
  'robot-mower': ['Mowing stripes'],
  'community-custom': ['Patrolling'],
};
const SPEED_FT_S: Record<string, number> = { 'roaming-roost': 0.6, 'weed-rover': 2, 'robot-mower': 1.6, 'community-custom': 1.2 };

// ── routes ───────────────────────────────────────────────────────────────────
function makeRoute(points: Pt[], speedFtS: number): Route {
  const cum = [0];
  for (let i = 1; i <= points.length; i++) {
    const a = points[i - 1], b = points[i % points.length];
    cum.push(cum[i - 1] + Math.hypot(b.x - a.x, b.y - a.y));
  }
  return { points, cum, lengthFt: cum[cum.length - 1], speedFtS };
}

/** Where a looping route puts the unit after tSec: position and compass heading (0 = up the map). */
export function poseAt(r: Route, tSec: number): { x: number; y: number; headingDeg: number } {
  const n = r.points.length;
  if (n === 1 || r.lengthFt <= 0) return { ...r.points[0], headingDeg: 0 };
  const d = ((tSec * r.speedFtS) % r.lengthFt + r.lengthFt) % r.lengthFt;
  let lo = 0, hi = n - 1;
  while (lo < hi) { const mid = (lo + hi + 1) >> 1; if (r.cum[mid] <= d) lo = mid; else hi = mid - 1; }
  const a = r.points[lo], b = r.points[(lo + 1) % n];
  const seg = r.cum[lo + 1] - r.cum[lo];
  const k = seg > 0 ? (d - r.cum[lo]) / seg : 0;
  return { x: a.x + (b.x - a.x) * k, y: a.y + (b.y - a.y) * k, headingDeg: headingTo(a, b) };
}

const segmentClear = (a: Pt, b: Pt, blocked: Blocked) => {
  const n = Math.max(1, Math.ceil(Math.hypot(b.x - a.x, b.y - a.y) / 0.5));
  for (let i = 0; i <= n; i++) if (blocked(a.x + ((b.x - a.x) * i) / n, a.y + ((b.y - a.y) * i) / n)) return false;
  return true;
};

/**
 * Shortest drivable path from a to b on a 1-ft grid (8 neighbours), avoiding blocked cells.
 *
 * @returns Points after `a` up to and including `b`, or null when b cannot be reached
 */
export function findPath(a: Pt, b: Pt, blocked: Blocked, widthFt: number, depthFt: number): Pt[] | null {
  const cols = Math.ceil(widthFt) + 1, rows = Math.ceil(depthFt) + 1;
  const idx = (c: number, r: number) => r * cols + c;
  const free = (c: number, r: number) => c >= 0 && r >= 0 && c < cols && r < rows && !blocked(c, r);
  const start = idx(Math.round(a.x), Math.round(a.y)), goal = idx(Math.round(b.x), Math.round(b.y));
  if (!free(goal % cols, Math.floor(goal / cols))) return null;
  const g = new Float64Array(cols * rows).fill(Infinity);
  const from = new Int32Array(cols * rows).fill(-1);
  const closed = new Uint8Array(cols * rows);
  const h = (i: number) => Math.hypot((i % cols) - (goal % cols), Math.floor(i / cols) - Math.floor(goal / cols));
  // Binary heap of [f, index].
  const heap: Array<[number, number]> = [];
  const push = (e: [number, number]) => {
    heap.push(e);
    for (let i = heap.length - 1; i > 0;) { const p = (i - 1) >> 1; if (heap[p][0] <= heap[i][0]) break; [heap[p], heap[i]] = [heap[i], heap[p]]; i = p; }
  };
  const pop = () => {
    const top = heap[0], last = heap.pop()!;
    if (heap.length) {
      heap[0] = last;
      for (let i = 0; ;) {
        const l = 2 * i + 1, r = l + 1; let m = i;
        if (l < heap.length && heap[l][0] < heap[m][0]) m = l;
        if (r < heap.length && heap[r][0] < heap[m][0]) m = r;
        if (m === i) break;
        [heap[m], heap[i]] = [heap[i], heap[m]]; i = m;
      }
    }
    return top;
  };
  g[start] = 0; push([h(start), start]);
  while (heap.length) {
    const [, cur] = pop();
    if (cur === goal) break;
    if (closed[cur]) continue;
    closed[cur] = 1;
    const cc = cur % cols, cr = Math.floor(cur / cols);
    for (let dc = -1; dc <= 1; dc++) for (let dr = -1; dr <= 1; dr++) {
      if ((!dc && !dr) || !free(cc + dc, cr + dr)) continue;
      if (dc && dr && (!free(cc + dc, cr) || !free(cc, cr + dr))) continue; // no corner cutting
      const n = idx(cc + dc, cr + dr), ng = g[cur] + (dc && dr ? Math.SQRT2 : 1);
      if (ng < g[n]) { g[n] = ng; from[n] = cur; push([ng + h(n), n]); }
    }
  }
  if (from[goal] === -1 && goal !== start) return null;
  const out: Pt[] = [];
  for (let i = goal; i !== start && i !== -1; i = from[i]) out.push({ x: i % cols, y: Math.floor(i / cols) });
  out.reverse();
  out[out.length - 1] = b;
  return out;
}

/** Join route points into a drivable closed loop: straight where clear, round obstacles where not. */
export function connectLoop(points: Pt[], blocked: Blocked, widthFt: number, depthFt: number): Pt[] {
  const pts = points.filter((p) => !blocked(p.x, p.y));
  if (pts.length < 2) return pts;
  const out: Pt[] = [pts[0]];
  for (let i = 1; i <= pts.length; i++) {
    const a = out[out.length - 1], b = pts[i % pts.length];
    if (segmentClear(a, b, blocked)) { if (i < pts.length) out.push(b); continue; }
    const path = findPath(a, b, blocked, widthFt, depthFt);
    if (!path) continue; // unreachable (walled-off pocket): leave it out
    out.push(...(i < pts.length ? path : path.slice(0, -1)));
  }
  return out;
}

function driveRoute(item: PropertyItem, layout: PropertyLayoutState): Pt[] {
  const cx = item.x + item.width / 2, cy = item.y + item.depth / 2;
  if (item.patrolPath && item.patrolPath.length > 1) return item.patrolPath;
  if (item.type === 'weed-rover') {
    const b = effectiveBoundary(layout);
    const xs = b.poly.map((p) => p[0]), ys = b.poly.map((p) => p[1]);
    const area = { x: Math.min(...xs), y: Math.min(...ys), width: Math.max(...xs) - Math.min(...xs), depth: Math.max(...ys) - Math.min(...ys) };
    return [{ x: cx, y: cy }, ...coverageRoute(area, [], 10, 4)];
  }
  if (item.type === 'robot-mower') {
    const area = mowerWorkArea(layout, item);
    return [{ x: cx, y: cy }, ...patternPaths(area, 'stripes', 0, 1, 3).flat()];
  }
  // Roaming Roost / custom robot: a slow octagon round where it is parked.
  const r = item.type === 'roaming-roost' ? 9 : 6;
  return Array.from({ length: 8 }, (_, i) => ({ x: cx + r * Math.cos((i * Math.PI) / 4), y: cy + r * Math.sin((i * Math.PI) / 4) }));
}

/** Serpentine over a garden bed in bed mm (x along the long side), like a scan pass. */
function bedRoute(item: PropertyItem): Pt[] {
  const len = Math.max(item.width, item.depth) * MM_PER_FT, wid = Math.min(item.width, item.depth) * MM_PER_FT;
  const pts: Pt[] = [];
  const lanes = 5;
  for (let i = 0; i < lanes; i++) {
    const y = wid * (0.1 + (0.8 * i) / (lanes - 1));
    const row = [{ x: len * 0.08, y }, { x: len * 0.92, y }];
    pts.push(...(i % 2 ? row.reverse() : row));
  }
  return pts;
}

/**
 * Plan every unit's work for the demo farm.
 *
 * @param layout - The property layout shown in the viewer
 * @returns One entry per hardware item: routes for robots and beds, job lists for stations
 */
export function buildAutopilot(layout: PropertyLayoutState): AutopilotPlan {
  const { widthFt: W, depthFt: D } = layout.property;
  const zones = zonesFromLayout(layout);
  const boundary = effectiveBoundary(layout);
  const units: AutopilotUnit[] = [];
  for (const item of layout.items) {
    if (item.kind !== 'hardware') continue;
    const base = { itemId: item.id, name: item.name, type: item.type, deviceId: item.deviceId };
    if (MOBILE_ROBOT_TYPES.has(item.type as HardwareType)) {
      const blocked: Blocked = (x, y) => !insideBoundary(boundary, x, y) || !!blockingZone(zones, x, y, 'drive', item.id);
      const loop = connectLoop(driveRoute(item, layout), blocked, W, D);
      if (loop.length > 1) units.push({ ...base, role: 'drive', route: makeRoute(loop, SPEED_FT_S[item.type] ?? 1), jobs: DRIVE_JOBS[item.type] ?? ['Patrolling'] });
    } else if (WEED_BED_TYPES.has(item.type)) {
      units.push({ ...base, role: 'bed', route: makeRoute(bedRoute(item), 150 /* mm/s */), jobs: ['Plant-health scan'] });
    } else if (STATION_JOBS[item.type]) {
      units.push({ ...base, role: 'station', jobs: STATION_JOBS[item.type] });
    }
  }
  return { units };
}

/** The job a unit is doing at tSec (stations cycle through theirs). */
export const jobAt = (u: AutopilotUnit, tSec: number): string =>
  u.jobs[Math.floor(Math.max(0, tSec) / JOB_SECONDS) % u.jobs.length];
