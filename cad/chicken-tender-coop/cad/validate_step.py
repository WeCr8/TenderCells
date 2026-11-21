"""Re-import every exported STEP and record solid count + bbox -> reports/step_validation.json"""
import glob, json, os, sys, time
from build123d import import_step
root = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..")
out = os.path.join(root, "reports", "step_validation.json")
res = json.load(open(out)) if os.path.exists(out) else {}
pat = sys.argv[1] if len(sys.argv) > 1 else "step/*/*.step"
for f in sorted(glob.glob(os.path.join(root, pat))):
    rel = os.path.relpath(f, root)
    if rel in res and "solids" in res[rel]:
        continue
    t = time.time()
    try:
        s = import_step(f); b = s.bounding_box(optimal=False)
        res[rel] = {"solids": len(s.solids()), "bbox_mm": [round(v, 1) for v in (b.min.X, b.min.Y, b.min.Z, b.max.X, b.max.Y, b.max.Z)], "MB": round(os.path.getsize(f) / 1e6, 2)}
    except Exception as e:
        res[rel] = {"error": str(e)}
    json.dump(res, open(out, "w"), indent=1)
print(len(res), "files;", sum("error" in v for v in res.values()), "errors")
