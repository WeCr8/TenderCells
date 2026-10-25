// Tests for the real Home Assistant adapter: SSRF guard, connection test, and - the one that
// matters most - that lawn_mower/vacuum entities can never be staged as generic candidates,
// no matter what Home Assistant returns. Run: npm test
import { test } from "node:test";
import assert from "node:assert/strict";

process.env.HA_URL = "http://homeassistant.local:8123";
process.env.HA_TOKEN = "test-token";

const { HA_CONFIGURED, isPrivateHaUrl, testConnection, discoverCandidates, SAFE_DOMAINS } = await import("./homeAssistantAdapter.js");

function fakeHa(states: Array<{ entity_id: string; state: string; attributes?: Record<string, unknown> }>) {
  const calls: string[] = [];
  globalThis.fetch = (async (url: string | URL, init?: RequestInit) => {
    calls.push(String(url));
    assert.equal((init?.headers as Record<string, string>).Authorization, "Bearer test-token");
    return new Response(JSON.stringify(states), { status: 200, headers: { "Content-Type": "application/json" } });
  }) as typeof fetch;
  return calls;
}

test("HA_CONFIGURED is true once HA_URL and HA_TOKEN are both set", () => {
  assert.equal(HA_CONFIGURED, true);
});

test("isPrivateHaUrl accepts private/local addresses only", () => {
  assert.equal(isPrivateHaUrl("http://192.168.1.50:8123"), true);
  assert.equal(isPrivateHaUrl("http://10.0.0.5:8123"), true);
  assert.equal(isPrivateHaUrl("http://172.20.0.5:8123"), true);
  assert.equal(isPrivateHaUrl("http://homeassistant.local:8123"), true);
  assert.equal(isPrivateHaUrl("http://localhost:8123"), true);
  assert.equal(isPrivateHaUrl("http://homeassistant:8123"), true, "bare mDNS-style hostname");
  assert.equal(isPrivateHaUrl("https://some-public-ha-relay.example.com"), false);
  assert.equal(isPrivateHaUrl("http://8.8.8.8"), false, "public IP literal");
  assert.equal(isPrivateHaUrl("not a url"), false);
  assert.equal(isPrivateHaUrl("ftp://192.168.1.1"), false, "wrong protocol");
});

test("testConnection reports entity count without staging anything", async () => {
  fakeHa([{ entity_id: "sensor.coop_temp", state: "71" }, { entity_id: "lawn_mower.front", state: "docked" }]);
  const result = await testConnection();
  assert.equal(result.ok, true);
  if (result.ok) assert.equal(result.value.entityCount, 2);
});

test("SAFE_DOMAINS never includes lawn_mower or vacuum", () => {
  assert.ok(!SAFE_DOMAINS.includes("lawn_mower" as (typeof SAFE_DOMAINS)[number]));
  assert.ok(!SAFE_DOMAINS.includes("vacuum" as (typeof SAFE_DOMAINS)[number]));
});

test("discoverCandidates never stages a lawn_mower or vacuum entity, however many HA returns", async () => {
  fakeHa([
    { entity_id: "sensor.coop_temp", state: "71", attributes: { friendly_name: "Coop Temp", unit_of_measurement: "F" } },
    { entity_id: "lawn_mower.front", state: "docked", attributes: { friendly_name: "Front Mower" } },
    { entity_id: "lawn_mower.back", state: "mowing", attributes: { friendly_name: "Back Mower" } },
    { entity_id: "vacuum.living_room", state: "docked", attributes: { friendly_name: "Roomba" } },
    { entity_id: "switch.coop_light", state: "on" },
  ]);
  const result = await discoverCandidates("gw-1");
  assert.equal(result.ok, true);
  if (!result.ok) return;
  assert.equal(result.value.excludedMowerDomainCount, 3, "2 lawn_mower + 1 vacuum");
  const domains = result.value.candidates.map((c) => c.identity.externalId.split(".")[0]);
  assert.ok(!domains.includes("lawn_mower"));
  assert.ok(!domains.includes("vacuum"));
  assert.equal(result.value.candidates.length, 2);
});

test("discoverCandidates only stages SAFE_DOMAINS, dropping unknown domains silently (not erroring)", async () => {
  fakeHa([
    { entity_id: "sensor.coop_temp", state: "71" },
    { entity_id: "automation.some_automation", state: "on" },
    { entity_id: "person.zach", state: "home" },
  ]);
  const result = await discoverCandidates("gw-1");
  assert.equal(result.ok, true);
  if (!result.ok) return;
  assert.equal(result.value.candidates.length, 1);
  assert.equal(result.value.candidates[0].identity.externalId, "sensor.coop_temp");
});

test("every staged candidate is read-only and observe-tier - never write, never enabled", async () => {
  fakeHa([{ entity_id: "switch.coop_light", state: "on" }]);
  const result = await discoverCandidates("gw-1");
  assert.equal(result.ok, true);
  if (!result.ok) return;
  for (const c of result.value.candidates) {
    for (const cap of c.capabilities) {
      assert.equal(cap.mode, "read");
      assert.equal(cap.tier, "observe");
      assert.equal(cap.enabled, false);
    }
  }
});

test("an HTTP error from Home Assistant is reported, not thrown", async () => {
  globalThis.fetch = (async () => new Response("unauthorized", { status: 401 })) as typeof fetch;
  const result = await testConnection();
  assert.equal(result.ok, false);
  if (result.ok) return;
  assert.equal(result.status, 401);
});

test("a network error is reported, not thrown", async () => {
  globalThis.fetch = (async () => { throw new Error("ECONNREFUSED"); }) as typeof fetch;
  const result = await discoverCandidates("gw-1");
  assert.equal(result.ok, false);
});
