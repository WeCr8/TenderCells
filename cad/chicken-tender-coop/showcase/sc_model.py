"""Chicken Tender coop SHOWCASE model (build123d): the PR #189 coop + working doors, egg handling,
robot-arm options and the PR #188 electronics, each part placed, labelled and tied to an animation node.

Configs: base (no robot, hinged P6 nest lid), starter (vacuum picker on a Y/Z rail), plus (SO-101
inverted under the egg-bay hood), pro (SO-101 on a short Y gantry). Parameters: sc_params.py.
"""
from __future__ import annotations
import math
from dataclasses import dataclass, field
import numpy as np
from build123d import Box, Cylinder, Sphere, Pos, Rot, Location, scale, Compound
import sc_params as P
import coop_model as CM

ALL = ("base", "starter", "plus", "pro")
ROBOT = ("starter", "plus", "pro")


@dataclass
class SPart:
    pid: str                 # cut-list ID / BOM ref / showcase ID
    name: str
    layer: str               # colour key (coop COLORS or COLORS_SC)
    step: int                # build-order step (exploded view)
    shape: object            # build123d shape, world coordinates at the rest pose
    node: str = "static"     # animation node
    configs: tuple = ALL
    bom: str = ""            # BOM cross-check key ('' = structure, see the cut list)
    alpha: float = 1.0
    in_step: bool = True     # exported to STEP
    length_in_hint: float = 0.0   # cut length for the cut list (in)
    mesh_override: tuple = ()     # renderer/GLB geometry override, e.g. chain-link wire strips


def box(x0, x1, y0, y1, z0, z1):
    return CM.box(x0, x1, y0, y1, z0, z1)


def cyl(p0, p1, r):
    """Cylinder between two points."""
    p0, p1 = np.asarray(p0, float), np.asarray(p1, float)
    v = p1 - p0; L = float(np.linalg.norm(v)); d = v / L
    c = Cylinder(r, L)                                     # along Z, centred
    ax = np.cross([0, 0, 1], d); s = np.linalg.norm(ax)
    ang = math.degrees(math.atan2(s, d[2]))
    loc = Location((0, 0, 0))
    if s > 1e-9:
        loc = Location((0, 0, 0), tuple(ax / s), ang)
    m = (p0 + p1) / 2
    return Pos(*m) * (loc * c)


def ellipsoid(c, r):
    return Pos(*c) * scale(Sphere(1.0), by=tuple(r))


# ------------------------------------------------------------------------------ steps (kid build order)
STEPS = ["Floor frame", "Posts", "Floor + bed cassette", "Walls", "Roof", "Run frame", "Doors", "Hardware cloth + apron",
         "Nest box, roost, ramp", "Door electronics + vents", "Robot egg bay", "Gantry + tool dock"]
STEP_OF = {"C1": 0, "C2": 0, "C3": 0, "C4": 1, "C5": 1, "P1": 2, "P2": 3, "P3": 3, "P4": 3, "C9": 3,
           "C6": 4, "C7": 4, "C8": 4, "ROOF": 4, "R1": 5, "R2": 5, "R3": 5, "R4": 5, "R5": 5, "R6": 5, "R7": 5,
           "HC": 7, "C11": 8, "C12": 8, "P7": 8, "1x2": 8}


def coop_structure():
    import house as H
    """PR #189 parts minus the ones the showcase rebuilds (doors, nest box, outside pop-door guides)."""
    drop_names = ("pop door (shown open)", "pop-door guide", "cleanout door (the cut-out)")
    out = []
    gable = P.HOUSE == "gable"
    for p in CM.all_parts():
        if p.name in drop_names or p.pid in ("P6",) or p.group in ("RUN", "MESH"):
            continue                      # run frame + hardware-cloth run/apron replaced by run_chainlink.py
        if gable and (p.pid in H.DROPPED_PIDS or (p.pid == "C1" and "back" in p.name)):
            continue                      # framed gable house + bed cassette replace these (house.py)
        out.append(SPart(p.pid, p.name, p.layer, STEP_OF.get(p.pid, 3), p.shape,
                         alpha=0.28 if p.layer == "mesh" else 1.0))
    if gable:
        return out
    # side top nailers C10 (cut list, not in the PR #189 CAD): along the top of each side wall, inside
    ang = math.atan((P.FRONT_WALL_TOP - P.BACK_WALL_TOP) / P.COOP_D)
    for x0, side in ((0, "left"), (P.COOP_W - P.S2, "right")):
        Lc = P.COOP_D - 2 * P.S2
        yc = (P.COOP_Y0 + P.COOP_Y1) / 2
        zc = (P.FRONT_WALL_TOP + P.BACK_WALL_TOP) / 2 - P.S2 / 2
        out.append(SPart("C10", f"wall top nailer {side}", "lumber", 3,
                         Pos(x0 + P.S2 / 2, yc, zc) * Rot(math.degrees(ang), 0, 0) * Box(P.S2, Lc, P.S2)))
    return out


# ------------------------------------------------------------------------------ doors
def cleanout_z0():
    return P.CLEANOUT_Z0_NEW if P.HOUSE == "gable" else P.CLEANOUT_Z0


def door_parts():
    S = []
    dw, dh = P.DOOR_PANEL
    dx0 = P.XC - dw / 2
    y0 = P.DOOR_Y0
    z0 = P.DOOR_Z_CLOSED
    S.append(SPart("P5", "pop door 12x13 (cord lift, gravity close)", "door", 6,
                   box(dx0, dx0 + dw, y0, y0 + P.DOOR_T, z0, z0 + dh), node="pop_door"))
    S.append(SPart("ANCHOR", "door anchor (printed)", "dark", 9,
                   box(P.XC - 15, P.XC + 15, y0 + P.DOOR_T, y0 + P.DOOR_T + 12, z0 + dh - 30, z0 + dh), node="pop_door", bom="PLA/PETG"))
    S.append(SPart("MAG", "reed magnet on the door", "dark", 9,
                   box(dx0 + dw - 30, dx0 + dw - 8, y0 + P.DOOR_T, y0 + P.DOOR_T + 8, z0 + 10, z0 + 40), node="pop_door", bom="RS1 RS2"))
    # guides C14 + lips C15 INSIDE the front wall (guide step 8)
    for gx, side in ((dx0 - P.DOOR_SLACK - P.S2, "left"), (dx0 + dw + P.DOOR_SLACK, "right")):
        S.append(SPart("C14", f"pop-door guide {side} (inside)", "lumber", 6,
                       box(gx, gx + P.S2, y0, y0 + P.S2, P.GUIDE_Z0, P.GUIDE_Z0 + P.GUIDE_L)))
        lx = gx + P.S2 - 19 if side == "left" else gx
        lx0, lx1 = (gx + P.S2 - 0, gx + P.S2 + 19) if side == "left" else (gx - 19, gx)
        S.append(SPart("C15", f"guide lip {side}", "lumber", 6,
                       box(lx0, lx1, y0 + P.DOOR_T + 1.5, y0 + P.DOOR_T + 1.5 + 19, P.GUIDE_Z0, P.GUIDE_Z0 + P.GUIDE_L)))
    S.append(SPart("STOP", "door stop block at the guide bottom (ASSUMED, printed guide segment)", "dark", 9,
                   box(dx0 - P.DOOR_SLACK - P.S2, dx0 + dw + P.DOOR_SLACK + P.S2, y0, y0 + P.DOOR_T + 2, z0 - 12, z0),
                   bom="PLA/PETG"))
    # reeds on the right guide
    gx = dx0 + dw + P.DOOR_SLACK
    for z, ref, nm in ((P.REED_CLOSED_Z, "RS1", "door-closed reed"), (P.REED_OPEN_Z, "RS2", "door-open reed")):
        S.append(SPart(ref, nm, "reed", 9, box(gx + 2, gx + 20, y0 + P.S2, y0 + P.S2 + 10, z - 15, z + 15), bom="RS1 RS2"))
    # cleanout door (human access) on the back wall, hinged on its left edge
    import service_params as SVP
    if P.HOUSE == "gable" and SVP.SERVICE_DOORS:
        return S                          # replaced by service door SD2 (house.service_door_parts)
    cw, ch = P.CLEANOUT
    cx0 = P.COOP_W / 2 - cw / 2
    yb = P.COOP_Y1 + P.PLY_WALL
    cz = cleanout_z0()
    S.append(SPart("P3", "cleanout / access door 36x28 (hinged)", "door", 6,
                   box(cx0, cx0 + cw, yb, yb + P.PLY_WALL, cz, cz + ch), node="cleanout"))
    S.append(SPart("C16", "cleanout door frame (2x2)", "lumber", 6,
                   box(cx0 + 20, cx0 + cw - 20, yb + P.PLY_WALL, yb + P.PLY_WALL + P.S2, cz + 20, cz + 20 + P.S2), node="cleanout"))
    S.append(SPart("LATCH", "barrel bolt + carabiner (two-step latch)", "metal", 6,
                   box(cx0 + cw - 80, cx0 + cw - 10, yb + P.PLY_WALL, yb + P.PLY_WALL + 15, cz + ch / 2 - 12, cz + ch / 2 + 12), node="cleanout"))
    return S


def door_mechanism():
    a = P.ACT[P.ACT_TIER]
    S = []
    x0, y, z = P.ACT_FIXED_X, P.ACT_Y, P.ACT_Z
    xr = x0 + a["extended"] - P.ACT_SLACK_AT_CLOSE          # rod-end hole at the closed rest pose
    body_len = a["retracted"] - 40
    S.append(SPart("BOARD", "actuator mounting board (2x4 on the front posts)", "lumber", 9,
                   box(P.T2, P.COOP_W - P.T2, P.MOUNT_BOARD_Y0, P.MOUNT_BOARD_Y0 + P.T2, z - P.W2 / 2, z + P.W2 / 2)))
    S.append(SPart("BRKT", "rear clevis bracket (printed) + M6 pin", "dark", 9,
                   box(x0 - 15, x0 + 15, P.MOUNT_BOARD_Y0 + P.T2, y + 10, z - 25, z + 25), bom="PIN-M6"))
    S.append(SPart("M1", f"12 V linear actuator, {a['stroke']:.0f} mm stroke ({P.ACT_TIER} tier)", "metal", 9,
                   cyl((x0, y, z), (x0 + body_len, y, z), a["body_d"] / 2), bom="M1"))
    S.append(SPart("M1", "actuator motor + gearbox", "dark", 9,
                   box(x0 + 20, x0 + 90, y - 22, y + 22, z - 60, z - 18), bom="M1"))
    S.append(SPart("M1R", "actuator rod + rod-end clevis", "metal", 9,
                   cyl((x0 + body_len - 60, y, z), (xr, y, z), a["rod_d"] / 2), node="act_rod", bom="M1"))
    S.append(SPart("PUL", "turnaround pulley 25 mm sheave + bracket (ASSUMED, not in PR #188 BOM)", "metal", 9,
                   cyl((P.PULLEY_X, y, z - 8), (P.PULLEY_X, y, z + 8), P.PULLEY_D / 2), bom="PULLEY"))
    S.append(SPart("PULB", "pulley bracket (printed)", "dark", 9,
                   box(P.PULLEY_X - 15, P.PULLEY_X + 15, P.MOUNT_BOARD_Y0 + P.T2, y + 5, z + 8, z + 14), bom="PULLEY"))
    ex, ey, ez = P.CORD_EYE
    S.append(SPart("EYE", "cord eye over the pop door (printed)", "dark", 9,
                   box(ex - 18, ex + 18, P.COOP_Y0, ey + 12, ez - 10, ez + 25), bom="PLA/PETG"))
    return S


def cord_geometry(lift):
    """Cord polyline for a door lift (mm). Returns points + segment lengths (for the BOM cord check)."""
    a = P.ACT[P.ACT_TIER]
    x0, y, z = P.ACT_FIXED_X, P.ACT_Y, P.ACT_Z
    xr = x0 + a["extended"] - P.ACT_SLACK_AT_CLOSE - lift
    ex, ey, ez = P.CORD_EYE
    door_top = P.DOOR_Z_CLOSED + P.DOOR_PANEL[1] + lift
    anchor = (P.XC, P.DOOR_Y0 + P.DOOR_T + 6, door_top - 15)
    pts = [(xr + 10, y, z), (P.PULLEY_X, y - P.PULLEY_D / 2, z), (P.PULLEY_X, y + P.PULLEY_D / 2, z),
           (ex, ey, ez), anchor]
    return pts


def cord_parts():
    pts = cord_geometry(0.0)
    S = []
    names = ["cord: rod end -> pulley", "cord: pulley wrap", "cord: pulley -> cord eye", "cord: eye -> door anchor"]
    nodes = ["cord_a", "static", "static", "cord_c"]
    for i in range(4):
        S.append(SPart("CORD", names[i], "cord", 9, cyl(pts[i], pts[i + 1], max(P.CORD_D, 2.5) / 2),
                       node=nodes[i], bom="CORD"))
    return S


# ------------------------------------------------------------------------------ nest boxes, eggs, basket
def nest_parts():
    t = P.NB_T
    x0, x1, y0, y1 = P.NB_X0, P.NB_X1, P.NB_Y0, P.NB_Y1
    zf = P.NEST_FLOOR_Z - t
    full = zf + P.NB_OUTER_H
    rim = P.NEST_FLOOR_Z + P.RIM_ROBOT
    S = [SPart("P6", "nest box bottom (flat floor)", "ply", 8, box(x0, x1, y0, y1, zf, P.NEST_FLOOR_Z)),
         SPart("P6", "nest box end (front)", "ply", 8, box(x0, x1 - t, y0, y0 + t, zf, full)),
         SPart("P6", "nest box divider", "ply", 8, box(x0, x1 - t, P.NB_DIV_Y - t / 2, P.NB_DIV_Y + t / 2, P.NEST_FLOOR_Z, P.NEST_FLOOR_Z + P.NB_IN), configs=("base",)),
         SPart("P6", "nest box divider cut to a 6 in rim (robot-ready)", "ply", 8, box(x0, x1 - t, P.NB_DIV_Y - t / 2, P.NB_DIV_Y + t / 2, P.NEST_FLOOR_Z, rim), configs=ROBOT)]
    # base config: full-height outer wall + back end + hinged lid (guide). Robot configs: 6 in rim inside the hood.
    S += [SPart("P6", "nest box outer wall", "ply", 8, box(x1 - t, x1, y0, y1, zf, full), configs=("base",)),
          SPart("P6", "nest box end (back)", "ply", 8, box(x0, x1 - t, y1 - t, y1, zf, full), configs=("base",)),
          SPart("P6", "nest box outer wall cut to a 6 in rim (robot-ready)", "ply", 8, box(x1 - t, x1, y0, y1, zf, rim), configs=ROBOT),
          SPart("P6", "nest box back end cut to a 6 in rim (robot-ready)", "ply", 8, box(x0, x1 - t, y1 - t, y1, zf, rim), configs=ROBOT)]
    z_hi = P.LID_HINGE_Z
    z_lo = full
    run = x1 + 1.5 * P.IN - x0
    ang = math.degrees(math.atan((z_hi - z_lo) / run))
    lid = Pos(x0, (y0 + y1) / 2, z_hi) * Rot(0, ang, 0) * Pos(P.NB_LID[1] / 2, 0, t / 2) * Box(P.NB_LID[1], P.NB_LID[0], t)
    S.append(SPart("P6", "nest box egg lid (hinged, exterior collection)", "door", 8, lid, node="nest_lid", configs=("base",)))
    for i, (ax0, ax1, ay0, ay1) in enumerate(P.NB_INNER):
        S.append(SPart("LINER", f"nest pad / liner box {i + 1}", "liner", 8,
                       box(ax0 + 4, ax1 - 4, ay0 + 4, ay1 - 4, P.NEST_FLOOR_Z, P.NEST_FLOOR_Z + P.LINER_T), bom="LINER"))
    return S


def egg_shape(c, along="y"):
    r = (P.EGG_D / 2, P.EGG_L / 2, P.EGG_D / 2) if along == "y" else (P.EGG_L / 2, P.EGG_D / 2, P.EGG_D / 2)
    return ellipsoid(c, r)


def egg_positions():
    out = []
    for b, (x0, x1, y0, y1) in enumerate(P.NB_INNER):
        cx, cy = (x0 + x1) / 2, (y0 + y1) / 2
        for dx in P.EGG_GRID:
            for dy in P.EGG_GRID:
                out.append({"box": b + 1, "id": f"B{b + 1}_{'LCR'[P.EGG_GRID.index(dx)]}{'FMB'[P.EGG_GRID.index(dy)]}",
                            "pos": (cx + dx, cy + dy, P.EGG_Z)})
    return out


SHOW_EGGS = ("B1_CM", "B2_RB", "B2_LF")   # eggs shown in the scene; B1_CM is the one picked


def egg_parts():
    S = []
    for e in egg_positions():
        if e["id"] in SHOW_EGGS:
            S.append(SPart("EGG", f"egg {e['id']}", "egg", 8, egg_shape(e["pos"]),
                           node="egg_pick" if e["id"] == "B1_CM" else "static", in_step=False))
    return S


def basket_parts(cfg):
    if cfg == "base" or cfg in P.GANTRY_CFGS:
        return []                          # gantry configs: the egg tray sits in the exterior egg drawer (house.py)
    cx, cy = P.BASKET_PLUS if cfg in ("plus", "pro") else P.BASKET_RAIL
    L, W, H = P.BASKET_IN

    t = 3.0
    lx, ly = (L, W) if cfg == "starter" else (W, L)
    z0 = P.BASKET_FLOOR_Z
    sh = box(cx - lx / 2 - t, cx + lx / 2 + t, cy - ly / 2 - t, cy + ly / 2 + t, z0 - t, z0 + H * 0.8)
    sh -= box(cx - lx / 2, cx + lx / 2, cy - ly / 2, cy + ly / 2, z0, z0 + H)
    if cfg in ("plus", "pro"):         # arm-side lip lowered (notch) so the SO-101 jaws clear it
        sh -= box(cx - lx / 2 - t - 1, cx - lx / 2 + 1, cy - ly / 2, cy + ly / 2, z0 + P.TRAY_ARM_LIP, z0 + H)
    S = [SPart("BASKET", "egg basket (registered pocket)", "basket", 10, sh, configs=(cfg,), bom="BASKET")]
    shelf_z = z0 - t
    S.append(SPart("SHELF", "basket shelf", "hood", 10,
                   box(cx - lx / 2 - 20, cx + lx / 2 + 20, cy - ly / 2 - 20, cy + ly / 2 + 20, shelf_z - 12, shelf_z), configs=(cfg,)))
    tag = P.APRILTAG["size_mm"]
    # AprilTag on the outer face of the basket wall that faces the arm / camera
    if cfg in ("plus", "pro"):
        S.append(SPart("TAG", "AprilTag tag36h11 id0 (60 mm) on the basket rim", "tag", 10,
                       box(cx + lx / 2 + t, cx + lx / 2 + t + 1, cy - tag / 2, cy + tag / 2, z0 + 5, z0 + 5 + tag * 0.8), configs=(cfg,), bom="TAG"))
    else:
        S.append(SPart("TAG", "AprilTag tag36h11 id0 (60 mm) on the basket rim", "tag", 10,
                       box(cx - tag / 2, cx + tag / 2, cy + ly / 2 + t, cy + ly / 2 + t + 1, z0 + 5, z0 + 5 + tag * 0.8), configs=(cfg,), bom="TAG"))
    return S


# ------------------------------------------------------------------------------ egg bay hood (robot configs)
def hood_parts(cfg):
    if cfg == "base":
        return []
    t = 9.0
    x0, x1, y0, y1 = P.NB_X0, P.HOOD_X1, P.HOOD_Y0, P.HOOD_Y1
    zb = P.NEST_FLOOR_Z - P.NB_T - 60
    zr = P.HOOD_ROOF_Z
    S = [SPart("HOOD", "egg-bay hood roof (arm mount above)", "hood", 10, box(x0, x1 + t, y0 - t, y1, zr, zr + t), configs=(cfg,), alpha=0.35),
         SPart("HOOD", "egg-bay hood end wall (front)", "hood", 10, box(x0, x1 + t, y0 - t, y0, zb, zr), configs=(cfg,), alpha=0.35),
         SPart("HOOD", "egg-bay hood end wall (back)", "hood", 10, box(x0, x1 + t, y1 - t, y1, zb, zr), configs=(cfg,), alpha=0.35),
         SPart("HOOD", "egg-bay hood floor", "hood", 10, box(P.NB_X1, x1 + t, y0, y1 - t, zb, zb + t), configs=(cfg,), alpha=0.35),
         SPart("HOOD", "egg-bay hood outer wall (lower)", "hood", 10, box(x1, x1 + t, y0, y1 - t, zb, P.BASKET_FLOOR_Z + 60), configs=(cfg,), alpha=0.35),
         SPart("HDOOR", "egg-bay collection door (hinged, exterior)", "door", 10,
               box(x1, x1 + t, y0, y1 - t, P.BASKET_FLOOR_Z + 60, zr), node="hood_door", configs=(cfg,), alpha=0.55)]
    return S


# ------------------------------------------------------------------------------ robot options
def starter_parts():
    c = ("starter",)
    x = P.ST_RAIL_X
    ya, yb = P.ST_RAIL_Y
    zr = P.HOOD_ROOF_Z - 30
    S = [SPart("ST-RAIL", "Y rail, 20x40 extrusion + MGN9 (Starter)", "rail", 10, box(x - 20, x + 20, ya, yb, zr - 10, zr + 10), configs=c, bom="ST-RAIL"),
         SPart("ST-MY", "Y belt motor NEMA17", "dark", 10, box(x - 21, x + 21, yb - 45, yb, zr - 52, zr - 10), configs=c, bom="ST-MOT"),
         SPart("ST-CAR", "Y carriage", "metal", 10, box(x - 35, x + 35, -40, 40, zr - 30, zr - 10), node="st_car", configs=c, bom="ST-RAIL"),
         SPart("ST-Z", "Z plunger rail (T8 lead screw)", "rail", 10, box(x - 12, x + 12, -12, 12, zr - 330, zr - 30), node="st_z", configs=c, bom="ST-Z"),
         SPart("ST-MZ", "Z motor NEMA17", "dark", 10, box(x - 21, x + 21, 15, 57, zr - 72, zr - 30), node="st_car", configs=c, bom="ST-MOT"),
         SPart("ST-CUP", "soft vacuum cup 20 mm bellows", "cup", 10, cyl((x, 0, zr - 330), (x, 0, zr - 330 - 25), P.ST_CUP_D / 2), node="st_z", configs=c, bom="ST-CUP"),
         SPart("ST-PUMP", "12 V vacuum pump + valve + sensor", "dark", 10,
               box(P.NB_X1 + 20, P.NB_X1 + 120, P.COOP_Y1 - 160, P.COOP_Y1 - 20, P.HOOD_ROOF_Z - 110, P.HOOD_ROOF_Z - 10), configs=c, bom="ST-PUMP")]
    return S


def pro_parts():
    c = ("pro",)
    x = P.NB_CX
    ya, yb = P.PRO_RAIL_Y
    zr = P.HOOD_ROOF_Z
    S = [SPart("PRO-RAIL", "Y gantry: 2040 extrusion + MGN12 rail (Pro)", "rail", 10, box(x - 40, x + 40, ya, yb, zr - 20, zr), configs=c, bom="PRO-RAIL"),
         SPart("PRO-MOT", "Y belt motor NEMA17 + GT2 belt", "dark", 10, box(x + 45, x + 87, yb - 45, yb, zr - 50, zr - 8), configs=c, bom="PRO-MOT"),
         SPart("PRO-CAR", "gantry carriage plate", "metal", 10, box(x - 60, x + 60, -60, 60, P.ARM_BASE_Z, zr - 20), node="pro_car", configs=c, bom="PRO-RAIL")]
    return S


def plus_parts():
    c = ("plus",)
    x, y, z = P.PLUS_BASE
    return [SPart("PLUS-PLATE", "SO-101 mount plate under the hood roof", "metal", 10,
                  box(x - 70, x + 70, y - 70, y + 70, z, P.HOOD_ROOF_Z), configs=c, bom="PLUS-MOUNT")]


# ------------------------------------------------------------------------------ electronics (PR #188 + guide section 7)
def left_wall_top(y):
    if P.HOUSE == "gable":
        return P.HOUSE_EAVE_Z              # level top plates now (cables run under the left top plate)
    return P.FRONT_WALL_TOP - (y - P.COOP_Y0) / P.COOP_D * (P.FRONT_WALL_TOP - P.BACK_WALL_TOP)


def electronics_parts(cfg):
    S = []
    import ebay_params as EP
    w, h, d = P.CTRL_BOX
    xb = P.CTRL_BOX_X
    yb = P.COOP_Y1 + P.PLY_WALL
    zt = P.CTRL_BOX_TOP_Z
    if not EP.EBAY:
        S += _legacy_ctrl_box(cfg)
    return S + _field_parts(cfg)


def _legacy_ctrl_box(cfg):
    """PR #189 guide-s7 back-wall control box + WROOM box (EBAY=0). Replaced by the under-coop bay (ebay.py)."""
    S = []
    w, h, d = P.CTRL_BOX
    xb = P.CTRL_BOX_X
    yb = P.COOP_Y1 + P.PLY_WALL
    zt = P.CTRL_BOX_TOP_Z
    S.append(SPart("CTRL-BOX", "control box (printed PETG): XIAO + DRV8874 + D36V6F5", "box", 9,
                   box(xb - w / 2, xb + w / 2, yb, yb + d, zt - h, zt), bom="PLA/PETG", alpha=0.45))
    # inside the box, on the electronics plate (placed + labelled)
    py = yb + 12
    comps = [("U1", "Seeed XIAO ESP32-S3 (door controller)", (21, 17.5, 4), (xb - 30, zt - 40)),
             ("U3", "Pololu DRV8874 carrier (#4035), ~2.0 A limit", (20, 15, 3), (xb + 25, zt - 40)),
             ("U2", "Pololu D36V6F5 5 V buck (#3792)", (13, 10, 3), (xb - 30, zt - 80)),
             ("D1", "1N5817 Schottky", (5, 3, 3), (xb - 5, zt - 80)),
             ("R1", "20 k VREF resistor", (6, 2.5, 2.5), (xb + 12, zt - 80)),
             ("R2 R3", "4.7 k I2C pull-ups", (6, 5, 2.5), (xb + 28, zt - 80)),
             ("TB1 TB2", "5.08 mm terminals (12 V in, motor out)", (20, 8, 10), (xb + 20, zt - 120)),
             ("F1", "inline 3 A blade fuse", (12, 30, 8), (xb - 30, zt - 125))]
    for ref, nm, (a, b, c), (x, z) in comps:
        S.append(SPart(ref, nm, "pcb", 9, box(x - a / 2, x + a / 2, py, py + c, z - b / 2, z + b / 2), bom=ref))
    S.append(SPart("SW1", "22 mm NC E-STOP mushroom on the box lid", "estop", 9,
                   cyl((xb, yb + d, zt - 50), (xb, yb + d + 35, zt - 50), 20), bom="SW1"))
    S.append(SPart("J1", "5.5x2.1 panel DC jack (box bottom)", "dark", 9,
                   cyl((xb + 35, yb + d / 2, zt - h), (xb + 35, yb + d / 2, zt - h - 15), 6), bom="J1"))
    for i, gx in enumerate((xb - 35, xb, xb + 35)):
        S.append(SPart("GLAND", f"PG7 cable gland {i + 1} (back wall)", "dark", 9,
                       cyl((gx, yb, P.GLAND_Z), (gx, yb + 18, P.GLAND_Z), 7.5), bom="GLAND"))
    if cfg in ("plus", "pro"):
        S.append(SPart("WROOM-BOX", "second box: ESP32-WROOM-32 DevKit V1 (coop sensor / feeder controller)", "box", 9,
                       box(xb - P.WROOM_BOX[0] / 2, xb + P.WROOM_BOX[0] / 2, yb, yb + P.WROOM_BOX[2],
                           P.WROOM_BOX_TOP_Z - P.WROOM_BOX[1], P.WROOM_BOX_TOP_Z), configs=(cfg,), bom="WROOM", alpha=0.45))
        S.append(SPart("WROOM", "ESP32-WROOM-32 DevKit V1 board", "pcb", 9,
                       box(xb - 14, xb + 14, yb + 12, yb + 16, P.WROOM_BOX_TOP_Z - 120, P.WROOM_BOX_TOP_Z - 65), configs=(cfg,), bom="WROOM"))
        S.append(SPart("DIV", "MQ-137 divider 15 k / 12 k + 100 nF", "pcb", 9,
                       box(xb + 20, xb + 40, yb + 12, yb + 16, P.WROOM_BOX_TOP_Z - 100, P.WROOM_BOX_TOP_Z - 80), configs=(cfg,), bom="DIV"))
        S.append(SPart("BUCK5", "5 V buck for the WROOM + MQ-137 heater", "pcb", 9,
                       box(xb - 45, xb - 25, yb + 12, yb + 16, P.WROOM_BOX_TOP_Z - 100, P.WROOM_BOX_TOP_Z - 80), configs=(cfg,), bom="BUCK5"))
    return S


def sensor_spots():
    """Relocated in-coop sensor boxes when the SD1 left service door is on (service_params.SENSOR_RELOCATE), else {}."""
    try:
        import service_params as SP
    except ImportError:
        return {}
    return SP.SENSOR_RELOCATE if SP.SERVICE_DOORS else {}


def _field_parts(cfg):
    """Outlet, adapter, in-coop sensors, camera, feeder (same with or without the under-coop bay)."""
    S = []
    # power: Class 2 adapter at an outdoor GFCI outlet
    ox, oy, oz = P.OUTLET_POS
    S.append(SPart("OUTLET", "outdoor GFCI outlet + in-use cover on a post (ASSUMED location)", "hood", 9,
                   box(ox - 60, ox + 60, oy - 40, oy + 40, oz - 80, oz + 80), bom="OUTLET"))
    S.append(SPart("POST", "outlet post", "pt_lumber", 9, box(ox - 44, ox + 44, oy + 40, oy + 128, 0, oz + 150), bom="OUTLET"))
    S.append(SPart("PS1", "12 V 3 A Class 2 wall adapter", "dark", 9, box(ox - 30, ox + 30, oy - 75, oy - 40, oz - 40, oz + 40), bom="PS1"))
    # inside sensors (guide section 7)
    SR = sensor_spots()
    if SR:   # service door SD1 took the left wall: sensors move to the back face of the front-left post (service_params)
        a = SR["S1 DHT20"]
        S.append(SPart("S1", "DHT20 temp/humidity (Adafruit 5183), back face of the front-left post, 14 in above floor", "pcb", 9,
                       box(*a["x"], *a["y"], a["z"] - 12, a["z"] + 12), bom="S1"))
    else:
        S.append(SPart("S1", "DHT20 temp/humidity (Adafruit 5183), left wall, 14 in above floor", "pcb", 9,
                       box(0, 6, (P.COOP_Y0 + P.COOP_Y1) / 2 - 12, (P.COOP_Y0 + P.COOP_Y1) / 2 + 12, P.DHT_Z - 12, P.DHT_Z + 12), bom="S1"))
    cam_y = P.COOP_Y0 + 230
    S.append(SPart("CAM", "XIAO ESP32-S3 Sense camera node (small box), front-left upper corner", "box", 9,
                   box(0, 40, cam_y - 25, cam_y + 25, P.CAM_Z - 25, P.CAM_Z + 25), bom="CAM"))
    S.append(SPart("CAM", "camera lens", "dark", 9, cyl((40, cam_y, P.CAM_Z), (48, cam_y, P.CAM_Z), 6), bom="CAM"))
    if cfg in ("plus", "pro"):
        # Pro-board sensors: shown on the robot configs (the doc calls them the Pro add-on); WROOM board itself sits
        # in the under-coop bay EB1 (ebay.py) or, with EBAY=0, in the legacy second box (_legacy_ctrl_box)
        if SR:
            a, b = SR["MQ137 cage"], SR["DHT22"]
            S.append(SPart("MQ137", "MQ-137 ammonia module in a hardware-cloth cage, front-left post, 12 in above floor", "metal", 9,
                           box(*a["x"], *a["y"], a["z"] - 30, a["z"] + 30), configs=(cfg,), bom="MQ137", alpha=0.6))
            S.append(SPart("DHT22", "DHT22 (Pro board), next to the DHT20 on the front-left post", "pcb", 9,
                           box(*b["x"], *b["y"], b["z"] - 15, b["z"] + 15), configs=(cfg,), bom="DHT22"))
        else:
            S.append(SPart("MQ137", "MQ-137 ammonia module in a hardware-cloth cage, left wall 12 in above floor", "metal", 9,
                           box(0, 35, P.MQ_Y - 30, P.MQ_Y + 30, P.MQ_Z - 30, P.MQ_Z + 30), configs=(cfg,), bom="MQ137", alpha=0.6))
            S.append(SPart("DHT22", "DHT22 (Pro board), next to the DHT20", "pcb", 9,
                           box(0, 8, (P.COOP_Y0 + P.COOP_Y1) / 2 + 30, (P.COOP_Y0 + P.COOP_Y1) / 2 + 55, P.DHT_Z - 15, P.DHT_Z + 15), configs=(cfg,), bom="DHT22"))
    # gravity feeder hung from joist C3 (guide: under the coop, bottom ~8-10 in)
    if P.HOUSE == "gable":    # the bed pit replaced joist C3: feeder re-hung in the run in front of the coop, from the run roof truss
        fx, fy = P.FEEDER_MOVED
        S.append(SPart("FEEDER", "gravity feeder (moved: hung in the run in front of the coop; motor + load cell later)", "metal", 8,
                       cyl((fx, fy, 9 * P.IN), (fx, fy, 9 * P.IN + 300), 100), bom="FEEDER"))
        S.append(SPart("FEEDER", "feeder hanger chain (from the coop-end cross rail)", "metal", 8,
                       cyl((fx, fy, 9 * P.IN + 300), (fx, fy, P.CL_TOP_Z - 30), 3), bom="FEEDER"))
    else:
        S.append(SPart("FEEDER", "gravity feeder hung from joist C3 (motor + load cell later)", "metal", 8,
                       cyl((P.XC, (P.COOP_Y0 + P.COOP_Y1) / 2, 9 * P.IN), (P.XC, (P.COOP_Y0 + P.COOP_Y1) / 2, 9 * P.IN + 300), 100), bom="FEEDER"))
        S.append(SPart("FEEDER", "feeder hanger", "metal", 8,
                       cyl((P.XC, (P.COOP_Y0 + P.COOP_Y1) / 2, 9 * P.IN + 300), (P.XC, (P.COOP_Y0 + P.COOP_Y1) / 2, P.FLOOR_FRAME_Z0), 3), bom="FEEDER"))
    return S


def cable_routes(cfg):
    """Polylines (mm) for each harness run, following the guide's wire routes."""
    xb = P.CTRL_BOX_X
    yb = P.COOP_Y1 + P.PLY_WALL
    yin = P.COOP_Y1 - 19.0                 # gap between the back wall and the back-left post
    import ebay_params as EP
    xr = EP.TRUNK_X if EP.EBAY else 20.0   # along the inside of the left wall, under nailer C10 / the left top plate
    def zC10(y):
        return left_wall_top(y) - P.S2 - 12
    yf = P.COOP_Y0 + 2 * P.T2 + 20         # front end of the C10 run (just behind the front posts)
    import ebay_params as EP
    def trunk(gx):
        if EP.EBAY:   # from a gland on the bottom of bay EB1: drip loop, up the sealed chase, out of the LB, up the back-left post
            import ebay as EB
            k = {xb - 35: 0, xb: 1}.get(gx, 2)
            bx, by = EB.gland_xy("EB1", cfg, k)
            zl, zt_ = EP.DRIP_LOOP_LOW_Z, EB.chase_top_z() + 30
            yr = EP.RISER_Y        # loom bundle on the front face of the back-left post: clear of the SD1 latch jack (x 0..38)
            return [(bx, by, EP.EB_Z0 - 18), (bx, by, zl), (EP.CHASE_X, EP.CHASE_Y, zl), (EP.CHASE_X, EP.CHASE_Y, zt_),
                    (EP.RISER_X, yr, zt_), (EP.RISER_X, yr, zC10(yr)), (xr, yr, zC10(yr)), (xr, yf, zC10(yf))]
        return [(gx, yb + 18, P.GLAND_Z), (gx, yin, P.GLAND_Z), (xr, yin, P.GLAND_Z), (xr, yin, zC10(yin)),
                (xr, yf, zC10(yf))]
    a = P.ACT
    zC9 = P.FRONT_WALL_TOP - P.S2 - 12
    R = {}
    R["W13/W14 actuator cable"] = trunk(xb - 35) + [(P.ACT_FIXED_X + 55, yf, zC9), (P.ACT_FIXED_X + 55, P.ACT_Y, P.ACT_Z - 60)]
    gx = P.XC + P.DOOR_PANEL[0] / 2 + P.DOOR_SLACK + P.S2 / 2
    R["W18 door-closed reed"] = trunk(xb) + [(gx, yf, zC9), (gx, P.COOP_Y0 + P.S2 + 15, zC9),
                                             (gx, P.COOP_Y0 + P.S2 + 15, P.REED_CLOSED_Z)]
    R["W19 door-open reed"] = trunk(xb) + [(gx + 8, yf, zC9), (gx + 8, P.COOP_Y0 + P.S2 + 15, zC9),
                                           (gx + 8, P.COOP_Y0 + P.S2 + 15, P.REED_OPEN_Z)]
    ym = (P.COOP_Y0 + P.COOP_Y1) / 2
    nh = 7 if EP.EBAY else 4
    SR = sensor_spots()
    def post_drop(spot, dz):   # forward under the top plate, then down the back face of the front-left post (clear of the SD1 hinge jack)
        a = SR[spot]
        xs, ys = (a["x"][0] + a["x"][1]) / 2, a["y"][1] + 3
        yb_ = P.MOUNT_BOARD_Y0 + P.T2 + 8.0    # drop just behind the actuator mounting board, jog onto the post face at sensor height
        return [(xr, yf, zC10(yf)), (xr, yb_, zC10(yf)), (xr, yb_, a["z"] + dz), (xs, yb_, a["z"] + dz), (xs, ys, a["z"] + dz)]
    if SR:
        R["W20 DHT20 sensor cable"] = trunk(xb + 35)[:nh] + post_drop("S1 DHT20", 12)
    else:
        R["W20 DHT20 sensor cable"] = trunk(xb + 35)[:nh] + [(xr, ym, zC10(ym)), (xr, ym, P.DHT_Z + 12)]
    cam_y = P.COOP_Y0 + 230
    R["camera power (gland 3)"] = trunk(xb + 35)[:nh] + [(xr, cam_y + 30, zC10(cam_y + 30)), (xr, cam_y + 30, P.CAM_Z + 25)]
    ox, oy, oz = P.OUTLET_POS
    if EP.EBAY:   # adapter lead along grade, through a sleeve in the EB1 service-hatch frame, drip loop up into J1 on the box bottom
        import ebay as EB
        bx, by = EB.gland_xy("EB1", cfg, 4)
        R["12 V Class 2 lead -> J1"] = [(ox, oy - 75, oz - 40), (ox, oy - 75, 20), (bx, oy - 75, 20), (bx, EP.HATCH_Y + 60, 20),
                                        (bx, EP.HATCH_Y + 60, 120), (bx, by, EP.DRIP_LOOP_LOW_Z), (bx, by, EP.EB_Z0 - 18)]
        es = EP.ESTOP_STATION
        # out of the station bottom, down the OUTSIDE of the back siding in 3/8 in liquid-tight flex (the corner cavity is full of
        # SD1/SD2 kings + jacks), in under the siding's bottom edge (z 437), behind the back-left post, drip loop, up into the EB1 PG7
        zin = P.PIT_BOTTOM - 12
        R["E-STOP loop (3 NC blocks)"] = [(es["x"], yb + 8, es["z"] - 40), (es["x"], yb + 8, zin), (es["x"], P.COOP_Y1 - 18, zin),
                                         (es["x"], P.COOP_Y1 - 18, EP.DRIP_LOOP_LOW_Z),
                                         (EB.gland_xy("EB1", cfg, 3)[0], EB.gland_xy("EB1", cfg, 3)[1], EP.DRIP_LOOP_LOW_Z),
                                         (EB.gland_xy("EB1", cfg, 3)[0], EB.gland_xy("EB1", cfg, 3)[1], EP.EB_Z0 - 18)]
    elif P.HOUSE == "gable":   # rerouted: up the outside of the back-left corner so it never crosses the bed-cassette slot path
        zj = P.CTRL_BOX_TOP_Z - P.CTRL_BOX[1] - 15
        R["12 V Class 2 lead -> J1"] = [(ox, oy - 75, oz - 40), (ox, oy - 75, 20), (-40, oy - 75, 20), (-40, yb + P.CTRL_BOX[2] / 2, 20),
                                        (-40, yb + P.CTRL_BOX[2] / 2, zj), (xb + 35, yb + P.CTRL_BOX[2] / 2, zj)]
    else:
        R["12 V Class 2 lead -> J1"] = [(ox, oy - 75, oz - 40), (ox, oy - 75, 20), (xb + 35, oy - 75, 20),
                                        (xb + 35, yb + P.CTRL_BOX[2] / 2, 20), (xb + 35, yb + P.CTRL_BOX[2] / 2, P.CTRL_BOX_TOP_Z - P.CTRL_BOX[1] - 15)]
    if cfg in ("plus", "pro"):
        if SR:
            R["MQ-137 cable (WROOM)"] = trunk(xb + 35)[:nh] + post_drop("MQ137 cage", 30)
        else:
            R["MQ-137 cable (WROOM)"] = trunk(xb + 35)[:nh] + [(xr, P.MQ_Y, zC10(P.MQ_Y)), (xr, P.MQ_Y, P.MQ_Z + 30)]
    return R


def cable_parts(cfg):
    S = []
    for nm, pts in cable_routes(cfg).items():
        for i in range(len(pts) - 1):
            if np.linalg.norm(np.subtract(pts[i + 1], pts[i])) < 1:
                continue
            S.append(SPart("CABLE", f"{nm} seg {i + 1}", "cable", 9, cyl(pts[i], pts[i + 1], 3.0), bom="WIRE",
                           configs=(cfg,), in_step=True))
    return S


def route_lengths(cfg):
    return {k: round(sum(float(np.linalg.norm(np.subtract(b, a))) for a, b in zip(v, v[1:]))) for k, v in cable_routes(cfg).items()}


# ------------------------------------------------------------------------------ hens (animation props)
def hen_shapes(c=(0, 0, 0)):
    x, y, z = c
    return [("hen", ellipsoid((x, y, z + 190), (95, 140, 105))),
            ("hen", ellipsoid((x, y + 120, z + 290), (52, 52, 58))),
            ("comb", ellipsoid((x, y + 125, z + 348), (10, 30, 18))),
            ("comb", ellipsoid((x, y + 172, z + 285), (10, 14, 10))),
            ("hen", ellipsoid((x, y - 140, z + 250), (35, 45, 75))),
            ("dark", cyl((x - 35, y, z + 95), (x - 35, y, z), 8)),
            ("dark", cyl((x + 35, y, z + 95), (x + 35, y, z), 8))]


def hen_parts():
    S = []
    for i in range(4):
        for layer, sh in hen_shapes():
            S.append(SPart("HEN", f"hen {i + 1} (placeholder)", layer, 8, sh, node=f"hen{i + 1}", in_step=False))
    return S


# ------------------------------------------------------------------------------ assemble
def parts(cfg):
    import run_chainlink as RC
    out = (coop_structure() + RC.run_parts() + door_parts() + door_mechanism() + cord_parts() + nest_parts() + egg_parts()
           + basket_parts(cfg) + hood_parts(cfg) + electronics_parts(cfg) + cable_parts(cfg) + hen_parts())
    if P.HOUSE == "gable":
        import house as Hs
        out += Hs.house_parts(cfg)
    import ebay as EB                     # under-coop electronics bay (EBAY=0 restores the back-wall box)
    out += EB.parts(cfg)
    if cfg == "starter":
        out += starter_parts()
    if cfg in P.GANTRY_CFGS:
        import gantry
        out += gantry.parts(cfg)
    elif cfg == "plus":
        out += plus_parts()
    elif cfg == "pro":
        out += pro_parts()
    return [p for p in out if cfg in p.configs]
