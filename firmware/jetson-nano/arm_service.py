"""Tender Cells arm service - MQTT bridge between the OS / express-api and an arm.

Runs on the arm controller (Jetson, Pi, or any PC next to the robot):

    ARM_TYPE=sim|ur|lerobot  ARM_MODE=live|simulation  DEVICE_ID=ct_001 \\
    MQTT_BROKER=mqtt://192.168.1.50:1883  python3 arm_service.py

Subscribes (commands, as published by express-api):
    tc/{id}/cmd/arm      {"seq", "joints": [..], "speed": 0..1}
    tc/{id}/cmd/motion   {"routine": "egg_collection_routine" | "cleaning_sweep_routine"}
                         {"policy": {"repo_id", "task", "duration_s", "sim_env"}}
                         {"policy_stop": true}
    tc/{id}/cmd/estop    {"active": true|false}  (QoS 2, retained - latched here too)
    tc/{id}/sensors      chickenCount (local presence guard when ANIMAL_AREA=true)
Publishes:
    tc/{id}/ack          {"seq", "ok", "error"} for every command carrying a seq
    tc/{id}/status       {"online": true} retained; last will {"online": false}
    tc/{id}/state/arm    {"joints", "state", "platform", "mode", "estop", "policy",
                          "animalSafetyGate", "error", "ts"}  (QoS 1, retained)

Safety (CLAUDE.md): E-STOP latches and stops the arm, gantry and any policy run;
motion is refused while latched, while chickens are detected (animal areas), or
without a fresh headcount. Gardens set ANIMAL_AREA=false (no chickens to detect).
"""

from __future__ import annotations

import json
import os
import queue
import threading
import time
from typing import Any, Callable, Dict, Optional
from urllib.parse import urlparse

from arm_factory import ArmFactory
from arm_interface import ArmController, ArmSafetyError
from policy_runner import PolicyError, PolicyRequest, PolicyRunner

HEADCOUNT_MAX_AGE_S = 60
STATE_INTERVAL_S = 1.0
KNOWN_ROUTINES = ("egg_collection_routine", "cleaning_sweep_routine")


class ArmService:
    def __init__(self, device_id: str, arm: ArmController, publish: Callable[[str, dict, int, bool], None],
                 animal_area: bool = True, coordinator: Any = None, policy_runner: Optional[PolicyRunner] = None,
                 clock: Callable[[], float] = time.time):
        self.device_id = device_id
        self.arm = arm
        self.coordinator = coordinator  # CoordinatedMotionController for routines (optional)
        self._publish = publish
        self.animal_area = animal_area
        self._clock = clock
        self.state = "idle"
        self.error: Optional[str] = None
        self.chicken_count: Optional[int] = None
        self.chicken_at = 0.0
        self.policy = policy_runner or PolicyRunner(on_status=lambda _s: self.publish_state())
        self._jobs: "queue.Queue[Callable[[], None]]" = queue.Queue()
        self._worker = threading.Thread(target=self._run_jobs, daemon=True)
        self._worker.start()

    # ── topics ───────────────────────────────────────────────────────────────
    def topic(self, suffix: str) -> str:
        return f"tc/{self.device_id}/{suffix}"

    def subscriptions(self):
        return [(self.topic("cmd/arm"), 1), (self.topic("cmd/motion"), 1),
                (self.topic("cmd/estop"), 2), (self.topic("sensors"), 0)]

    # ── state ────────────────────────────────────────────────────────────────
    def snapshot(self) -> Dict[str, Any]:
        try:
            joints = [round(a, 2) for a in self.arm.get_joint_state()]
        except Exception as err:  # noqa: BLE001 - report, don't crash the loop
            joints, self.error = [], f"Cannot read joints: {err}"
        state = "estop" if self.arm.estop_active else ("policy" if self.policy.running else self.state)
        return {
            "joints": joints, "state": state, "estop": self.arm.estop_active,
            "connected": self.arm.is_connected, "animalSafetyGate": self.animal_area,
            "policy": self.policy.status.as_dict(), "error": self.error, "ts": int(self._clock() * 1000),
            **self.arm.describe(),
        }

    def publish_state(self) -> None:
        self._publish(self.topic("state/arm"), self.snapshot(), 1, True)

    # ── safety ───────────────────────────────────────────────────────────────
    def motion_blocked(self) -> Optional[str]:
        if self.arm.estop_active:
            return "E-STOP is active"
        if not self.animal_area:
            return None
        if self.chicken_count is None or self._clock() - self.chicken_at > HEADCOUNT_MAX_AGE_S:
            return "No recent chicken headcount - cannot verify the work area is clear"
        if self.chicken_count > 0:
            return f"{self.chicken_count} chicken(s) detected in the work area"
        return None

    # ── message handling ─────────────────────────────────────────────────────
    def handle(self, topic: str, raw: bytes | str) -> None:
        try:
            payload = json.loads(raw if isinstance(raw, str) else raw.decode("utf-8"))
        except (ValueError, UnicodeDecodeError):
            return
        if not isinstance(payload, dict):
            return
        kind = topic[len(self.topic("")):]
        # Commands carrying a seq get exactly one ack (accepted or refused + why).
        self._seq = payload.get("seq") if kind.startswith("cmd/") else None
        self._acked = False
        if kind == "cmd/estop":
            self._on_estop(bool(payload.get("active", True)))
        elif kind == "sensors":
            if isinstance(payload.get("chickenCount"), (int, float)):
                self.chicken_count, self.chicken_at = int(payload["chickenCount"]), self._clock()
        elif kind == "cmd/arm":
            self._on_arm(payload)
        elif kind == "cmd/motion":
            self._on_motion(payload)

    def _ack(self, ok: bool, error: Optional[str] = None) -> None:
        if getattr(self, "_seq", None) is not None and not getattr(self, "_acked", False):
            self._acked = True
            self._publish(self.topic("ack"), {"seq": self._seq, "ok": ok, **({"error": error} if error else {})}, 1, False)

    def _refuse(self, why: str) -> None:
        self.error = why
        print(f"⛔ refused: {why}")
        self._ack(False, why)
        self.publish_state()

    def _on_estop(self, active: bool) -> None:
        if active:
            self.policy.stop("E-STOP")
            self.arm.estop()
            if self.coordinator is not None:
                self.coordinator.gantry.estop()
            self.state, self.error = "estop", None
        else:
            self.arm.clear_estop()
            if self.coordinator is not None:
                self.coordinator.gantry.estop_active = False
            self.state = "idle"
        self._ack(True)
        self.publish_state()

    def _on_arm(self, payload: dict) -> None:
        joints = payload.get("joints")
        if not isinstance(joints, list):
            return self._refuse("cmd/arm needs a joints array")
        blocked = self.motion_blocked()
        if blocked:
            return self._refuse(blocked)
        if self.policy.running:
            return self._refuse("A policy is running - stop it before sending joint moves")
        speed = float(payload.get("speed", 0.5))
        self._ack(True)
        self._jobs.put(lambda: self.arm.move_joints(joints, speed))

    def _on_motion(self, payload: dict) -> None:
        if payload.get("policy_stop"):
            self.policy.stop()
            self._ack(True)
            return self.publish_state()
        if "policy" in payload:
            return self._start_policy(payload["policy"] or {})
        routine = payload.get("routine")
        if routine not in KNOWN_ROUTINES:
            return self._refuse(f"Unknown routine '{routine}'")
        blocked = self.motion_blocked()
        if blocked:
            return self._refuse(blocked)
        if self.coordinator is None:
            return self._refuse("Routines need the gantry + arm coordinator on this controller")
        self._ack(True)
        self._jobs.put(lambda: getattr(self.coordinator, routine)())

    def _start_policy(self, spec: dict) -> None:
        blocked = self.motion_blocked()
        if blocked:
            return self._refuse(blocked)
        simulated = self.arm.mode == "simulation"
        robot_args = [] if simulated else list(getattr(self.arm, "rollout_robot_args", lambda: [])())
        needs_port = not simulated  # LeRobot rollout opens the same serial port
        try:
            self.policy.start(
                PolicyRequest(repo_id=str(spec.get("repo_id", "")), task=str(spec.get("task", "")),
                              duration_s=int(spec.get("duration_s", 30)), sim_env=str(spec.get("sim_env", "pusht"))),
                simulated=simulated, robot_args=robot_args,
                before=self.arm.disconnect if needs_port else (lambda: None),
                after=(lambda: self._reconnect()) if needs_port else (lambda: None),
            )
            self.error = None
        except (PolicyError, ValueError, TypeError) as err:
            return self._refuse(str(err))
        self._ack(True)
        self.publish_state()

    def _reconnect(self) -> None:
        try:
            if not self.arm.estop_active:
                self.arm.connect()
        except Exception as err:  # noqa: BLE001
            self.error = f"Reconnect after policy failed: {err}"
        self.publish_state()

    # ── worker ───────────────────────────────────────────────────────────────
    def _run_jobs(self) -> None:
        while True:
            job = self._jobs.get()
            self.state, self.error = "moving", None
            self.publish_state()
            try:
                job()
            except ArmSafetyError as err:
                self.error = str(err)
            except Exception as err:  # noqa: BLE001 - keep serving after a driver fault
                self.error = f"Motion failed: {err}"
            finally:
                if not self.arm.estop_active:
                    self.state = "idle"
                self.publish_state()
                self._jobs.task_done()

    def wait_idle(self, timeout: float = 5.0) -> None:
        """Test helper: wait for queued moves to finish."""
        end = time.time() + timeout
        while self._jobs.unfinished_tasks and time.time() < end:
            time.sleep(0.01)


def main() -> None:  # pragma: no cover - wiring for real deployments
    import paho.mqtt.client as mqtt  # pip install paho-mqtt

    from coordinated_motion_controller import CoordinatedMotionController

    device_id = os.environ.get("DEVICE_ID", "ct_001")
    broker = urlparse(os.environ.get("MQTT_BROKER", "mqtt://localhost:1883"))
    animal_area = os.environ.get("ANIMAL_AREA", "true").lower() != "false"

    client = mqtt.Client(mqtt.CallbackAPIVersion.VERSION2, client_id=f"tc-arm-{device_id}")
    publish = lambda topic, body, qos, retain: client.publish(topic, json.dumps(body), qos=qos, retain=retain)

    arm = ArmFactory.create()
    coordinator = None
    if os.environ.get("WITH_GANTRY", "true").lower() != "false":
        coordinator = CoordinatedMotionController(arm=arm)
    else:
        arm.connect()
    service = ArmService(device_id, arm, publish, animal_area=animal_area, coordinator=coordinator)

    def on_connect(c, _userdata, _flags, _reason, _props=None):
        c.subscribe(service.subscriptions())
        c.publish(service.topic("status"), json.dumps({"online": True}), qos=1, retain=True)
        service.publish_state()
        print(f"✅ arm service {device_id}: {arm.describe()} on {broker.hostname}:{broker.port or 1883}")

    client.on_connect = on_connect
    client.on_message = lambda _c, _u, msg: service.handle(msg.topic, msg.payload)
    client.will_set(service.topic("status"), json.dumps({"online": False}), qos=1, retain=True)
    # connect_async + loop_start keeps retrying, so the service survives booting before
    # the broker (or a broker restart) instead of exiting with "connection refused".
    client.reconnect_delay_set(min_delay=1, max_delay=30)
    client.connect_async(broker.hostname or "localhost", broker.port or 1883)
    client.loop_start()
    try:
        while True:
            service.publish_state()
            time.sleep(STATE_INTERVAL_S)
    except KeyboardInterrupt:
        service.policy.stop("Service shutting down")
        arm.disconnect()


if __name__ == "__main__":  # pragma: no cover
    main()
