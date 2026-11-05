// Tests for generic MQTT import: topic/URL validation, and a real end-to-end scan against a
// local Aedes broker (same library broker.ts uses) - not mocked, an actual MQTT round trip.
// Run: npm test
import { test } from "node:test";
import assert from "node:assert/strict";
import Aedes from "aedes";
import { createServer, type Server } from "node:net";
import mqtt from "mqtt";
import {
  discoverCandidates, testConnection, isPrivateBrokerUrl, validateTopicPatterns, MAX_TOPIC_PATTERNS,
} from "./mqttImportAdapter.js";

async function withTestBroker(fn: (port: number) => Promise<void>): Promise<void> {
  const aedes = new Aedes();
  const server: Server = createServer(aedes.handle);
  await new Promise<void>((resolve) => server.listen(0, "127.0.0.1", resolve));
  const address = server.address();
  const port = typeof address === "object" && address ? address.port : 0;
  try {
    await fn(port);
  } finally {
    await new Promise<void>((resolve) => server.close(() => resolve()));
    aedes.close();
  }
}

test("isPrivateBrokerUrl accepts private/local brokers only", () => {
  assert.equal(isPrivateBrokerUrl("mqtt://127.0.0.1:1883"), true);
  assert.equal(isPrivateBrokerUrl("mqtt://192.168.1.10:1883"), true);
  assert.equal(isPrivateBrokerUrl("mqtts://broker.local:8883"), true);
  assert.equal(isPrivateBrokerUrl("mqtt://some-public-broker.example.com"), false);
  assert.equal(isPrivateBrokerUrl("mqtt://8.8.8.8"), false);
  assert.equal(isPrivateBrokerUrl("http://127.0.0.1"), false, "wrong protocol");
  assert.equal(isPrivateBrokerUrl("not a url"), false);
});

test("validateTopicPatterns rejects the bare # wildcard and tc/ topics", () => {
  assert.equal(validateTopicPatterns([]), "At least one topic pattern is required");
  assert.match(validateTopicPatterns(["#"]) ?? "", /wildcard/);
  assert.match(validateTopicPatterns(["tc/ct_001/sensors"]) ?? "", /own device contract/);
  assert.match(validateTopicPatterns(["tc"]) ?? "", /own device contract/);
  assert.equal(validateTopicPatterns(["home/sensor/+"]), null);
  assert.match(validateTopicPatterns(new Array(MAX_TOPIC_PATTERNS + 1).fill("a/b")) ?? "", /No more than/);
});

test("testConnection succeeds against a real local broker and fails with a bad URL", async () => {
  await withTestBroker(async (port) => {
    const ok = await testConnection({ brokerUrl: `mqtt://127.0.0.1:${port}` });
    assert.equal(ok.ok, true);
  });
  const bad = await testConnection({ brokerUrl: "mqtt://127.0.0.1:1" });
  assert.equal(bad.ok, false);
});

test("discoverCandidates collects real messages from a real broker, end to end", async () => {
  await withTestBroker(async (port) => {
    const publisher = mqtt.connect(`mqtt://127.0.0.1:${port}`, { clientId: "test-publisher" });
    await new Promise<void>((resolve) => publisher.on("connect", () => resolve()));
    publisher.publish("home/sensor/soil_moisture", JSON.stringify({ value: 42 }), { retain: true });
    publisher.publish("home/switch/light", "on", { retain: true });

    const result = await discoverCandidates("gw-1", { brokerUrl: `mqtt://127.0.0.1:${port}`, topics: ["home/#"] });
    publisher.end(true);

    assert.equal(result.ok, true);
    if (!result.ok) return;
    const byTopic = Object.fromEntries(result.value.candidates.map((c) => [c.identity.externalId, c]));
    assert.deepEqual(byTopic["home/sensor/soil_moisture"]?.capabilities[0].value, { value: 42 }, "JSON payload parsed");
    assert.equal(byTopic["home/switch/light"]?.capabilities[0].value, "on", "non-JSON payload kept as text");
    for (const c of result.value.candidates) {
      assert.equal(c.capabilities[0].mode, "read");
      assert.equal(c.capabilities[0].tier, "observe");
      assert.equal(c.capabilities[0].enabled, false);
      assert.equal(c.capabilities[0].provenance, "real");
    }
  });
});

test("discoverCandidates never returns a tc/ topic even if a broad pattern would have matched it", async () => {
  await withTestBroker(async (port) => {
    const publisher = mqtt.connect(`mqtt://127.0.0.1:${port}`, { clientId: "test-publisher-2" });
    await new Promise<void>((resolve) => publisher.on("connect", () => resolve()));
    publisher.publish("home/sensor/x", "1", { retain: true });
    publisher.publish("tc/ct_001/sensors", JSON.stringify({ temp: 71 }), { retain: true });

    // "+/#" is a broad pattern that matches both "home/..." and "tc/..." - it passes the
    // pre-flight check (only a literal "tc/" prefix is rejected there), so the only thing
    // standing between this and leaking a native device topic is the message-handler guard
    // inside discoverCandidates itself. This proves that guard, not just the pattern check.
    const result = await discoverCandidates("gw-1", { brokerUrl: `mqtt://127.0.0.1:${port}`, topics: ["+/#"] });
    publisher.end(true);
    assert.equal(result.ok, true);
    if (!result.ok) return;
    assert.ok(result.value.candidates.some((c) => c.identity.externalId === "home/sensor/x"), "the non-tc topic did come through");
    assert.ok(!result.value.candidates.some((c) => c.identity.externalId.startsWith("tc/")), "but no tc/ topic ever does");
  });
});

test("discoverCandidates refuses a non-private broker URL before connecting", async () => {
  const result = await discoverCandidates("gw-1", { brokerUrl: "mqtt://public-broker.example.com", topics: ["a/b"] });
  assert.equal(result.ok, false);
});
