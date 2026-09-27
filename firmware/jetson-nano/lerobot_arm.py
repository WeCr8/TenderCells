"""Hugging Face LeRobot driver - any robot LeRobot supports (SO-100/SO-101, Koch,
OMX, OpenArm, reBot, bimanual variants, ...) behind the Tender Cells arm interface.

Uses LeRobot's own public API (lerobot >= 0.6, Python >= 3.12):
    RobotConfig.get_choice_class(<type>)(port=..., id=...) -> make_robot_from_config(cfg)
    robot.connect(); robot.get_observation() -> {"<motor>.pos": value, ...}
    robot.send_action({"<motor>.pos": value, ...})
Joint names come from the robot's own action_features, so new LeRobot robots work
without code changes here. Install on the controller:  pip install "lerobot[feetech]"
(SO-10x) or "lerobot[dynamixel]" (Koch/OMX).

Calibrate once with LeRobot first (lerobot-calibrate --robot.type=... --robot.port=...)
using the same --robot.id as LEROBOT_ID, so positions are in calibrated degrees.
"""

from __future__ import annotations

import dataclasses
import importlib
from typing import Any, Callable, Dict, List, Optional, Sequence

from arm_interface import ArmConfig, ArmController, ArmSafetyError, optional_sleep

# LeRobot registers a robot's config class when its package is imported (their
# own scripts import these the same way). Missing packages are skipped.
_ROBOT_PACKAGES = [
    "so_follower", "koch_follower", "omx_follower", "openarm_follower", "bi_so_follower",
    "bi_openarm_follower", "rebot_b601_follower", "bi_rebot_b601_follower", "hope_jr",
    "lekiwi", "reachy2", "earthrover_mini_plus", "unitree_g1",
]
CONTROL_HZ = 30


def make_lerobot_robot(robot_type: str, port: Optional[str], robot_id: Optional[str],
                       extra: Optional[Dict[str, Any]] = None):
    """Build a LeRobot robot from its type string, e.g. "so101_follower"."""
    try:
        from lerobot.robots import RobotConfig, make_robot_from_config  # type: ignore
    except ImportError as err:  # pragma: no cover - exercised on real controllers
        raise ArmSafetyError(
            'LeRobot is not installed. On the controller run: pip install "lerobot[feetech]" '
            "(needs Python 3.12+)"
        ) from err
    for pkg in _ROBOT_PACKAGES:
        try:
            importlib.import_module(f"lerobot.robots.{pkg}")
        except ImportError:
            continue
    try:
        cfg_cls = RobotConfig.get_choice_class(robot_type)
    except Exception as err:  # draccus raises KeyError/ValueError for unknown names
        raise ArmSafetyError(f"LeRobot does not know robot type '{robot_type}'") from err
    field_names = {f.name for f in dataclasses.fields(cfg_cls)}
    kwargs: Dict[str, Any] = {k: v for k, v in (extra or {}).items() if k in field_names}
    if port and "port" in field_names:
        kwargs["port"] = port
    if robot_id:
        kwargs["id"] = robot_id
    # Keep torque on when the service hands the port to a policy run, so the arm
    # holds its pose instead of dropping (E-STOP disables torque explicitly).
    if "disable_torque_on_disconnect" in field_names:
        kwargs.setdefault("disable_torque_on_disconnect", False)
    return make_robot_from_config(cfg_cls(**kwargs))


class LeRobotArm(ArmController):
    mode = "live"

    def __init__(self, robot_type: str, port: Optional[str] = None, robot_id: Optional[str] = None,
                 extra: Optional[Dict[str, Any]] = None, robot_factory: Callable[..., Any] = make_lerobot_robot,
                 sleeper: Optional[Callable[[float], None]] = None, max_speed_deg_s: float = 90.0):
        """
        :param robot_type: LeRobot type string, e.g. "so101_follower", "koch_follower".
        :param port:       Serial port (e.g. /dev/ttyACM0) for bus-servo arms.
        :param robot_id:   LeRobot calibration id (same as used with lerobot-calibrate).
        :param robot_factory: Injected for tests.
        """
        super().__init__(ArmConfig(name=f"LeRobot {robot_type}", dof=0, max_speed=max_speed_deg_s))
        self.robot_type = robot_type
        self.port = port
        self.robot_id = robot_id
        self.extra = dict(extra or {})
        self._factory = robot_factory
        self._sleeper = sleeper
        self._robot = None
        self._halt = False

    # ── connection ───────────────────────────────────────────────────────────
    def _connect(self) -> bool:
        self._robot = self._factory(self.robot_type, self.port, self.robot_id, self.extra)
        self._robot.connect()
        names = [k[:-4] for k in self._robot.action_features if k.endswith(".pos")]
        if not names:
            raise ArmSafetyError(f"{self.robot_type} exposes no joint position actions (is it a mobile base?)")
        self.config.dof = len(names)
        self.config.joint_names = names
        # Calibrated degrees for joints; LeRobot grippers are 0-100 (% open).
        self.config.joint_limits = [(0, 100) if "gripper" in n else (-180, 180) for n in names]
        return True

    def disconnect(self) -> None:
        if self._robot is not None and getattr(self._robot, "is_connected", False):
            self._robot.disconnect()
        super().disconnect()

    # ── motion ───────────────────────────────────────────────────────────────
    def _read_joints(self) -> Sequence[float]:
        obs = self._robot.get_observation()
        return [float(obs.get(f"{n}.pos", 0.0)) for n in self.config.joint_names]

    def _send(self, pose: Sequence[float]) -> None:
        self._robot.send_action({f"{n}.pos": float(v) for n, v in zip(self.config.joint_names, pose)})

    def _move_joints(self, target: List[float], speed: float) -> None:
        # Stream small steps (LeRobot arms are position-servoed; a big jump in one
        # command would slam the joints). Also honours the robot's own
        # max_relative_target clipping inside send_action.
        self._halt = False
        current = list(self._read_joints())
        max_step = max(0.5, self.config.max_speed * speed / CONTROL_HZ)
        while not self._halt:
            deltas = [t - c for t, c in zip(target, current)]
            if all(abs(d) < 0.25 for d in deltas):
                break
            current = [c + max(-max_step, min(max_step, d)) for c, d in zip(current, deltas)]
            self._send(current)
            optional_sleep(1.0 / CONTROL_HZ, self._sleeper)

    def _stop(self) -> None:
        # Project rule: E-STOP cuts power to actuators. Bus-servo arms go limp.
        self._halt = True
        bus = getattr(self._robot, "bus", None)
        if bus is not None and hasattr(bus, "disable_torque"):
            bus.disable_torque()
        else:
            self._robot.disconnect()
            self.is_connected = False

    def describe(self) -> dict:
        info = super().describe()
        info.update({"lerobotType": self.robot_type, "port": self.port, "robotId": self.robot_id})
        return info

    # Used by the policy runner to build the matching lerobot-rollout command.
    def rollout_robot_args(self) -> List[str]:
        args = [f"--robot.type={self.robot_type}"]
        if self.port:
            args.append(f"--robot.port={self.port}")
        if self.robot_id:
            args.append(f"--robot.id={self.robot_id}")
        return args
