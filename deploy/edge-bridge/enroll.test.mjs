import assert from 'node:assert/strict';
import test from 'node:test';
import { buildClaimRequestBody, enrollmentEndpointAllowed, formatEnvFile } from './enroll.mjs';

test('claim request omits deviceId when the bridge has not picked one', () => {
  assert.deepEqual(buildClaimRequestBody('ABCDE-FGHJK', '', 'public-key'), { code: 'ABCDE-FGHJK', publicKey: 'public-key' });
  assert.deepEqual(buildClaimRequestBody('ABCDE-FGHJK', 'edge-1', 'public-key'), { code: 'ABCDE-FGHJK', deviceId: 'edge-1', publicKey: 'public-key' });
});

test('requires HTTPS except for a localhost self-hosted API', () => {
  assert.equal(enrollmentEndpointAllowed('https://example.org/enroll'), true);
  assert.equal(enrollmentEndpointAllowed('http://localhost:4000/api/mqtt/edge/claim'), true);
  assert.equal(enrollmentEndpointAllowed('http://192.168.1.20/enroll'), false);
});

test('the written env file never contains the password itself', () => {
  const env = formatEnvFile({
    deviceId: 'edge-1',
    mqttUsername: 'edge-1',
    mqttBrokerUrl: 'mqtts://broker.example.org:8883',
    mqttPasswordFilePath: '/etc/tendercells/mqtt.password',
    privateKeyPath: '/etc/tendercells/edge-private.pem',
  });
  assert.match(env, /TC_DEVICE_ID=edge-1/);
  assert.match(env, /MQTT_USERNAME=edge-1/);
  assert.match(env, /MQTT_PASSWORD_FILE=\/etc\/tendercells\/mqtt\.password/);
  assert.match(env, /MQTT_BROKER=mqtts:\/\/broker\.example\.org:8883/);
  assert.match(env, /TC_EDGE_PRIVATE_KEY_FILE=\/etc\/tendercells\/edge-private\.pem/);
  assert.doesNotMatch(env, /MQTT_PASSWORD=/);
});

test('a missing broker URL is simply omitted, not written as a blank value', () => {
  const env = formatEnvFile({
    deviceId: 'edge-1',
    mqttUsername: 'edge-1',
    mqttBrokerUrl: null,
    mqttPasswordFilePath: '/etc/tendercells/mqtt.password',
    privateKeyPath: '/etc/tendercells/edge-private.pem',
  });
  assert.doesNotMatch(env, /MQTT_BROKER=/);
});
