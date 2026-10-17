"""Movable roost bars (CT72 rev A1.2) - host-side controller for the XIAO cell-IO node.

The safety-relevant loop runs ON the cell-IO node (firmware/ct72-cell-io): it refuses to start a move when a
bar's load cells read a bird, stops on a load rise / over-current / timeout, and trusts only its limit
switches. This host class adds the second, independent check - the camera occupancy count - and sequences
both bars. Protocol: newline-delimited JSON over USB-CDC (see firmware/ct72-cell-io/README.md).

Interlock rules (all must hold to MOVE, re-checked continuously while moving):
  1 E-stop chain closed and the gantry PARKED or outside the roost sweep zone (host enforces)
  2 load cells: bar load <= tare + EMPTY_KG on every bar that will move (node enforces, host double-checks)
  3 camera: 0 birds detected in the roost zone within the last CAMERA_MAX_AGE_S (host enforces)
  4 motion is slow (actuator ~8-12 mm/s -> bar tip <= ~60 mm/s), stops at limit switches, 20 s timeout
Manual fallback: pull the actuator quick-release pin and swing the bar by hand onto its detent pin.
"""
from __future__ import annotations

import json
import time
from dataclasses import dataclass, field
from typing import Callable, Dict, List, Optional

EMPTY_KG = 0.3              # a hen is ~1.8-3 kg; 0.3 kg above tare = occupied
CAMERA_MAX_AGE_S = 1.0
MOVE_TIMEOUT_S = 20.0
BARS = ("A", "B")


class RoostInterlock(RuntimeError):
    """A roost move was refused or aborted for safety."""


@dataclass
class BarState:
    name: str
    position: str = "unknown"      # deployed | stowed | moving | unknown | fault
    load_kg: float = 0.0
    tare_kg: float = 0.0
    current_a: float = 0.0
    fault: str = ""


class CellIOLink:
    """Abstract link to the cell-IO node. send(cmd) -> reply dict."""

    def send(self, cmd: dict) -> dict:  # pragma: no cover - interface
        raise NotImplementedError


class SerialCellIO(CellIOLink):  # pragma: no cover - needs hardware
    def __init__(self, port: str = "/dev/ttyACM1", baud: int = 921600):
        import serial  # pyserial
        self.s = serial.Serial(port, baud, timeout=0.5)

    def send(self, cmd: dict) -> dict:
        self.s.write((json.dumps(cmd) + "\n").encode())
        line = self.s.readline().decode().strip()
        return json.loads(line) if line else {"ok": False, "err": "timeout"}


class SimCellIO(CellIOLink):
    """Simulated node with the same refusal rules (used by tests and ARM_MODE=simulation)."""

    def __init__(self):
        self.bars = {b: BarState(b, "deployed") for b in BARS}
        self.estop_ok = True
        self.trigger_hz = 0

    def send(self, cmd: dict) -> dict:
        c = cmd.get("cmd")
        if c == "status":
            return {"ok": True, "estop_ok": self.estop_ok,
                    "bars": {b: {"pos": s.position, "load_kg": s.load_kg, "tare_kg": s.tare_kg, "fault": s.fault} for b, s in self.bars.items()}}
        if c == "roost":
            b = self.bars[cmd["bar"]]
            if not self.estop_ok:
                return {"ok": False, "err": "estop"}
            if b.load_kg - b.tare_kg > EMPTY_KG:
                return {"ok": False, "err": f"occupied {b.load_kg - b.tare_kg:.2f} kg"}
            b.position = cmd["to"]
            return {"ok": True, "pos": b.position}
        if c == "trigger":
            self.trigger_hz = int(cmd.get("hz", 0))
            return {"ok": True, "hz": self.trigger_hz}
        if c == "lid":
            return {"ok": True, "lid": cmd["to"]}
        return {"ok": False, "err": "unknown cmd"}


class RoostController:
    def __init__(self, link: CellIOLink, camera_birds_in_roost_zone: Callable[[], tuple],
                 gantry_clear_of_roost: Callable[[], bool], clock: Callable[[], float] = time.monotonic):
        """
        :param camera_birds_in_roost_zone: returns (count, t_detect_monotonic) from the occupancy detector
        :param gantry_clear_of_roost: True when the gantry is PARKED or outside the roost sweep zone
        """
        self.link = link
        self.camera = camera_birds_in_roost_zone
        self.gantry_clear = gantry_clear_of_roost
        self.clock = clock
        self.log: List[dict] = []

    def status(self) -> dict:
        return self.link.send({"cmd": "status"})

    def _preflight(self, bars) -> None:
        st = self.status()
        if not st.get("estop_ok", False):
            raise RoostInterlock("E-stop chain open")
        if not self.gantry_clear():
            raise RoostInterlock("gantry not parked / inside the roost sweep zone")
        n, t = self.camera()
        if self.clock() - t > CAMERA_MAX_AGE_S:
            raise RoostInterlock(f"camera occupancy is stale ({self.clock() - t:.1f} s old)")
        if n > 0:
            raise RoostInterlock(f"camera sees {n} bird(s) in the roost zone")
        for b in bars:
            s = st["bars"][b]
            if s["load_kg"] - s["tare_kg"] > EMPTY_KG:
                raise RoostInterlock(f"bar {b} load {s['load_kg'] - s['tare_kg']:.2f} kg above tare - bird on the bar")
            if s.get("fault"):
                raise RoostInterlock(f"bar {b} fault: {s['fault']}")

    def move(self, to: str, bars=BARS) -> None:
        """to = 'stowed' (retract out of the gantry path) or 'deployed'. Moves bars one at a time, upper first
        when stowing (B nests inside A's stowed envelope), lower first when deploying."""
        assert to in ("stowed", "deployed")
        order = list(bars) if to == "deployed" else list(reversed(bars))
        for b in order:
            self._preflight([b])
            r = self.link.send({"cmd": "roost", "bar": b, "to": to, "timeout_s": MOVE_TIMEOUT_S})
            self.log.append({"t": time.time(), "bar": b, "to": to, "reply": r})
            if not r.get("ok"):
                raise RoostInterlock(f"node refused/aborted bar {b} -> {to}: {r.get('err')}")
            if r.get("pos") != to:
                raise RoostInterlock(f"bar {b} did not reach {to} (limit switch says {r.get('pos')})")

    def all_in(self, pos: str) -> bool:
        st = self.status()
        return all(st["bars"][b]["pos"] == pos for b in BARS)
