"""SolidCraft-friendly STEP exports (AP214, names + colours + component tree), same naming as the PR #189 files.

    python export_step.py options        -> ../step/CT_COOP_A_showcase_<base|starter|plus|pro>.step
    python export_step.py parts          -> ../step/parts/CT_COOP_A_<PID>_<name>.step (one file per unique part)
Chain-link fabric, hardware cloth and chicken wire are thin sheets (the 2 in diamonds are drawn only in the GLB/MP4).
The SO-101 is a set of labelled proxy boxes (one per URDF link at the park pose); the real meshes live in the GLB/USD.
"""
import os, re, sys
import numpy as np
from build123d import Compound, Color, Box, Location, export_step
import sc_params as P, sc_model as M, arm, so101

ROOT = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..")
COL = dict(P.COLORS); COL.update(P.COLORS_SC)


def so101_proxies(cfg):
    if cfg not in ("plus", "pro"):
        return []
    q = dict(arm.PARK_Q)
    yb = P.NB_DIV_Y if cfg == "plus" else P.NB_DIV_Y
    B = so101.mount_tf((P.NB_CX, yb, P.ARM_BASE_Z), inverted=True)
    L = so101.model().fk(q, B)
    out = []
    for ln, (V, F) in arm.link_meshes().items():
        lo, hi = V.min(0) * 1000, V.max(0) * 1000
        c = (lo + hi) / 2; sz = np.maximum(hi - lo, 2.0)
        T = L[ln].copy(); T[:3, 3] *= 1000
        R = T[:3, :3]
        ax = np.array([R[2, 1] - R[1, 2], R[0, 2] - R[2, 0], R[1, 0] - R[0, 1]])
        ang = np.degrees(np.arccos(np.clip((np.trace(R) - 1) / 2, -1, 1)))
        s = np.linalg.norm(ax)
        if s < 1e-9:
            ev, evec = np.linalg.eig(R); ax = np.real(evec[:, np.argmin(np.abs(ev - 1))]); s = np.linalg.norm(ax)
        loc = Location(tuple(T[:3, 3]), tuple(ax / s), float(ang)) if ang > 1e-6 else Location(tuple(T[:3, 3]))
        b = loc * (Location(tuple(c)) * Box(*sz))
        out.append(M.SPart("SO101", f"SO-101 {ln} (proxy box, URDF Apache-2.0)", "arm", 10, b, configs=(cfg,)))
    return out


def labeled(parts, name):
    kids = []
    for p in parts:
        s = p.shape
        s.label = f"{p.pid} {p.name}"[:120]
        s.color = Color(*COL[p.layer])
        kids.append(s)
    c = Compound(children=kids); c.label = name
    return c


def options(which=("base", "starter", "plus", "pro")):
    os.makedirs(os.path.join(ROOT, "step"), exist_ok=True)
    for cfg in which:
        ps = [p for p in M.parts(cfg) if p.in_step] + so101_proxies(cfg)
        groups = {}
        for p in ps:
            groups.setdefault(p.step, []).append(p)
        kids = [labeled(v, f"CT_COOP_A_{cfg.upper()}_S{k + 1:02d}_{re.sub('[^A-Za-z0-9]+', '_', M.STEPS[k]).strip('_')}") for k, v in sorted(groups.items())]
        top = Compound(children=kids); top.label = f"CT_COOP_A_SHOWCASE_{cfg.upper()}"
        f = os.path.join(ROOT, "step", f"CT_COOP_A_showcase_{cfg}.step")
        export_step(top, f)
        print(cfg, len(ps), round(os.path.getsize(f) / 1e6, 2), "MB", flush=True)


def parts():
    d = os.path.join(ROOT, "step", "parts"); os.makedirs(d, exist_ok=True)
    seen = {}
    for cfg in ("base", "starter", "plus", "pro"):
        for p in M.parts(cfg) + so101_proxies(cfg):
            if not p.in_step or p.pid == "CABLE":
                continue
            nm = re.sub(r"\s(seg \d+|\d+)$", "", p.name)
            key = f"{p.pid}_{re.sub('[^A-Za-z0-9]+', '_', nm).strip('_')}"[:90]
            if key in seen:
                continue
            seen[key] = 1
            s = p.shape; s.label = f"{p.pid} {p.name}"[:120]; s.color = Color(*COL[p.layer])
            export_step(s, os.path.join(d, f"CT_COOP_A_{key}.step"))
    print(len(seen), "part files")


if __name__ == "__main__":
    if sys.argv[1] == "options":
        options(tuple(sys.argv[2].split(",")) if len(sys.argv) > 2 else ("base", "starter", "plus", "pro"))
    else:
        parts()
