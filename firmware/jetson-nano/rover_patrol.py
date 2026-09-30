"""Weed patrol on a ROVER: drive the whole property (or a drawn route) with a camera, find
weeds, report each one with its property position, and let a person decide.

    WEED_ROBOT=rover-scout  camera only: weeds are mapped + alerted, a person pulls them
                            ("Pulled it" = cmd/event ack). Roaming Roost / custom robots.
    WEED_ROBOT=rover-laser  Weed Rover laser build: aim / burn per weed after human approval,
                            same interlocks as the bed robot, never inside an exclusion zone.

Runs inside weed_patrol_service.py (same MQTT contract as the bed robot):
    cmd/weed {"action": "pass", "passes", "task", "area": {x,y,width,depth} | "route": [{x,y}...],
              "waterPoints": [{id, name, x, y, radiusFt}...]}
    event    weed_detected / alert with "propFt": {"x","y"} (property feet) and "scout"
    state    state/weed includes "pose": {"xFt","yFt","headingDeg"}

Whatever the task, every pass also:
    - reports animals the camera sees on the route (alert, finding "animal", animalGroup
      flock | pet | wildlife | predator) - your hens outside the run, a dog, a fox, a snake;
    - looks at the ground around each water point (spigot, trough, tank, animal waterer) once
      per pass and reports a leak there (alert, finding "leak", station = water point id).
A laser rover holds its laser within ANIMAL_HOLD_FT of an animal seen in the last
ANIMAL_HOLD_S seconds (on top of the no-laser zones around animal housing).

Coordinates: property feet, origin top-left, x right, y down; heading degrees clockwise from
map north (up). Same geometry as the OS (src/lib/yard/roverPlan.ts). The camera frame is
centred AHEAD_FT in front of the rover; detections are frame offsets in mm (image up =
forward, image right = rover's right).
"""

from __future__ import annotations

import math
import random
import time
from dataclasses import dataclass
from typing import Callable, Dict, List, Optional, Protocol, Sequence, Tuple

from weed_patrol import ANIMAL_LABELS, TASKS, Detection, InterlockError, LaserController
from zones import ZoneGuard, ZoneViolation

MM_PER_FT = 304.8
Pt = Tuple[float, float]

ANIMAL_HOLD_FT = 15.0
ANIMAL_HOLD_S = 600.0
LEAK_CHECK_FT = 6.0

# Who an animal is to the property (mirrors src/lib/yard/roverFindings.ts).
ANIMAL_GROUPS: Dict[str, str] = {
    "Hen": "flock", "Chicken": "flock", "Duck": "flock", "Goat": "flock", "Turkey": "flock",
    "Dog": "pet", "Cat": "pet",
    "Rabbit": "wildlife", "Deer": "wildlife", "Squirrel": "wildlife", "Toad": "wildlife", "Bird": "wildlife",
    "Snake": "predator", "Fox": "predator", "Raccoon": "predator", "Hawk": "predator", "Rat": "predator",
    "Coyote": "predator", "Opossum": "predator", "Bear": "predator",
}
PLANT_LABELS = {"Wilting", "Yellow leaves", "Pest damage"}


def animal_group(label: str) -> str:
    """flock | pet | wildlife | predator; unknown animals count as wildlife."""
    return ANIMAL_GROUPS.get(label[:1].upper() + label[1:].lower(), "wildlife")


def animal_alert_text(label: str, group: str) -> Tuple[str, str]:
    if group == "flock":
        return f"{label} outside the run", "One of your animals is out - check the door and fence"
    if group == "pet":
        return f"{label} in the yard", "Pet seen on the route - the rover slows and keeps clear"
    if group == "predator":
        return f"{label} seen", "Predator on the property - keep people and animals clear, close the coop"
    return f"{label} seen", "Wildlife on the route - no action needed"


def water_point_at(points: Sequence[dict], x: float, y: float) -> Optional[dict]:
    """Nearest water point whose check area contains (x, y)."""
    near = [(math.hypot(p["x"] - x, p["y"] - y), p) for p in points]
    near = [(d, p) for d, p in near if d <= p["radiusFt"]]
    return min(near, key=lambda t: t[0])[1] if near else None


class ScoutOnly(RuntimeError):
    """The rover has a camera only - weeds are pulled by hand."""


@dataclass
class RoverConfig:
    width_ft: float = 80.0          # property size (the OS sends it as the pass area)
    depth_ft: float = 60.0
    lane_ft: float = 4.0            # camera swath = lane spacing
    step_ft: float = 2.0            # stops along a lane
    ahead_ft: float = 1.5           # camera frame centre ahead of the rover
    frame_ft: Tuple[float, float] = (3.0, 4.0)  # frame size (along, across)
    margin_ft: float = 2.0
    merge_ft: float = 1.5           # detections closer than this are the same weed
    item_id: Optional[str] = None   # the rover's property-layout item (for the map)


# ── geometry (mirrors roverPlan.ts) ───────────────────────────────────────────
def frame_to_property(pose: Tuple[float, float, float], forward_ft: float, right_ft: float) -> Pt:
    x, y, heading = pose
    h = math.radians(heading)
    return (round(x + math.sin(h) * forward_ft + math.cos(h) * right_ft, 2),
            round(y - math.cos(h) * forward_ft + math.sin(h) * right_ft, 2))


def heading_to(a: Pt, b: Pt, prev: float = 0.0) -> float:
    dx, dy = b[0] - a[0], b[1] - a[1]
    if not dx and not dy:
        return prev
    return (math.degrees(math.atan2(dx, -dy)) + 360) % 360


def coverage_route(area: Dict[str, float], guard: Optional[ZoneGuard], lane_ft: float, step_ft: float) -> List[Pt]:
    """Lawn-mower lanes over an area, skipping points a zone blocks for driving."""
    pts: List[Pt] = []
    lane = 0
    y = area["y"] + lane_ft / 2
    while y < area["y"] + area["depth"]:
        row = []
        x = area["x"] + step_ft / 2
        while x < area["x"] + area["width"]:
            if not (guard and guard.blocking(x, y, "drive")):
                row.append((round(x, 2), round(y, 2)))
            x += step_ft
        pts.extend(reversed(row) if lane % 2 else row)
        y += lane_ft
        lane += 1
    return pts


def route_from_path(path: Sequence[Pt], guard: Optional[ZoneGuard], step_ft: float) -> List[Pt]:
    """A drawn route densified every step_ft, without blocked points."""
    out: List[Pt] = []
    for i in range(1, len(path)):
        (ax, ay), (bx, by) = path[i - 1], path[i]
        n = max(1, math.ceil(math.hypot(bx - ax, by - ay) / step_ft))
        for s in range(0 if i == 1 else 1, n + 1):
            p = (round(ax + (bx - ax) * s / n, 2), round(ay + (by - ay) * s / n, 2))
            if not (guard and guard.blocking(p[0], p[1], "drive")):
                out.append(p)
    return out


# ── hardware seams ────────────────────────────────────────────────────────────
class Drive(Protocol):
    pose: Tuple[float, float, float]  # x_ft, y_ft, heading_deg

    def goto(self, x_ft: float, y_ft: float) -> None: ...

    def stop(self) -> None: ...


class SimDrive:
    """Teleports between stops (the OS animates the path)."""

    def __init__(self, start: Pt = (0.0, 0.0), sleeper: Callable[[float], None] = lambda s: None):
        self.pose = (start[0], start[1], 0.0)
        self.stopped = False
        self._sleep = sleeper

    def goto(self, x_ft: float, y_ft: float) -> None:
        if self.stopped:
            raise InterlockError("Drive stopped (E-STOP)")
        self.pose = (x_ft, y_ft, heading_to(self.pose[:2], (x_ft, y_ft), self.pose[2]))
        self._sleep(0.05)

    def stop(self) -> None:
        self.stopped = True


class MqttGotoDrive:
    """Real rover base: publishes tc/{base}/cmd/goto {xFt,yFt} and waits for the pose the
    base reports on tc/{base}/state/pose (wheel odometry + RTK GPS / fiducials) to arrive.
    The base controller owns obstacle stops; this class owns the patrol plan."""

    def __init__(self, publish: Callable[[str, dict, int, bool], None], base_id: str,
                 tolerance_ft: float = 0.5, timeout_s: float = 60.0, clock=time.monotonic, sleeper=time.sleep):
        self.publish, self.base_id = publish, base_id
        self.pose = (0.0, 0.0, 0.0)
        self.tolerance_ft, self.timeout_s = tolerance_ft, timeout_s
        self._clock, self._sleep = clock, sleeper
        self.stopped = False

    def on_pose(self, msg: dict) -> None:
        self.pose = (float(msg["xFt"]), float(msg["yFt"]), float(msg.get("headingDeg", 0.0)))

    def goto(self, x_ft: float, y_ft: float) -> None:
        if self.stopped:
            raise InterlockError("Drive stopped (E-STOP)")
        self.publish(f"tc/{self.base_id}/cmd/goto", {"xFt": x_ft, "yFt": y_ft}, 1, False)
        end = self._clock() + self.timeout_s
        while math.hypot(self.pose[0] - x_ft, self.pose[1] - y_ft) > self.tolerance_ft:
            if self.stopped:
                raise InterlockError("Drive stopped (E-STOP)")
            if self._clock() > end:
                raise TimeoutError(f"Rover did not reach {x_ft:.1f}, {y_ft:.1f} ft")
            self._sleep(0.1)

    def stop(self) -> None:
        self.stopped = True
        self.publish(f"tc/{self.base_id}/cmd/drive", {"stop": True}, 1, False)


class RoverDetector(Protocol):
    def detect(self, pose: Tuple[float, float, float], cfg: RoverConfig) -> List[Detection]: ...


class AnimalDetector(Protocol):
    """Animals in the camera frame: Detection(forward_mm, right_mm, size_mm, confidence, label)."""

    def animals(self, pose: Tuple[float, float, float], cfg: RoverConfig, task: str) -> List[Detection]: ...


class LeakDetector(Protocol):
    """Looks at the ground around a water point; returns {"spreadFt", "confidence"} for a leak."""

    def check(self, point: dict, pose: Tuple[float, float, float], cfg: RoverConfig) -> Optional[dict]: ...


class FrameDetector:
    """Wraps a bed detector (HsvDetector / YoloDetector): their frame-centred mm offsets
    become rover frame offsets (image right = rover right, image down = backward)."""

    def __init__(self, bed_detector, bed_cfg):
        self.inner, self.bed = bed_detector, bed_cfg

    def detect(self, pose, cfg: RoverConfig) -> List[Detection]:
        return [Detection(-d.y, d.x, d.size_mm, d.confidence, d.label) for d in self.inner.detect((0.0, 0.0), self.bed)]


def _in_frame(pose, cfg: RoverConfig, x: float, y: float) -> Optional[Tuple[float, float]]:
    """(forward_ft, right_ft) of a property point inside the camera frame, else None."""
    cx, cy = frame_to_property(pose, cfg.ahead_ft, 0.0)
    h = math.radians(pose[2])
    dx, dy = x - cx, y - cy
    forward = dx * math.sin(h) - dy * math.cos(h)
    right = dx * math.cos(h) + dy * math.sin(h)
    if abs(forward) <= cfg.frame_ft[0] / 2 and abs(right) <= cfg.frame_ft[1] / 2:
        return forward, right
    return None


class SimRoverDetector:
    """Weeds and a few animals scattered over the property (not inside zones); reports those
    in the frame. Water points listed in `leaking` show a leak when checked."""

    def __init__(self, cfg: RoverConfig, guard: Optional[ZoneGuard] = None, weeds: int = 25, seed: int = 11,
                 animals: Sequence[Tuple[float, float, str]] = (), leaking: Sequence[str] = ()):
        rnd = random.Random(seed)
        self.truth: List[Tuple[float, float, float]] = []
        while len(self.truth) < weeds:
            x, y = rnd.uniform(1, cfg.width_ft - 1), rnd.uniform(1, cfg.depth_ft - 1)
            if not (guard and guard.blocking(x, y, "drive")):
                self.truth.append((x, y, rnd.uniform(15, 70)))
        if not animals:  # a hen that got out and a snake in the grass
            animals = [(rnd.uniform(5, cfg.width_ft - 5), rnd.uniform(5, cfg.depth_ft - 5), label) for label in ("Hen", "Snake")]
        self.animal_truth: List[Tuple[float, float, str]] = list(animals)
        self.leaking = set(leaking)
        self._rnd = rnd

    def detect(self, pose, cfg: RoverConfig) -> List[Detection]:
        out = []
        for x, y, size in self.truth:
            fr = _in_frame(pose, cfg, x, y)
            if fr:
                out.append(Detection(fr[0] * MM_PER_FT, fr[1] * MM_PER_FT, size, round(0.7 + self._rnd.random() * 0.28, 2)))
        return out

    def animals(self, pose, cfg: RoverConfig, task: str) -> List[Detection]:
        out = []
        for x, y, label in self.animal_truth:
            fr = _in_frame(pose, cfg, x, y)
            if fr:
                out.append(Detection(fr[0] * MM_PER_FT, fr[1] * MM_PER_FT, 300.0, 0.88, label))
        return out

    def observe(self, pose, cfg: RoverConfig, task: str) -> List[Detection]:
        """Plant-health findings (plant_scan)."""
        if task == "plant_scan" and self._rnd.random() < 0.06:
            label = self._rnd.choice(sorted(PLANT_LABELS))
            return [Detection(0.0, 0.0, 0.0, round(0.75 + self._rnd.random() * 0.2, 2), label)]
        return []

    def check(self, point: dict, pose, cfg: RoverConfig) -> Optional[dict]:
        if point["id"] in self.leaking:
            return {"spreadFt": 3.0, "confidence": 0.86}
        return None

    def remove_near(self, x: float, y: float, radius_ft: float = 1.0) -> None:
        self.truth = [t for t in self.truth if math.hypot(t[0] - x, t[1] - y) > radius_ft]


# COCO class names (default YOLO weights) -> our labels. A property-specific model from the
# Hugging Face Hub (hen / duck / fox / snake classes) can be used instead - its class names
# are used as labels directly.
COCO_ANIMALS = {"bird": "Bird", "cat": "Cat", "dog": "Dog", "horse": "Horse", "sheep": "Goat", "cow": "Cow", "bear": "Bear"}


class YoloAnimalDetector:
    """Animals in the rover camera frame with an Ultralytics YOLO model (COCO by default,
    or hf://owner/repo/best.pt). Frame offsets use the same mm_per_px as the weed camera."""

    def __init__(self, capture: Callable[[], "object"], weights: str = "yolov8n.pt", min_conf: float = 0.5,
                 mm_per_px: float = 1.0, labels: Optional[Dict[str, str]] = None):
        from ultralytics import YOLO  # type: ignore

        if weights.startswith("hf://"):
            from huggingface_hub import hf_hub_download  # type: ignore

            owner, repo, *path = weights[5:].split("/")
            weights = hf_hub_download(repo_id=f"{owner}/{repo}", filename="/".join(path))
        self.model, self.capture = YOLO(weights), capture
        self.min_conf, self.mm_per_px = min_conf, mm_per_px
        self.labels = labels if labels is not None else COCO_ANIMALS

    def animals(self, pose, cfg: RoverConfig, task: str) -> List[Detection]:
        img = self.capture()
        hgt, wid = img.shape[:2]
        out = []
        for res in self.model(img, verbose=False):
            for box, cls, conf in zip(res.boxes.xywh.tolist(), res.boxes.cls.tolist(), res.boxes.conf.tolist()):
                name = res.names[int(cls)].lower()
                label = self.labels.get(name) if self.labels else name.capitalize()
                if conf < self.min_conf or not label:
                    continue
                px, py, bw, bh = box  # image up = forward, image right = rover right
                out.append(Detection((hgt / 2 - py) * self.mm_per_px, (px - wid / 2) * self.mm_per_px,
                                     max(bw, bh) * self.mm_per_px, round(conf, 2), label))
        return out


class WetGroundLeakDetector:
    """Leak check by change detection: the share of 'wet' pixels (dark soaked soil, or bright
    low-saturation glare off standing water) around a water point, compared with that point's
    own dry baseline learned on earlier passes. A jump of more than `delta` is a leak.
    A heuristic - swap in a segmentation model for tricky ground (mulch, shade)."""

    def __init__(self, capture: Callable[[], "object"], dark_v: int = 70, glare_v: int = 235, glare_s: int = 35,
                 delta: float = 0.15, learn: float = 0.2):
        import cv2  # noqa: F401

        self.capture, self.dark_v, self.glare_v, self.glare_s = capture, dark_v, glare_v, glare_s
        self.delta, self.learn = delta, learn
        self.baseline: Dict[str, float] = {}

    def wet_fraction(self, img) -> float:
        import cv2
        import numpy as np

        hsv = cv2.cvtColor(img, cv2.COLOR_BGR2HSV)
        s, v = hsv[:, :, 1], hsv[:, :, 2]
        wet = (v < self.dark_v) | ((v > self.glare_v) & (s < self.glare_s))
        return float(np.count_nonzero(wet)) / wet.size

    def check(self, point: dict, pose, cfg: RoverConfig) -> Optional[dict]:
        frac = self.wet_fraction(self.capture())
        base = self.baseline.get(point["id"])
        if base is None:  # first look: learn what dry ground looks like here
            self.baseline[point["id"]] = frac
            return None
        if frac - base > self.delta:
            spread = math.sqrt(frac * cfg.frame_ft[0] * cfg.frame_ft[1])
            return {"spreadFt": round(spread, 1), "confidence": round(min(0.95, 0.5 + (frac - base)), 2)}
        self.baseline[point["id"]] = base + self.learn * (frac - base)  # slow drift (season, light)
        return None


# ── the patrol ────────────────────────────────────────────────────────────────
class RoverWeedPatrol:
    """Same interface the MQTT service uses for the bed robot (run_passes, approve, reject,
    ack_alert, estop, weeds, alerts, progress, laser, zones), plus pose / coverage."""

    def __init__(self, cfg: RoverConfig, detector, drive, laser: LaserController, publish_event: Callable[[dict], None],
                 has_laser: bool = False, animal_detector=None, leak_detector=None, clock: Callable[[], float] = time.time):
        self.cfg, self.detector, self.drive, self.laser = cfg, detector, drive, laser
        self.has_laser = has_laser
        # Default to the weed detector when it can also see animals / check leaks (simulation).
        self.animal_detector = animal_detector or (detector if hasattr(detector, "animals") else None)
        self.leak_detector = leak_detector or (detector if hasattr(detector, "check") else None)
        self.water_points: List[dict] = []
        self._clock = clock
        self.publish_event = publish_event
        self.weeds: Dict[str, dict] = {}
        self.alerts: Dict[str, dict] = {}
        self.zones: Optional[ZoneGuard] = None
        self.area: Dict[str, float] = {"x": 0.0, "y": 0.0, "width": cfg.width_ft, "depth": cfg.depth_ft}
        self.route: Optional[List[Pt]] = None
        self.halt = False
        self._next = 1
        self.progress = {"running": False, "pass": 0, "passes": 0, "waypoint": 0, "waypoints": 0, "task": "weed"}

    # coverage -----------------------------------------------------------------
    def set_coverage(self, area: Optional[dict] = None, route: Optional[list] = None) -> None:
        """Area {x,y,width,depth} or route [{x,y}] in property feet (validated)."""
        if route is not None:
            pts = [(float(p["x"]), float(p["y"])) for p in route]
            if len(pts) < 2:
                raise ValueError("route needs at least 2 points")
            self.route = pts
        elif area is not None:
            a = {k: float(area[k]) for k in ("x", "y", "width", "depth")}
            if a["width"] <= 0 or a["depth"] <= 0:
                raise ValueError("area width and depth must be positive")
            self.area, self.route = a, None

    def set_water_points(self, points: Optional[list]) -> None:
        """Water points [{id, name?, x, y, radiusFt?}] in property feet (validated)."""
        if points is None:
            return
        out = []
        for p in points[:50]:
            wp = {"id": str(p["id"])[:64], "name": str(p.get("name") or p["id"])[:60], "x": float(p["x"]), "y": float(p["y"]),
                  "radiusFt": float(p.get("radiusFt", LEAK_CHECK_FT))}
            if wp["radiusFt"] <= 0:
                raise ValueError("water point radiusFt must be positive")
            out.append(wp)
        self.water_points = out

    def plan(self) -> List[Pt]:
        if self.route:
            return route_from_path(self.route, self.zones, self.cfg.step_ft)
        m = self.cfg.margin_ft
        a = {"x": self.area["x"] + m, "y": self.area["y"] + m, "width": self.area["width"] - 2 * m, "depth": self.area["depth"] - 2 * m}
        return coverage_route(a, self.zones, self.cfg.lane_ft, self.cfg.step_ft)

    def pose_dict(self) -> dict:
        x, y, h = self.drive.pose
        return {"xFt": round(x, 2), "yFt": round(y, 2), "headingDeg": round(h, 1)}

    # events -------------------------------------------------------------------
    def _weed_event(self, w: dict) -> None:
        self.publish_event({
            "id": w["id"], "type": "weed_detected", "status": w["status"], "title": "Weed",
            "detail": w.get("detail") or f"~{w['size_mm']:.0f} mm, {int(w['confidence'] * 100)}% sure",
            "confidence": w["confidence"], "propFt": {"x": w["x"], "y": w["y"]}, "scout": not self.has_laser,
            **({"itemId": self.cfg.item_id} if self.cfg.item_id else {}),
        })

    def _alert_event(self, a: dict) -> None:
        finding = a.get("finding") or ("animal" if a["label"] in ANIMAL_LABELS or a["label"] in ANIMAL_GROUPS else "plant")
        extra: dict = {"finding": finding}
        if finding == "leak":
            title, detail = f"Water leak at {a['station_name']}", f"Standing water ~{a['spreadFt']:.0f} ft across - check the valve, hose and fittings"
            extra["station"] = a["station"]
        elif finding == "animal":
            group = animal_group(a["label"])
            title, detail = animal_alert_text(a["label"], group)
            extra["animalGroup"] = group
        else:
            title, detail = a["label"], "Check the plant"
        self.publish_event({
            "id": a["id"], "type": "alert", "status": a["status"], "label": a["label"], "title": title, "detail": detail,
            "confidence": a["confidence"], "propFt": {"x": a["x"], "y": a["y"]}, **extra,
            **({"itemId": self.cfg.item_id} if self.cfg.item_id else {}),
        })

    def _add_alert(self, a: dict, found: List[dict]) -> None:
        a["id"], a["status"], a["ts"] = f"robs-{self._next}", "active", self._clock()
        self._next += 1
        self.alerts[a["id"]] = a
        found.append(a)
        self._alert_event(a)

    def _look_for_animals(self, pose, task: str, found: List[dict]) -> None:
        if not self.animal_detector:
            return
        now = self._clock()
        for d in self.animal_detector.animals(pose, self.cfg, task):
            px, py = frame_to_property(pose, self.cfg.ahead_ft + d.x / MM_PER_FT, d.y / MM_PER_FT)
            if not self._inside(px, py):
                continue
            # The same animal seen from the next stop is not a new sighting.
            if any(a.get("finding") == "animal" and a["label"] == d.label and a["status"] == "active"
                   and now - a["ts"] < 120 and math.hypot(a["x"] - px, a["y"] - py) < 6 for a in self.alerts.values()):
                continue
            self._add_alert({"finding": "animal", "x": px, "y": py, "label": d.label, "confidence": d.confidence}, found)

    def _check_leaks(self, pose, checked: set, found: List[dict]) -> None:
        if not (self.leak_detector and self.water_points):
            return
        cx, cy = frame_to_property(pose, self.cfg.ahead_ft, 0.0)
        wp = water_point_at(self.water_points, cx, cy)
        if not wp or wp["id"] in checked:
            return
        checked.add(wp["id"])
        if any(a.get("finding") == "leak" and a["station"] == wp["id"] and a["status"] == "active" for a in self.alerts.values()):
            return
        leak = self.leak_detector.check(wp, pose, self.cfg)
        if leak:
            self._add_alert({"finding": "leak", "x": cx, "y": cy, "label": "Water leak", "station": wp["id"],
                             "station_name": wp["name"], "spreadFt": float(leak.get("spreadFt", 1.0)),
                             "confidence": float(leak.get("confidence", 0.7))}, found)

    def _inside(self, x: float, y: float) -> bool:
        return 0 <= x <= self.cfg.width_ft and 0 <= y <= self.cfg.depth_ft

    def run_passes(self, passes: int = 1, task: str = "weed") -> List[dict]:
        if task not in TASKS:
            raise ValueError(f"task must be one of {', '.join(TASKS)}")
        route = self.plan()
        if not route:
            raise ZoneViolation("No drivable route - every point is inside an exclusion zone")
        found: List[dict] = []
        self.halt = False
        self.progress = {"running": True, "pass": 0, "passes": passes, "waypoint": 0, "waypoints": len(route), "task": task}
        try:
            for p in range(passes):
                self.progress["pass"] = p + 1
                checked: set = set()  # water points looked at this pass
                for i, (x, y) in enumerate(route):
                    if self.halt or self.laser.estop_active:
                        return found
                    self.progress["waypoint"] = i + 1
                    self.drive.goto(x, y)
                    pose = self.drive.pose
                    self._look_for_animals(pose, task, found)
                    self._check_leaks(pose, checked, found)
                    if task == "plant_scan":
                        observe = getattr(self.detector, "observe", None)
                        for d in (observe(pose, self.cfg, task) if observe else []):
                            px, py = frame_to_property(pose, self.cfg.ahead_ft, 0.0)
                            self._add_alert({"finding": "plant", "x": px, "y": py, "label": d.label, "confidence": d.confidence}, found)
                    if task != "weed":
                        continue
                    for d in self.detector.detect(pose, self.cfg):
                        px, py = frame_to_property(pose, self.cfg.ahead_ft + d.x / MM_PER_FT, d.y / MM_PER_FT)
                        if not self._inside(px, py) or (self.zones and self.zones.blocking(px, py, "drive")):
                            continue
                        if any(w["status"] == "pending_review" and math.hypot(w["x"] - px, w["y"] - py) <= self.cfg.merge_ft
                               for w in self.weeds.values()):
                            continue
                        w = {"id": f"rweed-{self._next}", "x": px, "y": py, "size_mm": d.size_mm,
                             "confidence": d.confidence, "status": "pending_review"}
                        self._next += 1
                        self.weeds[w["id"]] = w
                        found.append(w)
                        self._weed_event(w)
        finally:
            self.progress["running"] = False
        return found

    # decisions ----------------------------------------------------------------
    def animal_near(self, x: float, y: float) -> Optional[dict]:
        """An animal seen within ANIMAL_HOLD_FT of (x, y) in the last ANIMAL_HOLD_S seconds."""
        now = self._clock()
        for a in self.alerts.values():
            if a.get("finding") == "animal" and now - a["ts"] < ANIMAL_HOLD_S and math.hypot(a["x"] - x, a["y"] - y) <= ANIMAL_HOLD_FT:
                return a
        return None

    def laser_zone_check(self, weed_id: str) -> None:
        """Raise ZoneViolation when the weed sits in any zone (incl. no-laser near animal
        housing) or an animal was seen near it recently."""
        w = self.weeds[weed_id]
        z = self.zones.blocking(w["x"], w["y"], "laser") if self.zones else None
        if z:
            raise ZoneViolation(f"Refused to fire the laser inside {z.kind} zone '{z.name or z.id}' - pull it by hand")
        a = self.animal_near(w["x"], w["y"])
        if a:
            d = math.hypot(a["x"] - w["x"], a["y"] - w["y"])
            raise ZoneViolation(f"Refused: {a['label']} seen {d:.0f} ft away in the last {ANIMAL_HOLD_S / 60:.0f} minutes - pull it by hand")

    def approve(self, weed_id: str, mode: str = "aim") -> dict:
        w = self.weeds.get(weed_id)
        if w is None:
            raise KeyError(f"Unknown weed {weed_id}")
        if not self.has_laser:
            raise ScoutOnly("This rover has a camera only - pull the weed by hand, then mark it pulled")
        if w["status"] != "pending_review":
            raise ValueError(f"Weed is already {w['status']}")
        self.laser_zone_check(weed_id)
        # Park the camera frame over the weed, then the aiming dot / laser.
        self.drive.goto(*frame_to_property((w["x"], w["y"], (self.drive.pose[2] + 180) % 360), self.cfg.ahead_ft, 0.0))
        self.laser.aim(True)
        try:
            if mode == "burn":
                try:
                    ms = self.laser.burn(w.get("size_mm"))
                except InterlockError as err:
                    w["detail"] = f"Burn blocked: {err}"
                    self._weed_event(w)
                    raise
                w["status"], w["detail"] = "treated", f"Laser pulse {ms} ms"
                if isinstance(self.detector, SimRoverDetector):
                    self.detector.remove_near(w["x"], w["y"])
            else:
                w["detail"] = "Aimed - check the dot is on the weed, then burn or reject"
        finally:
            if mode == "burn":
                self.laser.aim(False)
        self._weed_event(w)
        return w

    def pulled(self, weed_id: str) -> dict:
        """A person pulled the weed by hand (cmd/event ack)."""
        w = self.weeds.get(weed_id)
        if w is None:
            raise KeyError(f"Unknown weed {weed_id}")
        w["status"], w["detail"] = "treated", "Pulled by hand"
        if isinstance(self.detector, SimRoverDetector):
            self.detector.remove_near(w["x"], w["y"])
        self._weed_event(w)
        return w

    def reject(self, weed_id: str) -> dict:
        w = self.weeds.get(weed_id)
        if w is None:
            raise KeyError(f"Unknown weed {weed_id}")
        w["status"], w["detail"] = "rejected", "Marked not a weed"
        self.laser.aim(False)
        self._weed_event(w)
        return w

    def ack_alert(self, alert_id: str) -> dict:
        a = self.alerts.get(alert_id)
        if a is None:
            if alert_id in self.weeds:
                return self.pulled(alert_id)
            raise KeyError(f"Unknown alert {alert_id}")
        a["status"] = "cleared"
        self._alert_event(a)
        return a

    def estop(self) -> None:
        self.halt = True
        self.laser.estop()
        self.drive.stop()


__all__ = ["RoverConfig", "RoverWeedPatrol", "SimDrive", "MqttGotoDrive", "SimRoverDetector", "FrameDetector",
           "YoloAnimalDetector", "WetGroundLeakDetector", "ScoutOnly", "coverage_route", "route_from_path",
           "frame_to_property", "heading_to", "animal_group", "water_point_at"]
