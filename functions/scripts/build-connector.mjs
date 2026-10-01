// build-connector.mjs - bundle the hosted Tender Cells connector (MCP + OAuth, source in
// applications/tendercells_ui/test_output/express-api/backend/src/mcp/) into
// lib/connector/index.js, plus its prebuilt farm card (lib/connector/farm-card.html).
// Dependencies resolve from this package's node_modules (devDependencies), so deploy and
// CI only need `npm ci` here. Runs after `tsc` in `npm run build`.
import { build } from "esbuild";
import { mkdirSync, rmSync, writeFileSync } from "node:fs";
import { createRequire } from "node:module";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const root = resolve(here, "..");
const mcpSrc = resolve(root, "../applications/tendercells_ui/test_output/express-api/backend/src/mcp");
const viewDir = resolve(root, "../applications/tendercells_ui/test_output/express-api/mcp-view");
const out = join(root, "lib/connector");
const nodePaths = [join(root, "node_modules")];
// The sources are ESM (import.meta.url); the function is CommonJS.
const cjsShim = {
  define: { "import.meta.url": "__tc_import_meta_url" },
  banner: { js: "const __tc_import_meta_url = require('url').pathToFileURL(__filename).href;" },
};

mkdirSync(out, { recursive: true });
await build({
  entryPoints: [join(mcpSrc, "connector.ts")], outfile: join(out, "index.js"),
  bundle: true, platform: "node", target: "node22", format: "cjs", minify: true, legalComments: "none",
  nodePaths, external: ["esbuild", "firebase-admin"], ...cjsShim, logLevel: "warning",
});

// Prebuild the farm card with the same code the server uses (farmCard.ts → buildFarmCard).
const helper = join(out, "farm-card-build.cjs");
await build({
  entryPoints: [join(mcpSrc, "farmCard.ts")], outfile: helper,
  bundle: true, platform: "node", target: "node22", format: "cjs", nodePaths, external: ["esbuild"], ...cjsShim, logLevel: "warning",
});
const { buildFarmCard } = createRequire(import.meta.url)(helper);
writeFileSync(join(out, "farm-card.html"), await buildFarmCard(viewDir, nodePaths));
rmSync(helper);
console.log("connector bundle → lib/connector/ (index.js, farm-card.html)");
