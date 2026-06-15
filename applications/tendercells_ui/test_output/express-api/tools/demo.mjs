#!/usr/bin/env node
// demo.mjs — one command to see the whole platform work.
//
// Boots the API + embedded MQTT broker, waits for it to be healthy, then starts a
// virtual coop publishing live data. Built so a teacher or a kid can run a single
// command and immediately have a working system to poke at with `tc` or a browser.
//
//   npm run demo
//
// By default it binds to the LAN (HOST=0.0.0.0) so a phone or a second laptop at a
// science fair can open the printed URL. Set LOCAL=1 to keep it loopback-only.
//
//   PORT=4100 npm run demo        # different API port
//   LOCAL=1   npm run demo        # do not expose on the network

import { spawn } from "node:child_process";
import process from "node:process";

const PORT = process.env.PORT || "4000";
const HOST = process.env.LOCAL === "1" ? "127.0.0.1" : "0.0.0.0";
const DEVICE = process.env.DEVICE_ID || "demo_coop";
const api = `http://localhost:${PORT}`;

const children = [];
function start(name, args, color) {
  const child = spawn("npm", args, {
    shell: true,
    env: { ...process.env, HOST, PORT },
  });
  const tag = `\x1b[${color}m[${name}]\x1b[0m`;
  child.stdout.on("data", (d) => process.stdout.write(prefix(tag, d)));
  child.stderr.on("data", (d) => process.stderr.write(prefix(tag, d)));
  child.on("exit", (code) => {
    console.log(`${tag} exited (${code}). Shutting down.`);
    shutdown();
  });
  children.push(child);
  return child;
}
function prefix(tag, buf) {
  return buf
    .toString()
    .split("\n")
    .filter((l, i, a) => l.length || i < a.length - 1)
    .map((l) => `${tag} ${l}`)
    .join("\n") + "\n";
}
function shutdown() {
  for (const c of children) { try { c.kill(); } catch { /* already gone */ } }
  process.exit(0);
}
process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);

async function waitForApi(timeoutMs = 30000) {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    try {
      const r = await fetch(`${api}/health`);
      if (r.ok) return true;
    } catch { /* not up yet */ }
    await new Promise((r) => setTimeout(r, 500));
  }
  return false;
}

console.log("Starting Tender Cells demo — API + broker + a virtual coop...\n");
start("api", ["run", "dev"], "36"); // cyan

if (!(await waitForApi())) {
  console.error("✗ API did not become healthy in time. Is the port free? Try PORT=4100 npm run demo");
  shutdown();
}

console.log(`\n✓ API healthy. Starting virtual coop "${DEVICE}"...\n`);
start("coop", ["run", "simulate", "--", "--id", DEVICE, "--interval", "3"], "33"); // yellow

console.log(`
─────────────────────────────────────────────────────────────
  Tender Cells is running.

  Dashboard / API:  ${api}
  Try it:           npm run tc -- telemetry ${DEVICE}
                    npm run tc -- door ${DEVICE} open
  Stop everything:  Ctrl+C
─────────────────────────────────────────────────────────────
`);
