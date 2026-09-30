import assert from 'node:assert/strict';
import test from 'node:test';
import { detectBoard, evaluateReadiness } from './check-readiness.mjs';

test('detects supported edge boards from the vendor model string', () => {
  assert.equal(detectBoard('Raspberry Pi 5 Model B Rev 1.0'), 'raspberry-pi');
  assert.equal(detectBoard('NVIDIA Jetson Orin Nano Developer Kit'), 'nvidia-jetson');
  assert.equal(detectBoard('Generic ARM64'), 'generic-linux');
});

test('allows a local-only bridge without cloud credentials', () => {
  const result = evaluateReadiness({ platform: 'linux', arch: 'arm64', nodeMajor: 22,
    commands: { docker: false, ffmpeg: false }, camera: false, managed: false,
    edgePrivateKey: false, mqttTls: false, mqttIdentity: false, firebaseAdminKey: false });
  assert.equal(result.ready, true);
});

test('blocks managed installation without claim, TLS and scoped MQTT identity', () => {
  const result = evaluateReadiness({ platform: 'linux', arch: 'arm64', nodeMajor: 22,
    commands: { docker: true, ffmpeg: true }, camera: true, managed: true,
    edgePrivateKey: false, mqttTls: false, mqttIdentity: false, firebaseAdminKey: false });
  assert.equal(result.ready, false);
  assert.deepEqual(result.checks.filter((check) => check.required && !check.ok).map((check) => check.id),
    ['identity-key', 'mqtt-tls', 'mqtt-identity']);
});

test('always blocks broad Firebase administrator credentials', () => {
  const result = evaluateReadiness({ platform: 'linux', arch: 'arm64', nodeMajor: 22,
    commands: { docker: true, ffmpeg: true }, camera: true, managed: false,
    edgePrivateKey: false, mqttTls: false, mqttIdentity: false, firebaseAdminKey: true });
  assert.equal(result.ready, false);
  assert.equal(result.checks.find((check) => check.id === 'no-admin-key')?.ok, false);
});
