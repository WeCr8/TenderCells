import assert from 'node:assert/strict';
import test from 'node:test';
import { mkdtempSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { scryptSync } from 'node:crypto';
import { hashScryptSecret, loadMqttCredentials, topicAllowed, upsertMqttCredential, verifyScryptSecret } from './mqttSecurity.js';

test('verifies salted MQTT credentials without storing plaintext', () => {
  const salt = '00112233445566778899aabbccddeeff';
  const encoded = `scrypt:${salt}:${scryptSync('secret', salt, 32).toString('hex')}`;
  assert.equal(verifyScryptSecret('secret', encoded), true);
  assert.equal(verifyScryptSecret('wrong', encoded), false);
});

test('hashScryptSecret produces a hash verifyScryptSecret accepts', () => {
  const encoded = hashScryptSecret('a fresh device secret');
  assert.equal(verifyScryptSecret('a fresh device secret', encoded), true);
  assert.equal(verifyScryptSecret('a different secret', encoded), false);
});

test('upsertMqttCredential creates, then replaces rather than duplicates', () => {
  const dir = mkdtempSync(join(tmpdir(), 'tc-mqtt-creds-'));
  const path = join(dir, 'credentials.json');
  try {
    upsertMqttCredential(path, {
      clientId: 'edge-1', username: 'edge-1', secret: 'first-secret',
      publishPrefixes: ['tc/edge-1/#'], subscribePrefixes: ['tc/edge-1/#'],
    });
    upsertMqttCredential(path, {
      clientId: 'edge-1', username: 'edge-1', secret: 'second-secret',
      publishPrefixes: ['tc/edge-1/#'], subscribePrefixes: ['tc/edge-1/#'],
    });

    const raw = JSON.parse(readFileSync(path, 'utf8'));
    assert.equal(raw.clients.length, 1);

    const loaded = loadMqttCredentials(path);
    assert.equal(loaded.size, 1);
    const record = loaded.get('edge-1');
    assert.ok(record);
    assert.equal(verifyScryptSecret('first-secret', record.passwordHash), false);
    assert.equal(verifyScryptSecret('second-secret', record.passwordHash), true);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

test('limits MQTT access to explicit TenderCells topic prefixes', () => {
  assert.equal(topicAllowed('tc/cam-01/sensors', ['tc/cam-01/#']), true);
  assert.equal(topicAllowed('tc/cam-02/sensors', ['tc/cam-01/#']), false);
  assert.equal(topicAllowed('tc/cam-01/cmd/drive', ['tc/cam-01/cmd/drive']), true);
  assert.equal(topicAllowed('tc/cam-01/cmd/door', ['tc/cam-01/cmd/drive']), false);
  assert.equal(topicAllowed('tc/anything/sensors', ['tc/+/#']), false);
});
