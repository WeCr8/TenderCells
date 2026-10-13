// The hub schedule runner must find the schedules the app writes. Run: npm test
import { test } from "node:test";
import assert from "node:assert/strict";
import { collectEnabledSchedules, cronMatch, isDue, type ScheduleDb } from "./schedules.js";

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
