// doorKinematics.ts - DoorCell V1.4 rack-and-pinion slide door math (pure, no three.js).
//
// The Chicken Tender showcase GLBs (CT_COOP_A_showcase_*.glb) keep every part in
// millimetres under one root node that carries scale 0.001 and a -90° X rotation
// (CAD Z-up -> glTF Y-up). In that mm parent space:
//   - the pop door (nodes "pop_door|...") slides along +X, 0 mm (closed) to 280 mm (open)
//   - the pinion (nodes "door_pinion|...") spins about its own axis, parallel to +Y
// Pinion: module 1.25, 18 teeth -> pitch radius = 1.25 * 18 / 2 = 11.25 mm,
// so the pinion turns travel / 11.25 radians for each mm of rack travel.

export const DOOR_TRAVEL_MIN_MM = 0;
export const DOOR_TRAVEL_MAX_MM = 280;
export const PINION_MODULE_MM = 1.25;
export const PINION_TEETH = 18;
export const PINION_PITCH_RADIUS_MM = (PINION_MODULE_MM * PINION_TEETH) / 2; // 11.25

export type Vec3 = [number, number, number];

export type DoorStatus = 'Closed' | 'Opening' | 'Closing' | 'Open' | 'Partly open' | 'E-STOP';

/** Clamp a requested door travel into the mechanical range. */
export function clampTravel(travelMm: number): number {
  if (!Number.isFinite(travelMm)) return DOOR_TRAVEL_MIN_MM;
  return Math.min(DOOR_TRAVEL_MAX_MM, Math.max(DOOR_TRAVEL_MIN_MM, travelMm));
}

/** Pinion rotation (radians, about +Y in mm parent space) for a given rack travel. */
export function pinionAngleRad(travelMm: number): number {
  return clampTravel(travelMm) / PINION_PITCH_RADIUS_MM;
}

/** Door node offset (mm, parent space) for a given travel: pure +X slide. */
export function doorOffsetMm(travelMm: number): Vec3 {
  return [clampTravel(travelMm), 0, 0];
}

/**
 * Node position that makes a rotation of `angle` about +Y pivot around `center`
 * instead of the node origin (the GLB bakes part geometry at assembly coordinates,
 * so every node origin is the coop origin). p = c - R_y(angle) * c.
 */
export function pivotPositionY(center: Vec3, angle: number): Vec3 {
  const [cx, , cz] = center;
  const cos = Math.cos(angle);
  const sin = Math.sin(angle);
  // R_y * c = (cx cos + cz sin, cy, -cx sin + cz cos)
  const rx = cx * cos + cz * sin;
  const rz = -cx * sin + cz * cos;
  return [cx - rx, 0, cz - rz];
}

/** Full set of transforms for the door + pinion at a given travel. */
export function doorTransforms(travelMm: number, pinionCenterMm: Vec3) {
  const travel = clampTravel(travelMm);
  const angle = pinionAngleRad(travel);
  return {
    travel,
    doorPosition: doorOffsetMm(travel),
    pinionAngle: angle,
    pinionPosition: pivotPositionY(pinionCenterMm, angle),
  };
}

/** Status text for the UI. */
export function doorStatus(travelMm: number, targetMm: number, estop: boolean): DoorStatus {
  if (estop) return 'E-STOP';
  const t = clampTravel(travelMm);
  const target = clampTravel(targetMm);
  const moving = Math.abs(target - t) > 0.05;
  if (moving) return target > t ? 'Opening' : 'Closing';
  if (t <= DOOR_TRAVEL_MIN_MM + 0.05) return 'Closed';
  if (t >= DOOR_TRAVEL_MAX_MM - 0.05) return 'Open';
  return 'Partly open';
}

/**
 * Move `current` toward `target` at `speedMmPerS` for `dtS` seconds (no overshoot).
 * Frozen (returns current) when E-STOP is latched.
 */
export function stepTravel(current: number, target: number, speedMmPerS: number, dtS: number, estop = false): number {
  if (estop) return current;
  const c = clampTravel(current);
  const t = clampTravel(target);
  const maxStep = Math.max(0, speedMmPerS) * Math.max(0, dtS);
  const delta = t - c;
  if (Math.abs(delta) <= maxStep) return t;
  return c + Math.sign(delta) * maxStep;
}
