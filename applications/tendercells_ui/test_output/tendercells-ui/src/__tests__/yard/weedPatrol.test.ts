// Weed patrol demo robot + 3D flag placement.
// Node environment: a tiny localStorage/window shim (same approach as demoEnvironment.test.ts).
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

import {
  _resetWeedSim, decideSimWeed, setSimEstop, setSimSafety, simBed, simWeeds, startSimPass,
} from '../../lib/yard/weedSim';
import { bedMmToScene } from '../../components/viewport/yardFlags';
import { needsAttention, roamingFrom, type YardEvent } from '../../lib/yard/yardTypes';

const BED = { id: 'bed-1', width: 5, depth: 10 };

beforeEach(() => {
  localStorage.clear();
  _resetWeedSim();
  vi.useFakeTimers();
});
afterEach(() => vi.useRealTimers());

function runFullPass(passes = 1) {
  const bed = simBed(BED, 'garden_weeder');
  startSimPass(BED.id, passes);
  vi.advanceTimersByTime(bed.robot.pass.waypoints * passes * 450 + 1000);
  return simBed(BED, 'garden_weeder');
}

describe('weed patrol simulator', () => {
  it('scans the whole bed and queues detections for human review', () => {
    vi.spyOn(Math, 'random').mockReturnValue(0.01); // detect on every frame
    const bed = runFullPass(1);
    expect(bed.robot.pass.running).toBe(false);
    const weeds = simWeeds(BED.id);
    expect(weeds.length).toBeGreaterThan(0);
    expect(weeds.every((w) => w.status === 'pending_review' && w.itemId === BED.id)).toBe(true);
    // Detections stay inside the bed (10 ft x 5 ft = 3048 x 1524 mm).
    weeds.forEach((w) => {
      expect(w.bedMm!.x).toBeGreaterThanOrEqual(0);
      expect(w.bedMm!.x).toBeLessThanOrEqual(3048);
      expect(w.bedMm!.y).toBeLessThanOrEqual(1524);
    });
  });

  it('student mode (default) aims but never burns', () => {
    vi.spyOn(Math, 'random').mockReturnValue(0.01);
    runFullPass();
    const [weed] = simWeeds(BED.id);
    expect(decideSimWeed(BED.id, weed.id, 'aim')).toMatch(/Aiming/);
    expect(simWeeds(BED.id)[0].status).toBe('pending_review');
    expect(() => decideSimWeed(BED.id, weed.id, 'burn')).toThrow(/Student mode/);
  });

  it('burn needs burn enabled + closed enclosure, then marks the weed treated', () => {
    vi.spyOn(Math, 'random').mockReturnValue(0.01);
    runFullPass();
    const [a] = simWeeds(BED.id);
    setSimSafety(BED.id, { studentMode: false });
    expect(() => decideSimWeed(BED.id, a.id, 'burn')).toThrow(/not enabled/);
    setSimSafety(BED.id, { burnEnabled: true, enclosureClosed: false });
    expect(() => decideSimWeed(BED.id, a.id, 'burn')).toThrow(/enclosure is open/);
    setSimSafety(BED.id, { enclosureClosed: true });
    decideSimWeed(BED.id, a.id, 'burn');
    expect(simWeeds(BED.id).find((w) => w.id === a.id)!.status).toBe('treated');
    expect(() => decideSimWeed(BED.id, a.id, 'reject')).toThrow(/already treated/);
  });

  it('E-STOP stops the pass and blocks new passes and treatment', () => {
    vi.spyOn(Math, 'random').mockReturnValue(0.01);
    simBed(BED, 'garden_weeder');
    startSimPass(BED.id, 3);
    vi.advanceTimersByTime(900);
    setSimEstop(BED.id, true);
    expect(simBed(BED, 'garden_weeder').robot.pass.running).toBe(false);
    expect(() => startSimPass(BED.id, 1)).toThrow(/E-STOP/);
    const [weed] = simWeeds(BED.id);
    expect(() => decideSimWeed(BED.id, weed.id, 'aim')).toThrow(/E-STOP/);
    setSimEstop(BED.id, false);
    expect(() => startSimPass(BED.id, 1)).not.toThrow();
  });
});

describe('flag helpers', () => {
  const layout = { property: { widthFt: 80, depthFt: 60 } };
  const item = { id: 'g', type: 'farmbot-genesis', x: 12, y: 30, width: 5, depth: 10 };

  it('maps bed mm (FarmBot X along the long side) onto the scene', () => {
    // Item centre in scene: x = 12 + 2.5 - 40 = -25.5, z = 30 + 5 - 30 = 5; origin corner (-28, 0).
    expect(bedMmToScene(item, layout, { x: 0, y: 0 })).toEqual({ x: -28, z: 0 });
    const far = bedMmToScene(item, layout, { x: 3048, y: 1524 });
    expect(far.x).toBeCloseTo(-23);
    expect(far.z).toBeCloseTo(10);
    // Clamped to the bed.
    expect(bedMmToScene(item, layout, { x: 99999, y: -5 }).z).toBeCloseTo(10);
  });

  it('reads roaming birds and which flags need a person', () => {
    expect(roamingFrom({ detail: '2 roaming outside' })).toBe(2);
    expect(roamingFrom({ detail: 'All birds inside' })).toBe(0);
    const base = { id: 'x', deviceId: 'd', title: 't', ts: 0, updatedAt: 0 } as const;
    expect(needsAttention({ ...base, type: 'egg_ready', status: 'active' } as YardEvent)).toBe(true);
    expect(needsAttention({ ...base, type: 'weed_detected', status: 'treated' } as YardEvent)).toBe(false);
    expect(needsAttention({ ...base, type: 'headcount', status: 'active' } as YardEvent)).toBe(false);
  });
});
