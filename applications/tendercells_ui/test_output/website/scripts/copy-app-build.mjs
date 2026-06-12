import { cp, mkdir, rm } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const websiteRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const repoRoot = resolve(websiteRoot, "../../../..");
const appDist = resolve(repoRoot, "applications/tendercells_ui/test_output/tendercells-ui/dist");
const websiteDist = resolve(websiteRoot, "dist");
const target = resolve(websiteDist, "app");

if (!target.startsWith(websiteDist)) {
  throw new Error(`Refusing to write outside website dist: ${target}`);
}

await rm(target, { recursive: true, force: true });
await mkdir(target, { recursive: true });
await cp(appDist, target, { recursive: true });

console.log(`Copied app build into ${target}`);
