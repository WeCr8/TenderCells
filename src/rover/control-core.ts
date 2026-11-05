// Rover control core: pure, framework-free logic for the on-screen / gamepad
// control pad. Everything here is unit-tested (src/rover/__tests__).
//
// Wire protocol (what the rover firmware actually listens to, see
// firmware/starter-node/src/main.cpp and firmware/roaming-roost/src/main.cpp):
//   MQTT topic  tc/<deviceId>/cmd/drive
//     starter-node (XIAO ESP32-S3, peripheral=drive):  {"dir":"forward|back|left|right|stop","speed":0..1}
//       - only the four cardinal directions + one speed; firmware deadman 1.5 s
//     roaming-roost (WROOM, mecanum):                  {"vx":-100..100,"vy":..,"omega":..,"speed":0..1}
//       - drives only while the last command is < 500 ms old
//   MQTT topic  tc/<deviceId>/cmd/estop   {"active":true|false}
//   MQTT topic  tc/<deviceId>/cmd/light   {"on":true|false}   (starter-node relay)
// One drive payload carries both shapes, so the same pad drives either board.
// "l"/"r" (wheel targets -1..1) are extra fields for future proportional firmware;
// current firmware ignores unknown keys.

export type ControllerType = 'arcade' | 'tank';

export interface StickState {
  x: number; // -1 (left) .. 1 (right)
  y: number; // -1 (down/back) .. 1 (up/forward)
}

export interface WheelTargets {
  left: number; // -1..1
  right: number; // -1..1
}

export interface DrivePayload {
  dir: 'forward' | 'back' | 'left' | 'right' | 'stop';
  speed: number;
  vx: number;
  vy: number;
  omega: number;
  l: number;
  r: number;
  seq: number;
}

export const SEND_HZ = 20;
export const MIN_SEND_INTERVAL_MS = Math.round(1000 / SEND_HZ); // 50 ms
export const DEFAULT_DEADZONE = 0.08;
// While a stick is held, a fresh command is sent at least this often so the
// Roaming Roost (500 ms freshness) and starter-node (1.5 s deadman) keep moving.
export const KEEPALIVE_MS = 100;
// If no input sample arrives for this long while moving (frozen UI thread,
// lost touch, gamepad stopped reporting), the session forces a stop.
export const INPUT_TIMEOUT_MS = 500;
// Number of stop packets sent on every transition to zero (cheap insurance
// against a dropped QoS0 packet).
export const STOP_REPEATS = 3;

export const SPEED_MODES = {
  slow: 0.4,
  normal: 0.7,
  turbo: 1.0,
} as const;
export type SpeedMode = keyof typeof SPEED_MODES;

export function clamp(v: number, lo = -1, hi = 1): number {
  if (!Number.isFinite(v)) return 0;
  return Math.min(hi, Math.max(lo, v));
}

/** Radial-free scalar deadzone with rescale so output still reaches ±1. */
export function applyDeadzone(v: number, dz = DEFAULT_DEADZONE): number {
  const c = clamp(v);
  const a = Math.abs(c);
  if (a <= dz) return 0;
  return Math.sign(c) * ((a - dz) / (1 - dz));
}

/**
 * Arcade mix: left stick Y = throttle, right stick X = steering.
 * Returns wheel targets normalized so neither exceeds 1.
 */
export function mixArcade(throttle: number, steer: number): WheelTargets {
  const t = clamp(throttle);
  const s = clamp(steer);
  let left = t + s;
  let right = t - s;
  const m = Math.max(1, Math.abs(left), Math.abs(right));
  left /= m;
  right /= m;
  return { left: round3(left), right: round3(right) };
}

/** Tank mix: left stick Y = left track, right stick Y = right track. */
export function mixTank(leftY: number, rightY: number): WheelTargets {
  return { left: round3(clamp(leftY)), right: round3(clamp(rightY)) };
}

export function sticksToWheels(
  type: ControllerType,
  leftStick: StickState,
  rightStick: StickState,
  dz = DEFAULT_DEADZONE,
): WheelTargets {
  if (type === 'tank') {
    return mixTank(applyDeadzone(leftStick.y, dz), applyDeadzone(rightStick.y, dz));
  }
  return mixArcade(applyDeadzone(leftStick.y, dz), applyDeadzone(rightStick.x, dz));
}

export function isZero(w: WheelTargets): boolean {
  return w.left === 0 && w.right === 0;
}

/**
 * Convert wheel targets into the firmware drive payload.
 * The starter-node only knows forward/back/left/right with one speed, so the
 * dominant component wins (forward/back vs. spin in place).
 */
export function wheelsToPayload(w: WheelTargets, speedScale: number, seq: number): DrivePayload {
  const scale = clamp(speedScale, 0, 1);
  const fwd = (w.left + w.right) / 2; // -1..1
  const turn = (w.left - w.right) / 2; // -1..1 (+ = turn right)
  let dir: DrivePayload['dir'] = 'stop';
  let mag = 0;
  if (!isZero(w)) {
    if (Math.abs(fwd) >= Math.abs(turn)) {
      dir = fwd > 0 ? 'forward' : 'back';
      mag = Math.abs(fwd);
    } else {
      dir = turn > 0 ? 'right' : 'left';
      mag = Math.abs(turn);
    }
    if (mag === 0) dir = 'stop';
  }
  return {
    dir,
    speed: round3(dir === 'stop' ? 0 : mag * scale),
    vx: Math.round(fwd * scale * 100),
    vy: 0,
    omega: Math.round(turn * scale * 100),
    l: round3(w.left * scale),
    r: round3(w.right * scale),
    seq,
  };
}

export const STOP_WHEELS: WheelTargets = { left: 0, right: 0 };

function round3(v: number): number {
  const r = Math.round(v * 1000) / 1000;
  return Object.is(r, -0) ? 0 : r;
}

/** Topic helpers (the contract every TenderCells board uses). */
export const topics = {
  drive: (id: string) => `tc/${id}/cmd/drive`,
  estop: (id: string) => `tc/${id}/cmd/estop`,
  state: (id: string) => `tc/${id}/state`,
  cmd: (id: string, suffix: string) => `tc/${id}/cmd/${suffix.replace(/^\/+/, '')}`,
};

/** Simple gamepad mapping (W3C "standard" layout). */
export interface GamepadSample {
  axes: readonly number[];
  buttons: readonly { pressed: boolean; value?: number }[];
}

export interface GamepadIntent {
  left: StickState;
  right: StickState;
  estop: boolean; // B / circle (button 1)
  speedDown: boolean; // LB (4)
  speedUp: boolean; // RB (5)
}

export function readGamepad(gp: GamepadSample): GamepadIntent {
  const ax = (i: number) => clamp(gp.axes[i] ?? 0);
  const btn = (i: number) => !!gp.buttons[i]?.pressed;
  return {
    // Gamepad Y axes are +down; the pad uses +up = forward.
    left: { x: ax(0), y: -ax(1) },
    right: { x: ax(2), y: -ax(3) },
    estop: btn(1),
    speedDown: btn(4),
    speedUp: btn(5),
  };
}

/** Configurable aux toggle buttons. */
export interface ToggleDef {
  id: string;
  label: string;
  /** Topic suffix under tc/<deviceId>/cmd/ (e.g. "light"); empty = local only. */
  topic: string;
  /** JSON key set to true/false, e.g. "on". */
  key: string;
  enabled: boolean;
  /** true = momentary (horn): on while held. */
  momentary?: boolean;
}

export const DEFAULT_TOGGLES: ToggleDef[] = [
  { id: 'lights', label: 'Lights', topic: 'light', key: 'on', enabled: true },
  { id: 'camera', label: 'Camera', topic: 'camera', key: 'on', enabled: true },
  { id: 'horn', label: 'Horn', topic: 'horn', key: 'on', enabled: true, momentary: true },
  { id: 'aux', label: 'Aux', topic: 'aux', key: 'on', enabled: true },
];

export function sanitizeToggles(input: unknown): ToggleDef[] {
  if (!Array.isArray(input)) return DEFAULT_TOGGLES.map((t) => ({ ...t }));
  const out: ToggleDef[] = [];
  for (const raw of input.slice(0, 8)) {
    if (!raw || typeof raw !== 'object') continue;
    const r = raw as Record<string, unknown>;
    const id = String(r.id ?? '').trim() || `t${out.length}`;
    const label = String(r.label ?? '').trim().slice(0, 16) || id;
    const topic = String(r.topic ?? '').trim().replace(/[^a-zA-Z0-9_\-/]/g, '').slice(0, 32);
    const key = String(r.key ?? 'on').trim().replace(/[^a-zA-Z0-9_]/g, '').slice(0, 16) || 'on';
    out.push({ id, label, topic, key, enabled: r.enabled !== false, momentary: !!r.momentary });
  }
  return out.length ? out : DEFAULT_TOGGLES.map((t) => ({ ...t }));
}
