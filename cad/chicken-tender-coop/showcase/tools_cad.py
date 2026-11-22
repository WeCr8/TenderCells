"""T6 SLOTTED TROWEL / SCOOP for the SO-101 wrist quick-change (Zach 2026-11-22) + its dock slot + load checks.

Blade 150 x 80 mm (brief ~150 x 100; shrunk to 80 wide by the torque check below), 4 mm PETG-CF print (or heat-formed 4 mm HDPE), slightly dished (12 mm sagitta), 5 x 8 mm
slots so fine bedding sifts through and clumps stay, a 10 mm heel lip, 60 mm neck, standard jaw-clamped tang
(same V + 2 magnets as T1-T5). Used with a plunge -> shovel scoop (wrist flex) -> wrist roll 90-180 deg -> dump
to turn deep litter (aerates, cuts ammonia).

    python tools_cad.py      -> reports/CT_COOP_A_T6_trowel.json  (+ step/CT_T6_trowel.step if export works)

Checks:
  * mass from the build123d volume (PETG-CF, 85 % effective density)
  * dock slot: bbox clearance of T6 at DOCK["slots"]["T6"] vs the other hanging tools, the pop door (open),
    door guides / reeds / actuator, front studs, dock plate, and the X bridge at its front-most pickup position
  * SO-101 joint torques (URDF masses + COMs) at every planned PLUNGE / LIFT pose from clean_reach.py plus
    ASSUMED bedding forces, against 50 % of the 12 V STS3215 stall (2.94 N.m) - the same working limit
    gantry.arm_tool_loads() uses. If the worst joint is over, the blade shrinks (150x100 -> 130x90 -> 120x80).
"""
from __future__ import annotations
import json, math, os, xml.etree.ElementTree as ET
import numpy as np
from build123d import Box, Cylinder, Pos, Rot
import sc_params as P, clean_params as C, so101

ROOT = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..")
G = 9.81
STALL_12V = 2.94
WORK_LIMIT = 0.5 * STALL_12V
# ASSUMED bedding interaction loads (loose pine/hemp deep litter, slotted 4 mm edge, slow moves)
F_PLUNGE_N = 8.0          # axial push-back on the tip while plunging
F_SCOOP_N = C.SCOOP["drag_N"]   # full 150 x 100 blade fully buried; scaled by width x buried length (curl at 70 mm)
T_ROLL_NM = 0.30          # drag torque turning a 100 mm blade 90-180 deg in litter


# ------------------------------------------------------------------ geometry
def t6_local(W=None, BL=None, p=C.T6):
    """T6 in its local frame: tang grasp point at the origin, tool hanging along -Z, blade width along Y
    (edge-on at the dock), dish concave toward +X. Returns the build123d solid."""
    W = W or p["blade_W"]; BL = BL or p["blade_L"]
    tw, tt, th = p["tang"]
    tang = Pos(0, 0, -10 + th / 2) * Box(tw, tt, th)                               # z -10 .. +25 like T1-T5
    z_heel = -10.0 - p["neck_L"]
    neck = Pos(0, 0, -10.0 - p["neck_L"] / 2) * Box(14.0, 10.0, p["neck_L"] + 2)    # 14 x 10 rib
    t, s = p["blade_t"], p["dish_depth"]
    R = ((W / 2) ** 2 + s ** 2) / (2 * s)                                           # dish radius from the sagitta
    # cylinder axis along Z (tool axis), centred at +X R so the arc bottom sits at x = 0 (concave toward +X)
    outer = Pos(R, 0, z_heel - BL / 2) * Cylinder(R, BL)
    inner = Pos(R, 0, z_heel - BL / 2) * Cylinder(R - t, BL + 2)
    window = Pos(s / 2 + 1, 0, z_heel - BL / 2) * Box(s + t + 4, W, BL)
    blade = (outer - inner) & window
    n, sw, sl = (p["slots"] if W == p["blade_W"] else max(3, int(round((W - 16.0) / 12.0)))), p["slot_w"], min(p["slot_L"], BL - 40.0)
    pitch = (W - 16.0) / n
    for i in range(n):
        y = -W / 2 + 8.0 + pitch * (i + 0.5)
        blade = blade - Pos(s / 2, y, z_heel - 15.0 - sl / 2) * Box(s + t + 10, sw, sl)
    lip = Pos(p["lip_h"] / 2 + 1, 0, z_heel - 3.0) * Box(p["lip_h"] + 2, W - 6, 6.0)   # heel lip (holds a clump on the roll)
    tip_bevel = Pos(0, 0, z_heel - BL) * Rot(0, 45, 0) * Box(6, W + 2, 6)            # 45 deg leading-edge chamfer
    head = Pos(-(s + t) / 2, 0, 0) * (blade + lip - tip_bevel)                       # dish centred on the tool axis
    return tang + neck + head


def t6_at_dock(W=None, BL=None):
    x = C.DOCK["slots"]["T6"]
    return Pos(x, P.DOCK["y"] + 32.0, P.DOCK["z_hook"]) * t6_local(W, BL)


def mass(W=None, BL=None):
    sh = t6_local(W, BL)
    v = sh.volume
    m = v * C.T6["rho_petg_cf"] * C.T6["infill"]
    bb = sh.bounding_box()
    com = sh.center()
    return {"volume_cm3": round(v / 1000, 1), "mass_kg_petg_cf": round(m, 3),
            "mass_kg_hdpe_sheet": round(v * C.T6["rho_hdpe"], 3),
            "com_below_grasp_mm": round(-com.Z, 1), "bbox_mm": [round(bb.size.X, 1), round(bb.size.Y, 1), round(bb.size.Z, 1)],
            "tip_below_grasp_mm": round(-bb.min.Z, 1)}


def dock_parts(cfg):
    """SParts for the scene (gantry configs only): T6 hanging in its fork + the right dock-rail extension.
    Wired in by gantry.parts() (2026-11-22)."""
    from sc_model import SPart, box
    if cfg not in P.GANTRY_CFGS:
        return []
    d = P.DOCK; x = C.DOCK["slots"]["T6"]; g = (x, d["y"] + 32.0, d["z_hook"]); c = (cfg,)
    return [SPart("G-DOCK", "dock rail extension x 806..830 (T6 fork)", "dark", 11,
                  box(C.DOCK_RIGHT_RAIL_X0, 830.0, d["y"], d["y"] + 14, d["z_hook"] - 15, d["z_hook"] + 45), configs=c, bom="G-DOCK"),
            SPart("G-DOCK", "dock fork T6 + tool-present reed", "dark", 11,
                  box(x - 18, x + 18, d["y"] + 14, g[1] + 10, d["z_hook"] + 25, d["z_hook"] + 35), configs=c, bom="G-DOCK"),
            SPart("T6", C.TOOLS["T6"][0], "hdpe", 11, t6_at_dock(), node="tool_T6", configs=c, bom="TOOL-T6")]


# ------------------------------------------------------------------ dock slot check
def _bb(shape):
    b = shape.bounding_box(); return np.array([b.min.X, b.max.X, b.min.Y, b.max.Y, b.min.Z, b.max.Z])


def bb_gap(a, b):
    d = [max(b[0] - a[1], a[0] - b[1], 0), max(b[2] - a[3], a[2] - b[3], 0), max(b[4] - a[5], a[4] - b[5], 0)]
    if all(v == 0 for v in d):     # overlap: negative = smallest penetration
        return -min(min(a[1], b[1]) - max(a[0], b[0]), min(a[3], b[3]) - max(a[2], b[2]), min(a[5], b[5]) - max(a[4], b[4]))
    return float(np.linalg.norm(d))


def dock_check():
    import gantry, sc_model as M, house
    me = _bb(t6_at_dock())
    zh = P.DOCK["z_hook"]
    upper = me.copy(); upper[2], upper[3] = P.DOCK["y"] + 32.0 - 7.0, P.DOCK["y"] + 32.0 + 7.0; upper[4] = zh - 10.0 - C.T6["neck_L"]   # tang + neck
    lower = me.copy(); lower[5] = zh - 10.0 - C.T6["neck_L"]                                                                     # blade
    others = {}
    for tid, x in P.DOCK["slots"].items():
        others[f"tool {tid}"] = _bb(gantry.tool_shape(tid, gantry.tool_rest(tid)))
    for sp in M.door_parts()[:1]:                              # pop door, raised to the open reed
        b = _bb(sp.shape); b[4:] += P.DOOR_LIFT; others["pop door (open)"] = b
    for sp in M.door_parts()[1:] + M.door_mechanism():
        if sp.pid in ("P3", "C16", "LATCH"):
            continue
        others[f"{sp.pid} {sp.name}"[:60]] = _bb(sp.shape)
    for sp in house.framing("plus"):
        if sp.pid == "HS" and "front" in sp.name:
            others[f"front stud @x{_bb(sp.shape)[0]:.0f}"] = _bb(sp.shape)
    d = P.DOCK
    others["dock plate (right rail, extended)"] = np.array([C.DOCK_RIGHT_RAIL_X0, 1086.0, d["y"], d["y"] + 14, d["z_hook"] - 15, d["z_hook"] + 45])
    # X bridge at its front-most tool-pickup position (mast at the tang y): bridge +-10, MGN rail and X carriage in front
    by = d["y"] + 32.0 + P.GY_OFF
    others["X bridge + X carriage at pickup"] = np.array([P.GY_RAIL_X[0] - 5, P.GY_RAIL_X[1] + 25, by - 30, by + 10, P.GX_BEAM_Z[0] - 20, P.GX_BEAM_Z[1]])
    gaps = {k: round(min(bb_gap(upper, v), bb_gap(lower, v)), 1) for k, v in others.items()}
    # the fork tang hangs IN the fork on the plate by design: judge the plate against the blade only
    gaps["dock plate (right rail, extended)"] = round(bb_gap(lower, others["dock plate (right rail, extended)"]), 1)
    ok = {k: v for k, v in gaps.items()}
    worst = min(ok, key=ok.get)
    return {"slot_x": C.DOCK["slots"]["T6"], "t6_bbox": [round(v, 1) for v in me], "gaps_mm": dict(sorted(ok.items(), key=lambda kv: kv[1])[:8]),
            "worst": worst, "worst_gap_mm": ok[worst], "collision_free": ok[worst] > 0,
            "note": "bbox gaps, T6 split into tang+neck and blade boxes (conservative). Tang-in-fork contact is intended and excluded. "
                    "The Z block (y gy-30..gy+30) sweeps the tang row, so X moves at the dock row are not allowed for ANY tool: "
                    "the routine approaches a fork in Y only, X travel happens at gy >= GY_WORK_MIN."}


# ------------------------------------------------------------------ SO-101 joint torques
def _coms():
    root = ET.parse(so101.URDF).getroot()
    out = {}
    for l in root.findall("link"):
        o = l.find("inertial/origin"); m = l.find("inertial/mass")
        if m is not None:
            out[l.get("name")] = (float(m.get("value")), np.array([float(v) for v in (o.get("xyz") if o is not None else "0 0 0").split()]))
    return out


def joint_torques(q5, base, tool_m, tool_com_mm, payload_kg, payload_d_mm, F_tip=None, F_blade=None, roll_T=0.0, L=C.T6_LEN):
    """Static joint torques (N.m) for pose q5 on base (4x4, metres): arm gravity (URDF), tool + payload gravity,
    optional external forces (N, world vectors) at the tool tip / blade centre, roll drag torque on wrist_roll."""
    m = so101.model(); coms = _coms()
    q = dict(zip(so101.ARM_JOINTS, q5)); q["gripper"] = 0.35
    Lk = m.fk(q, base)
    T = Lk["gripper_frame_link"]; o = T[:3, 3]; z = T[:3, 2]; x = T[:3, 0]
    loads = []   # (point m, force N)
    for ln, (mm, c) in coms.items():
        if ln in Lk and ln != "base_link":
            loads.append((ln, Lk[ln][:3, :3] @ c + Lk[ln][:3, 3], np.array([0, 0, -mm * G])))
    gvec = np.array([0, 0, -G])
    loads.append(("tool", o + z * tool_com_mm / 1000, tool_m * gvec))
    pc = o + z * payload_d_mm / 1000 + x * (C.T6["dish_depth"] / 2000)
    if payload_kg:
        loads.append(("payload", pc, payload_kg * gvec))
    if F_tip is not None:
        loads.append(("tip force", o + z * L / 1000, np.asarray(F_tip)))
    if F_blade is not None:
        loads.append(("blade force", pc, np.asarray(F_blade)))
    desc = {}
    def below(link):
        out = {link}; ch = True
        while ch:
            ch = False
            for jn, j in m.joints.items():
                if j["parent"] in out and j["child"] not in out:
                    out.add(j["child"]); ch = True
        return out
    tau = {}
    for jn in so101.ARM_JOINTS:
        j = m.joints[jn]; ch = j["child"]; Tj = Lk[ch]; oj = Tj[:3, 3]; aj = Tj[:3, :3] @ np.asarray(j["axis"])
        sub = below(ch)
        t = 0.0
        for nm, p, F in loads:
            if nm in sub or nm in ("tool", "payload", "tip force", "blade force"):
                t += float(aj @ np.cross(p - oj, F))
        tau[jn] = t
    tau["wrist_roll"] = abs(tau["wrist_roll"]) + roll_T
    return {k: abs(v) for k, v in tau.items()}


def torque_check(reach_json=None, W=None, BL=None):
    import clean_reach as R
    path = reach_json or os.path.join(ROOT, "reports", "CT_COOP_A_clean_reach.json")
    rep = json.load(open(path))
    ms = mass(W, BL)
    tm = ms["mass_kg_petg_cf"] + P.G_MASS["wrist_qc"]
    BLv = BL or C.T6["blade_L"]
    L = ms["tip_below_grasp_mm"]                        # gripper frame (jaw tips) = tang grasp point
    com = ms["com_below_grasp_mm"]
    pd = L - BLv / 2
    Wv = W or C.T6["blade_W"]
    payload = C.BEDDING_LOAD_KG * (Wv * BLv) / (100.0 * 150.0)
    drag = F_SCOOP_N * (Wv / 100.0) * (min(C.SCOOP["curl_depth_mm"], BLv) / 150.0)
    worst = {}
    def upd(case, tau, cell):
        for j, v in tau.items():
            if j not in worst or v > worst[j][0]:
                worst[j] = (v, case, cell)
    for s in rep["solutions"]:
        if not s["ok"]:
            continue
        B = R.base_tf(*s["base"])
        qp = np.array(s["q_plunge"]); ql = np.array(s["q_lift"])
        # plunge: no payload, axial push-back on the tip (opposite the approach axis)
        Lk = so101.model().fk(dict(zip(so101.ARM_JOINTS, qp)) | {"gripper": 0.35}, B); zt = Lk["gripper_frame_link"][:3, 2]
        upd("plunge (8 N push-back)", joint_torques(qp, B, tm, com, 0.0, pd, F_tip=-F_PLUNGE_N * zt), (s["x"], s["y"]))
        # lift: loaded blade, scoop drag across the blade (both signs), then the roll with drag torque
        Lk = so101.model().fk(dict(zip(so101.ARM_JOINTS, ql)) | {"gripper": 0.35}, B); xt = Lk["gripper_frame_link"][:3, 0]
        for sg in (1, -1):
            upd(f"curl/lift loaded ({payload:.2f} kg) + curl drag {drag:.1f} N", joint_torques(ql, B, tm, com, payload, pd, F_blade=sg * drag * xt), (s["x"], s["y"]))
        upd(f"lift loaded, no drag", joint_torques(ql, B, tm, com, payload, pd), (s["x"], s["y"]))
        ql_roll = ql.copy(); ql_roll[4] = ql[4] + math.radians(C.MIX["roll_deg"])
        upd("roll 135 deg loaded (drag torque)", joint_torques(ql_roll, B, tm, com, payload, pd, roll_T=T_ROLL_NM * Wv / 100.0), (s["x"], s["y"]))
    # reference: arm straight out horizontal (worst lever, not a planned pose), loaded
    q0 = np.zeros(5); B0 = so101.mount_tf((0, 0, 0), 0, inverted=True)
    ref = joint_torques(q0, B0, tm, com, payload, pd)
    out = {j: {"worst_Nm": round(v[0], 3), "case": v[1], "cell_xy": [round(c, 1) for c in v[2]],
               "margin_vs_50pct_stall": round(WORK_LIMIT / max(v[0], 1e-6), 2), "margin_vs_stall": round(STALL_12V / max(v[0], 1e-6), 2)}
           for j, v in worst.items()}
    wj = min(out, key=lambda k: out[k]["margin_vs_50pct_stall"])
    qc_moment = (tm * (com / 1000) + C.BEDDING_LOAD_KG * pd / 1000) * G * math.sin(math.radians(75))
    return {"blade_mm": [BLv, Wv], "tool_mass_kg": round(tm, 3), "payload_kg": round(payload, 3), "curl_drag_N": round(drag, 2), "tool_len_mm": round(L, 1),
            "joints": out, "worst_joint": wj, "worst_margin_vs_50pct_stall": out[wj]["margin_vs_50pct_stall"],
            "pass": bool(WORK_LIMIT / worst[wj][0] >= 1.0),
            "reference_full_horizontal_reach_loaded_Nm": {k: round(v, 3) for k, v in ref.items()},
            "reference_note": "arm straight out horizontally is NOT a planned pose (the routine only plunges near-vertical and lifts at 35-75 deg); "
                              "shown so the limit is visible: shoulder_lift there vs 1.47 N.m working limit",
            "qc_tang_moment_Nm_at_75deg_loaded": round(qc_moment, 3),
            "assumptions": f"STS3215 12 V stall {STALL_12V} N.m, working limit 50 %; plunge {F_PLUNGE_N} N, scoop {F_SCOOP_N} N, roll {T_ROLL_NM} N.m; "
                           f"bedding {C.BEDDING_LOAD_KG} kg on the full blade (scaled by area) at the blade centre; curl at {C.SCOOP['curl_depth_mm']} mm buried; PETG-CF {C.T6['rho_petg_cf'] * 1e6:.2f} g/cc x {C.T6['infill']} (ASSUMED)"}


def size_blade():
    """Full-size blade first; shrink only if the worst planned joint is over the working limit."""
    tries = []
    # shrink the WIDTH first (keeps the tool length, so the reach poses + plunge depth stay valid); payload and curl
    # drag scale with the blade
    for BL, W in ((150.0, 100.0), (150.0, 90.0), (150.0, 80.0), (150.0, 70.0), (150.0, 60.0)):
        r = torque_check(W=W, BL=BL); tries.append(r)
        if r["pass"]:
            return r, tries
    return tries[-1], tries


def export_step(path):
    try:
        from build123d import export_step as ex
        ex(t6_local(), path); return path
    except Exception as e:      # noqa
        return f"export failed: {e}"


if __name__ == "__main__":
    ms = mass()
    dk = dock_check()
    chosen, tries = size_blade()
    os.makedirs(os.path.join(ROOT, "step"), exist_ok=True)
    stp = export_step(os.path.join(ROOT, "step", "CT_T6_trowel.step"))
    rep = {"T6": C.TOOLS["T6"][0], "geometry": C.T6, "mass": ms, "dock": dk, "torque": chosen,
           "tries": [{"blade_mm": t["blade_mm"], "worst_joint": t["worst_joint"], "margin": t["worst_margin_vs_50pct_stall"]} for t in tries],
           "step": stp}
    json.dump(rep, open(os.path.join(ROOT, "reports", "CT_COOP_A_T6_trowel.json"), "w"), indent=1, default=float)
    print(json.dumps({"mass": ms, "dock_worst": (dk["worst"], dk["worst_gap_mm"]), "torque_worst": (chosen["worst_joint"], chosen["joints"][chosen["worst_joint"]]),
                      "tries": rep["tries"], "step": stp}, indent=1, default=float))
