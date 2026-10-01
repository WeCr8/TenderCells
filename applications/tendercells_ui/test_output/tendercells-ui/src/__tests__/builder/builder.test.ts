// Builder: every mission and project passes the content contract (step / cue / safety enums,
// known assets, real demo events, a checkpoint), depth layers fall back, and local progress
// saves, clamps, completes and resets.
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

import { LADDER, MANIFEST, builderItem, instructionAt } from '../../features/builder/lib/registry';
import { validateItem } from '../../features/builder/lib/validate';
import { complete, isComplete, readProgress, resetItem, saveStep } from '../../features/builder/lib/progress';
import { SCENARIOS } from '../../lib/demo/eventSimulator';

const scenarios = new Set(SCENARIOS.map((s) => s.id));

describe('builder content', () => {
  it('every mission and project passes the contract', () => {
    for (const item of LADDER) expect(validateItem(item, scenarios), item.id).toEqual([]);
  });

  it('the ladder starts with no-hardware missions in manifest order, then hardware builds', () => {
    expect(LADDER.map((i) => i.id).slice(0, MANIFEST.missions.length)).toEqual(MANIFEST.missions.map((m) => m.id));
    expect(LADDER.slice(0, 6).every((i) => !i.hardware)).toBe(true);
    expect(LADDER.slice(6).map((i) => i.id)).toEqual(['electronics-blink-xiao', 'starter-node-first-coop-brain']);
  });

  it('missions explain each step differently for young, beginner, advanced and teacher', () => {
    for (const m of LADDER.filter((i) => i.kind === 'mission')) {
      for (const s of m.steps) {
        const texts = new Set(['young', 'beginner', 'advanced', 'teacher'].map((d) => instructionAt(s, d as never)));
        expect(texts.size, s.id).toBe(4);
      }
    }
  });

  it('the validator catches bad content', () => {
    const bad = { ...builderItem('electronics-blink-xiao')!, steps: [{ id: 'x', type: 'dance', action: 'a', instruction: 'b',
      safety: ['MAYBE'], image: { base_asset: 'nope', cues: [{ type: 'sparkle' }] }, demo: { run: 'unknown', label: 'x' } }] } as never;
    const errs = validateItem(bad, scenarios).join('\n');
    for (const m of [/bad type/, /bad safety gate/, /unknown asset/, /bad cue/, /not a demo event/, /checkpoint/]) expect(errs).toMatch(m);
  });

  it('wiring steps make you power off first', () => {
    const blink = builderItem('electronics-blink-xiao')!;
    const wiring = blink.steps.filter((s) => s.type === 'electronics' && s.action === 'Place');
    expect(wiring.length).toBeGreaterThan(0);
    for (const s of wiring) expect(s.safety, s.id).toContain('POWER_OFF_REQUIRED');
  });
});

describe('builder progress', () => {
  beforeEach(() => localStorage.clear());

  it('saves, clamps, completes and resets', () => {
    saveStep('m', 3, 5);
    expect(readProgress().m.step).toBe(3);
    saveStep('m', 99, 5);
    expect(readProgress().m.step).toBe(4);
    saveStep('m', -2, 5);
    expect(readProgress().m.step).toBe(0);
    complete('m', 1000);
    expect(isComplete(readProgress(), 'm')).toBe(true);
    complete('m', 2000);
    expect(readProgress().m.completedAt).toBe(1000); // first completion is kept
    resetItem('m');
    expect(readProgress().m).toBeUndefined();
  });
});
