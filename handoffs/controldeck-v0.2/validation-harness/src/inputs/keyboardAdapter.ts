import type { RawInput } from '../types.js';

export interface KeyState {
  forward: boolean;
  back: boolean;
  left: boolean;
  right: boolean;
}

export function keyboardToArcadeRaw(state: KeyState, now = Date.now()): RawInput {
  const throttle = (state.forward ? 1 : 0) + (state.back ? -1 : 0);
  const steering = (state.right ? 1 : 0) + (state.left ? -1 : 0);
  return {
    source: 'keyboard',
    axes: { throttle, steering },
    active: throttle !== 0 || steering !== 0,
    timestampMs: now,
  };
}
