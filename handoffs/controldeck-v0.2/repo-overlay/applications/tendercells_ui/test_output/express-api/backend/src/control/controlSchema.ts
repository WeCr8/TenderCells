import type { ControlFrame } from './types';

const PROFILE = /^[a-z0-9][a-z0-9-]{0,63}$/;
const DEVICE = /^[A-Za-z0-9][A-Za-z0-9_.:-]{0,95}$/;

export function validateControlFrame(value: unknown, now = Date.now()): string | null {
  if (!value || typeof value !== 'object') return 'frame must be an object';
  const f = value as Partial<ControlFrame>;
  if (f.v !== 1) return 'unsupported frame version';
  if (typeof f.sessionId !== 'string' || f.sessionId.length < 8 || f.sessionId.length > 128) return 'invalid sessionId';
  if (typeof f.deviceId !== 'string' || !DEVICE.test(f.deviceId)) return 'invalid deviceId';
  if (typeof f.profileId !== 'string' || !PROFILE.test(f.profileId)) return 'invalid profileId';
  if (!Number.isInteger(f.seq) || (f.seq as number) < 1) return 'invalid seq';
  if (typeof f.sentAtMs !== 'number' || !Number.isFinite(f.sentAtMs)) return 'invalid sentAtMs';
  if (Math.abs(now - f.sentAtMs) > 10_000) return 'frame timestamp outside allowed window';
  if (typeof f.deadman !== 'boolean') return 'invalid deadman';
  if (!f.axes || typeof f.axes !== 'object' || Array.isArray(f.axes)) return 'invalid axes';
  for (const [key, val] of Object.entries(f.axes)) {
    if (!/^[A-Za-z][A-Za-z0-9]{0,31}$/.test(key)) return `invalid axis: ${key}`;
    if (typeof val !== 'number' || !Number.isFinite(val) || val < -1 || val > 1) return `axis ${key} must be -1..1`;
  }
  if (f.actions !== undefined) {
    if (!Array.isArray(f.actions) || f.actions.length > 16 || !f.actions.every((x) => typeof x === 'string' && x.length <= 48)) {
      return 'invalid actions';
    }
  }
  return null;
}
