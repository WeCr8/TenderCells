"""TenderCells CT72 robot for LeRobot: gantry XYZ (3) + SO-101 joints (6) as one robot.

Observation (per control step, 30 Hz, all stamped at CAPTURE time on the shared cell clock):
  <joint>.pos x6, gantry.x/.y/.z (mm, interpolated at the trigger time), <cam> images,
  timing.t_trigger_ns, timing.clock_offset_ns, timing.joint_uncert_ns, timing.cam_skew_ns
  -> the clock offset and uncertainties are logged PER SAMPLE in the dataset itself (project timing rule).
Action: <joint>.pos x6 + gantry.x/.y/.z targets (step-limited, zone-checked against ct72_cell_a12.json).
Safety stays outside the policy: E-stop chain, cell-IO interlocks, Klipper soft limits, host no-go zones, the
torque caps of ct72.so101_limits and the gripper force cap. A refused action is clipped and logged, never forced.
"""
from __future__ import annotations

import os
import sys
import time
from typing import Any, Dict, Optional

from .config_tendercells_ct72 import TenderCellsCT72Config

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, os.path.abspath(os.path.join(HERE, "..", "..")))   # firmware/jetson-nano (ct72 package)

from ct72.cell import Cell, ZoneViolation          # noqa: E402
from ct72.gantry import KlipperGantry, SimGantry   # noqa: E402
from ct72.timing import ClockOffsetSource, now_ns, stamp_bus_read  # noqa: E402

JOINTS = ("shoulder_pan", "shoulder_lift", "elbow_flex", "wrist_flex", "wrist_roll", "gripper")
GANTRY = ("gantry.x", "gantry.y", "gantry.z")
TIMING = ("timing.t_trigger_ns", "timing.clock_offset_ns", "timing.joint_uncert_ns", "timing.cam_skew_ns")

try:
    from lerobot.robots import Robot
except Exception:  # pragma: no cover
    class Robot:  # type: ignore
        def __init__(self, config):
            self.config = config


class TenderCellsCT72(Robot):
    config_class = TenderCellsCT72Config
    name = "tendercells_ct72"

    def __init__(self, config: TenderCellsCT72Config):
        super().__init__(config)
        self.config = config
        self.cell = Cell.load(config.cell_json or os.path.join(HERE, "..", "..", "ct72", "ct72_cell_a12.json"), config.variant)
        self.gantry = SimGantry(self.cell) if config.simulate else KlipperGantry(self.cell, config.moonraker_url)
        self.offsets = ClockOffsetSource(reader=(lambda: 0.0) if config.simulate else None)
        self.follower = None
        self.cams: Dict[str, Any] = {}
        self._connected = False
        self._sim_joints = {j: 0.0 for j in JOINTS}
        self.refusals = 0

    # ---------------------------------------------------------------- features
    @property
    def observation_features(self) -> dict:
        f = {f"{j}.pos": float for j in JOINTS}
        f.update({g: float for g in GANTRY})
        f.update({t: int for t in TIMING})
        f.update({c: (480, 640, 3) for c in self.config.cams})
        return f

    @property
    def action_features(self) -> dict:
        f = {f"{j}.pos": float for j in JOINTS}
        f.update({g: float for g in GANTRY})
        return f

    @property
    def is_connected(self) -> bool:
        return self._connected

    @property
    def is_calibrated(self) -> bool:
        return self.config.simulate or (self.follower is not None and self.follower.is_calibrated)

    # ---------------------------------------------------------------- lifecycle
    def connect(self, calibrate: bool = True) -> None:
        if not self.config.simulate:  # pragma: no cover - hardware
            from lerobot.robots import make_robot_from_config
            try:
                from lerobot.robots.so_follower import SO101FollowerConfig
            except Exception:
                from lerobot.robots.so101_follower import SO101FollowerConfig
            self.follower = make_robot_from_config(SO101FollowerConfig(port=self.config.follower_port, id=self.config.follower_id, cameras={}))
            self.follower.connect(calibrate=calibrate)
            from ct72.so101_limits import apply_limits
            apply_limits(self.follower)
            from .triggered_cams import open_triggered_cams
            self.cams = open_triggered_cams(self.config.cams, self.config.fps)
        self.gantry.home()
        self._connected = True

    def calibrate(self) -> None:  # pragma: no cover
        if self.follower is not None:
            self.follower.calibrate()

    def configure(self) -> None:
        pass

    def disconnect(self) -> None:
        if self.follower is not None:  # pragma: no cover
            self.follower.disconnect()
        for c in self.cams.values():  # pragma: no cover
            c.close()
        self._connected = False

    # ---------------------------------------------------------------- I/O
    def _read_joints(self) -> dict:
        if self.config.simulate:
            return {f"{j}.pos": v for j, v in self._sim_joints.items()}
        obs = self.follower.get_observation()  # pragma: no cover
        return {k: v for k, v in obs.items() if k.endswith(".pos")}

    def get_observation(self) -> dict:
        off = self.offsets.offset_ns()
        frames, t_trig, skew = {}, now_ns(), 0
        if self.cams:  # pragma: no cover - hardware: frames carry the trigger-edge stamp from the sensor metadata
            stamps = {}
            for name, cam in self.cams.items():
                img, t_cap = cam.read_with_stamp()
                frames[name], stamps[name] = img, t_cap
            t_trig = min(stamps.values()); skew = max(stamps.values()) - t_trig
        elif self.config.simulate:
            import numpy as np
            frames = {c: np.zeros((480, 640, 3), dtype=np.uint8) for c in self.config.cams}
        joints, st = stamp_bus_read(self._read_joints, offset=off)
        g = self.gantry.position_at(t_trig)
        obs = dict(joints)
        obs.update({"gantry.x": g[0], "gantry.y": g[1], "gantry.z": g[2]})
        obs.update({"timing.t_trigger_ns": int(t_trig), "timing.clock_offset_ns": int(off),
                    "timing.joint_uncert_ns": int(st.uncertainty_ns), "timing.cam_skew_ns": int(skew)})
        obs.update(frames)
        return obs

    def send_action(self, action: dict) -> dict:
        cur = self.gantry.position()
        tgt = []
        for i, k in enumerate(GANTRY):
            want = float(action.get(k, cur[i]))
            step = max(-self.config.max_gantry_step_mm, min(self.config.max_gantry_step_mm, want - cur[i]))
            tgt.append(cur[i] + step)
        try:
            self.cell.check_target(tgt)
            self.gantry.move_to(tgt, check=False)
        except ZoneViolation:
            self.refusals += 1
            tgt = list(cur)
        joints = {}
        now = self._read_joints()
        for j in JOINTS:
            k = f"{j}.pos"
            want = float(action.get(k, now[k]))
            joints[k] = now[k] + max(-self.config.max_joint_step_deg, min(self.config.max_joint_step_deg, want - now[k]))
        if self.config.simulate:
            self._sim_joints = {j: joints[f"{j}.pos"] for j in JOINTS}
        else:  # pragma: no cover
            self.follower.send_action(joints)
        out = dict(joints)
        out.update({"gantry.x": tgt[0], "gantry.y": tgt[1], "gantry.z": tgt[2]})
        return out
