// roverSim.ts - in-browser weed patrol on a ROVER for the public demo (no API, no hardware).
//
// Behaves like firmware/jetson-nano/rover_patrol.py in simulation mode: the rover drives
// lanes across the whole property (or the route a person drew), its camera finds weeds and
// each one is reported with its property position (propFt) as weed_detected
// "pending_review" - a pin on the 2D and 3D maps and an alert for the user.
//   rover-scout (Roaming Roost, custom robots, Weed Rover camera build): a person pulls the
//     weed and presses "Pulled it" - nothing is ever fired.
//   rover-laser (Weed Rover laser build only): a person approves aim / burn per weed; the
//     laser is refused in any exclusion zone (incl. the no-laser buffer around animals) and
//     near any animal the camera saw in the last 10 minutes.
// On every pass, whatever the task, it also reports animals it sees on the route (your flock
// outside the run, pets, wildlife, predators) and checks the ground around each water point
// for leaks - see roverFindings.ts.
import type { PropertyItem, PropertyLayoutState } from '../../components/property/propertyLayoutStore';
import { blockingZone, zonesFromLayout, type ExclusionZone } from './exclusionZones';
import { ROVER_CAMERA, coverageRoute, frameToProperty, headingTo, routeFromPath, type Pt } from './roverPlan';
import { LASER_ROVER_TYPES, type RobotTask, type WeedRobotState, type YardEvent } from './yardTypes';
import { WEED_ROBOT_TYPES } from './weedSim';
import { ROVER_ANIMALS, animalAlert, animalNear, waterPointAt, waterPoints, type WaterPoint } from './roverFindings';
import { effectiveBoundary, insideBoundary } from './boundary';

export const ROVER_SIM_EVENT = 'tendercells-rover-sim';
const STORAGE_KEY = 'tendercells_rover_sim_v1';
const TICK_MS = 350;
const COOLDOWN_MS = 2000;
const MARGIN_FT = 2;

export type RoverBuild = 'rover-scout' | 'rover-laser';

interface SimRover {
  itemId: string;
  deviceId: string;
  itemName: string;
  canLaser: boolean;
  weeds: YardEvent[];
  robot: WeedRobotState;
  zones: ExclusionZone[];
  /** Property boundary: the rover never plans or reports a point outside it. */
  stayIn: (x: number, y: number) => boolean;
  items: Pick<PropertyItem, 'id' | 'name' | 'x' | 'y' | 'width' | 'depth' | 'kind'>[];
  water: WaterPoint[];
  next: number;
  lastFire: number;
}

const rovers = new Map<string, SimRover>();
const timers = new Map<string, ReturnType<typeof setInterval>>();

type Saved = { weeds: YardEvent[]; next: number; build?: RoverBuild; safety?: { studentMode: boolean; burnEnabled: boolean; enclosureClosed: boolean } };
function load(): Record<string, Saved> {
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}'); } catch { return {}; }
}
function save(): void {
  const out: Record<string, Saved> = {};
  rovers.forEach((r, id) => {
    const { studentMode, burnEnabled, enclosureClosed } = r.robot.laser;
    out[id] = { weeds: r.weeds.slice(-300), next: r.next, build: r.robot.robotType as RoverBuild, safety: { studentMode, burnEnabled, enclosureClosed } };
  });
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(out)); } catch { /* private mode */ }
  window.dispatchEvent(new CustomEvent(ROVER_SIM_EVENT));
}

function laserFor(build: RoverBuild) {
  const t = WEED_ROBOT_TYPES[build].laser;
  return { pulseMs: t.maxMs, profile: t.profile, laserClass: t.laserClass, wavelengthNm: t.wavelengthNm, powerW: t.powerW };
}

/**
 * Get (or create) the simulated rover for a mobile-robot item. Refreshes its view of the
 * property (zones + items) every call so edits in Property Layout apply to the next pass.
 */
export function simRover(item: PropertyItem, deviceId: string, layout: PropertyLayoutState): SimRover {
  const zones = zonesFromLayout(layout).filter((z) => z.id !== item.id);
  const boundary = effectiveBoundary(layout);
  const stayIn = (x: number, y: number) => insideBoundary(boundary, x, y);
  const items = layout.items.map(({ id, name, x, y, width, depth, kind }) => ({ id, name, x, y, width, depth, kind }));
  const water = waterPoints(layout.items);
  let r = rovers.get(item.id);
  if (r) { r.zones = zones; r.stayIn = stayIn; r.items = items; r.water = water; r.itemName = item.name; return r; }
  const saved = load()[item.id];
  const canLaser = LASER_ROVER_TYPES.has(item.type);
  const build: RoverBuild = canLaser && saved?.build === 'rover-laser' ? 'rover-laser' : 'rover-scout';
  const safety = saved?.safety ?? { studentMode: true, burnEnabled: false, enclosureClosed: true };
  r = {
    itemId: item.id, deviceId, itemName: item.name, canLaser, zones, stayIn, items, water,
    weeds: saved?.weeds ?? [], next: saved?.next ?? 1, lastFire: 0,
    robot: {
      state: 'idle', mode: 'simulation', estop: false, error: null, ts: Date.now(), robotType: build,
      laser: { ...safety, estop: false, ...laserFor(build) },
      pass: { running: false, pass: 0, passes: 0, waypoint: 0, waypoints: 0 },
      pose: { xFt: item.x + item.width / 2, yFt: item.y + item.depth / 2, headingDeg: 0 },
    },
  };
  rovers.set(item.id, r);
  return r;
}

/** Weeds and sightings: every open one plus those closed in the last 10 minutes. */
export function simRoverWeeds(itemId: string): YardEvent[] {
  const cutoff = Date.now() - 10 * 60_000;
  return (rovers.get(itemId)?.weeds ?? []).filter((w) => w.status === 'pending_review' || w.status === 'active' || w.updatedAt > cutoff);
}

export const getSimRover = (itemId: string): WeedRobotState | undefined => rovers.get(itemId)?.robot;

/** Name of the closest layout item within 8 ft, for "near the Garden" in alerts. */
function nearName(r: SimRover, p: Pt): string | null {
  let best: { d: number; name: string } | null = null;
  for (const it of r.items) {
    if (it.id === r.itemId) continue;
    const dx = Math.max(it.x - p.x, 0, p.x - (it.x + it.width)), dy = Math.max(it.y - p.y, 0, p.y - (it.y + it.depth));
    const d = Math.hypot(dx, dy);
    if (d <= 8 && (!best || d < best.d)) best = { d, name: it.name };
  }
  return best?.name ?? null;
}

/**
 * Start property-wide passes. Throws with the refusal reason, like the API's 409.
 *
 * @param item - The rover's layout item (its patrolPath, when drawn, is the route)
 * @param layout - Property layout (bounds, zones)
 */
export function startRoverPass(item: PropertyItem, layout: PropertyLayoutState, passes: number, task: RobotTask = 'weed'): void {
  const r = rovers.get(item.id);
  if (!r) throw new Error('Rover not found');
  if (r.robot.estop) throw new Error('E-STOP is active');
  if (r.robot.pass.running) throw new Error('A pass is already running');
  const { widthFt, depthFt } = layout.property;
  const route = item.patrolPath && item.patrolPath.length > 1
    ? routeFromPath(item.patrolPath, r.zones, 2, undefined, r.stayIn)
    : coverageRoute({ x: MARGIN_FT, y: MARGIN_FT, width: widthFt - 2 * MARGIN_FT, depth: depthFt - 2 * MARGIN_FT }, r.zones, undefined, undefined, undefined, r.stayIn);
  if (!route.length) throw new Error('No drivable route - every point is inside an exclusion zone');
  const n = Math.min(10, Math.max(1, Math.round(passes)));
  r.robot = { ...r.robot, state: task === 'weed' ? 'scanning' : task, error: null, pass: { running: true, pass: 1, passes: n, waypoint: 0, waypoints: route.length, task } };
  let pass = 1, i = 0;
  const checked = new Set<string>(); // water points looked at this pass
  const timer = setInterval(() => {
    if (r.robot.estop) { clearInterval(timer); timers.delete(item.id); return; }
    const wp = route[i];
    const prev = r.robot.pose ?? { xFt: wp.x, yFt: wp.y, headingDeg: 0 };
    const pose = { xFt: wp.x, yFt: wp.y, headingDeg: headingTo({ x: prev.xFt, y: prev.yFt }, wp, prev.headingDeg) };
    r.robot = { ...r.robot, pose };
    const now = Date.now();
    const frame = () => frameToProperty(pose, ROVER_CAMERA.aheadFt + (Math.random() - 0.5) * ROVER_CAMERA.frameFt.along,
      (Math.random() - 0.5) * ROVER_CAMERA.frameFt.across);
    const inside = (p: Pt) => p.x > 0 && p.y > 0 && p.x < widthFt && p.y < depthFt && r.stayIn(p.x, p.y);
    if (task === 'weed' && Math.random() < 0.1 / pass) {
      const p = frame();
      const dup = r.weeds.some((w) => w.propFt && w.status === 'pending_review' && Math.hypot(w.propFt.x - p.x, w.propFt.y - p.y) < 1.5);
      if (inside(p) && !dup && !blockingZone(r.zones, p.x, p.y, 'drive')) {
        const near = nearName(r, p);
        const size = Math.round(15 + Math.random() * 60);
        r.weeds.push({
          id: `rweed-${r.next++}`, deviceId: r.deviceId, itemId: item.id, type: 'weed_detected', status: 'pending_review',
          title: near ? `Weed near ${near}` : 'Weed in the yard', scout: r.robot.robotType !== 'rover-laser',
          detail: `~${size} mm · ${Math.round(p.x)}, ${Math.round(p.y)} ft · pass ${pass}`,
          confidence: Math.round((0.6 + Math.random() * 0.37) * 100) / 100,
          propFt: p, ts: now, updatedAt: now,
        });
      }
    } else if (task === 'plant_scan' && Math.random() < 0.06) {
      const p = frame();
      const label = ['Wilting', 'Yellow leaves', 'Pest damage'][Math.floor(Math.random() * 3)];
      r.weeds.push({
        id: `robs-${r.next++}`, deviceId: r.deviceId, itemId: item.id, type: 'alert', status: 'active', label, finding: 'plant',
        title: label, propFt: p, confidence: Math.round((0.75 + Math.random() * 0.2) * 100) / 100,
        detail: 'Check the plant', ts: now, updatedAt: now,
      });
    }
    // Animals on the route - any task. A snake / predator patrol looks harder.
    if (Math.random() < (task === 'patrol' ? 0.06 : 0.02)) {
      const p = frame();
      const names = task === 'patrol' ? ['Snake', 'Snake', 'Rat', 'Fox', 'Raccoon'] : Object.keys(ROVER_ANIMALS);
      const label = names[Math.floor(Math.random() * names.length)];
      const group = ROVER_ANIMALS[label];
      const seenLately = r.weeds.some((w) => w.finding === 'animal' && w.label === label && w.status === 'active' && w.propFt
        && now - w.ts < 2 * 60_000 && Math.hypot(w.propFt.x - p.x, w.propFt.y - p.y) < 6);
      if (inside(p) && !seenLately) {
        const { title, detail } = animalAlert(label, group, nearName(r, p));
        r.weeds.push({
          id: `robs-${r.next++}`, deviceId: r.deviceId, itemId: item.id, type: 'alert', status: 'active', label,
          finding: 'animal', animalGroup: group, title, detail, propFt: p,
          confidence: Math.round((0.7 + Math.random() * 0.25) * 100) / 100, ts: now, updatedAt: now,
        });
      }
    }
    // Water points: look at the ground around each one once per pass.
    const centre = frameToProperty(pose, ROVER_CAMERA.aheadFt, 0);
    const tap = waterPointAt(r.water, centre);
    if (tap && !checked.has(tap.id)) {
      checked.add(tap.id);
      const open = r.weeds.some((w) => w.finding === 'leak' && w.station === tap.id && w.status === 'active');
      if (!open && Math.random() < 0.25) {
        const spread = Math.round(2 + Math.random() * 4);
        const a = Math.random() * Math.PI * 2;
        r.weeds.push({
          id: `robs-${r.next++}`, deviceId: r.deviceId, itemId: item.id, type: 'alert', status: 'active', label: 'Water leak',
          finding: 'leak', station: tap.id, title: `Water leak at ${tap.name}`,
          detail: `Standing water ~${spread} ft across - check the valve, hose and fittings`,
          propFt: { x: tap.x + Math.cos(a) * 1.5, y: tap.y + Math.sin(a) * 1.5 },
          confidence: Math.round((0.7 + Math.random() * 0.25) * 100) / 100, ts: now, updatedAt: now,
        });
      }
    }
    i += 1;
    if (i >= route.length) { i = 0; pass += 1; checked.clear(); }
    if (pass > n) {
      clearInterval(timer); timers.delete(item.id);
      r.robot = { ...r.robot, state: 'idle', pass: { ...r.robot.pass, running: false } };
    } else {
      r.robot = { ...r.robot, ts: now, pass: { ...r.robot.pass, pass, waypoint: i + 1 } };
    }
    save();
  }, TICK_MS);
  timers.set(item.id, timer);
  save();
}

/**
 * A person's decision on one rover weed.
 *   ack    - "Pulled it" (done by hand)      reject - not a weed
 *   aim / burn - laser rover only; burn passes every interlock and the zone check first.
 *
 * @returns A short message describing what happened
 */
export function decideRoverWeed(itemId: string, eventId: string, decision: 'ack' | 'aim' | 'burn' | 'reject'): string {
  const r = rovers.get(itemId);
  const e = r?.weeds.find((w) => w.id === eventId);
  if (!r || !e) throw new Error('No such detection');
  const now = Date.now();
  if (e.type === 'alert') {
    Object.assign(e, { status: 'cleared', updatedAt: now });
    save();
    return e.finding === 'leak' ? 'Leak marked as fixed' : 'Marked as seen';
  }
  if (e.status !== 'pending_review') throw new Error(`Weed is already ${e.status}`);
  if (decision === 'reject') { Object.assign(e, { status: 'rejected', detail: 'Not a weed', updatedAt: now }); save(); return 'Marked as not a weed'; }
  if (decision === 'ack') { Object.assign(e, { status: 'treated', detail: 'Pulled by hand', updatedAt: now }); save(); return 'Marked as pulled'; }
  if (r.robot.robotType !== 'rover-laser') throw new Error('This rover has a camera only - pull the weed by hand, then press "Pulled it"');
  if (r.robot.estop) throw new Error('E-STOP is active');
  const p = e.propFt!;
  const zone = blockingZone(r.zones, p.x, p.y, 'laser');
  if (zone) throw new Error(`Refused: the weed is inside ${zone.kind} zone "${zone.name}" - pull it by hand`);
  r.robot = { ...r.robot, pose: { xFt: p.x, yFt: p.y, headingDeg: r.robot.pose?.headingDeg ?? 0 } };
  const animal = animalNear(r.weeds, p, now);
  if (animal) throw new Error(`Refused: ${animal.label ?? 'an animal'} seen ${Math.round(Math.hypot(animal.propFt!.x - p.x, animal.propFt!.y - p.y))} ft away in the last 10 minutes - pull it by hand`);
  if (decision === 'aim') { Object.assign(e, { detail: 'Aimed - aiming dot on target, awaiting decision', updatedAt: now }); save(); return 'Aiming dot on target'; }
  const { laser } = r.robot;
  if (laser.studentMode) throw new Error('Student mode - aiming dot only, the laser never fires');
  if (!laser.burnEnabled) throw new Error('Laser burn is not enabled on this rover');
  if (!laser.enclosureClosed) throw new Error('Laser shroud is open');
  if (now - r.lastFire < COOLDOWN_MS) throw new Error('Laser cooling down - try again in a moment');
  r.lastFire = now;
  Object.assign(e, { status: 'treated', detail: `Treated (${laser.pulseMs} ms at ${laser.powerW} W, simulated)`, updatedAt: now });
  save();
  return 'Weed treated (simulated)';
}

/** Switch a Weed Rover between the camera-only and laser build (demo). */
export function setRoverBuild(itemId: string, build: RoverBuild): void {
  const r = rovers.get(itemId);
  if (!r || (build === 'rover-laser' && !r.canLaser)) return;
  r.robot = { ...r.robot, robotType: build, laser: { ...r.robot.laser, ...laserFor(build) } };
  save();
}

export function setRoverSafety(itemId: string, patch: Partial<{ studentMode: boolean; burnEnabled: boolean; enclosureClosed: boolean }>): void {
  const r = rovers.get(itemId);
  if (!r) return;
  r.robot = { ...r.robot, laser: { ...r.robot.laser, ...patch } };
  save();
}

/** Latch or clear the rover E-STOP. Latching stops it immediately. */
export function setRoverEstop(itemId: string, active: boolean): void {
  const r = rovers.get(itemId);
  if (!r) return;
  if (active) { clearInterval(timers.get(itemId)); timers.delete(itemId); }
  r.robot = { ...r.robot, estop: active, state: active ? 'estop' : 'idle', laser: { ...r.robot.laser, estop: active },
    pass: active ? { ...r.robot.pass, running: false } : r.robot.pass };
  save();
}

export function clearRoverHistory(itemId: string): void {
  const r = rovers.get(itemId);
  if (!r) return;
  r.weeds = r.weeds.filter((w) => w.status === 'pending_review' || w.status === 'active');
  save();
}

/** Test helper. */
export function _resetRoverSim(): void {
  timers.forEach((t) => clearInterval(t));
  timers.clear();
  rovers.clear();
}
