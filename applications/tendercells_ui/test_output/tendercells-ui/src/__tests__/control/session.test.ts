import { afterEach, describe, expect, it, vi } from 'vitest';
import { ControlSession } from '../../control/session/ControlSession';
import { ControlEngine } from '../../control/core/ControlEngine';
import { CONTROL_PROFILES } from '../../control/profiles/registry';
import { MockTransport } from '../../control/transports/MockTransport';
import { RoverSimulator } from '../../control/sim/RoverSimulator';
describe('control lifecycle', () => {
  afterEach(() => vi.useRealTimers());
  it('drives the simulator then stops on input release and stale input', async () => {
    vi.useFakeTimers(); const rover = new RoverSimulator();
    const transport = new MockTransport(f => rover.step(f, .05));
    const session = new ControlSession(new ControlEngine('session-test', 'sim', CONTROL_PROFILES.freetouch), transport, 20);
    await session.start(); session.updateInput({ source: 'touch', active: true, axes: { throttle: 1 }, timestampMs: Date.now() });
    vi.advanceTimersByTime(200); expect(rover.pose.x).toBeGreaterThan(0);
    vi.advanceTimersByTime(100); const stale = rover.pose.x;
    vi.advanceTimersByTime(500); expect(rover.pose.x).toBe(stale);
    expect(transport.frames[transport.frames.length - 1]?.deadman).toBe(false);
    session.updateInput({ source: 'touch', active: false, axes: { throttle: 1 }, timestampMs: Date.now() });
    expect(transport.frames[transport.frames.length - 1]?.axes).toEqual({}); session.stop();
  });
  it('does not start a timer when stopped during pending connect', async () => {
    vi.useFakeTimers(); let resolve!: () => void;
    const transport = new MockTransport();
    transport.connect = () => new Promise<void>(r => { resolve = r; });
    const session = new ControlSession(new ControlEngine('session-test', 'sim', CONTROL_PROFILES.freetouch), transport, 20);
    const started = session.start(); session.stop(); resolve(); await started;
    expect(vi.getTimerCount()).toBe(0);
  });
  it('does not retain an unbounded history', async () => {
    const transport = new MockTransport(); await transport.connect();
    const engine = new ControlEngine('session-test','sim',CONTROL_PROFILES.freetouch);
    for (let i = 0; i < 500; i++) transport.send(engine.neutral());
    expect(transport.frames).toHaveLength(100);
  });
});
