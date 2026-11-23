import math, sys
from build123d import import_step, GeomType
R = "C:/tmp/feeder_zip/TenderCells_Feeder_MASTER_v9_ENGINEERING_RECONCILED/CAD/STEP/"
s = import_step(R + "04_Six_Pocket_Rotor_D_Bore.step")
b = s.bounding_box()
print("bbox min", [round(v,2) for v in (b.min.X,b.min.Y,b.min.Z)], "max", [round(v,2) for v in (b.max.X,b.max.Y,b.max.Z)])
# axis = the D-bore cylinder face axis
bore = [f for f in s.faces() if f.geom_type == GeomType.CYLINDER][0]
c = bore.center()
print("D-bore face center", [round(v,2) for v in (c.X,c.Y,c.Z)], "radius", round(bore.radius,2))
cx, cz = (b.min.X+b.max.X)/2, (b.min.Z+b.max.Z)/2
print("bbox centre XZ", round(cx,2), round(cz,2))
# radial distance of every vertex from the bbox centre, in the XZ plane (rotor axis along Y)
rad = [math.hypot(v.X-cx, v.Z-cz) for v in s.vertices()]
print("vertex radius from bbox centre: min %.2f max %.2f, count %d" % (min(rad), max(rad), len(rad)))
hist = {}
for r in rad: hist[round(r)] = hist.get(round(r),0)+1
print("radius histogram (mm: count):", dict(sorted(hist.items())))
# angular positions of the vertices at max radius
big = [(round(math.degrees(math.atan2(v.Z-cz, v.X-cx))%360), round(math.hypot(v.X-cx, v.Z-cz),2)) for v in s.vertices() if math.hypot(v.X-cx, v.Z-cz) > max(rad)-1.0]
print("outermost vertices (angle deg, r):", sorted(set(big))[:24])
# face types summary
kinds = {}
for f in s.faces(): kinds[str(f.geom_type)] = kinds.get(str(f.geom_type),0)+1
print("face types:", kinds)
