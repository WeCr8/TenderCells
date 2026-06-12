// mqtt.controller.ts
// MQTT hardware control logic
// Last updated: 2026-06-11

import { Request, Response } from "express";
import mqtt from "mqtt";

interface MQTTMessage {
  [key: string]: any;
}

export class MQTTController {
  private static client: mqtt.MqttClient | null = null;
  private static telemetry: Map<string, MQTTMessage> = new Map();
  private static states: Map<string, MQTTMessage> = new Map();
  private static alerts: Map<string, MQTTMessage[]> = new Map();

  private static initializeClient() {
    if (MQTTController.client) return;

    const brokerUrl = process.env.MQTT_BROKER || "mqtt://localhost:1883";

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
      const payload = JSON.parse(message.toString());
      const topicParts = topic.split("/");

      if (topicParts[2] === "sensors") {
        const deviceId = topicParts[1];
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
    const { state } = req.body; // 'open' or 'close'

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

  sendFeedCommand(req: Request, res: Response) {
    const { deviceId } = req.params;
    const { amount } = req.body; // amount in grams or %

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
    const { action } = req.body; // 'start' or 'stop'

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
    const { joints, speed } = req.body; // joints: [0-360 degrees]

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
    const brokerUrl = process.env.MQTT_BROKER || "mqtt://localhost:1883";

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
