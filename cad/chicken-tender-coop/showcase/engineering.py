"""Engineering hand-calcs for the showcase -> reports/CT_COOP_A_showcase_engineering.json (+ printed table).
Every input not taken from PR #188 / the build guide is ASSUMED in sc_params.py."""
import json, math, os
import numpy as np
import sc_params as P, sc_model as M, so101

G = 9.81
ROOT = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..")


def door():
    w, h = P.DOOR_PANEL
    vol = w * h * P.DOOR_T * 1e-9
    m = vol * P.WOOD_DENSITY + 0.03                       # + anchor + magnet (ASSUMED 30 g)
    W = m * G
    Fg = P.GUIDE_MU * P.GUIDE_SIDE_LOAD_N
    cap = math.exp(P.CORD_EYE_MU * math.pi / 2)            # 90 deg over the cord eye
    T_act = (W + Fg) * cap / P.SHEAVE_EFF                  # 180 deg turnaround sheave
    # worst case: wet ply +20 %, mu_eye 0.25, guide side load 5 N
    W_w = (vol * P.WOOD_DENSITY * 1.2 + 0.03) * G
    T_w = (W_w + P.GUIDE_MU * 5.0) * math.exp(0.25 * math.pi / 2) / P.SHEAVE_EFF
    out = {"door_mass_kg": round(m, 3), "door_weight_N": round(W, 2), "guide_friction_N": round(Fg, 2),
           "lift_tension_at_actuator_N": round(T_act, 1), "lift_tension_worst_wet_N": round(T_w, 1),
           "hw_yaml_load_estimate_N": 15, "gravity_close_net_down_N": round(W - Fg, 2),
           "gravity_close_net_down_worst_N": round(W_w - P.GUIDE_MU * 5.0, 2),
           "door_under_1kg_rule": m < 1.0}
    acts = {}
    for tier, a in P.ACT.items():
        F_at = lambda I: a["force_N"] * max(0.0, I - a["i_noload"]) / (a["i_rated"] - a["i_noload"])
        I_load = a["i_noload"] + (a["i_rated"] - a["i_noload"]) * T_w / a["force_N"]
        acts[tier] = {"rated_force_N": a["force_N"], "SF_rated_vs_worst": round(a["force_N"] / T_w, 1),
                      "force_at_2A_driver_limit_N_est": round(F_at(P.DRV_I_LIMIT), 0),
                      "force_at_1.8A_fw_trip_N_est": round(F_at(P.FW_OVERCURRENT), 0),
                      "current_at_worst_load_A_est": round(I_load, 2), "margin_below_trip_A": round(P.FW_OVERCURRENT - I_load, 2),
                      "stroke_mm": a["stroke"], "stroke_used_mm": P.DOOR_LIFT + P.ACT_SLACK_AT_CLOSE,
                      "open_time_s": round((P.DOOR_LIFT + P.ACT_SLACK_AT_CLOSE) / a["speed_noload"], 1),
                      "timeout_s": P.FW_TRAVEL_TIMEOUT_S, "extended_mm": a["extended"], "retracted_mm": a["retracted"]}
    out["actuators"] = acts
    clear = P.DOOR_LIFT - P.DOOR_BOTTOM_OVERLAP
    out["clear_opening_mm"] = {"with_1/2in_overlap_and_280_lift": round(clear, 1), "opening_11in": round(P.POP_DOOR[1], 1),
                               "lift_needed_for_full_11in_with_overlap": round(P.POP_DOOR[1] + P.DOOR_BOTTOM_OVERLAP, 1)}
    # cord
    pts_c = M.cord_geometry(0.0)
    Lc = sum(float(np.linalg.norm(np.subtract(b, a))) for a, b in zip(pts_c, pts_c[1:]))
    knots = 2 * 80.0
    out["cord"] = {"path_closed_mm": round(Lc), "with_knots_and_tails_mm": round(Lc + knots), "bom_length_mm": 1000,
                   "bom_ok": Lc + knots <= 1000, "break_N_assumed": P.CORD_BREAK_N,
                   "SF_worst_load": round(P.CORD_BREAK_N / T_w, 0),
                   "SF_at_2A_stall_pull": round(P.CORD_BREAK_N / max(a["force_N"] * (P.DRV_I_LIMIT - a["i_noload"]) / (a["i_rated"] - a["i_noload"]) for a in P.ACT.values()), 1),
                   "sheave_D_over_d": round(P.PULLEY_D / P.CORD_D, 1)}
    # cord vs actuator clearance (the return leg passes the rod end)
    a = P.ACT[P.ACT_TIER]
    xr_closed = P.ACT_FIXED_X + a["extended"] - P.ACT_SLACK_AT_CLOSE
    ex, ey, ez = P.CORD_EYE
    # return leg from the sheave far side to the eye, distance from the rod-end clevis at its closed (max x) position
    p0 = np.array([P.PULLEY_X, P.ACT_Y + P.PULLEY_D / 2, P.ACT_Z]); p1 = np.array([ex, ey, ez])
    c = np.array([xr_closed, P.ACT_Y, P.ACT_Z])
    tpar = np.clip(np.dot(c - p0, p1 - p0) / np.dot(p1 - p0, p1 - p0), 0, 1)
    out["cord_return_leg_to_rod_end_mm"] = round(float(np.linalg.norm(p0 + tpar * (p1 - p0) - c)) - a["rod_d"] / 2 - 10, 1)
    out["drop_energy_if_cord_breaks_J"] = round(m * G * P.DOOR_LIFT / 1000, 2)
    out["direct_pull_fits"] = {"needed_eye_to_fixed_clevis_mm": a["extended"] + 40,
                               "available_mm": round(P.XC - (P.T2 + P.W2)), "fits": a["extended"] + 40 <= P.XC - (P.T2 + P.W2)}
    return out


def arm_payload():
    m = so101.model()
    q = {k: 0.0 for k in so101.ARM_JOINTS}
    L = m.fk(q)                    # zero pose: arm straight out, the worst lever for shoulder_lift
    ax = L["upper_arm_link"][:3, 3]
    tq = 0.0
    for ln in ("upper_arm_link", "lower_arm_link", "wrist_link", "gripper_link", "moving_jaw_so101_v1_link"):
        tq += m.links[ln]["mass"] * G * abs(L[ln][0, 3] - ax[0])
    tip = L["gripper_frame_link"][:3, 3]
    egg = P.EGG_MASS_G[2] / 1000 * G * abs(tip[0] - ax[0])
    stall = {"STS3215 12 V (30 kg.cm)": 2.94, "STS3215 7.4 V (19.5 kg.cm)": 1.91}
    grip_lever = 0.05                                       # ASSUMED jaw lever arm
    hold = P.EGG_MASS_G[2] / 1000 * (G + 5.0) / (2 * 0.5) * 2.0  # 2 jaws, mu 0.5 silicone, a 5 m/s2, SF 2
    return {"shoulder_lift_static_Nm_arm": round(tq, 3), "egg_70g_Nm": round(egg, 3), "total_Nm": round(tq + egg, 3),
            "lever_mm": round(float(tip[0] - ax[0]) * 1000, 1),
            "SF_vs_stall": {k: round(v / (tq + egg), 1) for k, v in stall.items()},
            "egg_share_of_load_pct": round(100 * egg / (tq + egg), 1),
            "grip_normal_force_needed_N": round(hold, 2), "grip_force_cap_N": 6.0, "egg_break_N": P.EGG_BREAK_N,
            "jaw_torque_limit_Nm": round(6.0 * grip_lever, 2), "jaw_torque_limit_pct_of_12V_stall": round(100 * 6.0 * grip_lever / 2.94, 0)}


def vacuum():
    A = math.pi * (P.ST_CUP_D / 2000) ** 2
    F = P.ST_VAC_KPA * 1000 * A
    need = P.EGG_MASS_G[2] / 1000 * (G + 2.0) * 2.0
    return {"cup_D_mm": P.ST_CUP_D, "vacuum_kPa": P.ST_VAC_KPA, "theoretical_hold_N": round(F, 2),
            "derated_hold_N (x0.5 curved shell / leak)": round(F * 0.5, 2), "needed_N (70 g, a 2 m/s2, SF 2)": round(need, 2),
            "SF_after_derate": round(F * 0.5 / need * 2.0, 1), "shell_load_vs_break": f"{F:.1f} N spread over the cup vs {P.EGG_BREAK_N} N equatorial point load",
            "cup_fits_egg": P.ST_CUP_D < P.EGG_D * 0.6}


if __name__ == "__main__":
    rep = {"door": door(), "arm": arm_payload(), "vacuum": vacuum()}
    json.dump(rep, open(os.path.join(ROOT, "reports", "CT_COOP_A_showcase_engineering.json"), "w"), indent=1, default=str)
    print(json.dumps(rep, indent=1, default=str))
