"""CT72 cell geometry for the controller: nest boxes, basket, roost bars, no-go zones and the approach poses
checked offline by the CAD (cad/reach_routines.py). Loaded from ct72_cell_a12.json, which the CAD build writes,
so the firmware and the clash checks use the same numbers. Units: mm, gantry frame = CAD frame
(origin front-left-bottom outer frame corner, +X right, +Y back, +Z up).
"""
from __future__ import annotations

import json
import os
from dataclasses import dataclass, field
from typing import Dict, List, Optional, Sequence, Tuple

HERE = os.path.dirname(os.path.abspath(__file__))
DEFAULT_JSON = os.path.join(HERE, "ct72_cell_a12.json")

Box = Tuple[float, float, float, float, float, float]   # x0, y0, z0, x1, y1, z1


class ZoneViolation(RuntimeError):
    """A gantry target is inside a no-go zone (or outside travel)."""


@dataclass
class Approach:
    kind: str                       # "top" | "side"
    gantry: Tuple[float, float, float]
    pose_deg: Optional[Sequence[float]] = None   # SO-101 (pan, lift, elbow, wrist) planar model, None = Starter tool
    clear_mm: float = 0.0
    target: Optional[Tuple[float, float, float]] = None   # egg centre this approach was checked for
    target_name: str = ""


@dataclass
class Site:
    name: str
    interior: Box
    approaches: List[Approach] = field(default_factory=list)

    def choose(self, lid_open: bool, blocked: Sequence[str] = ()) -> Approach:
        """TOP if the lid is open and the top approach is clear, else SIDE; raises if neither."""
        ordered = sorted(self.approaches, key=lambda a: (a.kind != "top", -a.clear_mm))
        for a in ordered:
            if a.kind == "top" and not lid_open:
                continue
            if a.kind in blocked:
                continue
            return a
        raise ZoneViolation(f"{self.name}: no clear approach (lid_open={lid_open}, blocked={list(blocked)})")


@dataclass
class Cell:
    variant: str
    travel: Dict[str, Tuple[float, float]]
    park: Tuple[float, float, float]
    transit_z: float
    nest_boxes: List[Site]
    basket: Site
    basket_tag_id: int
    nogo: List[Tuple[str, Box]]
    roost: Dict[str, dict]
    clean_route: List[Tuple[float, float, float]]
    flock_size: int
    grip_force_limit_n: float

    @classmethod
    def load(cls, path: str = DEFAULT_JSON, variant: str = "plus") -> "Cell":
        with open(path) as f:
            d = json.load(f)
        v = d["variants"][variant]
        def site(s):
            return Site(s["name"], tuple(s["interior"]),
                        [Approach(a["kind"], tuple(a["gantry"]), a.get("pose_deg"), a.get("clear_mm", 0.0),
                                  tuple(a["target"]) if a.get("target") else None, a.get("target_name", "")) for a in s["approaches"]])
        return cls(variant, {k: tuple(x) for k, x in d["travel"].items()}, tuple(d["park"]), v["transit_z"],
                   [site(s) for s in v["nest_boxes"]], site(v["basket"]), d["basket_tag_id"],
                   [(z["name"], tuple(z["box"])) for z in v["nogo"]], d["roost"], [tuple(p) for p in v["clean_route"]],
                   d["flock_size"], d["grip_force_limit_n"])

    def check_target(self, g: Sequence[float]) -> None:
        """Gantry target guard (host side; Klipper soft limits are the second layer)."""
        for ax, val in zip("xyz", g):
            lo, hi = self.travel[ax]
            if not lo - 1e-6 <= val <= hi + 1e-6:
                raise ZoneViolation(f"{ax}={val:.0f} outside travel [{lo:.0f}, {hi:.0f}]")
        for name, b in self.nogo:
            if b[0] <= g[0] <= b[3] and b[1] <= g[1] <= b[4] and b[2] <= g[2] <= b[5]:
                raise ZoneViolation(f"gantry target {tuple(round(v) for v in g)} is inside no-go zone {name}")
