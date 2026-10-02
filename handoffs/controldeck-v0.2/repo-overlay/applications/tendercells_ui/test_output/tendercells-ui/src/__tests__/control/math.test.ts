import { describe, expect, it } from 'vitest';
import { applyDeadzone, applyExpo, clampUnit, shapeAxis } from '../../control/core/math';

describe('Control math', () => {
  it('clamps invalid and out-of-range values', () => {
    expect(clampUnit(2)).toBe(1);
    expect(clampUnit(-2)).toBe(-1);
    expect(clampUnit(Number.NaN)).toBe(0);
  });

  it('applies a symmetric deadzone', () => {
    expect(applyDeadzone(0.05, 0.1)).toBe(0);
    expect(applyDeadzone(-0.05, 0.1)).toBe(0);
    expect(applyDeadzone(1, 0.1)).toBe(1);
    expect(applyDeadzone(-1, 0.1)).toBe(-1);
  });

  it('preserves endpoints through expo', () => {
    expect(applyExpo(1, 0.5)).toBe(1);
    expect(applyExpo(-1, 0.5)).toBe(-1);
  });

  it('limits final magnitude', () => {
    expect(shapeAxis(1, 0, 0, 0.35)).toBeCloseTo(0.35);
  });
});
