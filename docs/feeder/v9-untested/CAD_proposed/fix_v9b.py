"""V9b proposed fix for the Smart Feeder v9 feed-path assembly (PROPOSAL: not printed or fit-tested).

Defects addressed (found with eng_guardian):
  1. Closure plates (7 mm) were placed INSIDE the housing end walls (44 cm3 overlap per side). The housing's M4 insert holes open on the
     end face (Y +/-33), so the plates belong OUTSIDE (Y 33..40) with a 7 mm spigot into the bore, which keeps the 52 mm inner spacing
     (0.6 mm axial gap per rotor side).
  2. Housing M4 insert holes were 4.34 mm lower in Z than the plate bolt pattern.
  3. The M4 insert holes (X +/-42) broke into the four full-height vertical holes (X +/-46, Y +/-30) by 1.05 mm.
Fix: M4 pattern moved to X +/-38.7, Z 18.0 / 106.0 (part-local), identical on housing and plates. Plates moved 7 mm out, spigot R35.7 added,
bearing moved with the +Y plate. Housing end walls and vertical holes are untouched.
Usage: python fix_v9b.py <orig_asm.step> <orig_housing_part.step> <out_dir>"""
import json
import sys
from pathlib import Path
from build123d import import_step, export_step, Pos, Rot, Cylinder, Compound

ASM, HOUSING, OUT = sys.argv[1], sys.argv[2], Path(sys.argv[3])
OUT.mkdir(parents=True, exist_ok=True)
ORIGIN = (-50.0, 0.0, 54.7)                 # part-local -> assembly translation
AXIS_X, AXIS_Z = -50.0, 116.7               # bore axis in assembly coordinates
R_INS = 2.8                                 # M4 heat-set insert hole
R_PLATE_HOLE = 2.25                         # M4 clearance in the plates
OLD_X, NEW_X = 42.0, 38.7                   # bolt X offset from the axis
OLD_Z_LOCAL = (13.66, 101.66)               # measured old insert Z (part-local)
NEW_Z_LOCAL = (18.0, 106.0)
SPIGOT_R, SHAFT_R, T = 35.7, 3.5, 7.0       # spigot (bore R36 - 0.3), shaft hole, plate thickness


def ycyl(r, length, x, y, z):
    return Pos(x, y, z) * Rot(X=90) * Cylinder(r, length)


# ---------------- housing (part-local coordinates)
h = import_step(HOUSING)
VERT = [Pos(vx, vy, 59.0) * Cylinder(2.25, 118.0) for vx in (-46.0, 46.0) for vy in (-30.0, 30.0)]   # full-height vertical holes, keep them clear
for sgn in (1, -1):
    for z in OLD_Z_LOCAL:
        for x in (-OLD_X, OLD_X):
            plug = ycyl(R_INS + 0.02, 9.2, x, sgn * 28.4, z)               # fill old hole, Y 23.8..33.0
            for v in VERT:
                plug = plug - v                                             # the old hole broke into the vertical hole: do not fill that part
            h = h + plug
    for z in NEW_Z_LOCAL:
        for x in (-NEW_X, NEW_X):
            h = h - ycyl(R_INS, 9.5, x, sgn * 28.75, z)                      # new insert hole, Y 24..33.5 (from the end face)
h = h.clean()
export_step(h, str(OUT / "03_Metering_Center_Housing_V9b.step"))

# ---------------- assembly
sol = import_step(ASM).solids()
housing_asm = Pos(*ORIGIN) * h
plates = {}
for idx, sgn in ((3, 1), (10, -1)):
    p = Pos(0, sgn * T, 0) * sol[idx]                                        # move outside the housing end face: |Y| 33..40
    for z in (72.7, 160.7):
        for x in (AXIS_X - OLD_X, AXIS_X + OLD_X):
            p = p + ycyl(R_PLATE_HOLE + 0.02, T, x, sgn * 36.5, z)           # fill old bolt holes
    for z in (72.7, 160.7):
        for x in (AXIS_X - NEW_X, AXIS_X + NEW_X):
            p = p - ycyl(R_PLATE_HOLE, T + 1.0, x, sgn * 36.5, z)           # new bolt holes on the housing pattern
    p = p + ycyl(SPIGOT_R, T, AXIS_X, sgn * 29.5, AXIS_Z)                    # spigot into the bore, inner face at |Y| = 26
    p = p - ycyl(SHAFT_R, T + 0.4, AXIS_X, sgn * 29.5, AXIS_Z)               # shaft hole through the spigot
    plates[idx] = p.clean()
sol[2] = housing_asm
sol[3], sol[10] = plates[3], plates[10]
sol[4] = Pos(0, T, 0) * sol[4]                                               # 696 bearing follows the +Y plate
export_step(Compound(sol), str(OUT / "TC-FDR-ASM-2000_FEED_PATH_CORE_V9b.step"))
(OUT / "fix_v9b_report.json").write_text(json.dumps({
    "status": "PROPOSAL, not printed or fit-tested", "bolt_x_offset_mm": NEW_X, "bolt_z_part_local_mm": NEW_Z_LOCAL,
    "plate_position_y_mm": [33, 40], "spigot_radius_mm": SPIGOT_R, "inner_face_spacing_mm": 52}, indent=1), encoding="utf-8")
print("wrote V9b housing and assembly to", OUT)
