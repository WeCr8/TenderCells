// Exclusion zones (sent to robots over MQTT) and the Isaac Sim USD export.
import { describe, expect, it } from 'vitest';
import type { PropertyItem, PropertyLayoutState } from '../../components/property/propertyLayoutStore';
import { blockingZone, pathConflict, zonesFromLayout, zonesPayload } from '../../lib/yard/exclusionZones';
import { layoutToUsda, primName, toUsd } from '../../lib/yard/usdExport';

const item = (p: Partial<PropertyItem> & Pick<PropertyItem, 'id' | 'type' | 'kind'>): PropertyItem =>
  ({ name: p.id, x: 0, y: 0, width: 4, depth: 4, ...p });

const layout: PropertyLayoutState = {
  property: { name: 'Test yard', widthFt: 60, depthFt: 40, gridStepFt: 1 },
  items: [
    item({ id: 'septic', kind: 'obstacle', type: 'no-go-zone', x: 10, y: 10, width: 6, depth: 6 }),
    item({ id: 'oak', kind: 'obstacle', type: 'tree', x: 30, y: 5 }),
    item({ id: 'coop', kind: 'hardware', type: 'chicken-tender', x: 40, y: 20, deviceId: 'ct_001' }),
    item({ id: 'roost', kind: 'hardware', type: 'roaming-roost', x: 2, y: 30, width: 5, depth: 5, deviceId: 'rr_001',
      patrolPath: [{ x: 2, y: 13 }, { x: 25, y: 13 }] }),
  ],
};

describe('exclusion zones', () => {
  const zones = zonesFromLayout(layout);

  it('builds no-go, keep-out (buffered) and no-laser around animal housing, hard zones first', () => {
    // The Roaming Roost houses chickens too, so it gets a no-laser buffer (at its parked spot).
    expect(zones.map((z) => `${z.id}:${z.kind}`)).toEqual(['septic:no-go', 'oak:keep-out', 'coop:no-laser', 'roost:no-laser']);
    expect(zones.find((z) => z.id === 'coop')!.poly[0]).toEqual([34, 14]); // 6 ft laser buffer
  });

  it('drive is blocked by no-go / keep-out; laser also by no-laser', () => {
    expect(blockingZone(zones, 12, 12)?.id).toBe('septic');
    expect(blockingZone(zones, 36, 22)).toBeUndefined();
    expect(blockingZone(zones, 36, 22, 'laser')?.id).toBe('coop');
  });

  it('flags a patrol path that crosses a zone and passes a clear one', () => {
    expect(pathConflict(zones, layout.items[3].patrolPath!)?.zone.id).toBe('septic');
    expect(pathConflict(zones, [{ x: 0, y: 38 }, { x: 25, y: 38 }])).toBeUndefined();
  });

  it('payload carries the robot footprint and never lists the robot itself', () => {
    const p = zonesPayload(layout, layout.items[3], 5);
    expect(p).toMatchObject({ v: 1, seq: 5, units: 'ft', self: { itemId: 'roost', x: 2, y: 30, width: 5, depth: 5 } });
    expect(p.zones.some((z) => z.id === 'roost')).toBe(false);
  });
});

describe('Isaac Sim USD export', () => {
  const usda = layoutToUsda(layout, 10);

  it('is a Z-up metre stage with ground, items, cameras and physics', () => {
    expect(usda.startsWith('#usda 1.0')).toBe(true);
    expect(usda).toContain('upAxis = "Z"');
    expect(usda).toContain('metersPerUnit = 1');
    expect(usda).toContain('def Mesh "Ground"');
    expect(usda).toContain('def PhysicsScene');
    expect(usda).toContain('def Xform "coop"');
    expect(usda).toContain('custom string tc:deviceId = "ct_001"');
    expect(usda).toContain('def Camera "cam_cam1"'); // chicken-tender default mounts
    expect((usda.match(/\{/g) ?? []).length).toBe((usda.match(/\}/g) ?? []).length);
  });

  it('maps property feet to metres centred on the property, north = +Y', () => {
    expect(toUsd(30, 20, 0, 60, 40)).toEqual([0, 0, 0]);
    const [x, y] = toUsd(60, 0, 0, 60, 40);
    expect(x).toBeCloseTo(9.144);
    expect(y).toBeCloseTo(6.096);
  });

  it('makes valid prim names', () => {
    expect(primName('item-1 a')).toBe('item_1_a');
    expect(primName('9lives')).toBe('_9lives');
  });
});
