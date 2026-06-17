#!/usr/bin/env node
/**
 * export-web-flasher.mjs
 *
 * Copies the ESP32 flash artifacts produced by `pio run` into the website's
 * public/flash tree so the browser-based ESP Web Tools flasher can serve them.
 *
 * boot_app0.bin lives in the Arduino-ESP32 framework package, not the build dir,
 * so we resolve it from the PlatformIO packages folder.
 *
 * Note on offsets: the ESP Web Tools manifest carries the per-chip flash offsets,
 * not this script. The original ESP32 puts its bootloader at 0x1000; the S3/C3/C6
 * put it at 0x0 — make sure each manifest matches its chip.
 *
 * Usage:
 *   node firmware/tools/export-web-flasher.mjs                # all known targets
 *   node firmware/tools/export-web-flasher.mjs chicken-tender # one target
 */
import { existsSync, mkdirSync, copyFileSync, statSync } from "node:fs";
import { homedir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const repoRoot = resolve(__dirname, "..", "..");

const BOOT_APP0 = join(
  homedir(),
  ".platformio/packages/framework-arduinoespressif32/tools/partitions/boot_app0.bin"
);

const WEB_FLASH = join(
  repoRoot,
  "applications/tendercells_ui/test_output/website/public/flash/firmware"
);

// Each target: firmware dir, PlatformIO env (build subdir), and the web dest folder.
const TARGETS = {
  "chicken-tender": { env: "esp32-wroom-32",      dir: "chicken-tender" },
  "starter-node":   { env: "xiao-esp32s3",        dir: "starter-node" },
  "watchtower-cam": { env: "xiao-esp32s3-sense",  dir: "watchtower-cam" },
};

function exportTarget(name) {
  const t = TARGETS[name];
  if (!t) {
    console.error(`✗ Unknown target "${name}". Known: ${Object.keys(TARGETS).join(", ")}`);
    process.exitCode = 1;
    return;
  }
  const buildDir = join(repoRoot, `firmware/${name}/.pio/build/${t.env}`);
  const destDir = join(WEB_FLASH, t.dir);

  const artifacts = [
    { src: join(buildDir, "bootloader.bin"), name: "bootloader.bin" },
    { src: join(buildDir, "partitions.bin"), name: "partitions.bin" },
    { src: BOOT_APP0, name: "boot_app0.bin" },
    { src: join(buildDir, "firmware.bin"), name: "firmware.bin" },
  ];

  const missing = artifacts.filter((a) => !existsSync(a.src));
  if (missing.length) {
    console.error(`✗ [${name}] missing artifacts — run \`pio run\` in firmware/${name} first:`);
    for (const m of missing) console.error("   " + m.src);
    process.exitCode = 1;
    return;
  }

  mkdirSync(destDir, { recursive: true });
  console.log(`\n[${name}] → ${t.dir}/`);
  for (const a of artifacts) {
    const dest = join(destDir, a.name);
    copyFileSync(a.src, dest);
    const kb = (statSync(dest).size / 1024).toFixed(1);
    console.log(`  ✓ ${a.name.padEnd(16)} ${kb} KB`);
  }
}

const arg = process.argv[2];
const targets = arg ? [arg] : Object.keys(TARGETS);
for (const name of targets) {
  // Skip targets that haven't been built yet when exporting "all".
  if (!arg) {
    const t = TARGETS[name];
    const fw = join(repoRoot, `firmware/${name}/.pio/build/${t.env}/firmware.bin`);
    if (!existsSync(fw)) {
      console.log(`\n[${name}] not built yet — skipping`);
      continue;
    }
  }
  exportTarget(name);
}

if (!process.exitCode) console.log("\n✓ Web flasher binaries exported.");
