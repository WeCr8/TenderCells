// weedSim.ts - in-browser weed patrol robot for the public demo (no API, no hardware).
//
// Behaves like firmware/jetson-nano/weed_patrol_service.py in simulation mode: a
// serpentine pass over the bed, detections published as weed_detected
// "pending_review", and a person approves each one (aim dot or laser burn) or
// rejects it. Burn goes through the same interlocks as the real robot: E-STOP,
// student mode (aim only), burn enabled, enclosure closed, cooldown.
import type { RobotTask, WeedRobotState, WeedRobotType, YardEvent } from './yardTypes';

export const WEED_SIM_EVENT = 'tendercells-weed-sim';
const STORAGE_KEY = 'tendercells_weed_sim_v1';
const MM_PER_FT = 304.8;
const FOV_MM = { x: 400, y: 300 };
const TICK_MS = 450;
const COOLDOWN_MS = 2000;

export interface WeedSimSafety { studentMode: boolean; burnEnabled: boolean; enclosureClosed: boolean }

/** Weed robot builds the demo can simulate (same profiles as firmware/jetson-nano/weed_patrol.py). */
export const WEED_ROBOT_TYPES: Record<WeedRobotType, {
  label: string; motion: 'gantry' | 'rover' | 'arm'; note: string;
  laser: { profile: string; laserClass: string; wavelengthNm: number; powerW: number; minMs: number; maxMs: number };
}> = {
  'genesis-laser': {
    label: 'Genesis laser head', motion: 'gantry', note: 'FarmBot Genesis + 500 mW module (Project Cyclops, CC0)',
    laser: { profile: 'diode-500mw', laserClass: '3B', wavelengthNm: 405, powerW: 0.5, minMs: 2000, maxMs: 8000 },
  },
  'rover-laser': {
    label: 'Laser rover', motion: 'rover', note: 'LiteWeed-style stop-and-align rover, 2-DOF arm, 4 W blue diode',
    laser: { profile: 'diode-4w', laserClass: '4', wavelengthNm: 450, powerW: 4, minMs: 500, maxMs: 3000 },
  },
  'arm-laser': {
    label: 'Arm-mounted laser', motion: 'arm', note: 'Arm service (sim / UR / LeRobot) carrying the 500 mW module',
    laser: { profile: 'diode-500mw', laserClass: '3B', wavelengthNm: 405, powerW: 0.5, minMs: 2000, maxMs: 8000 },
  },
  // Property-wide camera rover (roverSim.ts) - finds and maps weeds, never fires anything.
  'rover-scout': {
    label: 'Rover scout (camera only)', motion: 'rover', note: 'Drives the property, maps weeds for a person to pull',
    laser: { profile: 'none', laserClass: 'none', wavelengthNm: 0, powerW: 0, minMs: 0, maxMs: 0 },
  },
};

/** Builds offered for a garden bed (the camera-only scout works property-wide instead). */
export const BED_ROBOT_TYPES = (Object.keys(WEED_ROBOT_TYPES) as WeedRobotType[]).filter((k) => WEED_ROBOT_TYPES[k].laser.powerW > 0);

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
const weedSizes = new Map<string, number>(); // weed id -> size mm (for exposure)
const timers = new Map<string, ReturnType<typeof setInterval>>();

function load(): Record<string, { weeds: YardEvent[]; next: number; safety?: WeedSimSafety; robotType?: WeedRobotType }> {
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}'); } catch { return {}; }
}

function save(): void {
  const out: Record<string, { weeds: YardEvent[]; next: number; safety: WeedSimSafety; robotType?: WeedRobotType }> = {};
  beds.forEach((b, id) => {
    const { studentMode, burnEnabled, enclosureClosed } = b.robot.laser;
    out[id] = { weeds: b.weeds, next: b.next, safety: { studentMode, burnEnabled, enclosureClosed }, robotType: b.robot.robotType };
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
  const robotType: WeedRobotType = saved?.robotType && saved.robotType in WEED_ROBOT_TYPES ? saved.robotType : 'genesis-laser';
  const t = WEED_ROBOT_TYPES[robotType].laser;
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
      robotType,
      laser: { ...safety, pulseMs: t.maxMs, estop: false, profile: t.profile, laserClass: t.laserClass, wavelengthNm: t.wavelengthNm, powerW: t.powerW },
      pass: { running: false, pass: 0, passes: 0, waypoint: 0, waypoints: 0 },
      tool: { x: 0, y: 0, z: 0, aim: false, laser: false },
    },
  };
  beds.set(item.id, bed);
  return bed;
}

/** Weeds and sightings: every open one plus those closed in the last 10 minutes. */
export function simWeeds(itemId: string): YardEvent[] {
  const cutoff = Date.now() - 10 * 60_000;
  return (beds.get(itemId)?.weeds ?? []).filter(
    (w) => w.status === 'pending_review' || w.status === 'approved' || w.status === 'active' || w.updatedAt > cutoff,
  );
}

/** "Seen it" on a simulated plant / animal sighting. */
export function ackSimAlert(itemId: string, eventId: string): void {
  const e = beds.get(itemId)?.weeds.find((w) => w.id === eventId && w.type === 'alert');
  if (!e) throw new Error('No such sighting');
  Object.assign(e, { status: 'cleared', updatedAt: Date.now() });
  save();
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
export function startSimPass(itemId: string, passes: number, task: RobotTask = 'weed'): void {
  const bed = beds.get(itemId);
  if (!bed) throw new Error('Weed robot not found');
  if (bed.robot.estop) throw new Error('E-STOP is active');
  if (bed.robot.pass.running) throw new Error('A pass is already running');
  const n = Math.min(10, Math.max(1, Math.round(passes)));
  const waypoints = plan(bed);
  bed.robot = { ...bed.robot, state: task === 'weed' ? 'scanning' : task, error: null, pass: { running: true, pass: 1, passes: n, waypoint: 0, waypoints: waypoints.length, task } };
  let pass = 1, i = 0;
  const timer = setInterval(() => {
    if (bed.robot.estop) { clearInterval(timer); timers.delete(itemId); return; }
    const wp = waypoints[i];
    if (wp) bed.robot = { ...bed.robot, tool: { x: wp.x, y: wp.y, z: 0, aim: false, laser: false } };
    // Plant-health and patrol passes raise sightings (alerts), never laser targets.
    if (wp && task !== 'weed' && Math.random() < (task === 'patrol' ? 0.03 : 0.08)) {
      const labels = task === 'patrol' ? ['Snake', 'Snake', 'Rat'] : ['Wilting', 'Yellow leaves', 'Pest damage'];
      const label = labels[Math.floor(Math.random() * labels.length)];
      const near = bed.weeds.some((w) => w.type === 'alert' && w.label === label && w.status === 'active' && w.bedMm && Math.hypot(w.bedMm.x - wp.x, w.bedMm.y - wp.y) < 400);
      if (!near) {
        const now = Date.now();
        const animal = task === 'patrol';
        bed.weeds.push({
          id: `obs-${bed.next++}`, deviceId: bed.deviceId, itemId, type: 'alert', status: 'active', label,
          title: animal ? `${label} seen` : label, confidence: Math.round((0.75 + Math.random() * 0.2) * 100) / 100,
          detail: animal ? `Pass ${pass} · keep people and animals clear` : `Pass ${pass} · check the plant`,
          bedMm: { x: Math.round(wp.x), y: Math.round(wp.y) }, ts: now, updatedAt: now,
        });
      }
    }
    // A detection roughly every ~6 frames; later passes find fewer (already found / regrowth).
    if (wp && task === 'weed' && Math.random() < 0.16 / pass) {
      const x = Math.min(bed.lengthMm - 40, Math.max(40, wp.x + (Math.random() - 0.5) * FOV_MM.x));
      const y = Math.min(bed.widthMm - 40, Math.max(40, wp.y + (Math.random() - 0.5) * FOV_MM.y));
      const dup = bed.weeds.some((w) => w.bedMm && w.status === 'pending_review' && Math.hypot(w.bedMm.x - x, w.bedMm.y - y) < 60);
      if (!dup) {
        const now = Date.now();
        const confidence = Math.round((0.55 + Math.random() * 0.42) * 100) / 100;
        const size = Math.round(18 + Math.random() * 40);
        const id = `weed-${bed.next++}`;
        weedSizes.set(`${itemId}:${id}`, size);
        bed.weeds.push({
          id, deviceId: bed.deviceId, itemId, type: 'weed_detected', status: 'pending_review',
          title: 'Weed', detail: `${size} mm · pass ${pass}`, confidence,
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
  const at = weed.bedMm ?? { x: 0, y: 0 };
  if (decision === 'reject') {
    bed.robot = { ...bed.robot, tool: { ...(bed.robot.tool ?? { x: 0, y: 0, z: 0 }), aim: false, laser: false } };
    Object.assign(weed, { status: 'rejected', detail: 'Rejected by reviewer', updatedAt: now });
    save();
    return 'Marked as not a weed';
  }
  const { laser } = bed.robot;
  if (bed.robot.estop) throw new Error('E-STOP is active');
  // The tool moves over the weed and the aiming dot turns on for both aim and burn.
  bed.robot = { ...bed.robot, tool: { x: at.x, y: at.y, z: -150, aim: true, laser: false } };
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
  const sizeMm = weedSizes.get(`${itemId}:${eventId}`) ?? Number(/(\d+) mm/.exec(weed.detail ?? '')?.[1] ?? 20);
  // Exposure scales with weed size between the profile's min and max, like weed_patrol.py.
  const prof = WEED_ROBOT_TYPES[bed.robot.robotType ?? 'genesis-laser'].laser;
  const ms = Math.round(prof.minMs + Math.min(1, Math.max(0, (sizeMm - 10) / 50)) * (prof.maxMs - prof.minMs));
  Object.assign(weed, { status: 'treated', detail: `Treated (${ms} ms exposure at ${prof.powerW} W, simulated)`, updatedAt: now });
  // Show the beam briefly (the demo compresses the real exposure time).
  bed.robot = { ...bed.robot, tool: { x: at.x, y: at.y, z: -150, aim: true, laser: true } };
  setTimeout(() => {
    const b = beds.get(itemId);
    if (b?.robot.tool) { b.robot = { ...b.robot, tool: { ...b.robot.tool, aim: false, laser: false } }; save(); }
  }, 1400);
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

/** Current simulated robot state for a bed (read every frame by the 3D view). */
export function getSimRobot(itemId: string): WeedRobotState | undefined {
  return beds.get(itemId)?.robot;
}

/** Switch the demo robot build (motion + laser profile). */
export function setSimRobotType(itemId: string, type: WeedRobotType): void {
  const bed = beds.get(itemId);
  if (!bed || !(type in WEED_ROBOT_TYPES)) return;
  const t = WEED_ROBOT_TYPES[type].laser;
  bed.robot = {
    ...bed.robot, robotType: type,
    laser: { ...bed.robot.laser, pulseMs: t.maxMs, profile: t.profile, laserClass: t.laserClass, wavelengthNm: t.wavelengthNm, powerW: t.powerW },
  };
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
    tool: active && bed.robot.tool ? { ...bed.robot.tool, aim: false, laser: false } : bed.robot.tool,
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
