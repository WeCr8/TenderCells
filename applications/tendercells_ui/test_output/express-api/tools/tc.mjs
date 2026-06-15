#!/usr/bin/env node
// tc.mjs — Tender Cells device control CLI
//
// A scriptable command line over the express-api control plane. Built for advanced
// users and for AI agents: every command takes --json for machine-readable output
// and exits 0 on success / non-zero on failure, so it composes in shell pipelines,
// CI, and agent tool loops.
//
// It talks to the running API (npm run dev), which bridges to MQTT. It never touches
// Firebase — motion/sensor data stays on the local MQTT control path.
//
// Setup:
//   npm run dev                      # in one terminal (API + embedded broker)
//   node tools/tc.mjs status         # in another
//   # optional: npm link  ->  `tc status` anywhere
//
// Environment:
//   TC_API   base URL of the API   (default http://localhost:4000, or PORT)
//
// Examples:
//   tc status                        # broker + known devices
//   tc list --json                   # device ids as JSON array
//   tc telemetry sim_001             # latest sensors
//   tc watch sim_001                 # poll telemetry every 2s
//   tc door sim_001 open
//   tc feed sim_001 100              # grams
//   tc clean sim_001 start
//   tc arm sim_001 --joints 0,45,90,0,45,0 --speed 0.3
//   tc routine sim_001 egg_collection_routine
//   tc estop sim_001                 # emergency stop (QoS 2, retained at firmware)

import process from "node:process";

const PORT = process.env.PORT || 4000;
const API = (process.env.TC_API || `http://localhost:${PORT}`).replace(/\/$/, "");
const MQTT = `${API}/api/mqtt`;

const argv = process.argv.slice(2);
const wantJson = pullFlag("--json");
const cmd = argv.shift();

// ── tiny arg helpers ──────────────────────────────────────────────────────────
function pullFlag(name) {
  const i = argv.indexOf(name);
  if (i >= 0) { argv.splice(i, 1); return true; }
  return false;
}
function pullOpt(name) {
  const i = argv.indexOf(name);
  if (i >= 0 && argv[i + 1] !== undefined) {
    const v = argv[i + 1];
    argv.splice(i, 2);
    return v;
  }
  return undefined;
}

// ── output ──────────────────────────────────────────────────────────────────
function out(obj, human) {
  if (wantJson) console.log(JSON.stringify(obj));
  else if (human !== undefined) console.log(human);
  else console.log(obj);
}
function die(msg, code = 1) {
  if (wantJson) console.log(JSON.stringify({ ok: false, error: String(msg) }));
  else console.error(`✗ ${msg}`);
  process.exit(code);
}

// ── http ──────────────────────────────────────────────────────────────────────
async function call(method, path, body) {
  let res;
  try {
    res = await fetch(`${MQTT}${path}`, {
      method,
      headers: body ? { "Content-Type": "application/json" } : undefined,
      body: body ? JSON.stringify(body) : undefined,
    });
  } catch (e) {
    die(`API not reachable at ${API} — is 'npm run dev' running? (${e.message})`, 2);
  }
  let data = null;
  try { data = await res.json(); } catch { /* empty body */ }
  if (!res.ok) die(`${method} ${path} -> HTTP ${res.status}${data?.error ? `: ${data.error}` : ""}`, 1);
  return data;
}

// ── commands ────────────────────────────────────────────────────────────────
function need(name) {
  const v = argv.shift();
  if (!v) die(`missing <${name}>. Try: tc help`);
  return v;
}

async function run() {
  switch (cmd) {
    case "status": {
      const s = await call("GET", "/mqtt/status");
      out(s, `broker  ${s.broker}\nconnected  ${s.connected}\ndevices  ${(s.devices || []).join(", ") || "(none yet)"}\ntelemetry  ${s.telemetryCount}  alerts  ${s.alertsCount}`);
      break;
    }
    case "list": {
      const s = await call("GET", "/mqtt/status");
      const ids = s.devices || [];
      out(ids, ids.join("\n") || "(no devices have published yet)");
      break;
    }
    case "telemetry": {
      const id = need("deviceId");
      const t = await call("GET", `/devices/${id}/telemetry`);
      out(t, fmtTelemetry(t));
      break;
    }
    case "state": {
      const id = need("deviceId");
      const s = await call("GET", `/devices/${id}/state`);
      out(s, JSON.stringify(s.data ?? s, null, wantJson ? 0 : 2));
      break;
    }
    case "alerts": {
      const id = need("deviceId");
      const a = await call("GET", `/devices/${id}/alerts`);
      out(a, JSON.stringify(a.data ?? a, null, 2));
      break;
    }
    case "watch": {
      const id = need("deviceId");
      const every = Number(pullOpt("--interval") || 2) * 1000;
      if (!wantJson) console.log(`watching ${id} every ${every / 1000}s — Ctrl+C to stop`);
      const tick = async () => {
        try {
          const t = await call("GET", `/devices/${id}/telemetry`);
          out(t, fmtTelemetry(t));
        } catch { /* call() already exits on hard failure */ }
      };
      await tick();
      setInterval(tick, every);
      break;
    }
    case "door": {
      const id = need("deviceId");
      const state = need("open|close");
      if (!["open", "close"].includes(state)) die(`door state must be open|close, got "${state}"`);
      const r = await call("POST", `/devices/${id}/door`, { state });
      out(r, `✓ ${id} door ${state}`);
      break;
    }
    case "feed": {
      const id = need("deviceId");
      const amount = Number(need("grams"));
      if (!Number.isFinite(amount) || amount <= 0) die("feed amount must be a positive number of grams");
      const r = await call("POST", `/devices/${id}/feed`, { amount });
      out(r, `✓ ${id} feed ${amount}g`);
      break;
    }
    case "clean": {
      const id = need("deviceId");
      const action = need("start|stop");
      if (!["start", "stop"].includes(action)) die(`clean action must be start|stop, got "${action}"`);
      const r = await call("POST", `/devices/${id}/clean`, { action });
      out(r, `✓ ${id} clean ${action}`);
      break;
    }
    case "arm": {
      const id = need("deviceId");
      const jraw = pullOpt("--joints");
      if (!jraw) die("arm needs --joints a,b,c,d,e,f (6 angles)");
      const joints = jraw.split(",").map(Number);
      if (joints.length !== 6 || joints.some((n) => !Number.isFinite(n)))
        die("--joints must be exactly 6 numeric angles, comma-separated");
      const speed = Number(pullOpt("--speed") || 0.5);
      const r = await call("POST", `/devices/${id}/arm`, { joints, speed });
      out(r, `✓ ${id} arm -> [${joints.join(", ")}] @ speed ${speed}`);
      break;
    }
    case "routine": {
      const id = need("deviceId");
      const routine = need("routineName");
      const r = await call("POST", `/devices/${id}/routine`, { routine });
      out(r, `✓ ${id} routine ${routine}`);
      break;
    }
    case "estop": {
      const id = need("deviceId");
      const r = await call("POST", `/devices/${id}/estop`, {});
      out(r, `⛔ ${id} EMERGENCY STOP sent`);
      break;
    }
    case "help":
    case undefined:
    case "--help":
    case "-h":
      printHelp();
      break;
    default:
      die(`unknown command "${cmd}". Try: tc help`);
  }
}

function fmtTelemetry(t) {
  const d = t?.data;
  if (!d) return JSON.stringify(t);
  return `${t.deviceId}: ${d.temp}°F  ${d.humidity}%RH  NH3 ${d.ammonia}  feed ${d.feedLevel}%  water ${d.waterLevel}%  chickens ${d.chickenCount}  door ${d.doorState}`;
}

function printHelp() {
  console.log(`tc — Tender Cells device control CLI   (API: ${API})

Read:
  tc status                         broker + known devices
  tc list                           device ids
  tc telemetry <id>                 latest sensors
  tc state <id>                     latest device state
  tc alerts <id>                    active alerts
  tc watch <id> [--interval 2]      poll telemetry

Control:
  tc door <id> open|close
  tc feed <id> <grams>
  tc clean <id> start|stop
  tc arm <id> --joints a,b,c,d,e,f [--speed 0.3]
  tc routine <id> <name>            e.g. egg_collection_routine
  tc estop <id>                     emergency stop

Global:
  --json                            machine-readable output + exit codes (for agents/scripts)
  TC_API=http://host:port           target a remote API (default http://localhost:${PORT})

Needs the API running:  npm run dev`);
}

run();
