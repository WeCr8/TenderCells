"""CT72 rev A1.2: export layered + per-part STEP for every variant (gantry at PARK).

Layers per variant (prefix CT72_A12_):
  L1_FRAME_shared, L1B_COOP_shared (nest bank + basket, lids closed), L1C_ROOST_DEPLOYED_shared,
  L1D_ROOST_STOWED_shared, L2_MOTION_<v> (belt gantry differs per variant), L3_ARM_<v>, L4_GUARDING_shared,
  L5_ELECTRONICS_<v>, L6_KEEPOUTS_<v>
Assemblies:
  ASSY_<v>          = PARK, roosts deployed, lids closed (birds' normal day)
  ASSY_<v>_EGGPICK  = roosts STOWED, lids OPEN, gantry/arm at the offline-checked TOP pick of nest box 1 (Plus/Pro/Starter)
pro_heavy: the UR3e solid is only in L3_ARM_pro_heavy (75 MB vendor geometry); its assemblies carry the adapter ring.
Usage: python build.py [shared|starter|plus|pro|pro_heavy|parts]
"""
import json, os, sys, time
from build123d import Compound, export_step, Color
import ct72_params as P
import ct72_model as M

PFX = "CT72_A12"
OUT = os.path.join(M.HERE, "..", "step")
for d in ("layers", "assembly", "parts"):
    os.makedirs(os.path.join(OUT, d), exist_ok=True)
COLORS = {"frame": (0.75, 0.75, 0.78), "coop": (0.72, 0.52, 0.3), "roost": (0.55, 0.35, 0.2), "motion": (0.2, 0.45, 0.85),
          "arm": (0.95, 0.6, 0.1), "guarding": (0.9, 0.9, 0.2), "electronics": (0.15, 0.7, 0.3), "keepouts": (0.9, 0.2, 0.2)}


def sublayer(p):
    if p.name.startswith(("TC_NEST_", "TC_BASKET_", "TC_EGG_BASKET")):
        return "coop"
    if p.name.startswith("TC_ROOST_"):
        return "roost"
    return p.layer


def labeled(parts, layer_name):
    kids = []
    for p in parts:
        s = p.shape
        s.label = p.name
        s.color = Color(*COLORS.get(sublayer(p), (0.5, 0.5, 0.5)))
        kids.append(s)
    c = Compound(children=kids)
    c.label = layer_name
    return c


def write(c, path):
    export_step(c, path)
    return os.path.getsize(path)


def egg_pick_state(v):
    """Gantry + pose for the TOP pick of nest box 1 centre from the routine check (reports/routines_<v>.json)."""
    f = os.path.join(M.HERE, "..", "reports", f"routines_{'plus' if v == 'pro' else v}.json")
    if not os.path.exists(f):
        return None
    r = json.load(open(f))
    for e in r.get("egg_plan", []):
        if e.get("approach"):
            return e["pick_gantry"], e.get("pick_pose_deg")
    return None


def build(target):
    log = {}
    park = (P.PARK["gx"], P.PARK["gy"], P.PARK["pz"])
    if target == "shared":
        allp = M.assemble("plus", *park, roost="deployed", lid="closed")
        frame = [p for p in allp if p.layer == "frame" and sublayer(p) == "frame"]
        coop = [p for p in allp if sublayer(p) == "coop"]
        roost_d = [p for p in allp if sublayer(p) == "roost"]
        roost_s = [p for p in M.assemble("plus", *park, roost="stowed") if sublayer(p) == "roost"]
        guard = [p for p in allp if p.layer == "guarding" and "pro" not in "".join(p.tiers) or (p.layer == "guarding" and p.tiers == M.ALL)]
        guard = [p for p in allp if p.layer == "guarding" and p.tiers == M.ALL]
        for nm, ps in (("L1_FRAME", frame), ("L1B_COOP", coop), ("L1C_ROOST_DEPLOYED", roost_d), ("L1D_ROOST_STOWED", roost_s),
                       ("L4_GUARDING", guard)):
            f = os.path.join(OUT, "layers", f"{PFX}_{nm}_shared.step")
            log[f] = write(labeled(ps, f"{PFX}_{nm}"), f)
    elif target in P.VARIANTS:
        v = target
        heavy = v == "pro_heavy"
        ps = M.assemble(v, *park, roost="deployed", lid="closed")
        groups = {}
        for layer, n in (("motion", 2), ("arm", 3), ("electronics", 5)):
            sel = [p for p in ps if p.layer == layer]
            f = os.path.join(OUT, "layers", f"{PFX}_L{n}_{layer.upper()}_{v}.step")
            if layer == "arm" and heavy:
                log[f] = write(labeled(sel, f"{PFX}_ARM_{v.upper()}"), f)       # incl. the real UR3e
                sel = [p for p in sel if p.name != "TC_ROBOT_ARM_UR3E"]
            groups[layer] = labeled(sel, f"{PFX}_{layer.upper()}_{v.upper()}")
            if not (layer == "arm" and heavy):
                log[f] = write(groups[layer], f)
        g_extra = [p for p in ps if p.layer == "guarding" and p.tiers != M.ALL]
        ko = labeled([M.Part(k, "keepouts", s, tiers={v}) for k, s in M.envelopes(v).items()], f"{PFX}_KEEPOUTS_{v.upper()}")
        f = os.path.join(OUT, "layers", f"{PFX}_L6_KEEPOUTS_{v}.step")
        log[f] = write(ko, f)

        def assy(parts, label, gro):
            fr = labeled([p for p in parts if p.layer == "frame" and sublayer(p) == "frame"], f"{PFX}_FRAME")
            co = labeled([p for p in parts if sublayer(p) == "coop"], f"{PFX}_COOP")
            ro = labeled([p for p in parts if sublayer(p) == "roost"], f"{PFX}_ROOST")
            gu = labeled([p for p in parts if p.layer == "guarding"], f"{PFX}_GUARDING")
            top = Compound(children=[fr, co, ro, gu] + gro)
            top.label = label
            return top
        f = os.path.join(OUT, "assembly", f"{PFX}_ASSY_{v}.step")
        log[f] = write(assy(ps, f"TC_{PFX}_MASTER_{v.upper()}", [groups["motion"], groups["arm"], groups["electronics"]]), f)
        st = egg_pick_state(v)
        if st and not heavy:
            (gx, gy, pz), pose = st
            pr = M.assemble(v, gx, gy, pz, roost="stowed", lid="open", pose=pose)
            mo = labeled([p for p in pr if p.layer == "motion"], f"{PFX}_MOTION_{v.upper()}")
            ar = labeled([p for p in pr if p.layer == "arm"], f"{PFX}_ARM_{v.upper()}_EGGPICK")
            el = labeled([p for p in pr if p.layer == "electronics"], f"{PFX}_ELECTRONICS_{v.upper()}")
            f = os.path.join(OUT, "assembly", f"{PFX}_ASSY_{v}_EGGPICK.step")
            log[f] = write(assy(pr, f"TC_{PFX}_EGGPICK_{v.upper()}", [mo, ar, el]), f)
    elif target == "parts":
        seen = {}
        for v in P.VARIANTS:
            for roost in ("deployed", "stowed"):
                for p in M.assemble(v, *park, roost=roost, lid="closed"):
                    if p.name == "TC_ROBOT_ARM_UR3E":
                        continue
                    nm = p.name + ("_STOWED" if roost == "stowed" and p.name.startswith("TC_ROOST_") else "")
                    if nm.endswith("_STOWED") and p.name.endswith(("_PIVOT_RAIL", "_TORQUE_TUBE", "_ACTUATOR", "_PINCH_GUARD")):
                        continue
                    seen.setdefault(nm, p)
        for n, p in seen.items():
            f = os.path.join(OUT, "parts", f"{n}.step")
            s = p.shape; s.label = n
            log[f] = write(s, f)
    return log


if __name__ == "__main__":
    for tgt in sys.argv[1:] or ["shared", "starter", "plus", "pro", "pro_heavy", "parts"]:
        t0 = time.time()
        lg = build(tgt)
        print(tgt, len(lg), "files", round(sum(lg.values()) / 1e6, 1), "MB", round(time.time() - t0, 1), "s", flush=True)
