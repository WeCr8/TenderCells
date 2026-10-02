import { describe, expect, it } from 'vitest';
import { ControlEngine } from '../../control/core/ControlEngine';
import { CONTROL_PROFILES } from '../../control/profiles/registry';

describe('ControlEngine', () => {
  it('sequences frames and neutralizes inactive output', () => {
    const e = new ControlEngine('session-12345678','rover_1',CONTROL_PROFILES.freetouch);
    const f1 = e.next({ source:'touch', axes:{ throttle:1, steering:0 }, active:true, timestampMs:10 }, 100);
    const f2 = e.neutral(110);
    expect(f1.seq).toBe(1);
    expect(f1.deadman).toBe(true);
    expect(f2.seq).toBe(2);
    expect(f2.deadman).toBe(false);
    expect(f2.axes).toEqual({});
  });
});
