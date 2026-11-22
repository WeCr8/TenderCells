"""ELECTRONICS BAY parameters (Zach 2026-11-22): weather-protected bay hung under the raised coop.

Replaces the PR #189 guide-s7 back-wall control box (which clashed with the 36 in cleanout door) and the
second WROOM box. Frame/units as sc_params: mm, origin = run-door end / left / ground, +X right, +Y toward
the coop back, +Z up. Every value not taken from PR #188 / sc_params is marked  # ASSUMED.

Layout: EB1 "door + sensor" box (all tiers) under the back-LEFT of the pit pan; EB2 "motion" box (Plus/Pro:
gantry + cassette drivers, motor-rail relay, fuse block) under the back-RIGHT. The cassette worm gearmotor
hangs between them (x 580..680). Each box stands on a drop-down tray hinged on its bottom-back edge: pull one
spring pin, the top tips back through a latched service hatch in the back under-coop skirt and rests on two
stay arms at 90 deg, lid facing UP, lid at ~11.5 in above grade. All cables leave through the box BOTTOM
(glands + M12 breather), drip-loop, and rise to the coop in ONE sealed 1-1/2 in PVC chase on the front face
of the back-left corner post. EB2 joins the chase through a 1 in raceway under the pan.
"""
import os
import sc_params as P

IN = P.IN
EBAY = os.environ.get("EBAY", "1") not in ("0", "", "off", "no")   # 0 = legacy back-wall control box

# ---------------------------------------------------------------- enclosure (one size class for both boxes)
ENCL = dict(w=300.0, h=200.0, d=130.0, wall=3.5)   # W(X) x H(Z) x D(Y): IP65/IP66 polycarbonate junction box with
                                                   # hinged clear lid + steel/PC mounting plate, UV-stabilised
                                                   # (generic PC/ABS IP65 class, 300x200x130). ASSUMED. 250 tall was the first
                                                   # pick: tipping on its bottom-back hinge its top corner rises to
                                                   # hinge + sqrt(h^2 + d^2) and would hit the pan; 200 tall swings clear
ENCL_NAME = "IP66 polycarbonate enclosure 300 x 200 x 130 mm, hinged clear lid, mounting plate (UV-stabilised)"  # ASSUMED
DIN_RAILS_Z = (55.0, 140.0)                        # rail centre heights above the box inside floor (2 x 35 mm rails), ASSUMED
DIN_RAIL_L = 260.0

# ---------------------------------------------------------------- placement under the pit pan
SPLASH_MIN = 6 * IN                                # 152 mm: box bottom must stay above splash height
EB_Z0 = 171.0                                      # box bottom (stowed): 6.7 in; gland tips (18 mm) at 6.0 in
DRIP_T = 1.2                                       # 18 ga aluminium drip roof, ASSUMED
DRIP_GAP = 5.0                                     # roof sits 5 mm under the pan on nylon spacers (air gap, no wick)
HANGER = 38.0                                      # 1-1/2 in aluminium angle hanger frame depth, ASSUMED
EB_Z1 = EB_Z0 + ENCL["h"]                          # 371 stowed top
DOOR_FLOOR_GAP_MIN = 4 * IN                        # Zach 2026-11-22: >= 4 in from the floor bottom to the bay top where doors open
EB_HINGE_Y = P.COOP_Y1 - 15.0                      # tray hinge line (bottom-back edge), just inside the back skirt plane
EB_Y1 = EB_HINGE_Y - 8.0                           # box back face (tray plate 8 mm behind it)
EB_Y0 = EB_Y1 - ENCL["d"]                          # box front (lid) face, stowed
TRAY_PLATE = (ENCL["w"] + 30.0, ENCL["h"] + 20.0, 6.0)   # 6 mm HDPE/aluminium tray plate, ASSUMED
EB1_X = (165.0, 165.0 + ENCL["w"])                 # back-left: hanger legs clear the back-left post (x 38..127), 115 mm to the gearmotor (x 580)
EB2_X = (P.COOP_W - 165.0 - ENCL["w"], P.COOP_W - 165.0)   # back-right (Plus/Pro): 74 mm to the gearmotor (x 680)
EB2_CFGS = ("plus", "pro")
OPEN_DEG = 90.0                                    # tray tips back 90 deg onto two stay arms (stop + chain)

# ---------------------------------------------------------------- service hatches in the back under-coop skirt
HATCH_Y = P.COOP_Y1 + P.PLY_WALL + P.CL_UNDER_OFF  # chain-link plane at the back
HATCH_PAD = 40.0                                   # opening margin around the box/tray swing
HATCH_Z = (100.0, P.UNDER_BACK_FABRIC_TOP - 10.0)  # 1x2 PT frame, 1/2 in hardware-cloth infill, bottom-hinged,
                                                   # two-step latch (barrel bolt + carabiner) + padlock hasp

# ---------------------------------------------------------------- chase + raceway + drip loops
CHASE_OD = 48.3                                    # 1-1/2 in Sch 40 grey UV PVC conduit
CHASE_X = 82.0                                     # on the front face of the back-left post (post x 38..127)
CHASE_Y = P.COOP_Y1 - 2 * P.T2 - CHASE_OD / 2 - 7.0   # 7 mm in front of the post (front face y 3581); 6 mm behind the droppings board
CHASE_Z0 = 210.0                                   # open bell end, facing DOWN, duct-seal packed
CHASE_TOP_ABOVE_FLOOR = 300.0                      # LB fitting 300 mm above the floor ledge (above bedding/peck height)
RISER_X = 105.0                                    # inside the coop: cables leave the LB and climb in split loom on the
RISER_Y = P.COOP_Y1 - 2 * P.T2 - 5.0               # front face of the back-left post (x 38..127), clear of the SD1 latch-side
                                                   # jack (x 0..38) and the left Y motor (x 34..76), to the top plate, then forward
TRUNK_X = 70.0                                     # in-coop trunk under the left top plate: clear of the SD1 window stud
                                                   # (x 0..38) and the V1 exhaust fan (x 10..48); was x 20 in the guide route
RACEWAY_OD = 33.4                                  # 1 in Sch 40 PVC, EB2 -> chase, under the pan in front of the gearmotor
RACEWAY_Y = P.COOP_Y1 - 200.0                      # gearmotor y 3497..3617 -> raceway runs in front of it
RACEWAY_Z = P.PIT_BOTTOM - 25.0
DRIP_OVERHANG = 35.0                               # drip roof overhang past the box
DRIP_LOOP_LOW_Z = 110.0                            # lowest cable point between gland and chase bell (4.3 in), ASSUMED

# ---------------------------------------------------------------- E-STOP station (moves to the operator position)
ESTOP_STATION = dict(x=76.0, z=43 * IN, size=(72.0, 72.0, 85.0))   # 1-hole IP65 22 mm station on the back wall strip
                                                                   # left of SD2 (skin starts x 153), 43 in, ASSUMED;
                                                                   # cable drops outside the siding in 3/8 in liquid-tight flex
ESTOP_NC_BLOCKS = 3                                # 1: XIAO DRV8874 SLEEP, 2: WROOM GPIO32, 3: EB2 motor-rail relay coil

# ---------------------------------------------------------------- power (no mains in the bay)
PS_LOGIC = "12 V 3 A Class 2 adapter (PS1, PR #188) - door + sensors, all tiers"
PS_MOTOR = "12 V 8 A (96 W) Class 2 adapter (PS2) - motor rail, Plus/Pro"   # ASSUMED; Class 2 caps 100 VA at 12 V
POWER_BUDGET_A = {   # 12 V peak per load, ASSUMED/listing values; firmware never runs gantry + cassette together
    "door actuator (DRV8874 limit)": 2.0, "XIAO + WROOM + MQ-137 heater (via bucks)": 0.45,
    "exhaust fan": 0.9, "damper servos x3 (5 V buck, peak)": 0.6,
    "gantry NEMA17 x4 (TMC2209, 1.0 A rms, avg supply draw)": 2.4, "SO-101 STS3215 bus (typical moving)": 3.0,
    "cassette gearmotor (rated / 3.5 stall)": 1.6, "litter tiller gearmotor": 1.0,
}
HEAT_W = {"bucks + drivers idle": 1.5, "TMC2209 x4 moving": 4.0, "G2 18v17 at 1.6 A": 1.0, "relay coil": 0.4,
          "XIAO + WROOM Wi-Fi": 1.2}   # W, ASSUMED

# colours: ebay.py uses the existing COLORS / COLORS_SC layer keys only (box, hood, metal, rail, pcb, dark, estop, mesh, pt_lumber)
