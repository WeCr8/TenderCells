#!/usr/bin/env node
import { execFileSync } from 'node:child_process';
import { existsSync, readFileSync } from 'node:fs';
import os from 'node:os';

export function detectBoard(model = '') {
  const value = model.toLowerCase();
  if (value.includes('raspberry pi')) return 'raspberry-pi';
  if (value.includes('jetson')) return 'nvidia-jetson';
  return 'generic-linux';
}

export function evaluateReadiness(input) {
  const checks = [
    { id: 'linux', ok: input.platform === 'linux', required: true, message: 'TenderCells edge services require Linux on the bridge.' },
    { id: 'arm64', ok: input.arch === 'arm64', required: false, message: 'Pi and Jetson release packages target arm64.' },
    { id: 'node', ok: input.nodeMajor >= 22, required: true, message: 'Node.js 22 or newer is required.' },
    { id: 'ffmpeg', ok: input.commands.ffmpeg, required: input.camera, message: 'FFmpeg is required only when this bridge relays cameras.' },
    { id: 'docker', ok: input.commands.docker, required: false, message: 'Docker is optional for isolated extension packages.' },
    { id: 'identity-key', ok: input.edgePrivateKey, required: input.managed, message: 'Managed enrollment requires a bridge-generated private identity key.' },
    { id: 'mqtt-tls', ok: input.mqttTls, required: input.managed, message: 'Managed and school bridges require MQTT over TLS.' },
    { id: 'mqtt-identity', ok: input.mqttIdentity, required: input.managed, message: 'Managed and school bridges require a scoped device identity.' },
    { id: 'no-admin-key', ok: !input.firebaseAdminKey, required: true, message: 'Do not install a Firebase administrator key on an edge bridge.' },
  ];
  return { checks, ready: checks.every((check) => !check.required || check.ok) };
}

function commandExists(command) {
  try {
    execFileSync('sh', ['-lc', `command -v ${command}`], { stdio: 'ignore' });
    return true;
  } catch {
    return false;
  }
}

function readModel() {
  const path = '/proc/device-tree/model';
  return existsSync(path) ? readFileSync(path, 'utf8').replaceAll('\0', '').trim() : '';
}

function envEnabled(name) {
  return ['1', 'true', 'yes'].includes(String(process.env[name] || '').toLowerCase());
}

if (import.meta.url === `file://${process.argv[1].replaceAll('\\', '/')}`) {
  const model = readModel();
  const result = evaluateReadiness({
    platform: os.platform(),
    arch: os.arch(),
    nodeMajor: Number(process.versions.node.split('.')[0]),
    commands: { docker: commandExists('docker'), ffmpeg: commandExists('ffmpeg') },
    camera: envEnabled('TC_EDGE_CAMERA'),
    managed: envEnabled('TC_EDGE_MANAGED'),
    edgePrivateKey: existsSync(process.env.TC_EDGE_PRIVATE_KEY_FILE || `${os.homedir()}/.config/tendercells/edge-private.pem`),
    mqttTls: String(process.env.MQTT_BROKER || '').startsWith('mqtts://'),
    mqttIdentity: Boolean(process.env.MQTT_USERNAME && process.env.MQTT_PASSWORD_FILE),
    firebaseAdminKey: Boolean(process.env.FIREBASE_ADMIN_SDK_PATH || process.env.GOOGLE_APPLICATION_CREDENTIALS),
  });
  console.log(`TenderCells edge preflight: ${detectBoard(model)}${model ? ` (${model})` : ''}`);
  for (const check of result.checks) {
    const state = check.ok ? 'PASS' : check.required ? 'BLOCK' : 'OPTIONAL';
    console.log(`${state.padEnd(8)} ${check.message}`);
  }
  process.exitCode = result.ready ? 0 : 1;
}
