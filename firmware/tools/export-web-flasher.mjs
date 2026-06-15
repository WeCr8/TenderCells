#!/usr/bin/env node
/**
 * export-web-flasher.mjs
 *
 * Copies the four ESP32 flash artifacts produced by `pio run` into the website's
 * public/flash tree so the browser-based ESP Web Tools flasher can serve them.
 *
 * The ESP Web Tools manifest (manifest-chicken-tender.json) references these four
 * parts at fixed offsets: bootloader 0x1000, partitions 0x8000, boot_app0 0xe000,
 * firmware 0x10000. boot_app0.bin lives in the Arduino-ESP32 framework package, not
 * the build dir, so we resolve it from the PlatformIO packages folder.
 *
 * Usage:
 *   cd firmware/chicken-tender && pio run        # build first
 *   node ../tools/export-web-flasher.mjs         # then export
 */
import { existsSync, mkdirSync, copyFileSync, statSync } from "node:fs";
import { homedir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const repoRoot = resolve(__dirname, "..", "..");

const BUILD_DIR = join(
  repoRoot,
  "firmware/chicken-tender/.pio/build/esp32-wroom-32"
);
const BOOT_APP0 = join(
  homedir(),
  ".platformio/packages/framework-arduinoespressif32/tools/partitions/boot_app0.bin"
);
const DEST_DIR = join(
  repoRoot,
  "applications/tendercells_ui/test_output/website/public/flash/firmware/chicken-tender"
);

const artifacts = [
  { src: join(BUILD_DIR, "bootloader.bin"), name: "bootloader.bin" },
  { src: join(BUILD_DIR, "partitions.bin"), name: "partitions.bin" },
  { src: BOOT_APP0, name: "boot_app0.bin" },
  { src: join(BUILD_DIR, "firmware.bin"), name: "firmware.bin" },
];

const missing = artifacts.filter((a) => !existsSync(a.src));
if (missing.length) {
  console.error("✗ Missing build artifacts — run `pio run` first:");
  for (const m of missing) console.error("   " + m.src);
  process.exit(1);
}

mkdirSync(DEST_DIR, { recursive: true });

for (const a of artifacts) {
  const dest = join(DEST_DIR, a.name);
  copyFileSync(a.src, dest);
  const kb = (statSync(dest).size / 1024).toFixed(1);
  console.log(`  ✓ ${a.name.padEnd(16)} ${kb} KB`);
}

console.log("\n✓ Web flasher binaries exported to public/flash/firmware/chicken-tender/");
