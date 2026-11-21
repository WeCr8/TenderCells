"""Showcase timeline: firmware-driven door, hens, egg pick-and-place per arm option, doors, exploded build.
Every animated node gets a 4x4 world transform (mm) for any time t (s). Used by the GLB exporter, the
renderer and the USD exporter (rest pose + door/arm joint values)."""
from __future__ import annotations
import math, os, json
from functools import lru_cache
import numpy as np
import sc_params as P, sc_model as M, fw_sim, arm, so101

FPS = 30
TL = dict(title=(0.0, 2.5), open=(2.5, 7.0), hens_out=(7.0, 12.0), pick=(12.0, 22.0), collect=(22.0, 25.0),
          hens_in=(25.0, 29.0), close=(29.0, 37.0), build=(37.0, 56.0), end=(56.0, 59.0))
DURATION = TL["end"][1]


def ease(s):
    s = min(max(s, 0.0), 1.0)
    return s * s * (3 - 2 * s)


def seg(t, a, b):
    return ease((t - a) / (b - a)) if b > a else float(t >= b)


def T(xyz=(0, 0, 0)):
    m = np.eye(4); m[:3, 3] = xyz; return m


def R_axis(axis, deg, pivot):
    a = so101.axis_angle(axis, math.radians(deg))
    return T(pivot) @ a @ T(-np.asarray(pivot, float))


def S_axis(k, axis_idx, pivot):
    s = np.eye(4); s[axis_idx, axis_idx] = k
    return T(pivot) @ s @ T(-np.asarray(pivot, float))


# ------------------------------------------------------------------ door from the firmware trace
@lru_cache(None)
def fw(tier=P.ACT_TIER):
    tr, ev, _ = fw_sim.scenario(tier)
    return tr, ev


def _map_real(t):
    """animation time -> firmware real time (s), piecewise linear on the scenario events."""
    tr, ev = fw()
    a0, a1 = 2.8, 6.8
    c0, c1, c2, c3 = 29.6, 32.0, 34.0, 36.4
    knots_a = [0.0, a0, a1, c0, c1, c2, c3, DURATION]
    knots_r = [ev["open_cmd"] - 0.1, ev["open_cmd"], ev["open_done"], ev["close_cmd"], ev["estop"], ev["estop_release"],
               ev["close_done"], ev["close_done"] + 5]
    return float(np.interp(t, knots_a, knots_r))


def fw_state(t):
    tr, ev = fw()
    rt = _map_real(t)
    i = int(np.clip(np.searchsorted([r["t_s"] for r in tr], rt), 0, len(tr) - 1))
    r = dict(tr[i]); r["real_t_s"] = rt
    return r


def door_lift(t):
    return fw_state(t)["lift_mm"]


# ------------------------------------------------------------------ hens
def hen_path(i, out=True):
    xs = [380, 560, 700, 860]
    inside = (xs[i], P.COOP_Y0 + 520 + 120 * (i % 2), P.FLOOR_TOP_Z)
    at_door_in = (P.XC, P.COOP_Y0 + 150, P.FLOOR_TOP_Z)
    sill = (P.XC, P.COOP_Y0 - 20, P.POP_SILL_Z)
    ramp_len = P.RAMP[1]
    run_ = math.sqrt(ramp_len ** 2 - P.POP_SILL_Z ** 2)
    ramp_bot = (P.XC, P.COOP_Y0 - 3 * P.PLY_WALL - run_ - 80, 0.0)
    spots = [(300, 900, 0), (820, 700, 0), (520, 1250, 0), (950, 1500, 0)]
    pts = [inside, at_door_in, sill, (P.XC, P.COOP_Y0 - 60, P.POP_SILL_Z - 20), ramp_bot, spots[i]]
    return pts if out else pts[::-1]


def along(pts, s):
    pts = np.asarray(pts, float)
    L = np.r_[0, np.cumsum(np.linalg.norm(np.diff(pts, axis=0), axis=1))]
    d = s * L[-1]
    k = int(np.clip(np.searchsorted(L, d) - 1, 0, len(pts) - 2))
    u = (d - L[k]) / max(L[k + 1] - L[k], 1e-9)
    p = pts[k] + u * (pts[k + 1] - pts[k])
    v = pts[k + 1] - pts[k]
    return p, math.degrees(math.atan2(v[1], v[0])) - 90.0


HEN_SCALE = 0.75


def hen_tf(i, t):
    o0, o1 = TL["hens_out"]; i0, i1 = TL["hens_in"]
    st, dur = 0.85 * i, 2.6
    if t < o0 + st:
        p, yaw = along(hen_path(i), 0.0); yaw = -90 + 25 * i
    elif t < o0 + st + dur:
        p, yaw = along(hen_path(i), seg(t, o0 + st, o0 + st + dur))
    elif t < i0 + st:
        p, _ = along(hen_path(i), 1.0); yaw = 30 * math.sin(0.9 * t + i) + 90 * i
        p = p + np.array([40 * math.sin(0.7 * t + i), 30 * math.cos(0.5 * t + 2 * i), 0])
    elif t < i0 + st + dur:
        p, yaw = along(hen_path(i, out=False), seg(t, i0 + st, i0 + st + dur))
    else:
        p, _ = along(hen_path(i, out=False), 1.0); yaw = 90
    if t >= TL["build"][0]:
        return np.diag([1e-4, 1e-4, 1e-4, 1.0]) @ T((0, 0, -5000))
    bob = 6 * abs(math.sin(9 * t + i)) if (o0 + st < t < o0 + st + dur) or (i0 + st < t < i0 + st + dur) else 0
    m = T((p[0], p[1], p[2] + bob)) @ so101.axis_angle((0, 0, 1), math.radians(yaw))
    m[:3, :3] *= HEN_SCALE
    return m


# ------------------------------------------------------------------ arm timelines
PICK_EGG = [e for e in M.egg_positions() if e["id"] == arm.PICK][0]["pos"]
ARM_DUR = {"enter": 1.1, "approach": 1.1, "grasp": 0.9, "grip": 0.6, "lift": 0.8, "cross rim": 0.9, "over basket": 0.9,
           "release": 0.8, "let go": 0.5, "retreat": 0.6, "park": 1.0}


@lru_cache(None)
def arm_keys(cfg):
    cache = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "reports", "CT_COOP_A_showcase_reach.json")
    rep = json.load(open(cache))
    tr = rep[cfg]["traj"]["traj_deg"]
    keys, t = [], TL["pick"][0] + 0.3
    for k, w in enumerate(tr):
        q = {j: math.radians(v) for j, v in w["q"].items()}
        base = np.array(w["base_mm"])
        if k > 0:
            t += ARM_DUR[w["name"]]
        grip = 0.75 if w["name"] in ("approach", "grasp", "release", "retreat", "park", "enter") else 0.2
        if w["name"] == "grasp":
            keys.append((t, q, base, 0.75, w["name"])); t += ARM_DUR["grip"]
            keys.append((t, q, base, 0.2, "grip")); continue
        if w["name"] == "release":
            keys.append((t, q, base, 0.2, w["name"])); t += ARM_DUR["let go"]
            keys.append((t, q, base, 0.75, "let go")); continue
        keys.append((t, q, base, grip, w["name"]))
    return keys


def arm_state(cfg, t):
    K = arm_keys(cfg)
    if t <= K[0][0]:
        k0 = k1 = K[0]; s = 0.0
    elif t >= K[-1][0]:
        k0 = k1 = K[-1]; s = 0.0
    else:
        j = max(i for i in range(len(K)) if K[i][0] <= t)
        k0, k1 = K[j], K[j + 1]
        s = ease((t - k0[0]) / (k1[0] - k0[0]))
    q = {n: (1 - s) * k0[1][n] + s * k1[1][n] for n in so101.ARM_JOINTS}
    q["gripper"] = (1 - s) * k0[3] + s * k1[3]
    base = (1 - s) * k0[2] + s * k1[2]
    return q, base, k0[4]


def arm_links(cfg, t):
    q, base, phase = arm_state(cfg, t)
    B = so101.mount_tf(base, yaw_deg=0.0, inverted=True)
    L = so101.model().fk(q, B)
    out = {}
    for ln, m in L.items():
        mm = m.copy(); mm[:3, 3] *= 1000.0
        out[ln] = mm
    return out, q, base, phase


def egg_world(cfg, t):
    """World position of the picked egg (centre)."""
    rest = np.array(PICK_EGG)
    if cfg == "base":
        a, b = TL["pick"][0] + 2.2, TL["pick"][0] + 3.6
        if t < a:
            return rest, 1.0
        out = rest + np.array([400, 0, 450])
        if t < b:
            return rest + seg(t, a, b) * (out - rest), 1.0
        return out, 0.0
    if cfg == "starter":
        ks = starter_keys()
        tg, tr = ks["grip_t"], ks["release_t"]
        if t < tg:
            return rest, 1.0
        cup = starter_cup(t)
        if t < tr:
            return cup - np.array([0, 0, P.EGG_D / 2]), 1.0
        drop = np.array([P.BASKET_RAIL[0], P.BASKET_RAIL[1], P.BASKET_FLOOR_Z + P.EGG_D / 2 + 2])
        return drop, 1.0
    K = arm_keys(cfg)
    tg = [k[0] for k in K if k[4] == "grip"][0]
    tr = [k[0] for k in K if k[4] == "let go"][0]
    if t < tg:
        return rest, 1.0
    L, q, base, _ = arm_links(cfg, min(t, tr))
    p = (L["gripper_frame_link"][:3, :3] @ np.array([0, 0, 0]) + L["gripper_frame_link"][:3, 3]) - np.array([0, 0, arm.GRASP_DZ])
    if t < tr:
        return p, 1.0
    bx, by = P.BASKET_PLUS
    land = np.array([p[0], p[1], P.BASKET_FLOOR_Z + P.EGG_D / 2 + 2])
    return p + seg(t, tr, tr + 0.25) * (land - p), 1.0


# ------------------------------------------------------------------ starter rail
@lru_cache(None)
def starter_keys():
    t0 = TL["pick"][0] + 0.3
    ey = PICK_EGG[1]
    park_y = P.BASKET_RAIL[1]
    up, down_pick, down_drop = 150.0, (P.EGG_Z + P.EGG_D / 2) - 915.0, (P.BASKET_FLOOR_Z + P.EGG_D + 2) - 915.0
    # (t, y, zoff, vacuum)
    K = [(t0, park_y, up, 0), (t0 + 1.6, ey, up, 0), (t0 + 2.6, ey, down_pick, 0), (t0 + 3.2, ey, down_pick, 1),
         (t0 + 4.2, ey, up, 1), (t0 + 6.0, park_y, up, 1), (t0 + 6.9, park_y, down_drop, 1), (t0 + 7.4, park_y, down_drop, 0),
         (t0 + 8.2, park_y, up, 0)]
    return {"K": K, "grip_t": K[3][0], "release_t": K[7][0] - 0.1}


def _interp_keys(K, t, idx):
    ts = [k[0] for k in K]
    if t <= ts[0]:
        return K[0][idx]
    if t >= ts[-1]:
        return K[-1][idx]
    j = max(i for i in range(len(K)) if ts[i] <= t)
    s = ease((t - ts[j]) / (ts[j + 1] - ts[j]))
    return (1 - s) * K[j][idx] + s * K[j + 1][idx]


def starter_cup(t):
    K = starter_keys()["K"]
    y = _interp_keys(K, t, 1); z = _interp_keys(K, t, 2)
    return np.array([P.ST_RAIL_X, y, 915.0 + z + 25 - 25])


# ------------------------------------------------------------------ build-order explode
EXPLODE_DIR = {0: (0, 0, -1), 1: (0, 0, 1), 2: (0, 0, 1), 3: (-1, 0, 0.4), 4: (0, 0, 1), 5: (0, -1, 0.3), 6: (0, -1, 0.5),
               7: (1, 0, 0.6), 8: (1, 0, 0.4), 9: (0, 1, 0.6), 10: (1, 0.3, 0.8)}


def explode(step, t):
    b0, b1 = TL["build"]
    if t < b0 or t > TL["end"][1]:
        return T()
    out_s = seg(t, b0, b0 + 1.2)
    k0 = b0 + 1.6 + step * 1.55
    in_s = seg(t, k0, k0 + 1.2)
    a = out_s * (1 - in_s)
    d = np.asarray(EXPLODE_DIR.get(step, (0, 0, 1)), float); d /= np.linalg.norm(d)
    return T(d * 1800.0 * a)


def build_caption(t):
    b0, b1 = TL["build"]
    for k in range(len(M.STEPS) - 1, -1, -1):
        if t >= b0 + 1.6 + k * 1.55:
            return k
    return None


# ------------------------------------------------------------------ node transforms
def node_tf(cfg, node, t):
    """Local animation (before explode) for node at time t."""
    lift = door_lift(t)
    a = P.ACT[P.ACT_TIER]
    if node == "pop_door":
        return T((0, 0, lift))
    if node == "act_rod":
        return T((-lift, 0, 0))
    if node == "cord_a":
        xr0 = P.ACT_FIXED_X + a["extended"] - P.ACT_SLACK_AT_CLOSE + 10
        L0 = P.PULLEY_X - xr0
        return S_axis((L0 + lift) / L0, 0, (P.PULLEY_X, P.ACT_Y, P.ACT_Z))
    if node == "cord_c":
        pts = M.cord_geometry(0.0)
        ez, az = pts[3][2], pts[4][2]
        L0 = ez - az
        return S_axis((L0 - lift) / L0, 2, pts[3])
    if node == "cleanout":
        s = seg(t, 22.3, 23.3) * (1 - seg(t, 24.0, 24.9))
        cw = P.CLEANOUT[0]
        return R_axis((0, 0, 1), -P.CLEANOUT_OPEN_DEG * s, (P.COOP_W / 2 - cw / 2, P.COOP_Y1 + P.PLY_WALL, 0))
    if node == "run_door":
        s = seg(t, 9.6, 10.4) * (1 - seg(t, 11.2, 12.0))
        import run_chainlink as RC
        x0, x1, z0, z1, y = RC.gate_geom()
        return R_axis((0, 0, 1), -P.RUN_DOOR_OPEN_DEG * s, (x0 - 25, y, 0))    # walk gate swings out of the run
    if node == "nest_lid":
        s = seg(t, 12.4, 14.0) * (1 - seg(t, 17.0, 18.4))
        return R_axis((0, 1, 0), -P.LID_OPEN_DEG * s * 0.88, (P.NB_X0, 0, P.LID_HINGE_Z))
    if node == "hood_door":
        s = seg(t, 22.3, 23.3) * (1 - seg(t, 24.0, 24.9))
        zh = P.BASKET_FLOOR_Z + 60
        return R_axis((0, 1, 0), 105 * s, (P.HOOD_X1 + 9, 0, P.HOOD_ROOF_Z))
    if node.startswith("hen"):
        return hen_tf(int(node[3]) - 1, t)
    if node == "egg_pick":
        p, vis = egg_world(cfg, t)
        m = T(p - np.array(PICK_EGG))
        if vis < 0.5:
            m = T((0, 0, -5000)) @ np.diag([1e-4, 1e-4, 1e-4, 1])
        return m
    if node == "st_car":
        K = starter_keys()["K"]
        return T((0, _interp_keys(K, t, 1), 0))
    if node == "st_z":
        K = starter_keys()["K"]
        return T((0, _interp_keys(K, t, 1), _interp_keys(K, t, 2)))
    if node == "pro_car":
        _, _, base, _ = arm_links("pro", t)
        return T((0, base[1], 0))
    return T()


def world_tf(cfg, node, step, t):
    return explode(step, t) @ node_tf(cfg, node, t)


def caption(cfg, t):
    st = fw_state(t)
    if t < TL["title"][1]:
        return ""
    if t < TL["open"][1]:
        return "Sunrise: the schedule opens the pop door"
    if t < TL["hens_out"][1]:
        return "Hens head out to the run"
    if t < TL["pick"][1]:
        return {"base": "Egg time: lift the nest-box lid from outside",
                "starter": "Starter: the vacuum picker lifts the egg on a 2-axis rail",
                "plus": "Plus: a LeRobot SO-101 arm picks the egg",
                "pro": "Pro: SO-101 on a short gantry reaches every nest spot"}[cfg]
    if t < TL["collect"][1]:
        return "Collect from outside: no need to step into the coop"
    if t < TL["hens_in"][1]:
        return "Dusk: the hens go back in to roost"
    if t < TL["close"][1]:
        if st["state"] == "estop" or (not st["estop_ok"]):
            return "E-STOP pressed: the door stops and stays put"
        return "The door lowers under its own weight"
    if t < TL["build"][1]:
        k = build_caption(t)
        return "How it goes together" if k is None else f"Step {k + 1}: {M.STEPS[k]}"
    return ""
