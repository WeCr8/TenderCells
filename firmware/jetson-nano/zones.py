"""Exclusion zones on the robot: refuse motion into no-go / keep-out areas and never lase
inside any zone (incl. the no-laser buffer the OS draws around animal housing).

The OS sends zones retained on tc/{id}/cfg/zones (see src/lib/yard/exclusionZones.ts):

    {"v": 1, "seq": 7, "units": "ft",
     "self": {"itemId": "bed1", "x": 20, "y": 10, "width": 5, "depth": 10},
     "zones": [{"id": "z1", "name": "Septic", "kind": "no-go", "poly": [[0, 0], [4, 0], [4, 4], [0, 4]]}],
     "boundary": {"poly": [[2, 2], [98, 2], [98, 78], [2, 78]], "marginFt": 2, "source": "survey"}}

Property feet, origin top-left, x right, y down. `self` is the robot's own footprint so bed
millimetres (x along the long side, y across - FarmBot convention, same as the 3D view)
map to property feet. Enforcement is on-board, so it holds with the network down.

`boundary` (optional) is the owner's property boundary: the robot neither drives nor lases
outside it, or within `marginFt` of its edge. A survey can propose a better boundary, but only
the owner accepts it in the OS, which then re-sends this payload.
"""

from __future__ import annotations

from dataclasses import dataclass, field
from typing import List, Optional, Sequence, Tuple

MM_PER_FT = 304.8
KINDS = ("no-go", "keep-out", "no-laser")


@dataclass
class Zone:
    id: str
    name: str
    kind: str
    poly: List[Tuple[float, float]]

    def contains(self, x: float, y: float) -> bool:
        inside = False
        pts = self.poly
        j = len(pts) - 1
        for i in range(len(pts)):
            xi, yi = pts[i]
            xj, yj = pts[j]
            if (yi > y) != (yj > y) and x < (xj - xi) * (y - yi) / (yj - yi) + xi:
                inside = not inside
            j = i
        return inside


def _dist_to_edges(poly: Sequence[Tuple[float, float]], x: float, y: float) -> float:
    best = float("inf")
    for i in range(len(poly)):
        ax, ay = poly[i]
        bx, by = poly[(i + 1) % len(poly)]
        dx, dy = bx - ax, by - ay
        l2 = dx * dx + dy * dy
        t = 0.0 if l2 == 0 else max(0.0, min(1.0, ((x - ax) * dx + (y - ay) * dy) / l2))
        best = min(best, ((x - ax - t * dx) ** 2 + (y - ay - t * dy) ** 2) ** 0.5)
    return best


class ZoneViolation(RuntimeError):
    """A move or laser shot would enter an exclusion zone."""


@dataclass
class ZoneGuard:
    zones: List[Zone] = field(default_factory=list)
    self_frame: Optional[dict] = None
    seq: int = 0
    boundary: Optional[Zone] = None
    margin_ft: float = 0.0

    @classmethod
    def from_payload(cls, payload: dict) -> "ZoneGuard":
        """Parse and validate a cfg/zones payload. Raises ValueError on a bad payload."""
        if payload.get("v") != 1 or payload.get("units") != "ft":
            raise ValueError("zones payload must be v=1 in feet")
        zones = []
        for z in payload.get("zones", []):
            if z.get("kind") not in KINDS:
                raise ValueError(f"unknown zone kind {z.get('kind')!r}")
            poly = [(float(p[0]), float(p[1])) for p in z.get("poly", [])]
            if len(poly) < 3:
                raise ValueError(f"zone {z.get('id')} needs at least 3 points")
            zones.append(Zone(str(z.get("id")), str(z.get("name", "")), z["kind"], poly))
        boundary, margin = None, 0.0
        b = payload.get("boundary")
        if b is not None:
            poly = [(float(p[0]), float(p[1])) for p in b.get("poly", [])]
            margin = float(b.get("marginFt", -1))
            if len(poly) < 3 or not 0 <= margin <= 50:
                raise ValueError("boundary needs at least 3 points and marginFt 0-50")
            # Kind "no-go" so path checks and messages treat leaving it like any other no-go.
            boundary = Zone("boundary", "property boundary", "no-go", poly)
        frame = payload.get("self")
        # FIX(2026-09-30): without its own footprint the robot cannot place bed points on the
        # property, so every check would silently pass. Refuse the payload instead.
        if (zones or boundary) and not (isinstance(frame, dict) and all(isinstance(frame.get(k), (int, float)) for k in ("x", "y", "width", "depth"))):
            raise ValueError("zones payload needs 'self' (the robot footprint) to enforce zones")
        return cls(zones, frame, int(payload.get("seq", 0)), boundary, margin)

    # ── frames ────────────────────────────────────────────────────────────────
    def bed_to_property(self, x_mm: float, y_mm: float) -> Optional[Tuple[float, float]]:
        """Bed millimetres -> property feet using the robot's footprint (None if unknown)."""
        f = self.self_frame
        if not f:
            return None
        along_y = f["depth"] >= f["width"]
        xf, yf = x_mm / MM_PER_FT, y_mm / MM_PER_FT
        return (f["x"] + yf, f["y"] + xf) if along_y else (f["x"] + xf, f["y"] + yf)

    # ── checks ────────────────────────────────────────────────────────────────
    def blocking(self, x_ft: float, y_ft: float, action: str = "drive") -> Optional[Zone]:
        """Zone that forbids `action` ("drive" or "laser") at a property point.

        Outside the property boundary (or within its margin) returns the boundary itself.
        """
        b = self.boundary
        if b and (not b.contains(x_ft, y_ft) or _dist_to_edges(b.poly, x_ft, y_ft) < self.margin_ft):
            return b
        for z in self.zones:
            if action == "drive" and z.kind == "no-laser":
                continue
            if z.contains(x_ft, y_ft):
                return z
        return None

    def check_bed(self, x_mm: float, y_mm: float, action: str = "drive") -> None:
        """Raise ZoneViolation if a bed point is inside a zone for this action."""
        p = self.bed_to_property(x_mm, y_mm)
        if p is None:
            if self.zones or self.boundary:  # defensive: never treat unplaceable zones as "clear"
                raise ZoneViolation("Zones are loaded but the robot footprint is unknown - refusing")
            return
        z = self.blocking(p[0], p[1], action)
        if z:
            verb = "fire the laser" if action == "laser" else "move"
            if z is self.boundary:
                raise ZoneViolation(f"Refused to {verb} outside the property boundary")
            raise ZoneViolation(f"Refused to {verb} inside {z.kind} zone '{z.name or z.id}'")

    def check_path(self, points: Sequence[Tuple[float, float]], step_ft: float = 0.5) -> None:
        """Raise ZoneViolation if a property-feet path enters a no-go / keep-out zone."""
        for (ax, ay), (bx, by) in zip(points, points[1:]):
            steps = max(1, int(((bx - ax) ** 2 + (by - ay) ** 2) ** 0.5 / step_ft) + 1)
            for s in range(steps + 1):
                t = s / steps
                z = self.blocking(ax + (bx - ax) * t, ay + (by - ay) * t)
                if z is not None and z is self.boundary:
                    raise ZoneViolation("Path leaves the property boundary")
                if z:
                    raise ZoneViolation(f"Path enters {z.kind} zone '{z.name or z.id}'")

    def summary(self) -> dict:
        return {"seq": self.seq, "zones": len(self.zones), "boundary": bool(self.boundary),
                "kinds": {k: sum(1 for z in self.zones if z.kind == k) for k in KINDS}}


__all__ = ["Zone", "ZoneGuard", "ZoneViolation", "MM_PER_FT"]
