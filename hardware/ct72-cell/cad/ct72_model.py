"""TenderCells Chicken Tender Cell 72x72 rev A1.2 - parametric model (A1.1 + belt gantry, SO-101, nest bank, movable roosts) (build123d on OCP/OpenCascade,
the same kernel CadQuery uses). All geometry comes from ct72_params (MASTER_LAYOUT).

Each part is a Part record: name (TC_ naming per brief 4.1), layer, tiers it appears in,
motion group (None = static; 'X', 'Y', 'Z' = moves with that gantry stage) and BOM key.
Envelopes (keepouts) are returned separately: they are reference volumes, not hardware.
"""
from __future__ import annotations
import math
import os
from dataclasses import dataclass, field
from build123d import Box, Cylinder, Align, Location, Pos, Rot, Compound, Solid
import ct72_params as P

ALL = set(P.VARIANTS)
BELT_TIERS = {"starter", "plus", "pro"}
HERE = os.path.dirname(os.path.abspath(__file__))
UR3E_BREP = os.path.join(HERE, "..", "ref", "UR3e.brep")
UR3E_STEP = os.path.join(HERE, "..", "ref", "UR3e.step")


@dataclass
class Part:
    name: str
    layer: str                # frame | motion | arm | guarding | electronics
    shape: object
    tiers: set = field(default_factory=lambda: set(ALL))
    group: str | None = None  # None static, 'X','Y','Z' moving stage
    bom: str | None = None    # BOM key
    length: float | None = None  # cut length for extrusions/rails (mm)
    note: str = ""


def box(x0, x1, y0, y1, z0, z1):
    return Pos(x0, y0, z0) * Box(x1 - x0, y1 - y0, z1 - z0, align=(Align.MIN, Align.MIN, Align.MIN))


def cyl_z(cx, cy, z0, z1, d):
    return Pos(cx, cy, z0) * Cylinder(d / 2, z1 - z0, align=(Align.CENTER, Align.CENTER, Align.MIN))


def cyl_y(cx, cz, y0, y1, d):
    c = Cylinder(d / 2, y1 - y0, align=(Align.CENTER, Align.CENTER, Align.MIN))
    return Pos(cx, y0, cz) * Rot(-90, 0, 0) * c


W, D, H = P.PLATFORM_X, P.PLATFORM_Y, P.PLATFORM_Z


# ======================================================================= FRAME (shared)
def frame_parts():
    out = []
    posts = {"FL": (0, 0), "FR": (W - P.POST, 0), "BL": (0, D - P.POST), "BR": (W - P.POST, D - P.POST)}
    for k, (x, y) in posts.items():
        out.append(Part(f"TC_CT72_FRAME_POST_{k}", "frame", box(x, x + P.POST, y, y + P.POST, 0, H),
                        bom="EXT_4040", length=H))
        out.append(Part(f"TC_CT72_FRAME_FOOT_{k}", "frame", cyl_z(x + 20, y + 20, -40, 0, 60),
                        bom="LEVEL_FOOT", note="M8 levelling foot, frame datum = post bottom"))
    Lx, Ly = W - 2 * P.POST, D - 2 * P.POST
    for lvl, z0 in P.RING_LEVELS.items():
        z1 = z0 + P.RING_H
        out += [
            Part(f"TC_CT72_FRAME_{lvl}_RING_FRONT", "frame", box(P.POST, W - P.POST, 0, P.RING_T, z0, z1), bom="EXT_2040", length=Lx),
            Part(f"TC_CT72_FRAME_{lvl}_RING_BACK", "frame", box(P.POST, W - P.POST, D - P.RING_T, D, z0, z1), bom="EXT_2040", length=Lx),
            Part(f"TC_CT72_FRAME_{lvl}_RING_LEFT", "frame", box(0, P.RING_T, P.POST, D - P.POST, z0, z1), bom="EXT_2040", length=Ly),
            Part(f"TC_CT72_FRAME_{lvl}_RING_RIGHT", "frame", box(W - P.RING_T, W, P.POST, D - P.POST, z0, z1), bom="EXT_2040", length=Ly),
        ]
    # coop modules that live in the frame (brief 10-12); simple envelopes, shared by every tier
    bx0 = W / 2 - P.POOP_BIN_X / 2
    by0 = P.INNER0 + P.MODULE_CLEARANCE
    out.append(Part("TC_MOD_POOP_BIN_TRAY", "frame",
                    box(bx0, bx0 + P.POOP_BIN_X, by0, by0 + P.POOP_BIN_Y, P.POOP_BIN_Z0, P.POOP_BIN_Z0 + P.POOP_BIN_HEIGHT),
                    bom="POOP_BIN", note="stowed; slides out the front by POOP_BIN_PULL_OUT"))
    bed_y0 = by0 + P.POOP_BIN_Y + P.MODULE_CLEARANCE
    out.append(Part("TC_MOD_DEEP_BED_TRAY", "frame",
                    box(P.INNER0, W - P.INNER0, bed_y0, D - P.INNER0, P.RING_H, P.PLANE_BED_TOP),
                    bom="BED_TRAY", note="tray floor on bottom-ring ledgers, lip at PLANE_BED_TOP"))
    return out


# ======================================================================= COOP MODULES (A1.2)
def nest_box_bounds(i):
    """Interior AABB of nest box i (x0,x1,y0,y1,z0,z1); z0 = top of liner."""
    y0 = P.NB_Y0 + i * P.NB_PITCH + P.NB_WALL
    x0 = P.NB_X0 + P.NB_WALL
    return (x0, x0 + P.NB_IN, y0, y0 + P.NB_IN, P.NB_FLOOR_Z + P.NB_LINER_T, P.NB_TOP_Z)


def basket_bounds():
    x0 = P.BK_X0 + P.NB_WALL; y0 = P.BK_Y0 + P.NB_WALL
    return (x0, x0 + P.BK_IN[0], y0, y0 + P.BK_IN[1], P.BK_FLOOR_Z, P.BK_FLOOR_Z + P.BK_IN[2])


def coop_parts(lid="closed"):
    """Nest-box bank (flat floors + removable liners, open aisle side above a lip, hinged top lids),
    egg-basket pocket with AprilTag tab + exterior hatch, shelf rail. All on the LEFT wall."""
    out = []
    n = P.NEST_BOX_COUNT
    wl, t = P.NB_WALL, P.NB_LID_T
    x0, x1 = P.NB_X0, P.NB_X1
    yb0 = P.BK_Y0
    yb1 = P.NB_Y0 + n * P.NB_PITCH + wl
    out.append(Part("TC_NEST_SHELF_RAIL_LEFT", "frame", box(0, P.RING_T, P.POST, D - P.POST, P.NB_RAIL_Z0, P.NB_RAIL_Z0 + P.RING_H),
                    bom="EXT_2040", length=D - 2 * P.POST, note="2040 between left posts, carries bank + basket"))
    out.append(Part("TC_NEST_SHELF", "frame", box(x0, x1, yb0, yb1, P.NB_RAIL_Z0 + P.RING_H, P.NB_FLOOR_Z - wl),
                    bom="NEST_SHELF", note="18 mm ply shelf + 2 steel L-brackets to the rail"))
    for i in range(n):
        ix0, ix1, iy0, iy1, iz0, iz1 = nest_box_bounds(i)
        k = f"TC_NEST_BOX_{i + 1:02d}"
        fz0 = P.NB_FLOOR_Z - wl
        ya = iy0 - wl if i == 0 else iy0          # dividers are shared: box i owns its back-Y divider
        out += [
            Part(f"{k}_FLOOR", "frame", box(x0, x1, ya, iy1 + wl, fz0, P.NB_FLOOR_Z), bom="NEST_BOX", note="flat floor (no rollaway)"),
            Part(f"{k}_LINER", "frame", box(ix0, ix1, iy0, iy1, P.NB_FLOOR_Z, P.NB_FLOOR_Z + P.NB_LINER_T), bom="NEST_LINER",
                 note="removable washable nest pad, slides out the aisle side"),
            Part(f"{k}_BACK", "frame", box(x0, ix0, iy0, iy1, P.NB_FLOOR_Z, iz1), bom=None),
            Part(f"{k}_SIDE_BACKY", "frame", box(x0, x1, iy1, iy1 + wl, P.NB_FLOOR_Z, iz1), bom=None, note="divider / end wall"),
            Part(f"{k}_LIP", "frame", box(ix1, x1, iy0, iy1, P.NB_FLOOR_Z, iz0 + P.NB_LIP_H), bom=None,
                 note="aisle-side lip; open above it = hen entrance + arm SIDE access"),
            Part(f"{k}_TOPRAIL", "frame", box(ix1, x1, iy0, iy1, iz1 - P.NB_TOPRAIL_H, iz1), bom=None),
        ]
        if i == 0:
            out.append(Part(f"{k}_SIDE_FRONTY", "frame", box(x0, x1, iy0 - wl, iy0, P.NB_FLOOR_Z, iz1), bom=None))
        if lid == "closed":
            lp = box(x0, x0 + P.NB_LID_LEN, iy0 - wl / 2 + 1, iy1 + wl / 2 - 1, iz1, iz1 + t)
        else:   # opened to vertical against the wall (hinge at the wall-side top edge)
            lp = box(x0, x0 + t, iy0 - wl / 2 + 1, iy1 + wl / 2 - 1, iz1, iz1 + P.NB_LID_LEN)
        out.append(Part(f"{k}_LID", "frame", lp, bom="NEST_LID", note=f"hinged top lid ({lid}); arm TOP access when open"))
    # lid actuator (one 12 V actuator opens both lids through a common hinge rod) in the gap to the basket
    out.append(Part("TC_NEST_LID_ACTUATOR", "frame", box(P.RING_T, P.RING_T + 40, P.NB_Y0 - 60, P.NB_Y0 - 20, P.NB_TOP_Z - 200, P.NB_TOP_Z + 60),
                    bom="LID_ACT", note="12 V linear actuator + lid-open reed switch; manual prop-rod fallback"))
    # basket pocket
    bx0, bx1, by0, by1, bz0, bz1 = basket_bounds()
    out += [
        Part("TC_BASKET_POCKET_FLOOR", "frame", box(P.BK_X0, bx1 + wl, by0 - wl, by1 + wl, bz0 - wl, bz0), bom="BASKET_POCKET"),
        Part("TC_BASKET_POCKET_SIDE_FRONTY", "frame", box(P.BK_X0, bx1 + wl, by0 - wl, by0, bz0, bz1), bom=None),
        Part("TC_BASKET_POCKET_SIDE_BACKY", "frame", box(P.BK_X0, bx1 + wl, by1, by1 + wl, bz0, bz1), bom=None),
        Part("TC_BASKET_POCKET_LIP", "frame", box(bx1, bx1 + wl, by0, by1, bz0, bz0 + P.BK_LIP_H), bom=None,
             note="aisle-side lip; open side + open top for TOP or SIDE place"),
        Part("TC_BASKET_POCKET_HATCH_DOOR", "frame", box(P.BK_X0, bx0, by0, by1, bz0, bz1), bom=None,
             note="pocket back wall = egg-collection hatch, opens to the LEFT exterior"),
        Part("TC_EGG_BASKET", "frame", box(bx0 + 10, bx0 + 260, by0 + 15, by0 + 215, bz0, bz0 + 120), bom="EGG_BASKET",
             note="registered by printed corner locators in the pocket floor"),
        Part("TC_BASKET_APRILTAG_TAB", "frame", box(bx0 + 20, bx0 + 100, by0 - wl - 60, by0, bz1, bz1 + 3), bom="APRILTAG",
             note="tag36h11 id 0, 60 mm, horizontal tab, seen by the overhead + gantry cams"),
    ]
    return out


def roost_pivot_x(name):
    return P.ROOST_PIVOT_X - (50.0 if name == "B" else 0.0)   # B's tube sits 50 mm further in so the stowed bars nest


def roost_bar_geom(name, top_z, r, state):
    """Return dict of solids for one movable roost bar (torque tube, 2 swing arms, bar, actuator, guards)."""
    yb0 = P.ROOST_Y0R; yb1 = yb0 + P.ROOST_BAR_LEN
    xp = roost_pivot_x(name)
    tr = P.ROOST_TUBE_D / 2
    zp = top_z - P.ROOST_BAR_T / 2
    w, th = P.ROOST_BAR_W, P.ROOST_BAR_T
    aw, at = P.ROOST_ARM_W, P.ROOST_ARM_T
    arm_y = (yb0 - at, yb1) if name == "A" else (yb0 + 60, yb1 - 60 - at)   # A arms outboard, B arms inboard
    g = {}
    if state == "deployed":
        cx, cz = xp - r, zp
        g["BAR"] = box(cx - w / 2, cx + w / 2, yb0, yb1, cz - th / 2, cz + th / 2)
        for k, y in zip(("ARM1", "ARM2"), arm_y):
            g[k] = box(cx - w / 2 if name == "A" else cx - w / 2, xp - tr, y, y + at,
                       zp - aw / 2 if name == "A" else cz + th / 2, zp + aw / 2 if name == "A" else cz + th / 2 + aw)
    else:   # stowed: swung DOWN 90 deg, hangs flat to the right wall
        cx, cz = xp, zp - r
        g["BAR"] = box(cx - th / 2, cx + th / 2, yb0, yb1, cz - w / 2, cz + w / 2)
        for k, y in zip(("ARM1", "ARM2"), arm_y):
            if name == "A":
                g[k] = box(xp - aw / 2, xp + aw / 2, y, y + at, cz - w / 2, zp - tr)
            else:   # B arms (above the bar when deployed) rotate to the bar's aisle-side face; cranked to the tube
                g[k] = box(cx - th / 2 - aw, cx - th / 2, y, y + at, cz - w / 2, zp - tr)
    ty0, ty1 = (yb0 - 120, yb1 + 20) if name == "A" else (yb0 + 40, yb1 + 120)
    g["TUBE"] = cyl_y(xp, zp, ty0, ty1, P.ROOST_TUBE_D)
    g["RAIL"] = box(W - P.RING_T, W, P.POST, D - P.POST, zp - P.RING_H / 2, zp + P.RING_H / 2)
    ay = (yb0 - 110, yb0 - 70) if name == "A" else (yb1 + 70, yb1 + 110)
    g["ACTUATOR"] = box(xp + 14, xp + 44, ay[0], ay[1], zp - 360, zp - 40)
    g["PINCH_GUARD"] = box(xp - 22, min(xp + 48, W - P.RING_T - 1), ay[0] - 10, ay[1] + 10, zp - 45, zp + 30)
    return g


def roost_parts(state="deployed"):
    out = []
    for name, top_z, r in P.ROOST_BARS:
        g = roost_bar_geom(name, top_z, r, state)
        k = f"TC_ROOST_{name}"
        out += [
            Part(f"{k}_BAR", "frame", g["BAR"], bom="ROOST_BAR", note=f"2x1.5 in flat-top bar, 42 in, {state}"),
            Part(f"{k}_SWING_ARM_1", "frame", g["ARM1"], bom="ROOST_ARM", note="flat-bar swing arm + 5 kg load cell at the bar bracket"),
            Part(f"{k}_SWING_ARM_2", "frame", g["ARM2"], bom="ROOST_ARM"),
            Part(f"{k}_TORQUE_TUBE", "frame", g["TUBE"], bom="ROOST_TUBE", note="1 in tube on 2 pillow blocks"),
            Part(f"{k}_PIVOT_RAIL", "frame", g["RAIL"], bom="EXT_2040", length=D - 2 * P.POST, note="2040 between right posts"),
            Part(f"{k}_ACTUATOR", "frame", g["ACTUATOR"], bom="ROOST_ACT", note="12 V linear actuator on a lever; quick-release pin = manual fallback"),
            Part(f"{k}_PINCH_GUARD", "frame", g["PINCH_GUARD"], bom="PINCH_GUARD", note="printed cover over lever/clevis/hinge"),
        ]
    return out


# ======================================================================= MOTION (A1.2 belt gantry, per variant)
def motion_parts(gx, gy, pz, variant="plus"):
    """3D-printer-style Cartesian gantry: dual-motor X (front/back 2040 beams, closed GT2 loops, motors fixed
    at the LEFT end, idlers at the right), Y on the moving 2080 bridge (motor rides the bridge), Z lead screw
    on the fixed 4040 mast. pro_heavy = stiff option (HTD5M belts, MGN15 class rails drawn at MGN12 size,
    NEMA23 + SFU1605 ball-screw Z with brake)."""
    out = []
    heavy = variant == "pro_heavy"
    guide = P.X_GUIDE[variant]
    mot = P.N23 if heavy else P.N17
    mk = "NEMA23_XY" if heavy else "NEMA17_XY"
    zr0, zr1 = P.RING_LEVELS["RAIL"], P.Z_RAIL_TOP
    xr_len = W - 2 * P.POST
    for side, (y0, y1) in {"FRONT": (P.RING_T, P.POST), "BACK": (D - P.POST, D - P.RING_T)}.items():
        yc = (y0 + y1) / 2
        inner = P.POST if side == "FRONT" else D - P.POST - 1.5
        out.append(Part(f"TC_RAIL_X_{side}_BEAM", "motion", box(P.POST, W - P.POST, y0, y1, zr0, zr1),
                        bom="EXT_2040", length=xr_len, note="X beam; V-slot track (Starter) or rail seat"))
        if guide != "vwheel":
            out.append(Part(f"TC_RAIL_X_{side}_LINEAR_RAIL", "motion",
                            box(P.POST + 20, W - P.POST - 20, yc - 6, yc + 6, zr1, zr1 + P.MGN12_H),
                            bom="MGN15_RAIL" if heavy else "MGN12_RAIL", length=xr_len - 40))
        out.append(Part(f"TC_RAIL_X_{side}_CARRIAGE", "motion",
                        box(gx - 22.5, gx + 22.5, yc - 13.5, yc + 13.5, P.Z_XCAR0, P.Z_XPLATE0), group="X",
                        bom={"vwheel": "VWHEEL_CARRIAGE", "mgn12": "MGN12H_BLOCK", "mgn15": "MGN15H_BLOCK"}[guide]))
        py0, py1 = (10, 90) if side == "FRONT" else (D - 90, D - 10)
        out.append(Part(f"TC_RAIL_X_{side}_PLATE", "motion",
                        box(gx - 60, gx + 60, py0, py1, P.Z_XPLATE0, P.Z_BRIDGE0), group="X", bom="PLATE_X"))
        my0, my1 = (2, 2 + mot[0]) if side == "FRONT" else (D - 2 - mot[0], D - 2)
        out.append(Part(f"TC_MOTOR_X_{side}", "motion",
                        box(P.POST + 5, P.POST + 5 + mot[0], my0, my1, P.Z_XPLATE0, P.Z_XPLATE0 + mot[1]),
                        bom=mk, note="fixed at the left rail end, 20T pulley, closed belt loop"))
        # closed belt loop: two strands on the inner face of the beam, idler at the right end
        bw = 15.0 if heavy else 10.0
        for k, zb in (("UPPER", zr1 - 2 - bw), ("LOWER", zr0 + 2)):
            out.append(Part(f"TC_BELT_X_{side}_{k}", "motion",
                            box(P.POST + 40, W - P.POST - 40, inner, inner + 1.5, zb, zb + bw),
                            bom=None, note=P.BELT[variant] + " strand"))
        out.append(Part(f"TC_IDLER_X_{side}", "motion",
                        box(W - P.POST - 40, W - P.POST - 20, inner - 10 if side == "BACK" else inner, (inner + 11.5) if side == "FRONT" else inner + 1.5, zr0, zr1),
                        bom="IDLER_TENSIONER", note="20T idler + screw tensioner"))
        out.append(Part(f"TC_ENDSTOP_X_{side}_MIN", "motion",
                        box(P.POST + 70, P.POST + 90, yc - 10, yc + 10, zr1 + P.MGN12_H + 0.5, zr1 + P.MGN12_H + 10),
                        bom="ENDSTOP_MECH", note="X min, one per side -> Klipper dual-X squaring"))
    # Y bridge (moves in X) + Y belt + motor on the bridge
    out.append(Part("TC_RAIL_Y_BRIDGE", "motion", box(gx - 10, gx + 10, 30, D - 30, P.Z_BRIDGE0, P.Z_BRIDGE1),
                    group="X", bom="EXT_2080", length=D - 60))
    if guide != "vwheel":
        out.append(Part("TC_RAIL_Y_LINEAR_RAIL", "motion", box(gx - 18, gx - 10, 60, D - 60, P.Z_BRIDGE0 + 34, P.Z_BRIDGE0 + 46),
                        group="X", bom="MGN15_RAIL" if heavy else "MGN12_RAIL", length=D - 120))
    out.append(Part("TC_MOTOR_Y", "motion", box(gx + 10, gx + 10 + mot[0], 30, 30 + mot[0], P.Z_BRIDGE0 + 3, P.Z_BRIDGE0 + 3 + mot[1]),
                    group="X", bom=mk))
    out.append(Part("TC_BELT_Y", "motion", box(gx + 10, gx + 11.5, 90, D - 90, P.Z_BRIDGE1 - 20 - (15 if heavy else 10), P.Z_BRIDGE1 - 20),
                    group="X", bom=None, note=P.BELT[variant] + " Y loop on the bridge's +X face"))
    out.append(Part("TC_ENDSTOP_Y_MIN", "motion", box(gx + 12, gx + 30, 95, 115, P.Z_BRIDGE0 + 50, P.Z_BRIDGE0 + 60),
                    group="X", bom="ENDSTOP_MECH"))
    # Y carriage + fixed Z mast (moves in X,Y)
    out.append(Part("TC_RAIL_Y_CARRIAGE", "motion", box(gx - 31, gx - 18, gy - 22.5, gy + 22.5, P.Z_BRIDGE0 + 26.5, P.Z_BRIDGE0 + 53.5),
                    group="Y", bom={"vwheel": "VWHEEL_CARRIAGE", "mgn12": "MGN12H_BLOCK", "mgn15": "MGN15H_BLOCK"}[guide]))
    out.append(Part("TC_RAIL_Y_PLATE", "motion", box(gx - 41, gx - 31, gy - 60, gy + 60, P.Z_BRIDGE0, P.Z_BRIDGE1),
                    group="Y", bom="PLATE_Y"))
    out.append(Part("TC_RAIL_Z_LIFT_MAST", "motion", box(gx - 81, gx - 41, gy - 20, gy + 20, P.MAST_Z0, P.Z_BRIDGE1),
                    group="Y", bom="EXT_4040", length=P.Z_BRIDGE1 - P.MAST_Z0))
    out.append(Part("TC_RAIL_Z_MGN15", "motion", box(gx - 91, gx - 81, gy - 7.5, gy + 7.5, P.PZ_MIN, P.Z_BRIDGE1 - 17),
                    group="Y", bom="MGN15_RAIL", length=P.Z_BRIDGE1 - 17 - P.PZ_MIN))
    sd = 16.0 if heavy else 8.0
    out.append(Part("TC_Z_SCREW", "motion", cyl_z(gx - 99, gy + 28, P.PZ_MIN, P.Z_BRIDGE1 - 5, sd), group="Y",
                    bom="Z_SFU1605_KIT" if heavy else "Z_TR8_KIT", length=P.Z_BRIDGE1 - 5 - P.PZ_MIN,
                    note="SFU1605 ball screw + BK/BF12" if heavy else "Tr8x2 lead screw (self-locking, holds the arm unpowered)"))
    zm = P.N23 if heavy else P.N17
    out.append(Part("TC_MOTOR_Z", "motion", box(gx - 99 - zm[0] / 2, gx - 99 + zm[0] / 2, gy + 28 - zm[0] / 2, gy + 28 + zm[0] / 2,
                                                P.Z_BRIDGE1, P.Z_BRIDGE1 + zm[1] + (40 if heavy else 0)),
                    group="Y", bom="MOTOR_Z_N23B" if heavy else "NEMA17_Z", note="NEMA23 + 24 V brake" if heavy else "NEMA17 0.59 Nm, coupler to Tr8x2"))
    out.append(Part("TC_ENDSTOP_Z_MAX", "motion", box(gx - 107, gx - 91, gy - 30, gy - 18, P.Z_BRIDGE1 - 60, P.Z_BRIDGE1 - 45),
                    group="Y", bom="ENDSTOP_MECH", note="Z homes UP (away from birds)"))
    # Z carriage + universal mount plate + adapter ring (moves in X,Y,Z)
    out.append(Part("TC_RAIL_Z_CARRIAGE", "motion", box(gx - 107, gx - 91, gy - 17, gy + 17, pz, pz + 60),
                    group="Z", bom="MGN15H_BLOCK"))
    out.append(Part("TC_RAIL_Z_PLATE", "motion", box(gx - 117, gx - 107, gy - 60, gy + 60, pz, pz + 150),
                    group="Z", bom="PLATE_Z"))
    out.append(Part("TC_Z_NUT_BLOCK", "motion", box(gx - 107, gx - 87, gy + 16, gy + 40, pz + 100, pz + 140) - cyl_z(gx - 99, gy + 28, pz + 99, pz + 141, sd + 0.5),
                    group="Z", bom=None, note="screw nut block on the Z carriage plate"))
    plate = box(gx + P.ARM_PLATE_X1_OFF - P.ARM_PLATE_X, gx + P.ARM_PLATE_X1_OFF, gy - 125, gy + 125, pz, pz + P.ZPLATE_T)
    bx = gx + P.ARM_BASE_X_OFF
    for i in range(-2, 3):
        for j in range(-2, 3):
            plate = plate - cyl_z(bx + 50 * i, gy + 50 * j, pz - 1, pz + P.ZPLATE_T + 1, 6.6)
    out.append(Part("TC_ROBOT_MOUNT_PLATE", "motion", plate, group="Z", bom="PLATE_ARM",
                    note=f"UNIVERSAL plate 250x250x12.7 6061, 5x5 M6 @50 mm; rated {P.PLATE_RATED_ARM_KG} kg arm + {P.PLATE_RATED_PAYLOAD_KG} kg payload (UR3e)"))
    out.append(Part("TC_ROBOT_MOUNT_GUSSET", "motion",
                    box(gx + P.ARM_PLATE_X1_OFF - 60, gx + P.ARM_PLATE_X1_OFF, gy - 5, gy + 5, pz + P.ZPLATE_T, pz + 110),
                    group="Z", bom="PLATE_GUSSET"))
    return out


# ======================================================================= ARM (per tier)
_UR3E = None
_UR3E_ROT = None


def ur3e_raw():
    """Real UR3e geometry from the UR-supplied STEP (cached as BREP after the first import)."""
    global _UR3E
    if _UR3E is None:
        if os.path.exists(UR3E_BREP):
            from OCP.BRepTools import BRepTools
            from OCP.TopoDS import TopoDS_Shape
            from OCP.BRep import BRep_Builder
            s = TopoDS_Shape()
            BRepTools.Read_s(s, UR3E_BREP, BRep_Builder())
            _UR3E = Compound(s)
        else:
            from build123d import import_step
            _UR3E = import_step(UR3E_STEP)
    return _UR3E


def ur3e_placed(bx, by, top_z):
    """UR3e STEP pose has its base flange at y=0, axis +Y. Invert it under the plate:
    Rot about X by -90 maps +Y -> -Z; then put the highest point on the plate underside."""
    global _UR3E_ROT
    if _UR3E_ROT is None:
        r = Rot(-90, 0, 0) * ur3e_raw()
        _UR3E_ROT = (r, r.bounding_box(optimal=False).max.Z)
    r, zmax = _UR3E_ROT
    return Pos(bx, by, top_z - zmax) * r


def _seg_cyl(p0, p1, d):
    """Cylinder between two 3D points (mm)."""
    import numpy as np
    from build123d import Axis, Vector
    v = np.asarray(p1, float) - np.asarray(p0, float)
    L = float(np.linalg.norm(v))
    c = Cylinder(d / 2, L, align=(Align.CENTER, Align.CENTER, Align.MIN))
    z = Vector(0, 0, 1); t = Vector(*v).normalized()
    ax = z.cross(t)
    ang = math.degrees(math.acos(max(-1.0, min(1.0, z.dot(t)))))
    if ax.length > 1e-9:
        c = c.rotate(Axis((0, 0, 0), (ax.X, ax.Y, ax.Z)), ang)
    elif ang > 90:
        c = c.rotate(Axis.X, 180)
    return Pos(*[float(x) for x in p0]) * c


def so101_solids(base, pose):
    """Simplified SO-101 follower solids (capsule-like cylinders) at a joint pose, from so101_kin."""
    import so101_kin as K
    pts = K.fk(base, *pose)
    parts = []
    import numpy as np
    for p0, p1, r, nm in K.capsules(pts):
        if nm == "base+shoulder":
            p0 = np.asarray(p0) + np.array([0, 0, -12.0])   # start below the adapter ring face (tilted segment)
        parts.append(_seg_cyl(p0, p1, 2 * r * 0.8))   # STEP solid slightly slimmer than the check capsule
    s = parts[0]
    for q in parts[1:]:
        s = s + q
    return s


def arm_parts(tier, gx, gy, pz, pose=None):
    """tier = variant. Adapter RING bolts to the universal plate grid; the arm/tool hangs below it."""
    a = P.ARMS[tier]
    od, t, pat = P.ADAPTER_RINGS[tier]
    bx, by = gx + P.BASE_X_OFF[tier], gy
    z_ad0 = pz - t
    out = [Part(f"TC_ROBOT_ADAPTER_RING_{tier.upper()}", "arm", cyl_z(bx, by, z_ad0, pz, od) - cyl_z(bx, by, z_ad0 - 1, pz + 1, 30.0),
                tiers={tier}, group="Z", bom=f"ADAPTER_{tier.upper()}", note=f"swappable adapter ring: {pat}")]
    if tier == "pro_heavy":
        out.append(Part("TC_ROBOT_ARM_UR3E", "arm", ur3e_placed(bx, by, z_ad0), tiers={tier}, group="Z", bom="ARM_PRO_HEAVY",
                        note="real UR3e STEP (universal-robots.com), reference pose, inverted"))
    elif tier == "starter":
        bd, bh, ld, ll = a.proxy
        out.append(Part("TC_EGG_TOOL_OUTRIGGER", "arm", box(bx - 30, gx + P.ARM_BASE_X_OFF - 75, by - 30, by + 30, pz - 12, pz),
                        tiers={tier}, group="Z", bom=None, note="6 mm Al outrigger bolted to the M6 grid, carries the tool 140 mm past the grid centre"))
        out.append(Part("TC_EGG_TOOL_VACUUM_PLUNGER", "arm", box(bx - 25, bx + 25, by - 25, by + 25, z_ad0 - bh, z_ad0),
                        tiers={tier}, group="Z", bom="EGG_TOOL_VAC", note="spring plunger 20 mm compliance + contact switch"))
        out.append(Part("TC_EGG_TOOL_VACUUM_TUBE", "arm", cyl_z(bx, by, z_ad0 - bh - ll, z_ad0 - bh, 16.0),
                        tiers={tier}, group="Z", bom=None))
        out.append(Part("TC_EGG_TOOL_VACUUM_CUP", "arm", cyl_z(bx, by, z_ad0 - bh - ll - 15, z_ad0 - bh - ll, P.VAC_CUP_D),
                        tiers={tier}, group="Z", bom=None, note=f"soft silicone bellows cup D{P.VAC_CUP_D:.0f}, limit {P.VAC_LIMIT_KPA:.0f} kPa"))
    else:
        import so101_kin as K
        pose = pose or K.folded_pose()
        out.append(Part(f"TC_ROBOT_ARM_SO101_{tier.upper()}", "arm", so101_solids((bx, by, z_ad0), pose), tiers={tier}, group="Z",
                        bom="ARM_SO101_FOLLOWER", note="SO-101 follower, simplified link solids from the URDF dims, folded transit pose"))
        out.append(Part(f"TC_SO101_BUS_BOARD_{tier.upper()}", "arm", box(bx + 70, bx + 115, by - 30, by + 30, pz - 25, pz),
                        tiers={tier}, group="Z", bom=None, note="Feetech/Waveshare bus servo board under the plate"))
    return out


# ======================================================================= GUARDING
def guarding_parts():
    t = P.PANEL_T
    dx0 = W / 2 - P.SERVICE_DOOR_W / 2
    dz0 = P.SERVICE_DOOR_Z0
    front = box(0, W, -t, 0, 0, H)
    front = front - box(dx0, dx0 + P.SERVICE_DOOR_W, -t - 1, 1, dz0, dz0 + P.SERVICE_DOOR_H)
    bx0 = W / 2 - P.POOP_BIN_X / 2 - P.MODULE_CLEARANCE
    front = front - box(bx0, W - bx0, -t - 1, 1, P.POOP_BIN_Z0, P.POOP_BIN_Z0 + P.POOP_BIN_ACCESS_H)
    right = box(W, W + t, 0, D, 0, H)
    right = right - box(W - 1, W + t + 1, P.CHICKEN_DOOR_Y0, P.CHICKEN_DOOR_Y0 + P.CHICKEN_DOOR_W,
                        P.PLANE_BED_TOP, P.PLANE_BED_TOP + P.CHICKEN_DOOR_H)
    out = [
        Part("TC_GUARD_PANEL_FRONT", "guarding", front, bom="GUARD_MESH", note="service door + poop-bin access cut-outs"),
        Part("TC_GUARD_PANEL_BACK", "guarding", box(0, W, D, D + t, 0, H), bom="GUARD_SHEAR",
             note="3 mm ACM shear panel = frame bracing (back)"),
        Part("TC_GUARD_PANEL_LEFT", "guarding", box(-t, 0, 0, D, 0, H) - box(-t - 1, 1, P.BK_Y0 + 12, P.BK_Y0 + 12 + P.BK_IN[1],
             P.BK_FLOOR_Z, P.BK_FLOOR_Z + P.BK_IN[2]), bom="GUARD_MESH", note="egg-collection hatch cut-out at the basket pocket"),
        Part("TC_DOOR_EGG_HATCH", "guarding", box(-2 * t - 1, -t - 1, P.BK_Y0 - 10, P.BK_Y0 + 34 + P.BK_IN[1], P.BK_FLOOR_Z - 20,
             P.BK_FLOOR_Z + P.BK_IN[2] + 20), bom="DOOR_EGG_HATCH", note="exterior hatch + latch; hens can't reach it"),
        Part("TC_GUARD_PANEL_RIGHT", "guarding", right, bom="GUARD_MESH", note="chicken pop-door cut-out"),
        Part("TC_GUARD_PANEL_TOP", "guarding", box(0, W, 0, D, H, H + t), bom="GUARD_TOP"),
        Part("TC_DOOR_SERVICE", "guarding", box(dx0 - 10, dx0 + P.SERVICE_DOOR_W + 10, -2 * t - 1, -t - 1, dz0 - 10,
                                                 dz0 + P.SERVICE_DOOR_H + 10),
             bom="DOOR_SERVICE", note="hinge on left edge, swings out"),
        Part("TC_GUARD_DOOR_INTERLOCK", "guarding",
             box(dx0 + P.SERVICE_DOOR_W + 40, dx0 + P.SERVICE_DOOR_W + 70, -40, -t, 1000, 1100),
             tiers={"pro", "pro_heavy"}, bom="SAFETY_INTERLOCK", note="coded safety interlock on service door"),
    ]
    return out


# ======================================================================= ELECTRONICS
def electronics_parts():
    t = P.PANEL_T
    cw, ch, cd = P.CONTROL_BOX
    cb_y0, cb_z0 = 28 * P.IN, 48 * P.IN
    out = [
        Part("TC_CONTROL_BOX", "electronics", box(W + t, W + t + cd, cb_y0, cb_y0 + cw, cb_z0, cb_z0 + ch),
             bom="CONTROL_BOX", note="12x16x6 in NEMA 4X, RIGHT exterior"),
        Part("TC_DOOR_CTRL_BOX", "electronics",
             box(W + t, W + t + 50, P.CHICKEN_DOOR_Y0 + P.CHICKEN_DOOR_W + 40, P.CHICKEN_DOOR_Y0 + P.CHICKEN_DOOR_W + 140,
                 P.PLANE_BED_TOP + P.CHICKEN_DOOR_H + 40, P.PLANE_BED_TOP + P.CHICKEN_DOOR_H + 110),
             bom="DOOR_CTRL", note="Chicken Tender Starter XIAO door controller (ct-starter repo) next to pop door"),
        Part("TC_COMPUTE_BOX", "electronics", box(W + t, W + t + 152, cb_y0, cb_y0 + 254, cb_z0 - 260, cb_z0 - 50),
             tiers={"plus", "pro", "pro_heavy"}, bom="COMPUTE_BOX", note="Pi 5 (Plus) / Jetson Orin Nano (Pro): LeRobot + Klipper host + PTP grandmaster"),
        Part("TC_ESTOP_FRONT", "electronics", box(200, 270, -t - 90, -t, 1100, 1170), bom="ESTOP",
             note="NC loop; Pro = safety-rated 2NC to safety relay"),
        Part("TC_ESTOP_RIGHT", "electronics", box(W + t, W + t + 90, 1100, 1170, 1100, 1170), tiers={"pro", "pro_heavy"}, bom="ESTOP"),
        Part("TC_UR_CONTROL_BOX", "electronics", box(1150, 1150 + P.UR_CB[0], D + t + 10, D + t + 10 + P.UR_CB[2], 0, P.UR_CB[1]),
             tiers={"pro_heavy"}, bom="ARM_PRO_CB", note="UR e-series control box envelope, floor behind cell (approx)"),
    ]
    # camera brackets at the four top inner corners (shared) + cameras per tier
    zc0, zc1 = 2368, P.RING_LEVELS["TOP"]   # bracket hangs from the top ring, above X motors
    corners = {"FL": (P.INNER0, P.INNER0), "FR": (W - P.INNER0 - 50, P.INNER0),
               "BL": (P.INNER0, D - P.INNER0 - 50), "BR": (W - P.INNER0 - 50, D - P.INNER0 - 50)}
    cam_by_tier = {"FL": set(), "FR": set(), "BL": set(), "BR": ALL}   # A1.2: one XIAO monitor cam (BR, not in the dataset)
    for k, (x, y) in corners.items():
        out.append(Part(f"TC_CAM_BRACKET_{k}", "electronics", box(x, x + 50, y, y + 50, zc0, zc1), bom="CAM_BRACKET",
                        note="1/4-20 camera bracket on post inner corner"))
        if cam_by_tier[k]:
            out.append(Part(f"TC_CAM_NODE_{k}", "electronics", box(x + 5, x + 45, y + 5, y + 45, zc0 - 28, zc0),
                            tiers=cam_by_tier[k], bom="CAM_CORNER_XIAO", note="XIAO ESP32-S3 Sense monitor cam (Wi-Fi, not time-critical)"))
    # A1.2: hardware-triggered global-shutter cam 0 on the FL corner bracket, looking across the nest bank + basket
    x, y = corners["FL"]
    out.append(Part("TC_CAM_GS_OVERHEAD", "electronics", box(x + 5, x + 45, y + 5, y + 45, zc0 - 40, zc0),
                    tiers={"plus", "pro", "pro_heavy"}, bom="CAM_GS", note="GS cam 0 (FL corner, aimed at the nest bank + basket), XTR trigger line"))
    # LeRobot teleop station (SO-101 leader on a small table, LEFT exterior)
    out.append(Part("TC_TELEOP_LEADER_STATION", "electronics", box(-703, -303, 600, 1000, 0, 900),
                    tiers={"plus", "pro"}, bom="TELEOP_TABLE", note="SO-101 leader arm + gamepad for gantry jog; outside the guard"))
    # WatchTower AI mount pad + pole on top panel, front-right corner (outside roof footprint)
    out.append(Part("TC_WATCH_MOUNT_PAD", "electronics", box(W - 150, W, 0, 150, H + t, H + t + 6), bom="WATCH_PAD"))
    out.append(Part("TC_WATCH_MOUNT_POLE", "electronics", cyl_z(W - 75, 75, H + t + 6, H + t + 6 + P.WATCHTOWER_POLE_H,
                                                                P.WATCHTOWER_POLE_DIA), bom="WATCH_POLE"))
    return out


def eye_in_hand(tier, gx, gy, pz):
    # gantry camera on the Z plate: XIAO (Starter, scripted pick) or triggered GS cam 1 (Plus/Pro dataset)
    k = "CAM_TOOL" if tier == "starter" else ("CAM_TOOL_UVC" if tier == "pro_heavy" else "CAM_GS")
    return [Part("TC_CAM_TOOL", "electronics", box(gx - 117 - 40, gx - 117 - 10, gy + 70, gy + 110, pz + 60, pz + 100),
                 tiers={tier}, group="Z", bom=k, note="gantry camera on Z plate looking down past the arm")]


# ======================================================================= ENVELOPES / KEEPOUTS
def envelopes(tier="pro"):
    a = P.ARMS[tier]
    sb = P.ROBOT_SAFE_BUFFER
    e = {}
    e["BODY_PLATFORM_ENVELOPE"] = box(0, W, 0, D, 0, H)
    e["BODY_SAFE_INTERIOR"] = box(P.SAFE_X0, P.SAFE_X1, P.SAFE_Y0, P.SAFE_Y1, 0, P.SAFE_Z)
    e["BODY_ROBOT_KEEPIN"] = box(P.SAFE_X0, P.SAFE_X1, P.SAFE_Y0, P.SAFE_Y1, P.PLANE_ROBOT_Z0, P.PLANE_ROBOT_TOP)
    e["BODY_BED_KEEPOUT"] = box(P.SAFE_X0, P.SAFE_X1, P.SAFE_Y0, P.SAFE_Y1, 0, P.BED_KEEPOUT_Z)
    bx0 = W / 2 - P.POOP_BIN_X / 2
    by0 = P.INNER0 + P.MODULE_CLEARANCE
    e["BODY_POOP_BIN_STOWED"] = box(bx0, bx0 + P.POOP_BIN_X, by0, by0 + P.POOP_BIN_Y, P.POOP_BIN_Z0, P.POOP_BIN_Z0 + P.POOP_BIN_HEIGHT)
    e["BODY_POOP_BIN_SWEEP"] = box(bx0, bx0 + P.POOP_BIN_X, by0 - P.POOP_BIN_PULL_OUT - P.POOP_BIN_FRONT_DOOR_CLEAR,
                                   by0 + P.POOP_BIN_Y, P.POOP_BIN_Z0, P.POOP_BIN_Z0 + P.POOP_BIN_HEIGHT)
    rs = None
    for name, top_z, r in P.ROOST_BARS:   # quarter-disc sweep of each bar (deployed -> stowed), + buffer
        zp = top_z - P.ROOST_BAR_T / 2
        b = P.ROOST_SWEEP_BUFFER_A12
        xp = roost_pivot_x(name)
        disc = cyl_y(xp, zp, P.ROOST_Y0R - b, P.ROOST_Y0R + P.ROOST_BAR_LEN + b, 2 * (r + P.ROOST_BAR_W / 2 + b))
        q = disc & box(xp - r - P.ROOST_BAR_W / 2 - b, xp + 30, P.ROOST_Y0R - b,
                       P.ROOST_Y0R + P.ROOST_BAR_LEN + b, zp - r - P.ROOST_BAR_W / 2 - b, zp + P.ROOST_BAR_T / 2 + b)
        rs = q if rs is None else rs + q
    e["BODY_ROOST_SWEEP"] = rs
    # nest lids: closed slab -> open slab, quarter-disc about the wall-side hinge
    ls = None
    for i in range(P.NEST_BOX_COUNT):
        ix0, ix1, iy0, iy1, iz0, iz1 = nest_box_bounds(i)
        d = cyl_y(P.NB_X0, iz1, iy0 - P.NB_WALL, iy1 + P.NB_WALL, 2 * P.NB_LID_LEN)
        q = d & box(P.NB_X0, P.NB_X0 + P.NB_LID_LEN, iy0 - P.NB_WALL, iy1 + P.NB_WALL, iz1, iz1 + P.NB_LID_LEN)
        ls = q if ls is None else ls + q
    e["BODY_NEST_LID_SWING"] = ls
    # service door swing: quarter cylinder outward, hinge at left edge of opening
    dx0 = W / 2 - P.SERVICE_DOOR_W / 2
    sw = cyl_z(dx0, -P.PANEL_T, P.SERVICE_DOOR_Z0, P.SERVICE_DOOR_Z0 + P.SERVICE_DOOR_H, 2 * (P.SERVICE_DOOR_W + 20))
    e["BODY_SERVICE_DOOR_SWING"] = sw & box(dx0, dx0 + P.SERVICE_DOOR_W + 20, -P.PANEL_T - P.SERVICE_DOOR_W - 20, -P.PANEL_T,
                                            P.SERVICE_DOOR_Z0, P.SERVICE_DOOR_Z0 + P.SERVICE_DOOR_H)
    # parked robot: mast column + plate + hanging arm at PARK, + ROBOT_SAFE_BUFFER
    gx, gy, pz = P.PARK["gx"], P.PARK["gy"], P.PARK["pz"]
    arm_len = 735.0 if tier == "pro_heavy" else (300.0 if tier == "starter" else 260.0)
    zlow = min(P.MAST_Z0, pz - a.adapter_t - arm_len)
    e["BODY_ROBOT_KEEPOUT_PARKED"] = box(gx + P.ARM_PLATE_X1_OFF - P.ARM_PLATE_X - sb, gx + 67 + sb,
                                         gy - 125 - sb, gy + 125 + sb, zlow - sb, P.Z_BRIDGE1 + 100 + sb)
    # working reach: arm base travel box grown by reach (box-conservative)
    bx_min, bx_max = P.GX_MIN + P.ARM_BASE_X_OFF, P.GX_MAX + P.ARM_BASE_X_OFF
    zb_min, zb_max = P.PZ_MIN - a.adapter_t, P.PZ_MAX - a.adapter_t
    r = a.reach
    e["BODY_ROBOT_KEEPOUT_WORKING"] = box(bx_min - r, bx_max + r, P.GY_MIN - r, P.GY_MAX + r, zb_min - r, zb_max + r)
    e["UTILITY_CABLE_CHAIN_ZONE"] = box(P.INNER0, W - P.INNER0, P.GY_MAX + 36, D - P.INNER0 - 51, 2342, 2392)
    return e


def assemble(tier, gx=None, gy=None, pz=None, with_arm=True, roost="deployed", lid="closed", pose=None):
    gx = P.PARK["gx"] if gx is None else gx
    gy = P.PARK["gy"] if gy is None else gy
    pz = P.PARK["pz"] if pz is None else pz
    parts = (frame_parts() + coop_parts(lid) + roost_parts(roost) + motion_parts(gx, gy, pz, tier) + guarding_parts()
             + electronics_parts() + eye_in_hand(tier, gx, gy, pz))
    if with_arm:
        parts += arm_parts(tier, gx, gy, pz, pose)
    return [p for p in parts if tier in p.tiers]
