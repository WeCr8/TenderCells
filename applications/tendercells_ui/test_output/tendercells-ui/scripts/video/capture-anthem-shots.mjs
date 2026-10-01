#!/usr/bin/env node
// Records motion-first demo takes. No real account, hardware, or customer data is used.
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
const HANDLE_SEC = 0.75;

mkdirSync(OUT, { recursive: true });
const browser = await chromium.launch({
  ...(process.env.CHROMIUM_PATH ? { executablePath: process.env.CHROMIUM_PATH } : {}),
  args: ['--use-gl=swiftshader', '--enable-webgl', '--ignore-gpu-blocklist', '--hide-scrollbars'],
});
const seedCtx = await browser.newContext({ viewport: { width: W, height: H } });
const seedPage = await seedCtx.newPage();
await seedPage.goto(`${OS}/demo`);
await seedPage.waitForSelector('[data-testid=demo-hero-twin]', { timeout: 30_000 });
const storageState = await seedCtx.storageState();
await seedCtx.close();

async function setup(page, shot) {
  const base = shot.app === 'web' ? WEB : OS;
  await page.route('http://localhost:4000/health', (r) => r.fulfill({ status: 200, body: 'ok' }));
  await page.goto(`${base}${shot.route}`, { waitUntil: 'domcontentloaded' });
  await page.waitForFunction(() => document.querySelectorAll('main,header,nav').length > 0, null, { timeout: 15_000 });
  if (shot.app === 'web') {
    await page.getByRole('button', { name: /Reject Optional/i }).click({ timeout: 1500 }).catch(() => {});
  }
  await page.waitForTimeout(1400);
  const selector = shot.action.startsWith('hero') ? '[data-testid=demo-hero-twin]'
    : shot.action.startsWith('viewer') ? '[data-testid=autopilot-panel]' : null;
  if (selector) await page.locator(selector).first().evaluate((el) => el.scrollIntoView({ block: 'center' })).catch(() => {});
  if (shot.action.endsWith('2d')) {
    await page.getByRole('button', { name: '2D', exact: true }).first().click().catch(() => {});
    await page.waitForTimeout(650);
  }
}

async function orbit(page, durationMs) {
  const canvas = page.locator('canvas').first();
  if (!(await canvas.isVisible().catch(() => false))) return false;
  const box = await canvas.boundingBox();
  if (!box) return false;
  const y = box.y + box.height * 0.48;
  await page.mouse.move(box.x + box.width * 0.68, y);
  await page.mouse.down();
  const steps = Math.max(18, Math.floor(durationMs / 70));
  for (let i = 0; i <= steps; i++) {
    const t = i / steps;
    await page.mouse.move(box.x + box.width * (0.68 - 0.27 * t), y - Math.sin(t * Math.PI) * 32);
    await page.waitForTimeout(durationMs / steps);
  }
  await page.mouse.up();
  await page.mouse.wheel(0, -350);
  return true;
}

async function glide(page, durationMs) {
  const bounds = await page.evaluate(() => ({ start: scrollY, max: Math.max(0, document.documentElement.scrollHeight - innerHeight) }));
  if (bounds.max < 80) {
    await page.mouse.move(W * .25, H * .48, { steps: 18 });
    await page.mouse.move(W * .72, H * .58, { steps: 28 });
    await page.waitForTimeout(Math.max(0, durationMs - 800));
    return;
  }
  const target = Math.min(bounds.max, bounds.start + Math.max(H * .55, bounds.max * .36));
  await page.evaluate(({ from, to, ms }) => new Promise((done) => {
    const began = performance.now();
    const tick = (now) => {
      const p = Math.min(1, (now - began) / ms);
      const e = p < .5 ? 2 * p * p : 1 - Math.pow(-2 * p + 2, 2) / 2;
      scrollTo(0, from + (to - from) * e);
      p < 1 ? requestAnimationFrame(tick) : done();
    };
    requestAnimationFrame(tick);
  }), { from: bounds.start, to: target, ms: Math.max(700, durationMs - 250) });
}

async function perform(page, shot, durationMs) {
  if (shot.action === 'trigger') {
    await page.locator('[data-testid=trigger-predator]').click().catch(() => {});
    await page.waitForTimeout(durationMs);
  } else if (!((shot.action.includes('3d') || shot.action === 'viewer') && await orbit(page, durationMs - 200))) {
    await glide(page, durationMs);
  }
}

const manifestPath = resolve(OUT, 'manifest.json');
const manifest = existsSync(manifestPath) ? JSON.parse(readFileSync(manifestPath, 'utf8')) : {};
for (const shot of cues.shots) {
  if (shot.app === 'card' || (only && !only.includes(shot.id))) continue;
  const durSec = +(shot.end - shot.start).toFixed(2);
  const ctx = await browser.newContext({ viewport: { width: W, height: H }, storageState, recordVideo: { dir: OUT, size: { width: W, height: H } } });
  const page = await ctx.newPage();
  const t0 = Date.now();
  try { await setup(page, shot); } catch (error) { console.warn(`${shot.id}: setup issue (${error.message.split('\n')[0]})`); }
  const leadSec = (Date.now() - t0) / 1000;
  await perform(page, shot, (durSec + HANDLE_SEC) * 1000).catch((error) => console.warn(`${shot.id}: motion issue (${error.message.split('\n')[0]})`));
  const video = page.video();
  await ctx.close();
  const file = `${shot.id}.webm`;
  renameSync(await video.path(), resolve(OUT, file));
  manifest[shot.id] = { id: shot.id, file, leadSec: +leadSec.toFixed(2), durSec, route: shot.route, action: shot.action, motion: true };
  writeFileSync(manifestPath, JSON.stringify(manifest, null, 2));
  console.log(`${shot.id} ${shot.route} [${shot.action}] ${durSec}s`);
}
await browser.close();
console.log(`Motion takes: ${OUT}. Next: npm run video:roughcut`);
