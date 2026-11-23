from build123d import import_step, GeomType
R="C:/tmp/feeder_zip/TenderCells_Feeder_MASTER_v9_ENGINEERING_RECONCILED/CAD/CANONICAL/"
a=import_step(R+"TC-FDR-ASM-2000_FEED_PATH_CORE_V9.step"); s=a.solids()
hous, plate = s[2], s[3]
ov=(hous&plate); b=ov.bounding_box()
print("housing x +Y plate overlap %.1f cm3, bbox X[%.1f %.1f] Y[%.1f %.1f] Z[%.1f %.1f]"%(ov.volume/1000,b.min.X,b.max.X,b.min.Y,b.max.Y,b.min.Z,b.max.Z))
# housing material present at Y=29.5 (middle of plate slot)? slice with a thin box
from build123d import Box, Pos
for y in (29.5, 24.5, 10.0):
    sl = hous & Pos(-50, y, 113.7) * Box(300, 0.2, 300)
    print("housing cross-section area at Y=%.1f: %.0f mm2 (bore R36 would remove %.0f)"%(y, sl.volume/0.2, 3.14159*36*36))
print("plate +Y bbox", [round(v,1) for v in (plate.bounding_box().min.Y, plate.bounding_box().max.Y)])
# planes at Y=24 in housing: where?
for f in hous.faces():
    if f.geom_type==GeomType.PLANE and abs(abs(f.center().Y)-24.0)<0.05:
        fb=f.bounding_box(); print("plane Y=%.2f area %.0f bbox X[%.1f %.1f] Z[%.1f %.1f]"%(f.center().Y,f.area,fb.min.X,fb.max.X,fb.min.Z,fb.max.Z)); break
