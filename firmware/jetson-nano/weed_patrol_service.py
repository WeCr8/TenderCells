"""Weed patrol MQTT service - runs on the garden robot's controller.

    WEED_MODE=simulation|live  DEVICE_ID=garden_weeder  ITEM_ID=item-garden-genesis \\
    MQTT_BROKER=mqtt://192.168.1.50:1883  python3 weed_patrol_service.py

Subscribes:  tc/{id}/cmd/weed   {"seq", "action": "pass"|"approve"|"reject", "passes", "eventId", "mode"}
             tc/{id}/cmd/estop  {"active": bool}   (QoS 2, retained)
Publishes:   tc/{id}/event      weed_detected flags (pending_review -> approved -> treated/rejected)
             tc/{id}/state/weed {state, mode, estop, laser{...}, pass{...}, animalSafetyGate}
             tc/{id}/ack        {"seq", "ok", "error"}  for every command with a seq
             tc/{id}/status     {"online": true} retained; last will {"online": false}

Live hardware settings: GRBL_PORT (gantry), CAMERA_INDEX, WEED_DETECTOR=hsv|yolo,
WEED_MODEL=hf://owner/repo/best.pt, AIM_PIN, LASER_PIN, ENCLOSURE_PIN (BCM numbers,
Raspberry Pi / Jetson GPIO), LASER_BURN_ENABLED=true (default false), STUDENT_MODE=false
(default true = aiming dot only), LASER_PULSE_MS (<= 1500).
"""

from __future__ import annotations

import json
import os
import queue
import threading
import time
from typing import Callable, Dict, Optional
from urllib.parse import urlparse

from weed_patrol import (BedConfig, InterlockError, LaserController, SimDetector, SimGantry, WeedPatrol)


class WeedPatrolService:
    def __init__(self, device_id: str, patrol: WeedPatrol, publish: Callable[[str, dict, int, bool], None],
                 mode: str = "simulation"):
        self.device_id, self.patrol, self._publish, self.mode = device_id, patrol, publish, mode
        self.state, self.error = "idle", None
        patrol.publish_event = lambda ev: self._publish(self.topic("event"), ev, 1, False)
        self._jobs: "queue.Queue[Callable[[], None]]" = queue.Queue()
        threading.Thread(target=self._worker, daemon=True).start()

    def topic(self, suffix: str) -> str:
        return f"tc/{self.device_id}/{suffix}"

    def subscriptions(self):
        return [(self.topic("cmd/weed"), 2), (self.topic("cmd/estop"), 2)]

    def snapshot(self) -> dict:
        laser = self.patrol.laser
        return {"state": "estop" if laser.estop_active else self.state, "mode": self.mode, "estop": laser.estop_active,
                "laser": laser.status(), "pass": dict(self.patrol.progress), "error": self.error,
                # Gardens have no chicken headcount; the per-weed human approval (with
                # "people and animals clear" confirmation in the UI) is the gate.
                "animalSafetyGate": False, "ts": int(time.time() * 1000)}

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

        action = msg.get("action")
        if self.patrol.laser.estop_active and action in ("pass", "approve"):
            self._ack(seq, False, "E-STOP is active")
            return
        if action == "pass":
            passes = int(msg.get("passes", 1))
            if not 1 <= passes <= 10:
                return self._ack(seq, False, "passes must be 1-10")
            if self.patrol.progress.get("running"):
                return self._ack(seq, False, "A pass is already running")
            self._ack(seq, True)  # accepted; the pass itself runs in the worker
            self._jobs.put(lambda: self._run("scanning", lambda: self.patrol.run_passes(passes)))
        elif action == "approve":
            event_id, mode = str(msg.get("eventId", "")), msg.get("mode", "aim")
            if event_id not in self.patrol.weeds:
                return self._ack(seq, False, f"Unknown weed {event_id}")
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
        except InterlockError as err:
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


def build_patrol(env: Dict[str, str]) -> WeedPatrol:  # pragma: no cover - hardware wiring
    bed = BedConfig(length_mm=float(env.get("BED_LENGTH_MM", 3000)), width_mm=float(env.get("BED_WIDTH_MM", 1500)),
                    item_id=env.get("ITEM_ID"))
    student = env.get("STUDENT_MODE", "true").lower() != "false"
    burn = env.get("LASER_BURN_ENABLED", "false").lower() == "true"
    if env.get("WEED_MODE", "simulation") == "simulation":
        laser = LaserController(lambda on: None, lambda on: print(f"[sim] LASER {'ON' if on else 'off'}"),
                                lambda: True, burn_enabled=burn, student_mode=student,
                                pulse_ms=int(env.get("LASER_PULSE_MS", 600)))
        return WeedPatrol(bed, SimDetector(bed, seed=int(env.get("SIM_SEED", 42))), SimGantry(), laser, lambda e: None)

    import cv2  # type: ignore
    from gpiozero import DigitalInputDevice, DigitalOutputDevice  # type: ignore
    from weed_patrol import GrblGantry, HsvDetector, YoloDetector

    cam = cv2.VideoCapture(int(env.get("CAMERA_INDEX", 0)))
    capture = lambda: cam.read()[1]  # noqa: E731
    detector = (YoloDetector(capture, env["WEED_MODEL"]) if env.get("WEED_DETECTOR") == "yolo"
                else HsvDetector(capture, mm_per_px=float(env.get("MM_PER_PX", 0.5))))
    aim, laser_out = DigitalOutputDevice(int(env["AIM_PIN"])), DigitalOutputDevice(int(env["LASER_PIN"]))
    enclosure = DigitalInputDevice(int(env["ENCLOSURE_PIN"]), pull_up=True)  # closed switch -> low
    laser = LaserController(lambda on: aim.on() if on else aim.off(), lambda on: laser_out.on() if on else laser_out.off(),
                            lambda: not enclosure.value, burn_enabled=burn, student_mode=student,
                            pulse_ms=int(env.get("LASER_PULSE_MS", 600)))
    return WeedPatrol(bed, detector, GrblGantry(env["GRBL_PORT"]), laser, lambda e: None)


def main() -> None:  # pragma: no cover - wiring for real deployments
    import paho.mqtt.client as mqtt

    env = dict(os.environ)
    device_id = env.get("DEVICE_ID", "garden_weeder")
    broker = urlparse(env.get("MQTT_BROKER", "mqtt://localhost:1883"))
    client = mqtt.Client(mqtt.CallbackAPIVersion.VERSION2, client_id=f"tc-weed-{device_id}")
    publish = lambda t, body, qos, retain: client.publish(t, json.dumps(body), qos=qos, retain=retain)  # noqa: E731
    service = WeedPatrolService(device_id, build_patrol(env), publish, mode=env.get("WEED_MODE", "simulation"))
    status_topic = service.topic("status")
    client.will_set(status_topic, json.dumps({"online": False}), qos=1, retain=True)

    def on_connect(c, _u, _f, _r, _p=None):
        c.subscribe(service.subscriptions())
        c.publish(status_topic, json.dumps({"online": True}), qos=1, retain=True)
        service.publish_state()
        print(f"✅ weed patrol {device_id} ({service.mode}) on {broker.hostname}:{broker.port or 1883}")

    client.on_connect = on_connect
    client.on_message = lambda _c, _u, m: service.handle(m.topic, m.payload)
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
