import test from 'node:test';
import assert from 'node:assert/strict';
import { validateControlFrame } from './controlSchema.js';

const good = {
  v:1, sessionId:'session-12345678', deviceId:'rover_1', profileId:'freetouch',
  seq:1, sentAtMs:1000, deadman:true, axes:{ throttle:0.5, steering:-0.25 }
};

test('valid frame passes', () => {
  assert.equal(validateControlFrame(good,1000),null);
});

test('axis outside normalized range fails', () => {
  assert.match(validateControlFrame({...good, axes:{throttle:1.1}},1000) ?? '', /-1\.\.1/);
});

test('old timestamp fails', () => {
  assert.match(validateControlFrame(good,20000) ?? '', /timestamp/);
});
