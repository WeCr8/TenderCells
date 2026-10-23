#!/usr/bin/env node
// check-canonicals.mjs - after the build, prove every page Google can index declares itself.
// Guards the Oct 2026 Search Console issue "Duplicate, Google chose different canonical than
// user": every route used to be served the home page's HTML with canonical = home.
//
// For every <loc> in public/sitemap.xml that is a website page (not /app/*, not a .json/.xml
// file), the HTML Firebase Hosting would serve for it (dist/<path>/index.html, dist/<path>.html,
// or dist/index.html for "/") must:
//   - exist (no falling through to the SPA rewrite and the home page's tags),
//   - have exactly one <link rel="canonical">, equal to the sitemap URL itself,
//   - have og:url equal to that canonical, and no robots noindex,
//   - have a title used by no other sitemap page.
// The sitemap may not list a URL that redirects (".html" - cleanUrls 301s those) or a page
// whose canonical points elsewhere. Every other built route page must have exactly one
// canonical pointing at a page in the sitemap, or be noindex.
//
//   node scripts/check-canonicals.mjs        (run after `npm run build`)
import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import { join, relative, resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const WEBSITE = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const DIST = join(WEBSITE, "dist");
const SITE = "https://tendercells.com";
// Static folders that ship their own hand-written HTML (not SPA routes).
const STATIC_HTML = [/^app\//, /^flash\//, /^viewer\//, /^api\//, /^assets\//, /^brand\//];

const errors = [];
const fail = (m) => errors.push(m);

if (!existsSync(join(DIST, "index.html"))) {
  console.error("check-canonicals: dist/index.html missing - run `npm run build` first");
  process.exit(1);
}

const sitemap = readFileSync(join(WEBSITE, "public/sitemap.xml"), "utf8");
const locs = [...sitemap.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1].trim());

const servedFile = (path) => {
  if (path === "/") return join(DIST, "index.html");
  const rel = path.slice(1);
  for (const f of [join(DIST, rel, "index.html"), join(DIST, `${rel}.html`)]) if (existsSync(f)) return f;
  return null;
};

const headOf = (html) => {
  const canon = [...html.matchAll(/<link\b[^>]*rel=["']?canonical["']?[^>]*>/gi)].map((m) => (m[0].match(/href=["']([^"']+)["']/i) || [])[1]);
  const ogUrl = (html.match(/<meta property="og:url" content="([^"]*)"/i) || [])[1];
  const title = (html.match(/<title>([^<]*)<\/title>/i) || [])[1];
  const noindex = /<meta name="robots" content="[^"]*noindex/i.test(html);
  return { canon, ogUrl, title, noindex };
};

const seenLoc = new Set();
const titles = new Map();
let pages = 0;
for (const loc of locs) {
  if (seenLoc.has(loc)) fail(`sitemap lists ${loc} twice`);
  seenLoc.add(loc);
  if (!loc.startsWith(`${SITE}/`)) { fail(`sitemap URL not on ${SITE}/: ${loc}`); continue; }
  const path = loc.slice(SITE.length) || "/";
  if (/[?#]/.test(path)) fail(`sitemap URL has a query or fragment: ${loc}`);
  if (path.length > 1 && path.endsWith("/")) fail(`sitemap URL has a trailing slash (trailingSlash:false redirects it): ${loc}`);
  if (path.endsWith(".html")) fail(`sitemap URL ends in .html (cleanUrls 301s it): ${loc}`);
  if (path.startsWith("/app/") || /\.(json|xml|txt|md)$/.test(path)) continue; // the OS app and data files
  pages++;
  const file = servedFile(path);
  if (!file) { fail(`${path}: no built page in dist/ - it would be served the home page's tags`); continue; }
  const h = headOf(readFileSync(file, "utf8"));
  if (h.canon.length !== 1) fail(`${path}: ${h.canon.length} canonical tags (want exactly 1)`);
  else if (h.canon[0] !== loc) fail(`${path}: canonical ${h.canon[0]} is not the sitemap URL ${loc}`);
  if (h.ogUrl !== loc) fail(`${path}: og:url ${h.ogUrl} is not ${loc}`);
  if (h.noindex) fail(`${path}: listed in the sitemap but served noindex`);
  if (!h.title) fail(`${path}: no <title>`);
  else if (titles.has(h.title)) fail(`${path}: same <title> as ${titles.get(h.title)} ("${h.title}")`);
  else titles.set(h.title, path);
}

// Every other built route page: one canonical, pointing at a sitemap page (or noindex).
const walk = (dir) => readdirSync(dir).flatMap((f) => {
  const p = join(dir, f);
  return statSync(p).isDirectory() ? walk(p) : [p];
});
let others = 0;
for (const file of walk(DIST).filter((f) => f.endsWith("index.html"))) {
  const rel = relative(DIST, file).replace(/\\/g, "/");
  if (STATIC_HTML.some((re) => re.test(rel))) continue;
  const path = rel === "index.html" ? "/" : `/${rel.replace(/\/index\.html$/, "")}`;
  if (seenLoc.has(`${SITE}${path === "/" ? "/" : path}`)) continue;
  others++;
  const h = headOf(readFileSync(file, "utf8"));
  if (h.canon.length !== 1) { fail(`${path}: ${h.canon.length} canonical tags (want exactly 1)`); continue; }
  if (h.noindex) continue;
  if (!seenLoc.has(h.canon[0])) fail(`${path}: canonical ${h.canon[0]} is neither itself in the sitemap nor a sitemap page - add it to the sitemap or mark it noindex`);
}

if (errors.length) {
  console.error(`check-canonicals: ${errors.length} problem(s)\n  - ${errors.join("\n  - ")}`);
  process.exit(1);
}
console.log(`check-canonicals: OK - ${pages} sitemap pages each have one self-referencing canonical and a unique title; ${others} other built pages point at sitemap pages or are noindex`);
