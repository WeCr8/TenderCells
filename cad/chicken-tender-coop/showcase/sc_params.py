"""Chicken Tender coop SHOWCASE parameters (doors, eggs, robot-arm options, electronics, animation).

Builds on ../cad/coop_params.py (TC-CHKN-BUILD-001 rev A, PR #189) and the CT72 A1.2 cell work
(SO-101 follower+leader on Plus/Pro, soft vacuum egg tool on Starter, UR3e pro_heavy, egg basket
pocket + AprilTag). Electronics come from PR #188: hardware/chicken-tender-starter/hw/*.yaml and
docs/CHICKEN_TENDER_PINOUT.md. Every value that is not in those documents is marked  # ASSUMED.
Frame and units are the coop model's: mm, origin = run-door end / left / ground, +X right,
+Y toward the coop back, +Z up.
"""
import os, sys
sys.path.insert(0, os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "cad"))
from coop_params import *  # noqa: F401,F403

T2, W2 = L2X4
S2 = L2X2[0]
XC = COOP_W / 2                       # coop centre line (pop door, cord eye)

# ------------------------------------------------------------------ pop door (cord lift, PR #188)
# Build guide step 8: guides C14 + lips C15 on the INSIDE of the front wall (the PR #189 CAD shows
# them outside; the showcase follows the guide text and flags the difference).
DOOR_PANEL = POP_DOOR_PANEL           # P5 12 x 13 in
DOOR_T = PLY_WALL                     # 15/32 offcut
DOOR_BOTTOM_OVERLAP = 0.5 * IN        # ASSUMED: closed door rests on a stop 1/2 in below the sill
DOOR_Z_CLOSED = POP_SILL_Z - DOOR_BOTTOM_OVERLAP
DOOR_LIFT = 280.0                     # hw.yaml door.travel_mm (open reed position)
DOOR_LIFT_RECOMMENDED = 292.0         # showcase finding: 280 leaves 267 mm clear (see showcase doc)
DOOR_Y0 = COOP_Y0                     # slides on the inside face of the front wall
DOOR_SLACK = 0.125 * IN               # guide 1/8 in slack (guide step 8)
GUIDE_Z0 = POP_SILL_Z - 1 * IN
GUIDE_L = 26 * IN                     # C14 / C15
WOOD_DENSITY = 600.0                  # kg/m3 CDX ply, ASSUMED (dry); wet ply ~+20 %

# actuator: horizontal, inside, on a 2x4 mounting board on the front posts, ~3 in below nailer C9
ACT = {  # generic Starter minimums (parts.yaml act-generic-12v-300mm); Pro = Glideforce LACT12-12V-05
    "starter": dict(stroke=300.0, retracted=420.0, extended=720.0, body_d=40.0, rod_d=20.0,
                    speed_noload=10.0, force_N=150.0, i_noload=0.8, i_rated=3.0),
    "pro": dict(stroke=300.0, retracted=413.0, extended=713.0, body_d=38.0, rod_d=20.0,
                speed_noload=43.9, force_N=150.0, i_noload=1.2, i_rated=3.2),
}
ACT_TIER = "starter"
DRV_I_LIMIT = 2.0                     # A, hw.yaml current_limit
FW_OVERCURRENT = 1.8                  # A, firmware jam trip
FW_TRAVEL_TIMEOUT_S = 55.0
ACT_Z = FRONT_WALL_TOP - S2 - 3 * IN  # actuator centre line, ~3 in below the front nailer C9
MOUNT_BOARD_Y0 = COOP_Y0 + 2 * T2     # 2x4 mounting board on the inside face of the front posts
ACT_Y = MOUNT_BOARD_Y0 + T2 + 25.0    # actuator axis just off the board (clevis bracket depth, ASSUMED)
ACT_FIXED_X = T2 + W2 + 15.0          # fixed clevis just right of the left front post (ASSUMED)
ACT_SLACK_AT_CLOSE = 10.0             # cord slack when the door rests closed (ASSUMED)
# A direct rod -> cord-eye pull cannot fit: the 720 mm extended actuator would have to sit entirely
# on one side of the cord eye (needs >= 760 mm from the eye to the wall, the coop has ~480).
# Showcase design: a 180 deg TURNAROUND PULLEY by the right front post sends the cord back to the
# cord eye over the door. ASSUMED part, not in the PR #188 BOM (flagged in the BOM check).
PULLEY_X = COOP_W - T2 - W2 - 30.0
PULLEY_D = 25.0                       # sheave diameter, >= 12x cord dia (ASSUMED)
CORD_D = 1.8                          # BOM CORD
CORD_BREAK_N = 1000.0                 # ASSUMED: 1.8 mm braided UHMWPE, typical >= 100 kgf; verify listing
CORD_EYE = (XC, COOP_Y0 + DOOR_T / 2 + 6.0, ACT_Z - 20.0)
CORD_EYE_MU = 0.15                    # Dyneema on a smooth printed eye (ASSUMED)
SHEAVE_EFF = 0.95                     # plain-bore printed sheave (ASSUMED)
GUIDE_MU = 0.3                        # wood on wood, damp (ASSUMED)
GUIDE_SIDE_LOAD_N = 2.0               # door rubbing on the lips (ASSUMED)
REED_CLOSED_Z = DOOR_Z_CLOSED + 30.0  # reed on the guide at the closed position, magnet low on the door
REED_OPEN_Z = REED_CLOSED_Z + DOOR_LIFT

# ------------------------------------------------------------------ other doors
CLEANOUT_HINGE = "left"               # human access (cleanout) door P3, hinged on its left edge (ASSUMED side)
CLEANOUT_OPEN_DEG = 100.0
RUN_DOOR_HINGE = "left"               # ASSUMED (guide: brace low on the hinge side)
RUN_DOOR_OPEN_DEG = 95.0
LID_OPEN_DEG = 100.0                  # nest-box lid tips back against the coop wall

# ------------------------------------------------------------------ nest boxes + eggs (P6)
NB_X0 = COOP_W + PLY_WALL                     # box bolted to the outside of the right wall
NB_T = PLY_FLOOR
NB_X1 = NB_X0 + NB_IN + NB_T
NB_Y0 = (COOP_Y0 + COOP_Y1) / 2 - NB_LEN / 2
NB_Y1 = NB_Y0 + NB_LEN
NB_DIV_Y = (NB_Y0 + NB_Y1) / 2
NB_INNER = [(NB_X0, NB_X1 - NB_T, NB_Y0 + NB_T, NB_DIV_Y - NB_T / 2),       # box 1 interior x0,x1,y0,y1
            (NB_X0, NB_X1 - NB_T, NB_DIV_Y + NB_T / 2, NB_Y1 - NB_T)]       # box 2
LID_HINGE_Z = NEST_FLOOR_Z + NB_IN + 3 * IN
LINER_T = 12.0                        # ASSUMED washable rubber/turf nest pad (floor stays flat)
EGG_D, EGG_L = 45.0, 57.0             # brief: Ø ~45 x 57 mm
EGG_MASS_G = (50.0, 58.0, 70.0)       # small / large / jumbo
EGG_Z = NEST_FLOOR_Z + LINER_T + EGG_D / 2     # egg lying on its side
EGG_GRID = (-80.0, 0.0, 80.0)         # 3x3 lay positions per box about the box centre (ASSUMED spread)
EGG_BREAK_N = 34.0                    # equatorial, 34 +/- 6 N (CT72 A1.2 source)

# egg basket (CT72 basket pocket idea: registered pocket + AprilTag tag36h11)
BASKET_IN = (200.0, 150.0, 50.0)      # interior L x W x H: shallow padded egg tray with cups (ASSUMED)
TRAY_ARM_LIP = 20.0                   # tray lip on the arm side lowered to 20 mm so the jaws clear it (showcase design)
APRILTAG = dict(family="tag36h11", id=0, size_mm=60.0)

# ------------------------------------------------------------------ robot options
ARM_OPTIONS = ("starter", "plus", "pro")
# Starter: soft vacuum picker on a 2-axis Y/Z rail above the box centre line
NB_CX = (NB_INNER[0][0] + NB_INNER[0][1]) / 2
ST_RAIL_X = NB_CX
RIM_ROBOT = 6 * IN                    # robot-ready box: outer + back-end walls cut to a 6 in rim inside the hood (showcase design)
ST_RAIL_Y = (NB_Y0 - 40.0, COOP_Y1 - 10.0)
ST_CUP_D = 20.0                       # 1.5-fold silicone bellows cup
ST_VAC_KPA = 20.0                     # CT72 VAC_LIMIT_KPA
ST_TOOL_LEN = 60.0 + 240.0 + 15.0     # CT72 STARTER_TOOL_LEN: plunger + tube + cup
# Plus: SO-101 follower, inverted, under the hood over the box divider (position from reach search)
PLUS_BASE = tuple(float(v) for v in os.environ["PLUS_BASE"].split(",")) if os.environ.get("PLUS_BASE") else (NB_CX, NB_DIV_Y, 1240.0)  # base face, inverted, yaw 0 (pan zero = +X). From the reach search
PLUS_YAW = 0.0
ARM_BASE_Z = 1240.0
HOOD_ROOF_Z = 1300.0                  # egg-bay hood roof underside (arm mount plate above it)
HOOD_X1 = NB_X1 + 230.0               # hood outer wall (basket shelf inside)
HOOD_Y0 = NB_Y0 - 30.0
HOOD_Y1 = COOP_Y1
BASKET_PLUS = (NB_X1 + 125.0, NB_DIV_Y)        # basket centre on the outboard shelf (Plus)
BASKET_RAIL = (NB_CX, (NB_Y1 + COOP_Y1) / 2 + 5)  # basket centre at the Y end (Starter, Pro)
BASKET_FLOOR_Z = 940.0
# Pro: SO-101 inverted on a short Y gantry under the hood
PRO_RAIL_Y = (NB_Y0 + 60.0, COOP_Y1 - 60.0)

# ------------------------------------------------------------------ electronics placement (guide section 7)
CTRL_BOX = (130.0, 160.0, 75.0)       # W x H x D, ASSUMED (BOM: printed PETG control box). Must fit the 6 in
                                      # strip beside the 36 in cleanout door (x 0..152 mm) - see the doc finding
CTRL_BOX_TOP_Z = 56 * IN              # guide section 7
CTRL_BOX_X = 80.0                     # "upper right" of the back wall as you face it from behind = model -X side,
                                      # which matches "run cables up the back-left post" (guide wire routes)
WROOM_BOX = (130.0, 150.0, 70.0)      # Pro add-on second box (guide: "same or a second box"), ASSUMED size
WROOM_BOX_TOP_Z = CTRL_BOX_TOP_Z - CTRL_BOX[1] - 110.0
OUTLET_POS = (-300.0, COOP_Y1 + 900.0, 450.0)  # outdoor GFCI outlet on a post, ASSUMED location
DHT_Z = FLOOR_TOP_Z + 14 * IN         # left wall, mid-depth
MQ_Z = FLOOR_TOP_Z + 12 * IN          # left wall, >= 18 in from the roost
MQ_Y = COOP_Y0 + 10 * IN              # ASSUMED (guide gives no depth; chosen to keep 18 in from the roost)
CAM_Z = FRONT_WALL_TOP - 6 * IN       # ~6 in below the roof, front-left upper corner
GLAND_Z = CTRL_BOX_TOP_Z - CTRL_BOX[1] - 40.0

COLORS_SC = {
    "door": (0.78, 0.33, 0.22), "metal": (0.62, 0.64, 0.68), "dark": (0.18, 0.19, 0.21),
    "egg": (0.93, 0.86, 0.74), "liner": (0.35, 0.45, 0.30), "basket": (0.55, 0.40, 0.22),
    "tag": (0.05, 0.05, 0.05), "pcb": (0.10, 0.35, 0.18), "box": (0.85, 0.85, 0.80),
    "estop": (0.85, 0.10, 0.10), "cable": (0.12, 0.12, 0.12), "arm": (0.96, 0.96, 0.94),
    "servo": (0.10, 0.10, 0.11), "rail": (0.70, 0.72, 0.76), "hen": (0.72, 0.42, 0.20),
    "comb": (0.85, 0.12, 0.10), "cup": (0.20, 0.45, 0.75), "hood": (0.55, 0.60, 0.62),
    "cord": (0.95, 0.85, 0.15), "reed": (0.95, 0.95, 0.95),
    "steel": (0.68, 0.70, 0.72), "chainlink": (0.55, 0.57, 0.60), "concrete": (0.72, 0.71, 0.68),
    "chickenwire": (0.70, 0.72, 0.66),
}

# ------------------------------------------------------------------ RUN: chain-link + small gable roof (Zach, 2026-11-21 07:37)
# Replaces the guide's wood run frame (R1-R10) and hardware-cloth run walls/roof. Steel sizes are
# common residential chain-link (ASSUMED, verify at the store).
CL_TERM_OD = 60.3                     # 2-3/8 in terminal / corner / gate posts
CL_LINE_OD = 48.3                     # 1-7/8 in line posts
CL_RAIL_OD = 42.2                     # 1-3/8 in top rail + gate frame
CL_MESH = 2 * IN                      # 2 in diamond mesh
CL_WIRE = 3.0                         # 11.5 ga galvanized (ASSUMED gauge)
CL_FABRIC_H = 72 * IN                 # 6 ft fabric on the open run
CL_UNDER_FABRIC_H = 36 * IN           # 3 ft fabric under the coop: 24 in exposed + ~11 in buried footer
CL_UNDER_BURY = CL_UNDER_FABRIC_H - (FLOOR_FRAME_Z0 + 1 * IN)
CL_POST_BURY = 24 * IN                # posts set 24 in deep in concrete (ASSUMED, check frost depth; Lakeside ~0)
CL_FOOTING_D = 8 * IN
CL_PO = CL_TERM_OD / 2                # post centres sit inside the 48 in footprint
CL_GATE_END_Y = CL_PO
CL_COOP_END_Y = COOP_Y0 - 40.0        # run's coop-end terminal posts, just in front of the coop front wall
CL_LINE_Y = (CL_GATE_END_Y + CL_COOP_END_Y) / 2
CL_TOP_Z = 72 * IN                    # post tops / top-rail top
CL_UNDER_OFF = 14.0                   # under-coop fabric sits 14 mm outside the coop plywood skirt
CL_BACK_POST = (CL_UNDER_FABRIC_H - CL_UNDER_BURY) + 4 * IN    # short back corner posts above grade
GATE_GAP = 95.0                       # opening - frame (3-3/4 in hinge + latch allowance)
GATE_H = 70 * IN
GATE_CLEAR = 2 * IN

# small gable roof over the open run: ridge along Y (the 12 ft length), corrugated panels, ribs down-slope
RUN_ROOF_PITCH = 3 / 12               # 3:12 (Zach: 3:12-4:12); 3:12 keeps the ridge under the coop eave line
RUN_ROOF_OVERHANG = 4 * IN            # eave + gable-end overhang
RUN_TRUSS_Y = None                    # computed in run_chainlink.py (5 trusses, <= 24 in o.c.)
RUN_ROOF_END_Y = COOP_Y0 - 6 * IN - 0.5 * IN   # stops just short of the coop roof's 6 in front overhang
CORR_T = 19.0                         # corrugated envelope (ribs ~3/4 in)

# predator-proofing toggles (chain-link 2 in mesh alone lets raccoons reach through and snakes/weasels in)
RUN_GUARD = os.environ.get("RUN_GUARD", "hardware_cloth_skirt")   # none | chicken_wire | hardware_cloth_skirt
RUN_GUARD_H = float(os.environ.get("RUN_GUARD_H_IN", "36")) * IN   # lower 36 in; chicken wire may be 72 (full)
RUN_APRON = os.environ.get("RUN_APRON", "buried")                  # buried (recommended) | surface (guide) | none
APRON_DEPTH = 3 * IN                  # buried L-footer: 12 in outward, 2-4 in below grade

# =====================================================================================================
# 2026-11-21 08:36-08:41 design changes (Zach): gable "house" roof on a framed coop house, controlled
# vents (dampers + fan), deep-bed cassette floor with a motorized slot drive, and a ceiling gantry that
# carries the SO-101 with a tool dock. The 08:37 insulation brief was withdrawn by Zach at 08:39 ("no
# insulation just the wood and posts"): no wall/floor foam, no liner, no R-value work. Only the optional
# foam under the corrugated roof stays (ROOF_FOAM toggle).
# =====================================================================================================
HOUSE = os.environ.get("HOUSE", "gable")          # gable (new default) | shed (PR #189 single-slope roof)
# ---- coop house frame: posts + studs + top plates + rafters + ridge board, wood siding
HOUSE_EAVE_Z = FRONT_WALL_TOP                     # all four walls now 72 in (back wall was 60 in)
HOUSE_PITCH = RUN_ROOF_PITCH                      # 3:12 gable to MATCH the run roof (Zach 2026-11-22 08:24: "both need
                                                  # to match"); ridge along Y so the eaves shed left/right. 3:12 is below
                                                  # the usual 4:12 corrugated minimum, so every side + end lap gets butyl
                                                  # tape (HLAP) and the house stays sealed like a shed: closed gables,
                                                  # eave blocking, foam closures, sealed ridge cap; only the screened,
                                                  # damper-controlled vents V1-V3 open (warmth stays in)
HOUSE_EAVE_OH = 6 * IN                            # eave overhang (left/right)
HOUSE_RAKE_OH = 3 * IN                            # gable (rake) overhang front/back: keeps the run roof gap
POST_TOP_Z = HOUSE_EAVE_Z - T2                    # all 4 corner posts stop under the top plate
TOP_PLATE = (T2, W2)                              # 2x4 flat, 38 x 89
RAFTER_Y = None                                   # computed: 4 rafter pairs, ~16 in o.c. (house.py)
RIDGE_BOARD = (T2, 5.5 * IN)                      # 2x6
SIDING_NOTE = "wood siding panels (T1-11 style); modelled at the PR #189 15/32 wall thickness"
ROOF_FOAM = os.environ.get("ROOF_FOAM", "board")  # board (1/2 in foil-faced foam board on the purlins, under the
                                                  # panels: stops condensation dripping on hens) | none
ROOF_FOAM_T = 0.5 * IN
HOUSE_HALF = COOP_W / 2 + PLY_WALL                # half span to the outer wall face
RIDGE_X = COOP_W / 2

# ---- controlled ventilation (the only openings at the top): 1 sq ft per 10 sq ft of floor
VENT_TARGET_SQIN = COOP_W_IN * COOP_D_IN / 10.0  # 230 sq in for the 4 x 4 ft coop
VENTS = {   # id: (wall, u0, u1 (along wall), z0, z1, role)  wall coords: left/right -> u = y, front -> u = x
    "V1": ("left", COOP_Y0 + 292.0, COOP_Y0 + 292.0 + 16 * IN, HOUSE_EAVE_Z - T2 - 5 * IN, HOUSE_EAVE_Z - T2, "high exhaust + fan"),
    "V2": ("right", COOP_Y0 + 292.0, COOP_Y0 + 292.0 + 16 * IN, HOUSE_EAVE_Z - T2 - 5 * IN, HOUSE_EAVE_Z - T2, "high exhaust"),
    "V3": ("front", 150.0, 150.0 + 10 * IN, 860.0, 860.0 + 8 * IN, "low intake (baffled)"),
}
FAN = dict(size=120.0, depth=38.0, cfm_free=110.0, cfm_installed=80.0, i_max_A=0.9,   # 120x38 12 V 4-wire PWM, ASSUMED
           pwm_hz=25000, winter_pct=30, trickle_pct=20)
DAMPER_SERVO = "MG90S-class metal-gear servo on a sliding HDPE plate"                   # ASSUMED

# ---- NH3 / climate control (coop_air logic; MQ-137 ppm per PR #188 mq137.h)
AIR = dict(nh3_ok=10.0, nh3_fan_on=15.0, nh3_fan_full=20.0, nh3_alarm=25.0, nh3_alarm_clear=20.0, nh3_hyst=5.0,
           t_hot_C=29.4, t_hot_clear_C=27.0, t_cold_C=1.7, t_winter_C=7.0, rh_high=75.0, rh_clear=68.0,
           winter_burst_s=60, winter_burst_every_s=900, night_fan_max_pct=30, intake_max_winter_pct=25,
           mix_trend_ppm_per_h=2.0, mix_cooldown_h=12.0)
MQ137 = dict(r_top_k=15.0, r_bottom_k=12.0, rl_k=10.0, m=-0.263, b=0.42, clean_ratio=3.6, vc=5.0, ppm_max=500.0)

# ---- deep-bed cassette (MASTER_SPEC s6-8, HARDWARE_CATALOG s6-7): the coop floor is a bedding tray that a
# gearmotor drives out through a gasketed slot in the back wall. The coop floor drops into a pit so the
# bedding surface sits at the old floor level (pop door, ramp, roost, nest heights unchanged).
PIT_PAN_TOP = 450.0                               # 1/2 in pan (predator floor) top, mm above grade
PIT_PAN_T = 12.7
PIT_BOTTOM = PIT_PAN_TOP - PIT_PAN_T              # 437 mm = 17.2 in under-coop headroom (was 24 in)
PIT_WALL_X = (T2 + W2, COOP_W - T2 - W2)          # pit walls line up with the corner-post inner faces
PIT_WALL_T = 0.75 * IN
SLIDE_T = 0.75 * IN                               # 500 lb 44 in locking full-extension slide (VEVOR-class), ASSUMED
SLIDE_H = 53.0
SLIDE_L = 44 * IN
TRAY_X = (PIT_WALL_X[0] + PIT_WALL_T + SLIDE_T, PIT_WALL_X[1] - PIT_WALL_T - SLIDE_T)
TRAY_Y = (COOP_Y0 + 2 * T2 + PIT_WALL_T, COOP_Y1 + PLY_WALL)   # front wall behind the front posts .. flush with the back siding
TRAY_Z0 = 490.0                                    # tray bottom (rack underneath rides 15 mm above the pan)
TRAY_FLOOR_T = 0.5 * IN + 3.0                      # 1/2 ext ply + 1/8 HDPE liner
TRAY_WALL_T = 0.75 * IN
TRAY_DEPTH_IN = 10.0                               # inner wall height: 8-10 in fill per MASTER_SPEC s7
TRAY_FLOOR_TOP = TRAY_Z0 + TRAY_FLOOR_T
TRAY_RIM_Z = TRAY_FLOOR_TOP + TRAY_DEPTH_IN * IN
BED_FILL_IN = float(os.environ.get("BED_FILL_IN", "9"))
BED_TOP_Z = TRAY_FLOOR_TOP + BED_FILL_IN * IN
BED_TOP_MAX_Z = TRAY_FLOOR_TOP + TRAY_DEPTH_IN * IN
BED_DENSITY = dict(dry_pine=120.0, wet_composting=350.0)       # kg/m3, ASSUMED (loose dry shavings / wet deep litter)
POOP_BIN_Y0 = 3380.0                               # rear compartment of the tray (under the droppings board)
CASSETTE_TRAVEL = dict(service=24 * IN, full=SLIDE_L - 10.0)   # 24 in = catalog s6 travel (poop bin), full = bed change
CASSETTE_DRIVE = dict(kind="12 V worm gearmotor + M1.5 steel rack + 20T pinion", rpm=40.0, stall_Nm=6.9, pinion_pd=30.0,
                      i_rated_A=1.6, i_stall_A=3.5, driver="Pololu G2 18v17-class (current-sense out)")   # ASSUMED listing values
CASSETTE_CONFIGS = ("plus", "pro")                 # motorized; base/starter keep the same tray on slides, hand-pulled
SLOT = dict(z0=TRAY_Z0 - 15.0, z1=TRAY_RIM_Z + 12.0, flap_hinge_z=TRAY_RIM_Z + 30.0)
CLEANOUT_Z0_NEW = 32 * IN                          # cleanout door raised above the slot header (was 29.25 in)
UNDER_BACK_FABRIC_TOP = PIT_BOTTOM - 7.0           # under-coop back chain-link now stops under the pit (was 25 in)
FEEDER_MOVED = (COOP_W / 2, COOP_Y0 - 350.0)       # feeder re-hung in the run in front of the coop (the pit took C3)
DROP_BOARD = dict(x0=80.0, x1=COOP_W - 80.0, y0=3120.0, y1=3520.0, z_top=ROOST_TOP_Z - T2 - 217.0, t=12.7)

# ---- ceiling gantry (Plus/Pro): Y rails on the side walls, X bridge, moving Z mast, SO-101 inverted on the mast
GANTRY_CFGS = tuple(c for c in os.environ.get("GANTRY_CFGS", "plus,pro").split(",") if c)
GY_RAIL_X = (45.0, COOP_W - 65.0)                 # 2040 rails stand off the side walls (cables run behind them)
GY_RAIL_Y = (COOP_Y0 + 2 * T2 + 6.0, COOP_Y1 - 2 * T2 - 6.0)   # between the front and back corner posts
GY_RAIL_Z = (1265.0, 1305.0)                      # 2040 on edge; MGN12 on top
GX_BEAM_Z = (1326.0, 1386.0)                      # 2060 bridge on the Y carriages
GZ_TOP = 1380.0                                   # arm base face (inverted) at the top of the Z stroke (park)
GZ_BOTTOM = 900.0                                 # lowest base face (litter work)
GZ_TRAVEL_MAX = 1280.0                            # base must be <= this to move X/Y (mast top under the rafters); was 1300
                                                  # at 4:12, lowered 20 mm for the 3:12 roof: mast top 1840 vs rafter
                                                  # underside ~1864 at the X travel ends (x 130 / 1090) -> ~24 mm clear
GZ_MAST_L = 560.0
G_PARK = (1000.0, 2650.0, GZ_TOP)                 # arm base at park: front-right, in the rafter bay y 2476-2845
G_SPEED = dict(xy_max=100.0, xy_near_wall=50.0, z_max=20.0, accel=500.0)   # mm/s, mm/s2 soft limits
G_MASS = dict(so101=0.632, wrist_qc=0.02, z_mast=1.35, x_carriage=0.45, bridge_per_m=1.6, y_carriage=0.35,
              tiller=0.45, cable_chain=0.25)       # kg, ASSUMED except the SO-101 (URDF sum)
TOOLS = {   # id: (name, mass kg, length mm from the gripper frame to the working tip, mount)
    "T0": ("soft egg gripper (native SO-101 jaws + silicone pads)", 0.02, 0.0, "jaws"),
    "T1": ("droppings-board scraper, 200 mm HDPE blade", 0.09, 120.0, "wrist QC"),
    "T2": ("litter rake / fork, 3 tines x 120 mm", 0.08, 150.0, "wrist QC"),
    "T3": ("nest-box brush, 100 mm", 0.06, 120.0, "wrist QC"),
    "T4": ("wet-spot scoop, 80 ml", 0.07, 130.0, "wrist QC"),
    "T5": ("OPTIONAL water/feeder check probe or spray nozzle", 0.05, 120.0, "wrist QC"),
    "M1": ("litter tiller: 12 V gearmotor + 90 mm spiral tines (on the Z mast)", 0.45, 260.0, "mast"),
}
DOCK = dict(y=COOP_Y0 + 2 * T2 + 2.0, z_hook=1340.0,   # plate on the front studs/posts, tools hang in forks
            slots={"T2": 180.0, "T3": 275.0, "T4": 365.0, "T1": 945.0, "T5": 1062.0})   # x of each fork (left + right of the pop door)
GX_RANGE = (130.0, 1090.0)                        # arm-base x (mast) travel
GY_OFF = 60.0                                     # mast/arm base sits this far in front (-Y) of the bridge centre
EGG_CHUTE = dict(mouth=(1170.0, 2620.0, 1110.0), drawer=(1330.0, 2615.0, 905.0))   # inside mouth top, exterior drawer centre
COLORS_SC.update({"foam": (0.78, 0.80, 0.62), "bedding": (0.86, 0.74, 0.50), "siding": (0.74, 0.58, 0.40),
                  "hdpe": (0.92, 0.93, 0.90), "belt": (0.08, 0.08, 0.08), "chain": (0.25, 0.25, 0.27),
                  "fan": (0.20, 0.22, 0.25), "drop": (0.80, 0.82, 0.84)})
