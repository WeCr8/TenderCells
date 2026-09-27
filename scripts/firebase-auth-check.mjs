#!/usr/bin/env node
// firebase-auth-check.mjs - verify (and additively repair) the Firebase Auth
// project settings that the hosted sign-in depends on.
//
// Checks, via the Identity Toolkit admin API:
//   - Email/Password provider enabled            -> enables it if off
//   - tendercells.com + Firebase Hosting domains  -> adds any that are missing
//     are authorized domains
//   - Google provider enabled                     -> warns only; enabling it needs
//                                                   an OAuth client (console step)
//
// Only ever ADDS domains / turns email sign-in on; never removes anything.
// Never fails the deploy: a missing permission becomes a ::warning::.
//
// Env: ACCESS_TOKEN (OAuth token for the deploy service account), and
//      AUTH_EXTRA_DOMAINS (optional, comma-separated extra domains to authorize).
// Usage: node scripts/firebase-auth-check.mjs --project <projectId>

import { appendFileSync } from 'node:fs';

const projectArgIndex = process.argv.indexOf('--project');
const project = projectArgIndex > -1 ? process.argv[projectArgIndex + 1] : process.env.FIREBASE_PROJECT;
const token = process.env.ACCESS_TOKEN;
const base = `https://identitytoolkit.googleapis.com/admin/v2/projects/${project}`;

const requiredDomains = [
  'tendercells.com',
  'www.tendercells.com',
  `${project}.web.app`,
  `${project}.firebaseapp.com`,
  ...(process.env.AUTH_EXTRA_DOMAINS || '').split(',').map((d) => d.trim()).filter(Boolean),
];

const summary = [];
const note = (line) => {
  console.log(line);
  summary.push(`- ${line}`);
};
const warn = (line) => {
  console.log(`::warning::${line}`);
  summary.push(`- ⚠️ ${line}`);
};

/**
 * Call the Identity Toolkit admin API.
 *
 * @param path   - path under /admin/v2/projects/{project}
 * @param init   - fetch init (method/body)
 * @returns Parsed JSON body
 * @throws {Error} with the HTTP status and API message on a non-2xx response
 */
async function api(path, init = {}) {
  const res = await fetch(`${base}${path}`, {
    ...init,
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
  });
  const body = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(`${res.status} ${body?.error?.message || res.statusText}`);
  return body;
}

async function main() {
  if (!project || !token) {
    warn('Auth config check skipped: missing --project or ACCESS_TOKEN.');
    return;
  }

  let config;
  try {
    config = await api('/config');
  } catch (err) {
    warn(`Could not read Firebase Auth config (${err.message}). Grant the deploy service account "Firebase Authentication Admin" to enable this check.`);
    return;
  }

  const authorized = new Set(config.authorizedDomains || []);
  const missing = requiredDomains.filter((d) => !authorized.has(d));
  const emailEnabled = Boolean(config.signIn?.email?.enabled);
  const passwordRequired = Boolean(config.signIn?.email?.passwordRequired);

  note(`Authorized domains: ${[...authorized].join(', ') || '(none)'}`);
  note(`Email/Password sign-in: ${emailEnabled && passwordRequired ? 'enabled' : 'DISABLED'}`);

  const updateMask = [];
  const patch = {};
  if (missing.length) {
    patch.authorizedDomains = [...authorized, ...missing];
    updateMask.push('authorizedDomains');
  }
  if (!emailEnabled || !passwordRequired) {
    patch.signIn = { email: { enabled: true, passwordRequired: true } };
    updateMask.push('signIn.email.enabled', 'signIn.email.passwordRequired');
  }

  if (updateMask.length) {
    try {
      await api(`/config?updateMask=${updateMask.join(',')}`, { method: 'PATCH', body: JSON.stringify(patch) });
      if (missing.length) note(`Added authorized domains: ${missing.join(', ')}`);
      if (patch.signIn) note('Enabled Email/Password sign-in.');
    } catch (err) {
      warn(`Could not update Firebase Auth config (${err.message}). Fix in console: Authentication > Settings > Authorized domains (${missing.join(', ') || 'ok'}) and Sign-in method > Email/Password.`);
    }
  }

  try {
    const google = await api('/defaultSupportedIdpConfigs/google.com');
    if (google.enabled) note('Google sign-in: enabled');
    else warn('Google sign-in provider exists but is DISABLED. Enable it in Firebase console > Authentication > Sign-in method > Google.');
  } catch (err) {
    if (err.message.startsWith('404')) {
      warn('Google sign-in provider is NOT configured. Enable it in Firebase console > Authentication > Sign-in method > Google.');
    } else {
      warn(`Could not read Google provider config (${err.message}).`);
    }
  }
}

await main();
if (process.env.GITHUB_STEP_SUMMARY) {
  appendFileSync(process.env.GITHUB_STEP_SUMMARY, `### Firebase Auth config (${project})\n${summary.join('\n')}\n`);
}
