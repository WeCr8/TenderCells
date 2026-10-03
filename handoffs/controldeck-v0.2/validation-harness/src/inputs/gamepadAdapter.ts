import type { RawInput } from '../types.js';

export interface GamepadSnapshot {
  axes: number[];
  buttons: boolean[];
}

export type GamepadLayout = 'arcade' | 'tank' | 'mecanum' | 'drone-mode-2';

export function gamepadToRawInput(
  snapshot: GamepadSnapshot,
  layout: GamepadLayout,
  now = Date.now(),
): RawInput {
  const a = snapshot.axes;
  const active = a.some((v) => Math.abs(v) > 0.001) || snapshot.buttons.some(Boolean);

  if (layout === 'tank') {
    return {
      source: 'gamepad',
      axes: { leftTrack: -(a[1] ?? 0), rightTrack: -(a[3] ?? 0) },
      active,
      timestampMs: now,
    };
  }

  if (layout === 'mecanum') {
    return {
      source: 'gamepad',
      axes: { strafe: a[0] ?? 0, y: -(a[1] ?? 0), yaw: a[2] ?? 0 },
      active,
      timestampMs: now,
    };
  }

  if (layout === 'drone-mode-2') {
    return {
      source: 'gamepad',
      axes: {
        yaw: a[0] ?? 0,
        throttle: -(a[1] ?? 0),
        roll: a[2] ?? 0,
        pitch: -(a[3] ?? 0),
      },
      active,
      timestampMs: now,
    };
  }

  return {
    source: 'gamepad',
    axes: { steering: a[0] ?? 0, throttle: -(a[1] ?? 0) },
    active,
    timestampMs: now,
  };
}
