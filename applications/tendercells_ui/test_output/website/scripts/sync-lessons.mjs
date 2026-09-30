#!/usr/bin/env node
// sync-lessons.mjs - copy the classroom lessons from the repo docs/ into public/lessons/
// so the website always shows the current build instructions.
//
// Links are rewritten for the website while copying:
//   another lesson's source (docs/CLASSROOM_*.md, docs/LEARNING_TRACKS.md, ...) -> /lessons/<slug>
//   a doc with its own site page (docs/CAMERA_NODE_FIRST_BUILD.md)            -> that page
//   any other repo file or folder (firmware/, express-api/, docs/...)            -> GitHub (blob / tree)
//   images in the repo                                                          -> raw.githubusercontent.com
//
//   node scripts/sync-lessons.mjs          write public/lessons/*.md
//   node scripts/sync-lessons.mjs --check  fail if a copy is stale or a link cannot be resolved (CI)
import { existsSync, readFileSync, statSync, writeFileSync } from "node:fs";
import { dirname, join, posix, relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const HERE = dirname(fileURLToPath(import.meta.url));
const WEBSITE = resolve(HERE, "..");
const REPO = resolve(WEBSITE, "../../../..");
const OUT = join(WEBSITE, "public/lessons");
const GITHUB = "https://github.com/WeCr8/TenderCells";
const RAW = "https://raw.githubusercontent.com/WeCr8/TenderCells/main";

// Lesson slug -> source in the repo. Keep in step with src/data/lessons.ts.
export const LESSON_SOURCES = {
  "your-first-coop-brain": "docs/lessons/00-your-first-coop-brain.md",
  "classroom-quickstart": "docs/CLASSROOM_QUICKSTART.md",
  "door-roaming-roost": "docs/CLASSROOM_DOOR_AND_ROAMING_ROOST.md",
  "sensors-automation": "docs/CLASSROOM_SENSORS_AND_AUTOMATION.md",
  "feeder-waterer": "docs/CLASSROOM_FEEDER_AND_WATERER.md",
  "build-your-own": "docs/CLASSROOM_BUILD_YOUR_OWN_DEVICE.md",
  "gantry-bom": "docs/CLASSROOM_GANTRY_AND_BOM.md",
  "ai-cad-fusion": "docs/CLASSROOM_AI_CAD_FUSION_MCP.md",
  "learning-tracks": "docs/LEARNING_TRACKS.md",
};
// Other repo docs that have their own page on the site.
const SITE_PAGES = {
  "docs/CAMERA_NODE_FIRST_BUILD.md": "/guides/camera-node-first-build",
};
const SLUG_BY_SOURCE = Object.fromEntries(Object.entries(LESSON_SOURCES).map(([slug, src]) => [src, slug]));

/** Rewrite one link target found in `source` (repo-relative path of the lesson). */
function rewrite(target, source, image, problems) {
  // Our own site under any of its hostnames (old Firebase domain included) -> a site path.
  const own = /^https?:\/\/(?:www\.)?(?:tendercells\.com|tender-cells\.web\.app|tender-cells\.firebaseapp\.com)(\/[^\s]*)?$/.exec(target);
  if (own) return own[1] || "/";
  if (/^(https?:|mailto:|tel:|#|\/)/.test(target)) return target;
  const [pathPart, hash = ""] = target.split("#");
  const repoPath = posix.normalize(posix.join(posix.dirname(source), decodeURIComponent(pathPart)));
  const anchor = hash ? `#${hash}` : "";
  if (SLUG_BY_SOURCE[repoPath]) return `/lessons/${SLUG_BY_SOURCE[repoPath]}${anchor}`;
  if (SITE_PAGES[repoPath]) return `${SITE_PAGES[repoPath]}${anchor}`;
  const abs = join(REPO, repoPath);
  if (repoPath.startsWith("..") || !existsSync(abs)) {
    problems.push(`${source}: link "${target}" -> ${repoPath} does not exist`);
    return target;
  }
  if (image) return `${RAW}/${repoPath}`;
  return `${GITHUB}/${statSync(abs).isDirectory() ? "tree" : "blob"}/main/${repoPath}${anchor}`;
}

/** Markdown links / images and HTML href/src outside code blocks. */
export function convert(md, source, problems) {
  const parts = md.split(/(```[\s\S]*?```)/g);
  return parts.map((part, i) => {
    if (i % 2) return part; // fenced code: leave untouched
    return part
      .replace(/(!?)\[([^\]]*)\]\(([^)\s]+)((?:\s+"[^"]*")?)\)/g,
        (_m, bang, text, target, title) => `${bang}[${text}](${rewrite(target, source, !!bang, problems)}${title})`)
      .replace(/\b(href|src)="([^"]+)"/g, (_m, attr, target) => `${attr}="${rewrite(target, source, attr === "src", problems)}"`);
  }).join("");
}

const HEADER = (source) =>
  `<!-- Generated from ${source} by website/scripts/sync-lessons.mjs - edit the source, then run npm run sync:lessons. -->\n\n`;

function main() {
  const check = process.argv.includes("--check");
  const problems = [];
  const stale = [];
  for (const [slug, source] of Object.entries(LESSON_SOURCES)) {
    const md = readFileSync(join(REPO, source), "utf8");
    const out = HEADER(source) + convert(md, source, problems);
    const file = join(OUT, `${slug}.md`);
    const current = existsSync(file) ? readFileSync(file, "utf8") : null;
    if (current === out) continue;
    if (check) stale.push(relative(WEBSITE, file));
    else writeFileSync(file, out);
  }
  problems.forEach((p) => console.error(`broken link: ${p}`));
  if (stale.length) console.error(`stale lesson copies (run npm run sync:lessons): ${stale.join(", ")}`);
  if (problems.length || stale.length) process.exit(1);
  console.log(check ? "lessons are up to date" : `synced ${Object.keys(LESSON_SOURCES).length} lessons`);
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) main();
