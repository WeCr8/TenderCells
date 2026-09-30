// Demo event simulator + missions: events change the demo devices, the log keeps the full
// cause -> effect chain ("Why did this happen?"), and missions tick off from what was done.
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

import { SCENARIOS, markExplained, readEventLog, runScenario } from '../../lib/demo/eventSimulator';
import { MISSIONS, missionProgress, stepDone } from '../../lib/demo/missions';
import { getDemoEquipment } from '../../services/demo/demoEnvironment';

const seedEquipment = () => localStorage.setItem('tendercells_demo_equipment_v1', JSON.stringify([
  { deviceId: 'ct_001', door: 'open', feedLevelPct: 70, waterLevelPct: 60, sensors: { tempF: 70, humidityPct: 70, ammoniaPpm: 2 }, updatedAt: '' },
]));

describe('demo event simulator', () => {
  beforeEach(() => { localStorage.clear(); seedEquipment(); });

  it('every scenario is a complete chain from a device to a notification, with real links', () => {
    for (const s of SCENARIOS) {
      expect(s.steps[0].kind, s.id).toBe('device');
      expect(s.steps.at(-1)!.kind, s.id).toBe('notify');
      expect(s.steps.some((st) => st.kind === 'os'), s.id).toBe(true);
      expect(s.see.path.startsWith('/'), s.id).toBe(true);
      expect(s.learn.href.startsWith('/') && s.build.href.startsWith('/'), s.id).toBe(true);
    }
  });

  it('a predator closes the Chicken Tender door and logs the chain', async () => {
    const entry = await runScenario('predator', 1000);
    expect(getDemoEquipment('ct_001')[0].door).toBe('closed');
    expect(entry.steps.map((s) => s.kind)).toEqual(['device', 'ai', 'rule', 'os', 'actuator', 'action', 'notify']);
    expect(readEventLog()[0]).toMatchObject({ scenarioId: 'predator', outcome: 'Chicken Tender door closed and you were alerted.' });
  });

  it('low water refills and low feed is recorded on the device', async () => {
    await runScenario('water-low');
    await runScenario('feed-low');
    const ct = getDemoEquipment('ct_001')[0];
    expect(ct.waterLevelPct).toBe(95);
    expect(ct.feedLevelPct).toBe(15);
    expect(readEventLog().map((e) => e.scenarioId)).toEqual(['feed-low', 'water-low']); // newest first
  });

  it('rejects unknown events', async () => {
    await expect(runScenario('meteor')).rejects.toThrow(/Unknown event/);
  });
});

describe('missions', () => {
  beforeEach(() => { localStorage.clear(); seedEquipment(); });

  it('tick off from triggered events, opened explanations and visited pages', async () => {
    const m = MISSIONS.find((x) => x.id === 'protect-the-flock')!;
    expect(missionProgress(m, readEventLog(), [])).toEqual({ done: 0, total: 3 });
    const entry = await runScenario('predator');
    expect(missionProgress(m, readEventLog(), [])).toEqual({ done: 1, total: 3 });
    markExplained(entry.id);
    expect(stepDone(m.steps[1], readEventLog(), [])).toBe(true);
    expect(missionProgress(m, readEventLog(), ['/predator-monitor'])).toEqual({ done: 3, total: 3 });
  });

  it('every mission step points at a real scenario, and ends with a build link', () => {
    const ids = new Set(SCENARIOS.map((s) => s.id));
    for (const m of MISSIONS) {
      for (const s of m.steps) if (s.kind !== 'visit') expect(ids.has(s.scenario), `${m.id}: ${s.scenario}`).toBe(true);
      expect(m.build.href.startsWith('/'), m.id).toBe(true);
    }
  });
});
