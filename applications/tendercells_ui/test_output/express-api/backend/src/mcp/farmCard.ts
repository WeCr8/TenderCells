// farmCard.ts - the farm card HTML (an MCP Apps view), served as ui://tendercells/farm-card.html.
// Built from mcp-view/ the first time it is asked for (esbuild, about 50 ms) and cached, so no
// bundled blob lives in the repo. A packaged server (the Claude Desktop extension) ships a
// prebuilt farm-card.html next to its bundle instead; that file wins when present.
import { existsSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const HERE = dirname(fileURLToPath(import.meta.url));
const VIEW_DIR = join(HERE, "../../../mcp-view");
let cached: Promise<string> | undefined;

/**
 * Build the farm card into one self-contained HTML page (script and styles inline).
 *
 * @param viewDir   - Folder holding farm-card.ts and farm-card.css
 * @param nodePaths - Extra module folders (the Firebase Function build resolves from its own)
 * @returns The HTML page
 */
export async function buildFarmCard(viewDir = VIEW_DIR, nodePaths: string[] = []): Promise<string> {
  const { build } = await import("esbuild");
  const js = await build({
    entryPoints: [join(viewDir, "farm-card.ts")], bundle: true, minify: true, format: "iife",
    platform: "browser", target: "es2020", write: false, legalComments: "none", nodePaths,
  });
  const css = readFileSync(join(viewDir, "farm-card.css"), "utf8");
  const script = js.outputFiles[0].text.replace(/<\/script/gi, "<\\/script");
  return `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>Tender Cells farm</title><style>${css}</style></head><body><div id="root"></div><script>${script}</script></body></html>`;
}

/** The farm card HTML: a prebuilt farm-card.html beside this module, else built once from source. */
export function farmCardHtml(): Promise<string> {
  const prebuilt = join(HERE, "farm-card.html");
  if (existsSync(prebuilt)) return Promise.resolve(readFileSync(prebuilt, "utf8"));
  cached ??= buildFarmCard().catch((err) => {
    cached = undefined;
    return `<!doctype html><html><body><p>Farm card unavailable: ${String((err as Error).message).replace(/</g, "&lt;")}</p></body></html>`;
  });
  return cached;
}
