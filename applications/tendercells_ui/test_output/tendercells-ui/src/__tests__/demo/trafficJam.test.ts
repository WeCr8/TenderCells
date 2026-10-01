// Demo follow-up: the robot traffic jam (Roaming Roost on the mower's lawn holds mowing),
// "Why?" at three depths for every event, the new missions, and "how this becomes real".
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

import { SCENARIOS, WHY, runScenario } from '../../lib/demo/eventSimulator';
import { MISSIONS } from '../../lib/demo/missions';
import { mowingBlockedReason, mowerWorkArea, workAreaOccupants } from '../../lib/mower/mower';
import { DEMO_MOWER_ID, simMowers } from '../../lib/mower/mowerSim';
import { DEFAULT_PROPERTY, loadPropertyLayout, savePropertyLayout, type PropertyItem } from '../../components/property/propertyLayoutStore';
import { physicalLinks, physicalPath } from '../../lib/twin/physical';
import { existsSync } from 'node:fs';
import { resolve } from 'node:path';

const noon = new Date(2026, 8, 30, 12).getTime();
const item = (id: string, type: PropertyItem['type'], x: number, y: number, extra: Partial<PropertyItem> = {}): PropertyItem =>
  ({ id, name: extra.name ?? id, kind: 'hardware', type, x, y, width: type === 'roaming-roost' ? 5 : 3, depth: type === 'roaming-roost' ? 5 : 3, ...extra });
const seed = () => {
  localStorage.setItem('tendercells_demo_seeded_v1', 'now');
  localStorage.setItem('tendercells_demo_equipment_v1', JSON.stringify([
    { deviceId: 'ct_001', door: 'closed', feedLevelPct: 70, waterLevelPct: 60, sensors: { tempF: 70, humidityPct: 70, ammoniaPpm: 2 }, updatedAt: '' },
  ]));
  savePropertyLayout({ property: DEFAULT_PROPERTY, items: [
    item('coop', 'chicken-tender', 10, 8, { deviceId: 'ct_001' }),
    item('roost', 'roaming-roost', 30, 20, { name: 'Roaming Roost', deviceId: 'rr_001' }),
    item('mower', 'robot-mower', 70, 52, { name: 'Robot mower', deviceId: DEMO_MOWER_ID }),
  ] });
};
const demoMower = () => simMowers(noon).find((m) => m.link.deviceId === DEMO_MOWER_ID)!;

describe('robot traffic jam', () => {
  beforeEach(() => { localStorage.clear(); seed(); });

  it('the interlock holds mowing while mobile animal housing is in the work area', () => {
    const layout = loadPropertyLayout();
    expect(workAreaOccupants(layout, DEMO_MOWER_ID)).toEqual([]);
    const a = mowerWorkArea(layout, layout.items[2]);
    const moved = { ...layout, items: layout.items.map((i) => (i.id === 'roost' ? { ...i, x: a.x + 2, y: a.y + 2 } : i)) };
    expect(workAreaOccupants(moved, DEMO_MOWER_ID)).toEqual(['Roaming Roost']);
    const link = { deviceId: 'm', name: 'M', adapter: 'mqtt' as const, guardHabitats: [], noAnimalsConfirmed: true, quietHours: null, createdAt: 0, updatedAt: 0 };
    const ctx = { now: new Date(noon), estop: false, habitat: () => undefined, animalsSeen: [] as string[] };
    expect(mowingBlockedReason(link, { ...ctx, occupiedBy: ['Roaming Roost'] })).toMatch(/Roaming Roost is in the mower's work area/);
    expect(mowingBlockedReason(link, ctx)).toBeNull();
  });

  it('the event parks the roost on the mower lawn (clear of other items), holds the mower, and moving on clears it', async () => {
    expect(demoMower().blocked).toBeNull();
    await runScenario('traffic-jam', noon);
    const layout = loadPropertyLayout();
    const roost = layout.items.find((i) => i.id === 'roost')!;
    const a = mowerWorkArea(layout, layout.items.find((i) => i.id === 'mower')!);
    expect(roost.x >= a.x && roost.x + roost.width <= a.x + a.width).toBe(true);
    expect(demoMower().blocked).toMatch(/Roaming Roost is in the mower's work area/);
    await runScenario('roost-moves-on', noon + 1000);
    expect(loadPropertyLayout().items.find((i) => i.id === 'roost')).toMatchObject({ x: 30, y: 20 });
    expect(demoMower().blocked).toBeNull();
  });
});

describe('why, missions, hardware', () => {
  it('every event explains itself for kids and farmers (engineers get the chain)', () => {
    for (const s of SCENARIOS) {
      expect(WHY[s.id]?.kid, s.id).toBeTruthy();
      expect(WHY[s.id]?.farmer, s.id).toBeTruthy();
    }
  });

  it('the new missions use real events', () => {
    const ids = new Set(SCENARIOS.map((s) => s.id));
    for (const id of ['robot-traffic-jam', 'beat-the-heat', 'build-a-coop-brain']) {
      const m = MISSIONS.find((x) => x.id === id)!;
      expect(m, id).toBeTruthy();
      for (const st of m.steps) if (st.kind !== 'visit') expect(ids.has(st.scenario), `${id}:${st.scenario}`).toBe(true);
    }
  });

  it('every twin says how it becomes real, honestly', () => {
    const ct = physicalPath('chicken-tender');
    expect(ct.status).toBe('flashable');
    expect(physicalLinks(ct).map((l) => l.id)).toEqual(expect.arrayContaining(['build', 'flash', 'firmware', 'source']));
    expect(physicalPath('robot-mower').status).toBe('adapter');
    expect(physicalLinks(physicalPath('robot-mower')).some((l) => l.id === 'flash')).toBe(false);
    expect(physicalPath('goat-guardian').status).toBe('starter'); // no dedicated firmware yet
    for (const t of ['chicken-tender', 'roaming-roost', 'watchtower', 'duck-dock', 'weed-rover', 'camera-kit', 'goat-guardian']) {
      const p = physicalPath(t);
      expect(p.chain.length, t).toBeGreaterThan(2);
      // Firmware links point at folders that exist in this repo.
      if (p.firmware) expect(existsSync(resolve(__dirname, '../../../../../../..', p.firmware)), `${t}: ${p.firmware}`).toBe(true);
    }
  });
});
