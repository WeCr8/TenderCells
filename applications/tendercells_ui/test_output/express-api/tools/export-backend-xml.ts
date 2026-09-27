// export-backend-xml.ts - write the static copy of the backend description to the website
// (served at https://tendercells.com/api/tendercells-backend.xml).
//   npm run describe:xml          write it
//   npm run describe:xml -- --check   exit 1 if the committed copy is out of date (CI)
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { buildBackendXml } from "../backend/src/describe.js";

const out = resolve(dirname(fileURLToPath(import.meta.url)), "../../website/public/api/tendercells-backend.xml");
const xml = buildBackendXml();
if (process.argv.includes("--check")) {
  let current = "";
  try { current = readFileSync(out, "utf8"); } catch { /* missing */ }
  if (current !== xml) {
    console.error(`${out} is out of date - run: npm run describe:xml`);
    process.exit(1);
  }
  console.log("backend XML is up to date");
} else {
  mkdirSync(dirname(out), { recursive: true });
  writeFileSync(out, xml);
  console.log(`wrote ${out}`);
}
