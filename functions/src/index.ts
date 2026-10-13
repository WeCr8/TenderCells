// Tender Cells Firebase Cloud Functions
// Node 18 · CommonJS · firebase-functions v5 (v1 compat API)

import * as functions from "firebase-functions";
import * as admin from "firebase-admin";
import { sanitizeAiChat } from "./aiChatPolicy";
import { runSchedules } from "./scheduleRunner";
import { deviceApiStore, keyAdminStore, scheduleRunStore } from "./firestoreStores";
import { createDeviceApi, issueKey, KeyAdminError, listKeys, revokeKey } from "./deviceApi";

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
// ALERT PROCESSING
// ============================================================================

/**
 * Process alerts from devices (predator detection, hardware faults, health warnings).
 * Triggered by Firestore write to /alerts/{deviceId}/items/{alertId}.
 * Updates device state and queues push notification to Realtime DB.
 */
export const processAlert = functions.firestore
  .document("alerts/{deviceId}/items/{alertId}")
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
 * Queue due schedules every 5 minutes (feed, water, door, clean, weed pass).
 * Reads enabled schedules from /schedules/{deviceId}/items/{scheduleId}, matches each cron in the
 * schedule's own time zone over the last 5 minutes, and queues the schedule's real command at
 * /deviceCommands/{deviceId}/queue/{sched_<scheduleId>_<minute>} (scheduleExec.ts, scheduleRunner.ts).
 * Delivered by: the farm hub's schedule runner (local MQTT, after its E-STOP / work-area checks),
 * or the device itself via deviceApi GET /v1/devices/:id/commands with an API key.
 * Skips devices in E-STOP or offline, and schedules with no known time zone.
 * Never sends robot motion to a hubless device (deviceApi holds clean / weed passes).
 */
export const executeSchedules = functions.pubsub
  .schedule("*/5 * * * *")
  .timeZone("UTC")
  .onRun(async (context) => {
    const toMs = Date.parse(context.timestamp) || Date.now();
    const fromMs = toMs - 5 * 60_000;
    const summary = await runSchedules(scheduleRunStore(db), fromMs, toMs);
    for (const s of summary.skipped) {
      if (s.reason !== "offline") console.log(`[executeSchedules] skipped ${s.deviceId}${s.scheduleId ? `/${s.scheduleId}` : ""}: ${s.reason}`);
    }
    console.log(`[executeSchedules] ${summary.queued.length} command(s) queued for ${new Date(fromMs).toISOString()}..${new Date(toMs).toISOString()}`);
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
 * Sets up /device-states/{deviceId} and a welcome notification.
 * Schedules are created only by an owner for capabilities installed on that device.
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
 * Requires Firebase Auth. Input is validated and capped by sanitizeAiChat (aiChatPolicy.ts):
 * at most 20 turns of 4000 characters and 1000 output tokens per request.
 */
export const aiChat = functions.https.onCall(
  async (data: AiChatRequest, context: functions.https.CallableContext) => {
    if (!context.auth) {
      throw new functions.https.HttpsError("unauthenticated", "Authentication required");
    }
    if (!ANTHROPIC_API_KEY) {
      throw new functions.https.HttpsError("internal", "ANTHROPIC_API_KEY not configured in Cloud Functions environment");
    }
    const payload = sanitizeAiChat(data);
    if ("error" in payload) {
      throw new functions.https.HttpsError("invalid-argument", payload.error);
    }

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
          max_tokens: payload.max_tokens,
          system: payload.system,
          messages: payload.messages,
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

// ============================================================================
// AI ASSISTANT CONNECTOR (Claude, ChatGPT)
// ============================================================================

type ConnectorHandler = (req: unknown, res: unknown) => void;
let connector: ConnectorHandler | undefined;

/**
 * Hosted Tender Cells connector for Claude and ChatGPT (MCP + OAuth 2.1), served through
 * Hosting rewrites at tendercells.com/mcp, /mcp/demo, /oauth/* and /.well-known/oauth-*.
 * Read-only by design: it reads devices the signed-in person owns and never moves hardware.
 * Source: express-api/backend/src/mcp/ (bundled into lib/connector by scripts/build-connector.mjs).
 */
export const mcp = functions
  .runWith({ memory: "512MB", timeoutSeconds: 60, maxInstances: 10 })
  .https.onRequest((req, res) => {
    // Loaded on first request so the other functions' cold starts don't pay for it.
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    connector ??= require("./connector/index.js").createConnectorApp(admin) as ConnectorHandler;
    connector(req, res);
  });

// ============================================================================
// ROBOT / HUB API KEYS + DEVICE API
// ============================================================================

let deviceApp: ReturnType<typeof createDeviceApi> | undefined;

/**
 * Cloud API for robots, hubs and starter nodes (deviceApi.ts). Accepts a Tender Cells API key
 * (Authorization: Bearer tck_… / X-TC-Api-Key) or a Firebase ID token.
 */
export const deviceApi = functions
  .runWith({ memory: "256MB", timeoutSeconds: 30, maxInstances: 10 })
  .https.onRequest((req, res) => {
    deviceApp ??= createDeviceApi({ store: deviceApiStore(db), verifyIdToken: (t) => admin.auth().verifyIdToken(t, true) });
    deviceApp(req, res);
  });

const keyCall = <T>(fn: (uid: string, data: Record<string, unknown>) => Promise<T>) =>
  functions.https.onCall(async (data: Record<string, unknown>, context: functions.https.CallableContext) => {
    // Firebase ID token only: an API key can never mint, list or revoke keys.
    if (!context.auth) throw new functions.https.HttpsError("unauthenticated", "Sign in to manage API keys");
    try {
      return await fn(context.auth.uid, data ?? {});
    } catch (err) {
      if (err instanceof KeyAdminError) throw new functions.https.HttpsError(err.code, err.message);
      console.error("[apiKeys] failed:", (err as Error)?.message ?? err);
      throw new functions.https.HttpsError("unavailable", "Could not update API keys right now");
    }
  });

/** Issue a robot/hub API key. The key is returned once; only its SHA-256 hash is stored. */
export const createApiKey = keyCall((uid, data) => issueKey(keyAdminStore(db), uid, data));
/** The signed-in person's API keys (never the keys themselves). */
export const listApiKeys = keyCall((uid) => listKeys(keyAdminStore(db), uid));
/** Revoke one of the signed-in person's API keys (hub caches keys for up to 30 s). */
export const revokeApiKey = keyCall((uid, data) => revokeKey(keyAdminStore(db), uid, data.keyId));

console.log("[TenderCells] Cloud Functions initialized");

export {
  claimSchoolMembership,
  cameraRelaySignal,
  configureSchoolOrganization,
  createCameraRelaySession,
  createOrganizationInvoice,
  createPurchaseOrder,
  getSchoolLoginOptions,
  syncSchoolRoster,
} from "./schoolPlatform";

export { createBillingCheckout, createBillingPortal, stripeBillingWebhook } from "./billing";

// Newsletter double opt-in + email preferences (Trigger Email extension via the `mail` collection).
export { onNewsletterSignup, confirmNewsletter, unsubscribeNewsletter, syncEmailPreferences } from "./email";
