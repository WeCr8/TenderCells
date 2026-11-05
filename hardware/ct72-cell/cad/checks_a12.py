"""CT72 rev A1.2 OCC clash checks (B-rep booleans, like A1.1 checks.py) for every variant and both roost
positions (deployed / stowed) and both nest-lid positions.

1 static vs static (incl. nest bank, basket pocket, roost bars + actuators + guards in both positions)
2 moving gantry hardware swept over FULL travel (box-conservative) vs static, classified:
     CONDITIONAL-ROOST  roost deployed in the gantry sweep -> interlock: gantry may enter only with roosts STOWED
     SOFT-ZONE          nest bank / basket / lid -> firmware + host no-go zones (ct72_cell_a12.json)
     HARD               anything else (must be 0)
3 moving parts vs each other at PARK + 8 travel corners
4 pro_heavy: real UR3e STEP (as-supplied pose, inverted) at PARK + 8 corners + over each nest box, both roost states
Writes ../reports/checks_a12_<variant>.json. Usage: python checks_a12.py [variant ...]
"""
import json, os, sys, time
import ct72_params as P
import ct72_model as M
from checks import bbox, bb_overlap, inter_vol, swept_box, corners
from build123d import Pos

OUT = os.path.join(M.HERE, "..", "reports")
TOL = 1.0
EXPECTED = [("PINCH_GUARD", "TORQUE_TUBE"), ("PINCH_GUARD", "ACTUATOR")]   # covers enclose their own hardware
EXPECTED_MOVING = [("ADAPTER_RING", "EGG_TOOL_OUTRIGGER"), ("EGG_TOOL_OUTRIGGER", "EGG_TOOL_VACUUM_PLUNGER")]   # bolted joints
SOFT = ("TC_NEST_", "TC_BASKET_", "TC_EGG_BASKET")


def expected(a, b):
    for x, y in EXPECTED:
        if (x in a and y in b) or (x in b and y in a):
            if a.split("_")[2] == b.split("_")[2]:   # same roost bar (A/B)
                return True
    return False


def classify(static_name, roost):
    if static_name.startswith("TC_ROOST_"):
        return "CONDITIONAL-ROOST" if roost == "deployed" else "HARD"
    if static_name.startswith(SOFT):
        return "SOFT-ZONE"
    return "HARD"


def run(variant):
    t0 = time.time()
    res = {"variant": variant, "states": {}}
    heavy = variant == "pro_heavy"
    for roost in ("deployed", "stowed"):
        for lid in ("closed", "open"):
            key = f"roost_{roost}__lid_{lid}"
            r = {"static_pairs": [], "moving_vs_static": [], "moving_internal": []}
            base = M.assemble(variant, with_arm=False, roost=roost, lid=lid)
            static = [p for p in base if p.group is None]
            sb = [(p, bbox(p.shape)) for p in static]
            for i in range(len(sb)):
                for j in range(i + 1, len(sb)):
                    if not bb_overlap(sb[i][1], sb[j][1]):
                        continue
                    v = inter_vol(sb[i][0].shape, sb[j][0].shape, sb[i][1], sb[j][1])
                    if v > TOL and not expected(sb[i][0].name, sb[j][0].name):
                        r["static_pairs"].append([sb[i][0].name, sb[j][0].name, round(v, 1)])
            lo = {p.name: p for p in M.assemble(variant, P.GX_MIN, P.GY_MIN, P.PZ_MIN, with_arm=not heavy, roost=roost, lid=lid) if p.group}
            hi = {p.name: p for p in M.assemble(variant, P.GX_MAX, P.GY_MAX, P.PZ_MAX, with_arm=not heavy, roost=roost, lid=lid) if p.group}
            swept = {n: swept_box(bbox(lo[n].shape), bbox(hi[n].shape)) for n in lo}
            for n, s in swept.items():
                bs = bbox(s)
                for p, b in sb:
                    if p.layer == "guarding":
                        continue
                    if not bb_overlap(bs, b):
                        continue
                    v = inter_vol(s, p.shape, bs, b)
                    if v > TOL:
                        r["moving_vs_static"].append([n, p.name, round(v, 1), classify(p.name, roost)])
            if lid == "closed":
                for st in [tuple(P.PARK.values())] + list(corners()):
                    mv = [p for p in M.assemble(variant, *st, with_arm=not heavy, roost=roost, lid=lid) if p.group]
                    mb = [(p, bbox(p.shape)) for p in mv]
                    for i in range(len(mb)):
                        for j in range(i + 1, len(mb)):
                            if not bb_overlap(mb[i][1], mb[j][1]):
                                continue
                            v = inter_vol(mb[i][0].shape, mb[j][0].shape, mb[i][1], mb[j][1])
                            if v > TOL and not any((x in mb[i][0].name and y in mb[j][0].name) or (y in mb[i][0].name and x in mb[j][0].name) for x, y in EXPECTED_MOVING):
                                r["moving_internal"].append([str(tuple(round(x) for x in st)), mb[i][0].name, mb[j][0].name, round(v, 1)])
            r["summary"] = {"static": len(r["static_pairs"]),
                            "HARD": sum(x[3] == "HARD" for x in r["moving_vs_static"]),
                            "CONDITIONAL-ROOST": sum(x[3] == "CONDITIONAL-ROOST" for x in r["moving_vs_static"]),
                            "SOFT-ZONE": sum(x[3] == "SOFT-ZONE" for x in r["moving_vs_static"]),
                            "moving_internal": len(r["moving_internal"])}
            res["states"][key] = r
            print(variant, key, r["summary"], round(time.time() - t0), "s", flush=True)
    if heavy:
        res["ur3e"] = ur3e_states()
    res["seconds"] = round(time.time() - t0, 1)
    return res


def ur3e_states():
    """Real UR3e solids at PARK, the 8 travel corners and over each nest box at transit height, vs static parts."""
    out = {}
    park = tuple(P.PARK.values())
    arm0 = [p for p in M.arm_parts("pro_heavy", *park) if p.name == "TC_ROBOT_ARM_UR3E"][0].shape
    sols = [(s, bbox(s)) for s in arm0.solids()]
    states = [("PARK", park)] + [(f"corner{i}", c) for i, c in enumerate(corners())]
    for i in range(P.NEST_BOX_COUNT):
        x0, x1, y0, y1, z0, z1 = M.nest_box_bounds(i)
        gx = max(P.GX_MIN, (x0 + x1) / 2 - P.BASE_X_OFF["pro_heavy"])
        states.append((f"over_NEST_BOX_{i + 1:02d}_transit", (gx, (y0 + y1) / 2, P.PZ_MAX - 150.0)))
    for roost in ("deployed", "stowed"):
        static = [p for p in M.assemble("pro_heavy", with_arm=False, roost=roost, lid="open") if p.group is None]
        sb = [(p, bbox(p.shape)) for p in static]
        coll = []
        for nm, st in states:
            d = (st[0] - park[0], st[1] - park[1], st[2] - park[2])
            for p, b in sb:
                v = 0.0
                for s, s_b in sols:
                    mb = tuple(s_b[k] + d[k % 3] for k in range(6))
                    if bb_overlap(mb, b):
                        v += inter_vol(Pos(*d) * s, p.shape)
                if v > TOL:
                    coll.append([nm, p.name, round(v, 1)])
        out[f"roost_{roost}"] = coll
        print("ur3e", roost, len(coll), flush=True)
    return out


if __name__ == "__main__":
    os.makedirs(OUT, exist_ok=True)
    for v in sys.argv[1:] or list(P.VARIANTS):
        r = run(v)
        json.dump(r, open(os.path.join(OUT, f"checks_a12_{v}.json"), "w"), indent=1)
