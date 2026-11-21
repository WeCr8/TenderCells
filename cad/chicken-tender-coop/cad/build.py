"""Build the Chicken Tender family coop + run STEP (same labeled-assembly export as ct72 build.py).

    pip install build123d
    python build.py            -> ../step/CT_COOP_A_assembly.step (+ coop-only / run-only) and ../reports/
"""
import json, os
from collections import defaultdict
from build123d import Compound, Color, export_step, export_stl
import coop_model as M
from coop_params import COLORS, IN

ROOT = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..")
PFX = "CT_COOP_A"


def labeled(parts, name):
    kids = []
    for i, p in enumerate(parts):
        s = p.shape
        s.label = f"{p.pid} {p.name}"
        s.color = Color(*COLORS[p.layer])
        kids.append(s)
    c = Compound(children=kids)
    c.label = name
    return c


def build():
    os.makedirs(os.path.join(ROOT, "step"), exist_ok=True)
    os.makedirs(os.path.join(ROOT, "reports"), exist_ok=True)
    def assy(groups_wanted, label):
        ps = M.all_parts()   # fresh shapes per file (a shape can only have one parent)
        kids = [labeled([p for p in ps if p.group == g], f"{PFX}_{g}") for g in groups_wanted]
        c = Compound(children=kids)
        c.label = label
        return c, ps

    out = {}
    for name, gw in ((f"{PFX}_assembly.step", ("COOP", "RUN", "MESH")), (f"{PFX}_coop_only.step", ("COOP",)),
                     (f"{PFX}_framing_no_mesh.step", ("COOP", "RUN"))):
        shape, _ = assy(gw, name.replace(".step", "").upper())
        f = os.path.join(ROOT, "step", name)
        export_step(shape, f)
        out[name] = round(os.path.getsize(f) / 1e6, 2)
    top, parts = assy(("COOP", "RUN", "MESH"), f"{PFX}_ASSEMBLY")
    export_stl(top, os.path.join(ROOT, "step", f"{PFX}_assembly.stl"), tolerance=1.0)
    # cut-list check against the build guide (count x nominal length per ID)
    cl = defaultdict(lambda: {"qty": 0, "lengths_in": set()})
    for p in parts:
        if p.length_in:
            cl[p.pid]["qty"] += 1
            cl[p.pid]["lengths_in"].add(p.length_in)
    bb = top.bounding_box()
    rep = {
        "solids": len(top.solids()),
        "bbox_in": [round(v / IN, 2) for v in (bb.min.X, bb.min.Y, bb.min.Z, bb.max.X, bb.max.Y, bb.max.Z)],
        "files_MB": out,
        "cut_list_modelled": {k: {"qty": v["qty"], "lengths_in": sorted(v["lengths_in"])} for k, v in sorted(cl.items())},
    }
    json.dump(rep, open(os.path.join(ROOT, "reports", f"{PFX}_build.json"), "w"), indent=1)
    print(json.dumps(rep, indent=1))


if __name__ == "__main__":
    build()
