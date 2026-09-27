// Terrain zones + elevation: height model shared by the 2D editor and the 3D ground.
import { describe, expect, it } from 'vitest';
import { heightAt, normalizePoint, normalizeZone, zoneAt, type TerrainLayers } from '../../components/property/terrain';

describe('heightAt', () => {
  it('is flat with no terrain detail', () => {
    expect(heightAt({}, 10, 10)).toBe(0);
  });

  it('elevation points peak at the centre and fall to 0 at the radius', () => {
    const t: TerrainLayers = { elevationPoints: [{ id: 'k', x: 50, y: 50, heightFt: 3, radiusFt: 10 }] };
    expect(heightAt(t, 50, 50)).toBeCloseTo(3);
    expect(heightAt(t, 55, 50)).toBeCloseTo(1.5);
    expect(heightAt(t, 60, 50)).toBeCloseTo(0);
    expect(heightAt(t, 70, 50)).toBe(0);
  });

  it('raised zones are level inside and blend at the edges', () => {
    const t: TerrainLayers = { terrainZones: [{ id: 'z', name: 'bed', kind: 'garden-soil', x: 10, y: 10, width: 10, depth: 10, elevationFt: 1 }] };
    expect(heightAt(t, 15, 15)).toBeCloseTo(1);
    const edge = heightAt(t, 9, 15); // 1 ft outside the edge, inside the 2 ft blend
    expect(edge).toBeGreaterThan(0);
    expect(edge).toBeLessThan(1);
    expect(heightAt(t, 5, 15)).toBe(0);
  });

  it('a robot-measured grid wins where it has data', () => {
    const t: TerrainLayers = {
      elevationPoints: [{ id: 'k', x: 1, y: 1, heightFt: 5, radiusFt: 20 }],
      elevationGrid: { originX: 0, originY: 0, stepFt: 2, cols: 2, rows: 2, heightsFt: [0, 2, 0, 2], source: 'robot' },
    };
    expect(heightAt(t, 1, 1)).toBeCloseTo(1); // bilinear between 0 and 2
    expect(heightAt(t, 10, 1)).toBeGreaterThan(0); // outside the grid -> points
  });
});

describe('zones', () => {
  it('finds the topmost zone and supports robot polygons', () => {
    const t: TerrainLayers = {
      terrainZones: [
        { id: 'a', name: 'lawn', kind: 'lawn', x: 0, y: 0, width: 20, depth: 20 },
        { id: 'b', name: 'gravel', kind: 'gravel', x: 5, y: 5, width: 5, depth: 5 },
        { id: 'c', name: 'mapped', kind: 'mulch', x: 0, y: 0, width: 1, depth: 1, source: 'robot',
          polygon: [{ x: 30, y: 30 }, { x: 40, y: 30 }, { x: 35, y: 40 }] },
      ],
    };
    expect(zoneAt(t, 6, 6)?.id).toBe('b');
    expect(zoneAt(t, 15, 15)?.id).toBe('a');
    expect(zoneAt(t, 35, 33)?.id).toBe('c');
    expect(zoneAt(t, 0.5, 0.5)?.id).toBe('a'); // the polygon zone ignores its rect
  });

  it('normalizes editor input into the property', () => {
    const z = normalizeZone({ id: 'z', name: 'x', kind: 'nope' as never, x: 95, y: -3, width: 30, depth: 0, elevationFt: 99 }, 80, 60);
    expect(z).toMatchObject({ kind: 'lawn', x: 50, y: 0, width: 30, depth: 1, elevationFt: 20 });
    expect(normalizePoint({ id: 'p', x: -1, y: 999, heightFt: -40, radiusFt: 0 }, 80, 60))
      .toMatchObject({ x: 0, y: 60, heightFt: -20, radiusFt: 1 });
  });
});
