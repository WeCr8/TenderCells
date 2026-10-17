"""Belt gantry driver for CT72 rev A1.2: Klipper (Moonraker HTTP API) or a simulator, with the host-side zone
guard and a timestamped position history (capture-time interpolation for the dataset).

Klipper config: firmware/ct72-gantry-klipper/printer.cfg (dual-X squaring, Z homes UP, soft limits).
Absolute moves only (G90). The arm hangs from the plate; `pz` = plate underside height (mm).
"""
from __future__ import annotations

import bisect
import json
import time
import urllib.request
from dataclasses import dataclass, field
from typing import Callable, List, Optional, Sequence, Tuple

from .cell import Cell, ZoneViolation

MAX_FEED_MM_S = 150.0     # routine speed cap (animal-safe); Klipper max_velocity is the hard cap
SLOW_FEED_MM_S = 40.0     # near boxes / basket / insert moves


@dataclass
class PosSample:
    t_ns: int
    xyz: Tuple[float, float, float]


class GantryBase:
    def __init__(self, cell: Optional[Cell] = None, clock: Callable[[], int] = time.monotonic_ns):
        self.cell = cell
        self.clock = clock
        self.history: List[PosSample] = []
        self.homed = False
        self.estopped = False
        self.parked = False

    # -- API used by the routines
    def home(self) -> None: ...
    def _move(self, xyz, feed) -> None: ...
    def position(self) -> Tuple[float, float, float]: ...

    def move_to(self, xyz: Sequence[float], feed: float = MAX_FEED_MM_S, check: bool = True) -> None:
        if self.estopped:
            raise RuntimeError("gantry E-STOP latched")
        if not self.homed:
            raise RuntimeError("gantry not homed")
        if check and self.cell is not None:
            self.cell.check_target(xyz)
        self._move(tuple(float(v) for v in xyz), min(feed, MAX_FEED_MM_S))
        self.parked = self.cell is not None and all(abs(a - b) < 1.0 for a, b in zip(xyz, self.cell.park))

    def park(self) -> None:
        if self.cell is None:
            raise RuntimeError("no cell geometry loaded")
        x, y, z = self.position()
        self.move_to((x, y, max(z, self.cell.transit_z)), check=False)
        self.move_to(self.cell.park, check=False)
        self.parked = True

    def record(self) -> None:
        self.history.append(PosSample(self.clock(), self.position()))
        self.history = self.history[-5000:]

    def position_at(self, t_ns: int) -> Tuple[float, float, float]:
        """Linear interpolation of the logged positions at a capture time (dataset stamping)."""
        if not self.history:
            return self.position()
        ts = [s.t_ns for s in self.history]
        i = bisect.bisect_left(ts, t_ns)
        if i <= 0:
            return self.history[0].xyz
        if i >= len(ts):
            return self.history[-1].xyz
        a, b = self.history[i - 1], self.history[i]
        f = (t_ns - a.t_ns) / max(1, b.t_ns - a.t_ns)
        return tuple(pa + (pb - pa) * f for pa, pb in zip(a.xyz, b.xyz))

    def estop(self) -> None:
        self.estopped = True


class SimGantry(GantryBase):
    mode = "simulation"

    def __init__(self, cell: Optional[Cell] = None, clock: Callable[[], int] = time.monotonic_ns):
        super().__init__(cell, clock)
        self._pos = (0.0, 0.0, 0.0)
        self.moves: List[Tuple[Tuple[float, float, float], float]] = []

    def home(self) -> None:
        # Z homes UP first (away from birds), then X (both sides, squaring) and Y
        if self.cell is not None:
            self._pos = (self.cell.travel["x"][0], self.cell.travel["y"][0], self.cell.travel["z"][1])
        self.homed = True
        self.record()

    def _move(self, xyz, feed) -> None:
        self.moves.append((xyz, feed))
        self._pos = xyz
        self.record()

    def position(self):
        return self._pos


class KlipperGantry(GantryBase):  # pragma: no cover - needs a running Klipper/Moonraker
    mode = "live"

    def __init__(self, cell: Optional[Cell] = None, url: str = "http://127.0.0.1:7125", **kw):
        super().__init__(cell, **kw)
        self.url = url.rstrip("/")

    def _post(self, path: str, data: dict) -> dict:
        req = urllib.request.Request(self.url + path, data=json.dumps(data).encode(), headers={"Content-Type": "application/json"})
        with urllib.request.urlopen(req, timeout=120) as r:
            return json.loads(r.read())

    def _get(self, path: str) -> dict:
        with urllib.request.urlopen(self.url + path, timeout=5) as r:
            return json.loads(r.read())

    def gcode(self, script: str) -> None:
        self._post("/printer/gcode/script", {"script": script})

    def home(self) -> None:
        self.gcode("CELL_HOME")          # macro: G28 Z (up) then G28 X Y with dual-X squaring
        self.homed = True
        self.record()

    def _move(self, xyz, feed) -> None:
        self.gcode(f"G90\nG1 X{xyz[0]:.2f} Y{xyz[1]:.2f} Z{xyz[2]:.2f} F{feed * 60:.0f}\nM400")
        self.record()

    def position(self):
        d = self._get("/printer/objects/query?motion_report")
        p = d["result"]["status"]["motion_report"]["live_position"]
        return (float(p[0]), float(p[1]), float(p[2]))

    def estop(self) -> None:
        super().estop()
        try:
            self._post("/printer/emergency_stop", {})
        except Exception:
            pass   # the hardware E-stop chain cuts motor power regardless
