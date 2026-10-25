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
  const result = startDiscovery(uidOf(req), gatewayId, adapter as AdapterKind);
  if (!result.ok) {
    res.status(429).json({ error: result.error });
    return;
  }
  res.json({ job: result.job });
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
