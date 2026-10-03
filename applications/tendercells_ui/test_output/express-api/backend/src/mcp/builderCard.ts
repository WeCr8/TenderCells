import { existsSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = dirname(fileURLToPath(import.meta.url));
const VIEW_DIR = join(HERE, '../../../mcp-view');
let cached: Promise<string> | undefined;

export async function buildBuilderCard(viewDir = VIEW_DIR, nodePaths: string[] = []): Promise<string> {
  const { build } = await import('esbuild');
  const js = await build({
    entryPoints: [join(viewDir, 'builder-card.ts')],
    bundle: true,
    minify: true,
    format: 'iife',
    platform: 'browser',
    target: 'es2020',
    write: false,
    legalComments: 'none',
    nodePaths,
  });
  const css = readFileSync(join(viewDir, 'builder-card.css'), 'utf8');
  const script = js.outputFiles[0].text.replace(/<\/script/gi, '<\\/script');
  return `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>Tender Cells Builder</title><style>${css}</style></head><body><div id="root"></div><script>${script}</script></body></html>`;
}

export function builderCardHtml(): Promise<string> {
  const prebuilt = join(HERE, 'builder-card.html');
  if (existsSync(prebuilt)) return Promise.resolve(readFileSync(prebuilt, 'utf8'));
  cached ??= buildBuilderCard().catch((error: unknown) => {
    cached = undefined;
    throw error;
  });
  return cached;
}
