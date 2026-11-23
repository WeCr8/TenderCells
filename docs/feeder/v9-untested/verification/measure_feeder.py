"""Independent measurement of the v9 feeder STEP solids (read-only). Run with the build123d venv."""
import math
import sys
from pathlib import Path
from build123d import import_step, GeomType, Axis

ROOT = Path(sys.argv[1])
CAD = ROOT / "CAD" / "STEP"


def load(name):
    p = CAD / name
    s = import_step(str(p))
    return s


def bb(s):
    b = s.bounding_box()
    return (round(b.size.X, 2), round(b.size.Y, 2), round(b.size.Z, 2))


def cyl_radii(s):
    out = {}
    for f in s.faces():
        if f.geom_type == GeomType.CYLINDER:
            try:
                r = round(f.radius, 2)
            except Exception:
                continue
            out[r] = out.get(r, 0) + f.area
    return dict(sorted(out.items(), key=lambda kv: -kv[1])[:8])


rows = {}
for name in ["04_Six_Pocket_Rotor_D_Bore.step", "03_Metering_Center_Housing.step", "05_Drive_Side_Plate_696.step",
             "06_Bearing_Side_Plate_696.step", "10_Hopper_Adapter_Gasketed.step", "11_Hopper_Removable.step",
             "02_LoadCell_Floating_Platform.step", "01_Base_Plate_HeatSet.step"]:
    try:
        s = load(name)
        print(f"== {name}: bbox mm {bb(s)}  volume cm3 {s.volume/1000:.2f}")
        print("   cylinder radii (mm: area):", {k: round(v) for k, v in cyl_radii(s).items()})
    except Exception as exc:  # noqa: BLE001
        print(f"== {name}: ERROR {type(exc).__name__} {str(exc)[:100]}")

# rotor void: cylinder(OD, width) minus rotor solid
rotor = load("04_Six_Pocket_Rotor_D_Bore.step")
b = rotor.bounding_box()
dims = sorted([b.size.X, b.size.Y, b.size.Z])
od, width = max(b.size.X, b.size.Y, b.size.Z) if False else None, None
# rotor axis = the shortest... use largest cylinder radius as OD and the axial length from the cylinder bbox
radii = cyl_radii(rotor)
r_max = max(radii)
print("rotor: largest cylinder radius", r_max, "=> OD", 2 * r_max, "mm; bbox sorted", [round(d, 2) for d in dims])
