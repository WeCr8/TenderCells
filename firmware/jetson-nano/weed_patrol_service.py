"""Weed patrol MQTT service - runs on the garden robot's controller.

    WEED_MODE=simulation|live  DEVICE_ID=garden_weeder  ITEM_ID=item-garden-genesis \\
    MQTT_BROKER=mqtt://192.168.1.50:1883  python3 weed_patrol_service.py

Subscribes:  tc/{id}/cmd/weed   {"seq", "action": "pass"|"approve"|"reject", "passes", "task", "eventId", "mode"}
                                  task: weed (default) | plant_scan | patrol (snakes / animals)
             tc/{id}/cmd/event  {"seq", "action": "ack", "eventId"}  (a person saw a sighting)
             tc/{id}/cmd/estop  {"active": bool}   (QoS 2, retained)
             tc/{id}/cfg/zones  exclusion zones from the OS (retained) - no driving into no-go /
                                keep-out, no aiming dot or laser inside any zone (zones.py)
Publishes:   tc/{id}/event      weed_detected flags (pending_review -> approved -> treated/rejected)
             tc/{id}/state/weed {state, mode, estop, laser{...}, pass{...}, animalSafetyGate}
             tc/{id}/ack        {"seq", "ok", "error"}  for every command with a seq
             tc/{id}/status     {"online": true} retained; last will {"online": false}

Live hardware settings: CAMERA_INDEX, WEED_DETECTOR=hsv|yolo, WEED_MODEL=hf://owner/repo/best.pt,
LASER_BURN_ENABLED=true (default false), STUDENT_MODE=false (default true = aiming dot only),
LASER_PROFILE=fixed|diode-500mw|diode-4w (exposure by weed size; fixed uses LASER_PULSE_MS <= 1500).
Motion: WEED_GANTRY=grbl (GRBL_PORT) | farmbot (FarmBot Genesis via farmbot-py, FARMBOT_TOKEN).
Build shown in the OS: WEED_ROBOT=genesis-laser (default) | rover-laser | arm-laser | rover-scout.
Rovers (rover_patrol.py): WEED_ROBOT=rover-scout (camera only) or rover-laser patrol the whole
property - cmd/weed pass takes "area" or "route" (property feet), events carry "propFt",
state/weed carries "pose". ROVER_DRIVE=sim | mqtt (ROVER_BASE_ID: base controller that takes
tc/{base}/cmd/goto and reports tc/{base}/state/pose). PROPERTY_WIDTH_FT / PROPERTY_DEPTH_FT.
Laser pins: LASER_OUTPUT=gpio (AIM_PIN, LASER_PIN, ENCLOSURE_PIN - BCM, Pi / Jetson) |
farmbot (FARMBOT_AIM_PIN, FARMBOT_LASER_PIN, FARMBOT_ENCLOSURE_PIN on the Farmduino).
"""

from __future__ import annotations

import json
import os
import queue
import threading
import time
from typing import Callable, Dict, Optional
from urllib.parse import urlparse

from weed_patrol import (TASKS, BedConfig, InterlockError, LaserController, SimDetector, SimGantry, WeedPatrol)
from zones import ZoneGuard, ZoneViolation

try:  # rover weed patrol (optional module, same interface)
    from rover_patrol import ScoutOnly
except ImportError:  # pragma: no cover
    class ScoutOnly(RuntimeError):
        pass


class WeedPatrolService:
    def __init__(self, device_id: str, patrol: WeedPatrol, publish: Callable[[str, dict, int, bool], None],
                 mode: str = "simulation", robot_type: str = "genesis-laser"):
        self.device_id, self.patrol, self._publish, self.mode = device_id, patrol, publish, mode
        self.robot_type = robot_type  # genesis-laser | rover-laser | arm-laser (drawn by the OS)
        self.state, self.error = "idle", None
        patrol.publish_event = lambda ev: self._publish(self.topic("event"), ev, 1, False)
        self._jobs: "queue.Queue[Callable[[], None]]" = queue.Queue()
        threading.Thread(target=self._worker, daemon=True).start()

    def topic(self, suffix: str) -> str:
        return f"tc/{self.device_id}/{suffix}"

    def subscriptions(self):
        return [(self.topic("cmd/weed"), 2), (self.topic("cmd/estop"), 2), (self.topic("cmd/event"), 1),
                (self.topic("cfg/zones"), 1)]

    def snapshot(self) -> dict:
        laser = self.patrol.laser
        return {"state": "estop" if laser.estop_active else self.state, "mode": self.mode, "estop": laser.estop_active,
                "laser": laser.status(), "pass": dict(self.patrol.progress), "error": self.error,
                "robotType": self.robot_type, "tool": self._tool(),
                "zones": self.patrol.zones.summary() if self.patrol.zones else None,
                **({"pose": self.patrol.pose_dict()} if hasattr(self.patrol, "pose_dict") else {}),
                # Gardens have no chicken headcount; the per-weed human approval (with
                # "people and animals clear" confirmation in the UI) is the gate.
                "animalSafetyGate": False, "ts": int(time.time() * 1000)}

    def _tool(self) -> dict:
        gantry = getattr(self.patrol, "gantry", None)  # rovers report pose instead
        pos = getattr(gantry, "position", (0.0, 0.0, 0.0))
        laser = self.patrol.laser
        return {"x": round(pos[0], 1), "y": round(pos[1], 1), "z": round(pos[2], 1),
                "aim": bool(getattr(laser, "aim_on", False)), "laser": bool(getattr(laser, "laser_on", False))}

    def publish_state(self) -> None:
        self._publish(self.topic("state/weed"), self.snapshot(), 1, True)

    def _ack(self, seq, ok: bool, error: Optional[str] = None) -> None:
        if seq is not None:
            self._publish(self.topic("ack"), {"seq": seq, "ok": ok, **({"error": error} if error else {})}, 1, False)

    def handle(self, topic: str, raw) -> None:
        try:
            msg = json.loads(raw if isinstance(raw, str) else raw.decode("utf-8"))
        except (ValueError, UnicodeDecodeError):
            return
        if not isinstance(msg, dict):
            return
        seq = msg.get("seq")
        if topic.endswith("cmd/estop"):
            if msg.get("active", True):
                self.patrol.estop()
                self.state = "estop"
            else:
                self.patrol.laser.estop_active = False
                if hasattr(self.patrol.gantry, "stopped"):
                    self.patrol.gantry.stopped = False
                self.state = "idle"
            self._ack(seq, True)
            return self.publish_state()

        if topic.endswith("cfg/zones"):
            try:
                self.patrol.zones = ZoneGuard.from_payload(msg)
                self._ack(seq, True)
            except (ValueError, TypeError, KeyError, IndexError) as err:
                self._ack(seq, False, f"Bad zones: {err}")  # keep the previous zones
            return self.publish_state()

        if topic.endswith("cmd/event"):  # "Seen it" on a sighting, "Pulled it" on a rover weed
            try:
                self.patrol.ack_alert(str(msg.get("eventId", "")))
                self._ack(seq, True)
            except KeyError as err:
                self._ack(seq, False, str(err))
            return None

        action = msg.get("action")
        if self.patrol.laser.estop_active and action in ("pass", "approve"):
            self._ack(seq, False, "E-STOP is active")
            return
        if action == "pass":
            passes = int(msg.get("passes", 1))
            task = str(msg.get("task", "weed"))
            if not 1 <= passes <= 10:
                return self._ack(seq, False, "passes must be 1-10")
            if task not in TASKS:
                return self._ack(seq, False, f"task must be one of {', '.join(TASKS)}")
            if self.patrol.progress.get("running"):
                return self._ack(seq, False, "A pass is already running")
            if hasattr(self.patrol, "set_coverage") and (msg.get("area") or msg.get("route") or msg.get("waterPoints") is not None):
                try:
                    self.patrol.set_coverage(area=msg.get("area"), route=msg.get("route"))
                    self.patrol.set_water_points(msg.get("waterPoints"))
                except (ValueError, TypeError, KeyError) as err:
                    return self._ack(seq, False, f"Bad coverage: {err}")
            self._ack(seq, True)  # accepted; the pass itself runs in the worker
            self._jobs.put(lambda: self._run("scanning" if task == "weed" else task, lambda: self.patrol.run_passes(passes, task)))
        elif action == "approve":
            event_id, mode = str(msg.get("eventId", "")), msg.get("mode", "aim")
            if event_id not in self.patrol.weeds:
                return self._ack(seq, False, f"Unknown weed {event_id}")
            if not getattr(self.patrol, "has_laser", True):
                return self._ack(seq, False, "This rover has a camera only - pull the weed by hand, then mark it pulled")
            try:  # refuse up front with the reason
                if hasattr(self.patrol, "laser_zone_check"):
                    self.patrol.laser_zone_check(event_id)
                elif self.patrol.zones:
                    weed = self.patrol.weeds[event_id]
                    self.patrol.zones.check_bed(weed["x"], weed["y"], "laser")
            except ZoneViolation as err:
                return self._ack(seq, False, str(err))
            if mode == "burn":
                try:
                    self.patrol.laser.check_burn_allowed()  # refuse up front with the reason
                except InterlockError as err:
                    return self._ack(seq, False, str(err))
            self._ack(seq, True)
            self._jobs.put(lambda: self._run("treating", lambda: self.patrol.approve(event_id, mode)))
        elif action == "reject":
            try:
                self.patrol.reject(str(msg.get("eventId", "")))
                self._ack(seq, True)
            except KeyError as err:
                self._ack(seq, False, str(err))
        else:
            self._ack(seq, False, f"Unknown weed action '{action}'")

    def _run(self, state: str, job: Callable[[], object]) -> None:
        self.state, self.error = state, None
        self.publish_state()
        try:
            job()
        except (InterlockError, ZoneViolation, ScoutOnly) as err:
            self.error = str(err)
        except Exception as err:  # noqa: BLE001 - report and keep serving
            self.error = f"{state} failed: {err}"
        finally:
            if not self.patrol.laser.estop_active:
                self.state = "idle"
            self.publish_state()

    def _worker(self) -> None:
        while True:
            job = self._jobs.get()
            try:
                job()
            finally:
                self._jobs.task_done()

    def wait_idle(self, timeout: float = 5.0) -> None:
        end = time.time() + timeout
        while self._jobs.unfinished_tasks and time.time() < end:
            time.sleep(0.01)


def build_rover(env: Dict[str, str], publish=None):  # pragma: no cover - hardware wiring
    from rover_patrol import (FrameDetector, MqttGotoDrive, RoverConfig, RoverWeedPatrol, SimDrive, SimRoverDetector,
                              WetGroundLeakDetector, YoloAnimalDetector)

    cfg = RoverConfig(width_ft=float(env.get("PROPERTY_WIDTH_FT", 80)), depth_ft=float(env.get("PROPERTY_DEPTH_FT", 60)),
                      item_id=env.get("ITEM_ID"))
    has_laser = env.get("WEED_ROBOT") == "rover-laser"
    student = env.get("STUDENT_MODE", "true").lower() != "false"
    burn = has_laser and env.get("LASER_BURN_ENABLED", "false").lower() == "true"
    if env.get("WEED_MODE", "simulation") == "simulation":
        laser = LaserController(lambda on: None, lambda on: print(f"[sim] LASER {'ON' if on else 'off'}"), lambda: True,
                                burn_enabled=burn, student_mode=student or not has_laser,
                                pulse_ms=int(env.get("LASER_PULSE_MS", 600)), profile=env.get("LASER_PROFILE", "fixed"))
        return RoverWeedPatrol(cfg, SimRoverDetector(cfg, seed=int(env.get("SIM_SEED", 11)),
                                                    leaking=[x for x in env.get("SIM_LEAKS", "").split(",") if x]), SimDrive((cfg.width_ft / 2, cfg.depth_ft - 3)),
                               laser, lambda e: None, has_laser=has_laser)
    import cv2  # type: ignore
    from weed_patrol import HsvDetector, YoloDetector

    cam = cv2.VideoCapture(int(env.get("CAMERA_INDEX", 0)))
    capture = lambda: cam.read()[1]  # noqa: E731
    inner = (YoloDetector(capture, env["WEED_MODEL"]) if env.get("WEED_DETECTOR") == "yolo"
             else HsvDetector(capture, mm_per_px=float(env.get("MM_PER_PX", 1.0))))
    drive = MqttGotoDrive(publish, env.get("ROVER_BASE_ID", env.get("DEVICE_ID", "rover_001"))) if env.get("ROVER_DRIVE") == "mqtt" else SimDrive()
    if has_laser:
        from gpiozero import DigitalInputDevice, DigitalOutputDevice  # type: ignore

        aim, laser_out = DigitalOutputDevice(int(env["AIM_PIN"])), DigitalOutputDevice(int(env["LASER_PIN"]))
        shroud = DigitalInputDevice(int(env["ENCLOSURE_PIN"]), pull_up=True)
        laser = LaserController(lambda on: aim.on() if on else aim.off(), lambda on: laser_out.on() if on else laser_out.off(),
                                lambda: not shroud.value, burn_enabled=burn, student_mode=student,
                                pulse_ms=int(env.get("LASER_PULSE_MS", 600)), profile=env.get("LASER_PROFILE", "diode-4w"))
    else:
        laser = LaserController(lambda on: None, lambda on: None, lambda: True, burn_enabled=False, student_mode=True)
    # Animals on the route (COCO YOLO by default, or ROVER_ANIMAL_MODEL=hf://owner/repo/best.pt) and
    # leak checks at water points (wet-ground change detection). ROVER_ANIMALS=off / ROVER_LEAKS=off disable.
    animals = None
    if env.get("ROVER_ANIMALS", "on") != "off":
        model = env.get("ROVER_ANIMAL_MODEL", "yolov8n.pt")
        # A property model's own class names are the labels ({}); COCO weights map through COCO_ANIMALS (None).
        animals = YoloAnimalDetector(capture, model, mm_per_px=float(env.get("MM_PER_PX", 1.0)),
                                     labels={} if model.startswith("hf://") else None)
    leaks = WetGroundLeakDetector(capture) if env.get("ROVER_LEAKS", "on") != "off" else None
    return RoverWeedPatrol(cfg, FrameDetector(inner, BedConfig()), drive, laser, lambda e: None, has_laser=has_laser,
                           animal_detector=animals, leak_detector=leaks)


def build_patrol(env: Dict[str, str]) -> WeedPatrol:  # pragma: no cover - hardware wiring
    bed = BedConfig(length_mm=float(env.get("BED_LENGTH_MM", 3000)), width_mm=float(env.get("BED_WIDTH_MM", 1500)),
                    item_id=env.get("ITEM_ID"))
    student = env.get("STUDENT_MODE", "true").lower() != "false"
    burn = env.get("LASER_BURN_ENABLED", "false").lower() == "true"
    if env.get("WEED_MODE", "simulation") == "simulation":
        laser = LaserController(lambda on: None, lambda on: print(f"[sim] LASER {'ON' if on else 'off'}"),
                                lambda: True, burn_enabled=burn, student_mode=student,
                                pulse_ms=int(env.get("LASER_PULSE_MS", 600)), profile=env.get("LASER_PROFILE", "fixed"))
        return WeedPatrol(bed, SimDetector(bed, seed=int(env.get("SIM_SEED", 42))), SimGantry(), laser, lambda e: None)

    import cv2  # type: ignore
    from weed_patrol import FarmBotGantry, GrblGantry, HsvDetector, YoloDetector

    cam = cv2.VideoCapture(int(env.get("CAMERA_INDEX", 0)))
    capture = lambda: cam.read()[1]  # noqa: E731
    detector = (YoloDetector(capture, env["WEED_MODEL"]) if env.get("WEED_DETECTOR") == "yolo"
                else HsvDetector(capture, mm_per_px=float(env.get("MM_PER_PX", 0.5))))
    gantry = (FarmBotGantry(env["FARMBOT_TOKEN"]) if env.get("WEED_GANTRY") == "farmbot"
              else GrblGantry(env["GRBL_PORT"]))
    if env.get("LASER_OUTPUT") == "farmbot":
        fb = gantry if isinstance(gantry, FarmBotGantry) else FarmBotGantry(env["FARMBOT_TOKEN"])
        bot = fb.bot
        aim_pin, laser_pin = int(env["FARMBOT_AIM_PIN"]), int(env["FARMBOT_LASER_PIN"])
        enc_pin = int(env["FARMBOT_ENCLOSURE_PIN"])
        set_aim = lambda on: bot.write_pin(aim_pin, 1 if on else 0)  # noqa: E731
        set_laser = lambda on: bot.write_pin(laser_pin, 1 if on else 0)  # noqa: E731
        enclosure_closed = lambda: fb.pin_value(enc_pin) == 0  # noqa: E731  closed pulls low; unknown = open
    else:
        from gpiozero import DigitalInputDevice, DigitalOutputDevice  # type: ignore

        aim, laser_out = DigitalOutputDevice(int(env["AIM_PIN"])), DigitalOutputDevice(int(env["LASER_PIN"]))
        enclosure = DigitalInputDevice(int(env["ENCLOSURE_PIN"]), pull_up=True)  # closed switch -> low
        set_aim = lambda on: aim.on() if on else aim.off()  # noqa: E731
        set_laser = lambda on: laser_out.on() if on else laser_out.off()  # noqa: E731
        enclosure_closed = lambda: not enclosure.value  # noqa: E731
    laser = LaserController(set_aim, set_laser, enclosure_closed, burn_enabled=burn, student_mode=student,
                            pulse_ms=int(env.get("LASER_PULSE_MS", 600)), profile=env.get("LASER_PROFILE", "fixed"))
    return WeedPatrol(bed, detector, gantry, laser, lambda e: None)


def main() -> None:  # pragma: no cover - wiring for real deployments
    import paho.mqtt.client as mqtt

    env = dict(os.environ)
    device_id = env.get("DEVICE_ID", "garden_weeder")
    broker = urlparse(env.get("MQTT_BROKER", "mqtt://localhost:1883"))
    client = mqtt.Client(mqtt.CallbackAPIVersion.VERSION2, client_id=f"tc-weed-{device_id}")
    publish = lambda t, body, qos, retain: client.publish(t, json.dumps(body), qos=qos, retain=retain)  # noqa: E731
    rover = env.get("WEED_ROBOT", "").startswith("rover-")
    patrol = build_rover(env, publish) if rover else build_patrol(env)
    service = WeedPatrolService(device_id, patrol, publish, mode=env.get("WEED_MODE", "simulation"),
                                robot_type=env.get("WEED_ROBOT", "genesis-laser"))
    status_topic = service.topic("status")
    client.will_set(status_topic, json.dumps({"online": False}), qos=1, retain=True)

    def on_connect(c, _u, _f, _r, _p=None):
        c.subscribe(service.subscriptions() + ([(pose_topic, 0)] if pose_topic else []))
        c.publish(status_topic, json.dumps({"online": True}), qos=1, retain=True)
        service.publish_state()
        print(f"✅ weed patrol {device_id} ({service.mode}) on {broker.hostname}:{broker.port or 1883}")

    client.on_connect = on_connect
    drive = getattr(patrol, "drive", None)
    pose_topic = f"tc/{getattr(drive, 'base_id', '')}/state/pose" if hasattr(drive, "on_pose") else None

    def on_message(_c, _u, m):
        if pose_topic and m.topic == pose_topic:
            try:
                drive.on_pose(json.loads(m.payload))
            except (ValueError, KeyError, TypeError):
                pass
            return
        service.handle(m.topic, m.payload)

    client.on_message = on_message
    # connect_async + loop_start keeps retrying, so the service survives booting before
    # the broker (or a broker restart) instead of exiting with "connection refused".
    client.reconnect_delay_set(min_delay=1, max_delay=30)
    client.connect_async(broker.hostname or "localhost", broker.port or 1883)
    client.loop_start()
    try:
        while True:
            service.publish_state()
            time.sleep(1.0)
    except KeyboardInterrupt:
        service.patrol.estop()


if __name__ == "__main__":  # pragma: no cover
    main()
