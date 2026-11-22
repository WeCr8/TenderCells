"""ELECTRONICS BAY under the raised coop (Zach 2026-11-22). Parameters: ebay_params.py.

EB1 (all tiers): door controller (XIAO + DRV8874 + D36V6F5), WROOM sensor/feeder board (Plus/Pro) or the
Starter picker drivers, terminals, fuse. EB2 (Plus/Pro): motor rail (relay + fuse block), 4-axis gantry
controller, cassette gearmotor driver, SO-101 bus adapter, 5 V servo buck. Both boxes stand on drop-down trays
under the back of the pit pan, under an aluminium drip roof, cables out of the BOTTOM only, into one sealed
chase on the back-left post. E-STOP moves to a 1-hole station on the back wall (3 NC blocks).

parts(cfg) -> SPart list (wired into sc_model.parts). check(cfg) -> clearance/numbers dict.
Run:  python ebay.py   (prints the clearance table for base/starter/plus/pro)
"""
from __future__ import annotations
import math
from build123d import Axis
import sc_params as P
import ebay_params as EP
from sc_model import SPart, box, cyl

E = EP.ENCL
STEP = 9


def boxes(cfg):
    """[(id, x0, x1)] for the bays fitted on this config."""
    out = [("EB1", *EP.EB1_X)]
    if cfg in EP.EB2_CFGS:
        out.append(("EB2", *EP.EB2_X))
    return out


def hinge(x0, x1):
    return EP.EB_HINGE_Y, EP.EB_Z0 - 10.0


def tilt(shape, x0, x1, deg):
    """Tray swing about its bottom-back hinge (top goes back, +Y)."""
    yh, zh = hinge(x0, x1)
    return shape.rotate(Axis((0, yh, zh), (1, 0, 0)), -deg) if deg else shape


def _enclosure(bid, x0, x1, c):
    """Fixed + moving parts of one bay. Moving parts are returned with mv=True (they ride the tray)."""
    y0, y1, z0, z1, wt = EP.EB_Y0, EP.EB_Y1, EP.EB_Z0, EP.EB_Z1, E["wall"]
    xm = (x0 + x1) / 2
    yh, zh = hinge(x0, x1)
    tw, th, tt = EP.TRAY_PLATE
    F, Mv = [], []      # fixed, moving
    # --- fixed: hanger frame (aluminium angle legs + crossbar), drip roof, hinge knuckles, latch receiver, stay arms base
    zp = P.PIT_BOTTOM
    for xa in (x0 - 32.0, x1 + 17.0):
        F.append(SPart(f"{bid}-HNG", f"{bid} hanger leg, 1-1/2 in aluminium angle, through-bolted to the pit pan (M6 + fender washers)", "metal", STEP,
                       box(xa, xa + 15.0, yh - 38.0, yh, zh - 6.0, zp), configs=c, bom="EB-HANGER"))
    F.append(SPart(f"{bid}-HNG", f"{bid} top crossbar + spring-pin latch receiver", "metal", STEP,
                   box(x0 - 32.0, x1 + 32.0, yh - 38.0, yh - 23.0, zp - EP.DRIP_GAP - EP.DRIP_T - 20.0, zp - EP.DRIP_GAP - EP.DRIP_T), configs=c, bom="EB-HANGER"))
    zr1 = zp - EP.DRIP_GAP
    o = EP.DRIP_OVERHANG
    F.append(SPart(f"{bid}-DRIP", f"{bid} drip roof 18 ga aluminium, 35 mm overhang, 5 mm air gap under the pan, front drip edge", "metal", STEP,
                   box(x0 - o, x1 + o, y0 - o, yh + 10.0, zr1 - EP.DRIP_T, zr1)
                   + box(x0 - o, x1 + o, y0 - o, y0 - o + 1.2, zr1 - 25.0, zr1), configs=c, bom="EB-DRIP"))
    for xa in (x0 + 20.0, x1 - 20.0):
        F.append(SPart(f"{bid}-HINGE", f"{bid} tray hinge (stainless lift-off, bottom-back edge)", "metal", STEP,
                       cyl((xa - 25, yh, zh), (xa + 25, yh, zh), 6.0), configs=c, bom="EB-TRAY"))
    # --- moving: tray plate + enclosure + lid + DIN rails + modules + glands + vent
    Mv.append(SPart(f"{bid}-TRAY", f"{bid} drop-down tray plate 6 mm HDPE, hinge on the bottom-back edge, 2 stay arms stop it at 90 deg", "hdpe", STEP,
                    box(xm - tw / 2, xm + tw / 2, y1, y1 + tt, zh, zh + th), configs=c, bom="EB-TRAY"))
    Mv.append(SPart(f"{bid}-TRAY", f"{bid} tray pull handle + spring plunger pin (no tools)", "dark", STEP,
                    box(xm - 40, xm + 40, y1 + tt, y1 + tt + 20, zh + th - 25, zh + th - 10), configs=c, bom="EB-TRAY"))
    shell = box(x0, x1, y0 + 8.0, y1, z0, z1) - box(x0 + wt, x1 - wt, y0 + 8.0 - 1, y1 - wt, z0 + wt, z1 - wt)
    Mv.append(SPart(f"{bid}-ENCL", f"{bid} {EP.ENCL_NAME}", "box", STEP, shell, configs=c, bom="EB-ENCL", alpha=0.45))
    Mv.append(SPart(f"{bid}-ENCL", f"{bid} clear lid (front, stowed; faces UP when the tray is down)", "hood", STEP,
                    box(x0, x1, y0, y0 + 8.0, z0, z1), configs=c, bom="EB-ENCL", alpha=0.25))
    yp = y1 - wt - 3.0                                   # mounting plate face
    for zr in EP.DIN_RAILS_Z:
        Mv.append(SPart(f"{bid}-DIN", f"{bid} 35 mm DIN rail", "rail", STEP,
                        box(xm - EP.DIN_RAIL_L / 2, xm + EP.DIN_RAIL_L / 2, yp - 7.5, yp, z0 + zr - 17.5, z0 + zr + 17.5), configs=c, bom="EB-DIN"))
    return F, Mv, yp


def _module(ref, name, bom, c, x, zc, size, yp, layer="pcb"):
    """DIN-mounted module/carrier: size = (w along X, h along Z, depth toward the lid)."""
    w, h, d = size
    return SPart(ref, name, layer, STEP, box(x - w / 2, x + w / 2, yp - 7.5 - d, yp - 7.5, zc - h / 2, zc + h / 2), configs=c, bom=bom)


def _contents(bid, x0, x1, cfg, c, yp):
    z0 = EP.EB_Z0
    r1, r2 = (z0 + z for z in EP.DIN_RAILS_Z)
    xm = (x0 + x1) / 2
    S = []
    m = lambda *a, **k: S.append(_module(*a, yp=yp, **k))
    if bid == "EB1":
        # rail 2 (upper): door controller on a printed PETG DIN carrier, components on it (PR #188 BOM refs)
        m("CARRIER", "printed PETG DIN carrier: door controller", "PLA/PETG", c, xm - 50, r2, (130, 62, 6), layer="box")
        yc = yp - 7.5 - 6
        for ref, nm, (a, b, t), dx, dz in (("U1", "Seeed XIAO ESP32-S3 (door controller)", (21, 17.5, 4), -95, 12),
                                           ("U3", "Pololu DRV8874 carrier (#4035), ~2.0 A limit", (20, 15, 3), -65, 12),
                                           ("U2", "Pololu D36V6F5 5 V buck (#3792)", (13, 10, 3), -38, 12),
                                           ("D1", "1N5817 Schottky", (5, 3, 3), -22, 12),
                                           ("R1", "20 k VREF resistor", (6, 2.5, 2.5), -95, -14),
                                           ("R2 R3", "4.7 k I2C pull-ups", (6, 5, 2.5), -80, -14),
                                           ("TB1 TB2", "5.08 mm terminals (12 V in, motor out)", (20, 8, 10), -55, -14)):
            S.append(SPart(ref, nm, "pcb", STEP, box(xm + dx - a / 2, xm + dx + a / 2, yc - t, yc, r2 + dz - b / 2, r2 + dz + b / 2), configs=c, bom=ref))
        m("F1", "3 A blade fuse in a DIN fuse holder (logic rail)", "F1", c, xm + 40, r2, (18, 60, 55), layer="dark")
        m("EB-TB", "DIN terminal blocks: 12 V / GND / 5 V buses + E-STOP loop + reed / sensor field terminals", "EB-TB", c, xm + 95, r2, (60, 45, 40), layer="dark")
        if cfg in ("plus", "pro"):
            m("CARRIER", "printed PETG DIN carrier: WROOM sensor / feeder board", "PLA/PETG", c, xm - 30, r1, (170, 62, 6), layer="box")
            yc = yp - 7.5 - 6
            for ref, nm, (a, b, t), dx in (("WROOM", "ESP32-WROOM-32 DevKit V1 (coop sensor / feeder / bay I/O)", (55, 28, 12), -80),
                                          ("DIV", "MQ-137 divider 15 k / 12 k + 100 nF", (20, 15, 4), -35),
                                          ("BUCK5", "5 V buck for the WROOM + MQ-137 heater", (20, 15, 6), -5),
                                          ("FEED-DRV", "feeder DC motor driver (2nd DRV8874, GPIO26/25)", (20, 15, 4), 25)):
                S.append(SPart(ref, nm, "pcb", STEP, box(xm + dx - a / 2, xm + dx + a / 2, yc - t, yc, r1 - b / 2, r1 + b / 2), configs=c, bom=ref))
        elif cfg == "starter":
            m("ST-MOT", "Starter picker drivers: 2 x TMC2209 on a DIN carrier + vacuum-pump MOSFET", "ST-MOT", c, xm - 40, r1, (110, 55, 25))
    else:  # EB2 motion box
        m("EB-FUSE", "DIN 6-way blade fuse block, motor rail (gantry 5 A, cassette 5 A, SO-101 7.5 A, tiller 3 A, servo buck 3 A)", "EB-FUSE", c, xm - 85, r2, (90, 55, 45), layer="dark")
        m("EB-RLY", "motor-rail relay 12 V 30 A on DIN base; coil through E-STOP NC block 3 (hardware cut of all motors)", "EB-RLY", c, xm + 5, r2, (40, 60, 60), layer="dark")
        m("EB-TB", "DIN terminal blocks: motor rail in, GND bus, limit-switch commons", "EB-TB", c, xm + 85, r2, (60, 45, 40), layer="dark")
        m("EB-GCTL", "4-axis ESP32 motion controller, 4 x TMC2209 (FluidNC-class) - gantry Y1/Y2/X/Z", "EB-GCTL", c, xm - 70, r1, (100, 70, 30))
        m("CAS-DRV", "Pololu G2 18v17-class gearmotor driver (current-sense out) - bed cassette", "CAS-DRIVE", c, xm + 10, r1, (33, 25, 12))
        m("EB-BUS", "SO-101 bus-servo adapter (Feetech URT-1 class) + USB-C to the arm host", "EB-BUS", c, xm + 50, r1, (35, 25, 12))
        m("EB-DCDC", "12 -> 6 V 5 A buck (damper servos MG90S x3 + tiller fold servo)", "EB-DCDC", c, xm + 95, r1, (45, 30, 18))
    return [s for s in S if s is not None]


def _bottom(bid, x0, x1, cfg, c):
    """Glands + breather on the box bottom (they ride the tray)."""
    z0 = EP.EB_Z0
    yc = (EP.EB_Y0 + EP.EB_Y1) / 2
    S = []
    if bid == "EB1":
        ent = [("GLAND", "PG7 gland: actuator W13/W14", 7.5), ("GLAND", "PG7 gland: door reeds W18/W19", 7.5),
               ("GLAND", "PG7 gland: DHT20 W20 + camera 5 V", 7.5), ("EB-GLAND", "PG7 gland: E-STOP loop (4-core)", 7.5),
               ("J1", "IP67 panel DC jack: PS1 12 V logic lead", 8.0)]
        if cfg in ("plus", "pro"):
            ent += [("EB-GLAND", "PG9 multi-hole gland: MQ-137 + DHT22 + feeder", 9.0), ("EB-GLAND", "PG9 gland: EB1 <-> EB2 link (5 V, I2C/UART, E-STOP sense)", 9.0)]
    else:
        ent = [("EB-GLAND", "PG13.5 gland: PS2 12 V 8 A motor-rail lead", 11.0), ("EB-GLAND", "PG9 multi-hole: gantry motor + home-switch bundle", 9.0),
               ("EB-GLAND", "PG9 gland: cassette gearmotor + encoder", 9.0), ("EB-GLAND", "PG9 gland: cassette limits x3 + slot-flap switch", 9.0),
               ("EB-GLAND", "PG9 gland: SO-101 bus + fan + damper servos", 9.0), ("EB-GLAND", "PG9 gland: EB1 <-> EB2 link", 9.0)]
    n = len(ent) + 1
    pitch = (x1 - x0 - 50) / (n - 1)
    for i, (ref, nm, r) in enumerate(ent):
        gx = x0 + 25 + i * pitch
        S.append(SPart(ref if ref != "J1" else "J1", f"{bid} {nm} (box bottom)", "dark", STEP, cyl((gx, yc, z0), (gx, yc, z0 - 18), r), configs=c, bom=ref))
    gx = x0 + 25 + (n - 1) * pitch
    S.append(SPart("EB-VENT", f"{bid} M12 IP67 membrane breather vent (box bottom, lowest point)", "dark", STEP,
                   cyl((gx, yc, z0), (gx, yc, z0 - 12), 9.0), configs=c, bom="EB-VENT"))
    return S


def gland_xy(bid, cfg, k=0):
    x0, x1 = EP.EB1_X if bid == "EB1" else EP.EB2_X
    n = (7 if cfg in ("plus", "pro") else 5) + 1 if bid == "EB1" else 7
    pitch = (x1 - x0 - 50) / (n - 1)
    return x0 + 25 + k * pitch, (EP.EB_Y0 + EP.EB_Y1) / 2


def chase_top_z():
    return P.FLOOR_TOP_Z + EP.CHASE_TOP_ABOVE_FLOOR


def chase_parts(cfg):
    x, y, r = EP.CHASE_X, EP.CHASE_Y, EP.CHASE_OD / 2
    zt = chase_top_z()
    S = [SPart("EB-CHASE", "sealed cable chase: 1-1/2 in Sch40 grey PVC, bell end DOWN at 8 in (duct seal), through the floor ledge on the back-left post", "hood", STEP,
               cyl((x, y, EP.CHASE_Z0), (x, y, zt), r) - cyl((x, y, EP.CHASE_Z0 - 1), (x, y, zt + 1), r - 4), bom="EB-CHASE"),
         SPart("EB-CHASE", "chase LB conduit body + gasketed cover, opening to +X (inside the coop, 300 mm above the floor ledge, duct-seal packed)", "hood", STEP,
               box(x - 26, x + 36, y - r, y + r, zt - 10, zt + 70), bom="EB-CHASE"),
         SPart("EB-CHASE", "chase bell end + peck guard (1/2 in hardware-cloth wrap over the bell and drip loops)", "mesh", STEP,
               cyl((x, y, EP.DRIP_LOOP_LOW_Z - 10), (x, y, EP.CHASE_Z0 + 40), r + 5), bom="EB-CHASE", alpha=0.3)]
    post_face = P.COOP_Y1 - 2 * P.T2
    for zc in (EP.CHASE_Z0 + 120, P.FLOOR_FRAME_Z0 - 60, P.FLOOR_TOP_Z + 150):
        S.append(SPart("EB-CHASE", "conduit standoff strap to the back-left post", "metal", STEP, box(x - 25, x + 25, y + r - 2, post_face, zc - 10, zc + 10), bom="EB-CHASE"))
    if cfg in EP.EB2_CFGS:
        rr = EP.RACEWAY_OD / 2
        xr0 = EP.EB2_X[0] - 40.0
        yr, zr = EP.RACEWAY_Y, EP.RACEWAY_Z
        S += [SPart("EB-RACE", "EB2 raceway riser 1 in PVC, bell end DOWN (drip loop below)", "hood", STEP, cyl((xr0, yr, EP.CHASE_Z0), (xr0, yr, zr), rr), configs=(cfg,), bom="EB-RACE"),
              SPart("EB-RACE", "EB2 -> chase raceway 1 in PVC under the pan, in front of the cassette gearmotor", "hood", STEP, cyl((xr0, yr, zr), (x, yr, zr), rr), configs=(cfg,), bom="EB-RACE"),
              SPart("EB-RACE", "raceway jog into the chase (sweep tee)", "hood", STEP, cyl((x, yr, zr), (x, y - r, zr), rr), configs=(cfg,), bom="EB-RACE")]
    return S


def hatch_parts(cfg):
    S = []
    for bid, x0, x1 in boxes(cfg):
        c = ALLC(cfg, bid)
        hx0, hx1 = x0 - EP.HATCH_PAD, x1 + EP.HATCH_PAD
        hz0, hz1 = EP.HATCH_Z
        y = EP.HATCH_Y
        frame = box(hx0, hx1, y, y + 19, hz0, hz1) - box(hx0 + 38, hx1 - 38, y - 1, y + 20, hz0 + 38, hz1 - 38)
        S.append(SPart(f"{bid}-HATCH", f"{bid} service hatch in the back under-coop skirt: 1x2 PT frame, 1/2 in hardware cloth, bottom-hinged", "pt_lumber", 7,
                       frame, configs=c, bom="EB-HATCH"))
        S.append(SPart(f"{bid}-HATCH", f"{bid} hatch infill 1/2 in hardware cloth", "mesh", 7, box(hx0 + 38, hx1 - 38, y + 8, y + 10, hz0 + 38, hz1 - 38), configs=c, bom="EB-HATCH", alpha=0.3))
        S.append(SPart(f"{bid}-HATCH", f"{bid} hatch two-step latch (barrel bolt + locking carabiner) + padlock hasp", "metal", 7,
                       box((hx0 + hx1) / 2 - 30, (hx0 + hx1) / 2 + 30, y + 19, y + 34, hz1 - 30, hz1 - 10), configs=c, bom="EB-HATCH"))
    return S


def estop_parts(cfg):
    s = EP.ESTOP_STATION
    w, h, d = s["size"]
    x, z = s["x"], s["z"]
    yb = P.COOP_Y1 + P.PLY_WALL
    return [SPart("EB-ESTOP", "E-STOP station: 1-hole IP65 22 mm box on the back wall (left of the cleanout), 43 in high", "box", STEP,
                  box(x - w / 2, x + w / 2, yb, yb + d, z - h / 2, z + h / 2), bom="EB-ESTOP", alpha=0.6),
            SPart("SW1", "22 mm mushroom E-STOP head (twist release) + 3 NC contact blocks", "estop", STEP,
                  cyl((x, yb + d, z), (x, yb + d + 35, z), 20), bom="SW1"),
            SPart("EB-ESTOP", "E-STOP cable in 3/8 in liquid-tight flex down the outside of the back siding (in under its bottom edge)", "dark", STEP,
                  cyl((x, yb + 8, z - h / 2), (x, yb + 8, P.UNDER_BACK_FABRIC_TOP + 10), 7.0), bom="EB-ESTOP")]


def power_parts(cfg):
    """PS2 motor-rail adapter at the GFCI outlet (Plus/Pro) + its lead to the EB2 PG13.5 gland."""
    if cfg not in EP.EB2_CFGS:
        return []
    ox, oy, oz = P.OUTLET_POS
    S = [SPart("PS2", "12 V 8 A (96 W) Class 2 adapter, motor rail (in the outlet's in-use cover)", "dark", STEP,
               box(ox + 35, ox + 95, oy - 75, oy - 40, oz - 40, oz + 40), configs=(cfg,), bom="PS2")]
    bx, by = gland_xy("EB2", cfg, 0)
    pts = [(ox + 65, oy - 75, oz - 40), (ox + 65, oy - 75, 25), (bx, oy - 75, 25), (bx, EP.HATCH_Y + 60, 25),
           (bx, EP.HATCH_Y + 60, 120), (bx, by, EP.DRIP_LOOP_LOW_Z), (bx, by, EP.EB_Z0 - 18)]
    for i in range(len(pts) - 1):
        S.append(SPart("CABLE", f"PS2 motor-rail lead seg {i + 1}", "cable", STEP, cyl(pts[i], pts[i + 1], 3.5), configs=(cfg,), bom="WIRE"))
    return S


def ALLC(cfg, bid):
    return (cfg,)


def parts(cfg, open_deg=0.0):
    if not EP.EBAY:
        return []
    S = []
    for bid, x0, x1 in boxes(cfg):
        c = (cfg,)
        F, Mv, yp = _enclosure(bid, x0, x1, c)
        Mv += _contents(bid, x0, x1, cfg, c, yp) + _bottom(bid, x0, x1, cfg, c)
        for p in Mv:
            p.node = f"ebay_tray_{bid.lower()}"
            if open_deg:
                p.shape = tilt(p.shape, x0, x1, open_deg)
        S += F + Mv
    return S + chase_parts(cfg) + hatch_parts(cfg) + estop_parts(cfg) + power_parts(cfg)


# ------------------------------------------------------------------------------------- clearance + numbers
def _bb(shapes):
    from build123d import Compound
    b = Compound(children=list(shapes)).bounding_box()
    return b.min.X, b.max.X, b.min.Y, b.max.Y, b.min.Z, b.max.Z


def _sweep_max_z(x0, x1):
    yh, zh = hinge(x0, x1)
    # farthest moving point from the hinge in the YZ plane: tray-plate top / box front-top corner
    corners = [(EP.EB_Y0, EP.EB_Z1), (EP.EB_Y0, zh + EP.TRAY_PLATE[1]), (EP.EB_Y1 + EP.TRAY_PLATE[2], zh + EP.TRAY_PLATE[1])]
    return max(zh + math.hypot(y - yh, z - zh) for y, z in corners)


def check(cfg):
    """Clearances (mm) of the stowed and the open bay against the coop, cassette, gearmotor, skirt and doors."""
    import house as H
    bed = {p.pid: p for p in H.bed_parts(cfg)}
    obst = {p.pid + ":" + p.name[:28]: p.shape for p in H.bed_parts(cfg) if p.pid in ("CAS-MOT", "CAS-PIN", "PIT-PAN", "PIT-WALL", "SLIDE", "CAS-RACK", "CASSETTE", "SLOT-FLAP")}
    stowed = [p for p in parts(cfg) if not p.pid.endswith("HATCH")]
    opened = [p for p in parts(cfg, EP.OPEN_DEG) if p.node.startswith("ebay_tray")]
    hits = []
    for tag, group in (("stowed", stowed), ("open", opened)):
        for p in group:
            for k, o in obst.items():
                try:
                    v = (p.shape & o).volume
                except Exception:
                    v = 0.0
                if v > 1.0:
                    hits.append(f"{tag}: {p.pid} x {k} ({v:.0f} mm3)")
    sb = _bb([p.shape for p in stowed if p.node.startswith("ebay_tray")])
    ob = _bb([p.shape for p in opened])
    fixed_top = max(_bb([p.shape for p in stowed if p.pid.endswith("DRIP")])[5], sb[5])
    out = {"cfg": cfg, "boxes": [b[0] for b in boxes(cfg)], "enclosure_mm": f'{E["w"]:.0f} x {E["h"]:.0f} x {E["d"]:.0f}',
           "box_bottom_above_grade_mm": round(EP.EB_Z0, 1), "gland_tips_above_grade_mm": round(EP.EB_Z0 - 18, 1),
           "splash_ok (>=152)": EP.EB_Z0 >= EP.SPLASH_MIN,
           "stowed_moving_top_z": round(sb[5], 1), "bay_top_incl_drip_roof_z": round(fixed_top, 1),
           "pit_pan_underside_z": P.PIT_BOTTOM, "gap_box_top_to_pan_mm": round(P.PIT_BOTTOM - EP.EB_Z1, 1),
           "gap_bay_top_to_floor_frame_bottom_mm": round(P.FLOOR_FRAME_Z0 - fixed_top, 1),
           "door_rule_4in_ok (floor frame)": P.FLOOR_FRAME_Z0 - fixed_top >= EP.DOOR_FLOOR_GAP_MIN,
           "swing_max_z": round(max(_sweep_max_z(x0, x1) for _, x0, x1 in boxes(cfg)), 1),
           "swing_to_drip_roof_mm": round(P.PIT_BOTTOM - EP.DRIP_GAP - EP.DRIP_T - max(_sweep_max_z(x0, x1) for _, x0, x1 in boxes(cfg)), 1),
           "open_tray_bbox": [round(v) for v in ob], "open_lid_up_z": round(ob[5], 1),
           "open_reach_behind_skirt_mm": round(ob[3] - EP.HATCH_Y, 1),
           "inside_skirt_x_margin_mm": round(min(sb[0] - (-P.PLY_WALL - P.CL_UNDER_OFF), (P.COOP_W + P.PLY_WALL + P.CL_UNDER_OFF) - sb[1]), 1),
           "inset_from_side_walls_mm (door swing planes)": round(min(sb[0], P.COOP_W - sb[1]), 1),
           "behind_back_skirt_stowed_mm": round(EP.HATCH_Y - sb[3], 1),
           "below_bed_slot_open_mm": round(P.SLOT["z0"] - ob[5], 1)}
    if "CAS-MOT" in bed:
        mb = _bb([bed["CAS-MOT"].shape])
        out["x_gap_to_gearmotor_mm"] = round(min(abs(mb[0] - EP.EB1_X[1]), abs(EP.EB2_X[0] - mb[1]) if cfg in EP.EB2_CFGS else 9e9), 1)
    out["chase_to_drop_board_y_mm"] = round(EP.CHASE_Y - EP.CHASE_OD / 2 - P.DROP_BOARD["y1"], 1)
    out["chase_to_post_y_mm"] = round((P.COOP_Y1 - 2 * P.T2) - (EP.CHASE_Y + EP.CHASE_OD / 2), 1)
    out["hits"] = hits
    return out


if __name__ == "__main__":
    import json
    for c in ("base", "starter", "plus", "pro"):
        print(json.dumps(check(c)))
