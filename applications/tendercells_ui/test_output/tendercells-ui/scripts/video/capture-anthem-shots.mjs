#!/usr/bin/env node
// capture-anthem-shots.mjs - records one screen clip per shot in docs/video/anthem-cues.json
// from the running demo, ready for the rough cut (rough-cut.mjs) or a real edit.
//
// Needs the OS dev server (default http://localhost:5173) and, for website shots, the
// website dev server (default http://localhost:5176). Everything shown is the simulated
// demo - no hardware, no account.
//
// Usage: npm run video:shots [-- --only S01,S14] [-- --size 1280x720]
// Env:   TC_OS_URL, TC_WEB_URL, CHROMIUM_PATH (defaults to Playwright's own browser)
// Out:   video-out/shots/<id>.webm + video-out/shots/manifest.json ({id, file, leadSec, durSec})
import { chromium } from '@playwright/test';
import { mkdirSync, readFileSync, renameSync, writeFileSync, existsSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const cues = JSON.parse(readFileSync(resolve(here, '../../../../../../docs/video/anthem-cues.json'), 'utf8'));
const OUT = resolve(here, '../../video-out/shots');
const OS = process.env.TC_OS_URL || 'http://localhost:5173';
const WEB = process.env.TC_WEB_URL || 'http://localhost:5176';
const arg = (name) => { const i = process.argv.indexOf(name); return i > 0 ? process.argv[i + 1] : undefined; };
const only = arg('--only')?.split(',');
const [W, H] = (arg('--size') || '1920x1080').split('x').map(Number);
const HANDLE_SEC = 0.6; // extra footage after each shot for the editor

mkdirSync(OUT, { recursive: true });
const browser = await chromium.launch({
  ...(process.env.CHROMIUM_PATH ? { executablePath: process.env.CHROMIUM_PATH } : {}),
  args: ['--use-gl=swiftshader', '--enable-webgl', '--ignore-gpu-blocklist', '--hide-scrollbars'],
});

// Seed the demo once (it lives in localStorage) and reuse that state for every shot.
const seedCtx = await browser.newContext({ viewport: { width: W, height: H } });
const seedPage = await seedCtx.newPage();
await seedPage.goto(`${OS}/demo`);
await seedPage.waitForSelector('[data-testid=demo-hero-twin]', { timeout: 30_000 });
// Warm-up: open every route once so the dev server has compiled it (a first visit can sit on
// the loading screen for seconds - longer than a one-beat shot).
for (const route of new Set(cues.shots.filter((s) => s.app === 'os').map((s) => s.route))) {
  await seedPage.goto(`${OS}${route}`, { waitUntil: 'networkidle' }).catch(() => {});
}
const storageState = await seedCtx.storageState();
await seedCtx.close();

const scrollTo = async (page, sel) => {
  const el = page.locator(sel).first();
  await el.waitFor({ timeout: 15_000 });
  await el.evaluate((n) => n.scrollIntoView({ block: 'start' }));
};
const clickIn = async (page, scopeSel, name) => {
  await page.locator(scopeSel).first().locator('xpath=..').getByRole('button', { name, exact: true }).first().click().catch(() => {});
};

/** Put the page in the shot's starting state. */
async function setUp(page, shot) {
  const base = shot.app === 'web' ? WEB : OS;
  // The OS probes a local API only in dev / on localhost; answer it so the dev-only
  // "API server unavailable" banner stays off, as on the deployed site.
  await page.route('http://localhost:4000/health', (r) => r.fulfill({ status: 200, body: 'ok' }));
  await page.goto(`${base}${shot.route}`, { waitUntil: 'networkidle' }).catch(() => {});
  // Wait out the app's loading screen (route chunks, demo data).
  await page.waitForFunction(() => document.querySelectorAll('main, header, nav').length > 0
    && !document.querySelector('.MuiCircularProgress-root:not([data-keep])'), null, { timeout: 15_000 }).catch(() => {});
  switch (shot.action) {
    case 'hero3d':
    case 'hero2d':
      await scrollTo(page, '[data-testid=demo-hero-twin]');
      await page.waitForTimeout(2500);
      if (shot.action === 'hero2d') { await clickIn(page, '[data-testid=autopilot-panel]', '2D'); await page.waitForTimeout(1200); }
      break;
    case 'viewer':
    case 'viewer2d':
      await scrollTo(page, '[data-testid=autopilot-panel]');
      await page.evaluate(() => window.scrollBy(0, -80));
      await page.waitForTimeout(2500);
      if (shot.action === 'viewer2d') { await clickIn(page, '[data-testid=autopilot-panel]', '2D'); await page.waitForTimeout(1200); }
      break;
    case 'trigger':
      await page.waitForTimeout(2000);
      await page.locator('[data-testid=trigger-predator]').click().catch(() => {});
      await page.waitForTimeout(400);
      break;
    default:
      await page.waitForTimeout(2500);
  }
}

const manifest = existsSync(resolve(OUT, 'manifest.json')) ? JSON.parse(readFileSync(resolve(OUT, 'manifest.json'), 'utf8')) : {};
for (const shot of cues.shots) {
  if (shot.app === 'card' || (only && !only.includes(shot.id))) continue;
  const durSec = +(shot.end - shot.start).toFixed(2);
  const ctx = await browser.newContext({ viewport: { width: W, height: H }, storageState, recordVideo: { dir: OUT, size: { width: W, height: H } } });
  const page = await ctx.newPage();
  const t0 = Date.now();
  try {
    await setUp(page, shot);
  } catch (e) {
    console.warn(`${shot.id}: setup issue (${e.message.split('\n')[0]}) - recording anyway`);
  }
  const leadSec = (Date.now() - t0) / 1000;
  await page.waitForTimeout((durSec + HANDLE_SEC) * 1000);
  const video = page.video();
  await ctx.close();
  const file = `${shot.id}.webm`;
  renameSync(await video.path(), resolve(OUT, file));
  manifest[shot.id] = { id: shot.id, file, leadSec: +leadSec.toFixed(2), durSec, route: shot.route, action: shot.action };
  writeFileSync(resolve(OUT, 'manifest.json'), JSON.stringify(manifest, null, 1));
  console.log(`${shot.id} ${shot.route} [${shot.action}] ${durSec}s (lead ${leadSec.toFixed(1)}s)`);
}
await browser.close();
console.log(`Clips in ${OUT}. Next: npm run video:roughcut`);
