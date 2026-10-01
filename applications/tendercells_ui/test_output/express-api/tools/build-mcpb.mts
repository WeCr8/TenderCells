// build-mcpb.mts - package the Tender Cells MCP server as a Claude Desktop extension (.mcpb):
// the stdio server bundled into one file, the farm card prebuilt beside it, the manifest and
// the icon. Users double-click the .mcpb (or drag it into Claude Desktop) and fill in the
// hub URL. Output: dist/tendercells.mcpb
//   npm run mcp:pack
import { build } from "esbuild";
import { execFileSync } from "node:child_process";
import { copyFileSync, mkdirSync, rmSync, writeFileSync } from "node:fs";
import { buildFarmCard } from "../backend/src/mcp/farmCard.js";

const STAGE = "dist-mcpb";
rmSync(STAGE, { recursive: true, force: true });
mkdirSync(`${STAGE}/server`, { recursive: true });

await build({
  entryPoints: ["backend/src/mcp/stdio.ts"],
  outfile: `${STAGE}/server/index.mjs`,
  bundle: true, platform: "node", target: "node20", format: "esm", minify: true, legalComments: "none",
  external: ["esbuild"], // only used to build the card from source; the bundle ships it prebuilt
  banner: { js: "import { createRequire as __cr } from 'node:module'; const require = __cr(import.meta.url);" },
});
writeFileSync(`${STAGE}/server/farm-card.html`, await buildFarmCard("mcp-view"));
copyFileSync("mcpb/manifest.json", `${STAGE}/manifest.json`);
copyFileSync("../website/public/brand/tendercells-icon-512.png", `${STAGE}/icon.png`); // the store icon (512×512)

const mcpb = (...args: string[]) => execFileSync(process.platform === "win32" ? "npx.cmd" : "npx", ["mcpb", ...args], { stdio: "inherit" });
mcpb("validate", `${STAGE}/manifest.json`);
mkdirSync("dist", { recursive: true });
mcpb("pack", STAGE, "dist/tendercells.mcpb");
