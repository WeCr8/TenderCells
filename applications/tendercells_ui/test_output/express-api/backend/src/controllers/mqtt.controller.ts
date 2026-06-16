// mqtt.controller.ts
// MQTT hardware control logic
// Last updated: 2026-06-12
// CONSTRAINT: All MQTT payloads MUST be JSON strings — no binary, no plain text.

import type { Request, Response } from "express";
import mqtt from "mqtt";
import { AUTH_ENABLED, type AuthedRequest } from "../middleware/auth.js";
import { getFirestoreAdmin } from "../config/firebase-admin.js";

interface MQTTMessage {
  [key: string]: unknown;
}

// ── Payload schema validators ─────────────────────────────────────────────────
// All schemas match the MQTT payload contracts defined in CLAUDE.md §4.
// Validation runs on both inbound (sensor/state/alert) and outbound (commands).

type SchemaField = { type: string; required?: boolean; min?: number; max?: number; values?: string[] };
type Schema = Record<string, SchemaField>;

function validatePayload(payload: unknown, schema: Schema): string | null {
  if (typeof payload !== "object" || payload === null) return "Payload must be a JSON object";
  const obj = payload as Record<string, unknown>;
  for (const [key, rule] of Object.entries(schema)) {
    if (rule.required && !(key in obj)) return `Missing required field: ${key}`;
    if (!(key in obj)) continue;
    const val = obj[key];
    if (rule.type === "number" && typeof val !== "number") return `${key} must be a number`;
    if (rule.type === "string" && typeof val !== "string") return `${key} must be a string`;
    if (rule.type === "boolean" && typeof val !== "boolean") return `${key} must be a boolean`;
    if (rule.type === "array" && !Array.isArray(val)) return `${key} must be an array`;
    if (rule.values && typeof val === "string" && !rule.values.includes(val))
      return `${key} must be one of: ${rule.values.join(", ")}`;
    if (rule.type === "number" && typeof val === "number") {
      if (rule.min !== undefined && val < rule.min) return `${key} must be >= ${rule.min}`;
      if (rule.max !== undefined && val > rule.max) return `${key} must be <= ${rule.max}`;
    }
  }
  return null;
}

const KNOWN_ROUTINES = [
  "egg_collection_routine",
  "cleaning_sweep_routine",
] as const;

const SCHEMAS: Record<string, Schema> = {
  door:    { state:   { type: "string", required: true, values: ["open", "close"] } },
  // Basic Roaming Roost differential drive (classroom rover + real product share this).
  drive:   {
    dir:   { type: "string", required: true, values: ["forward", "back", "left", "right", "stop"] },
    speed: { type: "number", required: false, min: 0, max: 1 },
  },
  // Relay/light: any farm load on/off (heat lamp, water pump, fan, grow light).
  light:   { on:      { type: "boolean", required: true } },
  feed:    { amount:  { type: "number", required: true, min: 1, max: 5000 } },
  clean:   { action:  { type: "string", required: true, values: ["start", "stop"] } },
  routine: { routine: { type: "string", required: true, values: [...KNOWN_ROUTINES] } },
  arm: {
    joints: { type: "array",  required: true },
    speed:  { type: "number", required: false, min: 0, max: 1 },
  },
  // Inbound sensor schema (for validation of received data)
  sensors: {
    temp:         { type: "number" },
    humidity:     { type: "number", min: 0, max: 100 },
    ammonia:      { type: "number", min: 0 },
    feedLevel:    { type: "number", min: 0, max: 100 },
    waterLevel:   { type: "number", min: 0, max: 100 },
    chickenCount: { type: "number", min: 0 },
  },
};

export class MQTTController {
  private static client: mqtt.MqttClient | null = null;
  private static telemetry: Map<string, MQTTMessage> = new Map();
  private static states: Map<string, MQTTMessage> = new Map();
  private static alerts: Map<string, MQTTMessage[]> = new Map();

  private static initializeClient() {
    if (MQTTController.client) return;

    // FIX(2026-06-15): default to the embedded broker's actual port (MQTT_PORT).
    // Without this, setting MQTT_PORT (the documented Windows EADDRINUSE workaround)
    // moves the broker but the bridge still dialed :1883 → no ingest, every device 404s.
    const brokerUrl =
      process.env.MQTT_BROKER || `mqtt://localhost:${process.env.MQTT_PORT || 1883}`;

    try {
      MQTTController.client = mqtt.connect(brokerUrl, {
        clientId: `express-api-${Date.now()}`,
        reconnectPeriod: 5000,
        keepalive: 60,
      });

      MQTTController.client.on("connect", () => {
        console.log("✓ MQTT connected to", brokerUrl);
        // Subscribe to all sensor topics
        MQTTController.client!.subscribe("tc/+/sensors", { qos: 0 });
        MQTTController.client!.subscribe("tc/+/state", { qos: 1 });
        MQTTController.client!.subscribe("tc/+/alert", { qos: 2 });
      });

      MQTTController.client.on("message", (topic, message) => {
        MQTTController.handleMessage(topic, message);
      });

      MQTTController.client.on("error", (error) => {
        console.error("✗ MQTT error:", error);
      });
    } catch (error) {
      console.error("Failed to initialize MQTT:", error);
    }
  }

  private static handleMessage(topic: string, message: Buffer) {
    try {
      // Constraint: reject non-JSON payloads immediately
      const raw = message.toString().trim();
      if (!raw.startsWith("{") && !raw.startsWith("[")) {
        console.warn(`[MQTT] Non-JSON payload on ${topic} — ignored`);
        return;
      }
      const payload = JSON.parse(raw) as MQTTMessage;
      const topicParts = topic.split("/");

      if (topicParts[2] === "sensors") {
        const deviceId = topicParts[1];
        const err = validatePayload(payload, SCHEMAS.sensors);
        if (err) console.warn(`[MQTT] Sensor schema warning (${deviceId}): ${err}`);
        MQTTController.telemetry.set(deviceId, payload);
      } else if (topicParts[2] === "state") {
        const deviceId = topicParts[1];
        MQTTController.states.set(deviceId, payload);
      } else if (topicParts[2] === "alert") {
        const deviceId = topicParts[1];
        const alerts = MQTTController.alerts.get(deviceId) || [];
        alerts.push(payload);
        MQTTController.alerts.set(deviceId, alerts.slice(-100)); // Keep last 100
      }
    } catch (error) {
      console.error("Failed to parse MQTT message:", error);
    }
  }

  getTelemetry(req: Request, res: Response) {
    const { deviceId } = req.params;
    const telemetry = MQTTController.telemetry.get(deviceId);

    if (!telemetry) {
      return res.status(404).json({
        error: "No telemetry data for device",
        deviceId,
      });
    }

    res.json({
      deviceId,
      timestamp: Date.now(),
      data: telemetry,
    });
  }

  getState(req: Request, res: Response) {
    const { deviceId } = req.params;
    const state = MQTTController.states.get(deviceId);

    if (!state) {
      return res.status(404).json({
        error: "No state data for device",
        deviceId,
      });
    }

    res.json({
      deviceId,
      timestamp: Date.now(),
      data: state,
    });
  }

  getAlerts(req: Request, res: Response) {
    const { deviceId } = req.params;
    const alerts = MQTTController.alerts.get(deviceId) || [];

    res.json({
      deviceId,
      count: alerts.length,
      alerts,
    });
  }

  sendDoorCommand(req: Request, res: Response) {
    const { deviceId } = req.params;
    const { state } = req.body;

    const err = validatePayload(req.body, SCHEMAS.door);
    if (err) return res.status(400).json({ error: err });
    if (!MQTTController.client?.connected) {
      return res.status(503).json({ error: "MQTT not connected" });
    }

    const topic = `tc/${deviceId}/cmd/door`;
    const payload = { state, timestamp: Date.now() };
    MQTTController.client.publish(topic, JSON.stringify(payload), { qos: 1 });

    res.json({
      success: true,
      deviceId,
      command: "door",
      state,
      message: "Door command sent",
    });
  }

  sendDriveCommand(req: Request, res: Response) {
    const { deviceId } = req.params;
    const { dir, speed } = req.body;

    const err = validatePayload(req.body, SCHEMAS.drive);
    if (err) return res.status(400).json({ error: err });
    if (!MQTTController.client?.connected) {
      return res.status(503).json({ error: "MQTT not connected" });
    }

    // Local-only motion (never cloud) — same QoS 1 contract as the door.
    const topic = `tc/${deviceId}/cmd/drive`;
    const payload = { dir, speed: speed ?? 0.5, timestamp: Date.now() };
    MQTTController.client.publish(topic, JSON.stringify(payload), { qos: 1 });

    res.json({
      success: true,
      deviceId,
      command: "drive",
      dir,
      message: "Drive command sent",
    });
  }

  // Bind a device to the signed-in account (first-claim-wins). After this, only the
  // owner can actuate it (see requireDeviceOwner). No-op in demo/LAN mode (no auth).
  async claimDevice(req: Request, res: Response) {
    const { deviceId } = req.params;
    const uid = (req as AuthedRequest).uid;

    if (!AUTH_ENABLED || !uid) {
      return res.json({
        success: true,
        deviceId,
        claimed: false,
        note: "Demo/LAN mode — no account binding required",
      });
    }

    try {
      const db = getFirestoreAdmin();
      const ref = db.collection("devices").doc(deviceId);
      const result = await db.runTransaction(async (tx) => {
        const snap = await tx.get(ref);
        const existing = snap.exists ? (snap.data()?.ownerId as string | undefined) : undefined;
        if (existing && existing !== uid) return { ok: false as const, ownerId: existing };
        tx.set(ref, { ownerId: uid, claimedAt: Date.now() }, { merge: true });
        return { ok: true as const, ownerId: uid };
      });

      if (!result.ok) {
        return res.status(409).json({ error: "Device already claimed by another account" });
      }
      return res.json({ success: true, deviceId, claimed: true, ownerId: uid });
    } catch {
      return res.status(500).json({ error: "Claim failed" });
    }
  }

  sendLightCommand(req: Request, res: Response) {
    const { deviceId } = req.params;
    const { on } = req.body;

    const err = validatePayload(req.body, SCHEMAS.light);
    if (err) return res.status(400).json({ error: err });
    if (!MQTTController.client?.connected) {
      return res.status(503).json({ error: "MQTT not connected" });
    }

    const topic = `tc/${deviceId}/cmd/light`;
    MQTTController.client.publish(topic, JSON.stringify({ on, timestamp: Date.now() }), { qos: 1 });

    res.json({ success: true, deviceId, command: "light", on, message: "Light/relay command sent" });
  }

  sendFeedCommand(req: Request, res: Response) {
    const { deviceId } = req.params;
    const { amount } = req.body;

    const err = validatePayload(req.body, SCHEMAS.feed);
    if (err) return res.status(400).json({ error: err });
    if (!MQTTController.client?.connected) {
      return res.status(503).json({ error: "MQTT not connected" });
    }

    const topic = `tc/${deviceId}/cmd/feed`;
    const payload = { amount, timestamp: Date.now() };

    MQTTController.client.publish(topic, JSON.stringify(payload), { qos: 1 });

    res.json({
      success: true,
      deviceId,
      command: "feed",
      amount,
      message: "Feed command sent",
    });
  }

  sendCleanCommand(req: Request, res: Response) {
    const { deviceId } = req.params;
    const { action } = req.body;

    const err = validatePayload(req.body, SCHEMAS.clean);
    if (err) return res.status(400).json({ error: err });
    if (!MQTTController.client?.connected) {
      return res.status(503).json({ error: "MQTT not connected" });
    }

    const topic = `tc/${deviceId}/cmd/clean`;
    const payload = { action, timestamp: Date.now() };

    MQTTController.client.publish(topic, JSON.stringify(payload), { qos: 1 });

    res.json({
      success: true,
      deviceId,
      command: "clean",
      action,
      message: "Cleaning command sent",
    });
  }

  sendArmCommand(req: Request, res: Response) {
    const { deviceId } = req.params;
    const { joints, speed } = req.body;

    const err = validatePayload(req.body, SCHEMAS.arm);
    if (err) return res.status(400).json({ error: err });
    if (!Array.isArray(joints) || joints.length !== 6)
      return res.status(400).json({ error: "joints must be an array of 6 angles" });
    if (!MQTTController.client?.connected) {
      return res.status(503).json({ error: "MQTT not connected" });
    }

    const topic = `tc/${deviceId}/cmd/arm`;
    const payload = {
      seq: Date.now(),
      joints,
      speed: speed || 0.5,
      timestamp: Date.now()
    };

    MQTTController.client.publish(topic, JSON.stringify(payload), { qos: 1 });

    res.json({
      success: true,
      deviceId,
      command: "arm",
      joints,
      message: "Arm command sent",
    });
  }

  sendRoutineCommand(req: Request, res: Response) {
    const { deviceId } = req.params;
    const { routine } = req.body;

    const err = validatePayload(req.body, SCHEMAS.routine);
    if (err) return res.status(400).json({ error: err });
    if (!MQTTController.client?.connected) {
      return res.status(503).json({ error: "MQTT not connected" });
    }

    // Routines publish to cmd/motion — Jetson Nano interprets the routine name
    const topic = `tc/${deviceId}/cmd/motion`;
    const payload = {
      seq: Date.now(),
      routine,
      timestamp: Date.now(),
    };

    MQTTController.client.publish(topic, JSON.stringify(payload), { qos: 1 });

    res.json({
      success: true,
      deviceId,
      command: "routine",
      routine,
      message: `Routine '${routine}' dispatched`,
    });
  }

  sendEstop(req: Request, res: Response) {
    const { deviceId } = req.params;

    if (!MQTTController.client?.connected) {
      return res.status(503).json({ error: "MQTT not connected" });
    }

    const topic = `tc/${deviceId}/cmd/estop`;
    const payload = { active: true, timestamp: Date.now() };

    // E-STOP uses QoS 2 and retained
    MQTTController.client.publish(topic, JSON.stringify(payload), {
      qos: 2,
      retain: true
    });

    res.json({
      success: true,
      deviceId,
      command: "estop",
      message: "E-STOP activated",
    });
  }

  getMQTTStatus(req: Request, res: Response) {
    const connected = MQTTController.client?.connected || false;
    // FIX(2026-06-15): default to the embedded broker's actual port (MQTT_PORT).
    // Without this, setting MQTT_PORT (the documented Windows EADDRINUSE workaround)
    // moves the broker but the bridge still dialed :1883 → no ingest, every device 404s.
    const brokerUrl =
      process.env.MQTT_BROKER || `mqtt://localhost:${process.env.MQTT_PORT || 1883}`;

    res.json({
      connected,
      broker: brokerUrl,
      devices: Array.from(MQTTController.telemetry.keys()),
      telemetryCount: MQTTController.telemetry.size,
      alertsCount: Array.from(MQTTController.alerts.values())
        .reduce((sum, alerts) => sum + alerts.length, 0),
    });
  }

  connectMQTT(req: Request, res: Response) {
    if (MQTTController.client?.connected) {
      return res.json({
        connected: true,
        message: "Already connected",
      });
    }

    MQTTController.initializeClient();

    res.json({
      connecting: true,
      message: "MQTT connection initiated",
    });
  }

  static initialize() {
    MQTTController.initializeClient();
  }
}

// Initialize on module load
MQTTController.initialize();
