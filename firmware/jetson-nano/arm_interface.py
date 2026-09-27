"""Common interface for every arm / motion platform the Tender Cells arm service drives.

`coordinated_motion_controller.py` and `gantry_controller.py` imported this module
(and `arm_factory`) but neither existed, so no arm platform could actually run.
Every driver - simulator, Universal Robots, Hugging Face LeRobot, the XYZ gantry -
implements `ArmController` so the MQTT service, routines and policies treat them
the same in simulation and live.

Units: joint angles in degrees, Cartesian positions in millimetres, speed 0..1.
"""

from __future__ import annotations

import abc
from dataclasses import dataclass, field
from typing import List, Optional, Sequence


@dataclass
class ArmConfig:
    """Static description of an arm platform."""

    name: str
    dof: int
    kinematics_type: str = "revolute"  # "revolute" | "linear"
    max_speed: float = 180.0  # deg/s (revolute) or mm/s (linear)
    payload_kg: float = 0.5
    workspace_radius_mm: float = 500.0
    joint_names: List[str] = field(default_factory=list)
    # (min, max) per joint, degrees. Commands outside are rejected, never clipped
    # silently, so a bad routine or policy shows up as an error.
    joint_limits: List[tuple] = field(default_factory=list)


class ArmSafetyError(RuntimeError):
    """Raised when a command is refused for safety (E-STOP latched, out of limits)."""


class ArmController(abc.ABC):
    """Base class for all arm drivers.

    Subclasses implement the hardware-specific `_connect`, `_move_joints`,
    `_read_joints` and `_stop`. This base class owns the safety rules that must
    hold on every platform: E-STOP latches and blocks motion until cleared, and
    joint targets are checked against limits before anything moves.
    """

    #: "simulation" or "live" - reported in state so the UI can show it.
    mode: str = "live"

    def __init__(self, config: ArmConfig):
        self.config = config
        self.is_connected = False
        self.estop_active = False
        self.joint_angles: List[float] = [0.0] * config.dof

    # ── public API used by the service, routines and policies ─────────────────
    def connect(self) -> bool:
        self.is_connected = bool(self._connect())
        if self.is_connected:
            self.joint_angles = list(self._read_joints())
        return self.is_connected

    def move_joints(self, angles: Sequence[float], speed: float = 0.5) -> bool:
        """Move to absolute joint angles (degrees). Blocks until the move completes."""
        if self.estop_active:
            raise ArmSafetyError("E-STOP is active - clear it before moving the arm")
        if not self.is_connected:
            raise ArmSafetyError(f"{self.config.name} is not connected")
        target = self._validate(angles)
        speed = min(1.0, max(0.05, float(speed)))
        self._move_joints(target, speed)
        self.joint_angles = list(self._read_joints())
        return True

    def move_cartesian(self, x, y, z, rx=0.0, ry=0.0, rz=0.0) -> bool:
        raise NotImplementedError(f"{self.config.name} does not support Cartesian moves; send joint angles")

    def get_joint_state(self) -> List[float]:
        if self.is_connected:
            self.joint_angles = list(self._read_joints())
        return list(self.joint_angles)

    def estop(self) -> bool:
        """Stop immediately and latch. Always allowed, even when disconnected."""
        self.estop_active = True
        try:
            if self.is_connected:
                self._stop()
        finally:
            print(f"⚠️  {self.config.name}: E-STOP latched")
        return True

    def clear_estop(self) -> None:
        self.estop_active = False

    def disconnect(self) -> None:
        self.is_connected = False

    # ── helpers ───────────────────────────────────────────────────────────────
    def _validate(self, angles: Sequence[float]) -> List[float]:
        values = [float(a) for a in angles]
        if len(values) != self.config.dof:
            raise ArmSafetyError(f"{self.config.name} needs {self.config.dof} joint values, got {len(values)}")
        for i, (value, limits) in enumerate(zip(values, self.config.joint_limits or [])):
            lo, hi = limits
            if not lo <= value <= hi:
                name = self.config.joint_names[i] if i < len(self.config.joint_names) else f"joint {i + 1}"
                raise ArmSafetyError(f"{name} target {value:.1f}° is outside its limit [{lo}, {hi}]")
        return values

    # ── driver hooks ──────────────────────────────────────────────────────────
    @abc.abstractmethod
    def _connect(self) -> bool: ...

    @abc.abstractmethod
    def _move_joints(self, target: List[float], speed: float) -> None: ...

    @abc.abstractmethod
    def _read_joints(self) -> Sequence[float]: ...

    @abc.abstractmethod
    def _stop(self) -> None: ...

    def describe(self) -> dict:
        """Summary published in state/arm so the UI knows what it is driving."""
        return {
            "platform": self.config.name,
            "mode": self.mode,
            "dof": self.config.dof,
            "jointNames": self.config.joint_names,
        }


def interpolate(start: Sequence[float], end: Sequence[float], steps: int) -> List[List[float]]:
    """Evenly spaced waypoints from start to end (excluding start, including end)."""
    steps = max(1, int(steps))
    return [[s + (e - s) * (i / steps) for s, e in zip(start, end)] for i in range(1, steps + 1)]


def optional_sleep(seconds: float, sleeper=None) -> None:
    """Sleep hook so tests can run motion instantly."""
    import time

    (sleeper or time.sleep)(max(0.0, seconds))


__all__ = ["ArmConfig", "ArmController", "ArmSafetyError", "interpolate", "optional_sleep"]
