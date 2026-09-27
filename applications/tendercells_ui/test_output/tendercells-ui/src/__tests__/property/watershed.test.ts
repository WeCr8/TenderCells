// Watershed model: puddles, drainage fixes, erosion.
import { describe, expect, it } from 'vitest';
import { analyzeWatershed, compareWatershed, swalePlan, type HydrologyInput } from '../../components/property/watershed';

const bowl: HydrologyInput = {
  widthFt: 60, depthFt: 60, items: [], scenario: 'storm', cellFt: 1,
  terrain: { elevationPoints: [{ id: 'dip', x: 30, y: 30, heightFt: -1, radiusFt: 10 }] },
};

describe('analyzeWatershed', () => {
  it('a flat yard sheds water off the edges without puddles', () => {
    const r = analyzeWatershed({ ...bowl, terrain: {} });
    expect(r.puddles).toHaveLength(0);
    expect(r.summary.runoffGal).toBeGreaterThan(0);
  });

  it('light rain soaks into lawn (no runoff)', () => {
    const r = analyzeWatershed({ ...bowl, scenario: 'light' });
    expect(r.summary.runoffGal).toBe(0);
    expect(r.puddles).toHaveLength(0);
  });

  it('a dip holds a puddle centred on it, no deeper than the dip', () => {
    const r = analyzeWatershed(bowl);
    expect(r.puddles).toHaveLength(1);
    const p = r.puddles[0];
    expect(Math.abs(p.x - 30)).toBeLessThan(2);
    expect(Math.abs(p.y - 30)).toBeLessThan(2);
    expect(p.maxDepthIn).toBeGreaterThan(0);
    expect(p.maxDepthIn).toBeLessThanOrEqual(12.01);
  });

  it('heavier rain makes a bigger puddle', () => {
    const heavy = analyzeWatershed({ ...bowl, scenario: 'heavy' });
    const storm = analyzeWatershed(bowl);
    expect(storm.summary.pondedGal).toBeGreaterThanOrEqual(heavy.summary.pondedGal);
  });

  it('a drain or fill in the low spot removes the puddle', () => {
    const drain = analyzeWatershed({ ...bowl, fixes: [{ id: 'd', kind: 'drain', x: 30, y: 30, sizeFt: 2, depthFt: 0 }] });
    expect(drain.summary.puddleAreaSqFt).toBeLessThan(analyzeWatershed(bowl).summary.puddleAreaSqFt * 0.2);
    const fill = analyzeWatershed({ ...bowl, fixes: [{ id: 'f', kind: 'fill', x: 30, y: 30, sizeFt: 11, depthFt: 1.1 }] });
    expect(fill.summary.puddleAreaSqFt).toBeLessThan(analyzeWatershed(bowl).summary.puddleAreaSqFt * 0.1);
    expect(fill.summary.maxPuddleDepthIn).toBeLessThan(0.5); // at most a thin film where the shapes differ
  });

  it('a graded swale from the low spot to the property edge drains it', () => {
    const fix = { id: 's', kind: 'swale' as const, x: 30, y: 30, x2: 30, y2: 59.5, sizeFt: 2, depthFt: 0.5 };
    const base = (x: number, y: number) => (Math.hypot(x - 30, y - 30) < 10 ? -0.5 * (1 + Math.cos(Math.PI * Math.hypot(x - 30, y - 30) / 10)) : 0);
    const plan = swalePlan(fix, base);
    expect(plan.lengthFt).toBeCloseTo(29.5);
    expect(plan.maxCutFt).toBeGreaterThan(1.5); // it has to cut through the rim to drain a bowl
    expect(plan.capped).toBe(false);
    const r = analyzeWatershed({ ...bowl, fixes: [fix] });
    expect(r.summary.puddleAreaSqFt).toBeLessThan(analyzeWatershed(bowl).summary.puddleAreaSqFt * 0.2);
  });

  it('bare dirt on a slope erodes more than lawn, and a berm changes the result', () => {
    const slope: HydrologyInput = {
      widthFt: 60, depthFt: 60, items: [], scenario: 'storm', cellFt: 1,
      terrain: { elevationPoints: [{ id: 'hill', x: 30, y: 0, heightFt: 6, radiusFt: 60 }] },
    };
    const lawn = analyzeWatershed(slope);
    const dirt = analyzeWatershed({ ...slope, baseSurface: 'dry' });
    expect(dirt.summary.erosionIndexTotal).toBeGreaterThan(lawn.summary.erosionIndexTotal * 2);
    const bermed = analyzeWatershed({ ...slope, baseSurface: 'dry', fixes: [{ id: 'b', kind: 'berm', x: 5, y: 30, x2: 55, y2: 30, sizeFt: 2, depthFt: 1 }] });
    const cmp = compareWatershed(dirt, bermed);
    expect(cmp.erosionIndexChangePct).not.toBe(0); // flow is redirected around the berm
    expect(typeof cmp.erosionWorse).toBe('boolean');
  });

  it('roofs shed water and ponds collect it', () => {
    const r = analyzeWatershed({
      ...bowl, scenario: 'light', terrain: {},
      items: [{ type: 'building', kind: 'obstacle', x: 10, y: 10, width: 10, depth: 10 }],
    });
    expect(r.summary.runoffGal).toBeGreaterThan(0); // only the roof runs off in light rain
    const pond = analyzeWatershed({ ...bowl, items: [{ type: 'pond', kind: 'obstacle', x: 25, y: 25, width: 10, depth: 10 }] });
    expect(pond.puddles).toHaveLength(0); // the pond is the outlet
  });
});
