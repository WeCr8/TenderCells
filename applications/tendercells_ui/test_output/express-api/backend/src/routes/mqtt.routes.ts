// mqtt.routes.ts
// Hardware control routes via MQTT broker
// Last updated: 2026-06-11

import { Router } from "express";
import type { Request, Response } from "express";
import { MQTTController } from "../controllers/mqtt.controller.js";
import { requireAuth, requireDeviceOwner } from "../middleware/auth.js";

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

router.post("/devices/:deviceId/routine", ...owns, (req: Request, res: Response) => {
  controller.sendRoutineCommand(req, res);
});

// MQTT broker status
router.get("/mqtt/status", (req: Request, res: Response) => {
  controller.getMQTTStatus(req, res);
});

router.post("/mqtt/connect", (req: Request, res: Response) => {
  controller.connectMQTT(req, res);
});

export default router;
