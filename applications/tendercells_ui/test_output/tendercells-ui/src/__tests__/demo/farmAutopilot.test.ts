// Demo farm autopilot: every unit gets work, and robot routes obey the same rules as real
// robots - inside the property boundary and its margin, never through a no-go / keep-out zone.
import { describe, expect, it } from 'vitest';
import { DEFAULT_ITEMS, DEFAULT_PROPERTY, type PropertyItem, type PropertyLayoutState } from '../../components/property/propertyLayoutStore';
import { buildAutopilot, connectLoop, findPath, jobAt, poseAt } from '../../lib/demo/farmAutopilot';
import { effectiveBoundary, insideBoundary } from '../../lib/yard/boundary';
import { blockingZone, zonesFromLayout } from '../../lib/yard/exclusionZones';

const robot = (id: string, type: PropertyItem['type'], x: number, y: number): PropertyItem =>
  ({ id, name: id, kind: 'hardware', type, x, y, width: 3, depth: 3 });
const layout: PropertyLayoutState = {
  property: DEFAULT_PROPERTY,
  items: [...DEFAULT_ITEMS, robot('rover', 'weed-rover', 44, 4), robot('mower', 'robot-mower', 70, 52)],
};

describe('farm autopilot', () => {
  const plan = buildAutopilot(layout);

  it('gives every unit a job: robots drive, beds scan, stations work', () => {
    const role = Object.fromEntries(plan.units.map((u) => [u.itemId, u.role]));
    expect(role).toMatchObject({ rover: 'drive', mower: 'drive', 'item-roaming-roost': 'drive', 'item-garden-genesis': 'bed', 'item-chicken-tender': 'station' });
    const coop = plan.units.find((u) => u.itemId === 'item-chicken-tender')!;
    expect(new Set([0, 12, 24, 36].map((t) => jobAt(coop, t))).size).toBeGreaterThan(2);
  });

  it('robot routes stay inside the boundary and out of every zone, along every segment', () => {
    const b = effectiveBoundary(layout);
    const zones = zonesFromLayout(layout);
    for (const u of plan.units.filter((v) => v.role === 'drive')) {
      const pts = u.route!.points;
      expect(pts.length).toBeGreaterThan(4);
      for (let i = 0; i < pts.length; i++) {
        const a = pts[i], c = pts[(i + 1) % pts.length];
        for (let k = 0; k <= 10; k++) {
          const x = a.x + ((c.x - a.x) * k) / 10, y = a.y + ((c.y - a.y) * k) / 10;
          expect(insideBoundary(b, x, y), `${u.itemId} at ${x},${y}`).toBe(true);
          expect(blockingZone(zones, x, y, 'drive', u.itemId)?.id, `${u.itemId} at ${x},${y}`).toBeUndefined();
        }
      }
    }
  });

  it('poses move smoothly along the loop and wrap around', () => {
    const rover = plan.units.find((u) => u.itemId === 'rover')!.route!;
    const a = poseAt(rover, 0), b = poseAt(rover, 1);
    expect(Math.hypot(b.x - a.x, b.y - a.y)).toBeCloseTo(rover.speedFtS, 0);
    const lap = rover.lengthFt / rover.speedFtS;
    expect(poseAt(rover, lap + 1).x).toBeCloseTo(b.x, 5);
  });

  it('path search goes round a wall and reports an unreachable goal', () => {
    const wall = (x: number, y: number) => x === 5 && y < 9;
    const path = findPath({ x: 0, y: 0 }, { x: 10, y: 0 }, wall, 12, 12)!;
    expect(path.some((p) => p.y >= 9)).toBe(true);
    expect(path.every((p) => !wall(p.x, p.y))).toBe(true);
    expect(findPath({ x: 0, y: 0 }, { x: 10, y: 0 }, (x) => x === 5, 12, 12)).toBeNull();
    expect(connectLoop([{ x: 0, y: 0 }, { x: 10, y: 0 }], wall, 12, 12).length).toBeGreaterThan(2);
  });
});
