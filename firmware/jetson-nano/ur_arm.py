"""Universal Robots driver (UR3e / UR5e / UR10e / UR16e / UR20 ...).

Two backends:
  * ur_rtde (pip install ur-rtde) - preferred. Blocking moveJ, live joint feedback
    via RTDE, and triggerProtectiveStop() for E-STOP.
  * URScript socket fallback (no extra packages) - sends movej/stopj to the
    controller's secondary interface on port 30002. Joint feedback is the last
    commanded pose, so prefer ur_rtde on real hardware.

The robot must be in Remote Control mode for either backend to accept commands.
Angles are degrees here and radians on the robot.
"""

from __future__ import annotations

import math
import socket
from typing import Callable, List, Optional, Sequence

from arm_interface import ArmConfig, ArmController, optional_sleep

UR_CONFIG = ArmConfig(
    name="Universal Robots",
    dof=6,
    max_speed=180.0,
    payload_kg=3.0,
    workspace_radius_mm=500.0,
    joint_names=["base", "shoulder", "elbow", "wrist_1", "wrist_2", "wrist_3"],
    joint_limits=[(-360, 360)] * 6,
)

# Conservative defaults for a shared farm workspace (UR max is ~180 deg/s).
MAX_JOINT_SPEED_RAD_S = math.radians(90)
JOINT_ACCEL_RAD_S2 = math.radians(120)
URSCRIPT_PORT = 30002


class URArm(ArmController):
    mode = "live"

    def __init__(self, host: str, config: ArmConfig = UR_CONFIG, use_rtde: Optional[bool] = None,
                 socket_factory: Callable[..., socket.socket] = socket.create_connection,
                 sleeper: Optional[Callable[[float], None]] = None):
        """
        :param host: Robot controller IP address.
        :param use_rtde: Force (True/False) or auto-detect (None) the ur_rtde backend.
        :param socket_factory: Injected for tests (fake controller).
        """
        super().__init__(config)
        self.host = host
        self._use_rtde = use_rtde
        self._socket_factory = socket_factory
        self._sleeper = sleeper
        self._rtde_c = None
        self._rtde_r = None
        self._commanded: List[float] = [0.0] * config.dof

    # ── connection ───────────────────────────────────────────────────────────
    def _connect(self) -> bool:
        if self._use_rtde is not False:
            try:
                import rtde_control  # type: ignore
                import rtde_receive  # type: ignore

                self._rtde_c = rtde_control.RTDEControlInterface(self.host)
                self._rtde_r = rtde_receive.RTDEReceiveInterface(self.host)
                self._use_rtde = True
                return True
            except ImportError:
                if self._use_rtde:
                    raise
                self._use_rtde = False
        # URScript fallback: prove the controller is reachable.
        with self._socket_factory((self.host, URSCRIPT_PORT), timeout=3):
            pass
        return True

    def _send_script(self, script: str) -> None:
        with self._socket_factory((self.host, URSCRIPT_PORT), timeout=3) as conn:
            conn.sendall((script.strip() + "\n").encode("utf-8"))

    # ── motion ───────────────────────────────────────────────────────────────
    def _move_joints(self, target: List[float], speed: float) -> None:
        q = [math.radians(a) for a in target]
        v = MAX_JOINT_SPEED_RAD_S * speed
        if self._use_rtde:
            self._rtde_c.moveJ(q, v, JOINT_ACCEL_RAD_S2)  # blocks until done
            return
        q_txt = ", ".join(f"{a:.5f}" for a in q)
        self._send_script(f"movej([{q_txt}], a={JOINT_ACCEL_RAD_S2:.4f}, v={v:.4f})")
        # URScript over 30002 is fire-and-forget: wait roughly the move time.
        largest = max(abs(t - c) for t, c in zip(q, [math.radians(a) for a in self._commanded]))
        optional_sleep(largest / v + v / JOINT_ACCEL_RAD_S2 if v > 0 else 0, self._sleeper)
        self._commanded = list(target)

    def _read_joints(self) -> Sequence[float]:
        if self._use_rtde and self._rtde_r is not None:
            return [math.degrees(a) for a in self._rtde_r.getActualQ()]
        return list(self._commanded)

    def _stop(self) -> None:
        if self._use_rtde and self._rtde_c is not None:
            # Real protective stop - the robot must be unlocked on the teach pendant.
            self._rtde_c.triggerProtectiveStop()
            return
        self._send_script("stopj(4.0)")

    def disconnect(self) -> None:
        if self._rtde_c is not None:
            try:
                self._rtde_c.stopScript()
                self._rtde_c.disconnect()
            except Exception:  # noqa: BLE001 - best effort on shutdown
                pass
        super().disconnect()

    def describe(self) -> dict:
        info = super().describe()
        info["backend"] = "ur_rtde" if self._use_rtde else "urscript"
        return info
