"""TenderCells Chicken Tender Cell 72x72 - rev A1.2 draft (2026-10-16) - MASTER_LAYOUT parameters.
A1.2 = A1.1 + inverted arm on a 3D-printer-style belt gantry, LeRobot SO-101, nest-box bank with
robot egg pick, movable roost poles, routines and sim-to-real timing (see REVISION.md).

Every primary dimension of the model is derived here (brief TC-CHKN-FUSION-AGENT-001,
section 2.1 Master Layout Rule). Brief values are in inches; the model works in mm.
Change a value here and re-run build.py; nothing downstream hard-codes geometry.

Coordinate frame (all layers): origin = front-left-bottom outer corner of the frame
(bottom of the corner posts). +X = left->right, +Y = front->back, +Z = up.
"""
from dataclasses import dataclass, field

IN = 25.4

# ---------------------------------------------------------------- size preset
SIZE_PRESET = 3                      # brief 5.1: 1=S 36x36x60, 2=M 48x48x72, 3=L 72x72x96
PRESETS = {1: (36, 36, 60), 2: (48, 48, 72), 3: (72, 72, 96)}
PLATFORM_X = PRESETS[SIZE_PRESET][0] * IN   # outer frame footprint (A1 assumption)
PLATFORM_Y = PRESETS[SIZE_PRESET][1] * IN
PLATFORM_Z = PRESETS[SIZE_PRESET][2] * IN

# ---------------------------------------------------------------- extrusion (A1: replaces wood)
POST = 40.0            # 4040 corner posts
RING_T = 20.0          # 2040 ring members: 20 thick (horizontal), 40 tall
RING_H = 40.0
BRIDGE_W, BRIDGE_H = 20.0, 80.0      # 2080 Y bridge
MAST = 40.0            # 4040 Z mast
PANEL_T = 3.0          # guard panel / mesh-on-frame thickness envelope

# ---------------------------------------------------------------- brief clearances (5.4)
FRAME_WALL_CLEARANCE = 1.5 * IN
CEILING_CLEARANCE = 2.0 * IN
MODULE_CLEARANCE = 0.25 * IN
SERVICE_CLEARANCE = 2.0 * IN

INNER0 = POST                        # inner face of frame (x or y)
INNER1X = PLATFORM_X - POST
INNER1Y = PLATFORM_Y - POST
# brief 5.5 SAFE_* measured from the inner frame faces (A1 assumption, see ASSUMPTIONS)
SAFE_X0, SAFE_X1 = INNER0 + FRAME_WALL_CLEARANCE, INNER1X - FRAME_WALL_CLEARANCE
SAFE_Y0, SAFE_Y1 = INNER0 + FRAME_WALL_CLEARANCE, INNER1Y - FRAME_WALL_CLEARANCE
SAFE_Z = PLATFORM_Z - CEILING_CLEARANCE

# ---------------------------------------------------------------- bedding / bin / roost (5.6-5.8)
BED_DEPTH_MAX = 12 * IN
BED_SAFETY_BUFFER = 6 * IN
BED_KEEPOUT_Z = BED_DEPTH_MAX + BED_SAFETY_BUFFER
POOP_BIN_HEIGHT = 8 * IN
POOP_BIN_WALL = 0.5 * IN
POOP_BIN_PULL_OUT = 24 * IN
POOP_BIN_FRONT_DOOR_CLEAR = 2 * IN
POOP_BIN_X = PLATFORM_X - 12 * IN
POOP_BIN_Y = 18 * IN
POOP_BIN_Z0 = RING_H                 # sits on the bottom-ring top so it slides over it
ROOST_DIAMETER = 2 * IN
ROOST_WALL_OFFSET = 3 * IN
ROOST_HEIGHTS = (24 * IN, 36 * IN, 48 * IN)
ROOST_SWEEP_BUFFER = 2 * IN
ROOST_Y0, ROOST_Y1 = 24 * IN, 60 * IN   # roost span along the LEFT wall (A1 assumption)

# ---------------------------------------------------------------- robot / rail (5.9-5.10)
ROBOT_Z0_OFFSET = 2 * IN
PLANE_FLOOR = 0.0
PLANE_BED_TOP = BED_DEPTH_MAX
PLANE_ROBOT_Z0 = PLANE_BED_TOP + ROBOT_Z0_OFFSET
ROBOT_ZONE_Z = min(48 * IN, PLATFORM_Z - BED_DEPTH_MAX - CEILING_CLEARANCE)
PLANE_ROBOT_TOP = PLANE_ROBOT_Z0 + ROBOT_ZONE_Z
ROBOT_PARK_HEIGHT = PLATFORM_Z - 12 * IN
PLANE_ROBOT_PARK = ROBOT_PARK_HEIGHT
ROBOT_SAFE_BUFFER = 2 * IN

# ring levels (bottom of the 40-tall member)
RING_LEVELS = {
    "BOTTOM": 0.0,
    "MID": PLANE_BED_TOP - RING_H,            # top face = PLANE_BED_TOP (brief 8.4)
    "RAIL": 88 * IN - RING_H,                 # overhead rail ring, top face 88 in (A1)
    "TOP": PLATFORM_Z - RING_H,               # top face = PLATFORM_Z (brief 8.6)
}
Z_RAIL_TOP = RING_LEVELS["RAIL"] + RING_H     # top face of X-rail beams
MGN12_W, MGN12_H = 12.0, 8.0
MGN15_W, MGN15_H = 15.0, 10.0
XCAR_H = 8.0      # X block above rail (simplified)
XPLATE_T = 6.0

# gantry stack heights
Z_XCAR0 = Z_RAIL_TOP + MGN12_H
Z_XPLATE0 = Z_XCAR0 + XCAR_H
Z_BRIDGE0 = Z_XPLATE0 + XPLATE_T
Z_BRIDGE1 = Z_BRIDGE0 + BRIDGE_H

# arm-mount (tool) plate offsets relative to bridge centre gx (A1 geometry)
ZPLATE_T = 12.7                   # 1/2 in aluminium (matches SolidWorks "6DOF mounting plate" role)
ARM_PLATE_X = 250.0               # plate size
ARM_PLATE_Y = 250.0
MAST_X1_OFF = -41.0               # mast +x face = gx-41
ARM_PLATE_X1_OFF = -117.0         # plate +x edge = gx-117
ARM_BASE_X_OFF = ARM_PLATE_X1_OFF - ARM_PLATE_X / 2   # arm base centre = gx-242

# travel limits (gx = bridge centre X, gy = Y-carriage centre Y, pz = arm plate BOTTOM Z)
GX_MIN = INNER0 + 10 + (-(ARM_PLATE_X1_OFF - ARM_PLATE_X)) + 0   # plate clears left posts by 10
GX_MAX = INNER1X - 10 - 57 - 10 - 0                              # Y motor (57) clears right posts
GY_MIN = INNER0 + 10 + ARM_PLATE_Y / 2
GY_MAX = INNER1Y - 135 - 0                                        # leaves cable-chain lane at the back
PZ_MAX = ROBOT_PARK_HEIGHT                                        # plate bottom at PLANE_ROBOT_PARK
PZ_MIN = 850.0   # A1.2: was 660 (26 in). Raised so the fixed Z mast bottom (PZ_MIN-20) sits ~21 in above the bed top
Z_TRAVEL = PZ_MAX - PZ_MIN
MAST_Z0 = PZ_MIN - 20
PARK = dict(gx=GX_MAX, gy=GY_MAX, pz=PZ_MAX)                       # back-right, raised

# ---------------------------------------------------------------- doors (5.11)
SERVICE_DOOR_W = 24 * IN
SERVICE_DOOR_H = 48 * IN
SERVICE_DOOR_Z0 = PLANE_BED_TOP
CHICKEN_DOOR_W = 10 * IN
CHICKEN_DOOR_H = 14 * IN
CHICKEN_DOOR_Y0 = 8 * IN          # on the RIGHT panel, at bed-top height
POOP_BIN_ACCESS_H = POOP_BIN_HEIGHT + 2 * IN

# ---------------------------------------------------------------- electronics (5.13)
CONTROL_BOX = (12 * IN, 16 * IN, 6 * IN)   # W x H x D
WATCHTOWER_POLE_DIA = 1.5 * IN
WATCHTOWER_POLE_H = 24 * IN
UR_CB = (475.0, 423.0, 268.0)              # UR e-series control box envelope, approx (verify)

# ---------------------------------------------------------------- tiers
TIERS = ("starter", "plus", "pro")          # BOM tiers
VARIANTS = ("starter", "plus", "pro", "pro_heavy")  # pro_heavy = UR3e on the stiff/ballscrew gantry option


@dataclass
class ArmSpec:
    name: str
    reach: float          # mm, spherical reach from base axis (datasheet-class, verify)
    payload_kg: float
    mass_kg: float
    proxy: tuple          # (base_dia, base_h, link_dia, link_len) for proxy geometry
    adapter_t: float = 10.0


ARMS = {
    # A1.2: Starter has NO arm - a soft vacuum-cup egg tool on a compliant plunger (top approach only).
    "starter": ArmSpec("Soft vacuum-cup egg tool (no arm)", 0.0, 0.07, 0.35, (40.0, 60.0, 30.0, 240.0)),
    # SO-101 follower (LeRobot), 6x Feetech STS3215-C047 12 V. Link lengths from the SO-101 URDF
    # (TheRobotStudio/SO-ARM100 Simulation/SO101/so101_new_calib.urdf): shoulder 116.6 mm below the
    # base face, upper arm 116 mm, forearm 135 mm, wrist->gripper frame 159 mm (+20 mm soft fingers).
    "plus": ArmSpec("SO-101 follower (LeRobot, STS3215-C047 12 V)", 430.0, 0.25, 1.2, (110.0, 117.0, 60.0, 430.0)),
    "pro": ArmSpec("SO-101 follower (LeRobot, STS3215-C047 12 V)", 430.0, 0.25, 1.2, (110.0, 117.0, 60.0, 430.0)),
    # UR3e: 500 mm reach, 3 kg payload, 11.2 kg (UR datasheet); real STEP geometry; needs the stiff gantry
    "pro_heavy": ArmSpec("Universal Robots UR3e (stiff/ballscrew gantry option)", 500.0, 3.0, 11.2, (128.0, 0, 0, 0), 12.0),
}
STARTER_TOOL_DROP = 12 * IN   # Starter "no arm" option: fixed tool on the Z plate


# =====================================================================================  rev A1.2
REV = "A12"                       # file prefix CT72_A12_
# ---- flock + coop sizing (assumption: 8 standard-size laying hens; Zach to confirm)
FLOCK_SIZE = 8
HENS_PER_BOX = 4                  # rule of thumb 1 box per 4-5 hens -> ceil(8/4) = 2
NEST_BOX_COUNT = -(-FLOCK_SIZE // HENS_PER_BOX)
ROOST_IN_PER_BIRD = 10            # 8-12 in per bird -> 80 in needed
FLOOR_SQFT_PER_BIRD = ((PLATFORM_X - 2 * POST) * (PLATFORM_Y - 2 * POST)) / IN ** 2 / 144.0 / FLOCK_SIZE

# ---- nest-box bank: LEFT wall (the arm plate hangs -X of the bridge, so the base gets closest there)
NB_IN = 12 * IN                   # 12 x 12 x 12 in interior
NB_WALL = 12.0                    # 1/2 in ply / HDPE
NB_FLOOR_Z = 30 * IN              # interior floor (top of liner seat) 18 in above bed top
NB_LINER_T = 15.0                 # removable rubber/PP nest pad liner (slides out the aisle side)
NB_LIP_H = 60.0                   # front lip above the liner (keeps the pad in; arm reaches over it)
NB_TOPRAIL_H = 40.0               # front top rail (stiffens the box; side opening is below it)
NB_X0 = RING_T                    # back of the bank against the left ring plane
NB_X1 = NB_X0 + NB_IN + 2 * NB_WALL           # aisle face (front, -> +X)
NB_Y0 = 420.0                     # first box (y), boxes run toward the back
NB_PITCH = NB_IN + NB_WALL
NB_TOP_Z = NB_FLOOR_Z + NB_IN
NB_LID_T = 12.0
NB_LID_LEN = NB_IN + 2 * NB_WALL + 20.0       # lid hinged at the wall edge, opens to vertical
NB_SHELF_T = 18.0
NB_RAIL_Z0 = NB_FLOOR_Z - NB_WALL - NB_SHELF_T - RING_H   # 2040 shelf rail under the bank
# ---- egg basket station (registered pocket + AprilTag), front-left, same height band
BK_IN = (270.0, 230.0, 150.0)     # pocket interior X, Y, Z (fits a ~250x200x120 wire/plastic egg basket)
BK_X0 = RING_T
BK_Y0 = 90.0
BK_FLOOR_Z = NB_FLOOR_Z
BK_LIP_H = 40.0
BK_HATCH = (240.0, 180.0)         # exterior egg-collection hatch in the LEFT guard panel (Y x Z)
# ---- movable roost bars: RIGHT wall, 2 x 42 in flat-top bars, swing DOWN to stow flat to the wall
ROOST_BAR_W, ROOST_BAR_T = 2.0 * IN, 1.5 * IN  # 2 in wide flat top
ROOST_BAR_LEN = 42 * IN
ROOST_Y0R = 430.0
ROOST_BARS = (                     # (name, top-face height deployed, swing radius from pivot)
    ("A", 48 * IN, 24 * IN),       # lower bar, further out (ladder step)
    ("B", 56 * IN, 12 * IN),       # upper bar, near the wall
)
ROOST_PIVOT_X = PLATFORM_X - RING_T - 30.0    # torque-tube axis, 30 mm in from the right ring plane
ROOST_TUBE_D = 25.4
ROOST_ARM_W, ROOST_ARM_T = 30.0, 6.0
ROOST_STOW_DEG = 90.0             # deployed = horizontal arm; stowed = arm hanging straight down
ROOST_SWEEP_BUFFER_A12 = 2 * IN

# ---- belt gantry (3D-printer style, Cartesian, dual-motor X): see GANTRY_SIZING.md
BELT = {"starter": "GT2-10mm", "plus": "GT2-10mm", "pro": "GT2-10mm", "pro_heavy": "HTD5M-15mm"}
X_GUIDE = {"starter": "vwheel", "plus": "mgn12", "pro": "mgn12", "pro_heavy": "mgn15"}
XY_MOTOR = {"starter": "N17", "plus": "N17", "pro": "N17", "pro_heavy": "N23"}
Z_DRIVE = {"starter": "TR8x2", "plus": "TR8x2", "pro": "TR8x2", "pro_heavy": "SFU1605_BRAKE"}
N17 = (42.3, 60.0)                # NEMA17 59-60 mm body (~0.59 Nm class)
N23 = (57.0, 76.0)
PULLEY_PD = {"GT2-10mm": 12.73, "HTD5M-15mm": 31.83}   # 20T GT2 / 20T HTD5M pitch dia (mm)
# universal plate rating (design intent: rated for the heaviest supported arm = UR3e)
PLATE_RATED_ARM_KG = 11.2
PLATE_RATED_PAYLOAD_KG = 3.0
ADAPTER_RINGS = {   # ring OD, thickness, vendor bolt pattern note (verify against vendor drawing)
    "starter": (120.0, 10.0, "vacuum-tool plunger block, 4x M6 on 50 mm grid"),
    "plus": (140.0, 10.0, "SO-101 base (printed ring, M6 to grid; base screws per SO-ARM100 STL - verify)"),
    "pro": (140.0, 10.0, "SO-101 base (printed ring, M6 to grid; base screws per SO-ARM100 STL - verify)"),
    "pro_heavy": (160.0, 12.0, "UR3e base flange (UR mounting drawing - verify), 6061 ring"),
}
# ---- soft egg gripping
EGG_BREAK_N = 34.0                # equatorial quasi-static failure 34 +/- 6 N (ICF11 Hens' eggs paper)
GRIP_FORCE_LIMIT_N = 6.0          # firmware cap at the fingertips (>= 5x below EGG_BREAK_N - 3 sigma)
GRIP_FORCE_TARGET_N = 2.5
VAC_LIMIT_KPA = 20.0              # Starter vacuum cup limit (cup dia 25 mm -> ~9.8 N max hold)
VAC_CUP_D = 25.0
# ---- timing (Plus/Pro dataset cells)
CAM_FPS = 30
CAM_SKEW_BUDGET_US = 1000
AUDIT_SECONDS = 60

# per-variant tool/arm base offset from the bridge centre gx (X). SO-101/UR3e hang from the plate centre;
# the Starter vacuum tool sits on an outrigger past the plate's -X edge so it reaches the wall-side
# half of each nest box while the fixed mast stays clear of the bank front (see VERIFICATION_A1.2.md).
BASE_X_OFF = {"starter": -400.0, "plus": ARM_BASE_X_OFF, "pro": ARM_BASE_X_OFF, "pro_heavy": ARM_BASE_X_OFF}
STARTER_TOOL_LEN = 60.0 + 240.0 + 15.0      # plunger + tube + cup
EGG_R = 22.0                                 # egg lying on its side, centre above the liner
