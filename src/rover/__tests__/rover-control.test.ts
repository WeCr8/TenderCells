import { describe, expect, it } from 'vitest';
import {
  INPUT_TIMEOUT_MS,
  MIN_SEND_INTERVAL_MS,
  STOP_REPEATS,
  applyDeadzone,
  mixArcade,
  mixTank,
  readGamepad,
  sanitizeToggles,
  sticksToWheels,
  topics,
  wheelsToPayload,
} from '../control-core';
import { RoverSession } from '../session';
import type { Clock } from '../session';
import type { GamepadSample } from '../control-core';
import { DemoTransport, normalizeBrokerUrl } from '../transport';

class FakeClock implements Clock {
  t = 1000;
  fns: Array<() => void> = [];
  now() {
    return this.t;
  }
  setInterval(fn: () => void) {
    this.fns.push(fn);
    return fn;
  }
  clearInterval(h: unknown) {
    this.fns = this.fns.filter((f) => f !== h);
  }
  next = 1000 + MIN_SEND_INTERVAL_MS;
  /** advance ms, firing the 50 ms loop like a real timer */
  advance(ms: number) {
    const end = this.t + ms;
    while (this.next <= end) {
      this.t = this.next;
      this.next += MIN_SEND_INTERVAL_MS;
      this.fns.forEach((f) => f());
    }
    this.t = end;
  }
}

async function setup(type: 'arcade' | 'tank' = 'arcade') {
  const clock = new FakeClock();
  const tr = new DemoTransport(() => clock.now());
  await tr.connect();
  const s = new RoverSession(tr, 'rv1', clock, {}, type, 'turbo');
  s.start();
  const drives = () => tr.sent.filter((r) => r.topic === 'tc/rv1/cmd/drive');
  return { clock, tr, s, drives };
}

describe('control-core mixing', () => {
  it('deadzone zeroes small input and rescales to full range', () => {
    expect(applyDeadzone(0.05)).toBe(0);
    expect(applyDeadzone(1)).toBe(1);
    expect(applyDeadzone(-1)).toBe(-1);
    expect(applyDeadzone(NaN)).toBe(0);
  });
  it('arcade: throttle only drives both wheels forward', () => {
    expect(mixArcade(1, 0)).toEqual({ left: 1, right: 1 });
    expect(mixArcade(0, 1)).toEqual({ left: 1, right: -1 });
    const m = mixArcade(1, 1);
    expect(Math.max(Math.abs(m.left), Math.abs(m.right))).toBeLessThanOrEqual(1);
  });
  it('tank maps each stick Y to its track', () => {
    expect(mixTank(1, -1)).toEqual({ left: 1, right: -1 });
    expect(sticksToWheels('tank', { x: 1, y: 0.5 }, { x: 0, y: 0.5 }).left).toBeGreaterThan(0);
  });
  it('arcade ignores left X and right Y', () => {
    expect(sticksToWheels('arcade', { x: 1, y: 0 }, { x: 0, y: 1 })).toEqual({ left: 0, right: 0 });
  });
  it('payload matches starter-node and roaming-roost firmware contracts', () => {
    const fwd = wheelsToPayload({ left: 1, right: 1 }, 0.7, 1);
    expect(fwd).toMatchObject({ dir: 'forward', speed: 0.7, vx: 70, vy: 0, omega: 0 });
    const spinR = wheelsToPayload({ left: 1, right: -1 }, 1, 2);
    expect(spinR).toMatchObject({ dir: 'right', speed: 1, omega: 100, vx: 0 });
    expect(wheelsToPayload({ left: -0.5, right: -0.5 }, 1, 3)).toMatchObject({ dir: 'back', speed: 0.5 });
    expect(wheelsToPayload({ left: 0, right: 0 }, 1, 4)).toMatchObject({ dir: 'stop', speed: 0, vx: 0, omega: 0 });
    // fits the firmware's StaticJsonDocument<256>
    expect(JSON.stringify(wheelsToPayload({ left: -0.333, right: 0.999 }, 0.4, 99999)).length).toBeLessThan(160);
  });
  it('topics follow tc/<id>/cmd/*', () => {
    expect(topics.drive('a')).toBe('tc/a/cmd/drive');
    expect(topics.estop('a')).toBe('tc/a/cmd/estop');
    expect(topics.cmd('a', '/light')).toBe('tc/a/cmd/light');
  });
  it('gamepad: Y axes inverted, B = estop, LB/RB speed', () => {
    const g = readGamepad({ axes: [0.2, -1, 0.5, 1], buttons: [{ pressed: false }, { pressed: true }, {}, {}, { pressed: true }, { pressed: false }] as GamepadSample['buttons'] });
    expect(g.left).toEqual({ x: 0.2, y: 1 });
    expect(g.right).toEqual({ x: 0.5, y: -1 });
    expect(g.estop).toBe(true);
    expect(g.speedDown).toBe(true);
    expect(g.speedUp).toBe(false);
  });
  it('sanitizes toggle config', () => {
    const t = sanitizeToggles([{ id: 'x', label: 'Lights!!', topic: 'li ght$', key: 'on;' }, 5, null]);
    expect(t).toEqual([{ id: 'x', label: 'Lights!!', topic: 'light', key: 'on', enabled: true, momentary: false }]);
    expect(sanitizeToggles('nope').length).toBeGreaterThan(0);
  });
  it('normalizes broker urls', () => {
    expect(normalizeBrokerUrl('192.168.1.10')).toBe('ws://192.168.1.10:9001');
    expect(normalizeBrokerUrl('wss://b.local:8443/mqtt')).toBe('wss://b.local:8443/mqtt');
  });
});

describe('RoverSession safety', () => {
  it('rate-limits to <= 20 Hz while a stick is held', async () => {
    const { clock, s, drives } = await setup();
    for (let i = 0; i < 100; i++) {
      s.setInput({ x: 0, y: 1 }, { x: 0, y: 0 }); // UI may call far faster than 20 Hz
      clock.advance(10);
    }
    // 1000 ms elapsed -> at most 20 sends
    expect(drives().length).toBeLessThanOrEqual(20);
    expect(drives().length).toBeGreaterThanOrEqual(18);
    const ts = drives().map((d) => d.t);
    for (let i = 1; i < ts.length; i++) expect(ts[i] - ts[i - 1]).toBeGreaterThanOrEqual(MIN_SEND_INTERVAL_MS - 1);
    expect(drives().at(-1)!.payload).toMatchObject({ dir: 'forward', speed: 1 });
  });

  it('release (spring back) sends stop packets then goes quiet', async () => {
    const { clock, s, drives } = await setup();
    s.setInput({ x: 0, y: 1 }, { x: 0, y: 0 });
    clock.advance(200);
    s.release();
    clock.advance(1000);
    const after = drives().filter((d) => d.payload.dir === 'stop');
    expect(after.length).toBe(STOP_REPEATS);
    const n = drives().length;
    clock.advance(1000);
    expect(drives().length).toBe(n);
  });

  it('input timeout: a held stick that stops reporting is stopped', async () => {
    const { clock, s, drives } = await setup();
    s.setInput({ x: 0, y: 1 }, { x: 0, y: 0 });
    clock.advance(INPUT_TIMEOUT_MS + 200); // no more setInput calls (frozen UI)
    expect(s.state.wheels).toEqual({ left: 0, right: 0 });
    expect(drives().at(-1)!.payload.dir).toBe('stop');
  });

  it('disconnect = deadman; needs re-center before driving again', async () => {
    const { clock, tr, s, drives } = await setup();
    s.setInput({ x: 0, y: 1 }, { x: 0, y: 0 });
    clock.advance(100);
    tr.drop();
    expect(s.state.link).toBe('disconnected');
    expect(s.state.wheels).toEqual({ left: 0, right: 0 });
    await tr.connect();
    const n = drives().length;
    s.setInput({ x: 0, y: 1 }, { x: 0, y: 0 }); // stick still pushed on reconnect
    clock.advance(300);
    expect(drives().filter((d) => d.payload.dir === 'forward').length).toBe(drives().slice(0, n).filter((d) => d.payload.dir === 'forward').length);
    s.setInput({ x: 0, y: 0 }, { x: 0, y: 0 }); // re-center
    s.setInput({ x: 0, y: 1 }, { x: 0, y: 0 });
    clock.advance(100);
    expect(drives().at(-1)!.payload.dir).toBe('forward');
  });

  it('E-stop publishes retained estop at once, blocks drive, hold-release needs re-center', async () => {
    const { clock, tr, s, drives } = await setup();
    s.setInput({ x: 0, y: 1 }, { x: 0, y: 0 });
    clock.advance(100);
    s.estop();
    const e = tr.sent.find((r) => r.topic === 'tc/rv1/cmd/estop')!;
    expect(e.payload).toEqual({ active: true });
    expect(e.opts).toMatchObject({ retain: true, qos: 1 });
    expect(drives().at(-1)!.payload.dir).toBe('stop');
    const n = drives().filter((d) => d.payload.dir !== 'stop').length;
    s.setInput({ x: 0, y: 1 }, { x: 0, y: 0 });
    clock.advance(500);
    expect(drives().filter((d) => d.payload.dir !== 'stop').length).toBe(n);
    s.clearEstop();
    expect(tr.sent.at(-1)!.payload).toEqual({ active: false });
    expect(s.state.needsRecenter).toBe(true);
  });

  it('tank mode: opposite tracks spin in place', async () => {
    const { clock, s, drives } = await setup('tank');
    s.setInput({ x: 0, y: -1 }, { x: 0, y: 1 });
    clock.advance(60);
    expect(drives().at(-1)!.payload).toMatchObject({ dir: 'left' });
  });

  it('aux toggles publish to tc/<id>/cmd/<topic>', async () => {
    const { tr, s } = await setup();
    expect(s.publishAux('light', { on: true })).toBe(true);
    expect(tr.sent.at(-1)).toMatchObject({ topic: 'tc/rv1/cmd/light', payload: { on: true } });
    expect(s.publishAux('', { on: true })).toBe(false);
  });

  it('dispose sends a final stop', async () => {
    const { clock, s, drives } = await setup();
    s.setInput({ x: 0, y: 1 }, { x: 0, y: 0 });
    clock.advance(100);
    s.dispose();
    expect(drives().at(-1)!.payload.dir).toBe('stop');
  });
});
