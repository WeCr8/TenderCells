#!/usr/bin/env node
// sync-docs.mjs - publish the repo's lessons and docs as pages on tendercells.com, so people
// read the current build instructions on the site instead of being sent to GitHub.
//
//   lessons   LESSON_SOURCES            -> public/lessons/<slug>.md   (/lessons/<slug>)
//   docs      src/data/siteDocs.json    -> public/docs/<slug>.md      (/docs/<slug>)
//   sitemap   both lists                -> the generated block in public/sitemap.xml
//
// Links are rewritten while copying:
//   a lesson or published doc                       -> /lessons/<slug> or /docs/<slug>
//   a folder whose README.md is a published doc     -> that doc
//   a doc with its own site page (camera node)      -> that page
//   our own domains (incl. the old Firebase one)    -> a site path
//   a file the website serves (website/public/...)  -> its live URL
//   anything else in the repo (source code, CAD)    -> GitHub (the only case that leaves the site)
//   images in the repo                              -> raw.githubusercontent.com
//
//   node scripts/sync-docs.mjs          write the copies + sitemap block
//   node scripts/sync-docs.mjs --check  fail if a copy is stale or a link cannot be resolved (CI)
import { existsSync, readFileSync, statSync, writeFileSync } from "node:fs";
import { dirname, join, posix, relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const HERE = dirname(fileURLToPath(import.meta.url));
const WEBSITE = resolve(HERE, "..");
const REPO = resolve(WEBSITE, "../../../..");
const GITHUB = "https://github.com/WeCr8/TenderCells";
const RAW = "https://raw.githubusercontent.com/WeCr8/TenderCells/main";
const SITE = "https://tendercells.com";

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
export const SITE_DOCS = JSON.parse(readFileSync(join(WEBSITE, "src/data/siteDocs.json"), "utf8"));

// Repo docs that have their own hand-made page on the site.
const SITE_PAGES = { "docs/CAMERA_NODE_FIRST_BUILD.md": "/guides/camera-node-first-build" };

const PAGE_BY_SOURCE = {
  ...Object.fromEntries(Object.entries(LESSON_SOURCES).map(([slug, src]) => [src, `/lessons/${slug}`])),
  ...Object.fromEntries(SITE_DOCS.map((d) => [d.source, `/docs/${d.slug}`])),
  ...SITE_PAGES,
};

/** The site page for a repo path: a lesson, a published doc, a folder's README, or a file the website serves. */
function sitePathFor(repoPath) {
  const page = PAGE_BY_SOURCE[repoPath] ?? PAGE_BY_SOURCE[`${repoPath}/README.md`];
  if (page) return page;
  const pub = /^applications\/tendercells_ui\/test_output\/website\/public\/(.*)$/.exec(repoPath);
  if (pub && existsSync(join(REPO, repoPath))) return `/${pub[1].replace(/(^|\/)index\.html$/, "")}`;
  return null;
}

/** Rewrite one link target found in `source` (repo-relative path of the page). */
function rewrite(target, source, image, problems) {
  const own = /^https?:\/\/(?:www\.)?(?:tendercells\.com|tender-cells\.web\.app|tender-cells\.firebaseapp\.com)(\/[^\s]*)?$/.exec(target);
  if (own) return own[1] || "/";
  // Absolute GitHub links to a published doc also stay on the site.
  const gh = /^https:\/\/github\.com\/WeCr8\/TenderCells\/(?:blob|tree)\/main\/([^#?]+)(#.*)?$/i.exec(target);
  if (gh && !image) {
    const page = sitePathFor(gh[1].replace(/\/$/, ""));
    if (page) return `${page}${gh[2] ?? ""}`;
  }
  if (/^(https?:|mailto:|tel:|#|\/)/.test(target)) return target;
  const [pathPart, hash = ""] = target.split("#");
  const repoPath = posix.normalize(posix.join(posix.dirname(source), decodeURIComponent(pathPart))).replace(/\/$/, "");
  const anchor = hash ? `#${hash}` : "";
  const page = sitePathFor(repoPath);
  if (page && !image) return `${page}${anchor}`;
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
  `<!-- Generated from ${source} by website/scripts/sync-docs.mjs - edit the source, then run npm run sync:docs. -->\n\n`;

const SITEMAP_START = "  <!-- generated:docs start (scripts/sync-docs.mjs) -->";
const SITEMAP_END = "  <!-- generated:docs end -->";

function sitemapWith(xml) {
  const urls = [
    "/docs", "/lessons",
    ...Object.keys(LESSON_SOURCES).map((s) => `/lessons/${s}`),
    ...SITE_DOCS.map((d) => `/docs/${d.slug}`),
  ].map((p) => `  <url><loc>${SITE}${p}</loc><changefreq>weekly</changefreq><priority>0.7</priority></url>`);
  const block = [SITEMAP_START, ...urls, SITEMAP_END].join("\n");
  const re = new RegExp(`${SITEMAP_START.trim().replace(/[()]/g, "\\$&")}[\\s\\S]*?${SITEMAP_END.trim()}`);
  if (re.test(xml)) return xml.replace(new RegExp(`  ${re.source}`), block);
  return xml.replace("</urlset>", `${block}\n</urlset>`);
}

function main() {
  const check = process.argv.includes("--check");
  const problems = [];
  const stale = [];
  const write = (file, out) => {
    const current = existsSync(file) ? readFileSync(file, "utf8") : null;
    if (current === out) return;
    if (check) stale.push(relative(WEBSITE, file));
    else writeFileSync(file, out);
  };
  const pages = [
    ...Object.entries(LESSON_SOURCES).map(([slug, source]) => ({ file: join(WEBSITE, "public/lessons", `${slug}.md`), source })),
    ...SITE_DOCS.map((d) => ({ file: join(WEBSITE, "public/docs", `${d.slug}.md`), source: d.source })),
  ];
  for (const { file, source } of pages) {
    write(file, HEADER(source) + convert(readFileSync(join(REPO, source), "utf8"), source, problems));
  }
  const sitemap = join(WEBSITE, "public/sitemap.xml");
  write(sitemap, sitemapWith(readFileSync(sitemap, "utf8")));

  problems.forEach((p) => console.error(`broken link: ${p}`));
  if (stale.length) console.error(`stale copies (run npm run sync:docs): ${stale.join(", ")}`);
  if (problems.length || stale.length) process.exit(1);
  console.log(check ? "lessons and docs are up to date" : `synced ${pages.length} pages`);
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) main();
