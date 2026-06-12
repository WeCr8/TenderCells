// Tender Cells Firebase Cloud Functions
// Node 18 · CommonJS · firebase-functions v5 (v1 compat API)

import * as functions from "firebase-functions";
import * as admin from "firebase-admin";

if (!admin.apps.length) {
  admin.initializeApp();
}

const db = admin.firestore();
const rtdb = admin.database();

// ============================================================================
// ENVIRONMENT
// ============================================================================

const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY || "";
const ANTHROPIC_API_BASE = "https://api.anthropic.com/v1";
const TELEMETRY_RETENTION_DAYS = 90;
const BATCH_SIZE = 500;

// ============================================================================
// TYPES
// ============================================================================

interface AlertDoc {
  type: "predator" | "fault" | "health";
  severity?: "critical" | "warning" | "info";
  message?: string;
  confidence?: number;
  deviceId: string;
  code?: number;
  acknowledged: boolean;
  ts: number;
}

interface ScheduleDoc {
  deviceId: string;
  action: "feed" | "clean" | "door" | "water";
  cronExpression: string;
  enabled: boolean;
  lastRun?: admin.firestore.Timestamp | null;
}

interface TelemetryReading {
  temperature: number;
  humidity: number;
  ammonia: number;
  feedLevel: number;
  waterLevel: number;
  chickenCount: number;
  doorState: "open" | "closed" | "unknown";
  systemState: "idle" | "running" | "error" | "estop";
  timestamp: admin.firestore.Timestamp;
}

interface AiChatRequest {
  system: string;
  messages: Array<{ role: "user" | "assistant"; content: string }>;
  max_tokens?: number;
}

// ============================================================================
// CRON MATCHER (no external dep)
// Supports: * / , - operators, standard 5-field cron (UTC)
// ============================================================================

function cronMatches(expression: string, now: Date): boolean {
  const parts = expression.trim().split(/\s+/);
  if (parts.length !== 5) return false;
  const [minStr, hourStr, domStr, monthStr, dowStr] = parts;

  const matchField = (field: string, value: number): boolean => {
    if (field === "*") return true;
    if (field.includes("/")) {
      const [base, step] = field.split("/");
      const start = base === "*" ? 0 : parseInt(base, 10);
      return value >= start && (value - start) % parseInt(step, 10) === 0;
    }
    if (field.includes(",")) return field.split(",").some((v) => parseInt(v, 10) === value);
    if (field.includes("-")) {
      const [start, end] = field.split("-").map(Number);
      return value >= start && value <= end;
    }
    return parseInt(field, 10) === value;
  };

  return (
    matchField(minStr, now.getUTCMinutes()) &&
    matchField(hourStr, now.getUTCHours()) &&
    matchField(domStr, now.getUTCDate()) &&
    matchField(monthStr, now.getUTCMonth() + 1) &&
    matchField(dowStr, now.getUTCDay())
  );
}

// ============================================================================
// ALERT PROCESSING
// ============================================================================

/**
 * Process alerts from devices (predator detection, hardware faults, health warnings).
 * Triggered by Firestore write to /alerts/{deviceId}/{alertId}.
 * Updates device state and queues push notification to Realtime DB.
 */
export const processAlert = functions.firestore
  .document("alerts/{deviceId}/{alertId}")
  .onCreate(async (snap, context) => {
    const { deviceId, alertId } = context.params as { deviceId: string; alertId: string };
    const alert = snap.data() as AlertDoc;

    if (!alert.type || !alert.deviceId) {
      console.warn(`[processAlert] Malformed alert ${alertId} from ${deviceId}`);
      return null;
    }

    const severity: "critical" | "warning" | "info" =
      alert.type === "predator" ? "critical"
        : alert.type === "fault" ? "warning"
          : "info";

    // Stamp the alert document with server-side fields
    await snap.ref.update({
      acknowledged: false,
      severity,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    // Update device document with latest alert summary
    const deviceRef = db.doc(`devices/${deviceId}`);
    const deviceSnap = await deviceRef.get();
    if (deviceSnap.exists) {
      await deviceRef.update({
        lastAlert: {
          type: alert.type,
          severity,
          message: alert.message || `${alert.type} detected`,
          alertId,
          ts: alert.ts || Date.now(),
        },
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      });
    }

    // Queue push notification via Realtime DB (FCM bridge reads /notifications/{deviceId})
    await rtdb.ref(`notifications/${deviceId}`).push({
      alertId,
      type: alert.type,
      severity,
      title: severity === "critical" ? "⚠️ PREDATOR ALERT" : severity === "warning" ? "Hardware Fault" : "Health Notice",
      message: alert.message || `${alert.type} detected on device ${deviceId}`,
      confidence: alert.confidence ?? null,
      deviceId,
      ts: Date.now(),
      sent: false,
    });

    console.log(`[processAlert] ${severity.toUpperCase()} alert ${alertId} from ${deviceId}: ${alert.type}`);
    return null;
  });

// ============================================================================
// TELEMETRY AGGREGATION
// ============================================================================

/**
 * Aggregate 24-hour sensor telemetry into daily summaries per device.
 * Runs daily at 01:00 UTC. Reads from /telemetry/{deviceId}/readings.
 * Writes min/max/avg stats to /telemetry-summaries/{deviceId}/{YYYY-MM-DD}.
 */
export const aggregateTelemetry = functions.pubsub
  .schedule("0 1 * * *")
  .timeZone("UTC")
  .onRun(async (_context) => {
    console.log("[aggregateTelemetry] Starting daily aggregation");

    const devicesSnap = await db.collection("devices").get();

    const yesterday = new Date();
    yesterday.setUTCDate(yesterday.getUTCDate() - 1);
    yesterday.setUTCHours(0, 0, 0, 0);
    const dayEnd = new Date(yesterday.getTime() + 86_400_000);
    const dateKey = yesterday.toISOString().slice(0, 10);

    let processed = 0;

    for (const deviceDoc of devicesSnap.docs) {
      const deviceId = deviceDoc.id;
      try {
        const readingsSnap = await db
          .collection(`telemetry/${deviceId}/readings`)
          .where("timestamp", ">=", admin.firestore.Timestamp.fromDate(yesterday))
          .where("timestamp", "<", admin.firestore.Timestamp.fromDate(dayEnd))
          .orderBy("timestamp")
          .get();

        if (readingsSnap.empty) continue;

        const readings = readingsSnap.docs.map((d) => d.data() as TelemetryReading);
        const numericFields: Array<keyof TelemetryReading & ("temperature" | "humidity" | "ammonia" | "feedLevel" | "waterLevel" | "chickenCount")> =
          ["temperature", "humidity", "ammonia", "feedLevel", "waterLevel", "chickenCount"];

        const stats: Record<string, { min: number; max: number; avg: number; samples: number }> = {};
        for (const field of numericFields) {
          const values = readings.map((r) => r[field]).filter((v): v is number => typeof v === "number");
          if (!values.length) continue;
          stats[field] = {
            min: Math.min(...values),
            max: Math.max(...values),
            avg: parseFloat((values.reduce((a, b) => a + b, 0) / values.length).toFixed(2)),
            samples: values.length,
          };
        }

        const doorClosed = readings.filter((r) => r.doorState === "closed").length;
        const doorOpen = readings.filter((r) => r.doorState === "open").length;

        await db.doc(`telemetry-summaries/${deviceId}/${dateKey}`).set({
          deviceId,
          date: dateKey,
          readingCount: readings.length,
          stats,
          doorDistribution: { closed: doorClosed, open: doorOpen, other: readings.length - doorClosed - doorOpen },
          createdAt: admin.firestore.FieldValue.serverTimestamp(),
        });

        processed++;
        console.log(`[aggregateTelemetry] ${deviceId}: ${readings.length} readings aggregated`);
      } catch (err) {
        console.error(`[aggregateTelemetry] Error for device ${deviceId}:`, err);
      }
    }

    console.log(`[aggregateTelemetry] Done. ${processed}/${devicesSnap.size} devices processed.`);
    return null;
  });

// ============================================================================
// SCHEDULE EXECUTION
// ============================================================================

/**
 * Execute scheduled tasks (feed, water, clean, door) every 5 minutes.
 * Reads enabled schedules from /schedules/{deviceId}/items/{scheduleId}.
 * Writes pending commands to Realtime DB /pending-commands/{deviceId}/{pushId}.
 * MQTT bridge (express-api on Pi) listens to RTDB and publishes MQTT commands.
 *
 * NOTE: Motion commands (arm/gantry) are NEVER routed through Firebase.
 * Only scheduled maintenance tasks (door, feed, water, clean) use this path.
 */
export const executeSchedules = functions.pubsub
  .schedule("*/5 * * * *")
  .timeZone("UTC")
  .onRun(async (_context) => {
    const now = new Date();
    console.log(`[executeSchedules] Checking at ${now.toISOString()}`);

    const devicesSnap = await db.collection("devices").get();
    let fired = 0;

    for (const deviceDoc of devicesSnap.docs) {
      const deviceId = deviceDoc.id;
      const schedulesSnap = await db
        .collection(`schedules/${deviceId}/items`)
        .where("enabled", "==", true)
        .get();

      for (const schedDoc of schedulesSnap.docs) {
        const schedule = schedDoc.data() as ScheduleDoc;

        if (!schedule.cronExpression) continue;
        if (!cronMatches(schedule.cronExpression, now)) continue;

        // Skip if already ran within the last 4 minutes (prevent duplicate fire)
        if (schedule.lastRun) {
          const lastRunMs = schedule.lastRun.toMillis();
          if (now.getTime() - lastRunMs < 4 * 60_000) continue;
        }

        // Build command payload
        const command: Record<string, unknown> = {
          action: schedule.action,
          deviceId,
          scheduleId: schedDoc.id,
          source: "schedule",
          ts: Date.now(),
        };
        if (schedule.action === "door") command.state = "open";
        if (schedule.action === "feed") command.amount = 100; // grams
        if (schedule.action === "water") command.amount = 500; // ml
        if (schedule.action === "clean") command.mode = "sweep";

        // Write to Realtime DB — express-api bridge picks this up and publishes MQTT
        await rtdb.ref(`pending-commands/${deviceId}`).push(command);

        // Mark schedule as run
        await schedDoc.ref.update({ lastRun: admin.firestore.FieldValue.serverTimestamp() });

        console.log(`[executeSchedules] Fired '${schedule.action}' for device ${deviceId}`);
        fired++;
      }
    }

    console.log(`[executeSchedules] ${fired} schedule(s) fired.`);
    return null;
  });

// ============================================================================
// DATA CLEANUP
// ============================================================================

/**
 * Delete telemetry readings older than 90 days in batches of 500.
 * Runs daily at 02:00 UTC.
 */
export const cleanupTelemetry = functions.pubsub
  .schedule("0 2 * * *")
  .timeZone("UTC")
  .onRun(async (_context) => {
    console.log("[cleanupTelemetry] Starting 90-day cleanup");

    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - TELEMETRY_RETENTION_DAYS);
    const cutoffTs = admin.firestore.Timestamp.fromDate(cutoff);

    const devicesSnap = await db.collection("devices").get();
    let totalDeleted = 0;

    for (const deviceDoc of devicesSnap.docs) {
      const deviceId = deviceDoc.id;
      let deviceDeleted = 0;
      let hasMore = true;

      while (hasMore) {
        const staleSnap = await db
          .collection(`telemetry/${deviceId}/readings`)
          .where("timestamp", "<", cutoffTs)
          .limit(BATCH_SIZE)
          .get();

        if (staleSnap.empty) {
          hasMore = false;
          break;
        }

        const batch = db.batch();
        staleSnap.docs.forEach((doc) => batch.delete(doc.ref));
        await batch.commit();

        deviceDeleted += staleSnap.size;
        hasMore = staleSnap.size === BATCH_SIZE;
      }

      if (deviceDeleted > 0) {
        console.log(`[cleanupTelemetry] Deleted ${deviceDeleted} stale readings for ${deviceId}`);
        totalDeleted += deviceDeleted;
      }
    }

    console.log(`[cleanupTelemetry] Done. Total deleted: ${totalDeleted} documents.`);
    return null;
  });

// ============================================================================
// DEVICE REGISTRATION
// ============================================================================

/**
 * Initialize a new device when its Firestore document is created.
 * Sets up /device-states/{deviceId}, default schedules, and welcome notification.
 */
export const onDeviceCreated = functions.firestore
  .document("devices/{deviceId}")
  .onCreate(async (snap, context) => {
    const { deviceId } = context.params as { deviceId: string };
    const device = snap.data() as { nickname?: string; productType?: string };

    console.log(`[onDeviceCreated] New device: ${deviceId} (${device.productType || "unknown"})`);

    // Create initial state document
    await db.doc(`device-states/${deviceId}`).set({
      deviceId,
      systemState: "idle",
      hardwareConnected: false,
      lastSeen: null,
      lastAlert: null,
      uptime: 0,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    // Create default disabled schedules under /schedules/{deviceId}/items/{id}
    const defaults: Array<{ id: string } & Omit<ScheduleDoc, "deviceId">> = [
      { id: "door-open-morning",  action: "door",  cronExpression: "0 7 * * *",  enabled: false },
      { id: "door-close-evening", action: "door",  cronExpression: "0 20 * * *", enabled: false },
      { id: "morning-feed",       action: "feed",  cronExpression: "0 8 * * *",  enabled: false },
      { id: "evening-feed",       action: "feed",  cronExpression: "0 17 * * *", enabled: false },
      { id: "daily-water",        action: "water", cronExpression: "0 9 * * *",  enabled: false },
      { id: "weekly-clean",       action: "clean", cronExpression: "0 10 * 0 *", enabled: false },
    ];

    const batch = db.batch();
    for (const { id, ...fields } of defaults) {
      batch.set(db.doc(`schedules/${deviceId}/items/${id}`), {
        ...fields,
        deviceId,
        lastRun: null,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
      });
    }
    await batch.commit();

    // Queue welcome notification
    await rtdb.ref(`notifications/${deviceId}`).push({
      type: "system",
      title: "Device Registered",
      message: `${device.nickname || deviceId} is ready. Enable schedules to automate your coop.`,
      ts: Date.now(),
      sent: false,
    });

    console.log(`[onDeviceCreated] Setup complete for ${deviceId}`);
    return null;
  });

// ============================================================================
// CLAUDE AI PROXY
// ============================================================================

/**
 * Proxy authenticated Claude API calls — keeps API key server-side.
 * Called from app/services/aiAgent.ts via Firebase Functions SDK.
 * Requires Firebase Auth. Rate limited to 1000 tokens max per request.
 */
export const aiChat = functions.https.onCall(
  async (data: AiChatRequest, context: functions.https.CallableContext) => {
    if (!context.auth) {
      throw new functions.https.HttpsError("unauthenticated", "Authentication required");
    }
    if (!ANTHROPIC_API_KEY) {
      throw new functions.https.HttpsError("internal", "ANTHROPIC_API_KEY not configured in Cloud Functions environment");
    }
    if (!Array.isArray(data.messages) || data.messages.length === 0) {
      throw new functions.https.HttpsError("invalid-argument", "messages array is required");
    }

    const maxTokens = Math.min(data.max_tokens ?? 500, 1000);

    let response: Response;
    try {
      response = await fetch(`${ANTHROPIC_API_BASE}/messages`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": ANTHROPIC_API_KEY,
          "anthropic-version": "2023-06-01",
        },
        body: JSON.stringify({
          model: "claude-sonnet-4-6",
          max_tokens: maxTokens,
          system: data.system || "",
          messages: data.messages,
        }),
      });
    } catch (err) {
      console.error("[aiChat] Network error calling Claude API:", err);
      throw new functions.https.HttpsError("unavailable", "Could not reach Claude API");
    }

    if (!response.ok) {
      const errorBody = await response.json() as { error?: { message?: string } };
      const msg = errorBody.error?.message ?? response.statusText;
      console.error(`[aiChat] Claude API ${response.status}: ${msg}`);
      throw new functions.https.HttpsError("internal", `Claude API error: ${msg}`);
    }

    return response.json();
  }
);

// ============================================================================
// HEALTH CHECK
// ============================================================================

/**
 * Health check endpoint for monitoring and uptime checks.
 * GET /health — returns 200 with service status.
 */
export const health = functions.https.onRequest((_req, res) => {
  res.json({
    status: "ok",
    service: "tender-cells-functions",
    version: "0.1.0",
    timestamp: new Date().toISOString(),
    environment: process.env.FUNCTIONS_EMULATOR ? "emulator" : "production",
  });
});

console.log("[TenderCells] Cloud Functions initialized");
