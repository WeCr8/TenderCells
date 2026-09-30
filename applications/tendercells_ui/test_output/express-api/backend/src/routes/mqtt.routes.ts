// mqtt.routes.ts
// Hardware control routes via MQTT broker
// Last updated: 2026-06-11

import { Router } from "express";
import type { Request, Response } from "express";
import { MQTTController } from "../controllers/mqtt.controller.js";
import { AUTH_ENABLED, ownedDeviceIds, requireAuth, requireDeviceOwner, type AuthedRequest } from "../middleware/auth.js";
import { getFirestoreAdmin } from "../config/firebase-admin.js";
import { validateMowerLink, type MowerAction } from "../mower.js";
import {
  HA_CONFIGURED, commandMower, createLink, getLink, listHaMowers, listLinks, mowerView, removeLink, updateLink,
} from "../mowerBridge.js";

const router = Router();
const controller = new MQTTController();

// Owner gate for any device-scoped route: must be signed in AND own the device
// (no-op in demo/LAN mode). Keeps each user's actuation in their own instance.
const owns = [requireAuth, requireDeviceOwner];

// Device telemetry (owner-gated for privacy when auth is on)
router.get("/devices/:deviceId/telemetry", ...owns, (req: Request, res: Response) => {
  controller.getTelemetry(req, res);
});

router.get("/devices/:deviceId/state", ...owns, (req: Request, res: Response) => {
  controller.getState(req, res);
});

// Live arm/gantry sub-state for the control UI (sliders, 3D viewport).
router.get("/devices/:deviceId/state/:sub", ...owns, (req: Request, res: Response) => {
  controller.getSubState(req, res);
});

router.get("/devices/:deviceId/alerts", ...owns, (req: Request, res: Response) => {
  controller.getAlerts(req, res);
});

// Devices heard on the network with no owner yet — for the claim picker (auth only).
router.get("/unclaimed", requireAuth, (req: Request, res: Response) => {
  controller.listUnclaimed(req, res);
});

// Claim a device to the signed-in account (auth only — device may be unclaimed).
router.post("/devices/:deviceId/claim", requireAuth, (req: Request, res: Response) => {
  controller.claimDevice(req, res);
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
router.post("/devices/:deviceId/estop/clear", ...owns, (req: Request, res: Response) => {
  controller.clearEstop(req, res);
});

router.post("/devices/:deviceId/routine", ...owns, (req: Request, res: Response) => {
  controller.sendRoutineCommand(req, res);
});

// Station flags (eggs ready, pickup ready, weed detected, roost headcount) + presence.
router.get("/devices/:deviceId/events", ...owns, (req: Request, res: Response) => {
  controller.getEvents(req, res);
});
router.post("/devices/:deviceId/events/:eventId/ack", ...owns, (req: Request, res: Response) => {
  void controller.ackEvent(req, res);
});
router.get("/devices/:deviceId/presence", ...owns, (req: Request, res: Response) => {
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
router.get("/devices/:deviceId/zones", ...owns, (req: Request, res: Response) => {
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
router.get("/mowers", requireAuth, async (req: Request, res: Response) => {
  try {
    const only = await ownedDeviceIds((req as AuthedRequest).uid);
    res.json({ homeAssistant: HA_CONFIGURED, mowers: listLinks(only) });
  } catch (e) { fail(res, e); }
});

// lawn_mower entities Home Assistant knows (for the link picker). Never returns the token.
router.get("/mowers/home-assistant/entities", requireAuth, async (_req: Request, res: Response) => {
  try { res.json({ entities: await listHaMowers() }); } catch (e) { fail(res, e); }
});

// Link a mower. It is claimed for the caller so only they can command it.
router.post("/mowers", requireAuth, async (req: Request, res: Response) => {
  const err = validateMowerLink(req.body);
  if (err) return res.status(400).json({ error: err });
  try {
    const link = await createLink(req.body);
    const uid = (req as AuthedRequest).uid;
    if (AUTH_ENABLED && uid) {
      await getFirestoreAdmin().collection("devices").doc(link.deviceId)
        .set({ ownerId: uid, claimedAt: Date.now(), unclaimed: false, productType: "robot-mower", nickname: link.name }, { merge: true });
    }
    res.status(201).json({ success: true, ...mowerView(link.deviceId) });
  } catch (e) { fail(res, e); }
});

router.get("/devices/:deviceId/mower", ...owns, (req: Request, res: Response) => {
  const v = mowerView(req.params.deviceId);
  if (!v) return res.status(404).json({ error: "This device is not a linked mower" });
  res.json(v);
});

router.put("/devices/:deviceId/mower", ...owns, (req: Request, res: Response) => {
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

router.delete("/devices/:deviceId/mower", ...owns, (req: Request, res: Response) => {
  if (!removeLink(req.params.deviceId)) return res.status(404).json({ error: "This device is not a linked mower" });
  res.json({ success: true });
});

// start is interlocked (E-STOP, quiet hours, flock out, animals seen); pause / dock never are.
router.post("/devices/:deviceId/mower/command", ...owns, async (req: Request, res: Response) => {
  const action = req.body?.action as MowerAction;
  if (!["start", "pause", "dock"].includes(action)) return res.status(400).json({ error: "action must be start, pause or dock" });
  const out = await commandMower(req.params.deviceId, action);
  const { status, ...body } = out;
  res.status(status).json({ deviceId: req.params.deviceId, command: `mower_${action}`, success: out.ok, ...body });
});

// MQTT broker status
router.get("/mqtt/status", (req: Request, res: Response) => {
  controller.getMQTTStatus(req, res);
});

router.post("/mqtt/connect", (req: Request, res: Response) => {
  controller.connectMQTT(req, res);
});

export default router;
