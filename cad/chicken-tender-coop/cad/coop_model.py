"""Chicken Tender family coop + run - parts (build123d). Parameters: coop_params.py.

Same helpers and Part/label pattern as hardware/ct72-cell/cad/ct72_model.py (PR #182), scaled to the
build guide (TC-CHKN-BUILD-001 rev A): 4x4 ft coop raised 24 in, 3:12 roof, 4x12x6 ft run.
Framing is modelled as plain boxes (no joinery), hardware cloth as thin sheets.
"""
import math
from dataclasses import dataclass
from build123d import Box, Pos, Rot, Polyline, make_face, extrude, Plane
from coop_params import *  # noqa: F401,F403

T2, W2 = L2X4          # 2x4: 1.5 x 3.5 in
S2 = L2X2[0]           # 2x2: 1.5 in


@dataclass
class Part:
    pid: str            # cut-list ID from the build guide (C1, P2, R4 ...)
    name: str
    layer: str          # COLORS key
    group: str          # COOP / RUN / MESH
    shape: object
    length_in: float = 0.0   # nominal cut length for the cut-list check (0 = n/a)


def box(x0, x1, y0, y1, z0, z1):
    x0, x1 = sorted((x0, x1)); y0, y1 = sorted((y0, y1)); z0, z1 = sorted((z0, z1))
    return Pos((x0 + x1) / 2, (y0 + y1) / 2, (z0 + z1) / 2) * Box(x1 - x0, y1 - y0, z1 - z0)


def sloped_y(xc, wx, y_hi, z_hi, length, thick, slope, y_dir=+1):
    """Member running along +Y (y_dir) and dropping at `slope`; top-front edge at (y_hi, z_hi)."""
    ang = math.degrees(math.atan(slope))
    b = Pos(0, y_dir * length / 2, -thick / 2) * Box(wx, length, thick)
    return Pos(xc, y_hi, z_hi) * Rot(-ang * y_dir, 0, 0) * b


def yz_prism(pts_yz, x0, x1):
    """Extrude a YZ polygon from x0 to x1."""
    pl = Plane(origin=(x0, 0, 0), x_dir=(0, 1, 0), z_dir=(1, 0, 0))   # local (u, v) = (Y, Z)
    face = make_face(Polyline(*[(y, z, 0) for y, z in pts_yz], close=True))
    return extrude(pl * face, amount=x1 - x0)


# =============================================================================== coop
def coop_floor():
    y0, y1, z0, z1 = COOP_Y0, COOP_Y1, FLOOR_FRAME_Z0, FLOOR_FRAME_Z1
    P = [
        Part("C1", "floor rim front", "pt_lumber", "COOP", box(0, COOP_W, y0, y0 + T2, z0, z1), 48),
        Part("C1", "floor rim back", "pt_lumber", "COOP", box(0, COOP_W, y1 - T2, y1, z0, z1), 48),
        Part("C2", "floor rim left", "pt_lumber", "COOP", box(0, T2, y0 + T2, y1 - T2, z0, z1), 45),
        Part("C2", "floor rim right", "pt_lumber", "COOP", box(COOP_W - T2, COOP_W, y0 + T2, y1 - T2, z0, z1), 45),
        Part("C3", "floor joist center", "pt_lumber", "COOP", box(COOP_W / 2 - T2 / 2, COOP_W / 2 + T2 / 2, y0 + T2, y1 - T2, z0, z1), 45),
    ]
    floor = box(0, COOP_W, y0, y1, z1, FLOOR_TOP_Z)
    for x in (T2, COOP_W - T2 - W2):                    # 3-1/2 x 1-1/2 corner notches for the posts
        for y in (y0 + T2, y1 - 2 * T2):
            floor -= box(x, x + W2, y, y + T2, z1, FLOOR_TOP_Z)
    P.append(Part("P1", "floor 3/4 ply", "ply", "COOP", floor))
    return P


def post_x():
    return (T2, COOP_W - T2 - W2)           # 3-1/2 face against the front/back rim, inside corners


def coop_posts():
    P = []
    for i, x in enumerate(post_x()):
        side = "left" if i == 0 else "right"
        P.append(Part("C4", f"front post {side}", "pt_lumber", "COOP",
                      box(x, x + W2, COOP_Y0 + T2, COOP_Y0 + 2 * T2, 0, FRONT_POST_H), 75.5))
        P.append(Part("C5", f"back post {side}", "pt_lumber", "COOP",
                      box(x, x + W2, COOP_Y1 - 2 * T2, COOP_Y1 - T2, 0, BACK_POST_H), 63.5))
    return P


def coop_walls():
    t, y0, y1, zb = PLY_WALL, COOP_Y0, COOP_Y1, FLOOR_FRAME_Z0
    front = box(0, COOP_W, y0 - t, y0, zb, FRONT_WALL_TOP)
    px = COOP_W / 2 - POP_DOOR[0] / 2
    front -= box(px, px + POP_DOOR[0], y0 - t, y0, POP_SILL_Z, POP_SILL_Z + POP_DOOR[1])
    back = box(0, COOP_W, y1, y1 + t, zb, BACK_WALL_TOP)
    cx = COOP_W / 2 - CLEANOUT[0] / 2
    back -= box(cx, cx + CLEANOUT[0], y1, y1 + t, CLEANOUT_Z0, CLEANOUT_Z0 + CLEANOUT[1])
    trap = [(y0, zb), (y1, zb), (y1, BACK_WALL_TOP), (y0, FRONT_WALL_TOP)]
    left = yz_prism(trap, -t, 0)
    wy = y0 + WINDOW_Y_FROM_FRONT
    left -= box(-t, 0, wy, wy + WINDOW[0], WINDOW_Z0, WINDOW_Z0 + WINDOW[1])
    right = yz_prism(trap, COOP_W, COOP_W + t)
    ny = (y0 + y1) / 2 - NEST_HOLE[0] / 2
    right -= box(COOP_W, COOP_W + t, ny, ny + NEST_HOLE[0], NEST_FLOOR_Z, NEST_FLOOR_Z + NEST_HOLE[1])
    P = [
        Part("P2", "front wall (pop-door hole 10x11)", "ply", "COOP", front),
        Part("P3", "back wall (cleanout hole 36x28)", "ply", "COOP", back),
        Part("P4", "left side wall (window 18x12)", "ply", "COOP", left),
        Part("P4", "right side wall (nest-box hole 24x12)", "ply", "COOP", right),
        Part("P3", "cleanout door (the cut-out)", "door", "COOP",
             box(cx, cx + CLEANOUT[0], y1 + t, y1 + 2 * t, CLEANOUT_Z0, CLEANOUT_Z0 + CLEANOUT[1])),
    ]
    # pop door P5 (open = slid up) + guides C14/C15 on the outside of the front wall
    dx = COOP_W / 2 - POP_DOOR_PANEL[0] / 2
    dz = POP_SILL_Z + POP_DOOR[1] - 1 * IN
    P.append(Part("P5", "pop door (shown open)", "door", "COOP",
                  box(dx, dx + POP_DOOR_PANEL[0], y0 - 2 * t - 0.1 * IN, y0 - t - 0.1 * IN, dz, dz + POP_DOOR_PANEL[1])))
    for gx in (dx - S2, dx + POP_DOOR_PANEL[0]):
        P.append(Part("C14", "pop-door guide", "lumber", "COOP",
                      box(gx, gx + S2, y0 - t - S2, y0 - t, POP_SILL_Z - 1 * IN, POP_SILL_Z - 1 * IN + 26 * IN), 26))
    # wall top nailers C9 (front/back) at the top edge of the plywood, inside
    xa, xb = COOP_W / 2 - HEADER_L / 2, COOP_W / 2 + HEADER_L / 2
    P.append(Part("C9", "wall top nailer front", "lumber", "COOP",
                  box(xa, xb, y0, y0 + S2, FRONT_WALL_TOP - S2, FRONT_WALL_TOP), 41))
    P.append(Part("C9", "wall top nailer back", "lumber", "COOP",
                  box(xa, xb, y1 - S2, y1, BACK_WALL_TOP - S2, BACK_WALL_TOP), 41))
    return P


def coop_roof():
    xa, xb = COOP_W / 2 - HEADER_L / 2, COOP_W / 2 + HEADER_L / 2
    P = [
        Part("C6", "roof header front", "lumber", "COOP",
             box(xa, xb, COOP_Y0 + T2, COOP_Y0 + 2 * T2, FRONT_POST_H - W2, FRONT_POST_H), 41),
        Part("C6", "roof header back", "lumber", "COOP",
             box(xa, xb, COOP_Y1 - 2 * T2, COOP_Y1 - T2, BACK_POST_H - W2, BACK_POST_H), 41),
    ]
    # rafters sit on the headers: top-front point 6 in in front of the coop front, rising 3:12 to the front
    y_hi = COOP_Y0 - RAFTER_OVERHANG
    z_hi = FRONT_POST_H + W2 + RAFTER_OVERHANG * ROOF_SLOPE
    for i, xc in enumerate((T2 / 2, COOP_W / 2, COOP_W - T2 / 2)):
        P.append(Part("C7", f"rafter {i + 1}", "lumber", "COOP",
                      sloped_y(xc, T2, y_hi, z_hi, RAFTER_L, W2, ROOF_SLOPE), 60))
    ang = math.atan(ROOF_SLOPE)
    for i, d in enumerate((2 * IN, RAFTER_L / 2, RAFTER_L - 2 * IN - S2)):
        yc = y_hi + (d + S2 / 2) * math.cos(ang)
        zc = z_hi - (d + S2 / 2) * math.sin(ang)
        P.append(Part("C8", f"roof purlin {i + 1}", "lumber", "COOP",
                      Pos(COOP_W / 2, yc, zc + S2 / 2 * math.cos(ang)) * Rot(-math.degrees(ang), 0, 0) * Box(PURLIN_L, S2, S2), 54))
    P.append(Part("ROOF", "corrugated steel roof (2 panels, envelope)", "roof", "COOP",
                  sloped_y(COOP_W / 2, PURLIN_L, y_hi, z_hi + S2 + ROOF_PANEL_T, RAFTER_L + 2 * IN, ROOF_PANEL_T, ROOF_SLOPE)))
    return P


def coop_inside():
    yr = COOP_Y1 - ROOST_FROM_BACK
    xa = COOP_W / 2 - ROOST_L / 2
    P = [Part("C12", "roost bar (2x4 flat)", "lumber", "COOP",
              box(xa, xa + ROOST_L, yr - W2 / 2, yr + W2 / 2, ROOST_TOP_Z - T2, ROOST_TOP_Z), 45)]
    for x in (T2, COOP_W - 2 * T2):
        P.append(Part("C11", "roost support stud", "lumber", "COOP",
                      box(x, x + S2, yr - S2 / 2, yr + S2 / 2, FLOOR_TOP_Z, ROOST_TOP_Z - T2), 0))
    return P


def nest_box():
    t = PLY_FLOOR
    x0 = COOP_W + PLY_WALL                      # bolted to the outside of the right wall
    x1 = x0 + NB_IN + t
    y0 = (COOP_Y0 + COOP_Y1) / 2 - NB_LEN / 2
    y1 = y0 + NB_LEN
    zf = NEST_FLOOR_Z - t
    P = [
        Part("P6", "nest box bottom", "ply", "COOP", box(x0, x1, y0, y1, zf, NEST_FLOOR_Z)),
        Part("P6", "nest box outer wall", "ply", "COOP", box(x1 - t, x1, y0, y1, zf, zf + NB_OUTER_H)),
        Part("P6", "nest box end", "ply", "COOP", box(x0, x1 - t, y0, y0 + t, zf, zf + NB_OUTER_H)),
        Part("P6", "nest box end", "ply", "COOP", box(x0, x1 - t, y1 - t, y1, zf, zf + NB_OUTER_H)),
        Part("P6", "nest box divider", "ply", "COOP", box(x0, x1 - t, (y0 + y1) / 2 - t / 2, (y0 + y1) / 2 + t / 2, NEST_FLOOR_Z, NEST_FLOOR_Z + NB_IN)),
    ]
    # lid hinged at the coop wall, sloping down and out over the outer wall
    z_hi = NEST_FLOOR_Z + NB_IN + 3 * IN
    z_lo = zf + NB_OUTER_H
    run = x1 + 1.5 * IN - x0
    ang = math.degrees(math.atan((z_hi - z_lo) / run))
    lid = Pos(x0, (y0 + y1) / 2, z_hi) * Rot(0, ang, 0) * Pos(NB_LID[1] / 2, 0, t / 2) * Box(NB_LID[1], NB_LID[0], t)
    P.append(Part("P6", "nest box lid (hinged)", "door", "COOP", lid))
    return P


def ramp():
    t = PLY_FLOOR
    rise = POP_SILL_Z
    run = math.sqrt(RAMP[1] ** 2 - rise ** 2)
    slope = rise / run
    y_top = COOP_Y0 - PLY_WALL - 2 * PLY_WALL
    P = [Part("P7", "ramp", "ply", "COOP",
              sloped_y(COOP_W / 2, RAMP[0], y_top, rise, RAMP[1], t, slope, y_dir=-1))]
    a = math.atan(slope)
    n = int(RAMP[1] // RAMP_CLEAT_PITCH)
    for i in range(1, n):
        d = i * RAMP_CLEAT_PITCH
        P.append(Part("1x2", "ramp cleat", "lumber", "COOP",
                      Pos(COOP_W / 2, y_top - d * math.cos(a), rise - d * math.sin(a) + L1X2[0] / 2) * Rot(math.degrees(a), 0, 0)
                      * Box(RAMP[0], L1X2[1], L1X2[0])))
    return P


# =============================================================================== run
def run_frame():
    H, ym = RUN_POST_H, RUN_MID_Y
    P = [
        Part("R1", "base rail left", "pt_lumber", "RUN", box(0, T2, T2, COOP_Y0 + T2, 0, W2), 96),
        Part("R1", "base rail right", "pt_lumber", "RUN", box(COOP_W - T2, COOP_W, T2, COOP_Y0 + T2, 0, W2), 96),
        Part("R2", "base rail end", "pt_lumber", "RUN", box(T2, COOP_W - T2, 0, T2, 0, W2), 45),
        Part("R3", "under-coop base rail left", "pt_lumber", "RUN", box(0, T2, COOP_Y0 + 2 * T2, COOP_Y1 - T2, 0, W2), 45),
        Part("R3", "under-coop base rail right", "pt_lumber", "RUN", box(COOP_W - T2, COOP_W, COOP_Y0 + 2 * T2, COOP_Y1 - T2, 0, W2), 45),
        Part("R3", "under-coop base rail back", "pt_lumber", "RUN", box(T2 + W2, COOP_W - T2 - W2, COOP_Y1 - T2, COOP_Y1, 0, W2), 41),
    ]
    for y, where in ((0, "end"), (ym - T2 / 2, "middle")):
        for x, side in ((0, "left"), (COOP_W - T2, "right")):
            P.append(Part("R4", f"run post {where} {side}", "pt_lumber", "RUN", box(x, x + T2, y, y + W2, 0, H), 72))
    P += [
        Part("R5", "top rail left", "lumber", "RUN", box(0, T2, 0, COOP_Y0, H - W2, H), 96),
        Part("R5", "top rail right", "lumber", "RUN", box(COOP_W - T2, COOP_W, 0, COOP_Y0, H - W2, H), 96),
        Part("R6", "top cross rail end", "lumber", "RUN", box(T2, COOP_W - T2, 0, T2, H - W2, H), 45),
        Part("R6", "top cross rail middle", "lumber", "RUN", box(T2, COOP_W - T2, ym - T2 / 2, ym + T2 / 2, H - W2, H), 45),
    ]
    # R7 corner braces: 45 deg, end posts to the end cross rail (in the end wall plane)
    for yb in (T2 * 1.5, ym + T2):          # end frame and middle frame (4 braces)
        for x0, sgn in ((T2, +1), (COOP_W - T2, -1)):
            leg = BRACE_L / math.sqrt(2)
            cx = x0 + sgn * leg / 2
            cz = H - W2 - leg / 2
            P.append(Part("R7", "corner brace", "lumber", "RUN",
                          Pos(cx, yb, cz) * Rot(0, -45 * sgn, 0) * Box(BRACE_L, T2, W2), 18))
    # run door (closed) in the end opening
    dx0 = COOP_W / 2 - RUN_DOOR[0] / 2
    dz0 = W2 + 0.5 * IN
    yd0, yd1 = -S2, 0
    for x in (dx0, dx0 + RUN_DOOR[0] - S2):
        P.append(Part("R8", "run door stile", "door", "RUN", box(x, x + S2, yd0, yd1, dz0, dz0 + RUN_DOOR[1]), 66))
    for z in (dz0, dz0 + RUN_DOOR[1] / 2 - S2 / 2, dz0 + RUN_DOOR[1] - S2):
        P.append(Part("R9", "run door rail", "door", "RUN", box(dx0 + S2, dx0 + RUN_DOOR[0] - S2, yd0, yd1, z, z + S2), 34))
    bx = RUN_DOOR[0] - 2 * S2
    bz = RUN_DOOR[1] / 2 - S2
    bl = math.hypot(bx, bz)
    P.append(Part("R10", "run door brace", "door", "RUN",
                  Pos(COOP_W / 2, (yd0 + yd1) / 2, dz0 + S2 + bz / 2) * Rot(0, -math.degrees(math.atan2(bz, bx)), 0) * Box(bl, S2, S2), 40))
    return P


def mesh():
    m, H = MESH_T, RUN_POST_H
    P = [
        Part("HC", "hardware cloth run wall left", "mesh", "MESH", box(-m, 0, 0, COOP_Y0, 0, H)),
        Part("HC", "hardware cloth run wall right", "mesh", "MESH", box(COOP_W, COOP_W + m, 0, COOP_Y0, 0, H)),
        Part("HC", "hardware cloth run roof", "mesh", "MESH", box(0, COOP_W, 0, COOP_Y0, H, H + m)),
        Part("HC", "hardware cloth under-coop skirt left", "mesh", "MESH", box(-m, 0, COOP_Y0, COOP_Y1, 0, FLOOR_FRAME_Z0)),
        Part("HC", "hardware cloth under-coop skirt right", "mesh", "MESH", box(COOP_W, COOP_W + m, COOP_Y0, COOP_Y1, 0, FLOOR_FRAME_Z0)),
        Part("HC", "hardware cloth under-coop skirt back", "mesh", "MESH", box(0, COOP_W, COOP_Y1, COOP_Y1 + m, 0, FLOOR_FRAME_Z0)),
    ]
    # end wall around the run door + apron (12 in flat on the ground, all the way round)
    dx0 = COOP_W / 2 - RUN_DOOR[0] / 2
    end = box(0, COOP_W, -m, 0, 0, H) - box(dx0, dx0 + RUN_DOOR[0], -m, 0, W2, W2 + RUN_DOOR[1] + 0.5 * IN)
    P.append(Part("HC", "hardware cloth run end wall", "mesh", "MESH", end))
    a = APRON_W
    apron = box(-a, COOP_W + a, -a, COOP_Y1 + a, 0, m) - box(0, COOP_W, 0, COOP_Y1, 0, m)
    P.append(Part("HC", "predator apron (12 in, on the ground)", "mesh", "MESH", apron))
    return P


def all_parts():
    return (coop_floor() + coop_posts() + coop_walls() + coop_roof() + coop_inside() + nest_box() + ramp()
            + run_frame() + mesh())
