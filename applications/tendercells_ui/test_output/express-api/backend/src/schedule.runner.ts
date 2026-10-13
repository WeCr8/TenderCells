// schedule.runner.ts
// Server-side scheduler: fires device commands at their cron time.
//
// The app stores schedules at schedules/{deviceId}/items/{scheduleId} (schedulesService.ts,
// firestore.rules). FIX(2026-10-12): this runner only queried collectionGroup("schedules"),
// which never matches those item documents, so schedules made in the app never fired on
// the hub. It now reads the app's path too (schedules.ts), plus the older
// devices/{id}/schedules path.
// FIX(2026-10-12, later): cron is matched in the schedule's own time zone (the app stamps
// timeZone on save; TC_TIMEZONE, then the hub's local time, for older schedules). Before
// firing, the runner claims deviceCommands/{deviceId}/queue/sched_<id>_<minute>: the cloud
// runner (functions executeSchedules) uses the same id, so a schedule fires once even when
// both see it. Commands the cloud queued for devices on this hub are delivered here, over
// local MQTT, through the same E-STOP / work-area gates as a button press.
// This runner, on the always-on API, scans enabled schedules every 30s. Requires Firebase
// admin (logged-in instance); no-op in demo/LAN mode.

import { AUTH_ENABLED } from "./middleware/auth.js";
import { getFirestoreAdmin } from "./config/firebase-admin.js";
import { MQTTController } from "./controllers/mqtt.controller.js";
import {
  claimScheduled, collectEnabledSchedules, commandFor, deliverQueued, isDue, scheduleTimeZone,
  type Delivery, type HubCommand, type QueueDb, type ScheduleDb,
} from "./schedules.js";

const ALREADY_EXISTS = 6;

/** E-STOP latch for everything; the work-area gate (E-STOP + headcount) for robot motion. */
export function refusal(deviceId: string, cmd: HubCommand): string | null {
  if (MQTTController.estopLatched(deviceId)) return "E-STOP is active on this device";
  if (cmd.motion) return MQTTController.motionBlockedReason(deviceId, cmd.suffix === "weed" ? "weed" : "arm");
  return null;
}

const delivery: Delivery = {
  refusal,
  publish: (deviceId, cmd) => cmd.suffix === "weed"
    ? MQTTController.publishWithSeq(deviceId, "weed", cmd.payload) !== null
    : MQTTController.publishCommand(deviceId, cmd.suffix, cmd.payload),
};

function firestoreQueue(): QueueDb {
  const db = getFirestoreAdmin();
  const col = (deviceId: string) => db.collection("deviceCommands").doc(deviceId).collection("queue");
  return {
    create: async (deviceId, id, doc) => {
      try {
        await col(deviceId).doc(id).create(doc);
        return true;
      } catch (e) {
        if ((e as { code?: number }).code === ALREADY_EXISTS) return false;
        throw e;
      }
    },
    update: async (deviceId, id, patch) => { await col(deviceId).doc(id).set(patch, { merge: true }); },
    pending: async (deviceId) => (await col(deviceId).where("status", "==", "pending").limit(20).get()).docs.map((d) => ({ id: d.id, ...d.data() })),
    take: (deviceId, id) => db.runTransaction(async (tx) => {
      const ref = col(deviceId).doc(id);
      const snap = await tx.get(ref);
      if (!snap.exists || snap.data()?.status !== "pending") return false;
      tx.update(ref, { status: "delivering" });
      return true;
    }),
  };
}

async function tick() {
  try {
    const db = getFirestoreAdmin() as unknown as ScheduleDb;
    const queue = firestoreQueue();
    const now = new Date();
    const minute = Math.floor(now.getTime() / 60_000) * 60_000;
    for (const { deviceId, s, doc } of await collectEnabledSchedules(db)) {
      if (!isDue(s, now, scheduleTimeZone(s))) continue;
      const cmd = commandFor(s);
      if (!cmd) continue;
      const scheduleId = doc.ref.path.split("/").pop() ?? doc.ref.path;
      let claimId: string | null = null;
      try {
        const c = await claimScheduled(queue, deviceId, scheduleId, cmd, minute, Date.now());
        if (!c.claimed) {
          // Already queued (cloud runner or another hub); deliverQueued() sends it if still pending.
          await doc.ref.set({ lastRun: Date.now() }, { merge: true }).catch(() => {});
          continue;
        }
        claimId = c.id;
      } catch (e) {
        console.warn(`[SCHED] could not claim ${scheduleId} (${(e as Error).message}); firing locally anyway`);
      }
      const blocked = refusal(deviceId, cmd);
      const sent = !blocked && delivery.publish(deviceId, cmd);
      if (blocked) console.warn(`[SCHED] skipped ${s.action} on ${deviceId}: ${blocked}`);
      if (claimId) {
        await queue.update(deviceId, claimId, {
          status: sent ? "delivered" : "blocked", ...(sent ? {} : { reason: blocked ?? "broker not connected" }), settledAt: Date.now(), deliveredBy: "hub",
        }).catch(() => {});
      }
      if (sent) {
        await doc.ref.set({ lastRun: Date.now() }, { merge: true }).catch(() => {});
        console.log(`[SCHED] fired ${s.action} on ${deviceId}`);
      }
    }
    // Commands the cloud queued for devices this hub can reach.
    for (const r of await deliverQueued(queue, MQTTController.knownDeviceIds(), delivery, Date.now())) {
      console.log(`[SCHED] queued ${r.id} on ${r.deviceId}: ${r.status}${r.reason ? ` (${r.reason})` : ""}`);
    }
  } catch (e) {
    console.error("[SCHED] tick failed:", e);
  }
}

export function startScheduleRunner() {
  if (!AUTH_ENABLED) {
    console.log("[SCHED] runner disabled (no Firebase admin — demo/LAN mode)");
    return;
  }
  console.log("[SCHED] schedule runner started (30s tick)");
  setInterval(() => void tick(), 30000);
}
