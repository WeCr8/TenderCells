"""TenderCells Chicken Tender - family coop + run (TC-CHKN-BUILD-001 rev A) - MASTER_LAYOUT parameters.

Reuses the CT72 cell CAD conventions (hardware/ct72-cell/cad/ct72_params.py, PR #182): every primary
dimension lives here, the model works in mm, and nothing downstream hard-codes geometry.
The CT72 size preset 2 (M = 48 x 48 x 72 in) is the footprint the build guide calls "the spec's Medium",
and the nest-box rule (12 in cube interior, 1 box per 4 hens, minimum 2) is carried over from CT72 A1.2.
Wood sizes and positions come from docs/CHICKEN_TENDER_BUILD_GUIDE.md (cut list, section 4).

Coordinate frame: origin = run-door end, left, ground. +X = left->right (4 ft wide),
+Y = run end -> coop back (12 ft long), +Z = up. The coop sits at the +Y end: its front wall
(pop door + ramp) faces the run, its back wall (cleanout door) faces out, nest box on the right (+X).
"""
IN = 25.4

# ---------------------------------------------------------------- reused from CT72 (ct72_params.py)
CT72_SIZE_PRESET = 2                 # 1=S 36x36x60, 2=M 48x48x72, 3=L 72x72x96
CT72_PRESETS = {1: (36, 36, 60), 2: (48, 48, 72), 3: (72, 72, 96)}
COOP_W_IN, COOP_D_IN, RUN_H_IN = CT72_PRESETS[CT72_SIZE_PRESET]   # 48 x 48, run walls 72
FLOCK_SIZE = 4                       # build guide capacity (CT72 assumed 8)
HENS_PER_BOX = 4
NEST_BOX_COUNT = max(2, -(-FLOCK_SIZE // HENS_PER_BOX))            # spec minimum 2
NB_IN = 12 * IN                      # 12 x 12 x 12 in nest box interior (same as CT72 NB_IN)

# ---------------------------------------------------------------- lumber (actual sizes)
L2X4 = (1.5 * IN, 3.5 * IN)
L2X2 = (1.5 * IN, 1.5 * IN)
L1X2 = (0.75 * IN, 1.5 * IN)
PLY_WALL = 15 / 32 * IN              # 15/32 CDX
PLY_FLOOR = 0.75 * IN                # 23/32 (3/4) CDX
ROOF_PANEL_T = 0.25 * IN             # corrugated steel envelope (ribs not modelled)
MESH_T = 0.05 * IN                   # 1/2 in hardware cloth, modelled as a thin sheet

# ---------------------------------------------------------------- overall
COOP_W = COOP_W_IN * IN              # 48 in
COOP_D = COOP_D_IN * IN              # 48 in
RUN_OPEN_L = 96 * IN                 # 8 ft open run
TOTAL_L = RUN_OPEN_L + COOP_D        # 12 ft
COOP_Y0 = RUN_OPEN_L                 # coop front face (outside of floor rim)
COOP_Y1 = COOP_Y0 + COOP_D           # coop back face

# ---------------------------------------------------------------- coop heights (guide section 1 table)
FLOOR_FRAME_Z0 = 24 * IN             # raised 24 in
FLOOR_FRAME_Z1 = FLOOR_FRAME_Z0 + L2X4[1]          # 27.5
FLOOR_TOP_Z = FLOOR_FRAME_Z1 + PLY_FLOOR           # 28.25 = guide 28-1/4
FRONT_WALL_TOP = 72 * IN
BACK_WALL_TOP = 60 * IN
FRONT_POST_H = 75.5 * IN
BACK_POST_H = 63.5 * IN
ROOF_SLOPE = 3 / 12
RAFTER_OVERHANG = 6 * IN
RAFTER_L = 60 * IN                   # C7 cut length
PURLIN_L = 54 * IN                   # C8
HEADER_L = 41 * IN                   # C6

# ---------------------------------------------------------------- openings (in, from the cut list)
POP_DOOR = (10 * IN, 11 * IN)        # W x H, front wall P2
POP_SILL_Z = 30.75 * IN
POP_DOOR_PANEL = (12 * IN, 13 * IN)  # P5
CLEANOUT = (36 * IN, 28 * IN)        # back wall P3
CLEANOUT_Z0 = FLOOR_TOP_Z + 1 * IN   # assumption: 1 in above the floor so litter stays in
NEST_HOLE = (24 * IN, 12 * IN)       # right side wall P4
NEST_FLOOR_Z = FLOOR_TOP_Z + 4 * IN  # nest box floor 4 in above the coop floor
WINDOW = (18 * IN, 12 * IN)          # left side wall P4
WINDOW_Z0 = 52 * IN                  # assumption (guide gives size only)
WINDOW_Y_FROM_FRONT = 8 * IN         # assumption

# ---------------------------------------------------------------- roost
ROOST_L = 45 * IN                    # C12
ROOST_TOP_Z = FLOOR_TOP_Z + 20 * IN  # 20 in above the coop floor
ROOST_FROM_BACK = 14 * IN

# ---------------------------------------------------------------- nest box P6 (3/4 offcut)
NB_LEN = 25.5 * IN                   # bottom / outer wall length (2 boxes + divider)
NB_OUTER_H = 14 * IN
NB_LID = (27 * IN, 16 * IN)
NB_LIP_H = 4 * IN

# ---------------------------------------------------------------- ramp P7
RAMP = (10 * IN, 48 * IN)
RAMP_CLEAT_PITCH = 6 * IN

# ---------------------------------------------------------------- run
RUN_POST_H = RUN_H_IN * IN           # R4 72 in
RUN_MID_Y = COOP_Y0 - 48 * IN        # posts 4 ft from the coop
RUN_DOOR = (37 * IN, 66 * IN)        # R8/R9 frame
BRACE_L = 18 * IN                    # R7
APRON_W = 12 * IN

COLORS = {   # RGB 0..1 by layer
    "pt_lumber": (0.45, 0.55, 0.35),
    "lumber": (0.80, 0.65, 0.45),
    "ply": (0.85, 0.75, 0.55),
    "roof": (0.70, 0.72, 0.75),
    "mesh": (0.55, 0.55, 0.58),
    "door": (0.75, 0.35, 0.25),
}
