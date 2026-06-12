// Tender Cells Firebase Cloud Functions
// https://firebase.google.com/docs/functions
// Last updated: 2026-06-11

import * as functions from "firebase-functions";
import * as admin from "firebase-admin";

// Initialize Firebase Admin SDK
if (!admin.apps.length) {
  admin.initializeApp();
}

const db = admin.firestore();

// ============================================================================
// ENVIRONMENT VARIABLES
// ============================================================================

const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY || "";
const ANTHROPIC_API_BASE = "https://api.anthropic.com/v1";

// ============================================================================
// ALERT PROCESSING
// ============================================================================

/**
 * Process alerts from devices (predator detection, hardware faults, health warnings)
 * Triggered by: device publishes to MQTT tc/{deviceId}/alert
 * Firebase Cloud Trigger: writes to /alerts/{deviceId}/{alertId}
 */
export const processAlert = functions.firestore
  .document("alerts/{deviceId}/{alertId}")
  .onCreate(async (snap, context) => {
    const alert = snap.data();
    console.log(`Alert received from device ${context.params.deviceId}:`, alert);

    // TODO: Implement alert routing
    // - Send push notification to user
    // - Store in Firestore with acknowledged flag
    // - Call TenderAI for suggested response
  });

// ============================================================================
// TELEMETRY AGGREGATION
// ============================================================================

/**
 * Aggregate sensor telemetry into daily summaries
 * Triggered by: scheduled daily (01:00 UTC)
 */
export const aggregateTelemetry = functions.pubsub
  .schedule("0 1 * * *")
  .timeZone("UTC")
  .onRun(async (context) => {
    console.log("Aggregating telemetry summaries...");

    // TODO: Query telemetry collection for past 24h
    // TODO: Calculate min/max/avg for temp, humidity, ammonia
    // TODO: Count events (arm motions, cleaning cycles, door opens)
    // TODO: Store summary in /telemetry-summaries/{deviceId}/{date}
  });

// ============================================================================
// SCHEDULE EXECUTION
// ============================================================================

/**
 * Execute scheduled tasks (feeding, watering, cleaning, door opening)
 * Triggered by: scheduled every 5 minutes (cron executor)
 */
export const executeSchedules = functions.pubsub
  .schedule("*/5 * * * *")
  .timeZone("UTC")
  .onRun(async (context) => {
    console.log("Checking schedules for execution...");

    // TODO: Query /schedules collection for enabled schedules
    // TODO: Check if cron expression matches current time
    // TODO: Send MQTT command to device
    // TODO: Log execution to telemetry
  });

// ============================================================================
// CLAUDE AI PROXY
// ============================================================================

interface AiChatRequest {
  system: string;
  messages: Array<{
    role: "user" | "assistant";
    content: string;
  }>;
  max_tokens: number;
}

interface AiChatResponse {
  content: Array<{
    type: string;
    text: string;
  }>;
  stop_reason: string;
}

/**
 * Proxy Claude API calls — keeps API key server-side
 * Endpoint: POST /ai/chat
 * Called from: app/services/aiAgent.ts
 *
 * @param data - AI chat request (system prompt, messages, max tokens)
 * @param context - Firebase Functions context (auth required)
 * @returns Claude API response
 */
export const aiChat = functions.https.onCall(
  async (data: AiChatRequest, context: functions.https.CallableContext) => {
    // Require authentication
    if (!context.auth) {
      throw new functions.https.HttpsError(
        "unauthenticated",
        "User must be authenticated to call AI functions"
      );
    }

    if (!ANTHROPIC_API_KEY) {
      throw new functions.https.HttpsError(
        "internal",
        "ANTHROPIC_API_KEY not configured"
      );
    }

    try {
      const response = await fetch(`${ANTHROPIC_API_BASE}/messages`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": ANTHROPIC_API_KEY,
          "anthropic-version": "2023-06-01",
        },
        body: JSON.stringify({
          model: "claude-sonnet-4-6",
          max_tokens: data.max_tokens || 500,
          system: data.system,
          messages: data.messages,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        console.error("Claude API error:", error);
        throw new functions.https.HttpsError(
          "internal",
          `Claude API error: ${error.error?.message || "unknown"}`
        );
      }

      const result = (await response.json()) as AiChatResponse;
      return result;
    } catch (error) {
      console.error("AI chat error:", error);
      throw new functions.https.HttpsError(
        "internal",
        "Failed to call Claude API"
      );
    }
  }
);

// ============================================================================
// DATA CLEANUP
// ============================================================================

/**
 * Clean up old telemetry data (keep 90 days)
 * Triggered by: scheduled daily (02:00 UTC)
 */
export const cleanupTelemetry = functions.pubsub
  .schedule("0 2 * * *")
  .timeZone("UTC")
  .onRun(async (context) => {
    console.log("Cleaning up old telemetry...");

    const ninetyDaysAgo = new Date();
    ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);

    // TODO: Query /telemetry collection for documents older than 90 days
    // TODO: Delete in batches (Firestore delete limit: 500/batch)
    // TODO: Log cleanup statistics
  });

// ============================================================================
// DEVICE REGISTRATION
// ============================================================================

/**
 * Handle new device registration
 * Triggered by: /devices/{deviceId} document create
 */
export const onDeviceCreated = functions.firestore
  .document("devices/{deviceId}")
  .onCreate(async (snap, context) => {
    const device = snap.data();
    console.log(`Device registered: ${context.params.deviceId}`, device);

    // TODO: Create initial telemetry entry
    // TODO: Set up empty schedules collection
    // TODO: Send welcome alert to user
  });

// ============================================================================
// HEALTH CHECKS
// ============================================================================

/**
 * Health check endpoint for monitoring
 * Endpoint: GET /health
 */
export const health = functions.https.onRequest((req, res) => {
  res.json({
    status: "ok",
    timestamp: new Date().toISOString(),
    version: "0.1.0",
  });
});

console.log("Tender Cells Cloud Functions initialized");
