"""CT72 rev A1.2 - nest-box / basket reach (TOP and SIDE approach) + routine sweep clash checks.

Fast numeric checker (numpy). Obstacles = axis-aligned boxes of the real model parts (all A1.2 coop,
frame and roost parts are axis-aligned, so their AABB is exact). The hanging arm is the SO-101 capsule
model from so101_kin (URDF dims); the Starter tool is a rigid vertical vacuum tool; gantry hardware
(plate, adapter, Z carriage plate, tool cam, fixed mast + screw + Z rail) moves with the base.

Outputs reports/reach_<variant>.json and reports/routines_<variant>.json, and ../firmware_cell/ct72_cell_a12.json
(the cell geometry + approach poses + routes the controller firmware loads).

Usage: python reach_routines.py [variant ...]
"""
from __future__ import annotations
import json, math, os, sys, time
import numpy as np
import ct72_params as P
import ct72_model as M
import so101_kin as K
from checks import bbox

OUT = os.path.join(M.HERE, "..", "reports")
CLEAR_MIN = 10.0          # mm free space required after capsule radii / box sizes
EXCLUDE = ("TC_GUARD_PANEL", "TC_DOOR_", "TC_CONTROL_BOX", "TC_DOOR_CTRL", "TC_COMPUTE_BOX", "TC_ESTOP", "TC_UR_CONTROL",
           "TC_WATCH_", "TC_TELEOP", "TC_MOD_POOP_BIN", "TC_CAM_BRACKET", "TC_CAM_NODE", "TC_EGG_BASKET", "TC_GUARD_DOOR")
SUPPORT = ("_LINER", "_FLOOR", "TC_BASKET_POCKET_FLOOR", "BASKET_INNER_FLOOR")


def obstacles(roost, lid, variant):
    """Static obstacle boxes [(name, (x0,y0,z0,x1,y1,z1), is_support)]."""
    obs = []
    for p in M.assemble(variant, with_arm=False, roost=roost, lid=lid):
        if p.group is not None or p.name.startswith(EXCLUDE) or p.layer in ("guarding",):
            continue
        b = bbox(p.shape)
        obs.append((p.name, b, p.name.endswith(SUPPORT) or p.name.startswith(SUPPORT)))
    # the egg basket as a hollow wire basket: 4 rim walls + floor (it is removable, so it is not in the static list)
    bx0, bx1, by0, by1, bz0, bz1 = M.basket_bounds()
    x0, x1, y0, y1, z0, z1 = bx0 + 10, bx0 + 260, by0 + 15, by0 + 215, bz0, bz0 + 120
    w = 4.0
    obs += [("BASKET_RIM_XMIN", (x0, y0, z0, x0 + w, y1, z1), False), ("BASKET_RIM_XMAX", (x1 - w, y0, z0, x1, y1, z1), False),
            ("BASKET_RIM_YMIN", (x0, y0, z0, x1, y0 + w, z1), False), ("BASKET_RIM_YMAX", (x0, y1 - w, z0, x1, y1, z1), False),
            ("BASKET_INNER_FLOOR", (x0, y0, z0, x1, y1, z0 + 5), True)]
    return obs


def gantry_boxes(bx, by, bz, variant):
    """Moving gantry hardware boxes for a tool/arm base at (bx,by,bz) (bz = adapter underside)."""
    t = P.ADAPTER_RINGS[variant][1]
    pz = bz + t
    gx = bx - P.BASE_X_OFF[variant]
    pxc = gx + P.ARM_BASE_X_OFF
    bxs = [("PLATE", (pxc - 125, by - 125, pz, pxc + 125, by + 125, pz + P.ZPLATE_T)),
           ("Z_PLATE", (gx - 117, by - 60, pz, gx - 107, by + 60, pz + 150)),
           ("CAM_TOOL", (gx - 157, by + 70, pz + 60, gx - 127, by + 110, pz + 100)),
           ("MAST", (gx - 81, by - 20, P.MAST_Z0, gx - 41, by + 20, P.Z_BRIDGE1)),
           ("Z_SCREW", (gx - 103, by + 24, P.PZ_MIN, gx - 95, by + 32, P.Z_BRIDGE1)),
           ("Z_RAIL", (gx - 91, by - 7.5, P.PZ_MIN, gx - 81, by + 7.5, P.Z_BRIDGE1))]
    if variant == "starter":
        bxs += [("OUTRIGGER", (bx - 30, by - 30, pz - 12, pxc - 75, by + 30, pz)),
                ("PLUNGER", (bx - 25, by - 25, bz - 60, bx + 25, by + 25, bz))]
    return bxs


def box_box_gap(a, b):
    """Separation between two AABBs (negative = overlap depth along the least axis)."""
    d = [max(a[i] - b[i + 3], b[i] - a[i + 3]) for i in range(3)]
    return max(d) if max(d) > 0 else max(d)


def seg_points(p0, p1, step=8.0):
    n = max(2, int(np.linalg.norm(np.asarray(p1) - np.asarray(p0)) / step) + 1)
    t = np.linspace(0, 1, n)[:, None]
    return np.asarray(p0) * (1 - t) + np.asarray(p1) * t


def pts_box_dist(pts, b):
    lo = np.array(b[:3]); hi = np.array(b[3:])
    d = np.maximum(np.maximum(lo - pts, 0), pts - hi)
    out = np.linalg.norm(d, axis=1)
    inside = np.all((pts >= lo) & (pts <= hi), axis=1)
    out[inside] = -1.0
    return out


def arm_clearance(pts, obs, gboxes, ignore_support_for_grip=True):
    """Min clearance (mm) of the SO-101 capsules vs static obstacles and the gantry's own hardware."""
    best = (1e9, None)
    caps = K.capsules(pts)
    for p0, p1, r, nm in caps:
        sp = seg_points(p0, p1)
        for on, b, sup in obs:
            if sup and nm == "gripper+egg" and ignore_support_for_grip:
                continue
            c = float(pts_box_dist(sp, b).min()) - r
            if c < best[0]:
                best = (c, f"{nm} vs {on}")
        if nm != "base+shoulder":
            for gn, b in gboxes:
                if gn in ("PLATE",):
                    continue
                c = float(pts_box_dist(sp, b).min()) - r
                if c < best[0]:
                    best = (c, f"{nm} vs gantry {gn}")
    return best


def gantry_clearance(gboxes, obs):
    best = (1e9, None)
    for gn, gb in gboxes:
        for on, b, sup in obs:
            g = box_box_gap(gb, b)
            if g < best[0]:
                best = (g, f"gantry {gn} vs {on}")
    return best


def base_ok(bx, by, bz, variant):
    t = P.ADAPTER_RINGS[variant][1]
    gx = bx - P.BASE_X_OFF[variant]
    pz = bz + t
    return (P.GX_MIN - 1e-6 <= gx <= P.GX_MAX + 1e-6 and P.GY_MIN - 1e-6 <= by <= P.GY_MAX + 1e-6
            and P.PZ_MIN - 1e-6 <= pz <= P.PZ_MAX + 1e-6)


def nearby(obs, c, r=650.0):
    return [o for o in obs if box_box_gap(o[1], (c[0] - r, c[1] - r, c[2] - r, c[0] + r, c[1] + r, c[2] + r)) < 0]


# ----------------------------------------------------------------------------- reach (one target, one approach)
def _gantry_arrays(base, variant):
    """Vectorised gantry_boxes: base (N,3) -> (N,G,6)."""
    t = P.ADAPTER_RINGS[variant][1]
    bx, by, bz = base[:, 0], base[:, 1], base[:, 2]
    pz = bz + t
    gx = bx - P.BASE_X_OFF[variant]
    pxc = gx + P.ARM_BASE_X_OFF
    z0 = np.zeros_like(bx)
    G = [(pxc - 125, by - 125, pz, pxc + 125, by + 125, pz + P.ZPLATE_T),
         (gx - 117, by - 60, pz, gx - 107, by + 60, pz + 150),
         (gx - 157, by + 70, pz + 60, gx - 127, by + 110, pz + 100),
         (gx - 81, by - 20, z0 + P.MAST_Z0, gx - 41, by + 20, z0 + P.Z_BRIDGE1),
         (gx - 103, by + 24, z0 + P.PZ_MIN, gx - 95, by + 32, z0 + P.Z_BRIDGE1),
         (gx - 91, by - 7.5, z0 + P.PZ_MIN, gx - 81, by + 7.5, z0 + P.Z_BRIDGE1)]
    names = ["PLATE", "Z_PLATE", "CAM_TOOL", "MAST", "Z_SCREW", "Z_RAIL"]
    return np.stack([np.stack(g, -1) for g in G], 1), names


def _box_gap_v(A, B):
    """A (...,6) vs B (M,6) -> (..., M) separation (neg = overlap)."""
    a = A[..., None, :]
    d0 = np.maximum(a[..., 0] - B[:, 3], B[:, 0] - a[..., 3])
    d1 = np.maximum(a[..., 1] - B[:, 4], B[:, 1] - a[..., 4])
    d2 = np.maximum(a[..., 2] - B[:, 5], B[:, 2] - a[..., 5])
    return np.maximum(np.maximum(d0, d1), d2)


def _pts_box_v(Pts, B):
    """Pts (N,K,3) vs B (M,6) -> (N,K,M) distance (neg inside)."""
    lo = B[:, :3]; hi = B[:, 3:]
    p = Pts[..., None, :]
    d = np.maximum(np.maximum(lo - p, 0), p - hi)
    out = np.linalg.norm(d, axis=-1)
    inside = np.all((p >= lo) & (p <= hi), axis=-1)
    return np.where(inside, -1.0, out)


def solve_so101(target, approach, obs, variant):
    """Search the SO-101 + gantry redundancy for a collision-free pose reaching target with the approach
    constraint. TOP: tool within 15 deg of straight down (any pan). SIDE: tool pointing -X (into a LEFT-wall
    box from the aisle), 20-70 deg below horizontal, pan 160-200 deg. Vectorised; returns the max-clearance
    solution, or the closest failed attempt."""
    T = np.asarray(target, float)
    lo = nearby(obs, T, 750.0)
    OB = np.array([o[1] for o in lo]); SUP = np.array([o[2] for o in lo]); ON = [o[0] for o in lo]
    if approach == "top":
        pans = np.arange(0, 360, 30.0); tool_th = [0.0, 8.0, 15.0]
    else:
        pans = np.array([160.0, 170.0, 180.0, 190.0, 200.0]); tool_th = [20.0, 30.0, 40.0, 50.0, 60.0, 70.0]
    th1 = np.arange(-100, 100.1, 4.0); q3 = np.arange(-97, 97.1, 4.0)
    PN, TT, A, B = [x.ravel() for x in np.meshgrid(pans, tool_th, th1, q3, indexing="ij")]
    q4 = TT - A - B
    ok = (q4 >= K.LIM["wrist"][0]) & (q4 <= K.LIM["wrist"][1])
    PN, TT, A, B, q4 = PN[ok], TT[ok], A[ok], B[ok], q4[ok]
    f = K.batch_fk(PN, A, B, q4)
    base = T[None, :] - f["tip"]
    t = P.ADAPTER_RINGS[variant][1]
    gx = base[:, 0] - P.BASE_X_OFF[variant]; pz = base[:, 2] + t
    ok = ((gx >= P.GX_MIN) & (gx <= P.GX_MAX) & (base[:, 1] >= P.GY_MIN) & (base[:, 1] <= P.GY_MAX)
          & (pz >= P.PZ_MIN) & (pz <= P.PZ_MAX))
    if not ok.any():
        return {"ok": False, "clear": None, "why": "no pose inside joint + gantry travel limits"}
    PN, TT, A, B, q4, base = PN[ok], TT[ok], A[ok], B[ok], q4[ok], base[ok]
    fw = {k: v[ok] + base for k, v in f.items()}
    GA, gnames = _gantry_arrays(base, variant)
    gg = _box_gap_v(GA, OB)                              # (N,G,M)
    gmin = gg.min(axis=(1, 2))
    # arm capsules
    segs = [("base", "shoulder", K.RADII["base"], "base+shoulder"), ("shoulder", "elbow", K.RADII["upper"], "upper_arm"),
            ("elbow", "wrist", K.RADII["fore"], "forearm")]
    cmin = np.full(len(base), 1e9); cwhy = np.array([""] * len(base), dtype=object)
    def cap(p0, p1, r, nm, ignore_sup):
        nonlocal cmin, cwhy
        ts = np.linspace(0, 1, 12)[None, :, None]
        pts = p0[:, None, :] * (1 - ts) + p1[:, None, :] * ts
        d = _pts_box_v(pts, OB).min(axis=1) - r            # (N,M)
        if ignore_sup:
            d = np.where(SUP[None, :], 1e9, d)
        m = d.min(axis=1); a = d.argmin(axis=1)
        upd = m < cmin
        cmin = np.where(upd, m, cmin)
        cwhy[upd] = [f"{nm} vs {ON[k]}" for k in a[upd]]
        # gantry self (mast/Z plate) for distal links
        if nm != "base+shoulder":
            dg = _pts_box_v(pts.reshape(len(base), -1, 3)[:, :, None, :].reshape(-1, 1, 3), np.zeros((0, 6))) if False else None
    for a0, a1, r, nm in segs:
        cap(fw[a0], fw[a1], r, nm, False)
    wmid = fw["wrist"] + 0.4 * (fw["tip"] - fw["wrist"])
    cap(fw["wrist"], wmid, K.RADII["wrist"], "wrist", False)
    cap(wmid, fw["tip"], K.RADII["grip"], "gripper+egg", True)
    # distal links vs own mast / Z plate (index 1, 3, 4, 5)
    for a0, a1, r, nm in [("elbow", "wrist", K.RADII["fore"], "forearm"), ("shoulder", "elbow", K.RADII["upper"], "upper_arm")]:
        ts = np.linspace(0, 1, 12)[None, :, None]
        pts = fw[a0][:, None, :] * (1 - ts) + fw[a1][:, None, :] * ts
        for gi in (1, 3, 4, 5):
            gb = GA[:, gi, :]
            lo_ = gb[:, None, :3]; hi_ = gb[:, None, 3:]
            dd = np.linalg.norm(np.maximum(np.maximum(lo_ - pts, 0), pts - hi_), axis=-1).min(axis=1) - r
            upd = dd < cmin
            cmin = np.where(upd, dd, cmin); cwhy[upd] = f"{nm} vs gantry {gnames[gi]}"
    tot = np.minimum(gmin, cmin)
    order = np.argsort(-tot)
    cands, seen = [], set()
    for kk in order[:4000]:
        if tot[kk] < CLEAR_MIN or len(cands) >= 25:
            break
        key = (int(PN[kk]) // 30, int(A[kk]) // 20, int(B[kk]) // 20)
        if key in seen:
            continue
        seen.add(key)
        cands.append({"clear": round(float(tot[kk]), 1), "pose_deg": [float(PN[kk]), float(A[kk]), float(B[kk]), float(q4[kk])],
                      "gantry_gx_gy_pz": [round(float(base[kk, 0] - P.BASE_X_OFF[variant]), 1), round(float(base[kk, 1]), 1),
                                          round(float(base[kk, 2] + t), 1)]})
    k = int(np.argmax(tot))
    if gmin[k] <= cmin[k]:
        gi, mi = np.unravel_index(int(gg[k].argmin()), gg[k].shape)
        why = f"gantry {gnames[gi]} vs {ON[mi]}"
    else:
        why = cwhy[k]
    return {"ok": bool(tot[k] >= CLEAR_MIN), "clear": round(float(tot[k]), 1), "limit": why,
            "poses_tested": int(len(base)), "poses_clear": int((tot >= CLEAR_MIN).sum()),
            "pose_deg": [float(PN[k]), round(float(A[k]), 1), round(float(B[k]), 1), round(float(q4[k]), 1)],
            "base_mm": [round(float(v), 1) for v in base[k]],
            "gantry_gx_gy_pz": [round(float(base[k, 0] - P.BASE_X_OFF[variant]), 1), round(float(base[k, 1]), 1),
                                round(float(base[k, 2] + t), 1)],
            "tool_from_down_deg": float(TT[k]), "candidates": cands}


def solve_starter(target, approach, obs):
    """Rigid vertical vacuum tool: TOP only, cup touches the egg top (target + EGG_R)."""
    if approach != "top":
        return {"ok": False, "clear": None, "why": "Starter vacuum tool is vertical-only: no SIDE approach (by design)"}
    T = np.asarray(target, float)
    bz = T[2] + P.EGG_R + P.STARTER_TOOL_LEN
    bx, by = T[0], T[1]
    if not base_ok(bx, by, bz, "starter"):
        gx = bx - P.BASE_X_OFF["starter"]
        return {"ok": False, "clear": None, "why": f"outside gantry travel (gx {gx:.0f} vs {P.GX_MIN:.0f}-{P.GX_MAX:.0f}, by {by:.0f}, pz {bz + 10:.0f})"}
    lo = nearby(obs, T, 700.0)
    gb = gantry_boxes(bx, by, bz, "starter")
    gc = gantry_clearance(gb, lo)
    # tube + cup as a capsule from the plunger bottom to the cup
    sp = seg_points((bx, by, bz - 60), (bx, by, T[2] + P.EGG_R))
    tc = (1e9, None)
    for on, b, sup in lo:
        if sup:
            continue
        c = float(pts_box_dist(sp, b).min()) - P.VAC_CUP_D / 2
        if c < tc[0]:
            tc = (c, f"vacuum tool vs {on}")
    c = float(min(gc[0], tc[0]))
    return {"ok": bool(c >= CLEAR_MIN), "clear": round(c, 1), "limit": gc[1] if gc[0] < tc[0] else tc[1],
            "base_mm": [round(float(v), 1) for v in (bx, by, bz)],
            "gantry_gx_gy_pz": [round(float(bx - P.BASE_X_OFF["starter"]), 1), round(float(by), 1), round(float(bz + 10), 1)]}


def egg_targets_box(i, inset=45.0):
    x0, x1, y0, y1, z0, z1 = M.nest_box_bounds(i)
    z = z0 + P.EGG_R
    xs = (x0 + inset, (x0 + x1) / 2, x1 - inset); ys = (y0 + inset, (y0 + y1) / 2, y1 - inset)
    names = {(0, 0): "wall-front", (0, 2): "wall-back", (1, 1): "centre", (2, 0): "aisle-front", (2, 2): "aisle-back"}
    return [(n, (xs[a], ys[b], z)) for (a, b), n in names.items()]


def basket_targets(inset=55.0):
    x0, y0, z0 = M.basket_bounds()[0] + 10, M.basket_bounds()[2] + 15, M.basket_bounds()[4]
    x1, y1 = x0 + 250, y0 + 200
    z = z0 + 5 + P.EGG_R + 5
    return [("centre", ((x0 + x1) / 2, (y0 + y1) / 2, z)), ("wall-side", (x0 + inset, (y0 + y1) / 2, z)),
            ("aisle-side", (x1 - inset, (y0 + y1) / 2, z))]


def reach(variant):
    obs = obstacles("stowed", "open", variant)
    res = {"variant": variant, "lid": "open", "roost": "stowed", "boxes": {}, "basket": {}}
    solver = (lambda t, a: solve_starter(t, a, obs)) if variant == "starter" else (lambda t, a: solve_so101(t, a, obs, variant))
    for i in range(P.NEST_BOX_COUNT):
        rb = {}
        for n, t in egg_targets_box(i):
            rb[n] = {"target_mm": [round(v, 1) for v in t], "top": solver(t, "top"), "side": solver(t, "side")}
        res["boxes"][f"NEST_BOX_{i + 1:02d}"] = rb
    for n, t in basket_targets():
        res["basket"][n] = {"target_mm": [round(v, 1) for v in t], "top": solver(t, "top"), "side": solver(t, "side")}
    return res


# ----------------------------------------------------------------------------- routine sweeps
def transit_z(variant):
    """Plate height for gantry transit with the arm folded (or tool) - as high as practical below PARK."""
    return P.PZ_MAX - 150.0


def arm_points_transit(bx, by, bz, variant):
    if variant == "starter":
        return None
    return K.fk((bx, by, bz), *K.folded_pose())


def sweep_clear(path_g, variant, obs, step=25.0):
    """path_g = list of (gx, gy, pz) gantry waypoints with the arm folded between them. Returns worst hit."""
    t = P.ADAPTER_RINGS[variant][1]
    worst = (1e9, None, None)
    for a, b in zip(path_g[:-1], path_g[1:]):
        a = np.asarray(a, float); b = np.asarray(b, float)
        n = max(2, int(np.linalg.norm(b - a) / step) + 1)
        for s in np.linspace(0, 1, n):
            g = a * (1 - s) + b * s
            bx, by, bz = g[0] + P.BASE_X_OFF[variant], g[1], g[2] - t
            gb = gantry_boxes(bx, by, bz, variant)
            lo = nearby(obs, (bx, by, bz - 200), 900.0)
            gc = gantry_clearance(gb, lo)
            c, why = gc
            if variant == "starter":
                sp = seg_points((bx, by, bz - 60), (bx, by, bz - P.STARTER_TOOL_LEN))
                for on, bb, sup in lo:
                    d = float(pts_box_dist(sp, bb).min()) - P.VAC_CUP_D / 2
                    if d < c:
                        c, why = d, f"vacuum tool vs {on}"
            else:
                ac = arm_clearance(arm_points_transit(bx, by, bz, variant), lo, gb, ignore_support_for_grip=False)
                if ac[0] < c:
                    c, why = ac
            if c < worst[0]:
                worst = (round(float(c), 1), why, [round(float(v)) for v in g])
    return worst


def _clear_at(g, q, variant, obs, ignore_sup=False):
    t = P.ADAPTER_RINGS[variant][1]
    bx, by, bz = g[0] + P.BASE_X_OFF[variant], g[1], g[2] - t
    gb = gantry_boxes(bx, by, bz, variant)
    lo = nearby(obs, (bx, by, bz - 250), 950.0)
    c, why = gantry_clearance(gb, lo)
    if variant == "starter":
        sp = seg_points((bx, by, bz - 60), (bx, by, bz - P.STARTER_TOOL_LEN))
        for on, bb, sup in lo:
            if sup and ignore_sup:
                continue
            d = float(pts_box_dist(sp, bb).min()) - P.VAC_CUP_D / 2
            if d < c:
                c, why = d, f"vacuum tool vs {on}"
    else:
        ac = arm_clearance(K.fk((bx, by, bz), *q), lo, gb, ignore_support_for_grip=ignore_sup)
        if ac[0] < c:
            c, why = ac
    return float(c), why


def approach_sweep(g_hi, g_lo, pose_lo, variant, obs, n=24, back=100.0):
    """Approach in three checked phases (the gantry's redundancy keeps the arm still on the final approach):
      1 at transit height above the pre-pick point: arm unfolds folded -> pick pose (joint interpolation)
      2 gantry descends vertically to the pre-pick point (arm frozen in the pick pose)
      3 gantry translates along the tool axis by `back` mm to the pick point (straight-line insertion)
    Retreat is the same path reversed. Returns (worst clearance, limiting pair, gantry xyz, phase)."""
    g_lo = np.asarray(g_lo, float)
    if variant == "starter" or not pose_lo:
        d = np.array([0, 0, -1.0]); q1 = None
    else:
        q1 = np.array(pose_lo, float)
        d = K.fk((0, 0, 0), *q1)["tool_dir"]
    pre = g_lo - d * back
    hi = np.array([pre[0], pre[1], g_hi[2]])
    worst = (1e9, None, None, None)
    def upd(c, why, g, ph):
        nonlocal worst
        if c < worst[0]:
            worst = (round(c, 1), why, [round(float(v)) for v in g], ph)
    if q1 is not None:
        q0 = np.array(K.folded_pose(), float)
        dp = (q1[0] - q0[0] + 180) % 360 - 180
        q1u = q1.copy(); q1u[0] = q0[0] + dp
        for a in np.linspace(0, 1, n):
            c, why = _clear_at(hi, q0 * (1 - a) + q1u * a, variant, obs)
            upd(c, why, hi, "unfold@transit")
    for a in np.linspace(0, 1, n):
        g = hi * (1 - a) + pre * a
        c, why = _clear_at(g, q1, variant, obs)
        upd(c, why, g, "descend")
    for a in np.linspace(0, 1, n):
        g = pre * (1 - a) + g_lo * a
        c, why = _clear_at(g, q1, variant, obs, ignore_sup=a > 0.7)   # last 30 mm: soft fingers meet the pad
        upd(c, why, g, "insert")
    ok_pre = (P.GX_MIN <= pre[0] <= P.GX_MAX and P.GY_MIN <= pre[1] <= P.GY_MAX and P.PZ_MIN <= pre[2] <= P.PZ_MAX)
    if not ok_pre:
        worst = (-999.0, "pre-pick point outside gantry travel", [round(float(v)) for v in pre], "pre")
    return worst


def egg_route(variant, reach_res, obs):
    """Egg routine plan: PARK -> transit -> for each box: chosen approach (top preferred, else side) ->
    pick -> retreat -> basket place (top preferred, else side) -> retreat -> ... -> PARK.
    Returns transit route (folded arm) + per-box approach sweep results."""
    tz = transit_z(variant)
    park = (P.PARK["gx"], P.PARK["gy"], P.PARK["pz"])
    route = [park, (park[0], park[1], tz)]
    plan = []
    bt = reach_res["basket"]["centre"]
    for name, rb in reach_res["boxes"].items():
        for tname in ("centre",):
            c = rb[tname]
            order = [("top", c["top"]), ("side", c["side"])]
            chosen = None
            for appr, sol in order:
                if not sol.get("ok"):
                    continue
                for cand in [sol] + sol.get("candidates", []):
                    g = cand["gantry_gx_gy_pz"]
                    w = approach_sweep((g[0], g[1], tz), g, cand.get("pose_deg"), variant, obs)
                    if w[0] >= CLEAR_MIN:
                        chosen = (appr, cand, w); break
                if chosen:
                    break
            entry = {"box": name, "target": tname}
            if chosen:
                appr, sol, w = chosen
                g = sol["gantry_gx_gy_pz"]
                route += [(g[0], g[1], tz)]
                entry.update({"approach": appr, "pick_gantry": g, "pick_pose_deg": sol.get("pose_deg"), "approach_sweep": w})
            else:
                entry.update({"approach": None, "why": "neither TOP nor SIDE approach sweep clear"})
            # basket place
            pchosen = None
            for appr, sol in (("top", bt["top"]), ("side", bt["side"])):
                if not sol.get("ok"):
                    continue
                for cand in [sol] + sol.get("candidates", []):
                    g = cand["gantry_gx_gy_pz"]
                    w = approach_sweep((g[0], g[1], tz), g, cand.get("pose_deg"), variant, obs)
                    if w[0] >= CLEAR_MIN:
                        pchosen = (appr, cand, w); break
                if pchosen:
                    break
            if pchosen:
                appr, sol, w = pchosen
                g = sol["gantry_gx_gy_pz"]
                route += [(g[0], g[1], tz)]
                entry.update({"place_approach": appr, "place_gantry": g, "place_pose_deg": sol.get("pose_deg"), "place_sweep": w})
            else:
                entry.update({"place_approach": None})
            plan.append(entry)
    route += [(park[0], park[1], tz), park]
    return route, plan


def clean_route(variant):
    """Boustrophedon gantry pass over the bed at the variant's cleaning height (arm folded for the sweep check;
    the tool/rake pose is checked at each lane's lowest point separately)."""
    pz = {"starter": P.PZ_MIN, "plus": 912.0, "pro": 912.0, "pro_heavy": 1300.0}[variant]
    xs = np.arange(P.GX_MIN + 60, P.GX_MAX - 20, 150.0)
    route = [(P.PARK["gx"], P.PARK["gy"], P.PARK["pz"]), (P.PARK["gx"], P.PARK["gy"], pz)]
    flip = False
    for x in xs[::-1]:
        ys = (P.GY_MAX, P.GY_MIN) if not flip else (P.GY_MIN, P.GY_MAX)
        route += [(float(x), ys[0], pz), (float(x), ys[1], pz)]
        flip = not flip
    last = route[-1]
    route += [(last[0], last[1], P.PZ_MAX - 150.0), (P.PARK["gx"], P.PARK["gy"], P.PZ_MAX - 150.0), (P.PARK["gx"], P.PARK["gy"], P.PARK["pz"])]
    return route, pz


def zone_filter(route, variant, obs, step=50.0):
    """Split every segment into 50 mm pieces; keep clear pieces (cleaning coverage), the rest become firmware
    no-go spans. Returns (kept pieces, cut pieces with the hit)."""
    keep, cut = [], []
    for a, b in zip(route[:-1], route[1:]):
        a = np.asarray(a, float); b = np.asarray(b, float)
        n = max(1, int(np.linalg.norm(b - a) / step))
        for k in range(n):
            p0 = a + (b - a) * k / n; p1 = a + (b - a) * (k + 1) / n
            w = sweep_clear([tuple(p0), tuple(p1)], variant, obs, step=step)
            (keep if w[0] >= CLEAR_MIN else cut).append((tuple(p0), tuple(p1), w))
    return keep, cut


def _merge(pieces):
    out = []
    for a, b, w in pieces:
        if out and np.allclose(out[-1][1], a):
            out[-1] = (out[-1][0], b, w if w[0] < out[-1][2][0] else out[-1][2])
        else:
            out.append((a, b, w))
    return out


def routines(variant, reach_res):
    out = {"variant": variant}
    obs_open_s = obstacles("stowed", "open", variant)
    egg, plan = egg_route(variant, reach_res, obs_open_s)
    out["egg_plan"] = plan
    # approach-path feasibility for every target x approach (first clear candidate)
    tz = transit_z(variant)
    per = {}
    for grp, items in list(reach_res["boxes"].items()) + [("BASKET", reach_res["basket"])]:
        for tname, tt in items.items():
            for appr in ("top", "side"):
                sol = tt[appr]; res = None
                if sol.get("ok"):
                    for cand in [sol] + sol.get("candidates", []):
                        g = cand["gantry_gx_gy_pz"]
                        w = approach_sweep((g[0], g[1], tz), g, cand.get("pose_deg"), variant, obs_open_s)
                        if w[0] >= CLEAR_MIN:
                            res = {"ok": True, "clear": w[0], "gantry": g, "pose_deg": cand.get("pose_deg")}; break
                    if res is None:
                        res = {"ok": False, "why": "final pose reachable but no candidate with a clear approach path", "best": w}
                else:
                    res = {"ok": False, "why": sol.get("why") or f"no clear final pose (best {sol.get('clear')} mm: {sol.get('limit')})"}
                per[f"{grp}/{tname}/{appr}"] = res
    out["approach_paths"] = per
    out["egg_route_transit_gantry"] = [[round(float(v), 1) for v in p] for p in egg]
    out["egg_transit_sweep_stowed"] = sweep_clear(egg, variant, obs_open_s)
    obs_open_d = obstacles("deployed", "open", variant)
    out["egg_transit_sweep_deployed"] = sweep_clear(egg, variant, obs_open_d)
    out["egg_approach_sweeps_deployed"] = []
    for e in plan:
        if e.get("approach"):
            g = e["pick_gantry"]
            out["egg_approach_sweeps_deployed"].append([e["box"], approach_sweep((g[0], g[1], transit_z(variant)), g, e.get("pick_pose_deg"), variant, obs_open_d)])
    cr, pz = clean_route(variant)
    out["clean_plate_z"] = pz
    obs_s = obstacles("stowed", "closed", variant)
    keep, cut = zone_filter(cr, variant, obs_s)
    tot = sum(np.linalg.norm(np.subtract(b, a)) for a, b, _ in keep + cut)
    out["clean_path_mm_total"] = round(float(tot))
    out["clean_path_kept_pct_stowed"] = round(100.0 * sum(np.linalg.norm(np.subtract(b, a)) for a, b, _ in keep) / tot, 1)
    out["clean_nogo_spans_stowed"] = [{"from": [round(float(v)) for v in a], "to": [round(float(v)) for v in b], "hit": w[1], "clear": w[0]}
                                      for a, b, w in _merge(cut)]
    obs_d = obstacles("deployed", "closed", variant)
    hit_d = []
    for a, b, w0 in keep:
        w = sweep_clear([a, b], variant, obs_d, step=50.0)
        if w[0] < CLEAR_MIN:
            hit_d.append((a, b, w))
    out["clean_kept_path_blocked_if_roost_deployed_pct"] = round(100.0 * sum(np.linalg.norm(np.subtract(b, a)) for a, b, _ in hit_d) / tot, 1)
    out["clean_blocked_spans_if_deployed"] = [{"from": [round(float(v)) for v in a], "to": [round(float(v)) for v in b], "hit": w[1], "clear": w[0]}
                                              for a, b, w in _merge(hit_d)]
    out["clean_min_clear_stowed_kept"] = min((w[0] for _, _, w in keep), default=None)
    return out


def summary_line(r):
    def cnt(d, ap):
        return sum(1 for t in d.values() if t[ap].get("ok"))
    s = []
    for bn, rb in r["boxes"].items():
        s.append(f"{bn}: top {cnt(rb, 'top')}/{len(rb)} side {cnt(rb, 'side')}/{len(rb)}")
    s.append(f"basket: top {cnt(r['basket'], 'top')}/3 side {cnt(r['basket'], 'side')}/3")
    return "; ".join(s)


if __name__ == "__main__":
    os.makedirs(OUT, exist_ok=True)
    for v in sys.argv[1:] or ["starter", "plus", "pro"]:
        t0 = time.time()
        r = reach(v)
        json.dump(r, open(os.path.join(OUT, f"reach_{v}.json"), "w"), indent=1)
        print(v, "reach:", summary_line(r), round(time.time() - t0), "s", flush=True)
        ro = routines(v, r)
        json.dump(ro, open(os.path.join(OUT, f"routines_{v}.json"), "w"), indent=1)
        print(v, "egg plan", [(e["box"], e.get("approach"), e.get("approach_sweep", [None])[0], e.get("place_approach")) for e in ro["egg_plan"]])
        print(v, "egg transit stowed", ro["egg_transit_sweep_stowed"], "| deployed", ro["egg_transit_sweep_deployed"])
        print(v, "clean kept % (stowed)", ro["clean_path_kept_pct_stowed"], "nogo spans", len(ro["clean_nogo_spans_stowed"]),
              "| blocked if deployed %", ro["clean_kept_path_blocked_if_roost_deployed_pct"], round(time.time() - t0), "s", flush=True)
