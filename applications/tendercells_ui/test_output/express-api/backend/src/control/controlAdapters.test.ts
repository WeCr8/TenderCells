import test from 'node:test';
import assert from 'node:assert/strict';
import { createMotionPublisher, frameToMqttPayload, neutralMotionPayload } from './controlAdapters.js';
import type { ControlFrame } from './types.js';

const frame: ControlFrame = {
  v: 1,
  sessionId: 'session-12345678',
  deviceId: 'rr_001',
  profileId: 'freetouch',
  seq: 1,
  sentAtMs: Date.now(),
  deadman: true,
  axes: { throttle: 0.5, steering: -0.25 },
};

test('Roaming Roost adapter maps normalized axes to the firmware drive contract', () => {
  const payload = frameToMqttPayload(frame);
  assert.deepEqual(
    Object.fromEntries(['vx', 'vy', 'omega', 'speed'].map(key => [key, payload[key]])),
    { vx: 50, vy: 0, omega: -25, speed: 0.35 },
  );
});

test('released deadman produces a neutral legacy drive command', () => {
  const payload = frameToMqttPayload({ ...frame, deadman: false, axes: { throttle: 1, steering: 1 } });
  assert.deepEqual(
    Object.fromEntries(['vx', 'vy', 'omega', 'speed'].map(key => [key, payload[key]])),
    { vx: 0, vy: 0, omega: 0, speed: 0 },
  );
  assert.equal(neutralMotionPayload('disconnect').deadman, false);
});

test('motion publisher uses the topic consumed by Roaming Roost firmware', () => {
  let topic = '';
  const publisher = createMotionPublisher((value) => { topic = value; return true; });
  assert.equal(publisher.publish('rr_001', frameToMqttPayload(frame)), true);
  assert.equal(topic, 'tc/rr_001/cmd/drive');
});
