// schedule.runner.ts
// Server-side scheduler: fires device commands at their cron time.
//
// The app only stored schedules (devices/{id}/schedules) — nothing executed them.
// This runner, on the always-on API, scans enabled schedules every 30s, matches the
// 5-field cron against now, and publishes the matching cmd/* over local MQTT (via
// MQTTController). De-dupes within the same minute using lastRun. Requires Firebase
// admin (logged-in instance); no-op in demo/LAN mode.

import { AUTH_ENABLED } from "./middleware/auth.js";
import { getFirestoreAdmin } from "./config/firebase-admin.js";
import { MQTTController } from "./controllers/mqtt.controller.js";

interface ScheduleDoc {
  deviceId?: string;
  action?: "feed" | "clean" | "door" | "water";
  cronExpression?: string;
  enabled?: boolean;
  amount?: number;
  state?: "open" | "close";   // door: which way (default open)
  on?: boolean;               // water/relay: on or off (default on)
  lastRun?: number | { toMillis?: () => number } | null;
}

// Match one cron field (supports *, n, a-b, */n, and comma lists) against a value.
function matchField(field: string, val: number): boolean {
  return field.split(",").some((part) => {
    if (part === "*") return true;
    if (part.startsWith("*/")) {
      const n = Number(part.slice(2));
      return n > 0 && val % n === 0;
    }
    if (part.includes("-")) {
      const [a, b] = part.split("-").map(Number);
      return val >= a && val <= b;
    }
    return Number(part) === val;
  });
}

// 5-field cron: minute hour day-of-month month day-of-week.
function cronMatch(expr: string, d: Date): boolean {
  const f = expr.trim().split(/\s+/);
  if (f.length !== 5) return false;
  return (
    matchField(f[0], d.getMinutes()) &&
    matchField(f[1], d.getHours()) &&
    matchField(f[2], d.getDate()) &&
    matchField(f[3], d.getMonth() + 1) &&
    matchField(f[4], d.getDay())
  );
}

function toMs(v: ScheduleDoc["lastRun"]): number {
  if (!v) return 0;
  if (typeof v === "number") return v;
  return v.toMillis?.() ?? 0;
}

// Map a schedule action to a command publish.
function fire(deviceId: string, s: ScheduleDoc): boolean {
  switch (s.action) {
    case "feed":  return MQTTController.publishCommand(deviceId, "feed",  { amount: s.amount ?? 50 });
    case "clean": return MQTTController.publishCommand(deviceId, "clean", { action: "start" });
    case "door":  return MQTTController.publishCommand(deviceId, "door",  { state: s.state ?? "open" });
    case "water": return MQTTController.publishCommand(deviceId, "light", { on: s.on ?? true });
    default: return false;
  }
}

async function tick() {
  try {
    const db = getFirestoreAdmin();
    const now = new Date();
    const snap = await db.collectionGroup("schedules").where("enabled", "==", true).get();
    for (const doc of snap.docs) {
      const s = doc.data() as ScheduleDoc;
      if (!s.cronExpression || !cronMatch(s.cronExpression, now)) continue;
      // De-dupe: skip if already fired this minute.
      const last = toMs(s.lastRun);
      if (last && Math.floor(last / 60000) === Math.floor(now.getTime() / 60000)) continue;
      const deviceId = s.deviceId || doc.ref.parent.parent?.id;
      if (!deviceId) continue;
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
