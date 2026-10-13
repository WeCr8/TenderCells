// mqtt.routes.ts
// Hardware control routes via MQTT broker
// Last updated: 2026-06-11

import { Router } from "express";
import type { Request, Response } from "express";
import { MQTTController } from "../controllers/mqtt.controller.js";
import {
  AUTH_ENABLED, ownedDeviceIds, requireAuth, requireDeviceOwner, requirePerson, requireScope, type AuthedRequest,
} from "../middleware/auth.js";
import { getFirestoreAdmin } from "../config/firebase-admin.js";
import { mowerLinkConflict, ownerFields } from "../ownership.js";
import { startOptions, validateCommand, validateMowerLink, validateSettings, type MowerAction } from "../mower.js";
import {
  capabilitiesOf, commandMower, createLink, discover, getLink, listHaMowers, listLinks, mowerView, removeLink, updateLink,
  updateMowerSettings, vendorStatus,
} from "../mowerBridge.js";

const router = Router();
const controller = new MQTTController();

// Owner gate for any device-scoped route: must be signed in AND own the device
// (no-op in demo/LAN mode). Keeps each user's actuation in their own instance.
// API keys (apiKeys.ts) pass only with the route's scope and, when bound, for their one device:
//   reads   → device:telemetry      actuation (incl. E-STOP) → device:commands
//   claim, E-STOP clear, mower linking/settings → a signed-in person only.
const reads = [requireAuth, requireScope("device:telemetry"), requireDeviceOwner];
const owns = [requireAuth, requireScope("device:commands"), requireDeviceOwner];
const personOwns = [requireAuth, requirePerson, requireDeviceOwner];

// Device telemetry (owner-gated for privacy when auth is on)
router.get("/devices/:deviceId/telemetry", ...reads, (req: Request, res: Response) => {
  controller.getTelemetry(req, res);
});

router.get("/devices/:deviceId/state", ...reads, (req: Request, res: Response) => {
  controller.getState(req, res);
});

// Live arm/gantry sub-state for the control UI (sliders, 3D viewport).
router.get("/devices/:deviceId/state/:sub", ...reads, (req: Request, res: Response) => {
  controller.getSubState(req, res);
});

router.get("/devices/:deviceId/alerts", ...reads, (req: Request, res: Response) => {
  controller.getAlerts(req, res);
});

// Devices heard on the network with no owner yet — for the claim picker (auth only).
router.get("/unclaimed", requireAuth, requirePerson, (req: Request, res: Response) => {
  controller.listUnclaimed(req, res);
});

// Claim a device to the signed-in account with proof of possession: { claimCode } from the
// board, or { pairingToken } from this hub (claim.ts). A person only, never an API key.
router.post("/devices/:deviceId/claim", requireAuth, requirePerson, (req: Request, res: Response) => {
  controller.claimDevice(req, res);
});

// One-time pairing token for claiming a board without a claim code. Hub machine only
// (or X-TC-Hub-Admin: $TC_HUB_ADMIN_KEY). CLI: tc pair <deviceId>
router.post("/pairing-tokens", (req: Request, res: Response) => {
  controller.issuePairingToken(req, res);
});

// Hardware control commands — all owner-gated.
router.post("/devices/:deviceId/door", ...owns, (req: Request, res: Response) => {
  controller.sendDoorCommand(req, res);
});

router.post("/devices/:deviceId/drive", ...owns, (req: Request, res: Response) => {
  controller.sendDriveCommand(req, res);
});

router.post("/devices/:deviceId/light", ...owns, (req: Request, res: Response) => {
  controller.sendLightCommand(req, res);
});

router.post("/devices/:deviceId/camera/config", ...owns, (req: Request, res: Response) => {
  controller.sendCameraConfig(req, res);
});

router.post("/devices/:deviceId/gantry", ...owns, (req: Request, res: Response) => {
  controller.sendGantryCommand(req, res);
});

router.post("/devices/:deviceId/feed", ...owns, (req: Request, res: Response) => {
  controller.sendFeedCommand(req, res);
});

router.post("/devices/:deviceId/clean", ...owns, (req: Request, res: Response) => {
  controller.sendCleanCommand(req, res);
});

router.post("/devices/:deviceId/arm", ...owns, (req: Request, res: Response) => {
  controller.sendArmCommand(req, res);
});

router.post("/devices/:deviceId/estop", ...owns, (req: Request, res: Response) => {
  controller.sendEstop(req, res);
});
router.post("/devices/:deviceId/estop/clear", ...personOwns, (req: Request, res: Response) => {
  controller.clearEstop(req, res);
});

router.post("/devices/:deviceId/routine", ...owns, (req: Request, res: Response) => {
  controller.sendRoutineCommand(req, res);
});

// Station flags (eggs ready, pickup ready, weed detected, roost headcount) + presence.
router.get("/devices/:deviceId/events", ...reads, (req: Request, res: Response) => {
  controller.getEvents(req, res);
});
router.post("/devices/:deviceId/events/:eventId/ack", ...owns, (req: Request, res: Response) => {
  void controller.ackEvent(req, res);
});
router.get("/devices/:deviceId/presence", ...reads, (req: Request, res: Response) => {
  controller.getPresence(req, res);
});

// Weed patrol - detection passes + human-in-the-loop laser treatment.
router.post("/devices/:deviceId/weeds/pass", ...owns, (req: Request, res: Response) => {
  void controller.startWeedPass(req, res);
});
router.post("/devices/:deviceId/weeds/:eventId/approve", ...owns, (req: Request, res: Response) => {
  void controller.approveWeed(req, res);
});
router.post("/devices/:deviceId/weeds/:eventId/reject", ...owns, (req: Request, res: Response) => {
  void controller.rejectWeed(req, res);
});

// Exclusion zones (no-go / keep-out / no-laser) - retained on tc/{id}/cfg/zones.
router.post("/devices/:deviceId/zones", ...owns, (req: Request, res: Response) => {
  void controller.sendZones(req, res);
});
router.get("/devices/:deviceId/zones", ...reads, (req: Request, res: Response) => {
  controller.getZones(req, res);
});

// Hugging Face LeRobot policies (arm service runs lerobot-rollout / lerobot-eval).
router.post("/devices/:deviceId/policy", ...owns, (req: Request, res: Response) => {
  controller.sendPolicyCommand(req, res);
});
router.post("/devices/:deviceId/policy/stop", ...owns, (req: Request, res: Response) => {
  controller.sendPolicyStop(req, res);
});

// ── bring-your-own robot mowers (mowerBridge.ts, docs/ROBOT_MOWERS.md) ──────
const fail = (res: Response, e: unknown) => {
  const err = e as Error & { status?: number };
  res.status(err.status ?? 500).json({ error: err.message || "Mower bridge error" });
};

// Linked mowers the caller owns, with state and the interlock reason.
router.get("/mowers", requireAuth, requirePerson, async (req: Request, res: Response) => {
  try {
    const only = await ownedDeviceIds((req as AuthedRequest).uid);
    res.json({ ...vendorStatus(), mowers: listLinks(only) });
  } catch (e) { fail(res, e); }
});

// lawn_mower entities Home Assistant knows (for the link picker). Never returns the token.
router.get("/mowers/home-assistant/entities", requireAuth, requirePerson, async (_req: Request, res: Response) => {
  try { res.json({ entities: await listHaMowers() }); } catch (e) { fail(res, e); }
});

// Mowers on the owner's Husqvarna / GARDENA account or in Home Assistant (for the link picker).
router.get("/mowers/vendors/:vendor/discover", requireAuth, requirePerson, async (req: Request, res: Response) => {
  try { res.json({ vendor: req.params.vendor, mowers: await discover(req.params.vendor) }); } catch (e) { fail(res, e); }
});

// Link a mower. It is claimed for the caller so only they can command it.
// FIX(2026-10-12): a caller-chosen deviceId used to be written with { ownerId: caller } and
// merge, so linking a "mower" as ct_001 took over someone else's coop (door, drive, arm).
// The id is now checked first, and the owner write is a transaction that refuses a conflict.
router.post("/mowers", requireAuth, requirePerson, async (req: Request, res: Response) => {
  const err = validateMowerLink(req.body);
  if (err) return res.status(400).json({ error: err });
  const uid = (req as AuthedRequest).uid;
  try {
    if (AUTH_ENABLED && uid && typeof req.body.deviceId === "string") {
      const snap = await getFirestoreAdmin().collection("devices").doc(req.body.deviceId).get();
      const conflict = mowerLinkConflict(snap.exists ? snap.data() : undefined, uid);
      if (conflict) return res.status(409).json({ error: conflict });
    }
    const link = await createLink(req.body);
    if (AUTH_ENABLED && uid) {
      const db = getFirestoreAdmin();
      const docRef = db.collection("devices").doc(link.deviceId);
      const conflict = await db.runTransaction(async (tx) => {
        const snap = await tx.get(docRef);
        const reason = mowerLinkConflict(snap.exists ? snap.data() : undefined, uid);
        if (reason) return reason;
        tx.set(docRef, { ...ownerFields(uid), claimedAt: Date.now(), unclaimed: false, productType: "robot-mower", nickname: link.name }, { merge: true });
        return null;
      });
      if (conflict) {
        removeLink(link.deviceId);
        return res.status(409).json({ error: conflict });
      }
    }
    res.status(201).json({ success: true, ...mowerView(link.deviceId) });
  } catch (e) { fail(res, e); }
});

router.get("/devices/:deviceId/mower", ...reads, (req: Request, res: Response) => {
  const v = mowerView(req.params.deviceId);
  if (!v) return res.status(404).json({ error: "This device is not a linked mower" });
  res.json(v);
});

router.put("/devices/:deviceId/mower", ...personOwns, (req: Request, res: Response) => {
  const err = validateMowerLink(req.body, true);
  if (err) return res.status(400).json({ error: err });
  const current = getLink(req.params.deviceId);
  if (!current) return res.status(404).json({ error: "This device is not a linked mower" });
  const guards = (req.body.guardHabitats as string[] | undefined) ?? current.guardHabitats;
  const confirmed = (req.body.noAnimalsConfirmed as boolean | undefined) ?? current.noAnimalsConfirmed;
  if (guards.length === 0 && !confirmed) {
    return res.status(400).json({ error: "Pick the coops whose animals can reach this lawn, or confirm no animals ever roam where it mows" });
  }
  res.json({ success: true, link: updateLink(req.params.deviceId, req.body) });
});

router.delete("/devices/:deviceId/mower", ...personOwns, (req: Request, res: Response) => {
  if (!removeLink(req.params.deviceId)) return res.status(404).json({ error: "This device is not a linked mower" });
  res.json({ success: true });
});

// start / resume_schedule are interlocked (E-STOP, quiet hours, flock out, animals seen);
// pause, park_until_next_schedule and dock never are.
router.post("/devices/:deviceId/mower/command", ...owns, async (req: Request, res: Response) => {
  if (!getLink(req.params.deviceId)) return res.status(404).json({ error: "This device is not a linked mower" });
  const err = validateCommand(req.body, capabilitiesOf(req.params.deviceId));
  if (err) return res.status(400).json({ error: err });
  const action = req.body.action as MowerAction;
  const out = await commandMower(req.params.deviceId, action, startOptions(req.body));
  const { status, ...body } = out;
  res.status(status).json({ deviceId: req.params.deviceId, command: `mower_${action}`, success: out.ok, ...body });
});

// What the mower's own app would change: cutting height, headlight, schedule, stay-out zones, errors.
router.post("/devices/:deviceId/mower/settings", ...personOwns, async (req: Request, res: Response) => {
  if (!getLink(req.params.deviceId)) return res.status(404).json({ error: "This device is not a linked mower" });
  const err = validateSettings(req.body, capabilitiesOf(req.params.deviceId));
  if (err) return res.status(400).json({ error: err });
  const out = await updateMowerSettings(req.params.deviceId, req.body);
  const { status, ...body } = out;
  res.status(status).json({ deviceId: req.params.deviceId, command: "mower_settings", success: out.ok, ...body });
});

// MQTT broker status
router.get("/mqtt/status", (req: Request, res: Response) => {
  controller.getMQTTStatus(req, res);
});

router.post("/mqtt/connect", (req: Request, res: Response) => {
  controller.connectMQTT(req, res);
});

export default router;
