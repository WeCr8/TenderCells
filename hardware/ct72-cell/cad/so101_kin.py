"""SO-101 follower kinematics for the INVERTED (hanging) mount - planar 5-DOF model + capsules.

Dimensions from the SO-101 URDF (TheRobotStudio/SO-ARM100, Simulation/SO101/so101_new_calib.urdf):
  base face -> shoulder_pan axis 62.4 mm, pan -> shoulder_lift 54.2 mm down and 30.4 mm back,
  shoulder_lift -> elbow 112.6 mm (+28 mm offset -> 116.0 mm effective), elbow -> wrist_flex 134.9 mm,
  wrist_flex -> wrist_roll 61.1 mm, wrist_roll -> gripper frame 98.1 mm, +20 mm soft egg fingers.
Joint ranges are APPROXIMATIONS about the straight-arm reference (URDF limits +/-100, +/-97, +/-95 deg
shifted to straight); verify in MuJoCo with the real URDF before trusting a marginal result.
World frame: +Z up. The base face points DOWN (arm hangs). Angles: theta measured from straight
down toward +u, where u is the horizontal unit vector of the pan direction.
"""
from __future__ import annotations
import math
import numpy as np

HS = 62.4 + 54.2          # base face -> shoulder (down)
A0 = -30.4                # shoulder offset along u (behind the pan axis)
L1 = math.hypot(112.57, 28.0)
L2 = 134.9
L3 = 61.1 + 98.1 + 20.0   # wrist_flex -> fingertip centre (soft fingers)
LIM = {"pan": (-110, 110), "lift": (-100, 100), "elbow": (-97, 97), "wrist": (-95, 95)}
RADII = {"base": 50.0, "upper": 30.0, "fore": 28.0, "wrist": 26.0, "grip": 32.0}   # capsule radii (mm), egg in grip incl.


def fk(base, pan_deg, th1_deg, q3_deg, q4_deg):
    """Return dict of world points: base, shoulder, elbow, wrist, tip (mm). base = (x,y,z) of the base face."""
    b = np.asarray(base, float)
    ph = math.radians(pan_deg)
    u = np.array([math.cos(ph), math.sin(ph), 0.0])
    dn = np.array([0.0, 0.0, -1.0])
    def d(th):
        t = math.radians(th)
        return math.sin(t) * u + math.cos(t) * dn
    s = b + A0 * u + HS * dn
    e = s + L1 * d(th1_deg)
    w = e + L2 * d(th1_deg + q3_deg)
    t = w + L3 * d(th1_deg + q3_deg + q4_deg)
    return {"base": b, "pan": b + 62.4 * dn, "shoulder": s, "elbow": e, "wrist": w, "tip": t,
            "tool_dir": d(th1_deg + q3_deg + q4_deg)}


def capsules(pts):
    """(p0, p1, radius, name) list for collision checks."""
    return [(pts["base"], pts["shoulder"], RADII["base"], "base+shoulder"),
            (pts["shoulder"], pts["elbow"], RADII["upper"], "upper_arm"),
            (pts["elbow"], pts["wrist"], RADII["fore"], "forearm"),
            (pts["wrist"], pts["wrist"] + 0.4 * (pts["tip"] - pts["wrist"]), RADII["wrist"], "wrist"),
            (pts["wrist"] + 0.4 * (pts["tip"] - pts["wrist"]), pts["tip"], RADII["grip"], "gripper+egg")]


def batch_fk(pan, th1, q3, q4):
    """Vectorised FK relative to base at origin. Inputs arrays (deg). Returns dict name -> (N,3)."""
    ph = np.radians(pan)
    u = np.stack([np.cos(ph), np.sin(ph), np.zeros_like(ph)], -1)
    dn = np.array([0, 0, -1.0])
    def d(th):
        t = np.radians(th)[..., None]
        return np.sin(t) * u + np.cos(t) * dn
    s = A0 * u + HS * dn
    e = s + L1 * d(th1)
    w = e + L2 * d(th1 + q3)
    t = w + L3 * d(th1 + q3 + q4)
    return {"base": np.zeros_like(s), "shoulder": s, "elbow": e, "wrist": w, "tip": t}


def folded_pose():
    """Compact transit/park pose inside the approximate limits: lift 100, elbow -97, wrist -95
    (gripper tucked back under the plate). Lowest point ~240 mm below the base face."""
    return (0.0, 100.0, -97.0, -95.0)
