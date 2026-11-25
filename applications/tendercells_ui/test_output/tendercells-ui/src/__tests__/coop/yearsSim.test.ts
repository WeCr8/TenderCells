import { describe, expect, it } from 'vitest';
import {
  BREEDS,
  BREED_IDS,
  DEFAULT_CONFIG,
  dayLengthHours,
  eggsByYear,
  lightFactor,
  seasonOf,
  simulateYears,
} from '../../lib/coop/yearsSim';

describe('day length', () => {
  it('is ~14.4 h at the June solstice and ~9.9 h at the December solstice near San Diego', () => {
    expect(dayLengthHours(32.9, 172)).toBeGreaterThan(14.1);
    expect(dayLengthHours(32.9, 172)).toBeLessThan(14.6);
    expect(dayLengthHours(32.9, 355)).toBeGreaterThan(9.6);
    expect(dayLengthHours(32.9, 355)).toBeLessThan(10.2);
  });
  it('is ~12 h at the equinox and swings more further north', () => {
    expect(Math.abs(dayLengthHours(42, 80) - 12)).toBeLessThan(0.3);
    expect(dayLengthHours(47, 172)).toBeGreaterThan(dayLengthHours(32.9, 172));
    expect(dayLengthHours(47, 355)).toBeLessThan(dayLengthHours(32.9, 355));
  });
});

describe('seasons and light', () => {
  it('maps months to northern seasons', () => {
    expect(seasonOf(new Date('2027-01-10T12:00:00Z'))).toBe('Winter');
    expect(seasonOf(new Date('2027-04-10T12:00:00Z'))).toBe('Spring');
    expect(seasonOf(new Date('2027-07-10T12:00:00Z'))).toBe('Summer');
    expect(seasonOf(new Date('2027-10-10T12:00:00Z'))).toBe('Autumn');
  });
  it('gives full lay at 14 h and a floor at 10 h', () => {
    expect(lightFactor(15, false)).toBe(1);
    expect(lightFactor(9, false)).toBe(0.25);
    expect(lightFactor(12, false)).toBeCloseTo(0.625, 3);
    expect(lightFactor(9, true)).toBeGreaterThan(lightFactor(9, false));
  });
});

describe('simulateYears', () => {
  const weeks = simulateYears({ ...DEFAULT_CONFIG, years: 5 });

  it('runs 52 weeks per year and keeps running totals monotonic', () => {
    expect(weeks).toHaveLength(260);
    for (let i = 1; i < weeks.length; i++) {
      expect(weeks[i].totalEggs).toBeGreaterThanOrEqual(weeks[i - 1].totalEggs);
      expect(weeks[i].doorCycles).toBeGreaterThan(weeks[i - 1].doorCycles);
    }
  });

  it('never lays more than 7 eggs per hen per week', () => {
    for (const w of weeks) for (const h of w.hens) expect(h.eggs).toBeLessThanOrEqual(7);
  });

  it('first-year eggs per breed stay inside the extension ranges with a coop light (no molt in year 1)', () => {
    const lit = eggsByYear(simulateYears({ ...DEFAULT_CONFIG, years: 2, coopLight: true }));
    const y1 = lit[0].byBreed;
    // USU/UNH ranges, minus a few weeks of not-yet-laying pullets and ramp-up.
    expect(y1.leghorn!).toBeGreaterThan(220);
    expect(y1.leghorn!).toBeLessThan(320);
    expect(y1.buffOrpington!).toBeGreaterThan(140);
    expect(y1.buffOrpington!).toBeLessThan(280);
  });

  it('lays fewer eggs each year, and Leghorns drop faster than Orpingtons', () => {
    const rows = eggsByYear(weeks);
    for (let i = 2; i < rows.length; i++) expect(rows[i].total).toBeLessThan(rows[i - 1].total);
    const keepLeg = rows[3].byBreed.leghorn! / rows[2].byBreed.leghorn!;
    const keepBuff = rows[3].byBreed.buffOrpington! / rows[2].byBreed.buffOrpington!;
    expect(keepLeg).toBeLessThan(keepBuff);
  });

  it('winter weeks lay less than summer weeks without a coop light, and the light narrows the gap', () => {
    const y2 = weeks.filter((w) => w.year === 2);
    const summer = y2.filter((w) => w.season === 'Summer').reduce((n, w) => n + w.eggs, 0);
    const winter = y2.filter((w) => w.season === 'Winter').reduce((n, w) => n + w.eggs, 0);
    expect(winter).toBeLessThan(summer);
    const lit = simulateYears({ ...DEFAULT_CONFIG, years: 5, coopLight: true }).filter((w) => w.year === 2 && w.season === 'Winter');
    expect(lit.reduce((n, w) => n + w.eggs, 0)).toBeGreaterThan(winter);
  });

  it('pauses laying for a molt in the second autumn', () => {
    const molt = weeks.filter((w) => w.hens.some((h) => h.molting));
    expect(molt.length).toBeGreaterThan(0);
    expect(molt[0].season).toBe('Autumn');
    expect(molt[0].year).toBe(2);
  });

  it('counts one DoorCell cycle a day and gantry routines only on Plus/Pro', () => {
    const last = weeks[weeks.length - 1];
    expect(last.doorCycles).toBe(260 * 7);
    expect(last.cleanRuns).toBe(260 * 7);
    expect(last.eggRuns).toBe(260 * 14);
    const starter = simulateYears({ ...DEFAULT_CONFIG, tier: 'starter' });
    expect(starter[starter.length - 1].cleanRuns).toBe(0);
    expect(starter[starter.length - 1].eggRuns).toBe(0);
  });

  it('raises DoorCell rack reminders as cycles pile up', () => {
    const ids = weeks.flatMap((w) => w.reminders.map((r) => r.id));
    expect(ids).toContain('rack-inspect');
    expect(ids).toContain('rack-replace');
    expect(ids).toContain('predator-walk');
    expect(ids).toContain('bedding-change');
  });

  it('feed matches ~0.25 lb (100-150 g) per hen per day', () => {
    const perHenPerDay = (weeks[0].feedKg * 1000) / 7 / BREED_IDS.length;
    expect(perHenPerDay).toBeGreaterThanOrEqual(100);
    expect(perHenPerDay).toBeLessThanOrEqual(150);
  });

  it('removing hens from the flock removes their eggs and feed', () => {
    const two = simulateYears({ ...DEFAULT_CONFIG, flock: ['leghorn', 'australorp'] });
    expect(two[0].hens).toHaveLength(2);
    expect(two[0].feedKg).toBeCloseTo(((BREEDS.leghorn.feedGPerDay + BREEDS.australorp.feedGPerDay) * 7) / 1000, 5);
  });
});
