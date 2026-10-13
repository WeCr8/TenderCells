// schedule.runner.ts
// Server-side scheduler: fires device commands at their cron time.
//
// The app stores schedules at schedules/{deviceId}/items/{scheduleId} (schedulesService.ts,
// firestore.rules). FIX(2026-10-12): this runner only queried collectionGroup("schedules"),
// which never matches those item documents, so schedules made in the app never fired on
// the hub. It now reads the app's path too (schedules.ts), plus the older
// devices/{id}/schedules path. Cron is evaluated in the hub's local time zone; the app
// builds it in the browser's, so hub and browser should share a time zone.
// This runner, on the always-on API, scans enabled schedules every 30s, matches the
// 5-field cron against now, and publishes the matching cmd/* over local MQTT (via
// MQTTController). De-dupes within the same minute using lastRun. Requires Firebase
// admin (logged-in instance); no-op in demo/LAN mode.

import { AUTH_ENABLED } from "./middleware/auth.js";
import { getFirestoreAdmin } from "./config/firebase-admin.js";
import { MQTTController } from "./controllers/mqtt.controller.js";
import { collectEnabledSchedules, isDue, type ScheduleDb, type ScheduleDoc } from "./schedules.js";

// Map a schedule action to a command publish.
function fire(deviceId: string, s: ScheduleDoc): boolean {
  // Scheduled motion obeys the same safety gate as a button press (E-STOP,
  // chicken presence). FIX(2026-09-27): scheduled cleaning ignored it.
  const motion = s.action === "clean" || s.action === "weed_pass";
  const blocked = motion ? MQTTController.motionBlockedReason(deviceId, s.action === "weed_pass" ? "weed" : "arm") : null;
  if (blocked) {
    console.warn(`[SCHED] skipped ${s.action} on ${deviceId}: ${blocked}`);
    return false;
  }
  switch (s.action) {
    case "feed":  return MQTTController.publishCommand(deviceId, "feed",  { amount: s.amount ?? 50 });
    case "clean": return MQTTController.publishCommand(deviceId, "clean", { action: "start" });
    case "door":  return MQTTController.publishCommand(deviceId, "door",  { state: s.state ?? "open" });
    case "water": return MQTTController.publishCommand(deviceId, "light", { on: s.on ?? true });
    case "weed_pass":
      return MQTTController.publishWithSeq(deviceId, "weed", {
        action: "pass", passes: Math.min(10, Math.max(1, s.passes ?? 1)),
        task: s.task === "plant_scan" || s.task === "patrol" ? s.task : "weed",
      }) !== null;
    default: return false;
  }
}

async function tick() {
  try {
    const db = getFirestoreAdmin() as unknown as ScheduleDb;
    const now = new Date();
    for (const { deviceId, s, doc } of await collectEnabledSchedules(db)) {
      if (!isDue(s, now)) continue;
      if (fire(deviceId, s)) {
        await doc.ref.set({ lastRun: Date.now() }, { merge: true }).catch(() => {});
        console.log(`[SCHED] fired ${s.action} on ${deviceId}`);
      }
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
