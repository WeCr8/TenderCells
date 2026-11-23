"""Framed coop HOUSE (Zach 2026-11-21 08:39): posts + studs + top plates + a gable rafter roof at HOUSE_PITCH (3:12, matches the run roof; was 4:12) with a ridge
board, wood siding, corrugated panels + ridge cap, closed eaves/gables (blocking + foam closures), optional foam
under the panels, controlled vents (servo dampers + 12 V PWM fan), EPDM weatherstrip on the doors; and the
DEEP-BED CASSETTE floor (MASTER_SPEC s6-8, HARDWARE_CATALOG s6-7): a bedding tray in a pit under the old floor
line, on 500 lb slides, driven out through a gasketed back-wall slot by a worm gearmotor + rack.

Replaces from the PR #189 CAD: P1 floor, C3 joist, the back rim C1 (cut at the slot), posts C4/C5 (new height),
walls P2/P3/P4, the single-slope roof C6/C7/C8/ROOF and nailers C9/C10. The run is untouched except the
under-coop BACK chain-link, which now stops under the pit (flagged).
"""
from __future__ import annotations
import math
from build123d import Box, Pos, Rot, Polyline, make_face, extrude, Plane
import sc_params as P
import service_params as SP
from sc_model import SPart, box, cyl, ALL

ROBOT = ("starter", "plus", "pro")
GANTRY = P.GANTRY_CFGS
DROPPED_PIDS = ("P1", "C3", "C4", "C5", "P2", "P3", "P4", "C6", "C7", "C8", "ROOF", "C9")
T, W2, T2, S2 = P.PLY_WALL, P.W2, P.T2, P.S2
Y0, Y1, CW = P.COOP_Y0, P.COOP_Y1, P.COOP_W
EAVE = P.HOUSE_EAVE_Z
PITCH = P.HOUSE_PITCH
ANG = math.atan(PITCH)
RD = W2 / math.cos(ANG)            # rafter vertical depth (2x4)
XO0, XO1 = -T, CW + T              # outer wall faces


def xz_prism(pts_xz, y0, y1):
    """Extrude an XZ polygon from y0 to y1."""
    pl = Plane(origin=(0, y1, 0), x_dir=(1, 0, 0), z_dir=(0, -1, 0))   # local (u, v) = (X, Z), normal -Y
    face = make_face(Polyline(*[(x, z, 0) for x, z in pts_xz], close=True))
    return extrude(pl * face, amount=y1 - y0)


def yz_prism(pts_yz, x0, x1):
    """Extrude a YZ polygon from x0 to x1."""
    pl = Plane(origin=(x0, 0, 0), x_dir=(0, 1, 0), z_dir=(1, 0, 0))   # local (u, v) = (Y, Z), normal +X
    face = make_face(Polyline(*[(y, z, 0) for y, z in pts_yz], close=True))
    return extrude(pl * face, amount=x1 - x0)


def underside(x):
    """Rafter underside z at x (the rafter seat is on the outer wall line at the eave height)."""
    d = min(x - XO0, XO1 - x)
    return EAVE + d * PITCH


def ridge_top():
    return underside(P.RIDGE_X) + RD


def rafter_y():
    """Rafter pairs: barge (rake) rafters front/back, the two gable-wall rafters and ~16 in o.c. between."""
    f = Y0 - T - P.HOUSE_RAKE_OH + T2 / 2
    b = Y1 + T + P.HOUSE_RAKE_OH - T2 / 2
    inner = [Y0 + T2 / 2, Y0 + 16 * P.IN + T2 / 2, Y0 + 32 * P.IN + T2 / 2, Y1 - T2 / 2]
    return [f] + inner + [b]


# ------------------------------------------------------------------------------------------ walls (siding)
def walls(cfg):
    zb = P.FLOOR_FRAME_Z0
    S = []
    front = box(0, CW, Y0 - T, Y0, zb, EAVE)
    px = CW / 2 - P.POP_DOOR[0] / 2
    front -= box(px, px + P.POP_DOOR[0], Y0 - T, Y0, P.POP_SILL_Z, P.POP_SILL_Z + P.POP_DOOR[1])
    _, u0, u1, z0, z1, _ = P.VENTS["V3"]
    front -= box(u0, u1, Y0 - T, Y0, z0, z1)
    S.append(SPart("P2", "front wall siding (pop-door hole 10x11, low intake V3)", "siding", 3, front))
    back = box(0, CW, Y1, Y1 + T, P.PIT_BOTTOM, EAVE)
    if SP.SERVICE_DOORS:        # SD2: the cleanout grown to a 35.5 x 35.1 in service door (siding cut laps the frame)
        back -= box(SP.SD2_X0 - SP.SD2_LAP_LATCH, SP.SD2_X1 + SP.LAP, Y1, Y1 + T, SP.SD2_Z0 - SP.SD2_LAP_BOTTOM, SP.SD2_Z1 + SP.LAP)
        bnm = "back wall siding (service door SD2 35.5x35.1 in, bed-cassette slot)"
    else:
        cx = CW / 2 - P.CLEANOUT[0] / 2
        back -= box(cx, cx + P.CLEANOUT[0], Y1, Y1 + T, P.CLEANOUT_Z0_NEW, P.CLEANOUT_Z0_NEW + P.CLEANOUT[1])
        bnm = "back wall siding (cleanout 36x28 raised to 32 in, bed-cassette slot)"
    back -= box(P.TRAY_X[0] - 8, P.TRAY_X[1] + 8, Y1, Y1 + T, P.SLOT["z0"], P.SLOT["z1"])
    S.append(SPart("P3", bnm, "siding", 3, back))
    left = box(-T, 0, Y0, Y1, zb, EAVE)
    wy = Y0 + P.WINDOW_Y_FROM_FRONT
    left -= box(-T, 0, wy, wy + P.WINDOW[0], P.WINDOW_Z0, P.WINDOW_Z0 + P.WINDOW[1])
    _, u0, u1, z0, z1, _ = P.VENTS["V1"]
    left -= box(-T, 0, u0, u1, z0, z1)
    lnm = "left side wall siding (window 18x12, high vent V1 + fan)"
    if SP.SERVICE_DOORS:        # SD1: full bay below the gantry rail line
        d = SP.SD1
        left -= box(-T, 0, d["y0"] - SP.LAP, d["y1"] + SP.LAP, d["z0"] - SP.LAP, d["z1"] + SP.LAP)
        lnm = "left side wall siding (service door SD1 38x18.3 in, window 18x12, high vent V1 + fan)"
    S.append(SPart("P4", lnm, "siding", 3, left))
    right = box(CW, CW + T, Y0, Y1, zb, EAVE)
    ny = (Y0 + Y1) / 2 - P.NEST_HOLE[0] / 2
    right -= box(CW, CW + T, ny, ny + P.NEST_HOLE[0], P.NEST_FLOOR_Z, P.NEST_FLOOR_Z + P.NEST_HOLE[1])
    _, u0, u1, z0, z1, _ = P.VENTS["V2"]
    right -= box(CW, CW + T, u0, u1, z0, z1)
    if cfg in GANTRY:
        mx, my, mz = P.EGG_CHUTE["mouth"]
        right -= box(CW, CW + T, my - 35, my + 35, 960, 1030)
    S.append(SPart("P4", "right side wall siding (nest-box hole 24x12, high vent V2)", "siding", 3, right))
    # gable triangles (front + back) up to the rafter underside: no open gable
    tri = [(XO0, EAVE), (XO1, EAVE), (P.RIDGE_X, underside(P.RIDGE_X))]
    S.append(SPart("P2G", "front gable siding (closed to the rafters)", "siding", 4, xz_prism(tri, Y0 - T, Y0)))
    S.append(SPart("P3G", "back gable siding (closed to the rafters)", "siding", 4, xz_prism(tri, Y1, Y1 + T)))
    return S


# ------------------------------------------------------------------------------------------ framing
def framing(cfg):
    S = []
    xs = (T2, CW - T2 - W2)
    for i, x in enumerate(xs):
        side = "left" if i == 0 else "right"
        S.append(SPart("C4", f"front post {side} (to the top plate)", "pt_lumber", 1, box(x, x + W2, Y0 + T2, Y0 + 2 * T2, 0, P.POST_TOP_Z)))
        S.append(SPart("C5", f"back post {side} (to the top plate, was 63.5 in)", "pt_lumber", 1, box(x, x + W2, Y1 - 2 * T2, Y1 - T2, 0, P.POST_TOP_Z)))
    zt0, zt1 = P.POST_TOP_Z, EAVE
    S += [SPart("HTP", "top plate front (2x4 flat)", "lumber", 3, box(0, CW, Y0, Y0 + W2, zt0, zt1)),
          SPart("HTP", "top plate back (2x4 flat)", "lumber", 3, box(0, CW, Y1 - W2, Y1, zt0, zt1)),
          SPart("HTP", "top plate left (2x4 flat)", "lumber", 3, box(0, W2, Y0 + W2, Y1 - W2, zt0, zt1)),
          SPart("HTP", "top plate right (2x4 flat)", "lumber", 3, box(CW - W2, CW, Y0 + W2, Y1 - W2, zt0, zt1))]
    zb = P.FLOOR_FRAME_Z1
    studs = [("front", x, "x") for x in (250.0, 970.0)]
    if not SP.SERVICE_DOORS:
        studs += [("back", x, "x") for x in (CW / 2 - P.CLEANOUT[0] / 2 - T2, CW / 2 + P.CLEANOUT[0] / 2)]
    wy = Y0 + P.WINDOW_Y_FROM_FRONT
    studs += [("left", y, "y") for y in (wy - T2, wy + P.WINDOW[0])]
    ny = (Y0 + Y1) / 2 - P.NEST_HOLE[0] / 2
    studs += [("right", y, "y") for y in (ny - T2, ny + P.NEST_HOLE[0])]
    for wall, c, ax in studs:
        if wall == "front":
            S.append(SPart("HS", "stud (front wall)", "lumber", 3, box(c, c + T2, Y0, Y0 + T2 + 0.0, zb, zt0)))
        elif wall == "back":
            S.append(SPart("HS", "king stud (back wall, beside the cleanout)", "lumber", 3, box(c, c + T2, Y1 - T2, Y1, P.SLOT["z1"] + T2, zt0)))
        elif wall == "left":
            if SP.SERVICE_DOORS:    # now cripple/window studs standing on the SD1 header
                S.append(SPart("HS", "window stud (left wall, on the SD1 header)", "lumber", 3, box(0, T2, c, c + T2, SP.SD1_HEADER[1], zt0)))
            else:
                S.append(SPart("HS", "stud (left wall, beside the window)", "lumber", 3, box(0, T2, c, c + T2, zb, zt0)))
        else:
            S.append(SPart("HS", "stud (right wall, beside the nest hole)", "lumber", 3, box(CW - T2, CW, c, c + T2, zb, zt0)))
    px = CW / 2 - P.POP_DOOR[0] / 2
    S.append(SPart("HH", "pop-door header (2x4 flat)", "lumber", 3, box(px - T2, px + P.POP_DOOR[0] + T2, Y0, Y0 + T2, P.POP_SILL_Z + P.POP_DOOR[1], P.POP_SILL_Z + P.POP_DOOR[1] + T2)))
    if not SP.SERVICE_DOORS:
        cx = CW / 2 - P.CLEANOUT[0] / 2
        S.append(SPart("HH", "cleanout header (2x4 on edge)", "lumber", 3, box(cx, cx + P.CLEANOUT[0], Y1 - T2, Y1, P.CLEANOUT_Z0_NEW + P.CLEANOUT[1], P.CLEANOUT_Z0_NEW + P.CLEANOUT[1] + W2)))
    S.append(SPart("HH", "bed-slot header / back bottom plate (2x4 flat, replaces the cut back rim)", "pt_lumber", 2,
                   box(P.PIT_WALL_X[0], P.PIT_WALL_X[1], Y1 - W2, Y1, P.SLOT["z1"], P.SLOT["z1"] + T2)))
    for x0, x1, side in ((0, P.PIT_WALL_X[0], "left"), (P.PIT_WALL_X[1], CW, "right")):
        S.append(SPart("C1", f"floor rim back stub {side} (rim cut for the bed slot)", "pt_lumber", 0, box(x0, x1, Y1 - T2, Y1, P.FLOOR_FRAME_Z0, P.FLOOR_FRAME_Z1)))
    return S


def roof(cfg):
    S = []
    oh = P.HOUSE_EAVE_OH
    yf, yb = Y0 - T - P.HOUSE_RAKE_OH, Y1 + T + P.HOUSE_RAKE_OH
    x_tip0, x_tip1 = XO0 - oh, XO1 + oh
    rx0, rx1 = P.RIDGE_X - P.RIDGE_BOARD[0] / 2, P.RIDGE_X + P.RIDGE_BOARD[0] / 2
    def us(x):          # underside line extended over the eave
        return EAVE + (x - XO0) * PITCH if x <= P.RIDGE_X else EAVE + (XO1 - x) * PITCH
    for i, y in enumerate(rafter_y()):
        for side, (a, b) in (("left", (x_tip0, rx0)), ("right", (rx1, x_tip1))):
            pts = [(a, us(a)), (b, us(b)), (b, us(b) + RD), (a, us(a) + RD)]
            S.append(SPart("HR", f"rafter 2x4 {round(PITCH * 12)}:12 ({side}, {'barge' if i in (0, len(rafter_y()) - 1) else 'common'})", "lumber", 4,
                           xz_prism(pts, y - T2 / 2, y + T2 / 2), length_in_hint=math.hypot(b - a, us(b) - us(a)) / P.IN))
    rt = ridge_top()
    S.append(SPart("HRB", "ridge board 2x6", "lumber", 4, box(rx0, rx1, yf, yb, rt - P.RIDGE_BOARD[1], rt), length_in_hint=(yb - yf) / P.IN))
    # eave blocking between the rafters over the side top plates: closes the eave gap (no open area at the top)
    ys = rafter_y()[1:-1]
    for xw, side in ((XO0, "left"), (XO1, "right")):
        for ya, yb2 in zip(ys, ys[1:]):
            x0, x1 = (xw, xw + W2) if side == "left" else (xw - W2, xw)
            S.append(SPart("HBK", f"eave blocking ({side})", "lumber", 4, box(x0, x1, ya + T2 / 2, yb2 - T2 / 2, EAVE, EAVE + RD - 5)))
    # purlins (2x2 along Y, 3 per slope), foam, panels, closures, drip edge, ridge cap
    s2 = P.S2
    for sgn in (-1, 1):
        for f in (0.08, 0.5, 0.92):
            xh = x_tip0 + f * (P.RIDGE_X - x_tip0) if sgn < 0 else x_tip1 - f * (x_tip1 - P.RIDGE_X)
            zt = us(xh) + RD
            S.append(SPart("HPU", "roof purlin 2x2", "lumber", 4, box(xh - s2 / 2, xh + s2 / 2, yf, yb, zt, zt + s2), length_in_hint=(yb - yf) / P.IN))
    zf = RD + s2
    foam = P.ROOF_FOAM == "board"
    for sgn, (a, b) in ((-1, (x_tip0, P.RIDGE_X)), (1, (P.RIDGE_X, x_tip1))):
        side = "left" if sgn < 0 else "right"
        if foam:
            pts = [(a, us(a) + zf), (b, us(b) + zf), (b, us(b) + zf + P.ROOF_FOAM_T), (a, us(a) + zf + P.ROOF_FOAM_T)]
            S.append(SPart("HFOAM", f"OPTIONAL 1/2 in foil-faced foam board under the panels ({side} slope, ROOF_FOAM=board)", "foam", 4, xz_prism(pts, yf, yb)))
        z0 = zf + (P.ROOF_FOAM_T if foam else 0.0)
        pts = [(a - 25 * (sgn < 0), us(a) + z0), (b + 25 * (sgn > 0), us(b) + z0), (b, us(b) + z0 + P.CORR_T), (a, us(a) + z0 + P.CORR_T)]
        pts = [(a, us(a) + z0), (b, us(b) + z0), (b, us(b) + z0 + P.CORR_T), (a, us(a) + z0 + P.CORR_T)]
        S.append(SPart("HROOF", f"corrugated steel panels, ribs down-slope ({side} slope, envelope)", "roof", 4, xz_prism(pts, yf - 20, yb + 20)))
        # 3:12 is under the 4:12 corrugated minimum: butyl tape in every side lap (26 in panels -> laps every ~24 in of Y)
        ylap = yf - 20 + 24 * P.IN
        while ylap < yb + 20 - 6 * P.IN:
            lp = [(a, us(a) + z0 + P.CORR_T - 3), (b, us(b) + z0 + P.CORR_T - 3), (b, us(b) + z0 + P.CORR_T), (a, us(a) + z0 + P.CORR_T)]
            S.append(SPart("HLAP", f"butyl tape side-lap seal, 3:12 roof ({side} slope)", "dark", 4, xz_prism(lp, ylap - 12, ylap + 12)))
            ylap += 24 * P.IN
        xe = a if sgn < 0 else b
        S.append(SPart("HCLOS", f"foam eave closure strip ({side})", "dark", 4, box(xe - 15 if sgn < 0 else xe - 45, xe + 45 if sgn < 0 else xe + 15, yf, yb, us(xe) + z0 - 2, us(xe) + z0 + 12)))
        S.append(SPart("HDRIP", f"drip edge ({side} eave)", "metal", 4, box(xe - 20 if sgn < 0 else xe - 5, xe + 5 if sgn < 0 else xe + 20, yf - 20, yb + 20, us(xe) - 30, us(xe) + z0 + P.CORR_T)))
        for yr, nm in ((yf - 20, "front"), (yb + 20, "back")):
            pts = [(a, us(a) + RD - 20), (b, us(b) + RD - 20), (b, us(b) + z0 + P.CORR_T + 6), (a, us(a) + z0 + P.CORR_T + 6)]
            S.append(SPart("HRAKE", f"rake trim + closure ({nm}, {side})", "metal", 4, xz_prism(pts, yr - 3, yr + 3)))
    zr = us(P.RIDGE_X) + zf + (P.ROOF_FOAM_T if foam else 0) + P.CORR_T
    for sgn in (-1, 1):
        S.append(SPart("HCAP", "ridge cap (sealed, closures under it)", "metal", 4,
                       Pos(P.RIDGE_X + sgn * 70, (yf + yb) / 2, zr - 70 * PITCH + 6) * Rot(0, sgn * math.degrees(ANG), 0) * Box(150, yb - yf + 40, 2.5)))
    return S


# ------------------------------------------------------------------------------------------ vents, dampers, fan
def vent_parts(cfg):
    S = []
    motor = cfg in ("plus", "pro")
    for vid, (wall, u0, u1, z0, z1, role) in P.VENTS.items():
        if wall in ("left", "right"):
            xw = 0.0 if wall == "left" else CW
            sg = 1 if wall == "left" else -1
            S.append(SPart("VSCR", f"vent {vid} screen, 1/2 in hardware cloth ({role})", "mesh", 9,
                           box(xw - (T if wall == "left" else 0), xw + (0 if wall == "left" else T), u0, u1, z0, z1), alpha=0.3, bom="VENT"))
            # sliding damper plate on the inside face (slides +Y to open), guides, servo
            xd0, xd1 = (xw + 2, xw + 8) if wall == "left" else (xw - 8, xw - 2)
            S.append(SPart("VDMP", f"damper plate {vid} (HDPE, slides to open)", "hdpe", 9, box(xd0, xd1, u0 - 15, u1 + 15, z0 - 10, z1 + 10),
                           node=f"damper_{vid}", bom="DAMPER"))
            S.append(SPart("VDMP", f"damper guides {vid} (printed)", "dark", 9, box(xd0 - 2 * sg * 0, xd1, u0 - 20, u1 + (u1 - u0) + 30, z1 + 10, z1 + 16), bom="DAMPER"))
            S.append(SPart("VSRV", f"damper servo {vid} ({'MG90S-class' if motor else 'manual slide knob'})", "dark", 9,
                           box(xw + 8 * sg if wall == "left" else xw - 31, xw + 31 if wall == "left" else xw - 8, u1 + (u1 - u0) + 5, u1 + (u1 - u0) + 40, z0 + 10, z0 + 32), bom="DAMPER"))
        else:
            S.append(SPart("VSCR", f"vent {vid} screen, 1/2 in hardware cloth ({role})", "mesh", 9, box(u0, u1, Y0 - T, Y0, z0, z1), alpha=0.3, bom="VENT"))
            S.append(SPart("VDMP", f"damper plate {vid} (HDPE, slides to open)", "hdpe", 9, box(u0 - 15, u1 + 15, Y0 + 2, Y0 + 8, z0 - 10, z1 + 10), node=f"damper_{vid}", bom="DAMPER"))
            S.append(SPart("VDMP", f"intake baffle {vid} (turns the air up the front wall, no floor draft)", "hdpe", 9, box(u0 - 20, u1 + 20, Y0 + 55, Y0 + 61, z0 - 30, z1 + 120), bom="DAMPER"))
            S.append(SPart("VSRV", f"damper servo {vid}", "dark", 9, box(u0 - 60, u0 - 25, Y0 + 8, Y0 + 30, z0 + 10, z0 + 32), bom="DAMPER"))
    # exhaust fan behind V1 (inside), backdraft flap outside
    _, u0, u1, z0, z1, _ = P.VENTS["V1"]
    fy, fz, fs = (u0 + u1) / 2, (z0 + z1) / 2, P.FAN["size"]
    fz = min(fz, z1 - fs / 2 + 30)
    S.append(SPart("FAN", "12 V PWM exhaust fan 120x38 (housing)", "fan", 9, box(10, 10 + P.FAN["depth"], fy - fs / 2, fy + fs / 2, fz - fs / 2, fz + fs / 2) - cyl((0, fy, fz), (60, fy, fz), fs / 2 - 4), bom="FAN"))
    for k in range(5):
        a = k * 72.0
        blade = Pos(10 + P.FAN["depth"] / 2, fy, fz) * Rot(a, 0, 0) * Rot(0, 0, 0) * Pos(0, 0, fs / 4) * Rot(0, 25, 0) * Box(4, 22, fs / 2 - 14)
        S.append(SPart("FAN", "fan rotor blade", "dark", 9, blade, node="fan_rotor", bom="FAN"))
    S.append(SPart("FAN", "backdraft flap (outside V1, gravity-closed)", "hdpe", 9, box(-T - 6, -T - 2, u0, u1, z0 - 5, z1), node="fan_flap", bom="FAN"))
    return S


def weatherstrip(cfg):
    S = []
    dw = P.DOOR_PANEL[0]
    dx0 = P.XC - dw / 2
    for gx in (dx0 - P.DOOR_SLACK - 2, dx0 + dw + P.DOOR_SLACK - 4):
        S.append(SPart("WS", "EPDM weatherstrip, pop-door guide lip", "dark", 6, box(gx, gx + 6, Y0 + P.DOOR_T + 1, Y0 + P.DOOR_T + 7, P.GUIDE_Z0, P.GUIDE_Z0 + P.GUIDE_L - 60), bom="WS"))
    cw, ch = P.CLEANOUT
    cx0 = CW / 2 - cw / 2
    yb = Y1 + T
    z0 = P.CLEANOUT_Z0_NEW
    if not SP.SERVICE_DOORS:    # service doors carry their own frame-face EPDM (service_door_parts)
        for b in (box(cx0 - 8, cx0 + cw + 8, yb, yb + 6, z0 - 8, z0), box(cx0 - 8, cx0 + cw + 8, yb, yb + 6, z0 + ch, z0 + ch + 8),
                  box(cx0 - 8, cx0, yb, yb + 6, z0, z0 + ch), box(cx0 + cw, cx0 + cw + 8, yb, yb + 6, z0, z0 + ch)):
            S.append(SPart("WS", "EPDM weatherstrip, cleanout door", "dark", 6, b, bom="WS"))
    x0, x1 = P.TRAY_X[0] - 8, P.TRAY_X[1] + 8
    for b in (box(x0 - 10, x1 + 10, yb, yb + 6, P.SLOT["z1"], P.SLOT["z1"] + 10), box(x0 - 10, x0, yb, yb + 6, P.SLOT["z0"], P.SLOT["z1"]),
              box(x1, x1 + 10, yb, yb + 6, P.SLOT["z0"], P.SLOT["z1"])):
        S.append(SPart("WS", "EPDM slot gasket (bed cassette)", "dark", 2, b, bom="WS"))
    if cfg == "base":
        S.append(SPart("WS", "EPDM weatherstrip, nest-box lid seat", "dark", 8, box(P.NB_X0, P.NB_X1, P.NB_Y0, P.NB_Y0 + 8, P.NEST_FLOOR_Z - P.NB_T + P.NB_OUTER_H, P.NEST_FLOOR_Z - P.NB_T + P.NB_OUTER_H + 6), bom="WS"))
    else:
        S.append(SPart("WS", "EPDM weatherstrip, egg-bay collection door", "dark", 10, box(P.HOOD_X1 + 9, P.HOOD_X1 + 15, P.HOOD_Y0, P.HOOD_Y1 - 9, P.BASKET_FLOOR_Z + 60, P.HOOD_ROOF_Z), configs=(cfg,), bom="WS"))
    return S


# ------------------------------------------------------------------------------------------ deep-bed cassette
def bed_parts(cfg):
    S = []
    motor = cfg in P.CASSETTE_CONFIGS
    wx0, wx1 = P.PIT_WALL_X
    t = P.PIT_WALL_T
    yf = Y0 + 2 * T2
    zt = P.FLOOR_TOP_Z
    S.append(SPart("PIT-PAN", "pit pan 1/2 in ext ply (predator floor under the cassette)", "pt_lumber", 2, box(wx0, wx1, yf, Y1, P.PIT_BOTTOM, P.PIT_PAN_TOP) - box(595, 625, Y1 - 160, Y1 - 40, P.PIT_BOTTOM, P.PIT_PAN_TOP), bom="PIT"))
    for x0, side in ((wx0, "left"), (wx1 - t, "right")):
        S.append(SPart("PIT-WALL", f"pit wall {side} 3/4 ext ply (carries the slide)", "pt_lumber", 2, box(x0, x0 + t, yf, Y1, P.PIT_BOTTOM, zt), bom="PIT"))
    S.append(SPart("PIT-WALL", "pit wall front 3/4 ext ply", "pt_lumber", 2, box(wx0, wx1, yf, yf + t, P.PIT_BOTTOM, zt), bom="PIT"))
    S.append(SPart("PIT-WALL", "pit back skirt under the slot", "pt_lumber", 2, box(wx0, wx1, Y1, Y1 + T, P.PIT_BOTTOM, P.SLOT["z0"]), bom="PIT"))
    for x0, x1, side in ((0, wx0, "left"), (wx1, CW, "right")):
        S.append(SPart("P1", f"floor ledge {side} 3/4 ply (roost supports + cable run stand here)", "ply", 2, box(x0, x1, Y0, Y1 - T2, P.FLOOR_FRAME_Z1, zt)))
    S.append(SPart("P1", "floor ledge front 3/4 ply (pop-door landing)", "ply", 2, box(wx0, wx1, Y0, yf, P.FLOOR_FRAME_Z1, zt)))
    # slides (fixed members) + moving members
    zs = P.TRAY_Z0 + 40
    for xa, xb, side in ((wx0 + t, P.TRAY_X[0], "left"), (P.TRAY_X[1], wx1 - t, "right")):
        S.append(SPart("SLIDE", f"500 lb 44 in locking full-extension slide, fixed member ({side})", "metal", 2, box(xa, xb, yf + t, yf + t + P.SLIDE_L, zs, zs + P.SLIDE_H), bom="SLIDE"))
        S.append(SPart("SLIDE", f"slide inner member ({side})", "steel", 2, box(xa + 4, xb - 4, P.TRAY_Y[0], P.TRAY_Y[0] + P.SLIDE_L, zs + 8, zs + P.SLIDE_H - 8), node="cassette", bom="SLIDE"))
    # tray
    x0, x1 = P.TRAY_X
    ya, yb = P.TRAY_Y
    tw, z0, zr = P.TRAY_WALL_T, P.TRAY_Z0, P.TRAY_RIM_Z
    tray = box(x0, x1, ya, yb, z0, zr) - box(x0 + tw, x1 - tw, ya + tw, yb - 2 * tw, z0 + P.TRAY_FLOOR_T, zr + 1)
    S.append(SPart("CASSETTE", "deep-bed cassette tray 3/4 + 1/2 ext ply, HDPE-lined (10 in deep)", "hdpe", 2, tray, node="cassette", bom="CASSETTE"))
    S.append(SPart("CASSETTE", "poop-bin divider (rear compartment under the droppings board)", "hdpe", 2,
                   box(x0 + tw, x1 - tw, P.POOP_BIN_Y0, P.POOP_BIN_Y0 + 12, z0 + P.TRAY_FLOOR_T, zr - 10), node="cassette", bom="CASSETTE"))
    S.append(SPart("CASSETTE", "rear plug panel + handle (seals the slot on its EPDM gasket)", "dark", 2,
                   box(x0 + 150, x1 - 150, yb, yb + 25, (z0 + zr) / 2 - 15, (z0 + zr) / 2 + 15), node="cassette", bom="CASSETTE"))
    S.append(SPart("BED", f"deep litter bedding, pine/hemp, {P.BED_FILL_IN:.0f} in", "bedding", 2,
                   box(x0 + tw + 2, x1 - tw - 2, ya + tw + 2, P.POOP_BIN_Y0 - 2, z0 + P.TRAY_FLOOR_T, P.BED_TOP_Z), node="cassette", in_step=False))
    S.append(SPart("BED", "bedding in the poop-bin compartment", "bedding", 2,
                   box(x0 + tw + 2, x1 - tw - 2, P.POOP_BIN_Y0 + 14, yb - 2 * tw - 2, z0 + P.TRAY_FLOOR_T, z0 + P.TRAY_FLOOR_T + 3 * P.IN), node="cassette", in_step=False))
    S.append(SPart("BED-MOIST", "bedding moisture probe (capacitive, I2C)", "pcb", 9, box(400, 420, 3000, 3015, P.BED_TOP_Z - 90, P.BED_TOP_Z + 40), node="cassette", bom="BED-SENS"))
    S.append(SPart("BED-TEMP", "bedding temperature probe (DS18B20, stainless)", "metal", 9, cyl((800, 2800, P.BED_TOP_Z + 40), (800, 2800, P.BED_TOP_Z - 120), 3), node="cassette", bom="BED-SENS"))
    # drive (motorized configs) or hand pull
    xm = (x0 + x1) / 2
    S.append(SPart("CAS-RACK", "M1.5 steel gear rack under the tray (3 x 400 mm)", "steel", 2, box(xm - 7.5, xm + 7.5, ya + 20, yb - 20, z0 - 15, z0), node="cassette", bom="CAS-DRIVE"))
    if motor:
        S.append(SPart("CAS-PIN", "20T M1.5 pinion (30 mm PD) through the pan", "steel", 2, cyl((xm - 10, Y1 - 100, z0 - 30), (xm + 10, Y1 - 100, z0 - 30), 15.0), bom="CAS-DRIVE"))
        S.append(SPart("CAS-MOT", "12 V worm gearmotor 40 rpm, ~7 N.m stall, with hall encoder (under the pan)", "dark", 2,
                       box(xm - 30, xm + 70, Y1 - 160, Y1 - 40, P.PIT_BOTTOM - 110, P.PIT_BOTTOM), bom="CAS-DRIVE"))
        for y, nm in ((ya + 5, "home / bin-seated"), (ya + P.CASSETTE_TRAVEL["service"], "24 in service (poop bin)"), (ya + P.CASSETTE_TRAVEL["full"], "full out")):
            S.append(SPart("CAS-LS", f"limit switch: {nm}", "estop", 2, box(wx0 + t, wx0 + t + 12, min(y, Y1 - 30), min(y, Y1 - 30) + 18, zs - 30, zs - 5), bom="CAS-LS"))
    # slot flap (outside, top-hinged, rides on the tray, gravity-closes) + flap-closed switch
    S.append(SPart("SLOT-FLAP", "slot flap, HDPE 1/4 in, top-hinged, EPDM-sealed (gravity close)", "hdpe", 2,
                   box(x0 - 20, x1 + 20, Y1 + T + 6, Y1 + T + 12, P.SLOT["z0"] - 10, P.SLOT["flap_hinge_z"]), node="slot_flap", bom="SLOT"))
    S.append(SPart("SLOT-FLAP", "flap hinge (stainless piano)", "metal", 2, cyl((x0, Y1 + T + 12, P.SLOT["flap_hinge_z"]), (x1, Y1 + T + 12, P.SLOT["flap_hinge_z"]), 5), bom="SLOT"))
    # droppings board + cleats (scraper pushes off the back edge into the poop bin)
    d = P.DROP_BOARD
    S.append(SPart("DROP", "droppings board 1/2 ply + HDPE top (scraped to the back edge)", "drop", 8, box(d["x0"], d["x1"], d["y0"], d["y1"], d["z_top"] - d["t"], d["z_top"]), bom="DROP"))
    zc0 = d["z_top"] - d["t"] - P.S2
    for x0c, x1c in ((T2 if SP.SERVICE_DOORS else 0, d["x0"] + 10), (d["x1"] - 10, CW)):
        S.append(SPart("DROP", "droppings-board cleat 2x2", "lumber", 8, box(x0c, x1c, d["y0"] + 40, d["y1"] - 40, zc0, d["z_top"] - d["t"])))
    if SP.SERVICE_DOORS:        # the left wall behind the cleat is now the SD1 opening: two 2x2 legs to the floor ledge
        for yl in (d["y0"] + 45, d["y1"] - 45 - P.S2):
            S.append(SPart("DROP", "droppings-board left cleat leg 2x2 (on the floor ledge, SD1 opening behind)", "lumber", 8,
                           box(d["x0"] + 10 - P.S2, d["x0"] + 10, yl, yl + P.S2, P.FLOOR_TOP_Z, zc0)))
    return S


def egg_chute_parts(cfg):
    if cfg not in GANTRY:
        return []
    c = (cfg,)
    mx, my, mz = P.EGG_CHUTE["mouth"]
    dx, dy, dz = P.EGG_CHUTE["drawer"]
    S = [SPart("CHUTE", "egg chute mouth (padded funnel, 60 mm throat)", "hdpe", 10, box(mx - 45, CW - 2, my - 55, my + 55, mz - 60, mz) - box(mx - 37, CW - 10, my - 47, my + 47, mz - 55, mz + 1), configs=c, bom="CHUTE"),
         SPart("CHUTE", "padded egg chute 12 deg (through the right wall)", "hdpe", 10, cyl((mx, my, mz - 60), (dx - 60, dy, dz + 30), 34) - cyl((mx, my, mz - 60), (dx - 60, dy, dz + 30), 30), configs=c, bom="CHUTE"),
         SPart("EGG-DRAWER", "exterior egg drawer box", "hood", 10, box(CW + T, dx + 110, dy - 70, dy + 70, dz - 60, dz + 70) - box(CW + T + 6, dx + 104, dy - 64, dy + 64, dz - 54, dz + 71), configs=c, bom="CHUTE"),
         SPart("BASKET", "egg tray (padded, AprilTag tag36h11 id0) in the drawer", "basket", 10, box(dx - 90, dx + 90, dy - 55, dy + 55, dz - 54, dz - 30), configs=c, bom="BASKET"),
         SPart("EGG-DOOR", "egg drawer door (hinged, EPDM-sealed)", "door", 10, box(dx + 110, dx + 118, dy - 70, dy + 70, dz - 60, dz + 70), node="egg_door", configs=c, bom="CHUTE")]
    return S


# ------------------------------------------------------------------------------------------ human service doors
SVC_STEP = 6


def svc_pivot(door):
    """(x, y) of the hinge pin (vertical axis) and the opening sign (+1 = counter-clockwise seen from above)."""
    h = SP.HINGE
    if door == "SD1":
        d = SP.SD1
        return (-T - SP.PROUD - h["pin_out"], d["y0"] - SP.LAP + SP.GAP / 2), +1
    return (SP.SD2_X1 + SP.LAP - SP.GAP / 2, Y1 + T + SP.PROUD + h["pin_out"]), -1


def _brace_diag_dw(span, rise):
    return SP.BRACE_W / math.sin(math.atan2(rise, span))


def service_door_parts(cfg):
    """SD1 (left, under the gantry rail) + SD2 (back, the bigger cleanout): 2x4 frames, Z-braced siding skins on
    strap T-hinges (180 deg), two-step latches, frame-face EPDM, drip caps, door reeds RS-SD1 / RS-SD2."""
    if not SP.SERVICE_DOORS:
        return []
    S = []
    h, e, dr = SP.HINGE, SP.EPDM, SP.DRIP
    L, G, PR, BT, BW, BI = SP.LAP, SP.GAP, SP.PROUD, SP.BRACE_T, SP.BRACE_W, SP.BRACE_INSET
    gantry = tuple(c for c in ROBOT if c in GANTRY)
    # ---------------------------------------------------------------- SD1 left wall
    d = SP.SD1
    y0, y1, z0, z1 = d["y0"], d["y1"], d["z0"], d["z1"]
    jf, jb, hz = SP.SD1_JACK_F, SP.SD1_JACK_B, SP.SD1_HEADER
    S += [SPart("SD-FR", "SD1 hinge-side jack 2x4 flat (sistered to the front-left post)", "lumber", 3, box(0, T2, jf[0], jf[1], P.FLOOR_TOP_Z, hz[0])),
          SPart("SD-FR", "SD1 latch-side jack 2x4 flat (sistered to the back-left post)", "lumber", 3, box(0, T2, jb[0], jb[1], P.FLOOR_TOP_Z, hz[0])),
          SPart("SD-FR", "SD1 king 2x2 (front-left corner, floor to top plate)", "lumber", 3, box(0, S2, Y0, jf[0], P.FLOOR_TOP_Z, P.POST_TOP_Z)),
          SPart("SD-FR", "SD1 king 2x2 (back-left corner, rim to top plate)", "lumber", 3, box(0, S2, jb[1], Y1, P.FLOOR_FRAME_Z1, P.POST_TOP_Z)),
          SPart("SD-FR", "SD1 header 2x4 on edge (left Y rail bolts to it, full length)", "lumber", 3, box(0, T2, jf[0], jb[1], hz[0], hz[1]),
                length_in_hint=(jb[1] - jf[0]) / P.IN),
          SPart("SD-FR", "SD1 sill 2x2 on the floor ledge (litter dam, clears the roost studs)", "lumber", 3, box(0, S2, y0, y1, SP.SD1_SILL[0], SP.SD1_SILL[1]),
                length_in_hint=(y1 - y0) / P.IN)]
    for yb in SP.SD1_RAIL_BOLTS_Y:
        S.append(SPart("SD-RAILMT", "left Y rail standoff 7 mm HDPE + lag into the SD1 header", "dark", 11,
                       box(T2, P.GY_RAIL_X[0], yb - 20, yb + 20, P.GY_RAIL_Z[0], P.GY_RAIL_Z[1]), configs=gantry, bom="SD-HW"))
    n1 = "svc_sd1"
    xs0, xs1 = -T - PR, -PR                       # skin (in the siding plane, 3 mm proud)
    ya, yb_, za, zb = y0 - L + G, y1 + L - G, z0 - L + G, z1 + L - G
    S.append(SPart("SD1", "SD1 left service door skin 15/32 siding (38 x 18.3 in opening)", "door", SVC_STEP, box(xs0, xs1, ya, yb_, za, zb), node=n1))
    for zr in (z0 + BI, z1 - BI - BW):
        S.append(SPart("SD1", "SD1 Z-brace rail 1x4", "lumber", SVC_STEP, box(xs1, xs1 + BT, y0 + BI, y1 - BI, zr, zr + BW), node=n1))
    zlo, zhi = z0 + BI + BW, z1 - BI - BW
    dw = _brace_diag_dw(y1 - y0 - 2 * BI, zhi - zlo)
    S.append(SPart("SD1", "SD1 Z-brace diagonal 1x4 (low on the hinge side)", "lumber", SVC_STEP,
                   yz_prism([(y0 + BI, zlo), (y0 + BI + dw, zlo), (y1 - BI, zhi), (y1 - BI - dw, zhi)], xs1, xs1 + BT), node=n1))
    hz_list = (za + 40, zb - 40 - h["strap_w"])
    for zh in hz_list:
        S.append(SPart("SD-HINGE", "SD1 strap T-hinge, strap on the door (12 in)", "metal", SVC_STEP,
                       box(xs0 - h["strap_t"], xs0, ya, ya + 12 * P.IN, zh, zh + h["strap_w"]), node=n1, bom="SD-HW"))
    (px, py), _ = svc_pivot("SD1")
    for zh in hz_list:
        S.append(SPart("SD-HINGE", "SD1 T-hinge leaf on a 3/8 in spacer block (on the siding, over the jack)", "metal", SVC_STEP,
                       box(px + h["pin_r"], -T, py - G / 2 - h["leaf_l"], py - G / 2 - 2, zh, zh + h["strap_w"]), bom="SD-HW"))
        S.append(SPart("SD-HINGE", "SD1 hinge pin knuckle", "metal", SVC_STEP, cyl((px, py, zh), (px, py, zh + h["strap_w"]), h["pin_r"]), bom="SD-HW"))
    for zl in (za + 60, zb - 60):
        S.append(SPart("SD-LATCH", "SD1 4 in barrel bolt + carabiner (two-step latch)", "metal", SVC_STEP,
                       box(xs0 - 12, xs0, yb_ - 110, yb_ - 6, zl - 12, zl + 12), node=n1, bom="SD-HW"))
        S.append(SPart("SD-LATCH", "SD1 bolt keeper + carabiner staple (on the siding)", "metal", SVC_STEP,
                       box(xs0 - 12, -T, yb_ + G + 2, yb_ + G + 40, zl - 12, zl + 12), bom="SD-HW"))
    # frame-face EPDM in the lap band (skin inner face lands on it)
    for b in (box(-e["t"], 0, y0 - L + 3.5, y0 - L + 3.5 + e["w"], z0 - L + 3.5, z1 + L - 3.5),
              box(-e["t"], 0, y1 + L - 3.5 - e["w"], y1 + L - 3.5, z0 - L + 3.5, z1 + L - 3.5),
              box(-e["t"], 0, y0 - L + 3.5, y1 + L - 3.5, z0 - L + 3.5, z0 - L + 3.5 + e["w"]),
              box(-e["t"], 0, y0 - L + 3.5, y1 + L - 3.5, z1 + L - 3.5 - e["w"], z1 + L - 3.5)):
        S.append(SPart("WS", "EPDM bulb on the SD1 frame face", "dark", SVC_STEP, b, bom="WS"))
    S.append(SPart("SD-DRIP", "SD1 drip cap (galv. Z-flashing over the door head)", "metal", SVC_STEP,
                   box(-T - dr["out"], -T, y0 - L - 12, y1 + L + 12, z1 + L, z1 + L + dr["t"]), bom="SD-HW"))
    S.append(SPart("SD-DRIP", "SD1 drip cap flange (under the siding above)", "metal", SVC_STEP,
                   box(-T - dr["t"], -T, y0 - L - 12, y1 + L + 12, z1 + L, z1 + L + dr["flange"]), bom="SD-HW"))
    r = SP.DOOR_REEDS["RS-SD1"]
    S.append(SPart("RS-SD1", "RS-SD1 door-closed reed (SD1, robot interlock)", "reed", 9, box(6, 30, y1 - 10, y1, r["pos"][2] - 15, r["pos"][2] + 15), bom="SD-REED"))
    S.append(SPart("RS-SD1", "RS-SD1 magnet on the SD1 skin", "dark", 9, box(xs1, xs1 + 8, y1 - 31, y1 - 15, r["pos"][2] - 15, r["pos"][2] + 15), node=n1, bom="SD-REED"))
    # ---------------------------------------------------------------- SD2 back wall
    x0, x1, z0, z1 = SP.SD2_X0, SP.SD2_X1, SP.SD2_Z0, SP.SD2_Z1
    LL, LB = SP.SD2_LAP_LATCH, SP.SD2_LAP_BOTTOM
    yf = Y1 - T2
    S += [SPart("SD-FR", "SD2 latch-side jack 2x4 flat", "lumber", 3, box(*SP.SD2_JACK_L, yf, Y1, z0, z1)),
          SPart("SD-FR", "SD2 hinge-side jack 2x4 flat", "lumber", 3, box(*SP.SD2_JACK_R, yf, Y1, z0, z1)),
          SPart("SD-FR", "SD2 king 2x2 (rim to top plate)", "lumber", 3, box(*SP.SD2_KING_L, yf, Y1, P.FLOOR_FRAME_Z1, P.POST_TOP_Z)),
          SPart("SD-FR", "SD2 king 2x2 (rim to top plate)", "lumber", 3, box(*SP.SD2_KING_R, yf, Y1, P.FLOOR_FRAME_Z1, P.POST_TOP_Z)),
          SPart("SD-FR", "SD2 header 2x4 on edge (under the back top plate)", "lumber", 3, box(SP.SD2_JACK_L[0], SP.SD2_JACK_R[1], yf, Y1, z1, z1 + W2),
                length_in_hint=(SP.SD2_JACK_R[1] - SP.SD2_JACK_L[0]) / P.IN)]
    n2 = "svc_sd2"
    ys0, ys1 = Y1 + PR, Y1 + T + PR
    xa, xb, za, zb = x0 - LL + G, x1 + L - G, z0 - LB + G, z1 + L - G
    S.append(SPart("SD2", "SD2 back service door skin 15/32 siding (35.5 x 35.1 in opening, replaces the 36x28 cleanout)", "door", SVC_STEP,
                   box(xa, xb, ys0, ys1, za, zb), node=n2))
    for zr in (z0 + BI, z1 - BI - BW):
        S.append(SPart("SD2", "SD2 Z-brace rail 1x4", "lumber", SVC_STEP, box(x0 + BI, x1 - BI, ys0 - BT, ys0, zr, zr + BW), node=n2))
    zlo, zhi = z0 + BI + BW, z1 - BI - BW
    dw = _brace_diag_dw(x1 - x0 - 2 * BI, zhi - zlo)
    S.append(SPart("SD2", "SD2 Z-brace diagonal 1x4 (low on the hinge side)", "lumber", SVC_STEP,
                   xz_prism([(x1 - BI, zlo), (x1 - BI - dw, zlo), (x0 + BI, zhi), (x0 + BI + dw, zhi)], ys0 - BT, ys0), node=n2))
    hz_list = (za + 50, zb - 50 - h["strap_w"])
    for zh in hz_list:
        S.append(SPart("SD-HINGE", "SD2 strap T-hinge, strap on the door (16 in)", "metal", SVC_STEP,
                       box(xb - 16 * P.IN, xb, ys1, ys1 + h["strap_t"], zh, zh + h["strap_w"]), node=n2, bom="SD-HW"))
    (px, py), _ = svc_pivot("SD2")
    for zh in hz_list:
        S.append(SPart("SD-HINGE", "SD2 T-hinge leaf on a 3/8 in spacer block (on the siding, over the jack)", "metal", SVC_STEP,
                       box(px + G / 2 + 2, px + G / 2 + h["leaf_l"], Y1 + T, py - h["pin_r"], zh, zh + h["strap_w"]), bom="SD-HW"))
        S.append(SPart("SD-HINGE", "SD2 hinge pin knuckle", "metal", SVC_STEP, cyl((px, py, zh), (px, py, zh + h["strap_w"]), h["pin_r"]), bom="SD-HW"))
    for zl in (900.0, zb - 100):
        S.append(SPart("SD-LATCH", "SD2 4 in barrel bolt + carabiner (two-step latch)", "metal", SVC_STEP,
                       box(xa + 6, xa + 110, ys1, ys1 + 12, zl - 12, zl + 12), node=n2, bom="SD-HW"))
        S.append(SPart("SD-LATCH", "SD2 bolt keeper + carabiner staple (on the siding)", "metal", SVC_STEP,
                       box(xa - G - 30, xa - G - 2, Y1 + T, ys1 + 12, zl - 12, zl + 12), bom="SD-HW"))
    for b in (box(x0 - LL + 2, x0 - LL + 2 + 8, Y1, Y1 + e["t"], z0 - LB + 2, z1 + L - 3.5),
              box(x1 + L - 3.5 - e["w"], x1 + L - 3.5, Y1, Y1 + e["t"], z0 - LB + 2, z1 + L - 3.5),
              box(x0 - LL + 2, x1 + L - 3.5, Y1, Y1 + e["t"], z0 - LB + 2, z0 - LB + 2 + 8),
              box(x0 - LL + 2, x1 + L - 3.5, Y1, Y1 + e["t"], z1 + L - 3.5 - e["w"], z1 + L - 3.5)):
        S.append(SPart("WS", "EPDM bulb on the SD2 frame face", "dark", SVC_STEP, b, bom="WS"))
    S.append(SPart("SD-DRIP", "SD2 drip cap (galv. Z-flashing over the door head)", "metal", SVC_STEP,
                   box(x0 - LL - 12, x1 + L + 12, Y1 + T, Y1 + T + dr["out"], z1 + L, z1 + L + dr["t"]), bom="SD-HW"))
    S.append(SPart("SD-DRIP", "SD2 drip cap flange", "metal", SVC_STEP,
                   box(x0 - LL - 12, x1 + L + 12, Y1 + T, Y1 + T + dr["t"], z1 + L, z1 + L + dr["flange"]), bom="SD-HW"))
    r = SP.DOOR_REEDS["RS-SD2"]
    S.append(SPart("RS-SD2", "RS-SD2 door-closed reed (SD2, robot interlock)", "reed", 9, box(x0, x0 + 10, Y1 - 28, Y1 - 3, r["pos"][2] - 15, r["pos"][2] + 15), bom="SD-REED"))
    S.append(SPart("RS-SD2", "RS-SD2 magnet on the SD2 skin", "dark", 9, box(x0 + 13, x0 + 33, ys0 - 12, ys0, r["pos"][2] - 15, r["pos"][2] + 15), node=n2, bom="SD-REED"))
    return S


def house_parts(cfg):
    return (walls(cfg) + framing(cfg) + roof(cfg) + vent_parts(cfg) + weatherstrip(cfg) + bed_parts(cfg) + egg_chute_parts(cfg)
            + service_door_parts(cfg))


def roof_clearance():
    """Min rafter/ridge underside height over the gantry footprint, for the clearance check."""
    xs = [P.GY_RAIL_X[0], 150.0, P.G_PARK[0], 1070.0, P.GY_RAIL_X[1] + 20]
    return {f"x={x:.0f}": round(underside(x), 1) for x in xs} | {"ridge_board_bottom": round(ridge_top() - P.RIDGE_BOARD[1], 1),
                                                               "rafter_top_at_park_x": round(underside(P.G_PARK[0]) + RD, 1)}
