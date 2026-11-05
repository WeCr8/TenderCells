#!/usr/bin/env node
// prerender-seo.mjs - give every sitemap route its own static HTML head.
//
// FIX(2026-10-22): Google Search Console reported "Duplicate, Google chose different canonical
// than user" for tendercells.com. Firebase Hosting rewrote every route to dist/index.html, whose
// static head says <link rel="canonical" href="https://tendercells.com/"> and carries the home
// page title/description. usePageTracking.ts only corrected the canonical after JavaScript ran,
// so each page declared two canonicals (raw HTML: "/", rendered: itself) and Google folded them
// into the home page.
//
// After `vite build`, this writes dist/<route>.html for each route in dist/sitemap.xml (served by
// firebase.json "cleanUrls": true before the SPA rewrite), with the route's own <title>,
// description, Open Graph/Twitter tags and a self-referencing canonical. The React app still
// boots from the same bundle, so nothing else changes.
//
//   node scripts/prerender-seo.mjs           write the files (runs as part of npm run build)
//   node scripts/prerender-seo.mjs --check   verify dist/ without writing (fails on problems)
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const WEBSITE = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const DIST = join(WEBSITE, "dist");
const SITE = "https://tendercells.com";
const DEFAULT_IMAGE = `${SITE}/assets/images/products/chicken-tender-concept.png`;

const routeMeta = JSON.parse(readFileSync(join(WEBSITE, "src/data/routeMeta.json"), "utf8"));
const docTitles = Object.fromEntries(
  JSON.parse(readFileSync(join(WEBSITE, "src/data/siteDocs.json"), "utf8")).map((d) => [d.slug, d.title]),
);

/** Same rules as metaForPath() in src/hooks/usePageTracking.ts. */
export function metaForPath(path) {
  if (routeMeta.routes[path]) return routeMeta.routes[path];
  const doc = /^\/docs\/([^/]+)$/.exec(path);
  if (doc && docTitles[doc[1]]) {
    return {
      title: `${docTitles[doc[1]]} - Tender Cells Docs`,
      description: `${docTitles[doc[1]]}: Tender Cells open-source documentation for builders, classrooms and developers.`,
    };
  }
  return null;
}

const esc = (s) => s.replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

function setTag(html, re, replacement, problems, label) {
  if (!re.test(html)) {
    problems.push(`index.html has no ${label} tag to replace`);
    return html;
  }
  return html.replace(re, replacement);
}

export function headFor(template, path, meta, problems = []) {
  const canonical = `${SITE}${path}`;
  const title = esc(meta.title);
  const description = esc(meta.description);
  const image = esc(meta.image || DEFAULT_IMAGE);
  let html = template;
  html = setTag(html, /<title>[^<]*<\/title>/, `<title>${title}</title>`, problems, "<title>");
  html = setTag(html, /<meta name="description" content="[^"]*" \/>/, `<meta name="description" content="${description}" />`, problems, "description");
  html = setTag(html, /<link rel="canonical" href="[^"]*" \/>/, `<link rel="canonical" href="${canonical}" />`, problems, "canonical");
  html = setTag(html, /<meta property="og:title" content="[^"]*" \/>/, `<meta property="og:title" content="${title}" />`, problems, "og:title");
  html = setTag(html, /<meta property="og:description" content="[^"]*" \/>/, `<meta property="og:description" content="${description}" />`, problems, "og:description");
  html = setTag(html, /<meta property="og:url" content="[^"]*" \/>/, `<meta property="og:url" content="${canonical}" />`, problems, "og:url");
  html = setTag(html, /<meta property="og:image" content="[^"]*" \/>/, `<meta property="og:image" content="${image}" />`, problems, "og:image");
  html = setTag(html, /<meta name="twitter:title" content="[^"]*" \/>/, `<meta name="twitter:title" content="${title}" />`, problems, "twitter:title");
  html = setTag(html, /<meta name="twitter:description" content="[^"]*" \/>/, `<meta name="twitter:description" content="${description}" />`, problems, "twitter:description");
  html = setTag(html, /<meta name="twitter:image" content="[^"]*" \/>/, `<meta name="twitter:image" content="${image}" />`, problems, "twitter:image");
  if (path.startsWith("/shop/")) html = html.replace('<meta property="og:type" content="website" />', '<meta property="og:type" content="product" />');
  return html;
}

/** Sitemap routes the React site renders (not /app/**, not files such as .json). */
export function spaRoutes(sitemapXml) {
  return [...sitemapXml.matchAll(/<loc>([^<]+)<\/loc>/g)]
    .map((m) => m[1].trim())
    .filter((u) => u.startsWith(SITE))
    .map((u) => u.slice(SITE.length) || "/")
    .filter((p) => !p.startsWith("/app/") && p !== "/app" && !/\.[a-z0-9]+$/i.test(p));
}

function main() {
  const check = process.argv.includes("--check");
  const problems = [];
  const templatePath = join(DIST, "index.html");
  if (!existsSync(templatePath)) throw new Error(`Missing ${templatePath}; run vite build first.`);
  const template = readFileSync(templatePath, "utf8");
  const routes = spaRoutes(readFileSync(join(DIST, "sitemap.xml"), "utf8"));
  let written = 0;
  for (const path of routes) {
    const meta = metaForPath(path);
    if (!meta) {
      problems.push(`${path}: in sitemap.xml but has no entry in src/data/routeMeta.json`);
      continue;
    }
    // Hosting serves <dir>/index.html for /<dir> before <dir>.html, so a route named
    // /<dir>/index would hijack /<dir> (this happened with /docs/index -> renamed /docs/all).
    if (path !== "/" && path.endsWith("/index")) {
      problems.push(`${path}: a route ending in /index would be served for ${path.slice(0, -6) || "/"}; rename it`);
      continue;
    }
    // "/" keeps dist/index.html (also the SPA fallback); only its head values are refreshed.
    const file = path === "/" ? templatePath : join(DIST, `${path.slice(1)}.html`);
    const html = headFor(template, path, meta, problems);
    if (check) {
      const current = existsSync(file) ? readFileSync(file, "utf8") : "";
      if (!current.includes(`<link rel="canonical" href="${SITE}${path}" />`)) problems.push(`${path}: ${file} missing or wrong canonical`);
      continue;
    }
    if (path !== "/" && existsSync(file) && !readFileSync(file, "utf8").includes('id="root"')) {
      problems.push(`${path}: refusing to overwrite non-app file ${file}`);
      continue;
    }
    mkdirSync(dirname(file), { recursive: true });
    writeFileSync(file, html);
    written++;
  }
  if (problems.length) {
    console.error(`prerender-seo: ${problems.length} problem(s):\n  ${[...new Set(problems)].join("\n  ")}`);
    process.exit(1);
  }
  console.log(check ? `prerender-seo: ${routes.length} routes OK` : `prerender-seo: wrote ${written} route heads into dist/`);
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) main();
