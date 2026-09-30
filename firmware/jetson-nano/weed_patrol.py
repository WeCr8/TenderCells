"""Weed patrol - find weeds in a bed, flag them for a person, laser-treat only on approval.

A FarmBot-style gantry (X along the bed, Y across, Z down) carries a downward
camera, a low-power visible aiming dot and (optionally) a weeding laser:

  pass     raster the bed, detect green plants that are not known crops, publish
           each new weed as a `weed_detected` event with status `pending_review`
           -> it appears as a flag on the Tender Cells 3D map
  approve  a person approves ONE weed: move over it, turn on the aiming dot;
           mode "burn" additionally fires the laser if every interlock passes
  reject   not a weed / leave it

Detection backends (pick with WEED_DETECTOR):
  hsv   OpenCV green thresholding + known-crop exclusion (the approach FarmBot's
        plant-detection uses; own implementation). Needs opencv-python.
  yolo  An Ultralytics YOLO weed model, e.g. from the Hugging Face Hub:
        WEED_MODEL=hf://<owner>/<repo>/<weights>.pt (needs ultralytics, huggingface_hub)
  sim   Synthetic bed with seeded crops and weeds - no camera, no packages.

LASER SAFETY: weeding lasers are Class 4 (eye and fire hazard). Burning requires
LASER_BURN_ENABLED=true, a closed enclosure interlock, no E-STOP, a human approval
per weed, bounded pulses and a cooldown. Student mode (default) never burns - it
only aims the visible Class 1/2 dot so detections can be verified safely.
"""

from __future__ import annotations

import math
import random
import time
from dataclasses import dataclass, field
from typing import Callable, Dict, List, Optional, Protocol, Sequence, Tuple

from zones import ZoneGuard, ZoneViolation


# ── geometry / config ─────────────────────────────────────────────────────────
@dataclass
class Plant:
    x: float  # mm along the bed (FarmBot X)
    y: float  # mm across the bed (FarmBot Y)
    r: float = 40.0  # protected radius, mm


@dataclass
class BedConfig:
    length_mm: float = 3000.0  # FarmBot Genesis ~ 3 m x 1.5 m
    width_mm: float = 1500.0
    fov_mm: Tuple[float, float] = (400.0, 300.0)  # camera footprint at scan height
    overlap: float = 0.2
    scan_z_mm: float = 0.0  # Z for scanning (FarmBot: 0 = top of travel)
    aim_z_mm: float = -150.0  # Z to aim/treat from
    known_plants: List[Plant] = field(default_factory=list)  # crops to protect
    item_id: Optional[str] = None  # property-layout item for the 3D flags
    merge_mm: float = 30.0  # detections closer than this are the same weed


@dataclass
class Detection:
    x: float
    y: float
    size_mm: float
    confidence: float
    label: str = "weed"


# What a pass looks for. Only "weed" findings can ever be offered for laser treatment;
# plant-health and animal sightings are alerts for a person (never lasered).
TASKS = ("weed", "plant_scan", "patrol")
ANIMAL_LABELS = {"Snake", "Rat", "Fox", "Raccoon", "Opossum", "Hawk", "Coyote", "Dog", "Cat"}


def plan_pass(bed: BedConfig) -> List[Tuple[float, float]]:
    """Serpentine camera waypoints covering the bed with the configured overlap."""
    fx, fy = bed.fov_mm
    step_x, step_y = fx * (1 - bed.overlap), fy * (1 - bed.overlap)
    xs = [min(fx / 2 + i * step_x, bed.length_mm - fx / 2) for i in range(max(1, math.ceil((bed.length_mm - fx) / step_x) + 1))]
    ys = [min(fy / 2 + j * step_y, bed.width_mm - fy / 2) for j in range(max(1, math.ceil((bed.width_mm - fy) / step_y) + 1))]
    points: List[Tuple[float, float]] = []
    for i, x in enumerate(xs):
        for y in (ys if i % 2 == 0 else list(reversed(ys))):
            points.append((round(x, 1), round(y, 1)))
    return points


def near_known_plant(x: float, y: float, plants: Sequence[Plant], margin: float = 10.0) -> bool:
    return any(math.hypot(x - p.x, y - p.y) <= p.r + margin for p in plants)


# ── detectors ─────────────────────────────────────────────────────────────────
class Detector(Protocol):
    def detect(self, center: Tuple[float, float], bed: BedConfig) -> List[Detection]: ...


class SimDetector:
    """Synthetic bed: seeded crops + weeds, noisy detections, a few false positives."""

    def __init__(self, bed: BedConfig, weeds: int = 6, seed: int = 42):
        rnd = random.Random(seed)
        if not bed.known_plants:
            bed.known_plants = [Plant(x, y, 60) for x in range(400, int(bed.length_mm), 600) for y in (bed.width_mm * 0.35, bed.width_mm * 0.7)]
        self._weeds: List[Tuple[float, float, float]] = []
        while len(self._weeds) < weeds:
            x, y = rnd.uniform(80, bed.length_mm - 80), rnd.uniform(80, bed.width_mm - 80)
            if not near_known_plant(x, y, bed.known_plants, 60):
                self._weeds.append((x, y, rnd.uniform(8, 35)))
        # A couple of stressed crops and one visiting animal for plant-scan / patrol tasks.
        self._stressed = [(p, rnd.choice(["Wilting", "Yellow leaves", "Pest damage"]))
                          for p in bed.known_plants if rnd.random() < 0.25]
        self._animals = [(rnd.uniform(200, bed.length_mm - 200), rnd.uniform(200, bed.width_mm - 200), "Snake")]
        self._rnd = rnd

    @property
    def truth(self) -> List[Tuple[float, float, float]]:
        return list(self._weeds)

    def remove_near(self, x: float, y: float, radius: float = 20.0) -> None:
        self._weeds = [w for w in self._weeds if math.hypot(w[0] - x, w[1] - y) > radius]

    def observe(self, center: Tuple[float, float], bed: BedConfig, task: str) -> List[Detection]:
        """Non-weed findings in view: stressed crops (plant_scan) or animals (patrol)."""
        fx, fy = bed.fov_mm
        inside = lambda x, y: abs(x - center[0]) <= fx / 2 and abs(y - center[1]) <= fy / 2  # noqa: E731
        if task == "plant_scan":
            return [Detection(p.x, p.y, p.r, 0.8, label) for p, label in self._stressed if inside(p.x, p.y)]
        if task == "patrol":
            return [Detection(x, y, 300, 0.88, label) for x, y, label in self._animals if inside(x, y)]
        return []

    def detect(self, center: Tuple[float, float], bed: BedConfig) -> List[Detection]:
        fx, fy = bed.fov_mm
        out = []
        for x, y, size in self._weeds:
            if abs(x - center[0]) <= fx / 2 and abs(y - center[1]) <= fy / 2:
                out.append(Detection(x + self._rnd.gauss(0, 4), y + self._rnd.gauss(0, 4), size, round(self._rnd.uniform(0.7, 0.97), 2)))
        return out


class HsvDetector:
    """Green-on-soil detection from a downward camera (OpenCV)."""

    def __init__(self, capture: Callable[[], "object"], h=(30, 90), s=(50, 255), v=(50, 255), blur=15,
                 morph=6, iterations=4, min_area_px=40, mm_per_px: float = 0.5):
        import cv2  # noqa: F401  (fail early with a clear ImportError on the controller)

        self.capture, self.h, self.s, self.v = capture, h, s, v
        self.blur, self.morph, self.iterations = blur, morph, iterations
        self.min_area_px, self.mm_per_px = min_area_px, mm_per_px

    def detect(self, center: Tuple[float, float], bed: BedConfig) -> List[Detection]:
        import cv2
        import numpy as np

        img = self.capture()
        k = self.blur | 1
        hsv = cv2.cvtColor(cv2.medianBlur(img, k), cv2.COLOR_BGR2HSV)
        # OpenCV hue is 0-180; FarmBot-style ranges are given in that scale.
        mask = cv2.inRange(hsv, (self.h[0], self.s[0], self.v[0]), (self.h[1], self.s[1], self.v[1]))
        kernel = cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (self.morph, self.morph))
        mask = cv2.morphologyEx(mask, cv2.MORPH_CLOSE, kernel, iterations=self.iterations)
        contours, _ = cv2.findContours(mask, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
        hgt, wid = mask.shape[:2]
        out = []
        for c in contours:
            area = cv2.contourArea(c)
            if area < self.min_area_px:
                continue
            (px, py), radius = cv2.minEnclosingCircle(c)
            # Image centre = gantry position; +x right = bed X, +y down = bed Y.
            x = center[0] + (px - wid / 2) * self.mm_per_px
            y = center[1] + (py - hgt / 2) * self.mm_per_px
            fill = float(np.clip(area / (math.pi * radius * radius + 1e-6), 0, 1))
            out.append(Detection(x, y, 2 * radius * self.mm_per_px, round(0.5 + 0.5 * fill, 2)))
        return out


class YoloDetector:
    """Ultralytics YOLO weed model, e.g. from the Hugging Face Hub (hf://owner/repo/best.pt)."""

    def __init__(self, capture: Callable[[], "object"], weights: str, weed_classes: Sequence[str] = ("weed",),
                 min_conf: float = 0.4, mm_per_px: float = 0.5):
        from ultralytics import YOLO  # type: ignore

        if weights.startswith("hf://"):
            from huggingface_hub import hf_hub_download  # type: ignore

            owner, repo, *path = weights[5:].split("/")
            weights = hf_hub_download(repo_id=f"{owner}/{repo}", filename="/".join(path))
        self.model, self.capture = YOLO(weights), capture
        self.weed_classes = {c.lower() for c in weed_classes}
        self.min_conf, self.mm_per_px = min_conf, mm_per_px

    def detect(self, center: Tuple[float, float], bed: BedConfig) -> List[Detection]:
        img = self.capture()
        hgt, wid = img.shape[:2]
        out = []
        for res in self.model(img, verbose=False):
            for box, cls, conf in zip(res.boxes.xywh.tolist(), res.boxes.cls.tolist(), res.boxes.conf.tolist()):
                if conf < self.min_conf or res.names[int(cls)].lower() not in self.weed_classes:
                    continue
                px, py, bw, bh = box
                out.append(Detection(center[0] + (px - wid / 2) * self.mm_per_px, center[1] + (py - hgt / 2) * self.mm_per_px,
                                     max(bw, bh) * self.mm_per_px, round(conf, 2)))
        return out


# ── motion + laser hardware ───────────────────────────────────────────────────
class Gantry(Protocol):
    def move_to(self, x: float, y: float, z: float) -> None: ...
    def stop(self) -> None: ...


class SimGantry:
    def __init__(self):
        self.position = (0.0, 0.0, 0.0)
        self.stopped = False

    def move_to(self, x: float, y: float, z: float) -> None:
        if self.stopped:
            raise RuntimeError("Gantry stopped (E-STOP)")
        self.position = (x, y, z)

    def stop(self) -> None:
        self.stopped = True


class GrblGantry:
    """GRBL CNC controller over USB serial (common in student FarmBot-style builds)."""

    def __init__(self, port: str, baud: int = 115200, feed_mm_min: int = 3000, serial_factory=None):
        if serial_factory is None:
            import serial  # type: ignore  # pip install pyserial

            serial_factory = serial.Serial
        self.conn = serial_factory(port, baud, timeout=10)
        self.feed = feed_mm_min
        self.position = (0.0, 0.0, 0.0)  # last commanded (reported as the tool position)
        self._send("$X")  # unlock after reset

    def _send(self, line: str) -> None:
        self.conn.write((line + "\n").encode())
        reply = self.conn.readline().decode(errors="ignore").strip()
        if reply.startswith("error") or reply.startswith("ALARM"):
            raise RuntimeError(f"GRBL: {reply} for {line}")

    def move_to(self, x: float, y: float, z: float) -> None:
        self._send(f"G90 G1 X{x:.1f} Y{y:.1f} Z{z:.1f} F{self.feed}")
        self._send("G4 P0")  # wait until the move completes
        self.position = (x, y, z)

    def stop(self) -> None:
        self.conn.write(b"!")  # feed hold (real-time command)


class FarmBotGantry:
    """A FarmBot Genesis driven through FarmBot's official farmbot-py (MIT, `pip install farmbot`).

    This is the Project Cyclops build (CC0): a small diode laser module on the Genesis
    UTM, with the FarmBot moving the head. Auth uses a FarmBot API token (FARMBOT_TOKEN),
    never the account password. X runs along the bed, Y across it, Z down (negative).
    """

    def __init__(self, token: object, bot: object = None, speed: int = 100):
        if bot is None:
            from farmbot import Farmbot  # type: ignore

            bot = Farmbot()
            bot.set_token(token)
        self.bot, self.speed = bot, speed
        self.position = (0.0, 0.0, 0.0)  # last commanded (reported as the tool position)

    def move_to(self, x: float, y: float, z: float) -> None:
        self.bot.move(x=round(x, 1), y=round(y, 1), z=round(z, 1), speed=self.speed)  # blocks until done
        self.position = (x, y, z)

    def stop(self) -> None:
        self.bot.e_stop()  # locks the Farmduino until unlocked from the FarmBot app

    def pin_value(self, pin: int) -> Optional[int]:
        """Current value of a Farmduino pin from the status tree, or None if unknown."""
        self.bot.read_pin(pin)
        pins = self.bot.read_status("pins") or {}
        value = (pins.get(str(pin)) or {}).get("value")
        return int(value) if isinstance(value, (int, float)) else None


class InterlockError(RuntimeError):
    """The laser refused to fire; message says which interlock."""


@dataclass(frozen=True)
class LaserProfile:
    """A weeding laser class. Exposure scales with weed size between min_ms and max_ms
    (LiteWeed tunes exposure by weed size and species the same way). The ms values
    are STARTING POINTS - calibrate on test weeds for your module, focus and height."""

    name: str
    power_w: float
    wavelength_nm: int
    laser_class: str
    min_ms: int
    max_ms: int
    small_mm: float = 10.0  # weeds this size or smaller get min_ms
    large_mm: float = 60.0  # this size or larger get max_ms

    def exposure_ms(self, size_mm: Optional[float]) -> int:
        if size_mm is None:
            return self.min_ms
        t = min(1.0, max(0.0, (size_mm - self.small_mm) / (self.large_mm - self.small_mm)))
        return int(round(self.min_ms + t * (self.max_ms - self.min_ms)))


LASER_PROFILES: Dict[str, LaserProfile] = {
    # Fixed pulse from LASER_PULSE_MS (legacy behaviour), capped at 1500 ms.
    "fixed": LaserProfile("fixed", 0.0, 0, "unknown", 600, 1500),
    # Project Cyclops on FarmBot Genesis: 500 mW 405 nm dot module (FB03-500). Class 3B.
    "diode-500mw": LaserProfile("diode-500mw", 0.5, 405, "3B", 2000, 8000),
    # LiteWeed / research rovers: 4 W 450 nm blue diode. Class 4.
    "diode-4w": LaserProfile("diode-4w", 4.0, 450, "4", 500, 3000),
}


class LaserController:
    """Aiming dot + weeding laser with interlocks. Pin writers are injected."""

    MAX_PULSE_MS = 1500  # cap for the "fixed" profile

    def __init__(self, set_aim: Callable[[bool], None], set_laser: Callable[[bool], None],
                 enclosure_closed: Callable[[], bool], burn_enabled: bool = False, student_mode: bool = True,
                 pulse_ms: int = 600, cooldown_s: float = 2.0, sleeper: Callable[[float], None] = time.sleep,
                 clock: Callable[[], float] = time.monotonic, profile: str = "fixed"):
        self._aim, self._laser, self._enclosure = set_aim, set_laser, enclosure_closed
        self.burn_enabled, self.student_mode = burn_enabled, student_mode
        if profile not in LASER_PROFILES:
            raise ValueError(f"Unknown laser profile '{profile}' (one of {', '.join(LASER_PROFILES)})")
        self.profile = LASER_PROFILES[profile]
        self.pulse_ms = min(int(pulse_ms), self.MAX_PULSE_MS)
        self.cooldown_s = cooldown_s
        self.estop_active = False
        self._sleep, self._clock = sleeper, clock
        self._last_fire = -1e9
        self.aim_on = False    # reported so the OS can draw the aiming dot / beam
        self.laser_on = False

    def status(self) -> dict:
        p = self.profile
        return {"burnEnabled": self.burn_enabled, "studentMode": self.student_mode,
                "enclosureClosed": bool(self._enclosure()), "estop": self.estop_active,
                "pulseMs": self.pulse_ms if p.name == "fixed" else p.max_ms,
                "profile": p.name, "laserClass": p.laser_class, "wavelengthNm": p.wavelength_nm, "powerW": p.power_w}

    def check_burn_allowed(self) -> None:
        if self.estop_active:
            raise InterlockError("E-STOP is active")
        if self.student_mode:
            raise InterlockError("Student mode - aiming dot only, the laser never fires")
        if not self.burn_enabled:
            raise InterlockError("Laser burn is not enabled on this robot (LASER_BURN_ENABLED)")
        if not self._enclosure():
            raise InterlockError("Enclosure is open - close the cover before burning")
        if self._clock() - self._last_fire < self.cooldown_s:
            raise InterlockError("Laser is cooling down - try again in a moment")

    def aim(self, on: bool) -> None:
        self.aim_on = bool(on) and not self.estop_active
        self._aim(self.aim_on)

    def pulse_for(self, size_mm: Optional[float] = None) -> int:
        """Pulse length for a weed of this size under the active profile."""
        if self.profile.name == "fixed":
            return self.pulse_ms
        return self.profile.exposure_ms(size_mm)

    def burn(self, size_mm: Optional[float] = None) -> int:
        """Fire one bounded pulse. Returns the pulse length in ms (shorter if E-STOP cut it)."""
        self.check_burn_allowed()
        ms = self.pulse_for(size_mm)
        self._last_fire = self._clock()
        fired = 0
        try:
            self._laser(True)
            self.laser_on = True
            # Sleep in 50 ms slices so an E-STOP from another thread ends the pulse at once.
            while fired < ms and not self.estop_active:
                step = min(50, ms - fired)
                self._sleep(step / 1000.0)
                fired += step
        finally:
            self._laser(False)  # always off, even if interrupted
            self.laser_on = False
        if self.estop_active:
            raise InterlockError(f"E-STOP during pulse - laser off after {fired} ms")
        return ms

    def estop(self) -> None:
        self.estop_active = True
        self._laser(False)
        self._aim(False)
        self.aim_on = self.laser_on = False


# ── patrol logic ──────────────────────────────────────────────────────────────
class WeedPatrol:
    def __init__(self, bed: BedConfig, detector: Detector, gantry: Gantry, laser: LaserController,
                 publish_event: Callable[[dict], None]):
        self.bed, self.detector, self.gantry, self.laser = bed, detector, gantry, laser
        self.publish_event = publish_event
        self.weeds: Dict[str, dict] = {}
        self._next = 1
        self.progress = {"running": False, "pass": 0, "passes": 0, "waypoint": 0, "waypoints": 0, "task": "weed"}
        self.halt = False
        self.alerts: Dict[str, dict] = {}  # plant-health / animal sightings (never lasered)
        # Exclusion zones from the OS (tc/{id}/cfg/zones). None = only the bed limits apply.
        self.zones: Optional[ZoneGuard] = None

    def _event(self, weed: dict) -> None:
        self.publish_event({
            "id": weed["id"], "type": "weed_detected", "status": weed["status"], "title": "Weed",
            "detail": weed.get("detail") or f"~{weed['size_mm']:.0f} mm, {int(weed['confidence'] * 100)}% sure",
            "confidence": weed["confidence"], "bedMm": {"x": round(weed["x"], 1), "y": round(weed["y"], 1)},
            **({"itemId": self.bed.item_id} if self.bed.item_id else {}),
        })

    def _merge(self, d: Detection) -> Optional[dict]:
        """Return the new weed record, or None if it matches one already flagged."""
        for w in self.weeds.values():
            if w["status"] in ("pending_review", "approved") and math.hypot(w["x"] - d.x, w["y"] - d.y) <= self.bed.merge_mm:
                w["confidence"] = max(w["confidence"], d.confidence)
                return None
        weed = {"id": f"weed-{self._next}", "x": d.x, "y": d.y, "size_mm": d.size_mm,
                "confidence": d.confidence, "status": "pending_review"}
        self._next += 1
        self.weeds[weed["id"]] = weed
        return weed

    def _alert(self, d: Detection) -> Optional[dict]:
        """New located sighting (plant stress / animal) unless one is already open nearby."""
        for a in self.alerts.values():
            if a["status"] == "active" and a["label"] == d.label and math.hypot(a["x"] - d.x, a["y"] - d.y) <= 300:
                return None
        alert = {"id": f"obs-{self._next}", "x": d.x, "y": d.y, "label": d.label, "confidence": d.confidence, "status": "active"}
        self._next += 1
        self.alerts[alert["id"]] = alert
        return alert

    def _alert_event(self, a: dict) -> None:
        animal = a["label"] in ANIMAL_LABELS
        self.publish_event({
            "id": a["id"], "type": "alert", "status": a["status"], "label": a["label"],
            "title": f"{a['label']} {'seen' if animal else ''}".strip(),
            "detail": "Keep people and animals clear; the laser is never used on animals" if animal else "Check the plant",
            "confidence": a["confidence"], "bedMm": {"x": round(a["x"], 1), "y": round(a["y"], 1)},
            **({"itemId": self.bed.item_id} if self.bed.item_id else {}),
        })

    def ack_alert(self, alert_id: str) -> dict:
        """A person has seen / handled a sighting."""
        a = self.alerts.get(alert_id)
        if a is None:
            raise KeyError(f"Unknown alert {alert_id}")
        a["status"] = "cleared"
        self._alert_event(a)
        return a

    def run_passes(self, passes: int = 1, task: str = "weed") -> List[dict]:
        """Scan the bed `passes` times for weeds, stressed plants or animals.

        Returns the new weeds (weed task) or the new sightings (other tasks)."""
        if task not in TASKS:
            raise ValueError(f"task must be one of {', '.join(TASKS)}")
        found: List[dict] = []
        waypoints = plan_pass(self.bed)
        self.halt = False
        self.progress = {"running": True, "pass": 0, "passes": passes, "waypoint": 0, "waypoints": len(waypoints), "task": task}
        try:
            for p in range(passes):
                self.progress["pass"] = p + 1
                for i, (x, y) in enumerate(waypoints):
                    if self.halt or self.laser.estop_active:
                        return found
                    self.progress["waypoint"] = i + 1
                    if self.zones:
                        try:
                            self.zones.check_bed(x, y, "drive")
                        except ZoneViolation:
                            continue  # never drive into a no-go / keep-out area; scan the rest
                    self.gantry.move_to(x, y, self.bed.scan_z_mm)
                    if task != "weed":
                        observe = getattr(self.detector, "observe", None)
                        for d in (observe((x, y), self.bed, task) if observe else []):
                            alert = self._alert(d)
                            if alert:
                                found.append(alert)
                                self._alert_event(alert)
                        continue
                    for d in self.detector.detect((x, y), self.bed):
                        if not (0 <= d.x <= self.bed.length_mm and 0 <= d.y <= self.bed.width_mm):
                            continue
                        if near_known_plant(d.x, d.y, self.bed.known_plants):
                            continue  # a crop, not a weed
                        weed = self._merge(d)
                        if weed:
                            found.append(weed)
                            self._event(weed)
        finally:
            self.progress["running"] = False
        return found

    def approve(self, weed_id: str, mode: str = "aim") -> dict:
        """Human approved this weed. Aim at it; burn only if mode == 'burn' and interlocks pass."""
        weed = self.weeds.get(weed_id)
        if weed is None:
            raise KeyError(f"Unknown weed {weed_id}")
        if weed["status"] not in ("pending_review", "approved"):
            raise ValueError(f"Weed is already {weed['status']}")
        if self.zones:
            try:
                # The aiming dot counts as laser too: nothing is lit inside a zone.
                self.zones.check_bed(weed["x"], weed["y"], "laser")
            except ZoneViolation as err:
                weed["detail"] = str(err)
                self._event(weed)
                raise
        weed["status"] = "approved"
        self._event(weed)
        self.gantry.move_to(weed["x"], weed["y"], self.bed.aim_z_mm)
        self.laser.aim(True)
        try:
            if mode == "burn":
                try:
                    ms = self.laser.burn(weed.get("size_mm"))
                except InterlockError as err:
                    weed["status"], weed["detail"] = "pending_review", f"Burn blocked: {err}"
                    self._event(weed)
                    raise
                weed["status"], weed["detail"] = "treated", f"Laser pulse {ms} ms"
                if isinstance(self.detector, SimDetector):
                    self.detector.remove_near(weed["x"], weed["y"])
            else:
                weed["detail"] = "Aimed - check the dot is on the weed, then burn or reject"
                weed["status"] = "pending_review"  # still needs the treat decision
        finally:
            if mode == "burn":
                self.laser.aim(False)  # aim-only leaves the dot on so a person can check it
        self._event(weed)
        return weed

    def reject(self, weed_id: str) -> dict:
        weed = self.weeds.get(weed_id)
        if weed is None:
            raise KeyError(f"Unknown weed {weed_id}")
        weed["status"], weed["detail"] = "rejected", "Marked not a weed"
        self.laser.aim(False)
        self._event(weed)
        return weed

    def estop(self) -> None:
        self.halt = True
        self.laser.estop()
        self.gantry.stop()
