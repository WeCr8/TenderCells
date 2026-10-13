// The hub schedule runner must find the schedules the app writes. Run: npm test
import { test } from "node:test";
import assert from "node:assert/strict";
import {
  claimScheduled, collectEnabledSchedules, commandFor, commandId, cronMatch, deliverQueued, isDue, scheduleTimeZone,
  type HubCommand, type QueueDb, type ScheduleDb,
} from "./schedules.js";

// A tiny in-memory Firestore: path -> data.
function fakeDb(docs: Record<string, Record<string, unknown>>): ScheduleDb {
  const snap = (path: string) => ({
    data: () => docs[path],
    ref: { path, parent: { parent: { id: path.split("/").slice(-3, -2)[0] } }, set: async () => undefined },
  });
  const enabled = (paths: string[]) => ({
    where: (_f: string, _op: "==", v: unknown) => ({ get: async () => ({ docs: paths.filter((p) => docs[p].enabled === v).map(snap) }) }),
  });
  return {
    collection: (name: string) => ({
      listDocuments: async () => {
        const ids = [...new Set(Object.keys(docs).filter((p) => p.startsWith(`${name}/`)).map((p) => p.split("/")[1]))];
        return ids.map((id) => ({ id, collection: (sub: string) => enabled(Object.keys(docs).filter((p) => p.startsWith(`${name}/${id}/${sub}/`))) }));
      },
    }),
    collectionGroup: (name: string) => enabled(Object.keys(docs).filter((p) => p.split("/").slice(-2, -1)[0] === name)),
  };
}

test("finds app schedules at schedules/{deviceId}/items (what the app writes)", async () => {
  const db = fakeDb({
    "schedules/ct_001/items/a": { deviceId: "ct_001", action: "feed", cronExpression: "0 6 * * *", enabled: true },
    "schedules/ct_001/items/b": { deviceId: "ct_001", action: "door", cronExpression: "0 20 * * *", enabled: false },
    "schedules/rr_002/items/c": { deviceId: "rr_002", action: "door", cronExpression: "30 7 * * *", enabled: true },
  });
  const found = await collectEnabledSchedules(db);
  assert.deepEqual(found.map((f) => `${f.deviceId}:${f.s.action}`).sort(), ["ct_001:feed", "rr_002:door"]);
});

test("still reads the legacy devices/{id}/schedules path, without duplicates", async () => {
  const db = fakeDb({
    "devices/ct_009/schedules/x": { action: "clean", cronExpression: "0 12 * * *", enabled: true },
    "schedules/ct_001/items/a": { deviceId: "ct_001", action: "feed", cronExpression: "0 6 * * *", enabled: true },
  });
  const found = await collectEnabledSchedules(db);
  assert.deepEqual(found.map((f) => `${f.deviceId}:${f.s.action}`).sort(), ["ct_001:feed", "ct_009:clean"]);
});

test("a schedule acts on the device it is filed under", async () => {
  const db = fakeDb({ "schedules/ct_001/items/a": { deviceId: "someone_else", action: "door", cronExpression: "0 6 * * *", enabled: true } });
  const [f] = await collectEnabledSchedules(db);
  assert.equal(f.deviceId, "ct_001");
});

test("due once per minute, in local time, matching the app's cron (minute hour * * dow)", () => {
  const six = new Date(2026, 9, 12, 6, 0, 20); // Mon 06:00 local
  assert.ok(isDue({ cronExpression: "0 6 * * *" }, six));
  assert.ok(isDue({ cronExpression: "0 6 * * 1,3,5" }, six));
  assert.ok(!isDue({ cronExpression: "0 6 * * 0,6" }, six));
  assert.ok(!isDue({ cronExpression: "15 6 * * *" }, six));
  assert.ok(!isDue({ cronExpression: "0 6 * * *", lastRun: six.getTime() - 10_000 }, six), "already fired this minute");
  assert.ok(isDue({ cronExpression: "0 6 * * *", lastRun: six.getTime() - 86_400_000 }, six));
  assert.ok(cronMatch("*/15 * * * *", new Date(2026, 9, 12, 9, 45)));
});

// ── time zones, actions, and the queue shared with the cloud runner ─────────────────────────
// 2026-07-01 13:00 UTC = 06:00 in Los Angeles (PDT).
const LA_0600 = new Date(Date.UTC(2026, 6, 1, 13, 0));

test("cron is matched in the schedule's own time zone, not the hub's", () => {
  assert.ok(cronMatch("0 6 * * *", LA_0600, "America/Los_Angeles"));
  assert.ok(!cronMatch("0 6 * * *", LA_0600, "UTC"));
  assert.ok(cronMatch("0 13 * * 3", LA_0600, "UTC"));
  assert.ok(isDue({ cronExpression: "0 6 * * *", timeZone: "America/Los_Angeles" }, LA_0600));
  assert.ok(!isDue({ cronExpression: "0 6 * * *", timeZone: "Asia/Tokyo" }, LA_0600));
  assert.equal(scheduleTimeZone({ timeZone: "Nope/Zone" }, { TC_TIMEZONE: "Europe/Berlin" }), "Europe/Berlin");
  assert.equal(scheduleTimeZone({}, {}), undefined, "older schedules fall back to the hub's local time");
});

test("each schedule sends its own action (close, amount, water off), same as the cloud runner", () => {
  assert.deepEqual(commandFor({ action: "door", state: "close" }), { suffix: "door", payload: { state: "close" }, motion: false });
  assert.deepEqual(commandFor({ action: "door" })?.payload, { state: "open" });
  assert.deepEqual(commandFor({ action: "feed", amount: 75 })?.payload, { amount: 75 });
  assert.deepEqual(commandFor({ action: "water", on: false }), { suffix: "light", payload: { on: false }, motion: false });
  assert.equal(commandFor({ action: "clean" })?.motion, true);
  assert.equal(commandId("abc", LA_0600.getTime()), `sched_abc_${LA_0600.getTime() / 60000}`);
});

function memQueue() {
  const docs = new Map<string, Record<string, unknown> & { id: string }>();
  const q: QueueDb = {
    create: async (_d, id, doc) => { if (docs.has(id)) return false; docs.set(id, { id, ...doc }); return true; },
    update: async (_d, id, patch) => { Object.assign(docs.get(id)!, patch); },
    pending: async (d) => [...docs.values()].filter((c) => c.deviceId === d && c.status === "pending"),
    take: async (_d, id) => { const c = docs.get(id); if (!c || c.status !== "pending") return false; c.status = "delivering"; return true; },
  };
  return { docs, q };
}

test("the hub claims a due schedule once; a cloud-queued copy of the same minute is not fired twice", async () => {
  const { docs, q } = memQueue();
  const cmd = commandFor({ action: "door", state: "open" })!;
  const minute = LA_0600.getTime();
  assert.equal((await claimScheduled(q, "ct_001", "s1", cmd, minute, minute)).claimed, true);
  assert.equal((await claimScheduled(q, "ct_001", "s1", cmd, minute, minute)).claimed, false);
  // Cloud got there first for another schedule: the hub does not fire it directly...
  docs.set(commandId("s2", minute), { id: commandId("s2", minute), deviceId: "ct_001", status: "pending", command: "feed", payload: { amount: 50 }, expiresAt: minute + 600_000 });
  assert.equal((await claimScheduled(q, "ct_001", "s2", commandFor({ action: "feed" })!, minute, minute)).claimed, false);
  // ...it delivers the queued copy exactly once.
  const sent: string[] = [];
  const ok = { refusal: () => null, publish: (_d: string, c: HubCommand) => { sent.push(c.suffix); return true; } };
  assert.deepEqual((await deliverQueued(q, ["ct_001"], ok, minute)).map((r) => r.status), ["delivered"]);
  assert.deepEqual(await deliverQueued(q, ["ct_001"], ok, minute), []);
  assert.deepEqual(sent, ["feed"]);
});

test("queued commands respect E-STOP and the work-area gate, and expire", async () => {
  const { docs, q } = memQueue();
  const now = LA_0600.getTime();
  const add = (id: string, extra: Record<string, unknown>) => docs.set(id, { id, deviceId: "ct_001", status: "pending", command: "door", payload: { state: "open" }, expiresAt: now + 60_000, ...extra });
  add("door", {});
  add("clean", { command: "clean", payload: { action: "start" }, motion: true });
  add("old", { expiresAt: now - 1 });
  const sent: string[] = [];
  const estop: { refusal: () => string; publish: (d: string, c: HubCommand) => boolean } = { refusal: () => "E-STOP is active on this device", publish: (_d: string, c: HubCommand) => { sent.push(c.suffix); return true; } };
  const out = await deliverQueued(q, ["ct_001"], estop, now);
  assert.deepEqual(Object.fromEntries(out.map((r) => [r.id, r.status])), { door: "blocked", clean: "blocked", old: "expired" });
  assert.equal(sent.length, 0, "nothing moves while E-STOP is latched");
  assert.match(String(docs.get("door")!.reason), /E-STOP/);

  add("clean2", { command: "clean", payload: { action: "start" }, motion: true });
  add("door2", {});
  const chickens = { refusal: (_d: string, c: HubCommand) => (c.motion ? "2 chickens detected" : null), publish: (_d: string, c: HubCommand) => { sent.push(c.suffix); return true; } };
  const out2 = await deliverQueued(q, ["ct_001"], chickens, now);
  assert.deepEqual(Object.fromEntries(out2.map((r) => [r.id, r.status])), { clean2: "blocked", door2: "delivered" });
  assert.deepEqual(sent, ["door"]);
});
