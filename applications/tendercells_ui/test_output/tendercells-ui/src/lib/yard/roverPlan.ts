// roverPlan.ts - route planning for a property-wide weed patrol on a rover (pure, tested).
//
// The rover drives lanes across the property like a lawn mower, one camera swath apart,
// and never plans a point inside a no-go or keep-out zone (exclusionZones.ts) or outside the
// property boundary (boundary.ts). A person can
// instead draw the route (PropertyItem.patrolPath). Detections are placed on the property
// from the rover pose: the camera frame is centred ahead of the rover.
// firmware/jetson-nano/rover_patrol.py uses the same geometry on the real robot.
import { blockingZone, type ExclusionZone } from './exclusionZones';

export interface Pt { x: number; y: number }
/** Rover pose in property feet; heading degrees clockwise from map north (up = -y). */
export interface RoverPose { xFt: number; yFt: number; headingDeg: number }
export interface Area { x: number; y: number; width: number; depth: number }

/** Camera swath the lanes are spaced by (ft) and how far ahead of the rover it looks. */
export const ROVER_CAMERA = { swathFt: 4, aheadFt: 1.5, frameFt: { along: 3, across: 4 } };

/**
 * Lawn-mower coverage of an area, skipping everything a zone blocks.
 *
 * @param area - Region to cover (property ft)
 * @param zones - Exclusion zones (drive checks only; no-laser zones may be driven through)
 * @param laneFt - Lane spacing (camera swath)
 * @param stepFt - Spacing of points along a lane
 * @param ignoreId - The rover's own item id (its parking spot is not an obstacle)
 */
/** Optional stay-inside test (the property boundary, lib/yard/boundary.ts): points it rejects are skipped. */
export type StayIn = (x: number, y: number) => boolean;

export function coverageRoute(area: Area, zones: ExclusionZone[], laneFt = ROVER_CAMERA.swathFt, stepFt = 2, ignoreId?: string, stayIn?: StayIn): Pt[] {
  const pts: Pt[] = [];
  let lane = 0;
  for (let y = area.y + laneFt / 2; y < area.y + area.depth; y += laneFt, lane++) {
    const row: Pt[] = [];
    for (let x = area.x + stepFt / 2; x < area.x + area.width; x += stepFt) {
      if (!blockingZone(zones, x, y, 'drive', ignoreId) && (!stayIn || stayIn(x, y))) row.push({ x: round(x), y: round(y) });
    }
    pts.push(...(lane % 2 ? row.reverse() : row));
  }
  return pts;
}

/** A hand-drawn route, densified to points every stepFt (blocked points removed). */
export function routeFromPath(path: Pt[], zones: ExclusionZone[], stepFt = 2, ignoreId?: string, stayIn?: StayIn): Pt[] {
  const out: Pt[] = [];
  for (let i = 1; i < path.length; i++) {
    const a = path[i - 1], b = path[i];
    const n = Math.max(1, Math.ceil(Math.hypot(b.x - a.x, b.y - a.y) / stepFt));
    for (let s = i === 1 ? 0 : 1; s <= n; s++) {
      const p = { x: round(a.x + ((b.x - a.x) * s) / n), y: round(a.y + ((b.y - a.y) * s) / n) };
      if (!blockingZone(zones, p.x, p.y, 'drive', ignoreId) && (!stayIn || stayIn(p.x, p.y))) out.push(p);
    }
  }
  return out;
}

/** Heading (deg clockwise from north / up) to drive from a to b; keeps `prev` when not moving. */
export function headingTo(a: Pt, b: Pt, prev = 0): number {
  const dx = b.x - a.x, dy = b.y - a.y;
  if (!dx && !dy) return prev;
  return (Math.atan2(dx, -dy) * 180 / Math.PI + 360) % 360;
}

/**
 * A point in the camera frame -> property feet.
 *
 * @param pose - Rover pose
 * @param forwardFt - Along the heading (positive = ahead)
 * @param rightFt - Across (positive = rover's right)
 */
export function frameToProperty(pose: RoverPose, forwardFt: number, rightFt: number): Pt {
  const h = (pose.headingDeg * Math.PI) / 180;
  // Forward unit vector (north = -y): (sin h, -cos h); right: (cos h, sin h).
  return {
    x: round(pose.xFt + Math.sin(h) * forwardFt + Math.cos(h) * rightFt),
    y: round(pose.yFt - Math.cos(h) * forwardFt + Math.sin(h) * rightFt),
  };
}

const round = (v: number) => Math.round(v * 100) / 100;
