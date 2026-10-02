import { describe, expect, it } from 'vitest';
import { differentialMix, mecanumMix, tankMix } from '../../control/core/mixers';

describe('motion mixers', () => {
  it('drives differential straight', () => {
    expect(differentialMix(1, 0)).toEqual({ left:1, right:1 });
  });

  it('normalizes a differential turn', () => {
    const m = differentialMix(1, 1);
    expect(m.left).toBe(1);
    expect(m.right).toBe(0);
  });

  it('keeps tank channels independent', () => {
    expect(tankMix(-0.5, 0.75)).toEqual({ left:-0.5, right:0.75 });
  });

  it('normalizes mecanum wheel outputs', () => {
    const m = mecanumMix(1, 1, 1);
    for (const v of Object.values(m)) expect(Math.abs(v)).toBeLessThanOrEqual(1);
  });
});
