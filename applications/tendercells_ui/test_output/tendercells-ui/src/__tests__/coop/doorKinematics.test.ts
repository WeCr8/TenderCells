import { describe, expect, it } from 'vitest';
import {
  DOOR_TRAVEL_MAX_MM,
  PINION_PITCH_RADIUS_MM,
  clampTravel,
  doorStatus,
  doorTransforms,
  pinionAngleRad,
  pivotPositionY,
  stepTravel,
} from '../../lib/coop/doorKinematics';

describe('DoorCell V1.4 door kinematics', () => {
  it('uses the m1.25 z18 pinion pitch radius (11.25 mm)', () => {
    expect(PINION_PITCH_RADIUS_MM).toBeCloseTo(11.25, 9);
  });

  it('clamps travel to 0..280 mm', () => {
    expect(clampTravel(-5)).toBe(0);
    expect(clampTravel(140)).toBe(140);
    expect(clampTravel(999)).toBe(DOOR_TRAVEL_MAX_MM);
    expect(clampTravel(Number.NaN)).toBe(0);
  });

  it('turns the pinion travel / 11.25 rad', () => {
    expect(pinionAngleRad(0)).toBe(0);
    expect(pinionAngleRad(11.25)).toBeCloseTo(1, 9);
    expect(pinionAngleRad(280)).toBeCloseTo(280 / 11.25, 9); // ~24.89 rad, ~3.96 turns
    expect(pinionAngleRad(400)).toBeCloseTo(280 / 11.25, 9); // clamped
  });

  it('slides the door along +X only', () => {
    const t = doorTransforms(140, [763.6, 2407.7, 743.8]);
    expect(t.doorPosition).toEqual([140, 0, 0]);
    expect(t.travel).toBe(140);
  });

  it('keeps the pinion centre fixed while it rotates', () => {
    const c: [number, number, number] = [763.6, 2407.7, 743.8];
    for (const travel of [0, 17.3, 140, 280]) {
      const { pinionAngle, pinionPosition } = doorTransforms(travel, c);
      // world(c) = R_y(angle) * c + p must equal c
      const cos = Math.cos(pinionAngle);
      const sin = Math.sin(pinionAngle);
      const wx = c[0] * cos + c[2] * sin + pinionPosition[0];
      const wz = -c[0] * sin + c[2] * cos + pinionPosition[2];
      expect(wx).toBeCloseTo(c[0], 6);
      expect(wz).toBeCloseTo(c[2], 6);
      expect(pinionPosition[1]).toBe(0);
    }
    expect(pivotPositionY(c, 0)).toEqual([0, 0, 0]);
  });

  it('reports status text', () => {
    expect(doorStatus(0, 0, false)).toBe('Closed');
    expect(doorStatus(50, 280, false)).toBe('Opening');
    expect(doorStatus(280, 280, false)).toBe('Open');
    expect(doorStatus(200, 0, false)).toBe('Closing');
    expect(doorStatus(140, 140, false)).toBe('Partly open');
    expect(doorStatus(140, 280, true)).toBe('E-STOP');
  });

  it('steps toward the target without overshoot and freezes on E-STOP', () => {
    expect(stepTravel(0, 280, 70, 1)).toBe(70);
    expect(stepTravel(270, 280, 70, 1)).toBe(280);
    expect(stepTravel(100, 0, 70, 0.5)).toBe(65);
    expect(stepTravel(100, 280, 70, 1, true)).toBe(100);
  });
});
