"""SO-101 meshes (decimated from the public URDF STLs), arm trajectories for each option, and the
reach / clearance checks against the coop, nest boxes, hood and roost.
"""
from __future__ import annotations
import json, math, os
import numpy as np
import sc_params as P
import so101

HERE = os.path.dirname(os.path.abspath(__file__))
SO_DIR = os.path.join(HERE, "third_party", "SO101")
LITE = os.path.join(SO_DIR, "lite")


def link_meshes(target_faces=700):
    """{link: (V (n,3) metres in the link frame, F (m,3))}; decimated STLs cached in third_party/SO101/lite."""
    os.makedirs(LITE, exist_ok=True)
    m = so101.model()
    out = {}
    for ln, L in m.links.items():
        Vs, Fs, off = [], [], 0
        for v in L["visuals"]:
            name = os.path.basename(v["mesh"]).replace(".stl", "")
            cache = os.path.join(LITE, name + ".npz")
            if not os.path.exists(cache):
                import trimesh, fast_simplification
                tm = trimesh.load(os.path.join(SO_DIR, v["mesh"]), force="mesh")
                ratio = max(0.0, 1 - target_faces / max(len(tm.faces), 1))
                vv, ff = fast_simplification.simplify(np.asarray(tm.vertices, np.float32), np.asarray(tm.faces, np.int32), ratio)
                np.savez_compressed(cache, v=vv.astype(np.float32), f=ff.astype(np.int32))
            d = np.load(cache)
            V = (v["T"][:3, :3] @ d["v"].T.astype(float)).T + v["T"][:3, 3]
            Vs.append(V); Fs.append(d["f"] + off); off += len(V)
        if Vs:
            out[ln] = (np.concatenate(Vs), np.concatenate(Fs))
    return out


# ------------------------------------------------------------------ obstacles (axis-aligned boxes, mm)
def obstacles(cfg):
    x0, x1, y0, y1 = P.NB_X0, P.NB_X1, P.NB_Y0, P.NB_Y1
    t = P.NB_T
    zf = P.NEST_FLOOR_Z - t
    rim = P.NEST_FLOOR_Z + P.RIM_ROBOT
    O = {
        "coop right wall": (P.COOP_W, P.COOP_W + P.PLY_WALL, P.COOP_Y0, P.COOP_Y1, P.FLOOR_FRAME_Z0, P.FRONT_WALL_TOP),
        "nest floor + liner": (x0, x1, y0, y1, zf, P.NEST_FLOOR_Z + P.LINER_T),
        "nest front end wall": (x0, x1 - t, y0, y0 + t, zf, zf + P.NB_OUTER_H),
        "nest divider (6 in rim)": (x0, x1 - t, P.NB_DIV_Y - t / 2, P.NB_DIV_Y + t / 2, P.NEST_FLOOR_Z, rim),
        "nest back end rim": (x0, x1 - t, y1 - t, y1, zf, rim),
        "nest outer rim": (x1 - t, x1, y0, y1, zf, rim),
        "hood roof": (x0, P.HOOD_X1 + 9, P.HOOD_Y0 - 9, P.HOOD_Y1, P.HOOD_ROOF_Z, P.HOOD_ROOF_Z + 9),
        "hood front end wall": (x0, P.HOOD_X1 + 9, P.HOOD_Y0 - 9, P.HOOD_Y0, zf - 60, P.HOOD_ROOF_Z),
        "hood back end wall": (x0, P.HOOD_X1 + 9, P.HOOD_Y1 - 9, P.HOOD_Y1, zf - 60, P.HOOD_ROOF_Z),
        "hood outer wall": (P.HOOD_X1, P.HOOD_X1 + 9, P.HOOD_Y0, P.HOOD_Y1, zf - 60, P.HOOD_ROOF_Z),
        "roost (inside the coop)": (P.COOP_W / 2 - P.ROOST_L / 2, P.COOP_W / 2 + P.ROOST_L / 2,
                                    P.COOP_Y1 - P.ROOST_FROM_BACK - P.W2 / 2, P.COOP_Y1 - P.ROOST_FROM_BACK + P.W2 / 2,
                                    P.ROOST_TOP_Z - P.T2, P.ROOST_TOP_Z),
    }
    cx, cy = P.BASKET_PLUS if cfg in ("plus", "pro") else P.BASKET_RAIL
    L, W, H = P.BASKET_IN
    lx, ly = (L, W) if cfg == "starter" else (W, L)
    z0, z1 = P.BASKET_FLOOR_Z - 3, P.BASKET_FLOOR_Z + 0.8 * H
    zi = P.BASKET_FLOOR_Z + (P.TRAY_ARM_LIP if cfg in ("plus", "pro") else 0.8 * H)
    O["basket rim"] = [(cx - lx / 2 - 3, cx - lx / 2, cy - ly / 2 - 3, cy + ly / 2 + 3, z0, zi),
                       (cx + lx / 2, cx + lx / 2 + 3, cy - ly / 2 - 3, cy + ly / 2 + 3, z0, z1),
                       (cx - lx / 2, cx + lx / 2, cy - ly / 2 - 3, cy - ly / 2, z0, z1),
                       (cx - lx / 2, cx + lx / 2, cy + ly / 2, cy + ly / 2 + 3, z0, z1)]
    return O


def box_dist(pts, b):
    lo = np.array([b[0], b[2], b[4]]); hi = np.array([b[1], b[3], b[5]])
    d = np.maximum(np.maximum(lo - pts, pts - hi), 0)
    outside = np.linalg.norm(d, axis=1)
    inside = np.min(np.minimum(pts - lo, hi - pts), axis=1)
    return np.where(np.all((pts > lo) & (pts < hi), axis=1), -inside, outside)


def clearance(points, cfg, skip=()):
    res = {}
    for nm, b in obstacles(cfg).items():
        if nm in skip:
            continue
        bs = b if isinstance(b, list) else [b]
        res[nm] = float(min(box_dist(points, bb).min() for bb in bs))
    return res


_MESH = None
def arm_points(q, base, every=3, skip_links=("base_link",)):
    global _MESH
    if _MESH is None:
        _MESH = link_meshes()
    L = so101.model().fk(q, base)
    pts = []
    for ln, (V, F) in _MESH.items():
        if ln in skip_links:
            continue
        T = L[ln]
        pts.append(((T[:3, :3] @ V[::every].T).T + T[:3, 3]) * 1000.0)
    return np.concatenate(pts)


def egg_held_points(q, base):
    L = so101.model().fk(q, base)
    p, z = so101.tool_point(L)
    c = p + z * 0.0
    a = np.linspace(0, 2 * math.pi, 16, endpoint=False)
    ring = [c + np.array([math.cos(t) * P.EGG_D / 2, 0, math.sin(t) * P.EGG_D / 2]) for t in a]
    ring += [c + np.array([0, s * P.EGG_L / 2, 0]) for s in (-1, 1)]
    return np.array(ring)


# ------------------------------------------------------------------ option geometry
def plus_base():
    return so101.mount_tf(P.PLUS_BASE, yaw_deg=float(os.environ.get("PLUS_YAW", P.PLUS_YAW)), inverted=True)


def pro_base(yc):
    return so101.mount_tf((P.NB_CX, yc, P.ARM_BASE_Z), yaw_deg=0.0, inverted=True)


PICK = "B1_CM"
GRASP_DZ = 8.0     # gripper frame 8 mm above the egg centre (jaws still straddle the equator)


PRO_OFFSET = 157.0   # carriage sits this far along Y from the egg (an egg straight under the base is hard to reach)


def pro_carriage_for_egg(egg_y):
    y = egg_y + PRO_OFFSET
    return y if y <= P.PRO_RAIL_Y[1] else egg_y - PRO_OFFSET


def waypoints(cfg, egg):
    """(name, tool target mm, approach cone deg, carriage y or None)."""
    ex, ey, ez = egg
    bx, by = P.BASKET_PLUS
    yc = pro_carriage_for_egg(ey) if cfg == "pro" else None
    yb = P.NB_DIV_Y if cfg == "pro" else None
    return [("park", PARK, 90, yb if cfg == "pro" else yc), ("enter", (P.NB_X1 + 5, ey, 1060), 80, yc), ("approach", (ex, ey, ez + 100), 35, yc), ("grasp", (ex, ey, ez + GRASP_DZ), 35, yc),
            ("lift", (ex, ey, ez + 120), 45, yc), ("cross rim", (P.NB_X1 + 5, ey, 1055), 80, yc),
            ("over basket", (bx, by, 1075), 60, yb), ("release", (bx, by, P.BASKET_FLOOR_Z + RELEASE_DZ), 30, yb),
            ("retreat", (bx - 40, by, 1075), 80, yb), ("park", PARK, 90, yb)]


RELEASE_DZ = 38.0   # gripper frame above the basket floor: egg bottom ~12 mm above a foam pad (ASSUMED)
PARK = (P.NB_X1 - 40, P.NB_DIV_Y, 1060)
# park = a joint pose (deg): arm folded over the outboard tray, clear of the hood roof and the nest rims
PARK_Q = {k: math.radians(v) for k, v in dict(shoulder_pan=0.0, shoulder_lift=-46.0, elbow_flex=79.0, wrist_flex=-43.0, wrist_roll=0.0).items()}
PARK_Q["gripper"] = 0.35


def base_of(cfg, yc):
    return plus_base() if cfg == "plus" else pro_base(yc)


def solve_traj(cfg, egg_xyz, sub=1):
    """Cartesian-interpolated IK (warm-started) through the waypoints. Returns dense list of
    (segment name, q, base, err_mm, tilt_deg); the animation plays these in order."""
    wp = waypoints(cfg, egg_xyz)
    if cfg == "pro":
        wp[0] = (wp[0][0], (PARK[0], wp[0][3] - 60, PARK[2]), 90, wp[0][3])
        wp[-1] = (wp[-1][0], (PARK[0], wp[-1][3] - 60, PARK[2]), 90, wp[-1][3])
    out = []
    prev = None
    for k in range(len(wp)):
        n1, t1, c1, y1 = wp[k]
        if n1 == "park":
            b = base_of(cfg, y1)
            out.append(("park", dict(PARK_Q), b, 0.0, 0.0))
            prev = dict(PARK_Q)
            continue
        if k == 0:
            steps = [(1.0, t1, c1, y1)]
        else:
            n0, t0, c0, y0 = wp[k - 1]
            steps = []
            for s in np.linspace(0, 1, sub + 1)[1:]:
                tgt = tuple((1 - s) * np.array(t0) + s * np.array(t1))
                yy = None if y0 is None else (1 - s) * y0 + s * y1
                steps.append((s, tgt, max(c0, c1), yy))
        for s, tgt, cone, yy in steps:
            b = base_of(cfg, yy)
            q, e, t = so101.ik_fast(tgt, b, cone_deg=cone,
                                    prev=None if prev is None else np.array([prev[j] for j in so101.ARM_JOINTS]))
            out.append((n1 if s == 1.0 else f"to {n1}", q, b, e, t))
            prev = q
    return out


def interp_path(traj, n=8):
    seq = []
    for (n0, q0, b0, _, _), (n1, q1, b1, _, _) in zip(traj, traj[1:]):
        for s in np.linspace(0, 1, n, endpoint=False):
            q = {k: (1 - s) * q0[k] + s * q1[k] for k in q0}
            B = b0.copy(); B[:3, 3] = (1 - s) * b0[:3, 3] + s * b1[:3, 3]
            seq.append((n1, s, q, B))
    seq.append((traj[-1][0], 1.0, traj[-1][1], traj[-1][2]))
    return seq
