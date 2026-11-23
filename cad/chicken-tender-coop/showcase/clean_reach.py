"""Bed-mixing reach + clearance for the T6 slotted trowel on the Plus/Pro ceiling gantry (3:12 roof, GZ_TRAVEL_MAX 1280).

For every mixing cell (lanes along Y, stepping in X) the gantry places the inverted SO-101 base (gx, gy, gz) and the
arm must reach two tool-tip targets from the SAME base position (no Z move inside a cell):
    PLUNGE  trowel within 12 deg of vertical, tip at the plunge depth (floor guard + wrist-above-bed rule, clean_params.MIX)
    LIFT    after the shovel scoop: trowel tilted 35-75 deg (wrist flex), tip 40 mm above the bedding surface,
            so the loaded blade is clear for the roll / dump
Both poses are then checked for clearance: SO-101 mesh points (decimated URDF STLs, arm.arm_points) + sampled
trowel points vs clean_params.KEEP_OUT boxes (+ margin). Coverage = blade-footprint union over the bed area.
Uses the existing so101 FK/limits and arm meshes; IK here adds the tool-tip offset (so101.ik_fast has none).
-> reports/CT_COOP_A_clean_reach.json
"""
from __future__ import annotations
import json, math, os
import numpy as np
from scipy.optimize import least_squares
import sc_params as P, clean_params as C, so101, arm

ROOT = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..")
DOWN = np.array([0.0, 0.0, -1.0])
CONE = 12.0
LIFT_TILT = (35.0, 75.0)
TOL_MM = 5.0

_B0 = so101.mount_tf((0, 0, 0), 0.0, inverted=True)
_CACHE = {}


def _samples_tip(L):
    if L not in _CACHE:
        S = so101.samples()
        p, z, _ = so101.batch_tool(S, _B0)
        _CACHE[L] = (S, p + L * z, z)
    return _CACHE[L]


def base_tf(gx, gy, gz):
    return so101.mount_tf((gx, gy, gz), 0.0, inverted=True)


def tip_of(q5, base, L):
    p, z, _ = so101.batch_tool(np.asarray(q5)[None], base)
    return p[0] + L * z[0], z[0]


_FEAS = {}
def feasible(target, gpos, L=C.T6_LEN, cone=CONE, tol=12.0, cone_min=0.0):
    """Fast pre-check on the 26^4 sampled grid: any sample within `tol` mm of the tip target, tool tilt in range."""
    S, tipS, zS = _samples_tip(L)
    key = (L, cone, cone_min)
    if key not in _FEAS:
        t = np.degrees(np.arccos(np.clip(zS @ DOWN, -1, 1)))
        _FEAS[key] = (t <= cone + 2.0) & (t >= cone_min - 2.0)
    tgt = np.asarray(target, float) - np.asarray(gpos, float)
    d = np.linalg.norm(tipS[_FEAS[key]] - tgt, axis=1)
    return float(d.min()) <= tol


def ik_tool(target, gpos, L=C.T6_LEN, cone=CONE, prev=None, cone_min=0.0):
    """IK for the tool TIP (gripper frame + L along its approach axis), approach within `cone` of straight down."""
    S, tipS, zS = _samples_tip(L)
    tgt = np.asarray(target, float) - np.asarray(gpos, float)      # base-relative (pure translation, same rotation)
    tilt = np.degrees(np.arccos(np.clip(zS @ DOWN, -1, 1)))
    score = np.linalg.norm(tipS - tgt, axis=1) + 20.0 * (np.maximum(0, tilt - cone) + np.maximum(0, cone_min - tilt))
    seeds = ([np.asarray(prev)] if prev is not None else []) + [S[i] for i in np.argsort(score)[:8]]
    lo, hi = map(np.array, zip(*so101.model().limits()))
    def res(x):
        p, z, _ = so101.batch_tool(x[None], _B0)
        t = math.degrees(math.acos(np.clip(z[0] @ DOWN, -1, 1)))
        return np.concatenate([p[0] + L * z[0] - tgt, [15.0 * (max(0.0, t - cone) + max(0.0, cone_min - t))], [0.3 * x[4]]])
    best = None
    for s in seeds:
        r = least_squares(res, np.clip(s, lo + 1e-6, hi - 1e-6), bounds=(lo, hi), max_nfev=80)
        e = float(np.linalg.norm(r.fun[:3])); sc = e + r.fun[3]
        if best is None or sc < best[0]:
            best = (sc, r.x, e)
        if sc < 1.0:
            break
    p, z, _ = so101.batch_tool(best[1][None], _B0)
    t = math.degrees(math.acos(np.clip(z[0] @ DOWN, -1, 1)))
    return best[1], best[2], t


def tool_points(q5, base, L=C.T6_LEN, W=C.T6["blade_W"], BL=C.T6["blade_L"], roll_extra=0.0):
    """Neck line + blade outline points (mm) for clearance."""
    Lk = so101.model().fk(dict(zip(so101.ARM_JOINTS, q5)) | {"gripper": 0.35}, base)
    T = Lk["gripper_frame_link"]
    R = T[:3, :3]; o = T[:3, 3] * 1000.0
    z = R[:, 2]; x = R[:, 0]; y = R[:, 1]
    if roll_extra:
        c, s = math.cos(roll_extra), math.sin(roll_extra); x, y = c * x + s * y, -s * x + c * y
    pts = [o + z * d for d in np.linspace(0, L - BL, 6)]
    for d in np.linspace(L - BL, L, 6):
        for w in np.linspace(-W / 2, W / 2, 5):
            pts.append(o + z * d + y * w)
    return np.array(pts)


def clearance(points):
    out = {}
    for nm, b in C.KEEP_OUT.items():
        out[nm] = float(arm.box_dist(points, b).min())
    return out


def bed_area():
    x0, x1, y0, y1 = C.TRAY_IN
    return x0, x1, y0, y1


def plunge_tip_z(fill_in=P.BED_FILL_IN):
    top = P.TRAY_FLOOR_TOP + fill_in * P.IN
    z_floor = P.TRAY_FLOOR_TOP + C.MIX["floor_guard"]
    z_wrist = top + C.MIX["wrist_above_bed"] - C.T6_LEN
    return max(z_floor, z_wrist), top


def cells(fill_in=P.BED_FILL_IN, y_max=None):
    """Lane plan: lanes along Y (front -> back), stepping in X; boustrophedon order."""
    x0, x1, y0, y1 = bed_area()
    m = C.MIX["wall_margin"] + C.T6["blade_W"] / 2
    xs = np.arange(x0 + m, x1 - m + 1e-6, C.MIX["lane_pitch"])
    if xs[-1] < x1 - m - 1:
        xs = np.append(xs, x1 - m)
    ym = (y1 if y_max is None else y_max) - C.MIX["wall_margin"] - 20.0
    ys = np.arange(y0 + C.MIX["wall_margin"] + 20.0, ym + 1e-6, C.MIX["cell_pitch"])
    out = []
    for i, x in enumerate(xs):
        for y in (ys if i % 2 == 0 else ys[::-1]):
            out.append((i, float(x), float(y)))
    return out


def base_candidates(x, y):
    """Arm base (gx, gy) around the tip: never straight above it (hard IK), clamped to the gantry work window."""
    cx = (C.TRAY_IN[0] + C.TRAY_IN[1]) / 2
    sx = 1.0 if x < cx else -1.0
    out = []
    for r in (170.0, 220.0, 130.0, 260.0):
        for ang in (0, 45, -45, 90, -90, 135, -135, 180):
            a = math.radians(ang)
            gx = x + sx * r * math.cos(a); gy = y + r * math.sin(a)
            gx = min(max(gx, C.GX_WORK[0]), C.GX_WORK[1]); gy = min(max(gy, C.GY_WORK_MIN), C.GY_WORK_MAX)
            out.append((round(gx, 1), round(gy, 1)))
    seen, uniq = set(), []
    for c in out:
        if c not in seen:
            seen.add(c); uniq.append(c)
    return uniq


_TREES = {}
def _tree(cone, cone_min):
    from scipy.spatial import cKDTree
    k = (cone, cone_min)
    if k not in _TREES:
        S, tipS, zS = _samples_tip(C.T6_LEN)
        t = np.degrees(np.arccos(np.clip(zS @ DOWN, -1, 1)))
        idx = np.nonzero((t <= cone + 2.0) & (t >= cone_min - 2.0))[0]
        _TREES[k] = (cKDTree(tipS[idx]), idx)
    return _TREES[k]


def candidate_bases(x, y, zp, zl, gz_list, step=30.0, tol=12.0):
    """All gantry base positions (grid inside the work window, <= 420 mm from the tip) whose sampled pose set has
    a PLUNGE and a LIFT sample within `tol` of the targets. Sorted: nearest-to-sample first, then lowest motion."""
    gxs = np.arange(C.GX_WORK[0], C.GX_WORK[1] + 1e-6, step)
    gys = np.arange(C.GY_WORK_MIN, C.GY_WORK_MAX + 1e-6, step)
    G = np.array([(gx, gy, gz) for gz in gz_list for gx in gxs for gy in gys if math.hypot(gx - x, gy - y) <= 420.0])
    if not len(G):
        return []
    tp_, ip_ = _tree(CONE, 0.0); tl_, il_ = _tree(*LIFT_TILT[::-1])
    dp, _ = tp_.query(np.array([x, y, zp]) - G)
    dl, jl = tl_.query(np.array([x, y, zl]) - G)
    ok = (dp <= tol) & (dl <= tol)
    G, sc, ql = G[ok], (dp + dl)[ok], il_[jl[ok]]
    o = np.argsort(sc)
    return [(tuple(float(v) for v in G[i]), int(ql[i])) for i in o]


def lift_torque_ratio(q5, g):
    """Worst joint torque / working limit for the loaded LIFT pose with scoop drag (tools_cad loads, full-size T6)."""
    import tools_cad as T
    B = base_tf(*g)
    Lk = so101.model().fk(dict(zip(so101.ARM_JOINTS, q5)) | {"gripper": 0.35}, B); xt = Lk["gripper_frame_link"][:3, 0]
    w = 0.0
    for sg in (1, -1):
        tau = T.joint_torques(np.asarray(q5), B, C.TOOLS["T6"][1] + P.G_MASS["wrist_qc"], C.T6_COM, C.BEDDING_LOAD_KG * C.T6["blade_W"] / 100.0,
                              C.T6_LEN - C.T6["blade_L"] / 2, F_blade=sg * C.SCOOP["drag_N"] * C.T6["blade_W"] / 100.0 * C.SCOOP["curl_depth_mm"] / 150.0 * xt)
        w = max(w, max(tau.values()) / T.WORK_LIMIT)
    return w


def solve_cell(x, y, fill_in=P.BED_FILL_IN, gz_list=(1280.0, 1250.0, 1220.0, 1190.0, 1160.0), max_try=8, screen=40):
    """Torque-aware: screen the first `screen` feasible bases by the loaded-lift torque of their nearest sampled pose,
    then IK + clearance on the `max_try` lowest-torque ones; return the first collision-free one."""
    zp, top = plunge_tip_z(fill_in)
    zl = top + 40.0
    cand = candidate_bases(x, y, zp, zl, gz_list)[:screen]
    S = so101.samples()
    cand = sorted(cand, key=lambda c: lift_torque_ratio(S[c[1]], c[0]))
    for g, _ in cand[:max_try]:
        if True:
            B = base_tf(*g)
            qp, ep, tp = ik_tool((x, y, zp), g)
            if ep > TOL_MM or tp > CONE + 0.5:
                continue
            ql, el, tl = ik_tool((x, y, zl), g, cone=LIFT_TILT[1], cone_min=LIFT_TILT[0])
            if el > TOL_MM or not (LIFT_TILT[0] - 0.5 <= tl <= LIFT_TILT[1] + 0.5):
                continue
            worst = 1e9; where = ""
            for nm, q in (("plunge", qp), ("lift", ql)):
                pts = np.concatenate([arm.arm_points(dict(zip(so101.ARM_JOINTS, q)) | {"gripper": 0.35}, B), tool_points(q, B)])
                cl = clearance(pts)
                k = min(cl, key=cl.get)
                if cl[k] < worst:
                    worst, where = cl[k], f"{nm}: {k}"
            if worst < C.KEEP_OUT_MARGIN:
                continue
            return {"ok": True, "base": g, "q_plunge": qp.tolist(), "q_lift": ql.tolist(), "err_mm": round(max(ep, el), 2),
                    "tilt_plunge_deg": round(tp, 1), "tilt_lift_deg": round(tl, 1), "min_clear_mm": round(worst, 1), "worst": where,
                    "plunge_tip_z": round(zp, 1), "depth_mm": round(top - zp, 1),
                    "lift_torque_ratio_fullsize": round(lift_torque_ratio(ql, g), 2)}
    return {"ok": False}


def coverage(sol, area):
    x0, x1, y0, y1 = area
    gx, gy = np.meshgrid(np.arange(x0, x1, 5.0) + 2.5, np.arange(y0, y1, 5.0) + 2.5)
    cov = np.zeros_like(gx, bool)
    hw, hl = C.T6["blade_W"] / 2, C.MIX["cell_pitch"] / 2 + 10.0      # blade width across the lane; scoop stroke along it
    for s in sol:
        if s["ok"]:
            cov |= (abs(gx - s["x"]) <= hw) & (abs(gy - s["y"]) <= hl)
    return float(cov.mean())


def run(cfg="plus", fill_in=P.BED_FILL_IN):
    # Plus and Pro share the ceiling gantry (GANTRY_CFGS); the bed reach is the same machine for both.
    sol = []
    for lane, x, y in cells(fill_in):
        r = solve_cell(x, y, fill_in); r.update(lane=lane, x=x, y=y); sol.append(r)
    x0, x1, y0, y1 = bed_area()
    open_area = (x0, x1, y0, P.DROP_BOARD["y0"])
    corners = {}
    m = C.MIX["wall_margin"] + C.T6["blade_W"] / 2
    for nm, (cx, cy) in {"front-left": (x0 + m, y0 + m), "front-right": (x1 - m, y0 + m),
                         "back-left (droppings-board edge)": (x0 + m, P.DROP_BOARD["y0"] - 60.0),
                         "back-right (droppings-board edge)": (x1 - m, P.DROP_BOARD["y0"] - 60.0),
                         "back-left (under board, tray end)": (x0 + m, y1 - m), "back-right (under board, tray end)": (x1 - m, y1 - m)}.items():
        r = solve_cell(cx, cy, fill_in); corners[nm] = {"tip_xy": [round(cx, 1), round(cy, 1)], "ok": r["ok"],
                                                        **({k: r[k] for k in ("base", "min_clear_mm", "worst", "depth_mm")} if r["ok"] else {})}
    rep = {"cfg": cfg, "bed_fill_in": fill_in, "gz_travel_max": P.GZ_TRAVEL_MAX, "tool_len_mm": round(C.T6_LEN, 1),
           "gy_work": [round(C.GY_WORK_MIN, 1), round(C.GY_WORK_MAX, 1)], "gx_work": list(C.GX_WORK),
           "cells": len(sol), "cells_ok": sum(s["ok"] for s in sol),
           "coverage_full_bed_pct": round(100 * coverage(sol, (x0, x1, y0, y1)), 1),
           "coverage_open_bed_pct": round(100 * coverage(sol, open_area), 1),
           "bed_area_mm": [round(v, 1) for v in (x0, x1, y0, y1)], "open_bed_y1": P.DROP_BOARD["y0"],
           "corners": corners, "solutions": sol}
    return rep


def run_lanes(lanes, fill_in=P.BED_FILL_IN):
    return [dict(solve_cell(x, y, fill_in), lane=l, x=x, y=y) for l, x, y in cells(fill_in) if l in lanes]


if __name__ == "__main__":
    # python clean_reach.py [fill_in] [lanes a,b,c -> partial cache] | merge
    import sys, pickle
    fill = float(sys.argv[1]) if len(sys.argv) > 1 and sys.argv[1] != "merge" else P.BED_FILL_IN
    cache = os.path.join(ROOT, "reports", f".clean_reach_cache_{fill:.0f}.pkl")
    if len(sys.argv) > 2 and sys.argv[2] != "merge":
        lanes = [int(v) for v in sys.argv[2].split(",")]
        old = pickle.load(open(cache, "rb")) if os.path.exists(cache) else {}
        for r in run_lanes(lanes, fill):
            old[(r["x"], r["y"])] = r
        pickle.dump(old, open(cache, "wb")); print("cached", len(old)); sys.exit(0)
    if len(sys.argv) > 2 and sys.argv[2] == "merge" and os.path.exists(cache):
        _PRE = pickle.load(open(cache, "rb"))
        _orig = solve_cell
        def solve_cell(x, y, fill_in=P.BED_FILL_IN, **kw):   # noqa: F811  (cells come from the cache)
            r = _PRE.get((x, y))
            return {k: v for k, v in r.items() if k not in ("lane", "x", "y")} if r else _orig(x, y, fill_in, **kw)
        globals()["solve_cell"] = solve_cell
    rep = run("plus/pro", fill)
    os.makedirs(os.path.join(ROOT, "reports"), exist_ok=True)
    out = os.path.join(ROOT, "reports", f"CT_COOP_A_clean_reach{'' if fill == P.BED_FILL_IN else '_' + str(int(fill)) + 'in'}.json")
    json.dump(rep, open(out, "w"), indent=1, default=float)
    print({k: v for k, v in rep.items() if k not in ("solutions",)})
