// weedSim.ts - in-browser weed patrol robot for the public demo (no API, no hardware).
//
// Behaves like firmware/jetson-nano/weed_patrol_service.py in simulation mode: a
// serpentine pass over the bed, detections published as weed_detected
// "pending_review", and a person approves each one (aim dot or laser burn) or
// rejects it. Burn goes through the same interlocks as the real robot: E-STOP,
// student mode (aim only), burn enabled, enclosure closed, cooldown.
import type { WeedRobotState, YardEvent } from './yardTypes';

export const WEED_SIM_EVENT = 'tendercells-weed-sim';
const STORAGE_KEY = 'tendercells_weed_sim_v1';
const MM_PER_FT = 304.8;
const FOV_MM = { x: 400, y: 300 };
const TICK_MS = 450;
const COOLDOWN_MS = 2000;

export interface WeedSimSafety { studentMode: boolean; burnEnabled: boolean; enclosureClosed: boolean }

interface SimBed {
  itemId: string;
  deviceId: string;
  lengthMm: number;
  widthMm: number;
  weeds: YardEvent[];
  robot: WeedRobotState;
  next: number;
  lastFire: number;
}

const beds = new Map<string, SimBed>();
const timers = new Map<string, ReturnType<typeof setInterval>>();

function load(): Record<string, { weeds: YardEvent[]; next: number; safety?: WeedSimSafety }> {
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}'); } catch { return {}; }
}

function save(): void {
  const out: Record<string, { weeds: YardEvent[]; next: number; safety: WeedSimSafety }> = {};
  beds.forEach((b, id) => {
    const { studentMode, burnEnabled, enclosureClosed } = b.robot.laser;
    out[id] = { weeds: b.weeds, next: b.next, safety: { studentMode, burnEnabled, enclosureClosed } };
  });
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(out)); } catch { /* private mode */ }
  window.dispatchEvent(new CustomEvent(WEED_SIM_EVENT));
}

/**
 * Get (or create) the simulated robot for a garden item.
 *
 * @param item - Layout item (size in feet); the bed's long side is FarmBot X
 * @param deviceId - Device id the flags are reported under
 */
export function simBed(item: { id: string; width: number; depth: number }, deviceId: string): SimBed {
  let bed = beds.get(item.id);
  if (bed) return bed;
  const saved = load()[item.id];
  const safety = saved?.safety ?? { studentMode: true, burnEnabled: false, enclosureClosed: true };
  bed = {
    itemId: item.id,
    deviceId,
    lengthMm: Math.max(item.width, item.depth) * MM_PER_FT,
    widthMm: Math.min(item.width, item.depth) * MM_PER_FT,
    weeds: saved?.weeds ?? [],
    next: saved?.next ?? 1,
    lastFire: 0,
    robot: {
      state: 'idle', mode: 'simulation', estop: false, error: null, ts: Date.now(),
      laser: { ...safety, pulseMs: 800, estop: false },
      pass: { running: false, pass: 0, passes: 0, waypoint: 0, waypoints: 0 },
    },
  };
  beds.set(item.id, bed);
  return bed;
}

/** Weeds from the last 10 minutes that are closed, plus every open one. */
export function simWeeds(itemId: string): YardEvent[] {
  const cutoff = Date.now() - 10 * 60_000;
  return (beds.get(itemId)?.weeds ?? []).filter(
    (w) => w.status === 'pending_review' || w.status === 'approved' || w.updatedAt > cutoff,
  );
}

function plan(bed: SimBed): { x: number; y: number }[] {
  const stepX = FOV_MM.x * 0.8, stepY = FOV_MM.y * 0.8;
  const pts: { x: number; y: number }[] = [];
  let row = 0;
  for (let y = FOV_MM.y / 2; y < bed.widthMm; y += stepY, row++) {
    const xs: number[] = [];
    for (let x = FOV_MM.x / 2; x < bed.lengthMm; x += stepX) xs.push(x);
    (row % 2 ? xs.reverse() : xs).forEach((x) => pts.push({ x, y }));
  }
  return pts;
}

/**
 * Start detection passes. Throws with the refusal reason, like the API's 409.
 *
 * @param itemId - Garden item
 * @param passes - 1-10
 */
export function startSimPass(itemId: string, passes: number): void {
  const bed = beds.get(itemId);
  if (!bed) throw new Error('Weed robot not found');
  if (bed.robot.estop) throw new Error('E-STOP is active');
  if (bed.robot.pass.running) throw new Error('A pass is already running');
  const n = Math.min(10, Math.max(1, Math.round(passes)));
  const waypoints = plan(bed);
  bed.robot = { ...bed.robot, state: 'scanning', error: null, pass: { running: true, pass: 1, passes: n, waypoint: 0, waypoints: waypoints.length } };
  let pass = 1, i = 0;
  const timer = setInterval(() => {
    if (bed.robot.estop) { clearInterval(timer); timers.delete(itemId); return; }
    const wp = waypoints[i];
    // A detection roughly every ~6 frames; later passes find fewer (already found / regrowth).
    if (wp && Math.random() < 0.16 / pass) {
      const x = Math.min(bed.lengthMm - 40, Math.max(40, wp.x + (Math.random() - 0.5) * FOV_MM.x));
      const y = Math.min(bed.widthMm - 40, Math.max(40, wp.y + (Math.random() - 0.5) * FOV_MM.y));
      const dup = bed.weeds.some((w) => w.bedMm && w.status === 'pending_review' && Math.hypot(w.bedMm.x - x, w.bedMm.y - y) < 60);
      if (!dup) {
        const now = Date.now();
        const confidence = Math.round((0.55 + Math.random() * 0.42) * 100) / 100;
        bed.weeds.push({
          id: `weed-${bed.next++}`, deviceId: bed.deviceId, itemId, type: 'weed_detected', status: 'pending_review',
          title: 'Weed', detail: `${Math.round(18 + Math.random() * 40)} mm · pass ${pass}`, confidence,
          bedMm: { x: Math.round(x), y: Math.round(y) }, ts: now, updatedAt: now,
        });
      }
    }
    i += 1;
    if (i >= waypoints.length) { i = 0; pass += 1; }
    if (pass > n) {
      clearInterval(timer); timers.delete(itemId);
      bed.robot = { ...bed.robot, state: 'idle', pass: { ...bed.robot.pass, running: false } };
    } else {
      bed.robot = { ...bed.robot, ts: Date.now(), pass: { ...bed.robot.pass, pass, waypoint: i + 1 } };
    }
    save();
  }, TICK_MS);
  timers.set(itemId, timer);
  save();
}

/**
 * Human decision for one weed. 'burn' is refused (throws) unless every interlock passes.
 *
 * @returns A short message describing what the robot did
 */
export function decideSimWeed(itemId: string, eventId: string, decision: 'aim' | 'burn' | 'reject'): string {
  const bed = beds.get(itemId);
  const weed = bed?.weeds.find((w) => w.id === eventId);
  if (!bed || !weed) throw new Error('No such weed detection');
  if (weed.status !== 'pending_review') throw new Error(`Weed is already ${weed.status}`);
  const now = Date.now();
  if (decision === 'reject') {
    Object.assign(weed, { status: 'rejected', detail: 'Rejected by reviewer', updatedAt: now });
    save();
    return 'Marked as not a weed';
  }
  const { laser } = bed.robot;
  if (bed.robot.estop) throw new Error('E-STOP is active');
  if (decision === 'aim') {
    Object.assign(weed, { detail: 'Aimed - aiming dot on target, awaiting decision', updatedAt: now });
    save();
    return 'Aiming dot on target';
  }
  if (laser.studentMode) throw new Error('Student mode - aiming dot only, the laser never fires');
  if (!laser.burnEnabled) throw new Error('Laser burn is not enabled on this robot');
  if (!laser.enclosureClosed) throw new Error('Laser enclosure is open');
  if (now - bed.lastFire < COOLDOWN_MS) throw new Error('Laser cooling down - try again in a moment');
  bed.lastFire = now;
  Object.assign(weed, { status: 'treated', detail: `Treated (${laser.pulseMs} ms pulse, simulated)`, updatedAt: now });
  save();
  return 'Weed treated (simulated)';
}

/** Demo-only safety toggles (on a real robot these are wiring / env, not UI). */
export function setSimSafety(itemId: string, patch: Partial<WeedSimSafety>): void {
  const bed = beds.get(itemId);
  if (!bed) return;
  bed.robot = { ...bed.robot, laser: { ...bed.robot.laser, ...patch } };
  save();
}

/** Latch or clear the simulated E-STOP. Latching stops the pass immediately. */
export function setSimEstop(itemId: string, active: boolean): void {
  const bed = beds.get(itemId);
  if (!bed) return;
  if (active) { clearInterval(timers.get(itemId)); timers.delete(itemId); }
  bed.robot = {
    ...bed.robot, estop: active, state: active ? 'estop' : 'idle',
    laser: { ...bed.robot.laser, estop: active },
    pass: active ? { ...bed.robot.pass, running: false } : bed.robot.pass,
  };
  save();
}

/** Remove closed detections (treated / rejected) from the demo bed. */
export function clearSimHistory(itemId: string): void {
  const bed = beds.get(itemId);
  if (!bed) return;
  bed.weeds = bed.weeds.filter((w) => w.status === 'pending_review');
  save();
}

/** Test helper. */
export function _resetWeedSim(): void {
  timers.forEach((t) => clearInterval(t));
  timers.clear();
  beds.clear();
}
