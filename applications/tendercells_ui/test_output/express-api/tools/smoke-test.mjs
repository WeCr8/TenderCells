// smoke-test.mjs
// Proves the end-to-end device path with no hardware:
//   publish MQTT sensors  →  embedded broker  →  express-api bridge  →  REST read
//
// Requires the API to be running (npm run dev) so the broker + bridge are up.
// Exit 0 = loop works, exit 1 = broken. Safe to run in CI once the server boots.
//
//   npm run dev          # in one terminal
//   npm run smoke        # in another

import mqtt from "mqtt";

const brokerUrl = process.env.MQTT_BROKER || "mqtt://localhost:1883";
const apiBase = process.env.API_BASE || `http://localhost:${process.env.PORT || 4000}`;
const deviceId = `smoke_${Date.now()}`;
const expectedTemp = 71.5;

function fail(msg) {
  console.error(`✗ SMOKE FAIL: ${msg}`);
  process.exit(1);
}

const client = mqtt.connect(brokerUrl, { clientId: `smoke-${Date.now()}`, reconnectPeriod: 0 });

const giveUp = setTimeout(() => fail(`could not connect to broker at ${brokerUrl} (is 'npm run dev' running?)`), 8000);

client.on("error", (e) => fail(`broker error: ${e.message}`));

client.on("connect", async () => {
  clearTimeout(giveUp);
  console.log(`• connected to broker ${brokerUrl}`);

  const payload = {
    temp: expectedTemp,
    humidity: 64,
    ammonia: 3.2,
    feedLevel: 77,
    waterLevel: 70,
    chickenCount: 3,
    doorState: "closed",
    ts: Date.now(),
  };
  client.publish(`tc/${deviceId}/sensors`, JSON.stringify(payload), { qos: 0 }, async (err) => {
    if (err) fail(`publish failed: ${err.message}`);
    console.log(`• published sensors for ${deviceId}`);

    // give the bridge a moment to ingest
    await new Promise((r) => setTimeout(r, 700));

    let res;
    try {
      res = await fetch(`${apiBase}/api/mqtt/devices/${deviceId}/telemetry`);
    } catch (e) {
      fail(`API not reachable at ${apiBase} (${e.message})`);
    }
    if (!res.ok) fail(`telemetry HTTP ${res.status} — bridge did not record the device`);

    const body = await res.json();
    const temp = body?.data?.temp;
    if (temp !== expectedTemp) fail(`expected temp ${expectedTemp}, got ${JSON.stringify(temp)}`);

    console.log(`✓ SMOKE PASS: device → broker → bridge → REST returned temp ${temp}°F`);
    client.end(true, () => process.exit(0));
  });
});
