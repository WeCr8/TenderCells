// simulate-device.mjs
// A virtual Tender Cells device. Connects to the MQTT broker, publishes realistic
// sensor telemetry and state, and reacts to commands (door, feed, clean, estop)
// exactly like real ESP32 firmware would. Lets users, students, and developers
// see the whole platform work end-to-end with NO hardware.
//
// Usage:
//   node tools/simulate-device.mjs                       # device id "sim_001"
//   node tools/simulate-device.mjs --id coop_demo        # custom id
//   node tools/simulate-device.mjs --id ct_42 --interval 3
//   MQTT_BROKER=mqtt://192.168.1.50:1883 node tools/simulate-device.mjs
//
// Topics it speaks (match CLAUDE.md §4 and the MQTT bridge):
//   publishes  tc/{id}/sensors   every interval seconds
//   publishes  tc/{id}/state     on boot and on every state change
//   subscribes tc/{id}/cmd/+     door | feed | clean | arm | estop

import mqtt from "mqtt";

// ── args ──────────────────────────────────────────────────────────────────────
const args = process.argv.slice(2);
function arg(name, fallback) {
  const i = args.indexOf(`--${name}`);
  return i >= 0 && args[i + 1] ? args[i + 1] : fallback;
}
const deviceId = arg("id", "sim_001");
const intervalSec = Number(arg("interval", "10"));
const brokerUrl = process.env.MQTT_BROKER || "mqtt://localhost:1883";

// ── simulated device state ──────────────────────────────────────────────────
const device = {
  temp: 67,
  humidity: 68,
  ammonia: 4,
  feedLevel: 80,
  waterLevel: 72,
  chickenCount: 3,
  doorState: "closed", // open | closed
  systemState: "idle", // idle | running | error | estop
};

function clamp(v, lo, hi) {
  return Math.min(hi, Math.max(lo, v));
}
function drift(v, amount, lo, hi) {
  return Number(clamp(v + (Math.random() - 0.5) * amount, lo, hi).toFixed(1));
}

const client = mqtt.connect(brokerUrl, {
  clientId: `tc-sim-${deviceId}`,
  reconnectPeriod: 3000,
});

const T = (suffix) => `tc/${deviceId}/${suffix}`;

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

function setState(next) {
  if (device.systemState === next) return;
  device.systemState = next;
  publishState();
}

client.on("connect", () => {
  console.log(`✓ ${deviceId} connected to ${brokerUrl}`);
  client.subscribe(T("cmd/+"), { qos: 1 });
  publishState();
  publishSensors();
});

client.on("message", (topic, buf) => {
  let cmd = {};
  try {
    cmd = JSON.parse(buf.toString());
  } catch {
    console.warn(`[sim] ignored non-JSON command on ${topic}`);
    return;
  }
  const kind = topic.split("/").pop();

  // E-STOP always wins, regardless of current state.
  if (kind === "estop") {
    console.log("⛔ E-STOP received — cutting all motion");
    setState("estop");
    return;
  }
  if (device.systemState === "estop") {
    console.log(`[sim] in E-STOP — ignoring ${kind} (clear with a state reset)`);
    return;
  }

  switch (kind) {
    case "door":
      device.doorState = cmd.state === "open" ? "open" : "closed";
      console.log(`🚪 door → ${device.doorState}`);
      publishState();
      break;
    case "feed":
      device.feedLevel = clamp(device.feedLevel + (Number(cmd.amount) || 0) / 50, 0, 100);
      console.log(`🌾 feed +${cmd.amount}g → feedLevel ${Math.round(device.feedLevel)}%`);
      setState("running");
      setTimeout(() => setState("idle"), 1500);
      break;
    case "clean":
      if (cmd.action === "start") {
        console.log("🧹 cleaning cycle started");
        setState("running");
        setTimeout(() => setState("idle"), 4000);
      } else {
        setState("idle");
      }
      break;
    case "arm":
      console.log(`🤖 arm move joints=${JSON.stringify(cmd.joints)} speed=${cmd.speed ?? "-"}`);
      setState("running");
      setTimeout(() => setState("idle"), 2000);
      break;
    default:
      console.log(`[sim] unknown command: ${kind}`);
  }
});

client.on("error", (e) => console.error("MQTT error:", e.message));

setInterval(publishSensors, intervalSec * 1000);

console.log(`Tender Cells virtual device "${deviceId}" — publishing every ${intervalSec}s. Ctrl+C to stop.`);
