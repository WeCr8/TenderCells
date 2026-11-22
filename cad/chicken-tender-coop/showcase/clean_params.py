"""Cleaning / egg ROUTINE parameters for the Plus/Pro ceiling gantry + inverted SO-101 (Zach 2026-11-22).

Adds on top of sc_params (imported, never edited): the T6 slotted trowel, its dock slot, the safety-sensor
set (PIR, extra reeds, load cells), routine timings and the bed keep-outs. Every value that is not in the
existing params or docs is marked  # ASSUMED.
Frame: coop model mm (+X right, +Y toward the coop back, +Z up). Gantry joints = arm-base position.
"""
from __future__ import annotations
import copy
import sc_params as P

# ------------------------------------------------------------------ T6 slotted trowel / scoop (tools_cad.py)
T6 = dict(
    blade_L=150.0,            # along the tool axis (mm)
    blade_W=80.0,             # across. Brief asked ~100; the 100 mm blade is OVER the SO-101 wrist_flex working limit
                              # (margin 0.90, tools_cad.size_blade), 90 is at the limit (0.997), 80 passes (1.11)
    blade_t=4.0,              # PETG-CF print (or 4 mm HDPE sheet, heat-formed)
    dish_depth=12.0,          # "slightly dished": sagitta across the width (ASSUMED)
    slots=5, slot_w=8.0, slot_L=95.0,     # 5 x 8 mm slots on the 80 mm blade (4.8 mm ribs; 7 slots on a 100 mm blade)
    lip_h=10.0,               # rolled heel lip that keeps a clump on the blade during the roll
    neck_L=60.0,              # tang -> blade heel (straight neck, 10 x 14 mm rib)
    tang=(24.0, 6.0, 35.0),   # same jaw-clamped tang as T1-T5 (V + 2 magnets)
    rho_petg_cf=1.30e-6,      # kg/mm3 (1.30 g/cc)  ASSUMED typical PETG-CF filament
    rho_hdpe=0.95e-6,         # kg/mm3
    infill=0.85,              # printed part effective density vs solid (4 walls on a 4 mm part)  ASSUMED
    material="PETG-CF (printed); 4 mm HDPE sheet is the alternative",
)
T6_LEN = 10.0 + T6["neck_L"] + T6["blade_L"]     # gripper frame (= tang grasp point) -> blade tip (mm): 220
BEDDING_LOAD_KG = 0.25        # brief: wet clump + fines on the full 150 x 100 blade (ASSUMED); scales with blade area
T6_COM = 115.0                # mm below the grasp point (tools_cad.mass(), ~115 for both widths)
SCOOP = dict(drag_N=6.0,      # bedding drag on the full 150 x 100 blade fully buried, slow curl (ASSUMED);
                              # scales with blade width x buried length
             curl_depth_mm=70.0,          # plunge full depth (aerate, axial load only), withdraw to 70 mm, THEN curl
             curl_deg=35.0, curl_speed_deg_s=30.0,
             servo_load_abort_pct=70.0)   # STS3215 reported load above this during a curl -> stop, lift, next pass shallower
TOOLS = dict(P.TOOLS)
TOOLS["T6"] = ("slotted trowel / scoop 150 x 80, 5 x 8 mm slots (deep-bed turning)", 0.058, T6_LEN, "wrist QC")  # PETG-CF (tools_cad.mass())

# Dock: the left rail (T2/T3/T4) is full and the open pop door rises to z ~1378 between x 457..762, so T6
# hangs EDGE-ON (blade plane = Y-Z, 100 mm along Y, centred on the standard fork tang at dock y + 32) in the 42 mm gap
# between the right door guide (x <= 803) and T1's blade (x >= 845). The blade sits BELOW the dock plate (blade top
# z ~1270 < plate bottom 1325), so its rear half (y 2499-2517) passes under the plate; nothing else is there at
# x 812-836 (front studs are at x 250 / 970). The right dock rail is extended from x 830 to 806 to carry the fork.
DOCK = copy.deepcopy(P.DOCK)
DOCK["slots"]["T6"] = 824.0
DOCK_RIGHT_RAIL_X0 = 806.0

# ------------------------------------------------------------------ safety sensors (new parts, ASSUMED pricing)
PIR = dict(part="AM312 mini PIR (3.3 V, digital out, ~2 s hold)", hold_s=2.0, z=P.CAM_Z - 60.0,
           pos=(P.COOP_W - 120.0, P.COOP_Y0 + 120.0))    # front-right upper corner, looking down + back  ASSUMED
CAM_CLEAR_HOLD_S = 60.0       # camera person/bird detector must read "clear" this long
SENSOR_STALE_S = 5.0          # any safety input older than this = fault (heartbeat)
LOADCELL = dict(roost_empty_kg=0.30, nest_empty_kg=0.15,   # hen ~1.8-3 kg; an egg ~0.06 (nest pad tare'd)  ASSUMED
                hx711_sps=10, part="50 kg half-bridge load cell x4 + HX711 per roost; 5 kg bar cell + HX711 per nest box")
REED_DEBOUNCE_S = 0.30        # reed must be stable this long to count as CLOSED
DOOR_IDLE_MA = 80             # fw_sim Cfg.idleCurrent_mA: actuator current must be <= this (motor idle)

# ------------------------------------------------------------------ environment window
WINDOW = dict(start_h=9.0, end_h=15.5)   # daytime, hens out in the run; ends well before dusk door close  ASSUMED
RAIN_BLOCK = True                         # no clean while raining (cleanout/bedding panel may be opened by a person)

# ------------------------------------------------------------------ routine timings / watchdog
WATCHDOG_S = 0.5              # host <-> motion controller heartbeat; miss -> motor power cut
ROUTINE_TIMEOUT_S = dict(clean=3600.0, egg=600.0)
STEP_TIMEOUT_FACTOR = 2.0     # any motion step taking > 2x its planned time -> fault
SAFE_Z_SPEED = 0.5 * P.G_SPEED["z_max"]   # mm/s "reduced speed" retreat
NEAR_WALL_MM = 80.0           # inside this band XY speed is clamped to xy_near_wall

# ------------------------------------------------------------------ mixing plan
MIX = dict(
    lane_pitch=70.0,          # blade W 80 -> 10 mm overlap
    cell_pitch=120.0,         # along the lane
    floor_guard=20.0,         # never closer than 20 mm to the HDPE tray liner
    wrist_above_bed=30.0,     # neck/wrist stays >= 30 mm above the bedding surface
    wall_margin=15.0,         # blade edge to tray wall
    roll_deg=135.0,           # 90-180 deg wrist roll per cell (alternating direction)
    t_plunge_mm_s=60.0, t_lift_mm_s=60.0, roll_deg_s=180.0,   # SO-101 moves under load  ASSUMED
    t_scoop_s=1.2, t_dump_s=0.8, t_settle_s=0.3,
    gz_work=None,             # chosen per cell by the reach search (clean_reach.py)
)
# keep-outs (axis-aligned boxes, mm): no arm/tool point inside, + margin
TRAY_IN = (P.TRAY_X[0] + P.TRAY_WALL_T, P.TRAY_X[1] - P.TRAY_WALL_T, P.TRAY_Y[0] + P.TRAY_WALL_T, P.POOP_BIN_Y0)
KEEP_OUT = {
    "droppings board + cleats": (0.0, P.COOP_W, P.DROP_BOARD["y0"], P.DROP_BOARD["y1"],
                                 P.DROP_BOARD["z_top"] - P.DROP_BOARD["t"] - P.S2, P.DROP_BOARD["z_top"]),
    "roost": (P.COOP_W / 2 - P.ROOST_L / 2, P.COOP_W / 2 + P.ROOST_L / 2, P.COOP_Y1 - P.ROOST_FROM_BACK - P.W2 / 2,
              P.COOP_Y1 - P.ROOST_FROM_BACK + P.W2 / 2, P.ROOST_TOP_Z - P.T2, P.ROOST_TOP_Z),
    "nest entrances (right wall)": (P.COOP_W - 60.0, P.COOP_W, P.NB_Y0, P.NB_Y1, P.NEST_FLOOR_Z - 20.0, P.NEST_FLOOR_Z + 14 * P.IN),
    "egg chute mouth": (P.EGG_CHUTE["mouth"][0] - 45, P.COOP_W, P.EGG_CHUTE["mouth"][1] - 55, P.EGG_CHUTE["mouth"][1] + 55,
                        P.EGG_CHUTE["mouth"][2] - 60, P.EGG_CHUTE["mouth"][2]),
    "bed moisture probe": (390.0, 430.0, 2990.0, 3025.0, P.BED_TOP_Z - 90, P.BED_TOP_Z + 50),
    "bed temperature probe": (785.0, 815.0, 2785.0, 2815.0, P.BED_TOP_Z - 120, P.BED_TOP_Z + 50),
    "tray left wall": (P.TRAY_X[0], TRAY_IN[0], P.TRAY_Y[0], P.TRAY_Y[1], P.TRAY_Z0, P.TRAY_RIM_Z),
    "tray right wall": (TRAY_IN[1], P.TRAY_X[1], P.TRAY_Y[0], P.TRAY_Y[1], P.TRAY_Z0, P.TRAY_RIM_Z),
    "tray front wall": (P.TRAY_X[0], P.TRAY_X[1], P.TRAY_Y[0], TRAY_IN[2], P.TRAY_Z0, P.TRAY_RIM_Z),
    "poop-bin divider": (P.TRAY_X[0], P.TRAY_X[1], P.POOP_BIN_Y0, P.POOP_BIN_Y0 + 12, P.TRAY_Z0, P.TRAY_RIM_Z),
    "front wall + posts": (0.0, P.COOP_W, P.COOP_Y0, P.COOP_Y0 + 2 * P.T2, P.FLOOR_TOP_Z, P.FRONT_WALL_TOP),
    "left wall": (-P.PLY_WALL, 0.0, P.COOP_Y0, P.COOP_Y1, P.FLOOR_TOP_Z, P.FRONT_WALL_TOP),
    "right wall": (P.COOP_W, P.COOP_W + P.PLY_WALL, P.COOP_Y0, P.COOP_Y1, P.FLOOR_TOP_Z, P.FRONT_WALL_TOP),
}
KEEP_OUT_MARGIN = 10.0
# feeder: re-hung in the RUN (sc_params FEEDER_MOVED, y < COOP_Y0) -> outside the gantry; no keep-out needed inside
# hanging tools at the dock: deepest is T6 (blade +-50 about the tang), z band from the hook down to T6's tip
TOOL_ZONE = (140.0, 1086.0, P.DOCK["y"], P.DOCK["y"] + 32.0 + T6["blade_W"] / 2,
             P.DOCK["z_hook"] - T6_LEN - 15.0, P.DOCK["z_hook"] + 45.0)
KEEP_OUT["tool dock + hanging tools"] = TOOL_ZONE
# gantry Y window for bed work: the arm base plate (+-55) and mast (+-20) run through the tool z band at any work
# height, so the base stays behind the hanging tools; the mast also clears the door actuator body
GY_WORK_MIN = max(TOOL_ZONE[3] + 55.0 + 15.0, P.ACT_Y + P.ACT[P.ACT_TIER]["body_d"] / 2 + 20 + 15)
GY_WORK_MAX = P.DROP_BOARD["y0"] - 55.0 - 15.0       # arm base plate (+-55) stays in front of the droppings board
GX_WORK = P.GX_RANGE
