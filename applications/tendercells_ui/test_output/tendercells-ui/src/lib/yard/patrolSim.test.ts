import { describe, it, expect } from 'vitest';
import { computePatrolPose } from './patrolSim';

describe('computePatrolPose', () => {
  const square = [
    { x: 0, z: 0 },
    { x: 10, z: 0 },
    { x: 10, z: 10 },
  ];

  it('returns null with fewer than 2 points', () => {
    expect(computePatrolPose([], 0)).toBeNull();
    expect(computePatrolPose([{ x: 0, z: 0 }], 5)).toBeNull();
  });

  it('starts at the first waypoint, facing the second', () => {
    const pose = computePatrolPose(square, 0, 2.5);
    expect(pose).toEqual({ x: 0, z: 0, heading: Math.atan2(10, 0) });
  });

  it('lerps halfway across a segment', () => {
    const pose = computePatrolPose(square, 1.25, 2.5);
    expect(pose?.x).toBeCloseTo(5);
    expect(pose?.z).toBeCloseTo(0);
  });

  it('reaches the second waypoint exactly at one segment duration', () => {
    const pose = computePatrolPose(square, 2.5, 2.5);
    expect(pose?.x).toBeCloseTo(10);
    expect(pose?.z).toBeCloseTo(0);
  });

  it('moves onto the next segment and re-heads', () => {
    const pose = computePatrolPose(square, 3.75, 2.5);
    expect(pose?.x).toBeCloseTo(10);
    expect(pose?.z).toBeCloseTo(5);
    expect(pose?.heading).toBeCloseTo(Math.atan2(0, 10));
  });

  it('loops back to the first segment after the last one', () => {
    // 2 segments * 2.5s = 5s for a full lap; 5.1s should be just past waypoint 0 again.
    const looped = computePatrolPose(square, 5.1, 2.5);
    const fresh = computePatrolPose(square, 0.1, 2.5);
    expect(looped?.x).toBeCloseTo(fresh?.x ?? NaN);
    expect(looped?.z).toBeCloseTo(fresh?.z ?? NaN);
    expect(looped?.heading).toBeCloseTo(fresh?.heading ?? NaN);
  });

  it('treats a non-positive segment duration as invalid', () => {
    expect(computePatrolPose(square, 1, 0)).toBeNull();
    expect(computePatrolPose(square, 1, -1)).toBeNull();
  });
});
