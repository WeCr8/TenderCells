// Tests for the bring-your-own robot mower bridge: validation, quiet hours, the animal-safety
// interlock, and Home Assistant commands (with a fake Home Assistant). Run: npm test
import { test } from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

process.env.HA_URL = "http://ha.test:8123";
process.env.HA_TOKEN = "test-token";
process.env.HUSQVARNA_APP_KEY = "app-key";
process.env.HUSQVARNA_APP_SECRET = "app-secret";
process.env.MAMMOTION_CLIENT_ID = "mm-id";
process.env.MAMMOTION_CLIENT_SECRET = "mm-secret";
process.env.MOWER_LINKS_FILE = join(mkdtempSync(join(tmpdir(), "tc-mower-")), "links.json");

const {
  validateMowerLink, inQuietHours, mowingBlockedReason, haToActivity, husqvarnaToState, husqvarnaActionBody, gardenaToState,
  gardenaCommand, validateCommand, validateSettings, ADAPTER_CAPABILITIES, mammotionActivity, mammotionActionBody, startOptions,
} = await import("./mower.js");
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

test("a Roaming Roost parked in the mower's work area holds mowing", () => {
  assert.match(mowingBlockedReason(link, ctx("closed", { occupiedBy: ["Roaming Roost"] })) ?? "", /Roaming Roost is in the mower's work area/);
  assert.equal(mowingBlockedReason(link, ctx("closed", { occupiedBy: [] })), null);
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
  await bridge.createLink({ name: "Front", adapter: "home-assistant", entityId: "lawn_mower.front", guardHabitats: ["ct_001"], quietHours: null });
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
  await bridge.createLink({ name: "Front", adapter: "home-assistant", entityId: "lawn_mower.front", noAnimalsConfirmed: true, quietHours: null });
  const id = bridge.listLinks()[0].link.deviceId;
  await bridge.onEstop(id);
  assert.ok(calls.includes("POST /api/services/lawn_mower/pause"));
  assert.ok(calls.includes("POST /api/services/lawn_mower/dock"));
  assert.equal(bridge.mowerView(id)?.state?.lastInterlock?.action, "sent-home");
});

// ── official vendor APIs (fake clouds) ─────────────────────────────────────────
const amcMower = (activity: string, state = "IN_OPERATION") => ({
  id: "hq-1", type: "mower",
  attributes: {
    system: { name: "Back lawn", model: "450X" },
    battery: { batteryPercent: 77 },
    mower: { mode: "MAIN_AREA", activity, state, errorCode: 0, isErrorConfirmable: false },
    metadata: { connected: true },
    settings: { cuttingHeight: 5, headlight: { mode: "EVENING_ONLY" } },
    calendar: { tasks: [{ start: 480, duration: 240, monday: true, tuesday: false, wednesday: true, thursday: false, friday: true, saturday: false, sunday: false }] },
    stayOutZones: { dirty: false, zones: [{ id: "z-coop", name: "Coop run", enabled: true }] },
    workAreas: [{ workAreaId: 1, name: "Front", cuttingHeight: 50 }],
    positions: [{ latitude: 57.7, longitude: 14.1 }],
    planner: { nextStartTimestamp: 0 },
    capabilities: { headlights: true, position: true, stayOutZones: true, workAreas: true, canConfirmError: true },
  },
});

function fakeClouds(mowerActivity = "PARKED_IN_CS") {
  const calls: { method: string; path: string; body?: any }[] = [];
  let activity = mowerActivity;
  globalThis.fetch = (async (url: string | URL, init?: RequestInit) => {
    const u = String(url);
    const method = init?.method ?? "GET";
    const body = init?.body && typeof init.body === "string" && init.body.startsWith("{") ? JSON.parse(init.body) : undefined;
    if (u.includes("/oauth2/token")) {
      assert.match(String(init?.body), /grant_type=client_credentials/);
      return new Response(JSON.stringify({ access_token: "tok-1", expires_in: 3600 }), { status: 200 });
    }
    const h = init?.headers as Record<string, string>;
    assert.equal(h.Authorization, "Bearer tok-1");
    assert.equal(h["X-Api-Key"], "app-key");
    assert.equal(h["Authorization-Provider"], "husqvarna");
    const path = u.replace("https://api.amc.husqvarna.dev/v1", "amc").replace("https://api.smart.gardena.dev/v2", "gardena");
    calls.push({ method, path, body });
    if (path === "amc/mowers") return new Response(JSON.stringify({ data: [amcMower(activity)] }));
    if (path === "amc/mowers/hq-1" && method === "GET") return new Response(JSON.stringify({ data: amcMower(activity) }));
    if (path.startsWith("amc/mowers/hq-1/actions")) {
      const t = body.data.type;
      activity = t === "Start" || t === "ResumeSchedule" ? "LEAVING" : t === "Pause" ? activity : "GOING_HOME";
      return new Response("", { status: 202 });
    }
    if (path === "gardena/locations") return new Response(JSON.stringify({ data: [{ id: "loc-1", type: "LOCATION" }] }));
    if (path === "gardena/locations/loc-1") {
      return new Response(JSON.stringify({ included: [
        { id: "sileno-1", type: "MOWER", attributes: { activity: { value: "PARKED_TIMER" }, state: { value: "OK" }, lastErrorCode: { value: "NO_MESSAGE" } } },
        { id: "sileno-1", type: "COMMON", attributes: { name: { value: "SILENO" }, batteryLevel: { value: 64 }, rfLinkState: { value: "ONLINE" } } },
      ] }));
    }
    return new Response("{}", { status: 200 });
  }) as typeof fetch;
  return calls;
}

test("Husqvarna mower data maps to state, details and capabilities", () => {
  const s = husqvarnaToState(amcMower("MOWING"));
  assert.equal(s.activity, "mowing");
  assert.equal(s.battery, 77);
  assert.equal(s.details?.cuttingHeight, 5);
  assert.equal(s.details?.headlight, "EVENING_ONLY");
  assert.equal(s.details?.schedule?.[0].start, 480);
  assert.equal(s.details?.stayOutZones?.[0].name, "Coop run");
  assert.deepEqual(s.details?.position, { lat: 57.7, lon: 14.1 });
  assert.equal(s.capabilities?.workAreas, true);
  assert.equal(husqvarnaToState(amcMower("GOING_HOME")).activity, "returning");
  assert.equal(husqvarnaToState(amcMower("MOWING", "ERROR")).activity, "error");
  assert.deepEqual(husqvarnaActionBody("start", { durationMin: 90 }), { data: { type: "Start", attributes: { duration: 90 } } });
  assert.deepEqual(husqvarnaActionBody("dock"), { data: { type: "ParkUntilFurtherNotice" } });
  assert.deepEqual(husqvarnaActionBody("start", { workAreaId: 1 }), { data: { type: "StartInWorkArea", attributes: { workAreaId: 1 } } });
});

test("GARDENA state and commands", () => {
  const s = gardenaToState([
    { id: "m", type: "MOWER", attributes: { activity: { value: "OK_CUTTING" }, state: { value: "OK" } } },
    { id: "m", type: "COMMON", attributes: { batteryLevel: { value: 50 }, rfLinkState: { value: "ONLINE" } } },
  ], "m");
  assert.equal(s?.activity, "mowing");
  assert.equal(s?.battery, 50);
  assert.deepEqual(gardenaCommand("start", { durationMin: 60 }), { command: "START_SECONDS_TO_OVERRIDE", seconds: 3600 });
  assert.deepEqual(gardenaCommand("dock"), { command: "PARK_UNTIL_FURTHER_NOTICE" });
  assert.match(validateCommand({ action: "pause" }, ADAPTER_CAPABILITIES.gardena) ?? "", /cannot pause/);
});

test("commands and settings are checked against what the mower can do", () => {
  assert.match(validateCommand({ action: "resume_schedule" }, ADAPTER_CAPABILITIES["home-assistant"]) ?? "", /cannot/);
  assert.match(validateCommand({ action: "start", durationMin: 5000 }, ADAPTER_CAPABILITIES.husqvarna) ?? "", /1-1440/);
  assert.equal(validateCommand({ action: "start", durationMin: 60 }, ADAPTER_CAPABILITIES.husqvarna), null);
  assert.match(validateSettings({ cuttingHeight: 12 }, ADAPTER_CAPABILITIES.husqvarna) ?? "", /1-9/);
  assert.match(validateSettings({ cuttingHeight: 4 }, ADAPTER_CAPABILITIES.gardena) ?? "", /cannot be set/);
  assert.match(validateSettings({ schedule: [{ start: 1400, duration: 100, monday: true, tuesday: false, wednesday: false, thursday: false, friday: false, saturday: false, sunday: false }] }, ADAPTER_CAPABILITIES.husqvarna) ?? "", /midnight/);
  assert.equal(validateSettings({ headlight: "ALWAYS_OFF", stayOutZone: { id: "z-coop", enabled: false } }, ADAPTER_CAPABILITIES.husqvarna), null);
});

test("Husqvarna: link, discover, start for a duration, change settings", async () => {
  const { host } = fakeHost("closed");
  bridge._resetMowers(host);
  const calls = fakeClouds();
  assert.equal((await bridge.discover("husqvarna"))[0].name, "Back lawn");
  const link = await bridge.createLink({ name: "Back", adapter: "husqvarna", vendorId: "hq-1", guardHabitats: ["ct_001"], quietHours: null });
  await bridge._refresh(link.deviceId);
  assert.equal(bridge.mowerView(link.deviceId)?.state?.details?.cuttingHeight, 5);
  const out = await bridge.commandMower(link.deviceId, "start", { durationMin: 90 });
  assert.equal(out.ok, true);
  assert.deepEqual(calls.find((c) => c.path.endsWith("/actions"))?.body, { data: { type: "Start", attributes: { duration: 90 } } });
  await bridge.updateMowerSettings(link.deviceId, { cuttingHeight: 6, stayOutZone: { id: "z-coop", enabled: true } });
  assert.deepEqual(calls.find((c) => c.path.endsWith("/settings"))?.body, { data: { type: "settings", attributes: { cuttingHeight: 6 } } });
  assert.equal(calls.find((c) => c.path.includes("/stayOutZones/"))?.method, "PATCH");
});

test("a docked Husqvarna mower is parked until further notice when the flock goes out, and resumes when opted in", async () => {
  let door = "closed";
  const { host } = fakeHost("closed");
  bridge._resetMowers({ ...host, telemetry: (id: string) => (id === "ct_001" ? { payload: { doorState: door }, at: Date.now() } : { at: 0 }) });
  const calls = fakeClouds("PARKED_IN_CS");
  const link = await bridge.createLink({ name: "Back", adapter: "husqvarna", vendorId: "hq-1", guardHabitats: ["ct_001"], quietHours: null, autoResume: true });
  await bridge._refresh(link.deviceId);
  door = "open";
  await bridge._safetyCheck(link.deviceId);
  const park = calls.filter((c) => c.path.endsWith("/actions")).map((c) => c.body.data.type);
  assert.deepEqual(park, ["ParkUntilFurtherNotice"], "held even though docked - its own schedule cannot start it");
  assert.equal(bridge.mowerView(link.deviceId)?.state?.held, true);
  assert.equal((await bridge.commandMower(link.deviceId, "resume_schedule")).status, 409);
  door = "closed";
  await bridge._safetyCheck(link.deviceId);
  assert.equal(calls.filter((c) => c.path.endsWith("/actions")).at(-1)?.body.data.type, "ResumeSchedule");
  assert.equal(bridge.mowerView(link.deviceId)?.state?.lastInterlock?.action, "resumed");
});

test("GARDENA: link from discovery and dock with PARK_UNTIL_FURTHER_NOTICE", async () => {
  const { host } = fakeHost("closed");
  bridge._resetMowers(host);
  const calls = fakeClouds();
  const found = (await bridge.discover("gardena"))[0];
  assert.deepEqual(found, { id: "sileno-1", name: "SILENO", locationId: "loc-1" });
  const link = await bridge.createLink({ name: "SILENO", adapter: "gardena", vendorId: found.id, locationId: found.locationId, noAnimalsConfirmed: true, quietHours: null });
  await bridge._refresh(link.deviceId);
  assert.equal(bridge.mowerView(link.deviceId)?.state?.battery, 64);
  await bridge.commandMower(link.deviceId, "dock");
  const cmd = calls.find((c) => c.path === "gardena/command/sileno-1");
  assert.equal(cmd?.method, "PUT");
  assert.equal(cmd?.body.data.attributes.command, "PARK_UNTIL_FURTHER_NOTICE");
});

test("mow patterns: custom for native mowers, work area for Husqvarna, saved plan for Mammotion", () => {
  const plan = { action: "start", pattern: "checkerboard", angleDeg: 30, edgePasses: 2, overlapPct: 10, cuttingHeightMm: 50, area: { x: 5, y: 5, width: 40, depth: 30 } };
  assert.equal(validateCommand(plan, ADAPTER_CAPABILITIES.mqtt), null);
  assert.deepEqual(startOptions(plan), { pattern: "checkerboard", angleDeg: 30, edgePasses: 2, overlapPct: 10, cuttingHeightMm: 50, area: { x: 5, y: 5, width: 40, depth: 30 } });
  assert.match(validateCommand(plan, ADAPTER_CAPABILITIES.husqvarna) ?? "", /work area/);
  assert.match(validateCommand(plan, ADAPTER_CAPABILITIES.mammotion) ?? "", /saved plan/);
  assert.match(validateCommand(plan, ADAPTER_CAPABILITIES["home-assistant"]) ?? "", /basic/);
  assert.match(validateCommand({ action: "start", pattern: "zigzag" }, ADAPTER_CAPABILITIES.mqtt) ?? "", /pattern must be/);
  assert.match(validateCommand({ action: "start", angleDeg: 200 }, ADAPTER_CAPABILITIES.mqtt) ?? "", /0-179/);
  assert.match(validateCommand({ action: "start" }, ADAPTER_CAPABILITIES.mammotion) ?? "", /saved plans/);
  assert.equal(validateCommand({ action: "start", vendorTask: "Front stripes" }, ADAPTER_CAPABILITIES.mammotion), null);
  assert.deepEqual(mammotionActionBody("mm-1", "start", { vendorTask: "Front stripes" }), { deviceId: "mm-1", action: "START", params: { taskName: "Front stripes" } });
  assert.equal(mammotionActivity("MOWING"), "mowing");
  assert.equal(mammotionActivity("RETURNING"), "returning");
  assert.equal(mammotionActivity("IDLE", "CHARGING"), "docked");
});

test("a native mower receives the whole mowing plan with the start command", async () => {
  const sent: Record<string, unknown>[] = [];
  const { host } = fakeHost("closed");
  bridge._resetMowers({ ...host, command: (_id: string, _s: string, p: Record<string, unknown>) => { sent.push(p); return 7; } });
  const link = await bridge.createLink({ name: "DIY", adapter: "mqtt", noAnimalsConfirmed: true, quietHours: null });
  const out = await bridge.commandMower(link.deviceId, "start", { pattern: "stripes", angleDeg: 45, edgePasses: 1 });
  assert.equal(out.ok, true);
  assert.deepEqual(sent.at(-1), { action: "start", pattern: "stripes", angleDeg: 45, edgePasses: 1 });
});

test("Mammotion: discover, read saved plans, start one by name", async () => {
  const { host } = fakeHost("closed");
  bridge._resetMowers(host);
  const calls: { method: string; path: string; body?: any }[] = [];
  globalThis.fetch = (async (url: string | URL, init?: RequestInit) => {
    const u = String(url);
    if (u === "https://id.mammotion.com/oauth2/token") {
      assert.match(String(init?.body), /grant_type=client_credentials&client_id=mm-id/);
      return new Response(JSON.stringify({ code: 0, data: { access_token: "mm-tok", expires_in: 3600 } }));
    }
    assert.equal((init?.headers as Record<string, string>).Authorization, "Bearer mm-tok");
    const path = u.replace("https://api-open.mammotion.com/v1", "");
    const body = typeof init?.body === "string" ? JSON.parse(init.body) : undefined;
    calls.push({ method: init?.method ?? "GET", path, body });
    if (path === "/mowers") return new Response(JSON.stringify({ code: 0, data: [{ id: "mm-1", nickname: "LUBA", model: "LUBA 2 AWD" }] }));
    if (path === "/mower/mm-1") return new Response(JSON.stringify({ code: 0, data: { id: "mm-1", status: "IDLE", chargeStatus: "CHARGING", batteryLevel: 91, online: true } }));
    if (path === "/mower/mm-1/plan") return new Response(JSON.stringify({ code: 0, data: [{ taskId: "t1", taskName: "Front stripes" }, { taskId: "t2", taskName: "Back checkerboard" }] }));
    return new Response(JSON.stringify({ code: 0, data: {} }));
  }) as typeof fetch;
  assert.equal((await bridge.discover("mammotion"))[0].name, "LUBA");
  const link = await bridge.createLink({ name: "LUBA", adapter: "mammotion", vendorId: "mm-1", noAnimalsConfirmed: true, quietHours: null });
  await bridge._refresh(link.deviceId);
  const v = bridge.mowerView(link.deviceId);
  assert.equal(v?.state?.activity, "docked");
  assert.equal(v?.state?.battery, 91);
  assert.deepEqual(v?.state?.details?.plans?.map((p) => p.name), ["Front stripes", "Back checkerboard"]);
  await bridge.commandMower(link.deviceId, "start", { vendorTask: "Back checkerboard" });
  assert.deepEqual(calls.find((c) => c.path === "/mower/action")?.body, { deviceId: "mm-1", action: "START", params: { taskName: "Back checkerboard" } });
});
