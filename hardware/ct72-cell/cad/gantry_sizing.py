"""Belt-gantry sizing for CT72 rev A1.2 -> ../GANTRY_SIZING.md (+ reports/gantry_sizing.json).

Hand-calc level (draft): moving masses, belt pull vs allowable working tension, motor torque at the
pulley, Z screw thrust and back-drive, bridge sag, universal-plate stress. Inputs marked (est) are
engineering estimates; vendor-data inputs carry their source.
"""
import json, math, os
import ct72_params as P

G = 9.81
ROOT = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..")
SRC = {
    "gt2": "GT2 6 mm allowable working tension ~25 lbf/in width (SDP-SI timing-belt technical section, as quoted on the Prusa forum): 111 N per 25 mm -> 26.7 N (6 mm), 44.5 N (10 mm)",
    "gt2_break": "GT2 fiberglass breaking strength ~86 N per mm width (OnDrives GT2 belt sheet)",
    "htd": "HTD-5M 15 mm: working tension estimated at ~10x GT2-10 (est; check the Gates PowerGrip HTD tables before release)",
    "egg": "Egg failure 34 +/- 6 N equatorial, 41 +/- 8 N polar (ICF11 'Failure mechanisms of hens' eggs'); ~45 N (Sutanto et al., Commun. Phys. 2025)",
    "sts": "STS3215-C047/C018 12 V: stall 2.7 A, 30 kg.cm (Waveshare ST3215 docs); 12 V 5 A PSU browns out under multi-joint load (SO-ARM100 issue #132)",
}
ALLOW = {"GT2-10mm": 44.5, "HTD5M-15mm": 445.0}

# moving masses (kg, est from part volumes/catalogue weights)
M_BRIDGE = 2.4 * (P.PLATFORM_Y - 60) / 1000 + 0.6 + 0.4 + 0.8   # 2080 ~2.4 kg/m + X plates + Y belt/idlers + motor-ish
M_Y = 1.5 * (P.Z_BRIDGE1 - P.MAST_Z0) / 1000 + 0.6 + 0.4 + 0.6   # 4040 mast + Y plate + Z rail + screw
M_Z = 2.7 * 0.25 * 0.25 * 0.0127 * 1000 + 0.6 + 0.4              # universal plate (6061) + Z plate + carriage
ARMS = {"starter": ("vacuum tool", 0.35, 0.07), "plus": ("SO-101", 1.2, 0.25), "pro": ("SO-101", 1.2, 0.25),
        "lite6_on_plate": ("Lite 6 class (optional arm on the plate)", 8.0, 0.6), "pro_heavy": ("UR3e", 11.2, 3.0)}
REACT = {"starter": 0.5, "plus": 3.0, "pro": 3.0, "lite6_on_plate": 15.0, "pro_heavy": 45.0}   # N horizontal arm reaction (est)
ACC = 1.0        # m/s^2 gantry accel (slow, animal-safe); printers run 3-10x this
V = 0.15         # m/s gantry speed cap in routines
FRICTION = {"vwheel": 8.0, "mgn12": 4.0, "mgn15": 5.0}   # N per axis drag (est)


def axis_rows():
    rows = []
    for k, (name, marm, mpay) in ARMS.items():
        var = "pro_heavy" if k == "pro_heavy" else ("plus" if k == "lite6_on_plate" else k)
        belt = P.BELT[var]; guide = P.X_GUIDE[var]
        mz = M_Z + marm + mpay + (1.5 if k == "pro_heavy" else 0)
        my = M_Y + mz + (2.0 if k == "pro_heavy" else 0)
        mx = M_BRIDGE + my + (3.0 if k == "pro_heavy" else 0)
        fx_total = mx * ACC + FRICTION[guide] + REACT[k]
        fx_belt = fx_total / 2                     # dual X belts
        fy_belt = my * ACC + FRICTION[guide] + REACT[k]
        r = P.PULLEY_PD[belt] / 2 / 1000
        tq_x = fx_belt * r; tq_y = fy_belt * r
        motor = "NEMA23 3.0 Nm closed-loop" if var == "pro_heavy" else "NEMA17 0.59 Nm"
        hold = 3.0 if var == "pro_heavy" else 0.59
        usable = 0.45 * hold                          # usable torque at routine speed (est 45% of holding)
        rows.append({"case": k, "arm": name, "arm_kg": marm, "payload_kg": mpay, "belt": belt, "guide": guide,
                     "m_x_kg": round(mx, 1), "m_y_kg": round(my, 1), "m_z_kg": round(mz, 1),
                     "x_belt_pull_N": round(fx_belt, 1), "y_belt_pull_N": round(fy_belt, 1), "belt_allow_N": ALLOW[belt],
                     "x_util": round(fx_belt / ALLOW[belt], 2), "y_util": round(fy_belt / ALLOW[belt], 2),
                     "motor": motor, "x_motor_torque_Nm": round(tq_x, 3), "y_motor_torque_Nm": round(tq_y, 3),
                     "motor_util": round(max(tq_x, tq_y) / usable, 2), "pulley_rpm_at_V": round(V / (math.pi * P.PULLEY_PD[belt] / 1000) * 60)})
    return rows


def z_rows():
    rows = []
    for k, (name, marm, mpay) in ARMS.items():
        mz = M_Z + marm + mpay + (1.5 if k == "pro_heavy" else 0)
        F = mz * (G + ACC) * 1.5 + 20                    # 1.5 dynamic factor + 20 N drag (est)
        if k == "pro_heavy":
            lead, eta, d = 5.0, 0.9, 16.0; motor, hold = "NEMA23 + 24 V brake", 2.0
        else:
            lead, eta, d = 2.0, 0.30, 8.0; motor, hold = "NEMA17 0.59 Nm", 0.59
        T = F * lead / 1000 / (2 * math.pi * eta)
        lam = math.degrees(math.atan(lead / (math.pi * (d - lead / 2))))
        phi = math.degrees(math.atan(0.15))              # brass/POM nut friction mu ~0.15 (est)
        self_lock = lam < phi and k != "pro_heavy"
        rows.append({"case": k, "drive": "SFU1605 ball screw" if k == "pro_heavy" else "Tr8x2 lead screw",
                     "hanging_mass_kg": round(mz, 1), "thrust_N": round(F), "motor": motor, "torque_Nm": round(T, 3),
                     "util": round(T / (0.45 * hold), 2), "lead_angle_deg": round(lam, 1), "friction_angle_deg": round(phi, 1),
                     "holds_unpowered": "yes (self-locking)" if self_lock else "NO -> brake required",
                     "z_speed_mm_s_at_600rpm": round(lead * 600 / 60, 1)})
    return rows


def bridge_sag():
    # 2080 simply supported over ~1.77 m, point load at mid-span = Y stage + Z stage + arm (worst: UR3e)
    E = 69e9; I = 1.06e-7 * 1.0     # 2080 Iy (strong axis, vertical load) ~ 106 cm^4 (typical 20-series 2080 catalogue, est)
    L = (P.PLATFORM_Y - 60) / 1000
    out = {}
    for k, (name, marm, mpay) in ARMS.items():
        F = (M_Y + M_Z + marm + mpay) * G
        out[k] = round(F * L ** 3 / (48 * E * I) * 1000, 2)
    return out


def plate_check():
    # universal plate: UR3e + 3 kg payload at 500 mm with 2x dynamic factor, cantilever from the Z plate edge
    F = (P.PLATE_RATED_ARM_KG + P.PLATE_RATED_PAYLOAD_KG) * G * 2
    M_pay = P.PLATE_RATED_PAYLOAD_KG * G * 0.5 * 2
    M_lever = F * 0.125 + 60.0       # arm weight at 125 mm from the Z-plate edge + 60 Nm UR3e base reaction (est)
    Mtot = M_pay + M_lever
    b, h = 250.0, P.ZPLATE_T
    Zs = b * h ** 2 / 6
    sigma = Mtot * 1000 / Zs
    return {"design_moment_Nm": round(Mtot, 1), "section_modulus_mm3": round(Zs), "bending_stress_MPa": round(sigma, 1),
            "6061_T6_yield_MPa": 276, "safety_factor": round(276 / sigma, 1),
            "bolts": "UR3e ring: 4x M6 8.8 to the grid, each ~10 kN proof (ISO 898-1 class 8.8 M6 proof load ~11.6 kN)"}


def main():
    ax = axis_rows(); zz = z_rows(); sag = bridge_sag(); pl = plate_check()
    json.dump({"axes": ax, "z": zz, "bridge_sag_mm": sag, "plate": pl, "sources": SRC}, open(os.path.join(ROOT, "reports", "gantry_sizing.json"), "w"), indent=1)
    L = ["# CT72 rev A1.2 - belt gantry sizing (draft hand-calc)", "",
         "## Layout choice: Cartesian with dual-motor X (not CoreXY)", "",
         "- **Stiffer at 72 in.** A CoreXY at 1.75 m x 1.75 m needs two ~7.5 m belt loops that both carry every move. Belt stretch scales with length, and the hanging arm's reaction loads go through both long loops. A Cartesian gantry has a ~3.7 m loop per X side and a ~3.4 m loop for Y. The two X sides each carry half the bridge load.",
         "- **Cheaper overall.** It needs one more motor and driver (about $15 + $5), but much less belt: about 11 m of GT2 against about 16 m for CoreXY. It also skips CoreXY's crossed-belt idler stack. And it keeps dual X endstops, so the gantry squares itself on homing.",
         "- **Simpler to build and fault-find.** Each axis moves on its own, so a kid/classroom build can test one axis at a time. Klipper or Marlin both drive dual X with `stepper_x1` and per-side endstops.",
         "- The moving Y motor rides the bridge (+0.35 kg). That is negligible at the slow accelerations an animal enclosure needs.", "",
         f"Assumptions: accel {ACC} m/s^2, routine speed cap {V*1000:.0f} mm/s, usable torque = 45% of holding torque, friction/drag and arm reaction forces estimated (est).", "",
         "## X / Y belts and motors", "",
         "| Case | Arm | Belt | Guide | m_X kg | X pull/belt N | Y pull N | Allow N | Belt util X/Y | Motor | Motor util |",
         "|---|---|---|---|---|---|---|---|---|---|---|"]
    for r in ax:
        L.append(f"| {r['case']} | {r['arm']} ({r['arm_kg']} kg + {r['payload_kg']} kg) | {r['belt']} | {r['guide']} | {r['m_x_kg']} | {r['x_belt_pull_N']} | {r['y_belt_pull_N']} | {r['belt_allow_N']} | {r['x_util']} / {r['y_util']} | {r['motor']} | {r['motor_util']} |")
    L += ["", "Belt util > 1.0 = over the allowable working tension. The GT2-10 belt gantry covers the SO-101 tiers with a large margin. It also covers an 8 kg Lite 6-class arm on the universal plate, with lower margin: tune accel down. **The UR3e needs the stiff variant**: HTD-5M 15 mm or steel-core belts on MGN15/HGR15 rails, NEMA23 closed-loop, and a ball-screw Z with brake. The belt pull alone isn't the reason. A UR3e base reaction (est. 45 N, plus tens of N·m of moment) on a belt-and-V-wheel carriage would make the gantry ring and drift, and the ~15 kg hanging Z mass needs a brake.", "",
         "## Z axis (hanging arm)", "", "| Case | Drive | Hanging kg | Thrust N | Motor | Torque Nm | Util | Lead angle / friction angle | Holds unpowered | Z speed @600 rpm |", "|---|---|---|---|---|---|---|---|---|---|"]
    for r in zz:
        L.append(f"| {r['case']} | {r['drive']} | {r['hanging_mass_kg']} | {r['thrust_N']} | {r['motor']} | {r['torque_Nm']} | {r['util']} | {r['lead_angle_deg']} / {r['friction_angle_deg']} deg | {r['holds_unpowered']} | {r['z_speed_mm_s_at_600rpm']} mm/s |")
    L += ["", f"Screw whip: a Tr8 root ~6.2 mm over ~1.45 m, fixed-supported, has a critical speed of about 550 rpm (Thomson formula n = 4.76e6 x d x 1.55 / L^2, inch units). At 80% that is about 440 rpm, so **Z is capped at 15 mm/s** (Klipper `max_z_velocity`).", "",
          "The belt tiers use a **Tr8x2 lead screw** (self-locking), so the arm can't drop on E-stop or power loss. That matters with birds below. A belt-driven Z would need a brake or counterweight. The trade-off is speed: about 20 mm/s, or about 60 s for full travel. Routines only do short Z moves. pro_heavy uses an SFU1605 ball screw, which is not self-locking, so it gets a 24 V fail-safe brake.", "",
         "## Bridge sag (2080, simply supported, mid-span point load)", "", "| Case | Sag mm |", "|---|---|"]
    for k, v in sag.items():
        L.append(f"| {k} | {v} |")
    L += ["", "2080 strong-axis I taken as ~106 cm^4 (typical 20-series catalogue value; verify for the chosen vendor). If UR3e sag or vibration matters, stiffen the bridge with a 40x80 or a steel flat bar.", "",
          "## Universal robot plate (rated for the heaviest supported arm)", "",
          f"Design case: UR3e {P.PLATE_RATED_ARM_KG} kg + {P.PLATE_RATED_PAYLOAD_KG} kg payload at 500 mm, 2x dynamic factor, plus an estimated 60 N·m base reaction. Moment {pl['design_moment_Nm']} N·m on a 250 x 12.7 mm section: **{pl['bending_stress_MPa']} MPa**, against 276 MPa for 6061-T6 (SF {pl['safety_factor']}). {pl['bolts']}. The plate is not the limit; the gantry is. Adapter rings swap per arm: SO-101 printed ring, vacuum-tool outrigger, UR3e 6061 ring. Each bolts to the same 5x5 M6 grid at 50 mm pitch.", "",
          "## Homing / control", "",
          "- Klipper (preferred) on a BTT SKR Mini E3 V3 (4x TMC2209 UART): X on X, X1 on E, Y, Z. Host is a Pi Zero 2 W (Starter), the Pi 5 (Plus) or the Jetson (Pro), with Moonraker API for the routine controller. pro_heavy uses external closed-loop drivers (step/dir) for the NEMA23s.",
          "- **Mechanical endstops**: X min front + back (Klipper homes each X side to its own switch, so the bridge squares itself), Y min, and Z **max** (Z homes UP, away from birds). Plus/Pro add max-travel switches.",
          "- TMC2209 sensorless homing (StallGuard) is available on X/Y, but not used as the primary homing method. A V-wheel gantry with a hanging load gives a noisy stall signal, so switches are more repeatable. StallGuard stays on as **collision detection** during moves.",
          "- Soft limits + host zone guard: the Klipper `position_min/max` plus host-side no-go zones (nest bank front, basket pocket, roost stow strip) from `ct72_cell_a12.json`.", "",
          "## Sources", ""] + [f"- {v}" for v in SRC.values()]
    open(os.path.join(ROOT, "GANTRY_SIZING.md"), "w").write("\n".join(L) + "\n")
    print(json.dumps({"axes": [(r['case'], r['x_util'], r['y_util'], r['motor_util']) for r in ax], "z": [(r['case'], r['util'], r['holds_unpowered']) for r in zz], "sag": sag, "plate": pl['safety_factor']}))


if __name__ == "__main__":
    main()
