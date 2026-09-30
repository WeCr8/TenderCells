#!/usr/bin/env node
// check-links.mjs - static link audit for the website (runs in CI, no browser needed).
//
// Every internal link written in src/ (navigation, footer, page bodies, data files) and in
// the synced lessons must land somewhere real:
//   /path            a route in src/App.tsx, a file in public/, or /flash, /viewer
//   /app/path        a route of the OS (tendercells-ui/src/routes/AppRoutes.tsx) or an OS public file
//   /path#anchor     that id exists on the target page (page source, or the lesson's headings)
//   /lessons, /docs  the generated markdown page exists (scripts/sync-docs.mjs)
//   docs.ts `doc`    that doc is published; siteDocs.json sources exist in the repo
// Dynamic links (template strings) are skipped. Exit 1 lists every broken link.
import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import { dirname, join, relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const WEBSITE = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const REPO = resolve(WEBSITE, "../../../..");
const OS = resolve(WEBSITE, "../tendercells-ui");
const SRC = join(WEBSITE, "src");

const walk = (dir) => readdirSync(dir).flatMap((f) => {
  const p = join(dir, f);
  return statSync(p).isDirectory() ? walk(p) : [p];
});
const read = (p) => readFileSync(p, "utf8");

// Same rules as src/lib/slug.ts.
const headingSlug = (t) => t.toLowerCase().replace(/[\uFE0E\uFE0F\u200D]/g, "").replace(/[^\p{L}\p{M}\p{N}\p{Pc}\- ]/gu, "").replace(/ /g, "-");
const anchorKey = (s) => headingSlug(decodeURIComponent(s)).replace(/-+/g, "-").replace(/^-|-$/g, "");

// ── routes ───────────────────────────────────────────────────────────────────
const app = read(join(SRC, "App.tsx"));
const imports = new Map(); // component -> file
for (const m of app.matchAll(/import (\w+) from "\.\/(pages\/\w+)"/g)) imports.set(m[1], m[2]);
for (const m of app.matchAll(/const (\w+) = lazy\(\(\) => import\("\.\/(pages\/\w+)"\)\)/g)) imports.set(m[1], m[2]);
const routes = [...app.matchAll(/<Route path="([^"]+)" element=\{(?:<Suspense[^>]*>)?<(\w+)/g)]
  .filter((m) => m[1] !== "*")
  .map((m) => ({ path: m[1], file: imports.get(m[2]) && join(SRC, `${imports.get(m[2])}.tsx`) }));
const osRoutes = [...read(join(OS, "src/routes/AppRoutes.tsx")).matchAll(/path="([^"]+)"/g)].map((m) => m[1]).filter((p) => p !== "*");

const toRe = (p) => new RegExp(`^${p.replace(/:[^/]+/g, "[^/]+")}/?$`);
const routeFor = (path) => routes.find((r) => toRe(r.path).test(path));

// ── anchors ──────────────────────────────────────────────────────────────────
const allSrc = walk(SRC).filter((f) => /\.(tsx?|css)$/.test(f));
const idsIn = (text) => new Set([...text.matchAll(/\bid(?:=|:\s*)["'`{]+([A-Za-z0-9_-]+)["'`}]/g)].map((m) => m[1]));
const globalIds = new Set(allSrc.flatMap((f) => [...idsIn(read(f))]));
const mdIds = (dir, slug) => {
  const f = join(WEBSITE, "public", dir, `${slug}.md`);
  if (!existsSync(f)) return null;
  const md = read(f).replace(/```[\s\S]*?```/g, "");
  return new Set([...md.matchAll(/^#{1,4}\s+(.+)$/gm)].map((m) => anchorKey(headingSlug(m[1].trim()))));
};

// Section ids a page builds at runtime (id={k}), which a text scan cannot see.
const RUNTIME_IDS = {
  "/library": ["crop", "weed", "toxic"], // LibraryPage: one section per plant kind
};

function anchorOk(path, hash, route) {
  const key = anchorKey(hash);
  if ((RUNTIME_IDS[path] ?? []).some((id) => anchorKey(id) === key)) return true;
  const md = /^\/(lessons|docs)\/([^/]+)$/.exec(path);
  if (md) return mdIds(md[1], md[2])?.has(key) ?? false;
  const own = route?.file && existsSync(route.file) ? idsIn(read(route.file)) : new Set();
  // Page sections and shared components (DocGroups, AccountPage details) define ids.
  return [...own, ...globalIds].some((id) => anchorKey(id) === key);
}

// ── checks ───────────────────────────────────────────────────────────────────
const problems = [];
const publicFile = (base, p) => {
  const f = join(base, p.replace(/^\//, ""));
  return existsSync(f) || existsSync(`${f}.html`) || existsSync(join(f, "index.html"));
};

function checkTarget(target, where) {
  if (!target.startsWith("/") || target.startsWith("//")) return;
  const [pathAndQuery, hash] = target.split("#");
  const path = pathAndQuery.split("?")[0] || "/";
  if (path.startsWith("/app/") || path === "/app") {
    const osPath = path.slice(4) || "/";
    if (!osRoutes.some((r) => toRe(r).test(osPath)) && !publicFile(join(OS, "public"), osPath)) problems.push(`${where}: ${target} - no such OS page`);
    return;
  }
  if (publicFile(join(WEBSITE, "public"), path) && path !== "/") return;
  // Markdown pages: /lessons/<slug> and /docs/<slug> must have their generated file.
  const mdPage = /^\/(lessons|docs)\/([^/]+)$/.exec(path);
  if (mdPage && !existsSync(join(WEBSITE, "public", mdPage[1], `${mdPage[2]}.md`))) { problems.push(`${where}: ${target} - no published ${mdPage[1].slice(0, -1)}`); return; }
  const route = routeFor(path);
  if (!route) { problems.push(`${where}: ${target} - no route or file`); return; }
  if (hash && !anchorOk(path, hash, route)) problems.push(`${where}: ${target} - no #${hash} on that page`);
}

// Links in source: to="/x", to: "/x", href="/x", href: "/x", navigate("/x").
for (const f of allSrc.filter((x) => /\.tsx?$/.test(x))) {
  const text = read(f);
  const rel = relative(WEBSITE, f);
  for (const m of text.matchAll(/\b(?:to|href|navigate\()\s*[=:(]?\s*["']((?:\/|#)[^"'\s]*)["']/g)) {
    let target = m[1];
    if (target.startsWith("#")) {
      // Same-page anchor: must exist in this file (or a shared component).
      const key = anchorKey(target.slice(1));
      if (target.length > 1 && ![...idsIn(text), ...globalIds].some((id) => anchorKey(id) === key)) problems.push(`${rel}: ${target} - no such id`);
      continue;
    }
    checkTarget(target, rel);
  }
}

// Demo deep links (/app/demo?next=/page, demo("/page")): the page must be an OS route the
// demo agrees to open (tendercells-ui/src/lib/demo/demoNext.ts DEMO_PAGES).
const demoPages = new Set([...read(join(OS, "src/lib/demo/demoNext.ts")).matchAll(/"([a-z0-9-]+)"/g)].map((m) => m[1]));
for (const f of allSrc.filter((x) => /\.tsx?$/.test(x))) {
  const text = read(f).replace(/\/\*[\s\S]*?\*\//g, "").replace(/^\s*\/\/.*$/gm, ""); // code only, not comments
  for (const m of text.matchAll(/(?:demo\(\s*["']|\/app\/demo\?next=)(\/[a-z0-9/-]+)/gi)) {
    const page = m[1];
    const first = page.split("/")[1];
    if (!demoPages.has(first) || !osRoutes.some((r) => toRe(r).test(page))) problems.push(`${relative(WEBSITE, f)}: demo deep link ${page} - the demo will not open that OS page`);
  }
}

// Links in the published lessons and docs (markdown): internal ones must resolve too.
for (const dir of ["lessons", "docs"]) for (const f of walk(join(WEBSITE, "public", dir)).filter((x) => x.endsWith(".md"))) {
  const md = read(f).replace(/```[\s\S]*?```/g, "");
  const slug = f.split("/").pop().replace(/\.md$/, "");
  for (const m of md.matchAll(/\]\(((?:\/|#)[^)\s]*)\)/g)) {
    const target = m[1].startsWith("#") ? `/${dir}/${slug}${m[1]}` : m[1];
    checkTarget(target, relative(WEBSITE, f));
  }
}

// Doc cards (Docs / Learn / Education) point at published docs.
for (const m of read(join(SRC, "data/docs.ts")).matchAll(/\bdoc:\s*"([^"]+)"/g)) {
  if (!existsSync(join(WEBSITE, "public/docs", `${m[1]}.md`))) problems.push(`src/data/docs.ts: doc "${m[1]}" - not published (siteDocs.json)`);
}
// Every published doc's source must still exist in the repo.
for (const d of JSON.parse(read(join(SRC, "data/siteDocs.json")))) {
  if (!existsSync(join(REPO, d.source))) problems.push(`src/data/siteDocs.json: ${d.source} - not in the repo`);
}

if (problems.length) {
  console.error(`${problems.length} broken link(s):`);
  problems.forEach((p) => console.error(`  ${p}`));
  process.exit(1);
}
console.log(`links ok: ${routes.length} routes, ${osRoutes.length} OS routes checked`);
