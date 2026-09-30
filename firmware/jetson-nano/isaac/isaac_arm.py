"""IsaacArm - drive an arm articulation inside NVIDIA Isaac Sim through ArmController.

The MQTT arm service, routines and LeRobot policies run unchanged: set ARM_TYPE=isaac
and start the service inside Isaac Sim's Python (`./python.sh arm_service.py`), with the
stage already holding the robot at ISAAC_ARM_PRIM (default /World/arm).

Two Isaac Sim APIs are supported through small backends:
  * stable       isaacsim.core.prims.SingleArticulation      (Isaac Sim 5.x / 6.x)
  * experimental isaacsim.core.experimental.prims.Articulation (Isaac Sim 7.0+)
ISAAC_API=auto (default) tries the stable one first.

Safety rules are the same as on hardware: ArmController latches E-STOP and rejects
out-of-limit targets before anything reaches the simulator.
"""

from __future__ import annotations

import math
import os
import sys
from typing import Callable, List, Optional, Protocol, Sequence

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from arm_interface import ArmConfig, ArmController, ArmSafetyError  # noqa: E402


class ArticulationBackend(Protocol):
    """Minimal surface the driver needs from Isaac Sim (radians)."""

    dof_names: List[str]

    def read(self) -> List[float]: ...

    def set_targets(self, radians: Sequence[float]) -> None: ...

    def step(self) -> None: ...


def deg_to_rad(values: Sequence[float]) -> List[float]:
    return [math.radians(v) for v in values]


def rad_to_deg(values: Sequence[float]) -> List[float]:
    return [math.degrees(v) for v in values]


class _StableBackend:
    """Isaac Sim 5.x / 6.x: isaacsim.core.api World + SingleArticulation."""

    def __init__(self, prim_path: str):
        from isaacsim.core.api import World  # type: ignore
        from isaacsim.core.prims import SingleArticulation  # type: ignore
        from isaacsim.core.utils.types import ArticulationAction  # type: ignore

        self._action = ArticulationAction
        self.world = World.instance() or World()
        self.art = SingleArticulation(prim_path=prim_path, name="tc_arm")
        self.world.reset()
        self.art.initialize()
        self.dof_names = list(self.art.dof_names)

    def read(self) -> List[float]:
        return [float(v) for v in self.art.get_joint_positions()]

    def set_targets(self, radians: Sequence[float]) -> None:
        self.art.apply_action(self._action(joint_positions=list(radians)))

    def step(self) -> None:
        self.world.step(render=True)


class _ExperimentalBackend:
    """Isaac Sim 7.0+: isaacsim.core.experimental.prims.Articulation (warp arrays, batched)."""

    def __init__(self, prim_path: str):
        import omni.kit.app  # type: ignore
        from isaacsim.core.experimental.prims import Articulation  # type: ignore

        self._app = omni.kit.app.get_app()
        self.art = Articulation(prim_path)
        self.dof_names = list(self.art.dof_names)

    def read(self) -> List[float]:
        return [float(v) for v in self.art.get_dof_positions().numpy()[0]]

    def set_targets(self, radians: Sequence[float]) -> None:
        self.art.set_dof_position_targets([list(radians)])

    def step(self) -> None:
        self._app.update()


def make_backend(prim_path: str, api: str = "auto") -> ArticulationBackend:
    """Open the articulation with the requested Isaac Sim API ("stable" | "experimental" | "auto")."""
    api = api.lower()
    errors = []
    for name, cls in (("stable", _StableBackend), ("experimental", _ExperimentalBackend)):
        if api not in ("auto", name):
            continue
        try:
            return cls(prim_path)
        except ImportError as exc:  # this Isaac Sim version lacks that API
            errors.append(f"{name}: {exc}")
    raise ArmSafetyError(
        "Isaac Sim is not available - run inside Isaac Sim's Python (./python.sh) "
        f"with a robot at {prim_path}. ({'; '.join(errors) or 'unknown ISAAC_API ' + api})"
    )


class IsaacArm(ArmController):
    """ArmController over an Isaac Sim articulation. Angles are degrees, like every driver."""

    mode = "simulation"

    def __init__(self, prim_path: str = "/World/arm", api: str = "auto", config: Optional[ArmConfig] = None,
                 backend_factory: Optional[Callable[[], ArticulationBackend]] = None,
                 tolerance_deg: float = 0.5, max_steps: int = 600):
        self.prim_path = prim_path
        self._factory = backend_factory or (lambda: make_backend(prim_path, api))
        self._backend: Optional[ArticulationBackend] = None
        self.tolerance_deg = tolerance_deg
        self.max_steps = max_steps
        super().__init__(config or ArmConfig(name=f"Isaac Sim arm ({prim_path})", dof=6))

    def _connect(self) -> bool:
        self._backend = self._factory()
        names = list(self._backend.dof_names)
        if names and len(names) != self.config.dof:
            # Take the joint layout from the USD robot rather than guessing.
            self.config = ArmConfig(**{**self.config.__dict__, "dof": len(names), "joint_names": names,
                                       "joint_limits": [l for l in self.config.joint_limits[: len(names)]]})
        elif names and not self.config.joint_names:
            self.config.joint_names = names
        return True

    def _move_joints(self, target: List[float], speed: float) -> None:
        assert self._backend is not None
        self._backend.set_targets(deg_to_rad(target))
        # Step physics until the drive settles (PD targets take several steps).
        for _ in range(self.max_steps):
            if self.estop_active:
                return
            self._backend.step()
            now = rad_to_deg(self._backend.read())
            if max(abs(a - b) for a, b in zip(now, target)) <= self.tolerance_deg:
                return

    def _read_joints(self) -> Sequence[float]:
        assert self._backend is not None
        return rad_to_deg(self._backend.read())

    def _stop(self) -> None:
        # Hold the current pose: target = where the joints are now.
        if self._backend is not None:
            self._backend.set_targets(self._backend.read())

    def describe(self) -> dict:
        return {**super().describe(), "simulator": "isaac-sim", "primPath": self.prim_path}


__all__ = ["IsaacArm", "ArticulationBackend", "make_backend", "deg_to_rad", "rad_to_deg"]
