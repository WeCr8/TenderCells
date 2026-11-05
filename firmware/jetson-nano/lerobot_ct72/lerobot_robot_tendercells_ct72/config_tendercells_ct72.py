from __future__ import annotations

from dataclasses import dataclass, field

try:  # LeRobot >= 0.4
    from lerobot.robots import RobotConfig
except Exception:  # pragma: no cover - lets the scaffold import (and be tested) without LeRobot
    class RobotConfig:  # type: ignore
        @classmethod
        def register_subclass(cls, name):
            def deco(c):
                return c
            return deco


@RobotConfig.register_subclass("tendercells_ct72")
@dataclass
class TenderCellsCT72Config(RobotConfig):
    follower_port: str = "/dev/ttyACM0"          # SO-101 follower bus board
    follower_id: str = "ct72_follower"           # lerobot-calibrate id
    cell_io_port: str = "/dev/ttyACM1"           # XIAO cell-IO node (trigger + roost + lid)
    moonraker_url: str = "http://127.0.0.1:7125"
    cell_json: str = ""                          # default: ct72/ct72_cell_a12.json
    variant: str = "plus"                        # plus (Pi 5) | pro (Jetson)
    fps: int = 30
    cams: list = field(default_factory=lambda: ["cam0_overhead", "cam1_gantry"])
    max_gantry_step_mm: float = 5.0              # per control step (150 mm/s at 30 Hz)
    max_joint_step_deg: float = 2.0              # per control step (60 deg/s at 30 Hz)
    simulate: bool = False                       # no hardware: sim gantry + sim arm + synthetic frames
