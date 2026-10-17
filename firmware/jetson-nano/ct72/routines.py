"""CT72 rev A1.2 routine state machines: EGG COLLECTION and CLEANING.

    egg:   PREFLIGHT -> RETRACT_ROOSTS -> OPEN_LIDS -> for each nest box:
              GOTO_BOX -> DETECT -> (per egg: CHOOSE_APPROACH -> PICK -> PLACE_IN_BASKET -> COUNT) ->
           CLOSE_LIDS -> PARK -> DEPLOY_ROOSTS -> DONE
    clean: PREFLIGHT -> RETRACT_ROOSTS -> (lids closed) -> CLEAN_PASS -> PARK -> DEPLOY_ROOSTS -> DONE
    any error -> ABORT (stop, try to park, leave the roosts STOWED if the arm could not park) -> FAULT

Preflight (both): E-stop chain closed, gantry homed, inside a schedule window, timestamp audit fresh (only when
recording), no birds on the cell floor (pop door closed with the flock in the run) and none on the roosts.
A hen sitting in a nest box -> that box is skipped this pass and logged (never reach under a bird).

TOP or SIDE: each nest box and the basket carry offline-checked approaches (cad/reach_routines.py) for the
centre and the four inset corners. The egg's detected position picks the nearest checked target, TOP is used
when the lid is open and clear, otherwise SIDE; the gantry then translates by the small residual offset with
the arm pose unchanged (the gantry's redundancy), and the final insertion is a straight gantry move along the
tool axis. The same rule picks TOP/SIDE for placing into the basket.
"""
from __future__ import annotations

import datetime as dt
import json
import math
import time
from dataclasses import asdict, dataclass, field
from typing import Callable, List, Optional, Sequence, Tuple

from .cell import Approach, Cell, ZoneViolation
from .roost import RoostController, RoostInterlock

INSERT_MM = 100.0          # straight-line insertion along the tool axis (matches the offline approach check)
MAX_RESIDUAL_MM = 70.0     # gantry may shift the checked pose by at most this much toward the egg
DEFAULT_WINDOWS = {"egg": [("10:30", "11:30"), ("14:00", "15:00"), ("17:30", "18:30")], "clean": [("12:00", "13:00")]}


class RoutineAbort(RuntimeError):
    pass


@dataclass
class Egg:
    box: str
    xyz: Tuple[float, float, float]   # egg centre, cell frame (mm)
    confidence: float = 1.0


@dataclass
class EggLogEntry:
    t: float
    box: str
    ok: bool
    approach: str = ""
    place_approach: str = ""
    note: str = ""


@dataclass
class RoutineReport:
    kind: str
    state: str = "IDLE"
    eggs_collected: int = 0
    eggs_failed: int = 0
    boxes_skipped: List[str] = field(default_factory=list)
    log: List[EggLogEntry] = field(default_factory=list)
    trace: List[str] = field(default_factory=list)
    error: str = ""

    def as_dict(self) -> dict:
        d = asdict(self)
        d["log"] = [asdict(e) for e in self.log]
        return d


def in_window(now: dt.datetime, windows: Sequence[Tuple[str, str]]) -> bool:
    hm = now.strftime("%H:%M")
    return any(a <= hm <= b for a, b in windows)


def tool_dir(pose_deg: Optional[Sequence[float]]) -> Tuple[float, float, float]:
    """Unit tool axis of the hanging SO-101 planar model (straight down for the Starter tool)."""
    if not pose_deg:
        return (0.0, 0.0, -1.0)
    pan, th1, q3, q4 = pose_deg
    th = math.radians(th1 + q3 + q4); ph = math.radians(pan)
    return (math.sin(th) * math.cos(ph), math.sin(th) * math.sin(ph), -math.cos(th))


class Tool:
    """End-effector interface: SO-101 soft gripper or Starter vacuum cup."""

    def set_pose(self, pose_deg: Optional[Sequence[float]]) -> None: ...
    def fold(self) -> None: ...
    def grip(self) -> bool: ...
    def release(self) -> None: ...


class SimTool(Tool):
    def __init__(self, fail_boxes: Sequence[str] = ()):
        self.events: List[str] = []
        self.fail_boxes = set(fail_boxes)
        self.current_box = ""

    def set_pose(self, pose_deg):
        self.events.append(f"pose {pose_deg}")

    def fold(self):
        self.events.append("fold")

    def grip(self) -> bool:
        self.events.append("grip")
        return self.current_box not in self.fail_boxes

    def release(self):
        self.events.append("release")


class CellRoutines:
    def __init__(self, cell: Cell, gantry, tool: Tool, roost: RoostController, io,
                 detect_eggs: Callable[[str], List[Egg]], birds_on_floor: Callable[[], int],
                 hen_in_box: Callable[[str], bool], lid_is_open: Callable[[], bool],
                 now: Callable[[], dt.datetime] = dt.datetime.now, windows: Optional[dict] = None,
                 session_gate=None, egg_log_path: Optional[str] = None):
        self.cell, self.g, self.tool, self.roost, self.io = cell, gantry, tool, roost, io
        self.detect_eggs, self.birds_on_floor, self.hen_in_box, self.lid_is_open = detect_eggs, birds_on_floor, hen_in_box, lid_is_open
        self.now = now
        self.windows = windows or DEFAULT_WINDOWS
        self.session_gate = session_gate
        self.egg_log_path = egg_log_path
        self.rep: Optional[RoutineReport] = None

    # ------------------------------------------------------------------ helpers
    def _state(self, s: str) -> None:
        self.rep.state = s
        self.rep.trace.append(s)

    def _preflight(self, kind: str, recording: bool) -> None:
        st = self.roost.status()
        if not st.get("estop_ok", False):
            raise RoutineAbort("E-stop chain open")
        if not self.g.homed:
            raise RoutineAbort("gantry not homed")
        if not in_window(self.now(), self.windows[kind]):
            raise RoutineAbort(f"outside the {kind} schedule window {self.windows[kind]}")
        if recording and self.session_gate is not None:
            self.session_gate.check()
        n = self.birds_on_floor()
        if n:
            raise RoutineAbort(f"{n} bird(s) on the cell floor - close the pop door with the flock in the run first")

    def _retract(self) -> None:
        self._state("RETRACT_ROOSTS")
        if not self.g.parked:
            self.g.park()
        self.roost.move("stowed")
        if not self.roost.all_in("stowed"):
            raise RoutineAbort("roost bars not confirmed STOWED by their limit switches")

    def _deploy(self) -> None:
        self._state("DEPLOY_ROOSTS")
        self.g.park()
        self.roost.move("deployed")

    def _choose(self, site, egg_xyz: Optional[Sequence[float]], lid_open: bool) -> Tuple[Approach, Tuple[float, float, float]]:
        """Pick the checked approach nearest the egg (TOP if the lid is open, else SIDE) and the residual shift."""
        best = None
        for a in site.approaches:
            if a.kind == "top" and not lid_open:
                continue
            tgt = getattr(a, "target", None)
            d = 0.0 if (egg_xyz is None or tgt is None) else math.dist(egg_xyz[:2], tgt[:2])
            key = (a.kind != "top", d, -a.clear_mm)
            if best is None or key < best[0]:
                best = (key, a)
        if best is None:
            raise ZoneViolation(f"{site.name}: no usable approach (lid_open={lid_open})")
        a = best[1]
        tgt = getattr(a, "target", None)
        if egg_xyz is None or tgt is None:
            return a, (0.0, 0.0, 0.0)
        shift = (egg_xyz[0] - tgt[0], egg_xyz[1] - tgt[1], egg_xyz[2] - tgt[2])
        if math.hypot(shift[0], shift[1]) > MAX_RESIDUAL_MM:
            raise ZoneViolation(f"{site.name}: egg {MAX_RESIDUAL_MM:.0f}+ mm from every checked target - needs a policy pick")
        return a, shift

    def _approach_and_act(self, a: Approach, shift, act: Callable[[], bool]) -> bool:
        """transit -> unfold -> descend to pre-point -> straight insert along the tool axis -> act -> retreat."""
        gx, gy, gz = (a.gantry[0] + shift[0], a.gantry[1] + shift[1], a.gantry[2] + shift[2])
        d = tool_dir(a.pose_deg)
        pre = (gx - d[0] * INSERT_MM, gy - d[1] * INSERT_MM, gz - d[2] * INSERT_MM)
        self.g.move_to((pre[0], pre[1], self.cell.transit_z))
        self.tool.set_pose(a.pose_deg)
        self.g.move_to(pre, feed=60.0)
        self.g.move_to((gx, gy, gz), feed=20.0, check=False)   # insert: offline-checked straight line
        ok = act()
        self.g.move_to(pre, feed=20.0, check=False)
        self.g.move_to((pre[0], pre[1], self.cell.transit_z), feed=60.0)
        self.tool.fold()
        return ok

    def _log(self, e: EggLogEntry) -> None:
        self.rep.log.append(e)
        if self.egg_log_path:
            with open(self.egg_log_path, "a") as f:
                f.write(json.dumps(asdict(e)) + "\n")

    def _abort(self, err: str) -> None:
        self.rep.error = err
        self._state("ABORT")
        try:
            self.tool.fold()
            self.g.park()
        except Exception as e:   # leave roosts stowed if we could not park
            self.rep.error += f" | park failed: {e}"
        self._state("FAULT")

    # ------------------------------------------------------------------ routines
    def egg_collection(self, recording: bool = False) -> RoutineReport:
        self.rep = RoutineReport("egg")
        try:
            self._state("PREFLIGHT"); self._preflight("egg", recording)
            self._retract()
            self._state("OPEN_LIDS"); self.io.send({"cmd": "lid", "to": "open"})
            lid_open = self.lid_is_open()
            for site in self.cell.nest_boxes:
                self._state(f"GOTO_BOX {site.name}")
                if self.hen_in_box(site.name):
                    self.rep.boxes_skipped.append(site.name)
                    self._log(EggLogEntry(time.time(), site.name, False, note="hen in box - skipped"))
                    continue
                self._state(f"DETECT {site.name}")
                for egg in self.detect_eggs(site.name):
                    a, shift = self._choose(site, egg.xyz, lid_open)
                    if hasattr(self.tool, "current_box"):
                        self.tool.current_box = site.name
                    self._state(f"PICK {site.name} {a.kind}")
                    got = self._approach_and_act(a, shift, self.tool.grip)
                    if not got:
                        self.tool.release()
                        self.rep.eggs_failed += 1
                        self._log(EggLogEntry(time.time(), site.name, False, a.kind, note="grip not confirmed"))
                        continue
                    pa, _ = self._choose(self.cell.basket, None, True)
                    self._state(f"PLACE basket {pa.kind}")
                    self._approach_and_act(pa, (0.0, 0.0, 0.0), lambda: (self.tool.release(), True)[1])
                    self.rep.eggs_collected += 1
                    self._state("COUNT")
                    self._log(EggLogEntry(time.time(), site.name, True, a.kind, pa.kind))
            self._state("CLOSE_LIDS"); self.io.send({"cmd": "lid", "to": "closed"})
            self._state("PARK"); self.g.park()
            self._deploy()
            self._state("DONE")
        except (RoutineAbort, RoostInterlock, ZoneViolation, RuntimeError, PermissionError) as e:
            self._abort(str(e))
        return self.rep

    def cleaning(self) -> RoutineReport:
        self.rep = RoutineReport("clean")
        try:
            self._state("PREFLIGHT"); self._preflight("clean", False)
            self._retract()
            self.io.send({"cmd": "lid", "to": "closed"})
            self._state("CLEAN_PASS")
            for p in self.cell.clean_route:
                self.g.move_to(p, feed=80.0)
            self._state("PARK"); self.g.park()
            self._deploy()
            self._state("DONE")
        except (RoutineAbort, RoostInterlock, ZoneViolation, RuntimeError) as e:
            self._abort(str(e))
        return self.rep
