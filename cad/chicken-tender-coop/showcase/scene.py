"""Tessellated scene per config (cached), shared by the GLB exporter and the renderer."""
from __future__ import annotations
import os, pickle, math
import numpy as np
import sc_params as P, sc_model as M, anim, arm

CACHE = os.environ.get("SC_CACHE", "/workspace/work/coop-showcase/cache")
COL = dict(P.COLORS); COL.update(P.COLORS_SC)


def tess(shape, tol=1.5):
    v, f = shape.tessellate(tol, 0.35)
    V = np.array([[p.X, p.Y, p.Z] for p in v], np.float32)
    return V, np.asarray(f, np.int32).reshape(-1, 3)


def build_objects(cfg):
    os.makedirs(CACHE, exist_ok=True)
    fn = os.path.join(CACHE, f"scene_{cfg}_{P.RUN_GUARD}_{P.RUN_APRON}_{int(P.RUN_GUARD_H)}.pkl")
    if os.path.exists(fn):
        return pickle.load(open(fn, "rb"))
    groups = {}
    for p in M.parts(cfg):
        if p.node.startswith("hen"):
            continue
        if p.mesh_override and p.mesh_override[0] == "chainlink":
            import run_chainlink as RC
            V, F = RC.chainlink_strips(*p.mesh_override[1:])
            key = (p.node, p.step, p.layer, 1.0)
        else:
            key = (p.node, p.step, p.layer, round(p.alpha, 2))
            V, F = tess(p.shape)
        g = groups.setdefault(key, {"V": [], "F": [], "n": 0, "names": []})
        g["V"].append(V); g["F"].append(F + g["n"]); g["n"] += len(V); g["names"].append(f"{p.pid} {p.name}")
    # hens: one mesh at the origin, instanced per hen node
    hen = {}
    for layer, sh in M.hen_shapes():
        V, F = tess(sh, 3.0)
        g = hen.setdefault(layer, {"V": [], "F": [], "n": 0})
        g["V"].append(V); g["F"].append(F + g["n"]); g["n"] += len(V)
    objs = []
    for (node, step, layer, alpha), g in groups.items():
        objs.append(dict(name=f"{node}|s{step}|{layer}", node=node, step=step, layer=layer, alpha=alpha,
                         color=COL[layer], V=np.concatenate(g["V"]), F=np.concatenate(g["F"]), parts=g["names"]))
    for i in range(4):
        for layer, g in hen.items():
            objs.append(dict(name=f"hen{i + 1}|{layer}", node=f"hen{i + 1}", step=8, layer=layer, alpha=1.0, color=COL[layer],
                             V=np.concatenate(g["V"]), F=np.concatenate(g["F"]), parts=[f"hen {i + 1}"]))
    if cfg in ("plus", "pro"):
        for ln, (V, F) in arm.link_meshes().items():
            objs.append(dict(name=f"so101:{ln}", node=f"so101:{ln}", step=10, layer="arm", alpha=1.0,
                             color=COL["servo"] if ln in ("shoulder_link",) else COL["arm"],
                             V=(V * 1000.0).astype(np.float32), F=F.astype(np.int32), parts=[f"SO-101 {ln} (URDF mesh, Apache-2.0)"]))
    pickle.dump(objs, open(fn, "wb"))
    return objs


def obj_tf(cfg, o, t):
    if o["node"].startswith("so101:"):
        L, *_ = anim.arm_links(cfg, t)
        return anim.explode(o["step"], t) @ L[o["node"].split(":", 1)[1]]
    return anim.world_tf(cfg, o["node"], o["step"], t)
