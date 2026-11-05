from __future__ import annotations

from dataclasses import dataclass
from typing import Callable, Optional

try:
    from lerobot.teleoperators import Teleoperator, TeleoperatorConfig
except Exception:  # pragma: no cover
    class TeleoperatorConfig:  # type: ignore
        @classmethod
        def register_subclass(cls, name):
            return lambda c: c

    class Teleoperator:  # type: ignore
        def __init__(self, config):
            self.config = config

JOINTS = ("shoulder_pan", "shoulder_lift", "elbow_flex", "wrist_flex", "wrist_roll", "gripper")


@TeleoperatorConfig.register_subclass("tendercells_ct72_teleop")
@dataclass
class TenderCellsCT72TeleopConfig(TeleoperatorConfig):
    leader_port: str = "/dev/ttyACM2"
    leader_id: str = "ct72_leader"
    gantry_speed_mm_s: float = 80.0
    fps: int = 30
    simulate: bool = False


class TenderCellsCT72Teleop(Teleoperator):
    config_class = TenderCellsCT72TeleopConfig
    name = "tendercells_ct72_teleop"

    def __init__(self, config: TenderCellsCT72TeleopConfig, read_gamepad: Optional[Callable[[], dict]] = None,
                 read_gantry: Optional[Callable[[], tuple]] = None):
        super().__init__(config)
        self.config = config
        self.leader = None
        self.read_gamepad = read_gamepad or (lambda: {"lx": 0.0, "ly": 0.0, "lt": 0.0, "rt": 0.0, "deadman": False})
        self.read_gantry = read_gantry or (lambda: (0.0, 0.0, 0.0))
        self._connected = False

    @property
    def action_features(self) -> dict:
        f = {f"{j}.pos": float for j in JOINTS}
        f.update({"gantry.x": float, "gantry.y": float, "gantry.z": float})
        return f

    @property
    def feedback_features(self) -> dict:
        return {}

    @property
    def is_connected(self) -> bool:
        return self._connected

    @property
    def is_calibrated(self) -> bool:
        return True

    def connect(self, calibrate: bool = True) -> None:
        if not self.config.simulate:  # pragma: no cover
            from lerobot.teleoperators import make_teleoperator_from_config
            try:
                from lerobot.teleoperators.so_leader import SO101LeaderConfig
            except Exception:
                from lerobot.teleoperators.so101_leader import SO101LeaderConfig
            self.leader = make_teleoperator_from_config(SO101LeaderConfig(port=self.config.leader_port, id=self.config.leader_id))
            self.leader.connect(calibrate=calibrate)
        self._connected = True

    def calibrate(self) -> None:
        pass

    def configure(self) -> None:
        pass

    def get_action(self) -> dict:
        act = self.leader.get_action() if self.leader is not None else {f"{j}.pos": 0.0 for j in JOINTS}
        gp = self.read_gamepad()
        x, y, z = self.read_gantry()
        step = self.config.gantry_speed_mm_s / self.config.fps
        if gp.get("deadman"):
            x += gp.get("lx", 0.0) * step
            y += gp.get("ly", 0.0) * step
            z += (gp.get("rt", 0.0) - gp.get("lt", 0.0)) * step
        act.update({"gantry.x": x, "gantry.y": y, "gantry.z": z})
        return act

    def send_feedback(self, feedback: dict) -> None:
        pass

    def disconnect(self) -> None:
        if self.leader is not None:  # pragma: no cover
            self.leader.disconnect()
        self._connected = False
