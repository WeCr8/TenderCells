"""HUMAN SERVICE DOORS on the framed coop house (Zach 2026-11-22 08:31): the house sides open so a person can
change bedding, deep-clean and service the gantry/arm, and the house still closes up sealed like a shed.

Frame/units as sc_params: mm, origin = run-door end / left / ground, +X right, +Y toward the coop back, +Z up.
Every value not taken from sc_params / coop_params is marked  # ASSUMED.

Layout (see docs/CHICKEN_TENDER_SHOWCASE.md "Service doors"):
  SD1  LEFT wall, full bay between the corner posts, BELOW the left gantry rail: bedding / floor / roost door.
       Hinged on the front post, swings 180 deg flat along the run's left chain-link.
       Its header is a 2x4 on edge that the left Y rail now bolts to over its whole length.
  SD2  BACK wall, the old 36 x 28 cleanout grown to 35.5 x 35.1 in (slot header to top plate): deep-clean,
       droppings board, gantry/arm service. Hinged on the +X (right-hand, seen from inside) jack so it swings
       180 deg flat against the back wall, away from the back-left E-STOP / control-box strip.
  RIGHT wall: no human door. The nest box/hood, egg chute, V2 and the right rail fill it, and the nest floor
       is only 4 in above the coop floor, so a panel "below the nest box" would open onto the floor frame and
       pit wall, not the bedding. Nest/egg service stays on the nest lid (Starter) / hood door (Plus/Pro).
Door skin = the wall siding (15/32 T1-11 style), inset in an over-size siding cut so it laps the 2x4 door
frame by LAP and compresses an EPDM bulb on the frame face (shed-style seal); 1x4 Z-brace inside; strap
T-hinges with the pin outboard of the skin (180 deg); two barrel bolts + carabiners; Z-flashing drip cap.
"""
import os
import sc_params as P

IN = P.IN
SERVICE_DOORS = os.environ.get("SERVICE_DOORS", "1") not in ("0", "", "off", "no")
T, T2, W2, S2 = P.PLY_WALL, P.T2, P.W2, P.S2
Y0, Y1, CW = P.COOP_Y0, P.COOP_Y1, P.COOP_W

# ------------------------------------------------------------------ door construction (both doors)
LAP = 0.75 * IN            # siding cut is this much bigger than the 2x4 frame opening on each side (door laps the frame)
GAP = 3.0                  # skin to siding-cut gap (paint + swelling)
PROUD = 3.0                # skin stands 3 mm proud of the siding = EPDM compression gap on the frame face
SKIN_T = T                 # door skin: same 15/32 siding as the wall
BRACE_T, BRACE_W = 0.75 * IN, 3.5 * IN   # 1x4 Z-brace (rails + diagonal), inside face of the skin
BRACE_INSET = 6.0          # brace stays this far inside the frame opening (clears the jambs on the swing)
EPDM = dict(w=12.0, t=3.0)  # 1/2 in self-adhesive EPDM bulb/D-profile on the frame face, 3 mm compressed  # ASSUMED
HINGE = dict(strap_w=38.0, strap_t=3.0, pin_r=5.0, pin_out=12.0, leaf_l=45.0)  # galv. T-strap hinge; pin 1/2 in outboard of the skin
                                                                               # (T-leaf on a 3/8 in spacer block) so the open door clears the run  # ASSUMED
OPEN_DEG = 180.0
LATCH = "4 in barrel bolt + 1/4 in stainless carabiner through the bolt handle (two steps), x2 per door"  # ASSUMED
DRIP = dict(out=26.0, t=3.0, flange=45.0)   # galv. Z-flashing drip cap: 1 in out over the skin top  # ASSUMED

# ------------------------------------------------------------------ SD1: left wall, below the gantry rail
# frame: 2x4-flat jack studs sistered to the outside face of the front/back corner posts (posts = kings),
# 2x2 corner kings, 2x2 sill on the floor ledge (litter dam; a 2x4 flat would hit the roost studs at x 38),
# 2x4-on-edge header under the window.
SD1_JACK_F = (Y0 + T2, Y0 + T2 + W2)                 # hinge-side jack (y), on the front post (post y 2476..2515)
SD1_JACK_B = (Y1 - T2 - W2, Y1 - T2)                 # latch-side jack (y), on the back post (post y 3581..3620)
SD1_SILL = (P.FLOOR_TOP_Z, P.FLOOR_TOP_Z + T2)       # 2x2 on the floor ledge, x 0..38 (keeps kicked litter in)
SD1_HEADER_TOP = P.GY_RAIL_Z[0] + 44.0               # 1309: 1 mm under the left Y cable-chain tray (gantry.py, z 1310) and
                                                     # 12 mm under the window (1320.8); the 2040 rail (1265-1305) bolts to its face
SD1_HEADER = (SD1_HEADER_TOP - W2, SD1_HEADER_TOP)   # 2x4 on edge; spans the gantry rail z (left rail bolts to it)
SD1 = dict(id="SD1", wall="left", hinge="front", y0=SD1_JACK_F[1], y1=SD1_JACK_B[0], z0=SD1_SILL[1], z1=SD1_HEADER[0],
           purpose="bedding top-up / raking, floor ledge, roost + droppings-board front edge, waterer; robot work zone at hen level")
SD1_RAIL_STANDOFF = 45.0 - T2                        # 7 mm HDPE spacer between the header face and the 2040 (GY_RAIL_X[0] = 45)
SD1_RAIL_BOLTS_Y = (2560.0, 2890.0, 3220.0, 3550.0)  # M5 T-nut + 1/4 in lag every ~300 mm into the header  # ASSUMED

# ------------------------------------------------------------------ SD2: back wall (bigger cleanout)
# frame: 2x4-flat jacks, 2x2 kings to the floor rim stubs, 2x4-on-edge header under the back top plate,
# sill = the existing bed-slot header (2x4 flat). Opening starts at x 6.5 in so the latch side stays clear of
# the back-left E-STOP station / legacy control box strip (x 0..152).
SD2_X0 = 6.5 * IN                                    # 165.1: latch side (-X)
SD2_X1 = CW / 2 + 18 * IN                            # 1066.8: hinge side (+X), same as the old cleanout's +X edge
SD2_Z0 = P.SLOT["z1"] + T2                           # 809.8: top of the bed-slot header
SD2_Z1 = P.POST_TOP_Z - W2                           # 1701.8: under a 2x4-on-edge header under the top plate
SD2_LAP_LATCH = 12.0                                 # latch-side lap cut to 12 mm (skin stays clear of the E-STOP/ctrl box)
SD2_LAP_BOTTOM = 12.0                                # bottom lap 12 mm (keeps a siding strip for the bed-slot gasket)
SD2_JACK_L = (SD2_X0 - W2, SD2_X0)
SD2_JACK_R = (SD2_X1, SD2_X1 + W2)
SD2_KING_L = (SD2_JACK_L[0] - S2, SD2_JACK_L[0])
SD2_KING_R = (SD2_JACK_R[1], SD2_JACK_R[1] + S2)
SD2 = dict(id="SD2", wall="back", hinge="right(+X)", x0=SD2_X0, x1=SD2_X1, z0=SD2_Z0, z1=SD2_Z1,
           purpose="deep clean (scrape walls, pit pan, droppings board), gantry/arm/tool-dock service, cassette slot check")

# ------------------------------------------------------------------ door reeds (robot interlock)
# Surface-mount alarm-type magnetic contact, closed when the magnet is home (door shut), 2-wire, 0.5 A / 100 V. ASSUMED.
# Wire: each to its own MCU input (diagnostics) AND all in series with the EB2 motor-rail relay coil, after the
# E-STOP NC block, so an open door drops motor power in hardware (the pop door is not on this rail).
DOOR_REEDS = {
    "RS-SD1": dict(door="SD1", wall="left", where="latch-side jack (back post), opening face, 37 in above grade",
                   pos=(18.0, SD1_JACK_B[0] - 5.0, 975.0), closed_when="magnet home", gap_mm=5.0),
    "RS-SD2": dict(door="SD2", wall="back", where="latch-side jack (-X), opening face, 50 in above grade",
                   pos=(SD2_X0 + 5.0, Y1 - 20.0, 1265.0), closed_when="magnet home", gap_mm=3.0),
}
DOOR_INTERLOCK = dict(
    rule="any service-door reed open -> gantry X/Y/Z, SO-101 torque, litter tiller and cassette drive stop + disable; "
         "no motion is allowed to start while any door reads open",
    hardware="RS-SD1 + RS-SD2 in series with the EB2 motor-rail relay coil (after the E-STOP NC block)",
    debounce_ms=50, resume="all doors closed for 2 s AND an operator re-arm (app button) - never auto-restart",
    pop_door="not interlocked (hens' door; keeps its current limit + reeds RS1/RS2)",
    service_pose="before opening: send the gantry to SERVICE_POSE so the arm is at the back door, then E-STOP or open")
SERVICE_POSE = (CW / 2, Y1 - 2 * T2 - 120.0, P.GZ_TOP)   # mast at the back, base up  # ASSUMED

# ------------------------------------------------------------------ sensors that sat on the SD1 opening (for the electronics owner)
# DHT20 (S1), DHT22 and the MQ-137 cage were on the inside of the left wall at y ~2692 / 3048, z 1000-1100,
# which is now the SD1 opening. New home: the inner (back) face of the FRONT-LEFT post, same heights
# (already applied in sc_model.electronics_parts by the 2026-11-22 e-bay change; kept here as the reference).
SENSOR_RELOCATE = {
    "S1 DHT20": dict(x=(48.0, 72.0), y=(Y0 + 2 * T2, Y0 + 2 * T2 + 6.0), z=P.DHT_Z),
    "DHT22": dict(x=(80.0, 105.0), y=(Y0 + 2 * T2, Y0 + 2 * T2 + 8.0), z=P.DHT_Z),
    "MQ137 cage": dict(x=(45.0, 105.0), y=(Y0 + 2 * T2, Y0 + 2 * T2 + 35.0), z=P.MQ_Z),
}
