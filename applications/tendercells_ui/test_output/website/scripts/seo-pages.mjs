#!/usr/bin/env node
// seo-pages.mjs - give every public page its own <head> in the HTML the server sends.
//
// The site is a single-page app: Firebase Hosting rewrites every path to /index.html, so
// before this script every URL was served the home page's title, description and
// <link rel="canonical" href="https://tendercells.com/">. React fixed the tags only after
// JavaScript ran, and Google reported "Duplicate, Google chose different canonical than user"
// (Search Console, Oct 2026: /library/animals/pig was folded into /assistants).
//
//   node scripts/seo-pages.mjs prerender        after `vite build`: write dist/<route>/index.html
//                                               for every page in src/seo/routeMeta.ts, with its
//                                               own title, description, og/twitter tags and a
//                                               self-referencing canonical (Firebase serves a
//                                               directory's index.html before the SPA rewrite)
//   node scripts/seo-pages.mjs sitemap          rewrite the generated:library block of
//                                               public/sitemap.xml from the shared library data
//   node scripts/seo-pages.mjs sitemap --check  fail if that block is stale (CI)
//
// The metadata comes from src/seo/routeMeta.ts - the same module the browser uses - loaded
// through Vite so its TypeScript and JSON imports resolve exactly as in the app.
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { createServer } from "vite";

const WEBSITE = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const DIST = join(WEBSITE, "dist");
const SITEMAP = join(WEBSITE, "public/sitemap.xml");

async function loadRouteMeta() {
  const server = await createServer({
    root: WEBSITE,
    configFile: join(WEBSITE, "vite.config.ts"),
    logLevel: "error",
    appType: "custom",
    server: { middlewareMode: true, hmr: false, watch: null },
    optimizeDeps: { noDiscovery: true, include: [] },
  });
  try {
    return await server.ssrLoadModule("/src/seo/routeMeta.ts");
  } finally {
    await server.close();
  }
}

const esc = (s) => s.replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

/** Replace (or insert before </head>) one tag matched by `re`. Fails loudly if it matches twice. */
function setTag(html, re, tag) {
  const hits = html.match(new RegExp(re.source, "gi")) ?? [];
  if (hits.length > 1) throw new Error(`template has ${hits.length} tags matching ${re}`);
  return hits.length ? html.replace(new RegExp(re.source, "i"), tag) : html.replace("</head>", `    ${tag}\n  </head>`);
}

export function headFor(template, { title, description, image, canonical, type, noindex }) {
  let html = template;
  html = setTag(html, /<title>[^<]*<\/title>/, `<title>${esc(title)}</title>`);
  html = setTag(html, /<meta name="description" content="[^"]*"\s*\/?>/, `<meta name="description" content="${esc(description)}" />`);
  html = setTag(html, /<link rel="canonical" href="[^"]*"\s*\/?>/, `<link rel="canonical" href="${esc(canonical)}" />`);
  html = setTag(html, /<meta property="og:type" content="[^"]*"\s*\/?>/, `<meta property="og:type" content="${type}" />`);
  html = setTag(html, /<meta property="og:title" content="[^"]*"\s*\/?>/, `<meta property="og:title" content="${esc(title)}" />`);
  html = setTag(html, /<meta property="og:description" content="[^"]*"\s*\/?>/, `<meta property="og:description" content="${esc(description)}" />`);
  html = setTag(html, /<meta property="og:url" content="[^"]*"\s*\/?>/, `<meta property="og:url" content="${esc(canonical)}" />`);
  html = setTag(html, /<meta property="og:image" content="[^"]*"\s*\/?>/, `<meta property="og:image" content="${esc(image)}" />`);
  html = setTag(html, /<meta name="twitter:title" content="[^"]*"\s*\/?>/, `<meta name="twitter:title" content="${esc(title)}" />`);
  html = setTag(html, /<meta name="twitter:description" content="[^"]*"\s*\/?>/, `<meta name="twitter:description" content="${esc(description)}" />`);
  html = setTag(html, /<meta name="twitter:image" content="[^"]*"\s*\/?>/, `<meta name="twitter:image" content="${esc(image)}" />`);
  if (noindex) html = setTag(html, /<meta name="robots" content="[^"]*"\s*\/?>/, `<meta name="robots" content="noindex, follow" />`);
  return html;
}

async function prerender() {
  const templatePath = join(DIST, "index.html");
  if (!existsSync(templatePath)) throw new Error("dist/index.html not found - run vite build first");
  const template = readFileSync(templatePath, "utf8");
  const rm = await loadRouteMeta();
  let written = 0;
  for (const path of rm.prerenderPaths()) {
    const meta = rm.metaFor(path);
    if (!meta) throw new Error(`no metadata for ${path}`);
    const out = path === "/" ? templatePath : join(DIST, path.slice(1), "index.html");
    // Never shadow a real static page (e.g. /flash, /viewer ship their own index.html).
    if (path !== "/" && (existsSync(out) || existsSync(join(DIST, `${path.slice(1)}.html`)))) {
      throw new Error(`${path}: dist already has a static page there; remove it from routeMeta or the static file`);
    }
    const html = headFor(template, {
      title: meta.title,
      description: meta.description,
      image: meta.image || rm.DEFAULT_IMAGE,
      canonical: rm.canonicalFor(path),
      type: path.startsWith("/shop/") ? "product" : "website",
      noindex: rm.NOINDEX_PATHS.includes(path),
    });
    mkdirSync(dirname(out), { recursive: true });
    writeFileSync(out, html);
    written++;
  }
  console.log(`seo-pages: wrote head tags for ${written} pages into dist/`);
}

const LIB_START = "  <!-- generated:library start (scripts/seo-pages.mjs) -->";
const LIB_END = "  <!-- generated:library end -->";

async function sitemap(check) {
  const rm = await loadRouteMeta();
  const block = [
    LIB_START,
    ...rm.libraryPaths().map((p) => `  <url><loc>${rm.SITE}${p}</loc><changefreq>monthly</changefreq><priority>0.6</priority></url>`),
    LIB_END,
  ].join("\n");
  const xml = readFileSync(SITEMAP, "utf8");
  const s = xml.indexOf(LIB_START);
  const e = xml.indexOf(LIB_END);
  const next = s >= 0 && e > s
    ? xml.slice(0, s) + block + xml.slice(e + LIB_END.length)
    : xml.replace("</urlset>", `${block}\n</urlset>`);
  if (check) {
    if (next !== xml) {
      console.error("public/sitemap.xml library block is stale - run: node scripts/seo-pages.mjs sitemap");
      process.exit(1);
    }
    console.log(`seo-pages: sitemap library block up to date (${rm.libraryPaths().length} pages)`);
    return;
  }
  writeFileSync(SITEMAP, next);
  console.log(`seo-pages: sitemap library block has ${rm.libraryPaths().length} pages`);
}

const [cmd, flag] = process.argv.slice(2);
if (cmd === "prerender") await prerender();
else if (cmd === "sitemap") await sitemap(flag === "--check");
else {
  console.error("usage: seo-pages.mjs prerender | sitemap [--check]");
  process.exit(2);
}
