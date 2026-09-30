// Bring-your-own robot mower (demo): the interlock refuses a start while the coop door is
// open or at night, sends a mowing mower home when the flock is let out, and E-STOP latches.
import { beforeAll, beforeEach, describe, expect, it } from 'vitest';

beforeAll(() => {
  const store = new Map<string, string>();
  const g = globalThis as Record<string, unknown>;
  g.localStorage = {
    getItem: (k: string) => (store.has(k) ? store.get(k)! : null),
    setItem: (k: string, v: string) => void store.set(k, String(v)),
    removeItem: (k: string) => void store.delete(k),
    clear: () => store.clear(),
  };
  if (typeof g.CustomEvent === 'undefined') g.CustomEvent = class { type: string; constructor(t: string) { this.type = t; } };
  g.window = { dispatchEvent: () => true };
});

import { inQuietHours, mowingBlockedReason } from '../../lib/mower/mower';
import { DEMO_MOWER_ID, simCommand, simEstop, simClearEstop, simLink, simMowers } from '../../lib/mower/mowerSim';
import { runScenario } from '../../lib/demo/eventSimulator';
import { updateDemoEquipment } from '../../services/demo/demoEnvironment';

const noon = new Date(2026, 8, 30, 12).getTime();
const seed = (door: 'open' | 'closed') => {
  localStorage.setItem('tendercells_demo_seeded_v1', 'now');
  localStorage.setItem('tendercells_demo_equipment_v1', JSON.stringify([
    { deviceId: 'ct_001', door, feedLevelPct: 70, waterLevelPct: 60, sensors: { tempF: 70, humidityPct: 70, ammoniaPpm: 2 }, updatedAt: '' },
  ]));
};
const demoMower = (now = noon) => simMowers(now).find((m) => m.link.deviceId === DEMO_MOWER_ID)!;

describe('robot mower interlock (demo)', () => {
  beforeEach(() => { localStorage.clear(); });

  it('the seeded demo has one mower guarding the Chicken Tender', () => {
    seed('closed');
    const m = demoMower();
    expect(m.link.guardHabitats).toEqual(['ct_001']);
    expect(m.state?.activity).toBe('docked');
    expect(m.blocked).toBeNull();
  });

  it('refuses to start while the coop door is open, and says why', () => {
    seed('open');
    expect(() => simCommand(DEMO_MOWER_ID, 'start', noon)).toThrow(/door is open/);
    expect(demoMower().state?.lastInterlock?.action).toBe('refused');
  });

  it('refuses at night (wildlife quiet hours)', () => {
    seed('closed');
    const night = new Date(2026, 8, 30, 22).getTime();
    expect(() => simCommand(DEMO_MOWER_ID, 'start', night)).toThrow(/Quiet hours/);
  });

  it('sends a mowing mower home when the flock is let out', () => {
    seed('closed');
    simCommand(DEMO_MOWER_ID, 'start', noon);
    expect(demoMower().state?.activity).toBe('mowing');
    updateDemoEquipment('ct_001', { door: 'open' });
    const m = demoMower(noon + 1000);
    expect(m.state?.activity).toBe('returning');
    expect(m.state?.lastInterlock).toMatchObject({ action: 'sent-home' });
    expect(demoMower(noon + 10_000).state?.activity).toBe('docked');
  });

  it('E-STOP latches until cleared', () => {
    seed('closed');
    simEstop(DEMO_MOWER_ID, noon);
    expect(() => simCommand(DEMO_MOWER_ID, 'start', noon)).toThrow(/E-STOP/);
    simClearEstop(DEMO_MOWER_ID);
    simCommand(DEMO_MOWER_ID, 'start', noon);
    expect(demoMower().state?.activity).toBe('mowing');
  });

  it('a mower in an animal-free area needs no guarded coop', () => {
    seed('open');
    const link = simLink({ name: 'Orchard', adapter: 'mqtt', guardHabitats: [], noAnimalsConfirmed: true, quietHours: null }, noon);
    expect(simMowers(noon).find((m) => m.link.deviceId === link.deviceId)?.blocked).toBeNull();
  });

  it('the "hens let out" event sends the demo mower home', async () => {
    seed('closed');
    const entry = await runScenario('mower-flock', noon);
    expect(entry.twin).toBe('tc:robot:robot-mower:mw_demo');
    expect(demoMower().state?.lastInterlock?.action).toBe('sent-home');
  });
});

describe('mower interlock rules', () => {
  const link = { deviceId: 'mw_1', name: 'L', adapter: 'home-assistant' as const, guardHabitats: ['ct_001'], noAnimalsConfirmed: false,
    quietHours: { start: 20, end: 7 }, createdAt: 0, updatedAt: 0 };
  const ctx = (over = {}) => ({ now: new Date(noon), estop: false, animalsSeen: [] as string[],
    habitat: () => ({ doorState: 'closed', ageMs: 1000 }), ...over });

  it('quiet hours wrap midnight', () => {
    expect(inQuietHours({ start: 20, end: 7 }, new Date(2026, 0, 1, 2))).toBe(true);
    expect(inQuietHours({ start: 20, end: 7 }, new Date(2026, 0, 1, 12))).toBe(false);
  });
  it('stale door state and animals seen both block', () => {
    expect(mowingBlockedReason(link, ctx({ habitat: () => ({ doorState: 'closed', ageMs: 120_000 }) }))).toMatch(/out of date/);
    expect(mowingBlockedReason(link, ctx({ animalsSeen: ['cat'] }))).toMatch(/cat/);
    expect(mowingBlockedReason(link, ctx())).toBeNull();
  });
});
