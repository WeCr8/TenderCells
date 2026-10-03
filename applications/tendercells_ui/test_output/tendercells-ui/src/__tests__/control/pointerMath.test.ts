import { describe, expect, it } from 'vitest';
import { floatingStickAxes } from '../../control/inputs/pointerMath';

describe('FreeTouch pointer math', () => {
  it('centers at zero', () => {
    expect(floatingStickAxes({x:5,y:5},{x:5,y:5},50)).toEqual({x:0,y:0});
  });

  it('maps upward motion to positive Y', () => {
    expect(floatingStickAxes({x:0,y:100},{x:0,y:50},50).y).toBe(1);
  });

  it('clamps outside radius', () => {
    const a = floatingStickAxes({x:0,y:0},{x:1000,y:0},50);
    expect(a.x).toBe(1);
  });
});
