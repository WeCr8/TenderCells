// Tests for the bring-your-own robot mower bridge: validation, quiet hours, the animal-safety
// interlock, and Home Assistant commands (with a fake Home Assistant). Run: npm test
import { test } from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

process.env.HA_URL = "http://ha.test:8123";
process.env.HA_TOKEN = "test-token";
process.env.MOWER_LINKS_FILE = join(mkdtempSync(join(tmpdir(), "tc-mower-")), "links.json");

const { validateMowerLink, inQuietHours, mowingBlockedReason, haToActivity } = await import("./mower.js");
const bridge = await import("./mowerBridge.js");
const yard = await import("./yardEvents.js");

const noon = new Date(2026, 8, 30, 12, 0, 0);
const link = {
  deviceId: "mw_test", name: "Front lawn", adapter: "home-assistant" as const, entityId: "lawn_mower.front",
  guardHabitats: ["ct_001"], noAnimalsConfirmed: false, quietHours: { start: 20, end: 7 }, createdAt: 0, updatedAt: 0,
};
const ctx = (door: unknown, over: Partial<Parameters<typeof mowingBlockedReason>[1]> = {}) => ({
  now: noon, estop: false, animalsSeen: [] as string[],
  habitat: (id: string) => (id === "ct_001" ? { doorState: door, ageMs: 5_000 } : undefined), ...over,
});

test("a link must guard coops or confirm no animals", () => {
  const base = { name: "Lawn", adapter: "home-assistant", entityId: "lawn_mower.front" };
  assert.match(validateMowerLink(base) ?? "", /coops/);
  assert.equal(validateMowerLink({ ...base, guardHabitats: ["ct_001"] }), null);
  assert.equal(validateMowerLink({ ...base, noAnimalsConfirmed: true }), null);
  assert.match(validateMowerLink({ ...base, entityId: "switch.pump", noAnimalsConfirmed: true }) ?? "", /lawn_mower/);
  assert.match(validateMowerLink({ ...base, noAnimalsConfirmed: true, quietHours: { start: 25, end: 7 } }) ?? "", /quietHours/);
});

test("Home Assistant states map to activities", () => {
  assert.equal(haToActivity("mowing"), "mowing");
  assert.equal(haToActivity("returning"), "returning");
  assert.equal(haToActivity("unavailable"), "unknown");
});

test("quiet hours wrap midnight", () => {
  const q = { start: 20, end: 7 };
  assert.equal(inQuietHours(q, new Date(2026, 0, 1, 22)), true);
  assert.equal(inQuietHours(q, new Date(2026, 0, 1, 3)), true);
  assert.equal(inQuietHours(q, new Date(2026, 0, 1, 7)), false);
  assert.equal(inQuietHours(q, noon), false);
  assert.equal(inQuietHours({ start: 0, end: 0 }, noon), false);
});

test("the interlock refuses for E-STOP, night, an open door, missing or stale data, and animals seen", () => {
  assert.equal(mowingBlockedReason(link, ctx("closed")), null);
  assert.match(mowingBlockedReason(link, ctx("closed", { estop: true })) ?? "", /E-STOP/);
  assert.match(mowingBlockedReason(link, ctx("closed", { now: new Date(2026, 8, 30, 21) })) ?? "", /Quiet hours/);
  assert.match(mowingBlockedReason(link, ctx("open")) ?? "", /door is open/);
  assert.match(mowingBlockedReason(link, ctx(undefined)) ?? "", /no door state/);
  assert.match(mowingBlockedReason(link, ctx("closed", { habitat: () => ({ doorState: "closed", ageMs: 120_000 }) })) ?? "", /out of date/);
  assert.match(mowingBlockedReason(link, ctx("closed", { animalsSeen: ["cat"] })) ?? "", /cat/);
  assert.equal(mowingBlockedReason({ ...link, guardHabitats: [], noAnimalsConfirmed: true }, ctx("open")), null);
});

// ── bridge with a fake Home Assistant + fake MQTT host ─────────────────────────
function fakeHost(door: string) {
  const published: Array<[string, Record<string, unknown>]> = [];
  return {
    published,
    host: {
      publish: (t: string, p: Record<string, unknown>) => { published.push([t, p]); return true; },
      command: () => 1,
      waitForAck: async () => ({ ok: true }),
      telemetry: (id: string) => (id === "ct_001" ? { payload: { doorState: door }, at: Date.now() } : { at: 0 }),
      subState: () => undefined,
      estopLatched: () => false,
    },
  };
}

function fakeHa(state: string) {
  const calls: string[] = [];
  globalThis.fetch = (async (url: string | URL, init?: RequestInit) => {
    const u = String(url);
    calls.push(`${init?.method ?? "GET"} ${u.replace("http://ha.test:8123", "")}`);
    assert.equal((init?.headers as Record<string, string>).Authorization, "Bearer test-token");
    const body = u.includes("/api/services/") ? [] : { entity_id: "lawn_mower.front", state, attributes: { friendly_name: "Front" } };
    return new Response(JSON.stringify(body), { status: 200, headers: { "Content-Type": "application/json" } });
  }) as typeof fetch;
  return calls;
}

test("start is refused while the coop door is open; dock always goes through", async () => {
  const { host } = fakeHost("open");
  bridge._resetMowers(host);
  const calls = fakeHa("docked");
  await bridge.createLink({ name: "Front", adapter: "home-assistant", entityId: "lawn_mower.front", guardHabitats: ["ct_001"] });
  const id = bridge.listLinks()[0].link.deviceId;
  const start = await bridge.commandMower(id, "start");
  assert.equal(start.status, 409);
  assert.match(start.error ?? "", /door is open/);
  assert.ok(!calls.some((c) => c.includes("start_mowing")), "never asked HA to start");
  const dock = await bridge.commandMower(id, "dock");
  assert.equal(dock.ok, true);
  assert.ok(calls.includes("POST /api/services/lawn_mower/dock"));
});

test("start goes to Home Assistant when the flock is in", async () => {
  const { host } = fakeHost("closed");
  bridge._resetMowers(host);
  const calls = fakeHa("docked");
  await bridge.createLink({ name: "Front", adapter: "home-assistant", entityId: "lawn_mower.front", guardHabitats: ["ct_001"], quietHours: null });
  const id = bridge.listLinks()[0].link.deviceId;
  const out = await bridge.commandMower(id, "start");
  assert.equal(out.ok, true);
  assert.ok(calls.includes("POST /api/services/lawn_mower/start_mowing"));
});

test("an animal seen on the lawn blocks the mower", async () => {
  const { host } = fakeHost("closed");
  bridge._resetMowers(host);
  yard._resetYardState();
  fakeHa("docked");
  yard.ingestEvent("rv_001", { id: "a1", type: "alert", status: "active", title: "Animal on the route", finding: "animal", label: "hedgehog" });
  await bridge.createLink({ name: "Front", adapter: "home-assistant", entityId: "lawn_mower.front", noAnimalsConfirmed: true, quietHours: null });
  const id = bridge.listLinks()[0].link.deviceId;
  assert.match(bridge.blockedReason(id) ?? "", /hedgehog/);
  yard._resetYardState();
});

test("E-STOP sends a Home Assistant mower home (pause + dock)", async () => {
  const { host } = fakeHost("closed");
  bridge._resetMowers(host);
  const calls = fakeHa("mowing");
  await bridge.createLink({ name: "Front", adapter: "home-assistant", entityId: "lawn_mower.front", noAnimalsConfirmed: true });
  const id = bridge.listLinks()[0].link.deviceId;
  await bridge.onEstop(id);
  assert.ok(calls.includes("POST /api/services/lawn_mower/pause"));
  assert.ok(calls.includes("POST /api/services/lawn_mower/dock"));
  assert.equal(bridge.mowerView(id)?.state?.lastInterlock?.action, "sent-home");
});
