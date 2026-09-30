// exclusionZones.ts - where robots must not go, built from the property layout and sent to
// robots over MQTT (retained tc/{deviceId}/cfg/zones) so they enforce it on-board, offline too.
//
//   no-go    hard stop: No-Go Zone obstacles (restricted areas, septic, kids' play area...)
//   keep-out obstacle footprints + a buffer (trees, ponds, rocks, fences, buildings)
//   no-laser laser forbidden but driving allowed: every animal housing plus a safety buffer,
//            so a laser robot can never fire near animals even if a person approves a weed.
//
// Units: property feet, origin top-left, x right, y down (same as PropertyItem).
// firmware/jetson-nano/zones.py enforces the same payload on the robot.
import type { PropertyItem, PropertyLayoutState } from '../../components/property/propertyLayoutStore';
import { effectiveBoundary, pathLeavesBoundary, type BoundarySource, type Pt } from './boundary';

export type ZoneKind = 'no-go' | 'keep-out' | 'no-laser';

export interface ExclusionZone {
  id: string;
  name: string;
  kind: ZoneKind;
  /** Polygon corners in property feet (the footprint grown by the buffer). */
  poly: Array<[number, number]>;
}

export interface ZonesPayload {
  v: 1;
  seq: number;
  units: 'ft';
  /** The robot's own footprint on the property, so it can map its local frame to property feet. */
  self?: { itemId: string; x: number; y: number; width: number; depth: number };
  zones: ExclusionZone[];
  /**
   * The property boundary: the robot refuses any motion (and any laser) outside `poly` or within
   * `marginFt` of its edge (lib/yard/boundary.ts). Robots without it only know the zones.
   */
  boundary?: { poly: Pt[]; marginFt: number; source: BoundarySource };
  ts: number;
}

const KEEP_OUT_TYPES = new Set(['tree', 'rock', 'pond', 'fence', 'building', 'bush']);
/** Types that house animals: the laser is never allowed near them. */
const ANIMAL_HOUSING = new Set(['chicken-tender', 'roaming-roost', 'duck-dock', 'goat-guardian', 'bunny-burrow', 'turkey-tower', 'pigeon-palace']);

export const BUFFER_FT: Record<ZoneKind, number> = { 'no-go': 0, 'keep-out': 1, 'no-laser': 6 };

const rect = (it: PropertyItem, pad: number): Array<[number, number]> => [
  [it.x - pad, it.y - pad], [it.x + it.width + pad, it.y - pad],
  [it.x + it.width + pad, it.y + it.depth + pad], [it.x - pad, it.y + it.depth + pad],
];

/**
 * Exclusion zones for a property.
 *
 * @param layout - Saved property layout
 * @returns Zones ordered hard-first (no-go, keep-out, no-laser)
 */
export function zonesFromLayout(layout: PropertyLayoutState): ExclusionZone[] {
  const zones: ExclusionZone[] = [];
  for (const it of layout.items) {
    let kind: ZoneKind | null = null;
    if (it.type === 'no-go-zone') kind = 'no-go';
    else if (it.kind === 'obstacle' && KEEP_OUT_TYPES.has(it.type)) kind = 'keep-out';
    else if (ANIMAL_HOUSING.has(it.type)) kind = 'no-laser';
    if (kind) zones.push({ id: it.id, name: it.name, kind, poly: rect(it, BUFFER_FT[kind]) });
  }
  const order: ZoneKind[] = ['no-go', 'keep-out', 'no-laser'];
  return zones.sort((a, b) => order.indexOf(a.kind) - order.indexOf(b.kind));
}

/** Ray-casting point-in-polygon. */
export function inPoly(x: number, y: number, poly: Array<[number, number]>): boolean {
  let inside = false;
  for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
    const [xi, yi] = poly[i], [xj, yj] = poly[j];
    if ((yi > y) !== (yj > y) && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) inside = !inside;
  }
  return inside;
}

/**
 * Zone blocking a point, if any. Driving is blocked by no-go and keep-out; lasing also by no-laser.
 *
 * @param action - 'drive' (any motion) or 'laser'
 */
export function blockingZone(zones: ExclusionZone[], x: number, y: number, action: 'drive' | 'laser' = 'drive', ignoreId?: string): ExclusionZone | undefined {
  return zones.find((z) => z.id !== ignoreId && (action === 'laser' || z.kind !== 'no-laser') && inPoly(x, y, z.poly));
}

/**
 * First zone a path enters (sampled every 0.5 ft), for route checks before sending a patrol.
 *
 * @returns The zone and the index of the path segment that enters it, or undefined when clear
 */
export function pathConflict(zones: ExclusionZone[], path: Array<{ x: number; y: number }>, ignoreId?: string): { zone: ExclusionZone; segment: number } | undefined {
  for (let i = 1; i < path.length; i++) {
    const a = path[i - 1], b = path[i];
    const steps = Math.max(1, Math.ceil(Math.hypot(b.x - a.x, b.y - a.y) / 0.5));
    for (let s = 0; s <= steps; s++) {
      const t = s / steps;
      const z = blockingZone(zones, a.x + (b.x - a.x) * t, a.y + (b.y - a.y) * t, 'drive', ignoreId);
      if (z) return { zone: z, segment: i - 1 };
    }
  }
  return undefined;
}

/**
 * Items that move on the property and receive zones + the boundary: mobile coops, rovers,
 * native robot mowers, custom builds and the gantry robots.
 * FIX(2026-09-30): rovers, mowers and custom builds were missing, so they got no zones at all.
 */
export const ZONE_ROBOT_TYPES = new Set(['roaming-roost', 'weed-rover', 'robot-mower', 'community-custom', 'farmbot-genesis', 'farmbot-genesis-xl', 'rail-module']);

/** MQTT payload for one robot (its own footprint is not a zone for itself). */
export function zonesPayload(layout: PropertyLayoutState, robot: PropertyItem, seq = Date.now()): ZonesPayload {
  return {
    v: 1, seq, units: 'ft', ts: Date.now(),
    self: { itemId: robot.id, x: robot.x, y: robot.y, width: robot.width, depth: robot.depth },
    zones: zonesFromLayout(layout).filter((z) => z.id !== robot.id),
    boundary: (({ poly, marginFt, source }) => ({ poly, marginFt, source }))(effectiveBoundary(layout)),
  };
}

/**
 * Route check for a patrol path: the first exclusion zone it enters, or the property edge
 * (as a no-go "zone") where it leaves the boundary.
 */
export function routeConflict(layout: PropertyLayoutState, path: Array<{ x: number; y: number }>, ignoreId?: string): { zone: ExclusionZone; segment: number } | undefined {
  const hit = pathConflict(zonesFromLayout(layout), path, ignoreId);
  if (hit) return hit;
  const out = pathLeavesBoundary(effectiveBoundary(layout), path);
  return out ? { zone: { id: 'boundary', name: 'Property boundary', kind: 'no-go', poly: [] }, segment: out.segment } : undefined;
}
