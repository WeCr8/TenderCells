"""Isaac Lab assets (multi-env safe: nothing is pinned to world coordinates).

    python export_usd_lab.py <out_dir>

Writes:
  CT_SO101_follower.usd     /SO101 articulation, root = base_link at the origin (Lab: fix_root_link=True)
  CT_EGG.usd                /Egg rigid body 58 g, convex hull, shell friction
  CT_POPDOOR.usd            /PopDoor fixed-base articulation, prismatic 'door_lift' 0..0.28 m (+ guides as static parts)
  CT_COOP_A_lab_<cfg>.usd   /Coop static coop + chain-link run + hood (doors at rest as static), no robot, eggs,
                            physics scene or lights; for cfg in plus, pro, starter
  tc_layout.json            mount poses, park pose, egg slots, tray poses (mm, coop frame) used by the task cfgs
"""
from __future__ import annotations
import json, math, os, sys
import numpy as np
from pxr import Usd, UsdGeom, UsdPhysics, UsdShade, Sdf, Gf, Vt

import sc_params as P, sc_model as M, scene, anim, arm, so101, run_chainlink as RC
from export_usd import add_mesh, collider, rigid, drive, quat_wxyz, gf_mat, material, phys_material, VISUAL_ONLY, MM


def new_stage(path, root):
    st = Usd.Stage.CreateNew(path)
    UsdGeom.SetStageUpAxis(st, UsdGeom.Tokens.z); UsdGeom.SetStageMetersPerUnit(st, 1.0)
    r = UsdGeom.Xform.Define(st, root); st.SetDefaultPrim(r.GetPrim())
    return st, r


def so101_usd(out):
    m = so101.model(); meshes = arm.link_meshes()
    st, root = new_stage(os.path.join(out, "CT_SO101_follower.usd"), "/SO101")
    UsdPhysics.ArticulationRootAPI.Apply(root.GetPrim())
    root.GetPrim().SetCustomDataByKey("tc:source", "TheRobotStudio/SO-ARM100 so101_new_calib.urdf (Apache-2.0); decimated meshes")
    mat = material(st, "arm", P.COLORS_SC["arm"], 1.0).GetPath()
    L = m.fk({})
    links = {}
    for ln, T in L.items():
        x = UsdGeom.Xform.Define(st, f"/SO101/{ln}"); x.AddTransformOp().Set(gf_mat(T))
        rigid(x.GetPrim(), mass=max(m.links[ln]["mass"], 0.005)); links[ln] = x
        if ln in meshes:
            V, F = meshes[ln]
            add_mesh(st, f"/SO101/{ln}/visual", V, F, P.COLORS_SC["arm"], 1.0, UsdShade.Material(st.GetPrimAtPath(mat)))
            c = add_mesh(st, f"/SO101/{ln}/collision", V, F, P.COLORS_SC["arm"]); UsdGeom.Imageable(c).CreatePurposeAttr("guide")
            collider(c.GetPrim(), "convexHull")
    for jn, j in m.joints.items():
        if j["type"] == "fixed":
            uj = UsdPhysics.FixedJoint.Define(st, f"/SO101/joints/{jn}")
        else:
            uj = UsdPhysics.RevoluteJoint.Define(st, f"/SO101/joints/{jn}"); uj.CreateAxisAttr("Z")
            lo, hi = j["limit"]; uj.CreateLowerLimitAttr(math.degrees(lo)); uj.CreateUpperLimitAttr(math.degrees(hi))
            drive(uj.GetPrim(), "angular", 17.8 if jn != "gripper" else 5.0, 0.6, 2.9 if jn != "gripper" else 0.3)
        uj.CreateBody0Rel().SetTargets([links[j["parent"]].GetPath()]); uj.CreateBody1Rel().SetTargets([links[j["child"]].GetPath()])
        T = j["T"]; uj.CreateLocalPos0Attr(Gf.Vec3f(*map(float, T[:3, 3]))); uj.CreateLocalRot0Attr(quat_wxyz(T[:3, :3]))
        uj.CreateLocalPos1Attr(Gf.Vec3f(0, 0, 0)); uj.CreateLocalRot1Attr(Gf.Quatf(1, 0, 0, 0))
    st.GetRootLayer().Save()


def egg_usd(out):
    import trimesh
    st, root = new_stage(os.path.join(out, "CT_EGG.usd"), "/Egg")
    rigid(root.GetPrim(), mass=P.EGG_MASS_G[1] / 1000)
    em = trimesh.creation.icosphere(subdivisions=2)
    V = np.asarray(em.vertices) * np.array([P.EGG_D / 2, P.EGG_L / 2, P.EGG_D / 2]) * MM
    msh = add_mesh(st, "/Egg/shell", V, em.faces, P.COLORS_SC["egg"]); collider(msh.GetPrim(), "convexHull")
    pm = phys_material(st, "/Egg/PhysicsMaterial", 0.6, 0.5, 0.05)
    UsdShade.MaterialBindingAPI.Apply(msh.GetPrim()).Bind(pm, UsdShade.Tokens.weakerThanDescendants, "physics")
    st.GetRootLayer().Save()


def popdoor_usd(out):
    st, root = new_stage(os.path.join(out, "CT_POPDOOR.usd"), "/PopDoor")
    UsdPhysics.ArticulationRootAPI.Apply(root.GetPrim())
    w, h = P.DOOR_PANEL; t = P.DOOR_T
    base = UsdGeom.Xform.Define(st, "/PopDoor/Base"); rigid(base.GetPrim(), mass=2.0)
    for i, sx in enumerate((-1, 1)):          # guide channels (visual + collider on the base)
        gx = sx * (w / 2 + P.DOOR_SLACK + P.S2 / 2) * MM
        c = UsdGeom.Cube.Define(st, f"/PopDoor/Base/guide_{i}"); c.CreateSizeAttr(1.0)
        xf = UsdGeom.Xformable(c); xf.AddTranslateOp().Set(Gf.Vec3d(gx, 0.0, (P.GUIDE_L / 2 - 0.5 * P.IN) * MM))
        xf.AddScaleOp().Set(Gf.Vec3f(P.S2 * MM, P.S2 * MM, P.GUIDE_L * MM)); c.CreateDisplayColorAttr([Gf.Vec3f(*P.COLORS["lumber"])])
    link = UsdGeom.Xform.Define(st, "/PopDoor/Link"); rigid(link.GetPrim(), mass=0.75)
    c = UsdGeom.Cube.Define(st, "/PopDoor/Link/panel"); c.CreateSizeAttr(1.0)
    xf = UsdGeom.Xformable(c); xf.AddTranslateOp().Set(Gf.Vec3d(0.0, 0.0, h / 2 * MM)); xf.AddScaleOp().Set(Gf.Vec3f(w * MM, t * MM, h * MM))
    c.CreateDisplayColorAttr([Gf.Vec3f(*P.COLORS_SC["door"])]); UsdPhysics.CollisionAPI.Apply(c.GetPrim())
    j = UsdPhysics.PrismaticJoint.Define(st, "/PopDoor/joints/door_lift"); j.CreateAxisAttr("Z")
    j.CreateLowerLimitAttr(0.0); j.CreateUpperLimitAttr(P.DOOR_LIFT * MM)
    j.CreateBody0Rel().SetTargets([base.GetPath()]); j.CreateBody1Rel().SetTargets([link.GetPath()])
    drive(j.GetPrim(), "linear", 4000.0, 400.0, 60.0)
    st.GetRootLayer().Save()


def coop_lab_usd(cfg, out):
    st, root = new_stage(os.path.join(out, f"CT_COOP_A_lab_{cfg}.usd"), "/Coop")
    objs = scene.build_objects(cfg)
    mats = {}
    k = 0
    for o in objs:
        if o["node"].startswith(("hen", "so101:", "egg_pick", "st_", "pro_car")):
            continue
        key = (o["layer"], o["alpha"])
        if key not in mats:
            mats[key] = material(st, f"{o['layer']}_{int(o['alpha'] * 100)}", o["color"], o["alpha"])
        Mx = anim.node_tf(cfg, o["node"], 0.0) if o["node"] != "static" else np.eye(4)
        V = (o["V"].astype(float) @ Mx[:3, :3].T + Mx[:3, 3]) * MM
        msh = add_mesh(st, f"/Coop/s{o['step']:02d}_{o['layer']}_{k:03d}", V, o["F"], o["color"], o["alpha"], mats[key]); k += 1
        if o["layer"] not in VISUAL_ONLY and o["layer"] != "chainlink":
            collider(msh.GetPrim(), "none")
    for i, (nm, ax, c, u, z, node) in enumerate(RC.fabric_rects()):
        cube = UsdGeom.Cube.Define(st, f"/Coop/Colliders/chainlink_{i}"); cube.CreateSizeAttr(1.0)
        sx, sy = (0.003, (u[1] - u[0]) * MM) if ax == "x" else ((u[1] - u[0]) * MM, 0.003)
        cx, cy = (c * MM, (u[0] + u[1]) / 2 * MM) if ax == "x" else ((u[0] + u[1]) / 2 * MM, c * MM)
        xf = UsdGeom.Xformable(cube); xf.AddTranslateOp().Set(Gf.Vec3d(cx, cy, (z[0] + z[1]) / 2 * MM)); xf.AddScaleOp().Set(Gf.Vec3f(sx, sy, (z[1] - z[0]) * MM))
        UsdGeom.Imageable(cube).CreatePurposeAttr("guide"); UsdPhysics.CollisionAPI.Apply(cube.GetPrim())
    g = UsdGeom.Mesh.Define(st, "/Coop/Ground"); s = 2.6
    g.CreatePointsAttr([(-0.6, -0.6, 0), (s, -0.6, 0), (s, 5.0, 0), (-0.6, 5.0, 0)]); g.CreateFaceVertexCountsAttr([4]); g.CreateFaceVertexIndicesAttr([0, 1, 2, 3])
    g.CreateDisplayColorAttr([Gf.Vec3f(0.55, 0.6, 0.48)]); collider(g.GetPrim(), "none")
    st.GetRootLayer().Save()


def layout_json(out):
    B = arm.plus_base()
    def q_of(Bm):
        q = quat_wxyz(Bm[:3, :3]); return [float(q.GetReal()), *[float(v) for v in q.GetImaginary()]]
    pro_y = arm.pro_carriage_for_egg(anim.PICK_EGG[1])
    Bp = arm.pro_base(pro_y)
    d = {"units": "mm, coop frame (origin run-gate end / left / ground, +Y toward the coop back, +Z up)",
         "pick_slot": arm.PICK,
         "park_deg": {k: round(math.degrees(v), 3) for k, v in arm.PARK_Q.items() if k != "gripper"},
         "nest_floor_z_mm": P.NEST_FLOOR_Z,
         "egg_slots": [{"id": e["id"], "box": e["box"], "pos_mm": [round(v, 2) for v in e["pos"]]} for e in M.egg_positions()],
         "plus": {"base_mm": [round(float(v) * 1000, 2) for v in B[:3, 3]], "base_quat_wxyz": q_of(B),
                  "tray_mm": [P.BASKET_PLUS[0], P.BASKET_PLUS[1], P.BASKET_FLOOR_Z + P.EGG_D / 2]},
         "pro": {"base_mm": [round(float(v) * 1000, 2) for v in Bp[:3, 3]], "base_quat_wxyz": q_of(Bp),
                 "gantry_y_range_mm": list(P.PRO_RAIL_Y), "tray_mm": [P.BASKET_PLUS[0], P.BASKET_PLUS[1], P.BASKET_FLOOR_Z + P.EGG_D / 2]},
         "starter": {"rail_x_mm": P.ST_RAIL_X, "rail_y_mm": list(P.ST_RAIL_Y), "tray_mm": [P.BASKET_RAIL[0], P.BASKET_RAIL[1], P.BASKET_FLOOR_Z + P.EGG_D / 2]},
         "apriltag": P.APRILTAG,
         "cameras": {"coop_xiao_sense_mm": [45, P.COOP_Y0 + 230, P.CAM_Z], "bay_xiao_sense_mm": [P.HOOD_X1 - 40, P.HOOD_Y0 + 40, P.HOOD_ROOF_Z - 30], "hfov_deg_assumed": 66}}
    json.dump(d, open(os.path.join(out, "tc_layout.json"), "w"), indent=1)


if __name__ == "__main__":
    out = sys.argv[1] if len(sys.argv) > 1 else "/workspace/work/coop-showcase/usd"
    os.makedirs(out, exist_ok=True)
    so101_usd(out); egg_usd(out); popdoor_usd(out); layout_json(out)
    for cfg in ("plus", "pro", "starter"):
        coop_lab_usd(cfg, out)
    for f in sorted(os.listdir(out)):
        print(f, round(os.path.getsize(os.path.join(out, f)) / 1e6, 2), "MB")
