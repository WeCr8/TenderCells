from build123d import import_step
R="C:/tmp/feeder_zip/TenderCells_Feeder_MASTER_v9_ENGINEERING_RECONCILED/CAD/CANONICAL/"
a=import_step(R+"TC-FDR-ASM-2000_FEED_PATH_CORE_V9.step")
print("top:",type(a).__name__,"solids",len(a.solids()))
for s in a.solids():
    b=s.bounding_box(); lab=getattr(s,"label","") or ""
    print("%-34s X[%7.2f %7.2f] Y[%7.2f %7.2f] Z[%7.2f %7.2f] vol %7.2f cm3"%(lab[:34],b.min.X,b.max.X,b.min.Y,b.max.Y,b.min.Z,b.max.Z,s.volume/1000))

print("--- pairwise interference (volume cm3 > 0.01)")
names=["base","loadcell_platform","housing","plate_drive(+Y)","hall/magnet?","hopper_adapter","gasket","hopper","hopper_lid?","rotor","plate_bearing(-Y)"]
sol=a.solids()
for i in range(len(sol)):
    for j in range(i+1,len(sol)):
        bi,bj=sol[i].bounding_box(),sol[j].bounding_box()
        if bi.max.X<bj.min.X or bj.max.X<bi.min.X or bi.max.Y<bj.min.Y or bj.max.Y<bi.min.Y or bi.max.Z<bj.min.Z or bj.max.Z<bi.min.Z: continue
        try:
            v=(sol[i]&sol[j]).volume/1000
        except Exception as e:
            v=-1
        if v>0.01 or v<0: print("%-20s x %-20s overlap %.3f cm3"%(names[i],names[j],v))
print("done")
