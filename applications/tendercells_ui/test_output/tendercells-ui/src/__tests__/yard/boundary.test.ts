// Property boundary (geofence) and robot-survey proposals: robots stay inside the boundary and
// its margin; a survey only proposes a new boundary, and widening needs the owner's confirmation.
import { describe, expect, it } from 'vitest';
import type { PropertyItem, PropertyLayoutState } from '../../components/property/propertyLayoutStore';
import {
  acceptBlocker, applyProposal, effectiveBoundary, insideBoundary, itemsOutside, pathLeavesBoundary, proposalFromSurvey,
  rectPoly, simulateSurvey, type Survey,
} from '../../lib/yard/boundary';
import { routeConflict, zonesPayload } from '../../lib/yard/exclusionZones';
import { coverageRoute, routeFromPath } from '../../lib/yard/roverPlan';

const item = (p: Partial<PropertyItem> & Pick<PropertyItem, 'id' | 'type' | 'kind'>): PropertyItem =>
  ({ name: p.id, x: 0, y: 0, width: 4, depth: 4, ...p });

const layout: PropertyLayoutState = {
  property: { name: 'Test yard', widthFt: 60, depthFt: 40, gridStepFt: 1 },
  items: [
    item({ id: 'rover', kind: 'hardware', type: 'weed-rover', x: 10, y: 10, deviceId: 'rv_001' }),
    item({ id: 'shed', kind: 'obstacle', type: 'building', x: 58, y: 20 }),
  ],
};

describe('property boundary', () => {
  it('defaults to the property rectangle with a 2 ft margin', () => {
    const b = effectiveBoundary(layout);
    expect(b).toMatchObject({ source: 'layout', marginFt: 2, poly: rectPoly(0, 0, 60, 40) });
    expect(insideBoundary(b, 30, 20)).toBe(true);
    expect(insideBoundary(b, 59, 20)).toBe(false); // inside, but within the margin
    expect(insideBoundary(b, 70, 20)).toBe(false);
    expect(itemsOutside(layout, b).map((i) => i.id)).toEqual(['shed']);
  });

  it('flags paths that leave it, as a route conflict too', () => {
    const b = effectiveBoundary(layout);
    expect(pathLeavesBoundary(b, [{ x: 10, y: 10 }, { x: 50, y: 10 }])).toBeUndefined();
    expect(pathLeavesBoundary(b, [{ x: 10, y: 10 }, { x: 70, y: 10 }])).toBeDefined();
    expect(routeConflict(layout, [{ x: 10, y: 10 }, { x: 70, y: 10 }])?.zone.id).toBe('boundary');
  });

  it('is sent to robots inside the zones payload', () => {
    const drawn: PropertyLayoutState = { ...layout, property: { ...layout.property, boundary: { poly: rectPoly(5, 5, 40, 30), source: 'drawn', marginFt: 3 } } };
    expect(zonesPayload(drawn, 'rover').boundary).toEqual({ poly: rectPoly(5, 5, 40, 30), marginFt: 3, source: 'drawn' });
  });

  it('keeps rover routes inside it', () => {
    const b = effectiveBoundary(layout);
    const stay = (x: number, y: number) => insideBoundary(b, x, y);
    expect(coverageRoute({ x: 0, y: 0, width: 60, depth: 40 }, [], 4, 2, undefined, stay).every((q) => stay(q.x, q.y))).toBe(true);
    expect(routeFromPath([{ x: 10, y: 10 }, { x: 70, y: 10 }], [], 2, undefined, stay).every((q) => stay(q.x, q.y))).toBe(true);
  });
});

describe('survey proposals', () => {
  const survey = simulateSurvey(layout, 'rv_001');

  it('the robot only samples ground inside the current boundary', () => {
    const b = effectiveBoundary(layout);
    expect(survey.samples.length).toBeGreaterThan(100);
    expect(survey.samples.every((q) => insideBoundary(b, q.x, q.y))).toBe(true);
  });

  it('measures dimensions, terrain and suggests keep-outs for steep and wet ground', () => {
    const p = proposalFromSurvey(layout, survey);
    expect(p.widthFt).toBeGreaterThan(60);
    expect(p.expandsFt).toBeGreaterThan(3);
    expect(p.maxSlopePct).toBeGreaterThan(35);
    expect(p.wetSpots).toBeGreaterThan(0);
    expect(p.suggestedZones.map((z) => z.reason)).toEqual(expect.arrayContaining(['steep', 'water']));
    expect(p.grid.source).toBe('robot');
  });

  it('never widens without confirmation, and not on thin coverage', () => {
    const p = proposalFromSurvey(layout, survey);
    expect(acceptBlocker(p, false)).toMatch(/confirm/);
    expect(() => applyProposal(layout, p, { confirmExpansion: false, addZones: false })).toThrow(/confirm/);
    expect(acceptBlocker({ ...p, confidence: 0.2, coveragePct: 20 }, true)).toMatch(/Coverage/);
  });

  it('applies an accepted proposal: survey boundary, measured grid, map grown, zones added', () => {
    const p = proposalFromSurvey(layout, survey);
    const next = applyProposal(layout, p, { confirmExpansion: true, addZones: true });
    expect(next.property.boundary).toMatchObject({ source: 'survey', marginFt: 2, deviceId: 'rv_001' });
    expect(next.property.widthFt).toBeGreaterThanOrEqual(64);
    expect(next.property.elevationGrid?.source).toBe('robot');
    expect(next.items.filter((i) => i.type === 'no-go-zone')).toHaveLength(p.suggestedZones.length);
    expect(layout.property.boundary).toBeUndefined(); // original untouched
  });

  it('a shrinking survey needs no confirmation', () => {
    const edge = rectPoly(5, 5, 40, 30).flatMap(([x, y], i, a) => {
      const [nx, ny] = a[(i + 1) % a.length];
      return [[x, y], [(x + nx) / 2, (y + ny) / 2]] as Array<[number, number]>;
    });
    const samples: Survey['samples'] = [];
    for (let y = 6; y < 35; y += 2) for (let x = 6; x < 45; x += 2) samples.push({ x, y, z: 0 });
    const p = proposalFromSurvey(layout, { deviceId: 'rv_001', at: 1, edge, stepFt: 2, samples });
    expect(p.expandsFt).toBe(0);
    expect(p.shrinksFt).toBeGreaterThan(5);
    expect(acceptBlocker(p, false)).toBeNull();
  });
});
