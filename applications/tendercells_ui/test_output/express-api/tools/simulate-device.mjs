// simulate-device.mjs
// A virtual Tender Cells device. Connects to the MQTT broker, publishes realistic
// sensor telemetry and state, and reacts to commands (door, feed, clean, estop)
// exactly like real ESP32 firmware would. Lets users, students, and developers
// see the whole platform work end-to-end with NO hardware.
//
// Usage:
//   node tools/simulate-device.mjs                       # device id "sim_001", coop
//   node tools/simulate-device.mjs --id coop_demo        # custom id
//   node tools/simulate-device.mjs --id dd_001 --kind duck
//   node tools/simulate-device.mjs --id rr_001 --kind roost
//   node tools/simulate-device.mjs --id wt_001 --kind watchtower --alert-every 30
//   node tools/simulate-device.mjs --id ct_42 --interval 3 --egg-every 20
//   MQTT_BROKER=mqtt://192.168.1.50:1883 node tools/simulate-device.mjs
//
// Kinds:  coop (Chicken Tender, default) | duck (Duck Dock) | roost (Roaming Roost)
//         | watchtower (predator monitor: located predator alerts)
//
// Topics it speaks (match CLAUDE.md §4 and the MQTT bridge):
//   publishes  tc/{id}/sensors   every interval seconds
//   publishes  tc/{id}/state     on boot and on every state change
//   publishes  tc/{id}/status    {"online":true} retained; last will {"online":false}
//   publishes  tc/{id}/ack       {"seq","ok","error"} for every command carrying a seq
//   publishes  tc/{id}/event     station flags: egg_ready (coop/duck), headcount (roost)
//   publishes  tc/{id}/alert     watchtower: {"type":"predator","label","confidence","camera","bearingDeg","distanceFt"}
//   subscribes tc/{id}/cmd/+     door | feed | clean | arm | motion | event | estop

import mqtt from "mqtt";

// ── args ──────────────────────────────────────────────────────────────────────
const args = process.argv.slice(2);
function arg(name, fallback) {
  const i = args.indexOf(`--${name}`);
  return i >= 0 && args[i + 1] ? args[i + 1] : fallback;
}
const deviceId = arg("id", "sim_001");
const kind = arg("kind", "coop");
if (!["coop", "duck", "roost", "watchtower"].includes(kind)) {
  console.error(`--kind must be coop | duck | roost | watchtower (got "${kind}")`);
  process.exit(1);
}
const intervalSec = Number(arg("interval", "10"));
const eggEverySec = Number(arg("egg-every", "45"));
const alertEverySec = Number(arg("alert-every", "60"));
const brokerUrl = process.env.MQTT_BROKER || "mqtt://localhost:1883";

// ── simulated device state ──────────────────────────────────────────────────
const FLOCK_SIZE = kind === "roost" ? 6 : kind === "duck" ? 4 : 3;
const device = {
  temp: 67,
  humidity: 68,
  ammonia: 4,
  feedLevel: 80,
  waterLevel: 72,
  chickenCount: FLOCK_SIZE,
  doorState: "closed", // open | closed
  systemState: "idle", // idle | running | error | estop
  eggs: 0, // eggs waiting for pickup (coop/duck)
};

function clamp(v, lo, hi) {
  return Math.min(hi, Math.max(lo, v));
}
function drift(v, amount, lo, hi) {
  return Number(clamp(v + (Math.random() - 0.5) * amount, lo, hi).toFixed(1));
}

let flockTimer;
const T = (suffix) => `tc/${deviceId}/${suffix}`;

const client = mqtt.connect(brokerUrl, {
  clientId: `tc-sim-${deviceId}`,
  reconnectPeriod: 3000,
  // Broker publishes this if the simulator dies, so the API/UI shows it offline.
  will: { topic: T("status"), payload: JSON.stringify({ online: false }), qos: 1, retain: true },
});

function publishState() {
  client.publish(
    T("state"),
    JSON.stringify({
      state: device.systemState,
      doorState: device.doorState,
      uptime: Math.floor(process.uptime()),
      ts: Date.now(),
    }),
    { qos: 1 }
  );
  console.log(`→ state: ${device.systemState} (door ${device.doorState})`);
}

function publishSensors() {
  // gentle drift so the dashboard shows live movement
  device.temp = drift(device.temp, 1.5, 50, 90);
  device.humidity = drift(device.humidity, 3, 30, 90);
  device.ammonia = drift(device.ammonia, 1.2, 0, 30);
  device.feedLevel = clamp(device.feedLevel - Math.random() * 0.4, 0, 100);
  device.waterLevel = clamp(device.waterLevel - Math.random() * 0.6, 0, 100);

  const payload = {
    temp: device.temp,
    humidity: Math.round(device.humidity),
    ammonia: Number(device.ammonia.toFixed(1)),
    feedLevel: Math.round(device.feedLevel),
    waterLevel: Math.round(device.waterLevel),
    chickenCount: device.chickenCount,
    doorState: device.doorState,
    ts: Date.now(),
  };
  client.publish(T("sensors"), JSON.stringify(payload), { qos: 0 });
  console.log(
    `→ sensors: ${payload.temp}°F  ${payload.humidity}%RH  NH3 ${payload.ammonia}  feed ${payload.feedLevel}%  water ${payload.waterLevel}%`
  );
}

function publishEvent(event) {
  client.publish(T("event"), JSON.stringify({ ts: Date.now(), ...event }), { qos: 1 });
}

/** Egg pickup flag: one upserted event per device ("eggs-today"). */
function publishEggs() {
  publishEvent({
    id: "eggs-today",
    type: "egg_ready",
    status: device.eggs > 0 ? "active" : "cleared",
    title: kind === "duck" ? "Duck eggs ready" : "Eggs ready",
    count: device.eggs,
    station: kind === "duck" ? "nesting shelf" : "nest boxes",
    detail: device.eggs > 0 ? `${device.eggs} waiting for pickup` : "Collected",
  });
}

/** Roost headcount: birds inside the dome vs roaming the run. */
function publishHeadcount() {
  const roaming = FLOCK_SIZE - device.chickenCount;
  publishEvent({
    id: "headcount",
    type: "headcount",
    status: "active",
    title: `${device.chickenCount} of ${FLOCK_SIZE} in roost`,
    count: device.chickenCount,
    detail: roaming > 0 ? `${roaming} roaming outside` : "All birds inside",
  });
}

function setState(next) {
  if (device.systemState === next) return;
  device.systemState = next;
  publishState();
}

/** Reply to a command carrying seq so the API can report accepted / refused. */
function ack(cmd, ok, error) {
  if (cmd.seq === undefined || cmd.seq === null) return;
  client.publish(T("ack"), JSON.stringify({ seq: cmd.seq, ok, ...(error ? { error } : {}) }), { qos: 1 });
}

client.on("connect", () => {
  console.log(`✓ ${deviceId} (${kind}) connected to ${brokerUrl}`);
  client.subscribe(T("cmd/+"), { qos: 1 });
  client.publish(T("status"), JSON.stringify({ online: true, kind }), { qos: 1, retain: true });
  publishState();
  publishSensors();
  if (kind === "roost") publishHeadcount();
  else if (kind !== "watchtower") publishEggs();
});

client.on("message", (topic, buf) => {
  let cmd = {};
  try {
    cmd = JSON.parse(buf.toString());
  } catch {
    console.warn(`[sim] ignored non-JSON command on ${topic}`);
    return;
  }
  const name = topic.split("/").pop();

  // E-STOP always wins, regardless of current state. {active:false} clears the latch.
  if (name === "estop") {
    if (cmd.active === false) {
      console.log("✅ E-STOP cleared");
      setState("idle");
    } else {
      console.log("⛔ E-STOP received — cutting all motion");
      setState("estop");
    }
    ack(cmd, true);
    return;
  }
  if (device.systemState === "estop") {
    console.log(`[sim] in E-STOP — refusing ${name}`);
    ack(cmd, false, "E-STOP is active");
    return;
  }

  switch (name) {
    case "door":
      device.doorState = cmd.state === "open" ? "open" : "closed";
      console.log(`🚪 door → ${device.doorState}`);
      ack(cmd, true);
      publishState();
      // The flock walks out a few seconds after the door opens and back in after it
      // closes, so the API's chicken-presence guard can be exercised: open the door,
      // wait, then arm / clean / routines are allowed. The roost lets birds out one by one.
      clearTimeout(flockTimer);
      flockTimer = setTimeout(() => {
        device.chickenCount = device.doorState === "open" ? (kind === "roost" ? Math.floor(FLOCK_SIZE / 3) : 0) : FLOCK_SIZE;
        console.log(`🐔 birds inside: ${device.chickenCount}`);
        publishSensors();
        if (kind === "roost") publishHeadcount();
      }, 3000);
      break;
    case "feed":
      device.feedLevel = clamp(device.feedLevel + (Number(cmd.amount) || 0) / 50, 0, 100);
      console.log(`🌾 feed +${cmd.amount}g → feedLevel ${Math.round(device.feedLevel)}%`);
      ack(cmd, true);
      setState("running");
      setTimeout(() => setState("idle"), 1500);
      break;
    case "clean":
      ack(cmd, true);
      if (cmd.action === "start") {
        console.log("🧹 cleaning cycle started");
        setState("running");
        setTimeout(() => setState("idle"), 4000);
      } else {
        setState("idle");
      }
      break;
    case "arm":
      if (!Array.isArray(cmd.joints)) {
        ack(cmd, false, "cmd/arm needs a joints array");
        break;
      }
      console.log(`🤖 arm move joints=${JSON.stringify(cmd.joints)} speed=${cmd.speed ?? "-"}`);
      ack(cmd, true);
      setState("running");
      setTimeout(() => setState("idle"), 2000);
      break;
    case "motion":
      // Routines (egg_collection_routine, cleaning_sweep_routine) arrive on cmd/motion.
      console.log(`🤖 routine ${cmd.routine ?? "(unnamed)"} started`);
      ack(cmd, true);
      setState("running");
      setTimeout(() => {
        if (cmd.routine === "egg_collection_routine" && device.eggs > 0) {
          console.log(`🥚 routine collected ${device.eggs} egg(s)`);
          device.eggs = 0;
          publishEggs();
        }
        setState("idle");
      }, 6000);
      break;
    case "event":
      // The user acknowledged a flag in the UI (e.g. "I picked up the eggs").
      if (cmd.action === "ack" && cmd.eventId === "eggs-today") {
        console.log(`🥚 eggs picked up (${device.eggs})`);
        device.eggs = 0;
        publishEggs();
      }
      ack(cmd, true);
      break;
    default:
      console.log(`[sim] unknown command: ${name}`);
      ack(cmd, false, `Unknown command '${name}'`);
  }
});

client.on("error", (e) => console.error("MQTT error:", e.message));

setInterval(publishSensors, intervalSec * 1000);

if (kind === "watchtower") {
  // A located predator detection now and then: camera i points at 120° * i; the object's
  // offset in the frame shifts the bearing within the camera's 120° field of view.
  const PREDATORS = ["fox", "raccoon", "coyote", "hawk", "opossum"];
  setInterval(() => {
    if (device.systemState === "estop") return;
    const camera = Math.floor(Math.random() * 3);
    const bearingDeg = Math.round((camera * 120 + (Math.random() - 0.5) * 120 + 360) % 360);
    const alert = {
      type: "predator",
      label: PREDATORS[Math.floor(Math.random() * PREDATORS.length)],
      confidence: Math.round((0.76 + Math.random() * 0.22) * 100) / 100,
      camera, bearingDeg,
      distanceFt: Math.round(8 + Math.random() * 30),
      deviceId, ts: Date.now(),
    };
    client.publish(T("alert"), JSON.stringify(alert), { qos: 2 });
    console.log(`🦊 ${alert.label} ${Math.round(alert.confidence * 100)}% cam ${camera + 1} bearing ${bearingDeg}° ~${alert.distanceFt} ft`);
  }, alertEverySec * 1000);
} else if (kind === "roost") {
  // Birds wander in and out of the dome while the door is open.
  setInterval(() => {
    if (device.doorState !== "open" || device.systemState === "estop") return;
    const next = clamp(device.chickenCount + (Math.random() < 0.5 ? -1 : 1), 0, FLOCK_SIZE);
    if (next !== device.chickenCount) {
      device.chickenCount = next;
      publishHeadcount();
    }
  }, 8000);
} else {
  // Hens lay while inside; a flag pops up as soon as the first egg arrives.
  setInterval(() => {
    if (device.chickenCount === 0 || device.eggs >= FLOCK_SIZE * 2) return;
    device.eggs += 1;
    console.log(`🥚 new egg (${device.eggs} waiting)`);
    publishEggs();
  }, eggEverySec * 1000);
}

console.log(`Tender Cells virtual ${kind} "${deviceId}" — publishing every ${intervalSec}s. Ctrl+C to stop.`);
