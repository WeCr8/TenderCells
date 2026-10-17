"""Egg detection for the CT72 nest boxes (rev A1.2).

Two paths, same output (egg centres in the cell frame, mm):
  * ScriptedEggDetector - classical CV, runs on a Pi Zero 2 W / Pi 5 / Jetson: the gantry camera looks straight
    down into an open box from a known gantry pose, eggs are bright ellipses (~45 x 60 mm) against the dark liner.
    Pixel -> cell mm through a planar homography fitted once per camera from the basket AprilTag (tag36h11 id 0)
    and the box corners. Starter uses this with the vacuum tool.
  * Policy picks (Plus/Pro) - an ACT/SmolVLA policy trained from teleop demos does the final pick; the detector
    still gates the routine (no egg -> skip the box) and logs the count.
OpenCV is imported lazily so the routines and tests run without it.
"""
from __future__ import annotations

from dataclasses import dataclass
from typing import List, Optional, Sequence, Tuple

EGG_AREA_MM2 = (1200.0, 3600.0)     # projected area window for a lying egg (about 40-50 x 55-65 mm)
EGG_ASPECT = (1.15, 1.6)


@dataclass
class Detection:
    xy_mm: Tuple[float, float]
    area_mm2: float
    aspect: float
    score: float


def apply_h(H: Sequence[Sequence[float]], u: float, v: float) -> Tuple[float, float]:
    x = H[0][0] * u + H[0][1] * v + H[0][2]
    y = H[1][0] * u + H[1][1] * v + H[1][2]
    w = H[2][0] * u + H[2][1] * v + H[2][2]
    return x / w, y / w


def filter_ellipses(cands: Sequence[Tuple[float, float, float, float, float]], H, mm_per_px: float,
                    box_xy: Tuple[float, float, float, float]) -> List[Detection]:
    """cands: (u, v, major_px, minor_px, mean_brightness 0-1). Keep egg-sized, egg-shaped, inside the box."""
    out = []
    x0, y0, x1, y1 = box_xy
    for u, v, a, b, br in cands:
        if b <= 0:
            continue
        area = 3.14159 * (a / 2) * (b / 2) * mm_per_px ** 2
        asp = a / b
        x, y = apply_h(H, u, v)
        if not (EGG_AREA_MM2[0] <= area <= EGG_AREA_MM2[1] and EGG_ASPECT[0] <= asp <= EGG_ASPECT[1]):
            continue
        if not (x0 + 20 <= x <= x1 - 20 and y0 + 20 <= y <= y1 - 20):
            continue
        out.append(Detection((x, y), area, asp, min(1.0, br)))
    return out


class ScriptedEggDetector:  # pragma: no cover - needs a camera + OpenCV
    def __init__(self, grab, H, mm_per_px: float):
        self.grab, self.H, self.mm_per_px = grab, H, mm_per_px

    def detect(self, box_xy) -> List[Detection]:
        import cv2
        img = self.grab()
        g = cv2.GaussianBlur(cv2.cvtColor(img, cv2.COLOR_BGR2GRAY), (7, 7), 0)
        _, th = cv2.threshold(g, 0, 255, cv2.THRESH_BINARY + cv2.THRESH_OTSU)
        cnts, _ = cv2.findContours(th, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
        cands = []
        for c in cnts:
            if len(c) < 5:
                continue
            (u, v), (a, b), _ = cv2.fitEllipse(c)
            a, b = max(a, b), min(a, b)
            mask = th[int(max(0, v - 2)):int(v + 2), int(max(0, u - 2)):int(u + 2)]
            cands.append((u, v, a, b, float(mask.mean() / 255.0) if mask.size else 0.0))
        return filter_ellipses(cands, self.H, self.mm_per_px, box_xy)
