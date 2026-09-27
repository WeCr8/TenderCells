"""Simulated 6-DOF arm - same interface and safety rules as the real drivers.

Used when ARM_MODE=simulation (or ARM_TYPE=sim): routines, UI sliders and
Hugging Face policy dry-runs move a virtual arm whose joint state is published
exactly like a real one, so the 3D arm view and the whole command path can be
exercised with no hardware.
"""

from __future__ import annotations

from typing import Callable, List, Optional, Sequence

from arm_interface import ArmConfig, ArmController, interpolate, optional_sleep

SIM_CONFIG = ArmConfig(
    name="Simulated 6-DOF arm",
    dof=6,
    max_speed=180.0,
    joint_names=["base", "shoulder", "elbow", "wrist_1", "wrist_2", "wrist_3"],
    joint_limits=[(-180, 180)] * 6,
)


class SimulatedArm(ArmController):
    mode = "simulation"

    def __init__(self, config: ArmConfig = SIM_CONFIG, sleeper: Optional[Callable[[float], None]] = None,
                 on_step: Optional[Callable[[List[float]], None]] = None):
        """
        :param config:  Joint layout to simulate (defaults to a generic 6-DOF arm).
                        Pass a real platform's config to simulate that robot.
        :param sleeper: Replaces time.sleep (tests pass a no-op).
        :param on_step: Called with each intermediate pose so the service can
                        stream motion to the UI while the move runs.
        """
        super().__init__(config)
        self._pose: List[float] = [0.0] * config.dof
        self._sleeper = sleeper
        self._on_step = on_step
        self._halt = False

    def _connect(self) -> bool:
        return True

    def _move_joints(self, target: List[float], speed: float) -> None:
        self._halt = False
        deg_per_s = self.config.max_speed * speed
        largest = max(abs(t - p) for t, p in zip(target, self._pose)) if target else 0
        duration = largest / deg_per_s if deg_per_s > 0 else 0
        steps = max(1, int(duration / 0.05))  # 20 Hz like a real controller stream
        for pose in interpolate(self._pose, target, steps):
            if self._halt:
                return
            self._pose = pose
            if self._on_step:
                self._on_step(list(pose))
            optional_sleep(duration / steps, self._sleeper)

    def _read_joints(self) -> Sequence[float]:
        return list(self._pose)

    def _stop(self) -> None:
        self._halt = True
