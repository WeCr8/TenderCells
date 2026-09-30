#!/usr/bin/env node
// enroll.mjs
// One-time exchange of a short-lived claim code (minted by the device owner,
// signed in to the TenderCells app) for this bridge's own scoped MQTT
// identity. Never touches Firebase and never holds an admin credential — see
// docs/EDGE_BRIDGE_INSTALL.md's "installation boundary". Pairs with
// check-readiness.mjs, which refuses managed installation until the files
// this script writes are in place.

import { generateKeyPairSync } from 'node:crypto';
import { mkdirSync, writeFileSync } from 'node:fs';
import path from 'node:path';

export function enrollmentEndpointAllowed(value) {
  try {
    const url = new URL(value);
    return url.protocol === 'https:' || (url.protocol === 'http:' && ['127.0.0.1', 'localhost'].includes(url.hostname));
  } catch { return false; }
}

export function buildClaimRequestBody(claimCode, deviceId, publicKey) {
  const body = { code: claimCode, publicKey };
  if (deviceId) body.deviceId = deviceId;
  return body;
}

export function formatEnvFile({ deviceId, mqttUsername, mqttBrokerUrl, mqttPasswordFilePath, privateKeyPath }) {
  const lines = [
    `TC_DEVICE_ID=${deviceId}`,
    `MQTT_USERNAME=${mqttUsername}`,
    `MQTT_PASSWORD_FILE=${mqttPasswordFilePath}`,
    `TC_EDGE_PRIVATE_KEY_FILE=${privateKeyPath}`,
  ];
  if (mqttBrokerUrl) lines.push(`MQTT_BROKER=${mqttBrokerUrl}`);
  return `${lines.join('\n')}\n`;
}

async function claimDevice(endpoint, claimCode, deviceId, publicKey) {
  const response = await fetch(endpoint, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(buildClaimRequestBody(claimCode, deviceId, publicKey)),
  });
  if (!response.ok) {
    const detail = await response.text().catch(() => '');
    throw new Error(`Claim failed (${response.status}): ${detail}`);
  }
  return response.json();
}

async function main() {
  const endpoint = process.env.TC_ENROLLMENT_URL || (process.env.TC_API_URL ? `${process.env.TC_API_URL.replace(/\/+$/, '')}/api/mqtt/edge/claim` : '');
  const claimCode = process.env.TC_DEVICE_CLAIM_CODE || '';
  const deviceId = process.env.TC_DEVICE_ID || '';
  const configDir = process.env.TC_EDGE_CONFIG_DIR || '/etc/tendercells';
  const passwordFile = process.env.MQTT_PASSWORD_FILE || path.join(configDir, 'mqtt.password');
  const privateKeyFile = process.env.TC_EDGE_PRIVATE_KEY_FILE || path.join(configDir, 'edge-private.pem');
  const publicKeyFile = path.join(configDir, 'edge-public.pem');
  const envFile = process.env.TC_EDGE_ENV_FILE || path.join(configDir, 'edge.env');

  if (!enrollmentEndpointAllowed(endpoint)) throw new Error('Enrollment requires HTTPS, except for a localhost self-hosted API.');
  if (!claimCode) throw new Error('Set TC_DEVICE_CLAIM_CODE to the one-time code the owner generated.');

  const keys = generateKeyPairSync('ed25519', {
    publicKeyEncoding: { type: 'spki', format: 'pem' },
    privateKeyEncoding: { type: 'pkcs8', format: 'pem' },
  });
  const result = await claimDevice(endpoint, claimCode, deviceId, keys.publicKey);
  const brokerUrl = result.mqttBroker || result.mqttBrokerUrl;
  if (!String(brokerUrl || '').startsWith('mqtts://')) throw new Error('Enrollment did not return an MQTT over TLS broker.');

  mkdirSync(configDir, { recursive: true, mode: 0o700 });
  writeFileSync(privateKeyFile, keys.privateKey, { mode: 0o600 });
  writeFileSync(publicKeyFile, keys.publicKey, { mode: 0o644 });
  writeFileSync(passwordFile, `${result.mqttPassword}\n`, { mode: 0o600 });
  writeFileSync(
    envFile,
    formatEnvFile({
      deviceId: result.deviceId,
      mqttUsername: result.mqttUsername,
      mqttBrokerUrl: brokerUrl,
      mqttPasswordFilePath: passwordFile,
      privateKeyPath: privateKeyFile,
    }),
    { mode: 0o600 },
  );

  console.log(`TenderCells edge bridge enrolled as ${result.deviceId}`);
  console.log(`MQTT identity written to ${envFile} (the password itself stays only in ${passwordFile})`);
  console.log('Source that env file, or import its values into your service, before starting the bridge.');
}

if (import.meta.url === `file://${process.argv[1]?.replaceAll('\\', '/')}`) {
  main().catch((err) => {
    console.error(String(err?.message || err));
    process.exitCode = 1;
  });
}
