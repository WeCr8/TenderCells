#!/usr/bin/env node
// firebase-web-env.mjs - write the Firebase *web* config into the repo-root .env
// before the hosted build, so tendercells.com/app ships with working sign-in.
//
// Why: the deploy used to build the app with no Firebase config at all, so every
// Login / Sign-up / Google attempt on the live site failed. The web config
// (apiKey, authDomain, projectId, appId, ...) is public by design - it identifies
// the project, it does not grant access - but it is still not committed; CI derives
// it from the project the deploy service account belongs to.
//
// Sources, in order:
//   1. VITE_FIREBASE_* already in the environment (e.g. repo secrets/variables).
//   2. `firebase apps:sdkconfig WEB` for FIREBASE_WEB_APP_ID, or the project's
//      first web app, using GOOGLE_APPLICATION_CREDENTIALS.
//
// Usage: node scripts/firebase-web-env.mjs --project <projectId>
// Exits non-zero when no usable config is found: publishing a build whose sign-in
// cannot work is worse than failing the deploy.

import { execFileSync } from 'node:child_process';
import { appendFileSync, readFileSync, writeFileSync, existsSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const envPath = resolve(repoRoot, '.env');

const projectArgIndex = process.argv.indexOf('--project');
const project = projectArgIndex > -1 ? process.argv[projectArgIndex + 1] : process.env.FIREBASE_PROJECT;

const KEY_MAP = {
  apiKey: 'VITE_FIREBASE_API_KEY',
  authDomain: 'VITE_FIREBASE_AUTH_DOMAIN',
  databaseURL: 'VITE_FIREBASE_DATABASE_URL',
  projectId: 'VITE_FIREBASE_PROJECT_ID',
  storageBucket: 'VITE_FIREBASE_STORAGE_BUCKET',
  messagingSenderId: 'VITE_FIREBASE_MESSAGING_SENDER_ID',
  appId: 'VITE_FIREBASE_APP_ID',
  measurementId: 'VITE_FIREBASE_MEASUREMENT_ID',
};

/**
 * Run the Firebase CLI with --json and return its `result` payload.
 *
 * @param args - CLI arguments, without --json / --project
 * @returns The parsed `result` field of the CLI's JSON output
 * @throws {Error} if the CLI exits non-zero or reports a non-success status
 */
function firebaseJson(args) {
  const out = execFileSync('firebase', [...args, '--project', project, '--json', '--non-interactive'], {
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'inherit'],
  });
  const parsed = JSON.parse(out);
  if (parsed.status !== 'success') throw new Error(`firebase ${args.join(' ')}: ${out}`);
  return parsed.result;
}

/**
 * Resolve the web SDK config from the environment or the Firebase project.
 *
 * @returns Firebase web config object (apiKey, authDomain, projectId, ...)
 */
function resolveConfig() {
  if (process.env.VITE_FIREBASE_API_KEY && process.env.VITE_FIREBASE_PROJECT_ID) {
    console.log('Using Firebase web config from VITE_FIREBASE_* environment variables.');
    return Object.fromEntries(
      Object.entries(KEY_MAP).map(([field, envKey]) => [field, process.env[envKey] || '']),
    );
  }

  if (!project) throw new Error('No --project given and no VITE_FIREBASE_* env config.');

  let appId = process.env.FIREBASE_WEB_APP_ID;
  if (!appId) {
    const apps = firebaseJson(['apps:list', 'WEB']);
    if (!Array.isArray(apps) || apps.length === 0) {
      throw new Error(`Project ${project} has no Firebase web app. Create one in Project settings > General.`);
    }
    appId = apps[0].appId;
    console.log(`Using web app ${apps[0].displayName || ''} (${appId}) of ${apps.length}.`);
  }

  const result = firebaseJson(['apps:sdkconfig', 'WEB', appId]);
  if (result.sdkConfig) return result.sdkConfig;
  // Older firebase-tools only return the generated file text.
  const match = /\{[\s\S]*\}/.exec(result.fileContents || '');
  if (!match) throw new Error('Could not parse web SDK config from firebase CLI output.');
  return JSON.parse(match[0]);
}

const config = resolveConfig();
if (process.env.FIREBASE_AUTH_DOMAIN) {
  config.authDomain = process.env.FIREBASE_AUTH_DOMAIN;
}
if (!config.apiKey || !config.authDomain || !config.projectId) {
  console.error('Firebase web config is missing apiKey/authDomain/projectId; refusing to build without sign-in.');
  process.exit(1);
}

// Keep any unrelated keys already in .env; replace only the Firebase ones.
const managedKeys = new Set(Object.values(KEY_MAP));
const kept = existsSync(envPath)
  ? readFileSync(envPath, 'utf8').split('\n').filter((line) => !managedKeys.has(line.split('=')[0].trim()))
  : [];
const lines = Object.entries(KEY_MAP)
  .filter(([field]) => config[field])
  .map(([field, envKey]) => `${envKey}=${config[field]}`);

writeFileSync(envPath, [...kept.filter(Boolean), ...lines, ''].join('\n'));

// Also export to later CI steps as process env: Vite gives VITE_* process env
// priority over .env files, so the build gets the config even if envDir lookup
// ever misses the file.
if (process.env.GITHUB_ENV) {
  appendFileSync(process.env.GITHUB_ENV, `${lines.join('\n')}\n`);
  console.log('Exported Firebase web config keys to GITHUB_ENV for the build step.');
}
console.log(`Wrote ${lines.length} Firebase web config keys to .env (project ${config.projectId}, authDomain ${config.authDomain}).`);
