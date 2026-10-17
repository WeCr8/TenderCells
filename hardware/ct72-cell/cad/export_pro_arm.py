"""rev A1.1: export L3_ARM_pro (UR3e + adapter) as a NAMED, COLOURED layer.

A1 used the plain STEPControl_Writer, so the file had no part names (products came out as
"Open CASCADE STEP translator 8.0 1.x") and no colours, unlike every other layer.
This version uses the XCAF writer: layer root CT72_A1_ARM_PRO, children TC_ROBOT_ADAPTER_PRO and
TC_ROBOT_ARM_UR3E (vendor solids kept as-is), arm-layer colour (0.95, 0.6, 0.1). Geometry and
placement are unchanged (same arm_parts() call at PARK).
"""
import os, sys
import ct72_params as P, ct72_model as M
from build123d import Compound, Color, export_step

out = sys.argv[1] if len(sys.argv) > 1 else os.path.join(M.HERE, "..", "step", "layers", "CT72_A1_L3_ARM_pro.step")
parts = M.arm_parts("pro", P.PARK["gx"], P.PARK["gy"], P.PARK["pz"])
kids = []
for p in parts:
    s = p.shape
    s.label = p.name
    s.color = Color(0.95, 0.6, 0.1)   # arm-layer colour, same as build.COLORS["arm"]
    kids.append(s)
layer = Compound(children=kids)
layer.label = "CT72_A1_ARM_PRO"
export_step(layer, out + ".tmp")
os.replace(out + ".tmp", out)
print("ok", [p.name for p in parts], os.path.getsize(out))
