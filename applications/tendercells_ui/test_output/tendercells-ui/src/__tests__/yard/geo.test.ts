// GPS <-> property feet: the groundwork for real-time GPS and map overlays.
import { describe, expect, it } from 'vitest';
import { fixGoodEnough, tileFor, toLatLon, toProperty } from '../../lib/yard/geo';

describe('geo anchor', () => {
  const north = { lat: 45.5, lon: -122.6, bearingDeg: 90 }; // +x east, +y south (map-up = north)

  it('maps east to +x and south to +y when the property faces north', () => {
    const east = toLatLon(north, 100, 0), south = toLatLon(north, 0, 50);
    expect(east.lon).toBeGreaterThan(north.lon);
    expect(east.lat).toBeCloseTo(north.lat, 9);
    expect(south.lat).toBeLessThan(north.lat);
    expect(toProperty(north, east.lat, east.lon).x).toBeCloseTo(100, 6);
  });

  it('round-trips at any bearing to well under an inch', () => {
    for (const bearingDeg of [0, 37, 90, 200, 315]) {
      const a = { ...north, bearingDeg };
      const g = toLatLon(a, 63.2, 41.7);
      const p = toProperty(a, g.lat, g.lon);
      expect(Math.hypot(p.x - 63.2, p.y - 41.7)).toBeLessThan(0.01);
    }
  });

  it('finds the imagery tile and judges fix precision against the margin', () => {
    expect(tileFor(0, 0, 1)).toEqual({ x: 1, y: 1, z: 1 });
    expect(fixGoodEnough(0.1, 2)).toBe(true);   // RTK
    expect(fixGoodEnough(8, 2)).toBe(false);    // phone GPS
  });
});
