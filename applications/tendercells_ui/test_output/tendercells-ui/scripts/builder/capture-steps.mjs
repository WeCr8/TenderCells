#!/usr/bin/env node
// capture-steps.mjs - LEGO-style instruction pictures for Builder missions: for every mission
// step with a `shot`, open that page of the (simulated) demo farm, run the events the step
// needs, spotlight the exact control or panel, number it, label it and save
// public/builder-assets/steps/<mission>/<step>.webp. The step's image.step_asset points there.
//
//   npm run build && npx vite preview --port 4317     (or any running OS: TC_OS_URL)
//   node scripts/builder/capture-steps.mjs [--only 03-robot-traffic-jam]
//
// Shot spec (in the mission JSON):
//   { path, target, label, run?: [scenarioId...], click?: selector, press?: true, app?: "web" }
//   target  CSS or Playwright selector ("text=Temperature") to spotlight
//   run     demo events to trigger first (simulator buttons), so the page shows their result
//   press   show the target as the thing to press (pointer hand on the badge)
import { chromium } from "playwright";
import { execFileSync } from "node:child_process";
import { mkdirSync, readFileSync, readdirSync, rmSync, writeFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const APP = resolve(here, "../..");
const MISSIONS = join(APP, "src/features/builder/data/missions");
const PROJECTS = join(APP, "src/features/builder/data/projects");
const WEB = process.env.TC_WEB_URL || "http://localhost:5176";
const OUT = join(APP, "public/builder-assets/steps");
const OS = process.env.TC_OS_URL || "http://localhost:4317";
const only = process.argv.includes("--only") ? process.argv[process.argv.indexOf("--only") + 1] : null;
const ffmpeg = (() => {
  if (process.env.FFMPEG) return process.env.FFMPEG;
  try { return execFileSync("python3", ["-c", "import imageio_ffmpeg;print(imageio_ffmpeg.get_ffmpeg_exe())"]).toString().trim(); } catch { return "ffmpeg"; }
})();

const browser = await chromium.launch({
  ...(process.env.CHROMIUM_PATH ? { executablePath: process.env.CHROMIUM_PATH } : { executablePath: "/opt/pw-browsers/chromium" }),
  args: ["--use-gl=swiftshader", "--enable-unsafe-swiftshader", "--hide-scrollbars"],
});

async function freshPage(web = false) {
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 800 }, deviceScaleFactor: 1 });
  const page = await ctx.newPage();
  if (web) return { ctx, page };
  // No hub in captures: the demo farm runs fully simulated in the browser.
  await page.route("http://localhost:4000/**", (r) => r.fulfill({ status: 200, contentType: "application/json", body: "{}" }));
  await page.goto(`${OS}/demo`);
  await page.waitForSelector("[data-testid=demo-hero-twin]", { timeout: 30_000 });
  await page.waitForTimeout(1500);
  return { ctx, page };
}

async function spotlight(page, target, label, n, press) {
  const el = page.locator(target).first();
  await el.waitFor({ state: "visible", timeout: 15_000 });
  await el.evaluate((node) => node.scrollIntoView({ block: "center", inline: "center" }));
  await page.waitForTimeout(600);
  const box = await el.boundingBox();
  if (!box) throw new Error(`no box for ${target}`);
  await page.evaluate(({ box, label, n, press }) => {
    const pad = 8;
    const root = document.createElement("div");
    root.id = "tc-step-overlay";
    root.style.cssText = "position:fixed;inset:0;pointer-events:none;z-index:2147483647;font-family:system-ui,sans-serif";
    const x = Math.max(4, box.x - pad), y = Math.max(4, box.y - pad);
    const w = Math.min(innerWidth - x - 4, box.width + pad * 2), h = Math.min(innerHeight - y - 4, box.height + pad * 2);
    const ring = document.createElement("div");
    ring.style.cssText = `position:fixed;left:${x}px;top:${y}px;width:${w}px;height:${h}px;border:4px solid #F2C14E;border-radius:12px;box-shadow:0 0 0 9999px rgba(5,20,12,.55),0 0 24px 4px rgba(242,193,78,.8)`;
    root.appendChild(ring);
    const badge = document.createElement("div");
    badge.textContent = press ? "👆" : String(n);
    badge.style.cssText = `position:fixed;left:${x - 22}px;top:${y - 22}px;width:44px;height:44px;border-radius:50%;background:#F2C14E;color:#0D2B1E;font:900 22px/44px system-ui;text-align:center;box-shadow:0 2px 8px rgba(0,0,0,.5)`;
    root.appendChild(badge);
    const tag = document.createElement("div");
    tag.textContent = label;
    const below = y + h + 64 < innerHeight;
    tag.style.cssText = `position:fixed;left:${Math.min(Math.max(8, x), innerWidth - 420)}px;${below ? `top:${y + h + 12}px` : `top:${Math.max(8, y - 58)}px`};max-width:400px;background:#F2C14E;color:#0D2B1E;font:800 20px/1.25 system-ui;padding:9px 14px;border-radius:10px;box-shadow:0 4px 14px rgba(0,0,0,.45)`;
    root.appendChild(tag);
    document.body.appendChild(root);
  }, { box, label, n, press: Boolean(press) });
}

let made = 0;
/** Every mission and project file with its steps (projects keep steps inside stages). */
const sources = [
  ...readdirSync(MISSIONS).filter((f) => f.endsWith(".mission.json")).map((f) => ({ file: join(MISSIONS, f), slug: f.replace(".mission.json", "") })),
  ...readdirSync(PROJECTS).filter((f) => f.endsWith(".project.json")).map((f) => ({ file: join(PROJECTS, f), slug: f.replace(".project.json", "") })),
].sort((a, b) => a.slug.localeCompare(b.slug));
for (const { file, slug } of sources) {
  if (only && slug !== only) continue;
  const doc = JSON.parse(readFileSync(file, "utf8"));
  const steps = doc.steps ?? doc.stages.flatMap((s) => s.steps);
  if (!steps.some((s) => s.shot)) continue;
  mkdirSync(join(OUT, slug), { recursive: true });
  for (const [i, step] of steps.entries()) {
    const shot = step.shot;
    if (!shot) continue;
    const web = shot.app === "web";
    const { ctx, page } = await freshPage(web);
    try {
      for (const id of shot.run ?? []) {
        await page.goto(`${OS}/simulator`);
        await page.locator(`[data-testid=trigger-${id}]`).click();
        await page.waitForTimeout(2500);
      }
      // The simulator shows an event's chain and "Why?" only right after its Trigger: stay there.
      const stay = shot.path === "/simulator" && (shot.run ?? []).length > 0;
      if (!stay) {
        await page.goto(`${web ? WEB : OS}${shot.path}`);
        await page.waitForTimeout(2500);
      }
      if (shot.click) { await page.locator(shot.click).first().click(); await page.waitForTimeout(900); }
      await spotlight(page, shot.target, shot.label, i + 1, shot.press);
      // File name: the existing step_asset if it names a .webp, else the step id's last part.
      const rel = step.image?.step_asset?.endsWith(".webp") ? step.image.step_asset : `steps/${slug}/${step.id.split(".").pop()}.webp`;
      const dest = join(OUT, "..", rel);
      mkdirSync(dirname(dest), { recursive: true });
      const png = dest.replace(/\.webp$/, ".png");
      await page.screenshot({ path: png });
      execFileSync(ffmpeg, ["-y", "-loglevel", "error", "-i", png, "-c:v", "libwebp", "-quality", "78", dest]);
      rmSync(png);
      step.image = { ...(step.image ?? {}), step_asset: rel };
      made++;
      console.log(`✓ ${step.id}`);
    } catch (err) {
      console.error(`✗ ${step.id}: ${err.message.split("\n")[0]}`);
    } finally {
      await ctx.close();
    }
  }
  writeFileSync(file, JSON.stringify(doc, null, 1) + "\n");
}
await browser.close();
console.log(`${made} step pictures`);
