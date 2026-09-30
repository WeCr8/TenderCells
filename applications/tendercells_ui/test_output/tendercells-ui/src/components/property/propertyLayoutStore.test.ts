import { describe, it, expect } from 'vitest';
import { computeMountPosition } from './propertyLayoutStore';

describe('computeMountPosition', () => {
  it('centers the camera on the parent\'s top-right corner', () => {
    const parent = { x: 10, y: 8, width: 4 };
    const camera = { width: 2, depth: 2 };
    expect(computeMountPosition(parent, camera)).toEqual({ x: 13, y: 7 });
  });

  it('scales with a larger parent footprint (e.g. Goat Guardian, 6x6)', () => {
    const parent = { x: 0, y: 0, width: 6 };
    const camera = { width: 2, depth: 2 };
    expect(computeMountPosition(parent, camera)).toEqual({ x: 5, y: -1 });
  });

  it('is independent of the parent\'s y/depth - only x/width and the camera size matter', () => {
    const camera = { width: 2, depth: 2 };
    const a = computeMountPosition({ x: 10, y: 8, width: 4 }, camera);
    const b = computeMountPosition({ x: 10, y: 100, width: 4 }, camera);
    expect(a.x).toBe(b.x);
    expect(b.y).toBe(99); // still parent.y - camera.depth/2, just at the new y
  });

  it('handles a camera footprint larger than a tiny parent without going negative in a surprising way', () => {
    const parent = { x: 0, y: 0, width: 1 };
    const camera = { width: 2, depth: 2 };
    expect(computeMountPosition(parent, camera)).toEqual({ x: 0, y: -1 });
  });
});
