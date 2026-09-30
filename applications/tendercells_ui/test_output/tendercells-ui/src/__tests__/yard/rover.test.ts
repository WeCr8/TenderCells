// Rover weed patrol: coverage planning around zones, placing detections on the property,
// the simulated rover (scout vs laser, zone refusal) and which findings alert the user.
// Node environment: the same localStorage/window shim as weedPatrol.test.ts.
import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';

beforeAll(() => {
  const store = new Map<string, string>();
  const g = globalThis as Record<string, unknown>;
  g.localStorage = {
    getItem: (k: string) => (store.has(k) ? store.get(k)! : null),
    setItem: (k: string, v: string) => void store.set(k, String(v)),
    removeItem: (k: string) => void store.delete(k),
    clear: () => store.clear(),
  };
  if (typeof g.CustomEvent === 'undefined') {
    g.CustomEvent = class { type: string; constructor(type: string) { this.type = type; } };
  }
  g.window = { dispatchEvent: () => true };
});
import type { PropertyItem, PropertyLayoutState } from '../../components/property/propertyLayoutStore';
import { blockingZone, zonesFromLayout } from '../../lib/yard/exclusionZones';
import { coverageRoute, frameToProperty, headingTo, routeFromPath } from '../../lib/yard/roverPlan';
import { _resetRoverSim, decideRoverWeed, getSimRover, setRoverBuild, setRoverSafety, simRover, simRoverWeeds, startRoverPass } from '../../lib/yard/roverSim';
import { isRobotFinding, newFindings, urgency } from '../../lib/yard/detections';
import { animalGroupOf, animalNear, waterPointAt, waterPoints } from '../../lib/yard/roverFindings';
import type { YardFlag } from '../../lib/yard/yardTypes';

const item = (p: Partial<PropertyItem> & Pick<PropertyItem, 'id' | 'type' | 'kind'>): PropertyItem => ({ name: p.id, x: 0, y: 0, width: 4, depth: 4, ...p });

const layout: PropertyLayoutState = {
  property: { name: 'Yard', widthFt: 40, depthFt: 30, gridStepFt: 1 },
  items: [
    item({ id: 'septic', kind: 'obstacle', type: 'no-go-zone', x: 10, y: 10, width: 8, depth: 8 }),
    item({ id: 'coop', kind: 'hardware', type: 'chicken-tender', x: 30, y: 4 }),
    item({ id: 'rover', kind: 'hardware', type: 'weed-rover', x: 2, y: 26, width: 3, depth: 2, deviceId: 'rover_001' }),
    item({ id: 'roost', kind: 'hardware', type: 'roaming-roost', x: 30, y: 20, width: 5, depth: 5 }),
    item({ id: 'tap', kind: 'hardware', type: 'water-point', name: 'Spigot', x: 6, y: 18, width: 1, depth: 1 }),
    item({ id: 'pond', kind: 'obstacle', type: 'pond', x: 22, y: 22, width: 4, depth: 4 }),
  ],
};
const zones = zonesFromLayout(layout);

describe('rover route planning', () => {
  it('covers the yard in lanes and never plans a point in a no-go zone', () => {
    const pts = coverageRoute({ x: 0, y: 0, width: 40, depth: 30 }, zones);
    expect(pts.length).toBeGreaterThan(50);
    for (const p of pts) expect(blockingZone(zones, p.x, p.y, 'drive'), `${p.x},${p.y}`).toBeUndefined();
    // Lanes alternate direction (lawn-mower): first lane goes east, second west.
    const lane0 = pts.filter((p) => p.y === pts[0].y);
    const lane1 = pts.filter((p) => p.y === pts[lane0.length].y);
    expect(lane0[1].x).toBeGreaterThan(lane0[0].x);
    expect(lane1[1].x).toBeLessThan(lane1[0].x);
  });

  it('densifies a drawn route and drops points inside zones', () => {
    const pts = routeFromPath([{ x: 2, y: 14 }, { x: 30, y: 14 }], zones);
    expect(pts.some((p) => p.x > 10 && p.x < 18)).toBe(false); // the septic field is skipped
    expect(pts[0]).toEqual({ x: 2, y: 14 });
  });

  it('places camera-frame points on the property from the pose (heading clockwise from north)', () => {
    expect(frameToProperty({ xFt: 10, yFt: 10, headingDeg: 0 }, 2, 0)).toEqual({ x: 10, y: 8 }); // north = up
    expect(frameToProperty({ xFt: 10, yFt: 10, headingDeg: 90 }, 2, 0)).toEqual({ x: 12, y: 10 }); // east
    expect(frameToProperty({ xFt: 10, yFt: 10, headingDeg: 0 }, 0, 1)).toEqual({ x: 11, y: 10 }); // right of north = east
    expect(headingTo({ x: 0, y: 0 }, { x: 0, y: 5 })).toBe(180);
  });
});

describe('simulated rover weed patrol', () => {
  beforeEach(() => { vi.useFakeTimers(); _resetRoverSim(); localStorage.clear(); vi.spyOn(Math, 'random').mockReturnValue(0.05); });
  afterEach(() => { vi.useRealTimers(); vi.restoreAllMocks(); });

  it('drives the property, pins weeds with property positions and never in a no-go zone', () => {
    const rover = layout.items[2];
    simRover(rover, 'rover_001', layout);
    startRoverPass(rover, layout, 1, 'weed');
    vi.advanceTimersByTime(20_000);
    const weeds = simRoverWeeds('rover').filter((w) => w.type === 'weed_detected');
    expect(weeds.length).toBeGreaterThan(0);
    for (const w of weeds) {
      expect(w.propFt).toBeTruthy();
      expect(blockingZone(zones, w.propFt!.x, w.propFt!.y, 'drive')).toBeUndefined();
      expect(w.status).toBe('pending_review');
      expect(w.scout).toBe(true); // default build is the camera scout
    }
    expect(getSimRover('rover')?.pose).toBeTruthy();
  });

  it('scout weeds are pulled by hand; aim / burn are refused', () => {
    const rover = layout.items[2];
    simRover(rover, 'rover_001', layout);
    startRoverPass(rover, layout, 1, 'weed');
    vi.advanceTimersByTime(20_000);
    const [w] = simRoverWeeds('rover').filter((x) => x.type === 'weed_detected');
    expect(() => decideRoverWeed('rover', w.id, 'burn')).toThrow(/camera only/);
    expect(decideRoverWeed('rover', w.id, 'ack')).toMatch(/pulled/i);
    expect(simRoverWeeds('rover').find((x) => x.id === w.id)?.status).toBe('treated');
  });

  it('only a Weed Rover can switch to the laser build, and the laser is refused near animals', () => {
    const roost = layout.items[3];
    simRover(roost, 'rr_001', layout);
    setRoverBuild('roost', 'rover-laser');
    expect(getSimRover('roost')?.robotType).toBe('rover-scout'); // houses animals - camera only

    const rover = layout.items[2];
    const r = simRover(rover, 'rover_001', layout);
    setRoverBuild('rover', 'rover-laser');
    setRoverSafety('rover', { studentMode: false, burnEnabled: true, enclosureClosed: true });
    const now = Date.now();
    r.weeds.push({ id: 'rweed-99', deviceId: 'rover_001', itemId: 'rover', type: 'weed_detected', status: 'pending_review', title: 'Weed', propFt: { x: 31, y: 5 }, ts: now, updatedAt: now });
    expect(() => decideRoverWeed('rover', 'rweed-99', 'burn')).toThrow(/no-laser/);
    r.weeds.push({ id: 'rweed-100', deviceId: 'rover_001', itemId: 'rover', type: 'weed_detected', status: 'pending_review', title: 'Weed', propFt: { x: 5, y: 5 }, ts: now, updatedAt: now });
    expect(decideRoverWeed('rover', 'rweed-100', 'burn')).toMatch(/treated/);
  });
});

describe('rover animals and water leaks', () => {
  beforeEach(() => { vi.useFakeTimers(); _resetRoverSim(); localStorage.clear(); vi.spyOn(Math, 'random').mockReturnValue(0.05); });
  afterEach(() => { vi.useRealTimers(); vi.restoreAllMocks(); });

  it('knows the water points (spigots, animal waterers) but not natural ponds', () => {
    const pts = waterPoints(layout.items);
    expect(pts.map((p) => p.id).sort()).toEqual(['coop', 'tap']);
    expect(waterPointAt(pts, { x: 10, y: 18 })?.id).toBe('tap'); // 3.5 ft from the spigot
    expect(waterPointAt(pts, { x: 20, y: 18 })).toBeUndefined();
    expect(animalGroupOf('fox')).toBe('predator');
    expect(animalGroupOf('Hen')).toBe('flock');
    expect(animalGroupOf('Wombat')).toBe('wildlife');
  });

  it('checks each water point once per pass and reports one open leak there, on the map', () => {
    const rover = layout.items[2];
    simRover(rover, 'rover_001', layout);
    startRoverPass(rover, layout, 2, 'weed');
    vi.advanceTimersByTime(400_000);
    const leaks = simRoverWeeds('rover').filter((w) => w.finding === 'leak');
    expect(leaks.map((l) => l.station).sort()).toEqual(['coop', 'tap']); // open leak blocks a duplicate on pass 2
    const tap = leaks.find((l) => l.station === 'tap')!;
    expect(tap).toMatchObject({ type: 'alert', status: 'active', title: 'Water leak at Spigot' });
    expect(Math.hypot(tap.propFt!.x - 6.5, tap.propFt!.y - 18.5)).toBeLessThan(2);
    expect(isRobotFinding({ ...tap, itemId: 'rover', source: 'demo' })).toBe(true);
    expect(decideRoverWeed('rover', tap.id, 'ack')).toMatch(/fixed/i);
  });

  it('reports animals seen on the route with who they are, and never twice in a row for the same one', () => {
    const rover = layout.items[2];
    simRover(rover, 'rover_001', layout);
    startRoverPass(rover, layout, 1, 'patrol');
    vi.advanceTimersByTime(3_000);
    const animals = simRoverWeeds('rover').filter((w) => w.finding === 'animal');
    expect(animals.length).toBeGreaterThan(0);
    expect(animals[0]).toMatchObject({ label: 'Snake', animalGroup: 'predator', type: 'alert', status: 'active' });
    expect(animals[0].title).toMatch(/^Snake seen/);
    expect(animals.length).toBeLessThan(8); // 8 ticks, same snake close by is not re-reported
  });

  it('holds the laser near an animal seen in the last 10 minutes', () => {
    const rover = layout.items[2];
    const r = simRover(rover, 'rover_001', layout);
    setRoverBuild('rover', 'rover-laser');
    setRoverSafety('rover', { studentMode: false, burnEnabled: true, enclosureClosed: true });
    const now = Date.now();
    r.weeds.push({ id: 'robs-1', deviceId: 'rover_001', itemId: 'rover', type: 'alert', status: 'active', finding: 'animal', animalGroup: 'pet', label: 'Cat', title: 'Cat in the yard', propFt: { x: 8, y: 8 }, ts: now, updatedAt: now });
    r.weeds.push({ id: 'rweed-5', deviceId: 'rover_001', itemId: 'rover', type: 'weed_detected', status: 'pending_review', title: 'Weed', propFt: { x: 5, y: 5 }, ts: now, updatedAt: now });
    expect(animalNear(r.weeds, { x: 5, y: 5 }, now)?.label).toBe('Cat');
    expect(() => decideRoverWeed('rover', 'rweed-5', 'burn')).toThrow(/Cat seen 4 ft away/);
    expect(() => decideRoverWeed('rover', 'rweed-5', 'aim')).toThrow(/Cat/);
    vi.advanceTimersByTime(11 * 60_000); // the animal has moved on
    expect(decideRoverWeed('rover', 'rweed-5', 'burn')).toMatch(/treated/);
  });

  it('puts leaks and predators ahead of weeds', () => {
    const base = { deviceId: 'd', itemId: 'rover', source: 'demo' as const, status: 'active' as const, title: '', ts: 0, updatedAt: 0 };
    expect(urgency({ ...base, id: 'l', type: 'alert', finding: 'leak' })).toBeLessThan(urgency({ ...base, id: 'w', type: 'weed_detected', status: 'pending_review' }));
    expect(urgency({ ...base, id: 'p', type: 'alert', finding: 'animal', animalGroup: 'predator' }))
      .toBeLessThan(urgency({ ...base, id: 'h', type: 'alert', finding: 'animal', animalGroup: 'flock' }));
  });
});

describe('detection alerts', () => {
  const f = (id: string, extra: Partial<YardFlag>): YardFlag => ({ id, deviceId: 'rover_001', itemId: 'rover', source: 'demo', type: 'weed_detected', status: 'pending_review', title: 'Weed', ts: 0, updatedAt: 0, ...extra });

  it('alerts on new pending weeds and located sightings only, never on first load', () => {
    expect(isRobotFinding(f('a', {}))).toBe(true);
    expect(isRobotFinding(f('b', { status: 'treated' }))).toBe(false);
    expect(isRobotFinding(f('c', { type: 'alert', status: 'active', propFt: { x: 1, y: 1 } }))).toBe(true);
    expect(isRobotFinding(f('d', { type: 'egg_ready', status: 'active' }))).toBe(false);
    const first = newFindings([f('a', {})], null);
    expect(first.fresh).toEqual([]);
    const next = newFindings([f('a', {}), f('e', {})], first.seen);
    expect(next.fresh.map((x) => x.id)).toEqual(['e']);
  });
});
