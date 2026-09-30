// Transient "is this roaming-roost driving its patrol route right now" flag.
// Toggled by the Simulate Route button (PropertyLayoutBuilder) and consumed by
// the animation loop (Viewport3D). Not persisted - playback state, not layout
// data - mirrors the FARMBOT_POSITION_EVENT pattern in lib/farmbot/farmbotCloud.ts.
export const PATROL_SIM_EVENT = 'tc-patrol-sim';

export type PatrolSimDetail = { itemId: string; active: boolean };

const activePatrolSims = new Set<string>();

export function isPatrolSimActive(itemId: string): boolean {
  return activePatrolSims.has(itemId);
}

export function setPatrolSimActive(itemId: string, active: boolean): void {
  if (active) activePatrolSims.add(itemId);
  else activePatrolSims.delete(itemId);
  window.dispatchEvent(new CustomEvent<PatrolSimDetail>(PATROL_SIM_EVENT, { detail: { itemId, active } }));
}

export type PatrolPoint = { x: number; z: number };
export type PatrolPose = { x: number; z: number; heading: number };

/**
 * Where a rover following `points` (scene-space waypoints, 2+ required) should be
 * at `elapsedSec`, at a fixed duration per segment, looping forever. Pure/no DOM -
 * shared by Viewport3D's per-frame animation and this module's own tests, so the
 * "does the math move it right" question doesn't require a browser to answer.
 * `heading` is a Y-axis rotation (radians) facing the current direction of travel;
 * 0 when the rover hasn't moved yet (first frame of a repeated point).
 */
export function computePatrolPose(
  points: PatrolPoint[],
  elapsedSec: number,
  segmentSeconds = 2.5
): PatrolPose | null {
  if (points.length < 2 || segmentSeconds <= 0) return null;
  const segCount = points.length - 1;
  const segT = Math.max(0, elapsedSec) / segmentSeconds;
  const segIndex = Math.floor(segT) % segCount;
  const localT = segT - Math.floor(segT);
  const p0 = points[segIndex];
  const p1 = points[segIndex + 1];
  const x = p0.x + (p1.x - p0.x) * localT;
  const z = p0.z + (p1.z - p0.z) * localT;
  const dx = p1.x - p0.x;
  const dz = p1.z - p0.z;
  const heading = dx !== 0 || dz !== 0 ? Math.atan2(dx, dz) : 0;
  return { x, z, heading };
}
