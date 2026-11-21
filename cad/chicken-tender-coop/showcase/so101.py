"""SO-101 follower (LeRobot) kinematics straight from the public URDF.

Source: TheRobotStudio/SO-ARM100, Simulation/SO101/so101_new_calib.urdf (Apache-2.0, see
showcase/third_party/SO-ARM100_LICENSE). The URDF is parsed here (no ROS needed); forward kinematics
use its joint origins, axes and limits exactly. Units: URDF metres in, millimetres out.
"""
from __future__ import annotations
import math, os, xml.etree.ElementTree as ET
import numpy as np

HERE = os.path.dirname(os.path.abspath(__file__))
URDF = os.environ.get("SO101_URDF", os.path.join(HERE, "third_party", "SO101", "so101_new_calib.urdf"))
ARM_JOINTS = ["shoulder_pan", "shoulder_lift", "elbow_flex", "wrist_flex", "wrist_roll"]


def rpy_matrix(r, p, y):
    cr, sr, cp, sp, cy, sy = math.cos(r), math.sin(r), math.cos(p), math.sin(p), math.cos(y), math.sin(y)
    return np.array([[cy * cp, cy * sp * sr - sy * cr, cy * sp * cr + sy * sr],
                     [sy * cp, sy * sp * sr + cy * cr, sy * sp * cr - cy * sr],
                     [-sp, cp * sr, cp * cr]])


def tf(xyz=(0, 0, 0), rpy=(0, 0, 0)):
    T = np.eye(4); T[:3, :3] = rpy_matrix(*rpy); T[:3, 3] = xyz; return T


def axis_angle(axis, a):
    axis = np.asarray(axis, float); axis = axis / (np.linalg.norm(axis) + 1e-12)
    x, y, z = axis; c, s = math.cos(a), math.sin(a); C = 1 - c
    R = np.array([[c + x * x * C, x * y * C - z * s, x * z * C + y * s],
                  [y * x * C + z * s, c + y * y * C, y * z * C - x * s],
                  [z * x * C - y * s, z * y * C + x * s, c + z * z * C]])
    T = np.eye(4); T[:3, :3] = R; return T


def _vec(s, n=3):
    return [float(v) for v in (s or " ".join(["0"] * n)).split()]


class URDF_Model:
    def __init__(self, path=URDF):
        root = ET.parse(path).getroot()
        self.links, self.joints = {}, {}
        for l in root.findall("link"):
            vis = []
            for v in l.findall("visual"):
                o = v.find("origin"); m = v.find("geometry/mesh")
                if m is None:
                    continue
                vis.append({"T": tf(_vec(o.get("xyz")) if o is not None else (0, 0, 0),
                                    _vec(o.get("rpy")) if o is not None else (0, 0, 0)),
                            "mesh": m.get("filename")})
            inert = l.find("inertial/mass")
            self.links[l.get("name")] = {"visuals": vis, "mass": float(inert.get("value")) if inert is not None else 0.0}
        for j in root.findall("joint"):
            o = j.find("origin"); a = j.find("axis"); lim = j.find("limit")
            self.joints[j.get("name")] = {
                "type": j.get("type"), "parent": j.find("parent").get("link"), "child": j.find("child").get("link"),
                "T": tf(_vec(o.get("xyz")), _vec(o.get("rpy"))) if o is not None else np.eye(4),
                "axis": _vec(a.get("xyz")) if a is not None else [0, 0, 1],
                "limit": (float(lim.get("lower")), float(lim.get("upper"))) if lim is not None else None,
                "effort": float(lim.get("effort")) if lim is not None else None}
        self.child_of = {j["child"]: (n, j) for n, j in self.joints.items()}
        self.root = [l for l in self.links if l not in self.child_of][0]

    def fk(self, q: dict, base=np.eye(4)):
        """World 4x4 per link (metres) for joint dict q (rad)."""
        out = {self.root: base.copy()}
        def get(link):
            if link in out:
                return out[link]
            jn, j = self.child_of[link]
            T = get(j["parent"]) @ j["T"]
            if j["type"] in ("revolute", "continuous"):
                T = T @ axis_angle(j["axis"], q.get(jn, 0.0))
            out[link] = T
            return T
        for l in self.links:
            get(l)
        return out

    def limits(self, names=ARM_JOINTS):
        return [self.joints[n]["limit"] for n in names]


_M = None
def model():
    global _M
    if _M is None:
        _M = URDF_Model()
    return _M


def mount_tf(pos_mm, yaw_deg=0.0, inverted=False):
    """Base pose in the coop frame (mm in, metres in the matrix)."""
    T = np.eye(4)
    R = rpy_matrix(math.pi if inverted else 0.0, 0.0, 0.0) if inverted else np.eye(3)
    Rz = rpy_matrix(0, 0, math.radians(yaw_deg))
    T[:3, :3] = Rz @ R
    T[:3, 3] = np.asarray(pos_mm) / 1000.0
    return T


def tool_point(links, offset_mm=(0, 0, 0)):
    """gripper_frame_link origin (between the jaw tips) + its approach axis (+Z of that frame), mm."""
    T = links["gripper_frame_link"]
    p = (T[:3, :3] @ (np.asarray(offset_mm) / 1000.0) + T[:3, 3]) * 1000.0
    return p, T[:3, 2]


def ik(target_mm, base, approach=(0, 0, -1), cone_deg=35.0, seeds=None, w_ori=150.0):
    """Position IK for the gripper frame with a soft approach-cone penalty. Returns (q dict, err_mm, tilt_deg)."""
    from scipy.optimize import least_squares
    m = model()
    lo, hi = zip(*m.limits())
    lo, hi = np.array(lo), np.array(hi)
    a = np.asarray(approach, float); a /= np.linalg.norm(a)
    tgt = np.asarray(target_mm, float)
    def res(x):
        q = dict(zip(ARM_JOINTS, x)); q["gripper"] = 0.35
        L = m.fk(q, base)
        p, z = tool_point(L)
        tilt = math.degrees(math.acos(np.clip(np.dot(z, a), -1, 1)))
        return np.concatenate([p - tgt, [w_ori * max(0.0, tilt - cone_deg) / 10.0]])
    best = None
    if seeds is None:
        rng = np.random.default_rng(1)
        seeds = [np.zeros(5), np.array([0, -0.6, 0.9, 1.0, 0])] + [lo + (hi - lo) * rng.random(5) for _ in range(14)]
        # bias pan toward the target
        bp = np.linalg.inv(base) @ np.r_[tgt / 1000.0, 1]
        pan0 = math.atan2(bp[1], bp[0])
        seeds += [np.array([np.clip(pan0 + d, lo[0], hi[0]), s1, s2, s3, 0]) for d in (0, math.pi)
                  for s1 in (-1.2, -0.4, 0.4, 1.2) for s2 in (-1.2, 0, 1.2) for s3 in (-1.0, 0.5, 1.4)]
    for s in seeds:
        r = least_squares(res, np.clip(s, lo + 1e-6, hi - 1e-6), bounds=(lo, hi), xtol=1e-8, ftol=1e-8, max_nfev=200)
        e = np.linalg.norm(r.fun[:3])
        tilt_pen = r.fun[3]
        score = e + tilt_pen * 10
        if best is None or score < best[0]:
            best = (score, r.x, e, tilt_pen)
        if e < 0.5 and tilt_pen < 1e-6:
            break
    q = dict(zip(ARM_JOINTS, best[1])); q["gripper"] = 0.35
    L = m.fk(q, base)
    _, z = tool_point(L)
    tilt = math.degrees(math.acos(np.clip(np.dot(z, a), -1, 1)))
    return q, best[2], tilt


# ---------------------------------------------------------------- fast batched FK + sampled IK seeds
def _batch_axis_angle(axis, a):
    axis = np.asarray(axis, float); axis = axis / np.linalg.norm(axis)
    x, y, z = axis; c, s = np.cos(a), np.sin(a); C = 1 - c
    R = np.empty(a.shape + (4, 4)); R[...] = np.eye(4)
    R[..., 0, 0] = c + x * x * C; R[..., 0, 1] = x * y * C - z * s; R[..., 0, 2] = x * z * C + y * s
    R[..., 1, 0] = y * x * C + z * s; R[..., 1, 1] = c + y * y * C; R[..., 1, 2] = y * z * C - x * s
    R[..., 2, 0] = z * x * C - y * s; R[..., 2, 1] = z * y * C + x * s; R[..., 2, 2] = c + z * z * C
    return R


def batch_tool(Q, base=np.eye(4)):
    """Q (N,5) rad -> tool points (N,3) mm and approach axes (N,3), plus elbow/wrist points for capsules."""
    m = model()
    chain = ["shoulder_pan", "shoulder_lift", "elbow_flex", "wrist_flex", "wrist_roll"]
    T = np.broadcast_to(base, (len(Q), 4, 4)).copy()
    pts = {}
    for i, jn in enumerate(chain):
        j = m.joints[jn]
        T = T @ j["T"] @ _batch_axis_angle(j["axis"], Q[:, i])
        pts[jn] = T[:, :3, 3] * 1000.0
    T = T @ m.joints["gripper_frame_joint"]["T"]
    return T[:, :3, 3] * 1000.0, T[:, :3, 2], pts


_SAMPLES = None
def samples(n=26):
    global _SAMPLES
    if _SAMPLES is None or len(_SAMPLES) != n ** 4:
        lim = model().limits()
        g = [np.linspace(lo + 0.02, hi - 0.02, n) for lo, hi in lim[:4]]
        G = np.stack(np.meshgrid(*g, indexing="ij"), -1).reshape(-1, 4)
        _SAMPLES = np.concatenate([G, np.zeros((len(G), 1))], 1)
    return _SAMPLES


def ik_fast(target_mm, base, approach=(0, 0, -1), cone_deg=35.0, prev=None):
    """Sampled seed + one least-squares refine. Returns (q dict, err_mm, tilt_deg)."""
    from scipy.optimize import least_squares
    m = model(); lo, hi = map(np.array, zip(*m.limits()))
    a = np.asarray(approach, float); a /= np.linalg.norm(a)
    tgt = np.asarray(target_mm, float)
    S = samples()
    key = id(base)
    cache = getattr(ik_fast, "_cache", {})
    if key not in cache or cache[key][0] is not base:
        p, z, _ = batch_tool(S, base); cache = {key: (base, p, z)}; ik_fast._cache = cache
    _, p, z = cache[key]
    tilt = np.degrees(np.arccos(np.clip(z @ a, -1, 1)))
    score = np.linalg.norm(p - tgt, axis=1) + 20.0 * np.maximum(0, tilt - cone_deg)
    order = np.argsort(score)[:10]
    seeds = ([np.asarray(prev)] if prev is not None else []) + [S[i] for i in order]
    ref = np.asarray(prev) if prev is not None else None
    def res(x):
        P_, Z_, _ = batch_tool(x[None], base)
        t = math.degrees(math.acos(np.clip(Z_[0] @ a, -1, 1)))
        return np.concatenate([P_[0] - tgt, [15.0 * max(0.0, t - cone_deg)], [0.5 * x[4]]])
    best, good = None, []
    for s in seeds:
        r = least_squares(res, np.clip(s, lo + 1e-6, hi - 1e-6), bounds=(lo, hi), max_nfev=80)
        e = np.linalg.norm(r.fun[:3]); sc = e + r.fun[3]
        if best is None or sc < best[0] - 1e-9:
            best = (sc, r.x, e)
        if sc < 1.0:
            good.append((float(np.linalg.norm(r.x[:4] - ref[:4])) if ref is not None else 0.0, r.x, e))
            if ref is None or good[-1][0] < 0.15:
                break
    if good:
        g = min(good, key=lambda z: z[0]); best = (0.0, g[1], g[2])
    P_, Z_, _ = batch_tool(best[1][None], base)
    t = math.degrees(math.acos(np.clip(Z_[0] @ a, -1, 1)))
    q = dict(zip(ARM_JOINTS, best[1])); q["gripper"] = 0.35
    return q, best[2], t
