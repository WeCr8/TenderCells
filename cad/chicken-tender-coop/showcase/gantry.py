"""Ceiling GANTRY for Plus/Pro (Zach 2026-11-21 08:36): a 3D-printer-style XYZ gantry under the rafters that carries
the SO-101 inverted on a moving Z mast, a wall tool dock with a jaw-clamped passive quick-change, a mast-mounted
litter tiller, plus the load, deflection, belt, torque and reach checks.

Frame: coop model mm (+X right, +Y toward the coop back, +Z up). Gantry joints are the arm-base position:
    gx = base x, gy = base y (the bridge centre is GY_OFF behind it), gz = base face z (inverted SO-101).
Rest pose for all meshes = park (P.G_PARK); anim.py moves the nodes g_y / g_x / g_z from there.
"""
from __future__ import annotations
import json, math, os
import numpy as np
import sc_params as P
from sc_model import SPart, box, cyl

STEP = 11
CFG = P.GANTRY_CFGS
PX, PY, PZ = P.G_PARK
EXT2040 = (20.0, 40.0)
MGN12 = (12.0, 8.0)


def bridge_y(gy):
    return gy + P.GY_OFF


def base_pos(gx, gy, gz):
    return np.array([gx, gy, gz], float)


# ------------------------------------------------------------------------------------------ parts
def parts(cfg):
    if cfg not in CFG:
        return []
    c = (cfg,)
    S = []
    za, zb = P.GY_RAIL_Z
    ya, yb = P.GY_RAIL_Y
    by = bridge_y(PY)
    for x0, side in ((P.GY_RAIL_X[0], "left"), (P.GY_RAIL_X[1], "right")):
        S.append(SPart("G-YRAIL", f"Y rail {side}: 2040 extrusion + MGN12 rail", "rail", STEP, box(x0, x0 + 20, ya, yb, za, zb), configs=c, bom="G-YRAIL"))
        S.append(SPart("G-YRAIL", f"MGN12 rail {side}", "metal", STEP, box(x0 + 4, x0 + 16, ya, yb, zb, zb + 8), configs=c, bom="G-YRAIL"))
        xm = max(x0 - 11, P.T2 + 0.5)    # left motor clears the SD1 service-door frame plane (x 0..38, service_params)
        S.append(SPart("G-YMOT", f"Y motor NEMA17 {side} (dual Y, auto-squared)", "dark", STEP, box(xm, xm + 42, yb - 50, yb - 8, za - 48, za), configs=c, bom="G-MOT"))
        S.append(SPart("G-BELT", f"GT2 9 mm belt Y {side} + guard", "belt", STEP, box(x0 + 2, x0 + 18, ya + 20, yb - 20, za - 6, za), configs=c, bom="G-BELT"))
        S.append(SPart("G-BG", f"belt guard Y {side} (printed, hens can't peck the belt)", "box", STEP, box(x0 - 2, x0 + 22, ya + 15, yb - 15, za - 14, za - 6), configs=c, bom="G-PRINT", alpha=0.6))
        S.append(SPart("G-LS", f"Y home switch {side} (front)", "estop", STEP, box(x0 + 20, x0 + 30, ya, ya + 12, za + 10, za + 30), configs=c, bom="G-LS"))
        S.append(SPart("G-YCAR", f"Y carriage {side} (MGN12H + plate)", "metal", STEP, box(x0 - 10, x0 + 30, by - 40, by + 40, zb + 8, P.GX_BEAM_Z[0]), node="g_y", configs=c, bom="G-YRAIL"))
    S.append(SPart("G-CHAIN", "Y cable chain tray (left wall)", "chain", STEP, box(5, 40, ya + 30, yb - 30, za + 45, za + 60), configs=c, bom="G-CHAIN"))
    S.append(SPart("G-CHAIN", "Y cable chain loop", "chain", STEP, box(8, 37, by - 200, by, za + 60, za + 85), node="g_y", configs=c, bom="G-CHAIN"))
    # bridge
    z0, z1 = P.GX_BEAM_Z
    xl, xr = P.GY_RAIL_X[0] - 5, P.GY_RAIL_X[1] + 25
    S.append(SPart("G-XBEAM", "X bridge: 2060 extrusion + MGN12 rail (front face)", "rail", STEP, box(xl, xr, by - 10, by + 10, z0, z1), node="g_y", configs=c, bom="G-XBEAM"))
    S.append(SPart("G-XBEAM", "X MGN12 rail", "metal", STEP, box(xl + 30, xr - 30, by - 18, by - 10, z0 + 24, z0 + 36), node="g_y", configs=c, bom="G-XBEAM"))
    S.append(SPart("G-XMOT", "X motor NEMA17 (left end)", "dark", STEP, box(xl + 25, xl + 67, by + 10, by + 52, z0, z0 + 42), node="g_y", configs=c, bom="G-MOT"))
    S.append(SPart("G-BELT", "GT2 9 mm belt X + guard", "belt", STEP, box(xl + 30, xr - 30, by + 10, by + 16, z1 - 20, z1 - 5), node="g_y", configs=c, bom="G-BELT"))
    S.append(SPart("G-BG", "belt guard X (printed)", "box", STEP, box(xl + 30, xr - 30, by + 16, by + 22, z0, z1), node="g_y", configs=c, bom="G-PRINT", alpha=0.6))
    S.append(SPart("G-LS", "X home switch (left)", "estop", STEP, box(xl + 70, xl + 82, by - 30, by - 18, z0 + 20, z0 + 40), node="g_y", configs=c, bom="G-LS"))
    S.append(SPart("G-CHAIN", "X cable chain tray (on the bridge)", "chain", STEP, box(xl + 80, xr - 80, by - 8, by + 8, z1, z1 + 20), node="g_y", configs=c, bom="G-CHAIN"))
    # X carriage + Z block (moves in X)
    my = PY
    S.append(SPart("G-XCAR", "X carriage plate (MGN12H)", "metal", STEP, box(PX - 45, PX + 45, by - 30, by - 18, z0 - 10, z1 + 5), node="g_x", configs=c, bom="G-XBEAM"))
    S.append(SPart("G-ZBLK", "Z block: MGN12H carriages + GT2 omega drive + NEMA17 5:1 planetary + constant-force spring", "dark", STEP,
                   box(PX - 40, PX + 40, my - 30, by - 30, z0 - 20, z1 + 20), node="g_x", configs=c, bom="G-ZAX"))
    S.append(SPart("G-ZMOT", "Z motor NEMA17 + 5:1 planetary", "dark", STEP, box(PX + 40, PX + 82, my - 21, my + 21, z1 - 40, z1 + 30), node="g_x", configs=c, bom="G-MOT"))
    # Z mast (moves in X, Y and Z)
    S.append(SPart("G-ZMAST", f"Z mast: 2040 x {P.GZ_MAST_L:.0f} mm + 2 x MGN12 rails (moving mast)", "rail", STEP,
                   box(PX - 10, PX + 10, my - 20, my + 20, PZ + 30, PZ + P.GZ_MAST_L), node="g_z", configs=c, bom="G-ZAX"))
    S.append(SPart("G-ZMAST", "Z home switch (top) + hard stop", "estop", STEP, box(PX - 10, PX + 10, my + 20, my + 30, PZ + P.GZ_MAST_L - 30, PZ + P.GZ_MAST_L), node="g_z", configs=c, bom="G-LS"))
    S.append(SPart("G-AMNT", "SO-101 base mount plate (inverted)", "metal", STEP, box(PX - 55, PX + 55, my - 55, my + 55, PZ, PZ + 30), node="g_z", configs=c, bom="G-AMNT"))
    # mast tiller (folds up beside the arm base when not in use)
    hx = PX + 70
    S.append(SPart("M1", "litter tiller hinge + fold servo", "dark", STEP, box(hx - 15, hx + 15, my - 20, my + 20, PZ - 10, PZ + 30), node="g_z", configs=c, bom="TILLER"))
    S.append(SPart("M1", "litter tiller gearmotor 12 V 100 rpm", "dark", STEP, cyl((hx, my, PZ), (hx + 90, my, PZ), 18), node="tiller", configs=c, bom="TILLER"))
    for k in range(4):
        a = k * math.pi / 2
        p0 = np.array([hx + 90, my, PZ]); p1 = np.array([hx + 90 + 170, my + 40 * math.cos(a), PZ + 40 * math.sin(a)])
        S.append(SPart("M1", "tiller spiral tine (stainless, 90 mm)", "metal", STEP, cyl(p0 + [10, 0, 0], p1, 4), node="tiller", configs=c, bom="TILLER"))
    S.append(SPart("M1", "tiller shaft", "metal", STEP, cyl((hx + 90, my, PZ), (hx + 270, my, PZ), 6), node="tiller", configs=c, bom="TILLER"))
    S += dock_parts(cfg)
    import tools_cad                       # T6 slotted trowel + its fork + the right dock-rail extension (2026-11-22)
    S += tools_cad.dock_parts(cfg)
    return S


def tool_rest(tid):
    """Tool tang grasp point at the dock (mm) and the tool's long axis (down)."""
    return np.array([P.DOCK["slots"][tid], P.DOCK["y"] + 32.0, P.DOCK["z_hook"]])


def tool_shape(tid, g):
    """Tool geometry around its tang grasp point g, hanging along -Z (rest pose)."""
    x, y, z = g
    L = P.TOOLS[tid][2]
    tang = box(x - 12, x + 12, y - 3, y + 3, z - 10, z + 25)                      # jaw-clamped tang with a 90 deg V + 2 magnets
    shaft = cyl((x, y, z - 10), (x, y, z - L + 20), 5)
    if tid == "T1":
        head = box(x - 100, x + 100, y - 3, y + 3, z - L - 5, z - L + 25) + box(x - 100, x + 100, y - 3, y + 14, z - L - 5, z - L - 1)
    elif tid == "T2":
        head = box(x - 35, x + 35, y - 4, y + 4, z - L + 20, z - L + 30)
        for dx in (-30, 0, 30):
            head = head + cyl((x + dx, y, z - L + 22), (x + dx, y + 20, z - L - 40), 3)
    elif tid == "T3":
        head = box(x - 50, x + 50, y - 15, y + 15, z - L + 10, z - L + 30) + box(x - 48, x + 48, y - 13, y + 13, z - L - 15, z - L + 10)
    elif tid == "T4":
        head = box(x - 35, x + 35, y - 30, y + 30, z - L - 5, z - L + 30) - box(x - 32, x + 32, y - 27, y + 33, z - L - 2, z - L + 31)
    else:
        head = cyl((x, y, z - L + 20), (x, y, z - L - 20), 3)
    return tang + shaft + head


def dock_parts(cfg):
    c = (cfg,)
    S = []
    d = P.DOCK
    for x0, x1, nm in ((140.0, 405.0, "left"), (830.0, 1086.0, "right")):
        S.append(SPart("G-DOCK", f"tool dock rail ({nm} of the pop door), printed forks", "dark", STEP,
                       box(x0, x1, d["y"], d["y"] + 14, d["z_hook"] - 15, d["z_hook"] + 45), configs=c, bom="G-DOCK"))
    for tid, x in d["slots"].items():
        g = tool_rest(tid)
        S.append(SPart("G-DOCK", f"dock fork {tid} + tool-present reed", "dark", STEP, box(x - 18, x + 18, d["y"] + 14, g[1] + 10, d["z_hook"] + 25, d["z_hook"] + 35), configs=c, bom="G-DOCK"))
        S.append(SPart(tid, P.TOOLS[tid][0], "hdpe" if tid != "T5" else "metal", STEP, tool_shape(tid, g), node=f"tool_{tid}", configs=c,
                       bom="TOOLS" if tid != "T5" else "TOOL-T5"))
    return S


# ------------------------------------------------------------------------------------------ loads
G = 9.81


def loads():
    m = P.G_MASS
    tool_max = max(v[1] for k, v in P.TOOLS.items() if k != "M1")
    moving_z = m["so101"] + m["wrist_qc"] + tool_max + m["z_mast"] + m["tiller"] + 0.10          # + 100 g scoop payload
    moving_x = moving_z + m["x_carriage"]
    span = (P.GY_RAIL_X[1] + 20) - P.GY_RAIL_X[0]
    bridge_m = m["bridge_per_m"] * span / 1000 + 2 * m["y_carriage"] + 0.35 + m["cable_chain"]   # + X motor
    moving_y = moving_x + bridge_m
    E = 69e9
    I_2060 = 21.0e-8           # m^4, ~21 cm^4 strong axis (60 vertical), ASSUMED from catalogue class; verify
    I_2040 = 6.9e-8            # m^4 strong axis (40 deep)
    I_2040_weak = 1.8e-8
    L = span / 1000
    P_pt = moving_x * G
    w = m["bridge_per_m"] * G
    d_point = P_pt * L ** 3 / (48 * E * I_2060)
    d_self = 5 * w * L ** 4 / (384 * E * I_2060)
    # Y rails: bolted to wall blocking every 300 mm (ASSUMED) -> treat as 300 mm simply supported spans with half the load
    s_y = 0.30
    d_y = (moving_y * G / 2) * s_y ** 3 / (48 * E * I_2040)
    # mast: cantilever below the Z block at full drop, tiller drag at the tines
    F_till = 40.0                  # N lateral, ASSUMED (spiral tines in loose wet shavings at 20 mm/s)
    L_mast = (P.GZ_TOP - P.GZ_BOTTOM) / 1000 + 0.26 + 0.05
    d_mast = F_till * L_mast ** 3 / (3 * E * I_2040_weak)
    M_block = F_till * L_mast      # moment into the Z block's two MGN12H carriages
    mgn12h_MR = 74.0               # N.m: TWO MGN12 rails on the mast (both 20 mm faces), 2 x MGN12H each, 80 mm apart, ASSUMED class; verify
    # belts + motors
    acc = P.G_SPEED["accel"] / 1000
    r20 = 20 * 2 / (2 * math.pi) / 1000          # GT2 20T pulley pitch radius (m)
    pretension = 30.0              # N per belt, ASSUMED
    belt_work_9mm = 300.0          # N working tension class for 9 mm glass GT2, ASSUMED
    nema17 = 0.45                  # N.m holding torque, 48 mm NEMA17 (ASSUMED class)
    usable = 0.5 * nema17          # usable at 600 rpm (~50 % of holding)
    def axis(name, mass, f_ext, belts):
        F = mass * acc + f_ext + 2.0                      # + 2 N rail/belt friction
        Fb = F / belts
        T_m = Fb * r20
        return {"moving_mass_kg": round(mass, 2), "force_N": round(F, 1), "per_belt_N": round(Fb, 1),
                "belt_tight_side_N": round(pretension + Fb, 1), "belt_SF": round(belt_work_9mm / (pretension + Fb), 1),
                "motor_torque_Nm": round(T_m, 3), "motor_margin": round(usable / max(T_m, 1e-6), 1)}
    ax = {"Y (2 motors, tiller passes run along Y)": axis("Y", moving_y, F_till, 2),
          "X (tines lifted for X step-overs)": axis("X", moving_x, 5.0, 1)}
    # Z: GT2 omega + 5:1 planetary; counterbalance carries the static weight
    Wz = moving_z * G
    cf_spring = 20.0               # N constant-force spring (ASSUMED 2 kg class)
    Fz_dig = 30.0                  # N tines pushing into bedding (ASSUMED)
    Fz = abs(Wz - cf_spring) + Fz_dig + moving_z * acc
    Tz = Fz * r20 / 5 / 0.9
    ax["Z (5:1 planetary)"] = {"moving_mass_kg": round(moving_z, 2), "weight_N": round(Wz, 1), "counterbalance_N": cf_spring,
                               "force_N": round(Fz, 1), "motor_torque_Nm": round(Tz, 3), "motor_margin": round(usable / Tz, 1),
                               "power_off": f"net {Wz - cf_spring:+.1f} N on the mast with power off: the planetary + spring hold it (no free fall)"}
    return {"span_mm": round(span), "bridge_mass_kg": round(bridge_m, 2),
            "bridge_deflection_mm": {"arm_point_load": round(d_point * 1000, 3), "self_weight": round(d_self * 1000, 3),
                                     "total": round((d_point + d_self) * 1000, 3), "limit_L/1000": round(span / 1000, 2)},
            "y_rail_deflection_mm_300mm_spans": round(d_y * 1000, 4),
            "mast": {"lever_m": round(L_mast, 3), "tiller_drag_N": F_till, "tip_deflection_mm": round(d_mast * 1000, 2),
                     "block_moment_Nm": round(M_block, 1), "carriage_pair_moment_Nm": mgn12h_MR, "SF": round(mgn12h_MR / M_block, 1)},
            "axes": ax, "assumptions": "E=69 GPa 6063; 2060 I=21 cm4, 2040 I=6.9/1.8 cm4; GT2 9 mm working 300 N; NEMA17 0.45 N.m; 0.5 m/s2; tiller drag 40 N; all ASSUMED, verify against the chosen listings"}


def arm_tool_loads():
    """SO-101 joint loads with each tool: static shoulder-lift torque at full horizontal reach and the
    tip force the wrist can push at 50 % of the 12 V STS3215 stall (2.94 N.m)."""
    import so101
    m = so101.model()
    q = {k: 0.0 for k in so101.ARM_JOINTS}
    L = m.fk(q)
    ax = L["upper_arm_link"][:3, 3]
    arm = sum(m.links[ln]["mass"] * G * abs(L[ln][0, 3] - ax[0]) for ln in ("upper_arm_link", "lower_arm_link", "wrist_link", "gripper_link", "moving_jaw_so101_v1_link"))
    tip = L["gripper_frame_link"][:3, 3]
    lever = abs(tip[0] - ax[0])
    wf = L["gripper_link"][:3, 3]
    out = {}
    need = {"T0": 1.4, "T1": 6.0, "T2": 5.0, "T3": 2.0, "T4": 4.0, "T5": 1.0}     # N working force, ASSUMED (T2 = light surface levelling only)
    for tid, (nm, mass, tl, mount) in P.TOOLS.items():
        if mount == "mast":
            continue
        payload = 0.07 if tid == "T0" else (0.06 if tid == "T4" else 0.0)
        T = arm + (mass + P.G_MASS["wrist_qc"] + payload) * G * (lever + tl / 1000)
        wrist_arm = 0.10 + tl / 1000                     # wrist_flex axis -> tool tip (gripper ~0.10 m)
        F_tip = 0.5 * 2.94 / wrist_arm
        out[tid] = {"tool": nm, "mass_kg": mass, "length_mm": tl, "shoulder_lift_Nm_full_reach": round(T, 3),
                    "SF_vs_12V_stall": round(2.94 / T, 1), "tip_force_at_50pct_wrist_stall_N": round(F_tip, 1),
                    "working_force_needed_N": need[tid], "force_margin": round(F_tip / need[tid], 1)}
    till = {"tool": P.TOOLS["M1"][0], "note": "full-depth litter turning needs ~40 N lateral + 30 N down: far beyond the SO-101 wrist "
            "(~6-10 N at the tool tip), so the tiller rides on the Z mast and the gantry belts carry the load (see loads())"}
    out["M1"] = till
    return out
