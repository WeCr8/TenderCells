"""Generate ../BOM.csv (one row per item, qty + extended cost per tier) from the model + catalog below.
Prices are rough 2026 street estimates for generic parts (USD, before tax/shipping) - verify before buying."""
import csv, os, collections
import ct72_params as P
import ct72_model as M

ROOT = os.path.join(M.HERE, "..")
park = tuple(P.PARK.values())

# key: (category, description, unit, unit_price_usd, price_basis)
CAT = {
    "EXT_4040": ("Frame", "4040 aluminium extrusion, 20-series V-slot/T-slot, cut to length", "mm", 0.030, "~$30/m generic 4040"),
    "EXT_2040": ("Frame", "2040 aluminium extrusion, 20-series, cut to length", "mm", 0.016, "~$16/m generic 2040"),
    "EXT_2080": ("Motion", "2080 aluminium extrusion (Y bridge), cut to length", "mm", 0.030, "~$30/m generic 2080"),
    "LEVEL_FOOT": ("Frame", "M8 levelling foot 60 mm", "ea", 4.0, ""),
    "CORNER_HW": ("Frame", "3-way corner cubes / L-brackets + M5 T-nuts & screws (lot per cell)", "lot", 120.0, "~40 joints"),
    "POOP_BIN": ("Coop module", "Poop-bin cassette, HDPE/ply tray 60x18x8 in + drawer slides 24 in", "ea", 85.0, ""),
    "BED_TRAY": ("Coop module", "Deep-bed tray, marine ply + washable liner, ledgers", "ea", 120.0, ""),
    "ROOST_POLE": ("Coop module", "2 in roost pole (hardwood dowel), hinge brackets", "ea", 15.0, ""),
    "ROOST_ACT": ("Coop module", "12 V linear actuator 2 in stroke for deployable roost", "ea", 35.0, "Plus/Pro deployable"),
    "MGN12_RAIL": ("Motion", "MGN12 linear rail, cut to length", "mm", 0.025, "~$25/m generic"),
    "MGN12H_BLOCK": ("Motion", "MGN12H carriage block", "ea", 8.0, ""),
    "MGN15_RAIL": ("Motion", "MGN15 linear rail (Z), cut to length", "mm", 0.035, ""),
    "MGN15H_BLOCK": ("Motion", "MGN15H carriage block", "ea", 12.0, ""),
    "PLATE_X": ("Motion", "X carriage plate 6 mm Al (cut/drilled)", "ea", 18.0, ""),
    "PLATE_Y": ("Motion", "Y carriage plate 10 mm Al", "ea", 20.0, ""),
    "PLATE_Z": ("Motion", "Z carriage plate 10 mm Al", "ea", 20.0, ""),
    "PLATE_ARM": ("Motion", "Arm/tool mount plate 250x250x12.7 mm Al, 5x5 M6 grid (shared)", "ea", 45.0, ""),
    "PLATE_GUSSET": ("Motion", "Mount-plate gusset 10 mm Al", "ea", 10.0, ""),
    "NEMA23_XY": ("Motion", "NEMA 23 stepper ~1.9 Nm (X dual + Y)", "ea", 35.0, "brief 13.3"),
    "MOTOR_Z_N17": ("Motion", "NEMA 17 stepper + T8 lead screw/nut (Z, light tool / printed arm)", "ea", 45.0, "brief 13.3"),
    "MOTOR_Z_N23B": ("Motion", "NEMA 23 stepper with 24 V holding brake + SFU1605 ball screw (Z, heavy arm)", "ea", 220.0, "Pro: brake for 11 kg arm"),
    "BELT_KIT": ("Motion", "GT2 10 mm belt, pulleys, idlers, tensioners (X dual + Y)", "lot", 60.0, ""),
    "DRV_TB6600": ("Motion", "TB6600 stepper driver", "ea", 12.0, "brief 13.3"),
    "DRV_CLOSED": ("Motion", "Closed-loop stepper driver (hybrid servo) for NEMA 23", "ea", 45.0, "Pro"),
    "CABLE_CHAIN": ("Motion", "Cable chain 15x30 mm, ~4 m total + brackets", "lot", 35.0, ""),
    "ENDSTOP_MECH": ("Sensors", "Mechanical limit switch (X/Y/Z min, X2 squaring)", "ea", 2.0, ""),
    "ENDSTOP_MAX": ("Sensors", "Mechanical max-travel limit switch", "ea", 2.0, ""),
    "PROX_IND": ("Sensors", "Inductive prox sensor M12 (repeatable homing)", "ea", 6.0, ""),
    "SW_BIN": ("Sensors", "Bin-seated micro switch (brief 10.6)", "ea", 3.0, ""),
    "SW_ROOST": ("Sensors", "Roost stowed/deployed switches (x2 per roost)", "ea", 2.0, ""),
    "TOF": ("Sensors", "VL53L1X ToF sensor on tool plate (bed height)", "ea", 12.0, ""),
    "ENV_SENS": ("Sensors", "DHT20/SHT4x temp-humidity + ammonia sensor (coop air)", "lot", 25.0, ""),
    "ADAPTER_STARTER": ("Arm", "Printed/Al adapter plate SO-101 -> M6 grid", "ea", 10.0, ""),
    "ADAPTER_PLUS": ("Arm", "Al adapter plate mid arm -> M6 grid", "ea", 40.0, ""),
    "ADAPTER_PRO": ("Arm", "Al adapter plate 10 mm UR3e base -> M6 grid", "ea", 80.0, ""),
    "ARM_STARTER": ("Arm", "SO-101 follower arm kit (STS3215 servos + printed parts + bus board)", "ea", 230.0, "optional: Starter can ship no-arm"),
    "TOOL_STARTER": ("Arm", "Starter fixed tool (bed fork/rake) on Z plate", "ea", 25.0, ""),
    "ARM_PLUS": ("Arm", "Mid 6-DOF arm, uFactory Lite 6 class", "ea", 3500.0, "vendor list price class, verify"),
    "ARM_PRO": ("Arm", "Universal Robots UR3e (arm + control box + teach pendant)", "ea", 25000.0, "rough new price class, quote required"),
    "ARM_PRO_CB": ("Arm", "UR control box floor stand / bracket", "ea", 60.0, "control box itself in ARM_PRO"),
    "GUARD_MESH": ("Guarding", "Welded-wire mesh 1/2 in 19 ga (hardware cloth) on frame, per side panel", "ea", 90.0, "~2 rolls/side"),
    "GUARD_MESH_PRO": ("Guarding", "Machine-guard welded mesh panels (ISO 13857 distances) per side, upgrade", "ea", 650.0, "Pro replaces hardware cloth"),
    "GUARD_SHEAR": ("Guarding", "3 mm ACM shear panel (back wall bracing), 2 sheets 4x8", "ea", 120.0, ""),
    "GUARD_TOP": ("Guarding", "Top panel: mesh or twin-wall polycarbonate", "ea", 90.0, ""),
    "DOOR_SERVICE": ("Guarding", "24x48 in service door: frame, hinges, latch", "ea", 60.0, ""),
    "SAFETY_INTERLOCK": ("Safety", "Coded safety interlock switch (service door), PLd-capable", "ea", 90.0, "Pro"),
    "SAFETY_RELAY": ("Safety", "Dual-channel safety relay (E-stop + door) Cat 3/PLd", "ea", 180.0, "Pro"),
    "ESTOP": ("Safety", "E-stop mushroom, twist release, NC (Pro: 2NC safety-rated)", "ea", 25.0, ""),
    "LIGHT_CURTAIN": ("Safety", "Type 4 light curtain on service opening (optional)", "ea", 300.0, "optional, not in totals"),
    "CONTROL_BOX": ("Electronics", "NEMA 4X enclosure 12x16x6 in + DIN rail, terminals, fuses, glands", "ea", 110.0, "brief 15.1"),
    "COMPUTE_BOX": ("Electronics", "Second enclosure 10x8x6 in for SBC + fan/filter", "ea", 45.0, ""),
    "PSU_24V": ("Electronics", "24 V 350 W DIN PSU (Starter/Plus) / 600 W (Pro)", "ea", 45.0, "Pro uses 2"),
    "BUCK": ("Electronics", "24->12 V and 24->5 V buck converters", "lot", 20.0, ""),
    "MCU_ESP32S3": ("Electronics", "ESP32-S3 motion/IO controller (gantry STEP/DIR, switches)", "ea", 15.0, "brief 15.1"),
    "DOOR_CTRL": ("Electronics", "Chicken Tender Starter door controller (XIAO ESP32-S3 + DRV8874 + reeds)", "ea", 45.0, "per ct-starter repo"),
    "SBC_PI5": ("Electronics", "Raspberry Pi 5 8 GB + active cooler + 64 GB card + 27 W PSU", "ea", 120.0, "Plus"),
    "SBC_JETSON": ("Electronics", "Jetson Orin Nano Super dev kit 8 GB + 256 GB NVMe", "ea", 290.0, "Pro"),
    "CAM_BRACKET": ("Electronics", "1/4-20 camera bracket on post corner", "ea", 6.0, ""),
    "CAM_CORNER_XIAO": ("Cameras", "XIAO ESP32-S3 Sense camera node (corner)", "ea", 15.0, ""),
    "CAM_CORNER_PI": ("Cameras", "Pi Camera Module 3 + 1 m cable (corner node)", "ea", 30.0, "Plus"),
    "CAM_CORNER_GS": ("Cameras", "Global-shutter OV9281 MIPI camera w/ ext. trigger (hw-synced pair)", "ea", 60.0, "Pro"),
    "CAM_TOOL": ("Cameras", "Eye-in-hand camera on Z plate, XIAO ESP32-S3 Sense node (Starter/Plus)", "ea", 15.0, ""),
    "CAM_TOOL_UVC": ("Cameras", "Eye-in-hand camera on Z plate, USB UVC cam (Pro: both CSI ports go to the GS pair)", "ea", 40.0, "Pro; A1.1: split from CAM_TOOL so unit x qty = ext"),
    "WATCH_PAD": ("Electronics", "WatchTower AI mount pad", "ea", 15.0, ""),
    "WATCH_POLE": ("Electronics", "WatchTower 1.5 in mount pole 24 in", "ea", 15.0, ""),
    "WIRING": ("Electronics", "Wire, ferrules, connectors, shielded motor cable (lot)", "lot", 90.0, ""),
}

LEN_KEYS = {"EXT_4040", "EXT_2040", "EXT_2080", "MGN12_RAIL", "MGN15_RAIL"}


def model_counts(tier):
    c = collections.Counter(); L = collections.defaultdict(float)
    for p in M.assemble(tier, *park, with_arm=True):
        if not p.bom:
            continue
        k = p.bom
        if k == "CAM_CORNER":
            k = {"starter": "CAM_CORNER_XIAO", "plus": "CAM_CORNER_PI", "pro": "CAM_CORNER_GS"}[tier]
            if tier == "pro" and p.name.endswith(("BL", "BR")):
                k = "CAM_CORNER_XIAO"
            if tier == "plus" and p.name.endswith("BL"):
                k = "CAM_CORNER_XIAO"
        if k == "CAM_TOOL" and tier == "pro":
            k = "CAM_TOOL_UVC"
        if k == "MOTOR_Z":
            k = "MOTOR_Z_N23B" if tier == "pro" else "MOTOR_Z_N17"
        if k == "GUARD_MESH" and tier == "pro":
            k = "GUARD_MESH_PRO"
        if k in LEN_KEYS:
            L[k] += p.length
        c[k] += 1
    return c, L


def extra(tier):
    """Items not represented by geometry."""
    s, pl, pr = tier == "starter", tier == "plus", tier == "pro"
    e = {"CORNER_HW": 1, "BELT_KIT": 1, "CABLE_CHAIN": 1, "WIRING": 1, "BUCK": 1, "MCU_ESP32S3": 1,
         "DRV_TB6600": 0 if pr else 4, "DRV_CLOSED": 4 if pr else 0,
         "ENDSTOP_MECH": 4, "ENDSTOP_MAX": 0 if s else 3, "PROX_IND": 0 if s else 4,
         "SW_BIN": 1, "SW_ROOST": 0 if s else 6, "ROOST_ACT": 0 if s else 3, "TOF": 0 if s else 1,
         "ENV_SENS": 1, "PSU_24V": 2 if pr else 1, "SBC_PI5": 1 if pl else 0, "SBC_JETSON": 1 if pr else 0,
         "SAFETY_RELAY": 1 if pr else 0, "LIGHT_CURTAIN": 0, "TOOL_STARTER": 1 if s else 0}
    return e


def main():
    rows = {}
    for t in P.TIERS:
        c, L = model_counts(t)
        for k, n in c.items():
            q = round(L[k] / 1000.0, 3) if k in LEN_KEYS else n
            rows.setdefault(k, {})[t] = q
        for k, n in extra(t).items():
            rows.setdefault(k, {})[t] = rows.get(k, {}).get(t, 0) + n
    out = os.path.join(ROOT, "BOM.csv")
    tot = {t: 0.0 for t in P.TIERS}
    with open(out, "w", newline="") as f:
        w = csv.writer(f)
        w.writerow(["item", "category", "description", "unit", "qty_starter", "qty_plus", "qty_pro",
                    "unit_usd_est", "ext_starter_usd", "ext_plus_usd", "ext_pro_usd", "notes"])
        for k in sorted(rows, key=lambda k: (CAT[k][0], k)):
            cat, desc, unit, price, note = CAT[k]
            unit_out = "m" if unit == "mm" else unit
            up = price * 1000 if unit == "mm" else price
            q = [rows[k].get(t, 0) for t in P.TIERS]
            ext = []
            for t, qq in zip(P.TIERS, q):
                pp = up
                v = 0.0 if k == "LIGHT_CURTAIN" else round(qq * pp, 2)
                ext.append(v); tot[t] += v
            w.writerow([k, cat, desc, unit_out, *q, round(up, 2), *ext, note])
        w.writerow([])
        w.writerow(["TOTAL_EST", "", "Estimated parts cost per tier (USD, excl. tax/shipping/labour)", "", "", "", "", "",
                    *[round(tot[t], 0) for t in P.TIERS], "+/-30% draft estimate"])
        no_arm = tot["starter"] - rows["ARM_STARTER"]["starter"] * CAT["ARM_STARTER"][3] - CAT["ADAPTER_STARTER"][3]
        w.writerow(["TOTAL_EST_STARTER_NO_ARM", "", "Starter without SO-101 (fixed tool only)", "", "", "", "", "",
                    round(no_arm, 0), "", "", ""])
    print({t: round(v) for t, v in tot.items()}, "starter no-arm", round(no_arm))


if __name__ == "__main__":
    main()
