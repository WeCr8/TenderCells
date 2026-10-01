// Builder: every mission and project passes the content contract (step / cue / safety enums,
// known assets, real demo events, a checkpoint), depth layers fall back, and local progress
// saves, clamps, completes and resets.
import { existsSync } from 'node:fs';
import { resolve } from 'node:path';
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

import { ALL_ITEMS, BOOKS, LADDER, MANIFEST, builderItem, instructionAt } from '../../features/builder/lib/registry';
import { ASSETS } from '../../features/builder/lib/assets';
import catalog from '../../features/builder/data/parts-catalog.json';
import { validateItem } from '../../features/builder/lib/validate';
import { complete, isComplete, readProgress, resetItem, saveStep } from '../../features/builder/lib/progress';
import { SCENARIOS } from '../../lib/demo/eventSimulator';

const scenarios = new Set(SCENARIOS.map((s) => s.id));
const PUBLIC = resolve(__dirname, '../../../public/builder-assets');
const hasFile = (p: string) => existsSync(resolve(PUBLIC, p));

describe('builder content', () => {
  it('every mission and project passes the contract', () => {
    for (const item of ALL_ITEMS) expect(validateItem(item, scenarios, hasFile), item.id).toEqual([]);
  });

  it('every mission has a published cover image', () => {
    for (const m of LADDER.filter((i) => i.kind === 'mission')) expect(m.cover && hasFile(m.cover), m.id).toBeTruthy();
  });

  it('concept books stay out of the ladder, are labelled concept and show a page per step', () => {
    expect(BOOKS.length).toBeGreaterThan(0);
    for (const b of BOOKS) {
      expect(LADDER.some((i) => i.id === b.id), b.id).toBe(false);
      expect(b.concept).toBe(true);
      expect(b.conceptNote).toBeTruthy();
      expect(b.steps.every((s) => s.image?.step_asset && hasFile(s.image.step_asset))).toBe(true);
    }
    const door = builderItem('chicken-tender-door-book')!;
    expect(door.steps).toHaveLength(21);
    const wiring = door.steps.filter((s) => s.type === 'electronics');
    for (const s of wiring) expect(s.safety, s.id).toContain('POWER_OFF_REQUIRED');
  });

  it('every parts-catalog entry resolves to a known asset', () => {
    for (const p of catalog.parts) expect(ASSETS[p.asset_id], p.asset_id).toBeDefined();
  });

  it('the validator reports missing images', () => {
    const errs = validateItem({ ...builderItem('chicken-tender-door-book')!, cover: 'nope.webp' }, scenarios, () => false).join('\n');
    expect(errs).toMatch(/missing cover/);
    expect(errs).toMatch(/missing image/);
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
