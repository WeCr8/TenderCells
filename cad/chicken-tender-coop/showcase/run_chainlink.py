"""Chain-link run (4 x 12 x 6 ft) with a small 3:12 gable corrugated roof, a chain-link walk gate, and the
predator-proofing toggles (none / chicken wire layer / hardware-cloth skirt + buried or surface apron).
Replaces the guide's wood run frame (R1-R10) and hardware-cloth run walls/roof (Zach, 2026-11-21)."""
from __future__ import annotations
import math
import numpy as np
from build123d import Box, Pos, Rot
import sc_params as P
from sc_model import SPart, box, cyl, ALL

RUNSTEP, MESHSTEP, ROOFSTEP, GATESTEP = 5, 7, 5, 6


def _posts():
    t, l = P.CL_TERM_OD / 2, P.CL_LINE_OD / 2
    xs = (P.CL_PO, P.COOP_W - P.CL_PO)
    S = []
    for y, kind in ((P.CL_GATE_END_Y, "gate/corner"), (P.CL_COOP_END_Y, "coop-end corner")):
        for x in xs:
            S.append(SPart("CL-TP", f"terminal post 2-3/8 in ({kind})", "steel", RUNSTEP,
                           cyl((x, y, -P.CL_POST_BURY), (x, y, P.CL_TOP_Z), t), bom="CL-TP"))
            S.append(SPart("CL-CONC", "post footing (concrete, 8 in x 24 in)", "concrete", RUNSTEP,
                           cyl((x, y, -P.CL_POST_BURY - 50), (x, y, -20), P.CL_FOOTING_D / 2), bom="CL-CONC"))
    for x in xs:
        S.append(SPart("CL-LP", "line post 1-7/8 in", "steel", RUNSTEP,
                       cyl((x, P.CL_LINE_Y, -P.CL_POST_BURY), (x, P.CL_LINE_Y, P.CL_TOP_Z - 20), l), bom="CL-LP"))
        S.append(SPart("CL-CONC", "post footing (concrete, 8 in x 24 in)", "concrete", RUNSTEP,
                       cyl((x, P.CL_LINE_Y, -P.CL_POST_BURY - 50), (x, P.CL_LINE_Y, -20), P.CL_FOOTING_D / 2), bom="CL-CONC"))
    # short back corner posts for the under-coop fabric
    yb = P.COOP_Y1 + P.PLY_WALL + P.CL_UNDER_OFF + P.CL_TERM_OD / 2
    for x in (-P.CL_UNDER_OFF - P.CL_TERM_OD / 2, P.COOP_W + P.CL_UNDER_OFF + P.CL_TERM_OD / 2):
        S.append(SPart("CL-TP", "short terminal post 2-3/8 in (under-coop back corner)", "steel", RUNSTEP,
                       cyl((x, yb, -P.CL_POST_BURY), (x, yb, P.CL_BACK_POST), t), bom="CL-TP"))
    # top rails (sides + coop-end cross rail) and caps
    zr = P.CL_TOP_Z - P.CL_RAIL_OD / 2
    for x in xs:
        S.append(SPart("CL-RAIL", "top rail 1-3/8 in", "steel", RUNSTEP,
                       cyl((x, P.CL_GATE_END_Y, zr), (x, P.CL_COOP_END_Y, zr), P.CL_RAIL_OD / 2), bom="CL-RAIL"))
    S.append(SPart("CL-RAIL", "top rail 1-3/8 in (coop-end cross rail)", "steel", RUNSTEP,
                   cyl((xs[0], P.CL_COOP_END_Y, zr), (xs[1], P.CL_COOP_END_Y, zr), P.CL_RAIL_OD / 2), bom="CL-RAIL"))
    return S


def back_openings(cfg):
    """(x0, x1, z0, z1) openings cut out of the under-coop BACK fabric: one per electronics-bay service hatch
    (ebay.hatch_parts frame outline; the hatch carries its own 1/2 in hardware cloth) + the bed-cassette slot band
    where it crosses the fabric plane. Fabric is cut and bound to the hatch frame with tension wire / hog rings."""
    out = []
    if cfg is None:
        return out
    try:
        import ebay_params as EP, ebay as EB
    except ImportError:
        return out
    if EP.EBAY:
        for _, x0, x1 in EB.boxes(cfg):
            out.append((x0 - EP.HATCH_PAD, x1 + EP.HATCH_PAD, EP.HATCH_Z[0], EP.HATCH_Z[1]))
    if P.HOUSE == "gable" and P.SLOT["z0"] < back_fabric_top():      # cassette slides out above the fabric unless it dips into it
        out.append((P.TRAY_X[0] - 20.0, P.TRAY_X[1] + 20.0, P.SLOT["z0"], P.SLOT["z1"]))
    return out


def back_fabric_top():
    return P.UNDER_BACK_FABRIC_TOP if P.HOUSE == "gable" else P.FLOOR_FRAME_Z0 + 1 * P.IN


def _cut_rect(nm, ax, c, u, z, node, holes):
    """Split one fabric rect into solid pieces around rectangular holes (u = x along the back plane)."""
    hs = sorted((max(h[0], u[0]), min(h[1], u[1]), max(h[2], z[0]), min(h[3], z[1])) for h in holes)
    hs = [h for h in hs if h[1] > h[0] and h[3] > h[2]]
    if not hs:
        return [(nm, ax, c, u, z, node)]
    zs = sorted({z[0], z[1], *[h[2] for h in hs], *[h[3] for h in hs]})
    out = []
    for za, zb in zip(zs, zs[1:]):
        cuts = sorted((h[0], h[1]) for h in hs if h[2] <= za and h[3] >= zb)
        ua = u[0]
        for a, b in cuts + [(u[1], u[1])]:
            if a - ua > 1.0:
                out.append((f"{nm} [panel x{ua:.0f}-{a:.0f} z{za:.0f}-{zb:.0f}]", ax, c, (ua, a), (za, zb), node))
            ua = max(ua, b)
    return out


def fabric_rects(cfg=None):
    """Chain-link fabric panels: (name, axis 'x'|'y' (plane normal), plane coord, (u0,u1), (z0,z1), node).
    With cfg the back under-coop panel is split around the bay hatch openings (back_openings)."""
    xo, xr = -P.CL_TERM_OD / 2 - 2, P.COOP_W + P.CL_TERM_OD / 2 + 2
    zt = P.CL_TOP_Z - 10
    yb = P.COOP_Y1 + P.PLY_WALL + P.CL_UNDER_OFF
    zu0, zu1 = -P.CL_UNDER_BURY, P.FLOOR_FRAME_Z0 + 1 * P.IN
    xl_u, xr_u = -P.PLY_WALL - P.CL_UNDER_OFF, P.COOP_W + P.PLY_WALL + P.CL_UNDER_OFF
    return [("left run wall", "x", xo + P.CL_PO, (P.CL_GATE_END_Y, P.CL_COOP_END_Y), (50.0, zt), "static"),
            ("right run wall", "x", xr - P.CL_PO, (P.CL_GATE_END_Y, P.CL_COOP_END_Y), (50.0, zt), "static"),
            ("under-coop left (11 in buried footer)", "x", xl_u, (P.CL_COOP_END_Y, yb), (zu0, zu1), "static"),
            ("under-coop right (11 in buried footer)", "x", xr_u, (P.CL_COOP_END_Y, yb), (zu0, zu1), "static"),
            ] + _cut_rect("under-coop back (11 in buried footer)", "y", yb, (xl_u, xr_u), (zu0, back_fabric_top()), "static", back_openings(cfg))


def gate_geom():
    x0 = P.CL_PO + P.CL_TERM_OD / 2 + 20                    # hinge-side frame edge
    x1 = P.COOP_W - P.CL_PO - P.CL_TERM_OD / 2 - 20 - (P.GATE_GAP - 40)
    return x0, x1, P.GATE_CLEAR, P.GATE_CLEAR + P.GATE_H, P.CL_GATE_END_Y


def gate_parts():
    x0, x1, z0, z1, y = gate_geom()
    r = P.CL_RAIL_OD / 2
    S = []
    for a, b in (((x0, y, z0), (x1, y, z0)), ((x0, y, z1), (x1, y, z1)), ((x0, y, z0), (x0, y, z1)), ((x1, y, z0), (x1, y, z1)),
                 ((x0, y, (z0 + z1) / 2), (x1, y, (z0 + z1) / 2))):
        S.append(SPart("CL-GATE", "chain-link walk gate frame 1-3/8 in", "steel", GATESTEP, cyl(a, b, r), node="run_door", bom="CL-GATE"))
    S.append(SPart("CL-HW", "gate fork latch + carabiner (two-step)", "metal", GATESTEP,
                   box(x1 - 10, x1 + 60, y - 30, y + 30, (z0 + z1) / 2 + 60, (z0 + z1) / 2 + 120), node="run_door", bom="CL-GATE-HW"))
    for z in (z0 + 200, z1 - 200):
        S.append(SPart("CL-HW", "gate hinge (male/female)", "metal", GATESTEP,
                       box(x0 - 45, x0 + 10, y - 20, y + 20, z - 30, z + 30), bom="CL-GATE-HW"))
    return S


def gate_fabric_rect():
    x0, x1, z0, z1, y = gate_geom()
    return ("gate fabric", "y", y, (x0, x1), (z0, z1), "run_door")


def roof_geom():
    half = (P.COOP_W - 2 * P.CL_PO) / 2
    ang = math.atan(P.RUN_ROOF_PITCH)
    y0, y1 = P.CL_GATE_END_Y, P.RUN_ROOF_END_Y - 40
    n = max(2, math.ceil((y1 - y0) / (24 * P.IN)) + 1)
    ys = list(np.linspace(y0, y1, n))
    z_bc = P.CL_TOP_Z + P.S2 / 2                  # bottom chord centre (sits on the top rails)
    return half, ang, ys, z_bc


def roof_parts():
    half, ang, ys, z_bc = roof_geom()
    xc = P.COOP_W / 2
    s2 = P.S2
    eave_run = half + P.RUN_ROOF_OVERHANG
    top_len = eave_run / math.cos(ang)
    S = []
    z_top_base = z_bc + s2 / 2                     # top chords start on the bottom chord top at the rail line
    for i, y in enumerate(ys):
        S.append(SPart("RR1", "truss bottom chord 2x2", "lumber", ROOFSTEP, box(P.CL_PO - 20, P.COOP_W - P.CL_PO + 20, y - s2 / 2, y + s2 / 2, z_bc - s2 / 2, z_bc + s2 / 2), length_in_hint=(P.COOP_W - 2 * P.CL_PO + 40) / P.IN))
        for sgn in (-1, 1):
            xm = xc + sgn * (half - eave_run / 2)
            zm = z_top_base + (eave_run / 2 - P.RUN_ROOF_OVERHANG) * math.tan(ang) + s2 / 2
            S.append(SPart("RR2", "truss top chord 2x2 (3:12)", "lumber", ROOFSTEP,
                           Pos(xm, y, zm) * Rot(0, sgn * math.degrees(ang), 0) * Box(top_len, s2, s2), length_in_hint=top_len / P.IN))
        kp = half * math.tan(ang)
        S.append(SPart("RR3", "truss king post 2x2", "lumber", ROOFSTEP, box(xc - s2 / 2, xc + s2 / 2, y - s2 / 2, y + s2 / 2, z_bc + s2 / 2, z_bc + s2 / 2 + kp), length_in_hint=kp / P.IN))
        for x in (P.CL_PO, P.COOP_W - P.CL_PO):
            S.append(SPart("RR-STRAP", "pipe strap / rail clamp (truss to top rail)", "metal", ROOFSTEP,
                           box(x - 25, x + 25, y - 12, y + 12, P.CL_TOP_Z - 30, z_bc), bom="RR-STRAP"))
    # purlins (3 per slope) along Y
    yA, yB = ys[0] - P.RUN_ROOF_OVERHANG, ys[-1] + 30
    for sgn in (-1, 1):
        for f in (0.08, 0.5, 0.92):
            d = f * top_len - P.RUN_ROOF_OVERHANG / math.cos(ang)       # along the slope from the rail line
            xh = xc + sgn * (half - d * math.cos(ang))
            zh = z_top_base + s2 + d * math.sin(ang) + s2 / 2
            S.append(SPart("RR4", "purlin 2x2", "lumber", ROOFSTEP, box(xh - s2 / 2, xh + s2 / 2, yA, yB, zh - s2 / 2, zh + s2 / 2),
                           length_in_hint=(yB - yA) / P.IN))
    # corrugated panels (one envelope per slope), ridge cap, closures
    zp = z_top_base + 2 * s2
    for sgn in (-1, 1):
        xm = xc + sgn * (half - eave_run / 2)
        zm = zp + (eave_run / 2 - P.RUN_ROOF_OVERHANG) * math.tan(ang) + P.CORR_T / 2
        S.append(SPart("RR-PANEL", "corrugated steel panels, ribs down-slope (envelope)", "roof", ROOFSTEP,
                       Pos(xm, (yA + yB) / 2, zm) * Rot(0, sgn * math.degrees(ang), 0) * Box(top_len + 30, yB - yA, P.CORR_T), bom="RR-PANEL"))
        xe = xc + sgn * (half + P.RUN_ROOF_OVERHANG - 30)
        ze = zp - P.RUN_ROOF_OVERHANG * math.tan(ang) + 6
        S.append(SPart("RR-CLOS", "foam eave closure strip", "dark", ROOFSTEP, box(xe - 15, xe + 15, yA, yB, ze - 6, ze + 6), bom="RR-CLOS"))
    zr = zp + half * math.tan(ang) + P.CORR_T
    for sgn in (-1, 1):
        S.append(SPart("RR-CAP", "ridge cap", "metal", ROOFSTEP,
                       Pos(xc + sgn * 70, (yA + yB) / 2, zr + 8) * Rot(0, sgn * math.degrees(ang), 0) * Box(150, yB - yA, 2.0), bom="RR-CAP"))
    # gable-end + coop-end infill (1/2 in hardware cloth) so the roof leaves no climb-in gap
    tri_h = half * math.tan(ang) + 2 * s2
    for y, nm in ((ys[0] - 2, "gable-end infill (gate end)"), (ys[-1] + 2, "gable-end infill (coop end)")):
        S.append(SPart("RR-INFILL", f"{nm}, 1/2 in hardware cloth", "mesh", ROOFSTEP,
                       box(P.CL_PO, P.COOP_W - P.CL_PO, y - 1, y + 1, P.CL_TOP_Z, P.CL_TOP_Z + tri_h), alpha=0.3, bom="RR-INFILL"))
    S.append(SPart("RR-INFILL", "coop-end ceiling infill (run roof to coop front wall), 1/2 in hardware cloth", "mesh", ROOFSTEP,
                   box(0, P.COOP_W, ys[-1] + 2, P.COOP_Y0 - P.PLY_WALL, P.CL_TOP_Z - 2, P.CL_TOP_Z), alpha=0.3, bom="RR-INFILL"))
    return S


def guard_rects(cfg=None):
    """Predator layer over the lower chain-link (or full height for chicken wire if RUN_GUARD_H_IN=72)."""
    if P.RUN_GUARD == "none":
        return []
    h = P.RUN_GUARD_H
    out = []
    for nm, ax, c, u, z, node in fabric_rects(cfg) + [gate_fabric_rect()]:
        off = -4 if c < P.COOP_W / 2 else 4
        if nm.startswith("under-coop"):
            if z[1] > 0.0:
                out.append((f"{nm} guard", ax, c + off, u, (max(0.0, z[0]), z[1]), node))
        else:
            out.append((f"{nm} guard", ax, c + (off if ax == "x" else -4), u, (z[0], min(z[0] + h, z[1])), node))
    return out


def rect_box(ax, c, u, z, t=2.0):
    if ax == "x":
        return box(c - t / 2, c + t / 2, u[0], u[1], z[0], z[1])
    return box(u[0], u[1], c - t / 2, c + t / 2, z[0], z[1])


def fabric_parts(cfg=None):
    S = []
    for nm, ax, c, u, z, node in fabric_rects(cfg) + [gate_fabric_rect()]:
        S.append(SPart("CL-FAB", f"chain-link fabric 2 in mesh, {nm}", "chainlink", MESHSTEP if node == "static" else GATESTEP,
                       rect_box(ax, c, u, z, 3.0), node=node, bom="CL-FAB" if "under" not in nm else "CL-FAB36",
                       alpha=0.5, mesh_override=("chainlink", ax, c, u, z)))
    g = P.RUN_GUARD
    for nm, ax, c, u, z, node in guard_rects(cfg):
        layer = "mesh" if g == "hardware_cloth_skirt" else "chickenwire"
        ref = "HC-SKIRT" if g == "hardware_cloth_skirt" else "CW-LAYER"
        S.append(SPart(ref, f"{'1/2 in hardware cloth skirt' if ref == 'HC-SKIRT' else '1 in chicken wire layer'}: {nm}", layer,
                       MESHSTEP if node == "static" else GATESTEP, rect_box(ax, c, u, z, 1.2), node=node, bom=ref, alpha=0.35))
    # tension bars + bands at fabric ends (drawn as bars), bottom tension wire
    for nm, ax, c, u, z, node in fabric_rects():          # tension bars at the real fabric ends only (uncut rects)
        for uu in u:
            p0 = (c, uu, z[0]) if ax == "x" else (uu, c, z[0]); p1 = (c, uu, z[1]) if ax == "x" else (uu, c, z[1])
            S.append(SPart("CL-TBAR", "tension bar + bands", "steel", MESHSTEP, cyl(p0, p1, 4.0), bom="CL-TBAR" if "under" not in nm else "CL-TBAR36"))
        if "under" not in nm:
            a = (c, u[0], 80) if ax == "x" else (u[0], c, 80); b = (c, u[1], 80) if ax == "x" else (u[1], c, 80)
            S.append(SPart("CL-TWIRE", "bottom tension wire 9 ga", "steel", MESHSTEP, cyl(a, b, 2.0), bom="CL-TWIRE"))
    # apron
    if P.RUN_APRON != "none":
        z0 = -P.APRON_DEPTH if P.RUN_APRON == "buried" else 0.0
        a = P.APRON_W
        x0, x1 = -P.CL_TERM_OD - P.CL_UNDER_OFF, P.COOP_W + P.CL_TERM_OD + P.CL_UNDER_OFF
        y0, y1 = -P.CL_TERM_OD / 2 - 40, P.COOP_Y1 + P.PLY_WALL + P.CL_UNDER_OFF + 10
        ap = box(x0 - a, x1 + a, y0 - a, y1 + a, z0, z0 + 1.5) - box(x0, x1, y0, y1, z0, z0 + 1.5)
        S.append(SPart("APRON", f"predator apron, 1/2 in hardware cloth, 12 in wide ({P.RUN_APRON})", "mesh", MESHSTEP, ap,
                       bom="APRON", alpha=0.35))
    return S


def run_parts(cfg=None):
    return _posts() + gate_parts() + roof_parts() + fabric_parts(cfg)


def chainlink_strips(ax, c, u, z, pitch=P.CL_MESH, wire=P.CL_WIRE):
    """Diamond-mesh wire strips for the renderer/GLB: returns V (n,3), F (m,3) in world mm."""
    Lu, Lz = u[1] - u[0], z[1] - z[0]
    step = pitch * math.sqrt(2)
    V, F = [], []
    def seg(p, q, maxlen=120.0):
        d = np.array(q) - np.array(p); L = np.linalg.norm(d)
        if L < 1:
            return
        if L > maxlen:                       # short pieces keep the rasterizer's bounding boxes small
            k = int(math.ceil(L / maxlen))
            for i in range(k):
                seg(tuple(np.array(p) + d * i / k), tuple(np.array(p) + d * (i + 1) / k), maxlen=1e9)
            return
        n = np.array([-d[1], d[0]]) / L * wire / 2
        quad = [np.array(p) + n, np.array(p) - n, np.array(q) - n, np.array(q) + n]
        k = len(V)
        for a, b in quad:
            V.append((c, u[0] + a, z[0] + b) if ax == "x" else (u[0] + a, c, z[0] + b))
        F.extend([(k, k + 1, k + 2), (k, k + 2, k + 3)])
    for sgn in (1, -1):
        k0 = -Lz if sgn > 0 else 0.0
        kk = k0
        while kk < Lu + Lz:
            # line: a - sgn*b = kk  (a along u, b along z)
            pts = []
            for b in (0.0, Lz):
                a = kk + sgn * b
                if 0 <= a <= Lu:
                    pts.append((a, b))
            for a in (0.0, Lu):
                b = (a - kk) * sgn
                if 0 <= b <= Lz:
                    pts.append((a, b))
            pts = sorted(set((round(x, 3), round(y, 3)) for x, y in pts))
            if len(pts) >= 2:
                seg(pts[0], pts[-1])
            kk += step
    # outline wires (knuckled edges)
    for p, q in (((0, 0), (Lu, 0)), ((0, Lz), (Lu, Lz))):
        seg(p, q)
    return np.array(V, np.float32), np.array(F, np.int32)
