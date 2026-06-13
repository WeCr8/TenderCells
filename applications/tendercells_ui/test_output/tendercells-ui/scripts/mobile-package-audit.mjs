#!/usr/bin/env node
import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const root = process.cwd();
const checks = [];

function check(name, ok, detail) {
  checks.push({ name, ok, detail });
}

function readJson(path) {
  return JSON.parse(readFileSync(resolve(root, path), 'utf8'));
}

const manifestPath = 'public/manifest.json';
const manifest = existsSync(resolve(root, manifestPath)) ? readJson(manifestPath) : null;

check('PWA manifest', Boolean(manifest), manifestPath);
check('Standalone display', manifest?.display === 'standalone', manifest?.display || 'missing');
check('PWA icon', Boolean(manifest?.icons?.length), manifest?.icons?.[0]?.src || 'missing');
check('Android native wrapper', existsSync(resolve(root, 'android')), 'Capacitor android folder not scaffolded yet');
check('iOS native wrapper', existsSync(resolve(root, 'ios')), 'Capacitor ios folder not scaffolded yet');
check('Capacitor config', existsSync(resolve(root, 'capacitor.config.ts')) || existsSync(resolve(root, 'capacitor.config.json')), 'Capacitor config not scaffolded yet');
check('Android Firebase config', existsSync(resolve(root, 'android/app/google-services.json')), 'google-services.json must stay out of git');
check('iOS Firebase config', existsSync(resolve(root, 'ios/App/App/GoogleService-Info.plist')), 'GoogleService-Info.plist must stay out of git');

console.log('TenderCells mobile package audit');
for (const item of checks) {
  const marker = item.ok ? 'OK ' : 'TODO';
  console.log(`${marker} ${item.name} - ${item.detail}`);
}

const nativeReady = checks
  .filter((item) => /native wrapper|Capacitor config|Firebase config/.test(item.name))
  .every((item) => item.ok);

if (!nativeReady) {
  console.log('\nCurrent status: PWA install/testing is ready; native Android/iOS packages are not scaffolded yet.');
  console.log('Next: install Capacitor, add android/ios platforms, then generate local debug builds and signing fingerprints.');
}
