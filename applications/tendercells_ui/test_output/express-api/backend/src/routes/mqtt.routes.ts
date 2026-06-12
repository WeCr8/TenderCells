// mqtt.routes.ts
// Hardware control routes via MQTT broker
// Last updated: 2026-06-11

import { Router } from "express";
import type { Request, Response } from "express";
import { MQTTController } from "../controllers/mqtt.controller.ts";

const router = Router();
const controller = new MQTTController();

// Device telemetry
router.get("/devices/:deviceId/telemetry", (req: Request, res: Response) => {
  controller.getTelemetry(req, res);
});

router.get("/devices/:deviceId/state", (req: Request, res: Response) => {
  controller.getState(req, res);
});

router.get("/devices/:deviceId/alerts", (req: Request, res: Response) => {
  controller.getAlerts(req, res);
});

// Hardware control commands
router.post("/devices/:deviceId/door", (req: Request, res: Response) => {
  controller.sendDoorCommand(req, res);
});

router.post("/devices/:deviceId/feed", (req: Request, res: Response) => {
  controller.sendFeedCommand(req, res);
});

router.post("/devices/:deviceId/clean", (req: Request, res: Response) => {
  controller.sendCleanCommand(req, res);
});

router.post("/devices/:deviceId/arm", (req: Request, res: Response) => {
  controller.sendArmCommand(req, res);
});

router.post("/devices/:deviceId/estop", (req: Request, res: Response) => {
  controller.sendEstop(req, res);
});

// MQTT broker status
router.get("/mqtt/status", (req: Request, res: Response) => {
  controller.getMQTTStatus(req, res);
});

router.post("/mqtt/connect", (req: Request, res: Response) => {
  controller.connectMQTT(req, res);
});

export default router;
