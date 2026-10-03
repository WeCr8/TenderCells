import { clampUnit } from './math.js';

export type DifferentialOutput = { left: number; right: number };
export type MecanumOutput = {
  frontLeft: number;
  frontRight: number;
  rearLeft: number;
  rearRight: number;
};

export function differentialMix(throttle: number, steering: number): DifferentialOutput {
  const l = throttle + steering;
  const r = throttle - steering;
  const scale = Math.max(1, Math.abs(l), Math.abs(r));
  return { left: clampUnit(l / scale), right: clampUnit(r / scale) };
}

export function tankMix(left: number, right: number): DifferentialOutput {
  return { left: clampUnit(left), right: clampUnit(right) };
}

export function ackermannMix(throttle: number, steering: number) {
  return { throttle: clampUnit(throttle), steering: clampUnit(steering) };
}

export function mecanumMix(forward: number, strafe: number, yaw: number): MecanumOutput {
  const fl = forward + strafe + yaw;
  const fr = forward - strafe - yaw;
  const rl = forward - strafe + yaw;
  const rr = forward + strafe - yaw;
  const scale = Math.max(1, Math.abs(fl), Math.abs(fr), Math.abs(rl), Math.abs(rr));
  return {
    frontLeft: clampUnit(fl / scale),
    frontRight: clampUnit(fr / scale),
    rearLeft: clampUnit(rl / scale),
    rearRight: clampUnit(rr / scale),
  };
}
