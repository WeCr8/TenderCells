"""Animated GLB per config: mesh nodes in mm under a root that converts Z-up mm -> glTF Y-up metres.
Node TRS tracks sampled at GLB_FPS from anim.py (door from the firmware trace, hens, arm, doors, exploded build).
No normals are written (viewers shade flat), which keeps the file small. Plays in any glTF viewer
(e.g. https://gltf-viewer.donmccurdy.com/ or the three.js editor)."""
from __future__ import annotations
import json, math, os, struct, sys
import numpy as np
import scene, anim

GLB_FPS = 15


def quat(Rm):
    m = Rm; tr = m[0, 0] + m[1, 1] + m[2, 2]
    if tr > 0:
        s = math.sqrt(tr + 1.0) * 2; w = 0.25 * s; x = (m[2, 1] - m[1, 2]) / s; y = (m[0, 2] - m[2, 0]) / s; z = (m[1, 0] - m[0, 1]) / s
    elif m[0, 0] > m[1, 1] and m[0, 0] > m[2, 2]:
        s = math.sqrt(1.0 + m[0, 0] - m[1, 1] - m[2, 2]) * 2; w = (m[2, 1] - m[1, 2]) / s; x = 0.25 * s; y = (m[0, 1] + m[1, 0]) / s; z = (m[0, 2] + m[2, 0]) / s
    elif m[1, 1] > m[2, 2]:
        s = math.sqrt(1.0 + m[1, 1] - m[0, 0] - m[2, 2]) * 2; w = (m[0, 2] - m[2, 0]) / s; x = (m[0, 1] + m[1, 0]) / s; y = 0.25 * s; z = (m[1, 2] + m[2, 1]) / s
    else:
        s = math.sqrt(1.0 + m[2, 2] - m[0, 0] - m[1, 1]) * 2; w = (m[1, 0] - m[0, 1]) / s; x = (m[0, 2] + m[2, 0]) / s; y = (m[1, 2] + m[2, 1]) / s; z = 0.25 * s
    q = np.array([x, y, z, w]); return q / np.linalg.norm(q)


def decompose(Mx):
    t = Mx[:3, 3].copy()
    S = np.linalg.norm(Mx[:3, :3], axis=0)
    S = np.where(S < 1e-9, 1e-9, S)
    Rm = Mx[:3, :3] / S
    if np.linalg.det(Rm) < 0:
        Rm[:, 0] *= -1; S[0] *= -1
    return t, quat(Rm), S


class Buf:
    def __init__(self):
        self.data = bytearray(); self.views = []; self.acc = []

    def add(self, arr, comp, typ, target=None, minmax=False):
        arr = np.ascontiguousarray(arr)
        while len(self.data) % 4:
            self.data += b"\0"
        off = len(self.data); self.data += arr.tobytes()
        v = {"buffer": 0, "byteOffset": off, "byteLength": arr.nbytes}
        if target:
            v["target"] = target
        self.views.append(v)
        a = {"bufferView": len(self.views) - 1, "componentType": comp, "count": int(arr.shape[0]), "type": typ}
        if minmax:
            a["min"] = arr.min(0).tolist(); a["max"] = arr.max(0).tolist()
        self.acc.append(a)
        return len(self.acc) - 1


def export(cfg, path):
    objs = scene.build_objects(cfg)
    B = Buf(); meshes, nodes, mats, matidx = [], [], [], {}
    times = np.arange(0, anim.DURATION + 1e-6, 1.0 / GLB_FPS, dtype=np.float32)
    t_acc = B.add(times, 5126, "SCALAR", minmax=True)
    B.acc[t_acc]["min"] = [float(times[0])]; B.acc[t_acc]["max"] = [float(times[-1])]
    channels, samplers = [], []
    child_ids = []
    for o in objs:
        key = (o["layer"], o["alpha"])
        if key not in matidx:
            c = list(o["color"]) + [o["alpha"]]
            m = {"name": o["layer"], "pbrMetallicRoughness": {"baseColorFactor": c, "metallicFactor": 0.1 if o["layer"] not in ("metal", "rail") else 0.6,
                                                              "roughnessFactor": 0.8}, "doubleSided": True}
            if o["alpha"] < 1:
                m["alphaMode"] = "BLEND"
            matidx[key] = len(mats); mats.append(m)
        pa = B.add(o["V"].astype(np.float32), 5126, "VEC3", 34962, minmax=True)
        ia = B.add(o["F"].astype(np.uint32).reshape(-1), 5125, "SCALAR", 34963)
        meshes.append({"name": o["name"], "primitives": [{"attributes": {"POSITION": pa}, "indices": ia, "material": matidx[key]}]})
        Ms = [scene.obj_tf(cfg, o, float(t)) for t in times]
        TRS = [decompose(m) for m in Ms]
        Tt = np.array([x[0] for x in TRS], np.float32); Rq = np.array([x[1] for x in TRS], np.float32); Ss = np.array([x[2] for x in TRS], np.float32)
        nd = {"name": o["name"], "mesh": len(meshes) - 1, "extras": {"parts": o["parts"][:40], "build_step": int(o["step"])}}
        nd["translation"] = Tt[0].tolist(); nd["rotation"] = Rq[0].tolist(); nd["scale"] = Ss[0].tolist()
        nodes.append(nd); nid = len(nodes) - 1; child_ids.append(nid)
        for path_, arr, typ in (("translation", Tt, "VEC3"), ("rotation", Rq, "VEC4"), ("scale", Ss, "VEC3")):
            if np.ptp(arr, axis=0).max() < 1e-5:
                continue
            oa = B.add(arr, 5126, typ)
            samplers.append({"input": t_acc, "output": oa, "interpolation": "LINEAR"})
            channels.append({"sampler": len(samplers) - 1, "target": {"node": nid, "path": path_}})
    root = {"name": f"TenderCells_ChickenTender_CT_COOP_A_{cfg}", "children": child_ids,
            "rotation": [-math.sqrt(0.5), 0, 0, math.sqrt(0.5)], "scale": [0.001, 0.001, 0.001]}
    nodes.append(root)
    gl = {"asset": {"version": "2.0", "generator": "TenderCells showcase export_glb.py",
                    "copyright": "TenderCells (WeCr8). SO-101 meshes: TheRobotStudio/SO-ARM100, Apache-2.0"},
          "scene": 0, "scenes": [{"name": f"Chicken Tender coop - {cfg}", "nodes": [len(nodes) - 1]}],
          "nodes": nodes, "meshes": meshes, "materials": mats,
          "animations": [{"name": f"day_in_the_coop_and_build_{cfg}", "channels": channels, "samplers": samplers}],
          "accessors": B.acc, "bufferViews": B.views, "buffers": [{"byteLength": len(B.data)}]}
    js = json.dumps(gl, separators=(",", ":")).encode()
    js += b" " * ((4 - len(js) % 4) % 4)
    bin_ = bytes(B.data) + b"\0" * ((4 - len(B.data) % 4) % 4)
    with open(path, "wb") as f:
        f.write(struct.pack("<III", 0x46546C67, 2, 12 + 8 + len(js) + 8 + len(bin_)))
        f.write(struct.pack("<II", len(js), 0x4E4F534A)); f.write(js)
        f.write(struct.pack("<II", len(bin_), 0x004E4942)); f.write(bin_)
    return os.path.getsize(path)


if __name__ == "__main__":
    out = sys.argv[2] if len(sys.argv) > 2 else "/workspace/work/coop-showcase"
    for cfg in sys.argv[1].split(","):
        p = os.path.join(out, f"CT_COOP_A_showcase_{cfg}.glb")
        print(cfg, round(export(cfg, p) / 1e6, 2), "MB", p, flush=True)
