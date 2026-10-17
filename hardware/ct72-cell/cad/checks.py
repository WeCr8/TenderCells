"""Interference + envelope/reach checks for the CT72 rev A1 draft. Writes ../reports/checks.json
and ../reports/CHECKS.md. Usage: python checks.py [tier ...]"""
import json, math, os, sys, time
from build123d import Box, Align, Pos
import ct72_params as P
import ct72_model as M

OUT = os.path.join(M.HERE, "..", "reports")
os.makedirs(OUT, exist_ok=True)
TOL = 1.0  # mm^3; touching faces give 0


def bbox(s):
    b = s.bounding_box(optimal=False)
    return (b.min.X, b.min.Y, b.min.Z, b.max.X, b.max.Y, b.max.Z)


def bb_overlap(a, b, eps=0.01):
    return all(a[i] < b[i + 3] - eps and b[i] < a[i + 3] - eps for i in range(3))


def inter_vol(sa, sb, ba=None, bb=None):
    ba = ba or bbox(sa); bb = bb or bbox(sb)
    if not bb_overlap(ba, bb):
        return 0.0
    try:
        return float((sa & sb).volume)
    except Exception:
        return float("nan")


def swept_box(b0, b1):
    lo = [min(b0[i], b1[i]) for i in range(3)]
    hi = [max(b0[i + 3], b1[i + 3]) for i in range(3)]
    return M.box(lo[0], hi[0], lo[1], hi[1], lo[2], hi[2])


def corners():
    for gx in (P.GX_MIN, P.GX_MAX):
        for gy in (P.GY_MIN, P.GY_MAX):
            for pz in (P.PZ_MIN, P.PZ_MAX):
                yield gx, gy, pz


def run(tier):
    t0 = time.time()
    res = {"tier": tier, "static_pairs": [], "moving_vs_static": [], "moving_internal": [], "keepout_rules": [],
           "arm_pose": {}, "reach": {}}
    base = M.assemble(tier, with_arm=False)
    static = [p for p in base if p.group is None]
    sb = [(p, bbox(p.shape)) for p in static]
    # 1 static vs static
    for i in range(len(sb)):
        for j in range(i + 1, len(sb)):
            v = inter_vol(sb[i][0].shape, sb[j][0].shape, sb[i][1], sb[j][1])
            if v > TOL or v != v:
                res["static_pairs"].append([sb[i][0].name, sb[j][0].name, round(v, 1)])
    # 2 moving hardware swept over full travel vs static (box-conservative)
    lo = {p.name: p for p in M.assemble(tier, P.GX_MIN, P.GY_MIN, P.PZ_MIN, with_arm=False) if p.group}
    hi = {p.name: p for p in M.assemble(tier, P.GX_MAX, P.GY_MAX, P.PZ_MAX, with_arm=False) if p.group}
    swept = {n: swept_box(bbox(lo[n].shape), bbox(hi[n].shape)) for n in lo}
    for n, s in swept.items():
        bs = bbox(s)
        for p, b in sb:
            v = inter_vol(s, p.shape, bs, b)
            if v > TOL:
                cond = p.name.startswith("TC_MOD_ROOST_")
                res["moving_vs_static"].append([n, p.name, round(v, 1), "CONDITIONAL: deployable roost, interlocked to PARKED" if cond else "HARD"])
    # 3 moving internal at park and at all 8 travel corners (incl. arm adapter)
    for st in [tuple(P.PARK.values())] + list(corners()):
        mv = [p for p in M.assemble(tier, *st, with_arm=False) if p.group]
        mv += [p for p in M.arm_parts(tier, *st) if p.name.startswith("TC_ROBOT_ADAPTER")]
        mb = [(p, bbox(p.shape)) for p in mv]
        for i in range(len(mb)):
            for j in range(i + 1, len(mb)):
                v = inter_vol(mb[i][0].shape, mb[j][0].shape, mb[i][1], mb[j][1])
                if v > TOL:
                    res["moving_internal"].append([str(tuple(round(x) for x in st)), mb[i][0].name, mb[j][0].name, round(v, 1)])
    # 4 keepout rules (brief section 19)
    E = M.envelopes(tier)
    byname = {p.name: p for p in base}
    hw_static = [p for p in static if not p.name.startswith(("TC_MOD_",))]

    def rule(name, a, b, must_be_zero=True, conditional=""):
        v = inter_vol(a, b)
        ok = (v <= TOL) if must_be_zero else True
        res["keepout_rules"].append({"rule": name, "overlap_mm3": round(v, 1), "pass": bool(ok), "note": conditional})

    rule("ROOST_SWEEP vs ROBOT_KEEPOUT_PARKED (brief 19)", E["BODY_ROOST_SWEEP"], E["BODY_ROBOT_KEEPOUT_PARKED"])
    for cb in ("TC_CONTROL_BOX", "TC_COMPUTE_BOX", "TC_DOOR_CTRL_BOX", "TC_ESTOP_FRONT", "TC_ESTOP_RIGHT", "TC_UR_CONTROL_BOX"):
        if cb in byname:
            rule(f"{cb} vs SERVICE_DOOR_SWING", byname[cb].shape, E["BODY_SERVICE_DOOR_SWING"])
            rule(f"{cb} vs POOP_BIN_SWEEP", byname[cb].shape, E["BODY_POOP_BIN_SWEEP"])
    for w in ("TC_WATCH_MOUNT_PAD", "TC_WATCH_MOUNT_POLE"):
        rule(f"{w} vs SERVICE_DOOR_SWING", byname[w].shape, E["BODY_SERVICE_DOOR_SWING"])
        rule(f"{w} vs TOP guard/roof plane", byname[w].shape, byname["TC_GUARD_PANEL_TOP"].shape)
    for p in hw_static:
        if p.name in ("TC_MOD_POOP_BIN_TRAY",):
            continue
        v = inter_vol(E["BODY_POOP_BIN_SWEEP"], p.shape)
        if v > TOL:
            res["keepout_rules"].append({"rule": f"POOP_BIN_SWEEP vs {p.name}", "overlap_mm3": round(v, 1), "pass": False, "note": ""})
    res["keepout_rules"].append({"rule": "POOP_BIN_SWEEP vs all static hardware (frame rings, posts, guards, electronics)",
                                 "overlap_mm3": 0.0, "pass": not any(r["rule"].startswith("POOP_BIN_SWEEP vs TC_") for r in res["keepout_rules"]), "note": "bin slides out by POOP_BIN_PULL_OUT through the front access cut-out"})
    for p in hw_static:
        if p.layer in ("electronics", "guarding") and p.name not in ("TC_DOOR_SERVICE", "TC_GUARD_PANEL_FRONT"):
            v = inter_vol(E["BODY_SERVICE_DOOR_SWING"], p.shape)
            if v > TOL:
                res["keepout_rules"].append({"rule": f"SERVICE_DOOR_SWING vs {p.name}", "overlap_mm3": round(v, 1), "pass": False, "note": ""})
    cz = E["UTILITY_CABLE_CHAIN_ZONE"]
    hits = [p.name for p in static if inter_vol(cz, p.shape) > TOL] + [n for n, s in swept.items() if inter_vol(cz, s) > TOL]
    res["keepout_rules"].append({"rule": "UTILITY_CABLE_CHAIN_ZONE clear of static parts + swept gantry", "overlap_mm3": 0.0,
                                 "pass": not hits, "note": ", ".join(hits)})
    gantry_low = min(bbox(s)[2] for s in swept.values())
    res["keepout_rules"].append({"rule": "Gantry hardware (no arm) stays above BED_KEEPOUT", "overlap_mm3": 0.0,
                                 "pass": gantry_low >= P.BED_KEEPOUT_Z, "note": f"lowest gantry part {gantry_low:.0f} mm vs BED_KEEPOUT top {P.BED_KEEPOUT_Z:.0f} mm"})
    v = inter_vol(E["BODY_ROOST_SWEEP"], E["BODY_ROBOT_KEEPOUT_WORKING"])
    res["keepout_rules"].append({"rule": "ROOST_SWEEP vs ROBOT_KEEPOUT_WORKING", "overlap_mm3": round(v, 1), "pass": True,
                                 "note": "CONDITIONAL (brief 2.4): roost may deploy only when robot_state==PARKED, homed, motion disabled"})
    # 5 arm pose / reach
    a = P.ARMS[tier]
    bx0, bx1 = P.GX_MIN + P.ARM_BASE_X_OFF, P.GX_MAX + P.ARM_BASE_X_OFF
    by0, by1 = P.GY_MIN, P.GY_MAX
    zb0, zb1 = P.PZ_MIN - a.adapter_t, P.PZ_MAX - a.adapter_t
    r = a.reach
    arm_len = 735.0 if tier == "pro" else a.proxy[1] + a.proxy[3]
    if tier == "pro":
        arm = [p for p in M.arm_parts(tier, *P.PARK.values()) if p.name == "TC_ROBOT_ARM_UR3E"][0]
        ab = bbox(arm.shape)
        arm_len = round(ab[5] - ab[2], 1)
        # real UR3e solid vs static hardware at park and the 8 travel corners (reference pose)
        coll = []
        park = tuple(P.PARK.values())
        arm0 = [p for p in M.arm_parts(tier, *park) if p.name == "TC_ROBOT_ARM_UR3E"][0].shape
        sols = [(s, bbox(s)) for s in arm0.solids()]
        for st in [park] + list(corners()):
            d = (st[0] - park[0], st[1] - park[1], st[2] - park[2])
            for p, b in sb:
                v = 0.0
                for s, s_b in sols:
                    mb = tuple(s_b[i] + d[i % 3] for i in range(6))
                    if bb_overlap(mb, b):
                        v += inter_vol(Pos(*d) * s, p.shape)
                if v > TOL:
                    coll.append([str(tuple(round(x) for x in st)), p.name, round(v, 1)])
        res["arm_pose"]["ur3e_real_step_collisions"] = coll
        res["arm_pose"]["ur3e_bbox_at_park"] = [round(x, 1) for x in ab]
    res["arm_pose"]["arm"] = a.name
    res["arm_pose"]["hanging_length_mm"] = arm_len
    res["arm_pose"]["min_plate_z_straight_pose_above_BED_KEEPOUT_mm"] = round(P.BED_KEEPOUT_Z + arm_len + a.adapter_t, 1)
    res["arm_pose"]["min_plate_z_straight_pose_above_ROBOT_Z0_mm"] = round(P.PLANE_ROBOT_Z0 + arm_len + a.adapter_t, 1)
    res["arm_pose"]["plate_z_travel_mm"] = [round(P.PZ_MIN, 1), round(P.PZ_MAX, 1)]
    # reach envelope (base travel box grown by r) vs frame/footprint
    env = (bx0 - r, by0 - r, zb0 - r, bx1 + r, by1 + r, zb1 + r)
    rr = res["reach"]
    rr["reach_mm"] = r
    rr["base_travel_box_mm"] = [round(v, 1) for v in (bx0, by0, zb0, bx1, by1, zb1)]
    rr["reach_envelope_mm"] = [round(v, 1) for v in env]
    rr["overreach_past_inner_frame_mm"] = {"-X": round(max(0, P.INNER0 - env[0]), 1), "+X": round(max(0, env[3] - P.INNER1X), 1),
                                            "-Y": round(max(0, P.INNER0 - env[1]), 1), "+Y": round(max(0, env[4] - P.INNER1Y), 1),
                                            "floor": round(max(0, 0 - env[2]), 1)}
    rr["overreach_past_72x72_footprint_mm"] = {"-X": round(max(0, 0 - env[0]), 1), "+X": round(max(0, env[3] - P.PLATFORM_X), 1),
                                               "-Y": round(max(0, 0 - env[1]), 1), "+Y": round(max(0, env[4] - P.PLATFORM_Y), 1)}
    # coverage of the ROBOT_KEEPIN floor (PLANE_ROBOT_Z0) and of the bed top, sampled at 20 mm
    def cover(z, rad):
        n = ok = 0
        x = P.SAFE_X0
        while x <= P.SAFE_X1:
            y = P.SAFE_Y0
            while y <= P.SAFE_Y1:
                cx = min(max(x, bx0), bx1); cy = min(max(y, by0), by1); cz = min(max(z, zb0), zb1)
                d = math.sqrt((x - cx) ** 2 + (y - cy) ** 2 + (z - cz) ** 2)
                ok += d <= rad; n += 1
                y += 20
            x += 20
        return round(100.0 * ok / n, 1)
    rr["coverage_pct_SAFE_footprint_at_PLANE_ROBOT_Z0"] = cover(P.PLANE_ROBOT_Z0, r)
    rr["coverage_pct_SAFE_footprint_at_PLANE_ROBOT_TOP"] = cover(P.PLANE_ROBOT_TOP, r)
    if tier == "starter":
        # no-arm Starter: fixed tool on the plate, tool point = base XY, drop STARTER_TOOL_DROP
        tz_low = P.PZ_MIN - a.adapter_t - P.STARTER_TOOL_DROP
        fx = (min(bx1, P.SAFE_X1) - max(bx0, P.SAFE_X0)) * (min(by1, P.SAFE_Y1) - max(by0, P.SAFE_Y0))
        rr["no_arm_tool_point_lowest_z_mm"] = round(tz_low, 1)
        rr["no_arm_tool_reaches_PLANE_ROBOT_Z0"] = tz_low <= P.PLANE_ROBOT_Z0
        rr["no_arm_coverage_pct_SAFE_footprint"] = round(100 * fx / ((P.SAFE_X1 - P.SAFE_X0) * (P.SAFE_Y1 - P.SAFE_Y0)), 1)
    res["seconds"] = round(time.time() - t0, 1)
    return res


if __name__ == "__main__":
    tiers = sys.argv[1:] or list(P.TIERS)
    for t in tiers:
        r = run(t)
        with open(os.path.join(OUT, f"checks_{t}.json"), "w") as f:
            json.dump(r, f, indent=1)
        print(t, "static", len(r["static_pairs"]), "mov/static HARD", sum(x[3] == "HARD" for x in r["moving_vs_static"]), "mov-int", len(r["moving_internal"]),
              "rules-fail", sum(not k["pass"] for k in r["keepout_rules"]), r["seconds"], "s")
