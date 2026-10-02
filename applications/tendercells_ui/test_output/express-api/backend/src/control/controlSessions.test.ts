import test from 'node:test';
import assert from 'node:assert/strict';
import { ControlSessionManager } from './controlSessions.js';
import type { ControlFrame } from './types.js';

function frame(seq: number, sentAtMs: number): ControlFrame {
  return {
    v:1, sessionId:'session-12345678', deviceId:'rover_1',
    profileId:'freetouch', seq, sentAtMs, deadman:true, axes:{ throttle:0.5 }
  };
}

test('one controller lease per device', () => {
  const m = new ControlSessionManager(500);
  m.open('session-12345678','rover_1','freetouch',1000);
  assert.throws(() => m.open('session-abcdefgh','rover_1','freetouch',1001));
});

test('rejects duplicate/out-of-order frames', () => {
  const m = new ControlSessionManager(500);
  m.open('session-12345678','rover_1','freetouch',1000);
  assert.equal(m.accept(frame(1,1000),1000).ok,true);
  assert.equal(m.accept(frame(1,1001),1001).ok,false);
});

test('stale watchdog neutralizes and clears lease', () => {
  const stops: string[] = [];
  const m = new ControlSessionManager(500,(id)=>stops.push(id));
  m.open('session-12345678','rover_1','freetouch',1000);
  assert.deepEqual(m.sweep(1600),['rover_1']);
  assert.deepEqual(stops,['rover_1']);
  assert.equal(m.get('rover_1'),undefined);
});

test('late or future frames cannot revive an expired stream', () => {
  const m = new ControlSessionManager(500);
  m.open('session-12345678','rover_1','freetouch',1000);
  assert.equal(m.accept(frame(1,2000),1000).ok,false);
  assert.equal(m.accept(frame(2,1600),1600).ok,false);
  assert.equal(m.get('rover_1'),undefined);
});
