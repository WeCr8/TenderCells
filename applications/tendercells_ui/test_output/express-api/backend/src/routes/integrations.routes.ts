// integrations.routes.ts - Connect My Property, M1: read-only discovery + import.
//
// Off by default (TC_CONNECT_PROPERTY_ENABLED unset or not "1"/"true") - every route 404s
// with FEATURE_DISABLED until explicitly turned on, same shape as the mower/MCP action
// flags elsewhere in this hub. Owner-gated the same way products.routes.ts is: a signed-in
// person only, and every read/write is scoped to that caller's own ownerId. No route here
// can ever set controlEnabled true or send a device a command - that is out of scope until
// a capability-policy review ships in a later milestone.
import { Router } from "express";
import type { NextFunction, Request, Response } from "express";
import { requireAuth, requirePerson, type AuthedRequest } from "../middleware/auth.js";
import { startDiscovery, getDiscoveryJob } from "../integrations/discoveryService.js";
import { importCandidate, listForOwner, disable } from "../integrations/registry.js";
import { HA_CONFIGURED, testConnection as testHaConnection } from "../integrations/homeAssistantAdapter.js";
import { testConnection as testMqttConnection, validateTopicPatterns, type MqttConnectOptions } from "../integrations/mqttImportAdapter.js";
import type { AdapterKind } from "../integrations/types.js";

const CONNECT_PROPERTY_ENABLED = /^(1|true)$/i.test(process.env.TC_CONNECT_PROPERTY_ENABLED || "");
const KNOWN_ADAPTERS: AdapterKind[] = ["home_assistant", "mqtt", "onvif", "rtsp", "mjpeg"];

const router = Router();

function requireFeatureFlag(_req: Request, res: Response, next: NextFunction): void {
  if (!CONNECT_PROPERTY_ENABLED) {
    res.status(404).json({ error: "FEATURE_DISABLED", message: "Connect My Property is not enabled on this gateway." });
    return;
  }
  next();
}

router.use(requireFeatureFlag);
router.use(requireAuth);
router.use(requirePerson);

const uidOf = (req: Request) => (req as AuthedRequest).uid as string;

router.get("/", (req, res) => {
  res.json({ integrations: listForOwner(uidOf(req)) });
});

// Pulls MQTT connect options out of the request body. Never logged, never returned in a
// response, never passed to registry.ts - only the resulting candidates (topic name + value)
// are ever staged or persisted.
function mqttOptionsFrom(body: Record<string, unknown>): MqttConnectOptions | null {
  const { brokerUrl, username, password, topics } = body as { brokerUrl?: string; username?: string; password?: string; topics?: string[] };
  if (!brokerUrl || typeof brokerUrl !== "string") return null;
  return { brokerUrl, username, password, topics: Array.isArray(topics) ? topics : [] };
}

router.post("/discover", (req, res) => {
  const { adapter, gatewayId } = req.body as { adapter?: string; gatewayId?: string };
  if (!adapter || !KNOWN_ADAPTERS.includes(adapter as AdapterKind)) {
    res.status(400).json({ error: "INVALID_ADAPTER", message: `adapter must be one of: ${KNOWN_ADAPTERS.join(", ")}` });
    return;
  }
  if (!gatewayId || typeof gatewayId !== "string") {
    res.status(400).json({ error: "MISSING_GATEWAY_ID" });
    return;
  }
  let mqttOptions: MqttConnectOptions | undefined;
  if (adapter === "mqtt") {
    const opts = mqttOptionsFrom(req.body as Record<string, unknown>);
    if (opts) {
      const topicError = validateTopicPatterns(opts.topics);
      if (topicError) {
        res.status(400).json({ error: "INVALID_TOPICS", message: topicError });
        return;
      }
      mqttOptions = opts;
    }
    // No brokerUrl supplied: falls through to the simulated fixture (no gateway configured yet).
  }
  const result = startDiscovery(uidOf(req), gatewayId, adapter as AdapterKind, mqttOptions);
  if (!result.ok) {
    res.status(429).json({ error: result.error });
    return;
  }
  res.json({ job: result.job });
});

router.post("/test", async (req, res) => {
  const { adapter } = req.body as { adapter?: string };
  if (adapter === "home_assistant") {
    if (!HA_CONFIGURED) {
      res.status(409).json({ error: "NOT_CONFIGURED", message: "HA_URL and HA_TOKEN are not set on this hub." });
      return;
    }
    const result = await testHaConnection();
    if (!result.ok) {
      res.status(502).json({ error: "CONNECTION_FAILED", message: result.error });
      return;
    }
    res.json({ ok: true, entityCount: result.value.entityCount });
    return;
  }
  if (adapter === "mqtt") {
    const opts = mqttOptionsFrom(req.body as Record<string, unknown>);
    if (!opts) {
      res.status(400).json({ error: "MISSING_BROKER_URL" });
      return;
    }
    const result = await testMqttConnection(opts);
    if (!result.ok) {
      res.status(502).json({ error: "CONNECTION_FAILED", message: result.error });
      return;
    }
    res.json({ ok: true });
    return;
  }
  res.status(400).json({ error: "UNSUPPORTED_ADAPTER", message: "Only home_assistant and mqtt have a real test in this milestone." });
});

router.get("/discover/:jobId", (req, res) => {
  const job = getDiscoveryJob(uidOf(req), req.params.jobId);
  if (!job) {
    res.status(404).json({ error: "JOB_NOT_FOUND" });
    return;
  }
  res.json({ job });
});

router.post("/import", (req, res) => {
  const { jobId, tempId, propertyId } = req.body as { jobId?: string; tempId?: string; propertyId?: string };
  if (!jobId || !tempId) {
    res.status(400).json({ error: "MISSING_CANDIDATE" });
    return;
  }
  const job = getDiscoveryJob(uidOf(req), jobId);
  if (!job) {
    res.status(404).json({ error: "JOB_NOT_FOUND" });
    return;
  }
  const candidate = job.candidates.find((c) => c.tempId === tempId);
  if (!candidate) {
    res.status(404).json({ error: "CANDIDATE_NOT_FOUND" });
    return;
  }
  const result = importCandidate(uidOf(req), propertyId, candidate);
  if (!result.ok) {
    res.status(409).json({ error: result.error, integration: result.record });
    return;
  }
  res.status(201).json({ integration: result.record });
});

router.patch("/:id", (req, res) => {
  const { action } = req.body as { action?: string };
  if (action !== "disable") {
    res.status(400).json({ error: "UNSUPPORTED_ACTION", message: 'Only {"action":"disable"} is supported in this milestone.' });
    return;
  }
  const ok = disable(uidOf(req), req.params.id);
  if (!ok) {
    res.status(404).json({ error: "NOT_FOUND" });
    return;
  }
  res.json({ ok: true });
});

export default router;
