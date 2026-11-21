"""OpenUSD export for NVIDIA Isaac Sim 5.x / Isaac Lab 2.x (also opens in 4.5).

    python export_usd.py <cfg>[,<cfg>...] <out_dir>          # cfg: base | starter | plus | pro

Stage: metres, Z up, /World default prim. Contents:
  /World/PhysicsScene, /World/Looks (UsdPreviewSurface per layer), /World/Lights
  /World/GroundPlane                      static collider (Z = 0)
  /World/Coop/Static/*                     coop + chain-link run + gable roof meshes, static triangle-mesh colliders
  /World/Coop/Articulations/<Door>         fixed-base articulations: PopDoor (prismatic Z, 0..DOOR_LIFT),
                                           ActuatorRod (prismatic X), CleanoutDoor / RunGate (revolute Z),
                                           NestLid (base) or HoodDoor (robot configs) (revolute Y)
  /World/Robot/SO101 (plus, pro)           SO-101 follower from the public URDF (Apache-2.0): 6 links + gripper,
                                           revolute joints with URDF limits and position drives; Pro adds a
                                           prismatic Y gantry carriage
  /World/Robot/StarterPicker (starter)     prismatic Y carriage + prismatic Z plunger + 20 mm cup
  /World/Eggs/Egg_<slot>                   rigid bodies (58 g, convex hull), tc:randomize_* attributes
  /World/Markers/EggSlots/<slot>           all 18 lay positions (Xforms) for pose randomisation
  /World/Markers/Basket, /World/Markers/AprilTag   tray pose + tag36h11 id0 (60 mm)
  /World/Sensors/CoopCam_XIAO, BayCam_XIAO, OverviewCam
Chain-link fabric is a thin-box collider (2 in openings are not modelled: hens cannot pass them).
"""
from __future__ import annotations
import math, os, sys
import numpy as np
from pxr import Usd, UsdGeom, UsdPhysics, UsdShade, UsdLux, Sdf, Gf, Vt

import sc_params as P, sc_model as M, scene, anim, arm, so101, run_chainlink as RC

MM = 0.001
VISUAL_ONLY = {"cable", "pcb", "cord", "reed", "tag", "estop", "dark", "comb", "hen", "metal", "rail"}
ART = {  # node -> (prim name, joint type, axis, limits, pivot mm, drive)
    "pop_door": ("PopDoor", "prismatic", "Z", (0.0, P.DOOR_LIFT * MM), None),
    "act_rod": ("ActuatorRod", "prismatic", "X", (-P.ACT[P.ACT_TIER]["stroke"] * MM, 0.0), None),
    "cleanout": ("CleanoutDoor", "revolute", "Z", (-P.CLEANOUT_OPEN_DEG, 0.0), (P.COOP_W / 2 - P.CLEANOUT[0] / 2, P.COOP_Y1 + P.PLY_WALL, 0)),
    "run_door": ("RunGate", "revolute", "Z", (-P.RUN_DOOR_OPEN_DEG, 0.0), None),
    "nest_lid": ("NestLid", "revolute", "Y", (-P.LID_OPEN_DEG, 0.0), (P.NB_X0, 0, P.LID_HINGE_Z)),
    "hood_door": ("HoodDoor", "revolute", "Y", (0.0, 105.0), (P.HOOD_X1 + 9, 0, P.HOOD_ROOF_Z)),
}


def gf_mat(Mx):
    return Gf.Matrix4d(*[float(v) for v in np.asarray(Mx).T.reshape(-1)])


def quat_wxyz(R):
    q = Gf.Matrix3d(*[float(v) for v in np.asarray(R).T.reshape(-1)]).ExtractRotation().GetQuat()
    return Gf.Quatf(float(q.GetReal()), *[float(v) for v in q.GetImaginary()])


def add_mesh(stage, path, V_m, F, color, opacity=1.0, mat=None):
    m = UsdGeom.Mesh.Define(stage, path)
    m.CreatePointsAttr(Vt.Vec3fArray.FromNumpy(np.asarray(V_m, np.float32)))
    m.CreateFaceVertexCountsAttr(Vt.IntArray([3] * len(F)))
    m.CreateFaceVertexIndicesAttr(Vt.IntArray(np.asarray(F, np.int32).reshape(-1).tolist()))
    m.CreateSubdivisionSchemeAttr("none")
    m.CreateDisplayColorAttr([Gf.Vec3f(*map(float, color))])
    if opacity < 1:
        m.CreateDisplayOpacityAttr([float(opacity)])
    m.CreateDoubleSidedAttr(True)
    if mat is not None:
        UsdShade.MaterialBindingAPI.Apply(m.GetPrim()).Bind(mat)
    return m


def collider(prim, approx="none"):
    UsdPhysics.CollisionAPI.Apply(prim)
    UsdPhysics.MeshCollisionAPI.Apply(prim).CreateApproximationAttr(approx)


def material(stage, name, color, opacity):
    path = f"/World/Looks/{name}"
    mat = UsdShade.Material.Define(stage, path)
    sh = UsdShade.Shader.Define(stage, path + "/Shader")
    sh.CreateIdAttr("UsdPreviewSurface")
    sh.CreateInput("diffuseColor", Sdf.ValueTypeNames.Color3f).Set(Gf.Vec3f(*map(float, color)))
    sh.CreateInput("roughness", Sdf.ValueTypeNames.Float).Set(0.7)
    sh.CreateInput("metallic", Sdf.ValueTypeNames.Float).Set(0.5 if name in ("metal", "steel", "rail") else 0.0)
    if opacity < 1:
        sh.CreateInput("opacity", Sdf.ValueTypeNames.Float).Set(float(opacity))
    mat.CreateSurfaceOutput().ConnectToSource(sh.ConnectableAPI(), "surface")
    return mat


def phys_material(stage, path, sf, df, rest):
    m = UsdShade.Material.Define(stage, path)
    api = UsdPhysics.MaterialAPI.Apply(m.GetPrim())
    api.CreateStaticFrictionAttr(sf); api.CreateDynamicFrictionAttr(df); api.CreateRestitutionAttr(rest)
    return m


def rigid(prim, mass=None, kinematic=False):
    rb = UsdPhysics.RigidBodyAPI.Apply(prim)
    if kinematic:
        rb.CreateKinematicEnabledAttr(True)
    if mass is not None:
        UsdPhysics.MassAPI.Apply(prim).CreateMassAttr(float(mass))


def drive(prim, kind, stiffness, damping, max_force, target=0.0):
    d = UsdPhysics.DriveAPI.Apply(prim, kind)
    d.CreateTypeAttr("force"); d.CreateStiffnessAttr(float(stiffness)); d.CreateDampingAttr(float(damping))
    d.CreateMaxForceAttr(float(max_force)); d.CreateTargetPositionAttr(float(target))


def look_quat(eye, tgt):
    """USD camera looks down -Z with +Y up."""
    f = np.asarray(tgt, float) - eye; f /= np.linalg.norm(f)
    r = np.cross(f, (0, 0, 1)); r /= np.linalg.norm(r)
    u = np.cross(r, f)
    R = np.stack([r, u, -f], 1)
    return R


def add_camera(stage, path, eye_mm, tgt_mm, hfov_deg, w=1600, h=1200, note=""):
    cam = UsdGeom.Camera.Define(stage, path)
    ap = 20.955
    cam.CreateHorizontalApertureAttr(ap); cam.CreateVerticalApertureAttr(ap * h / w)
    cam.CreateFocalLengthAttr(ap / (2 * math.tan(math.radians(hfov_deg) / 2)))
    cam.CreateClippingRangeAttr(Gf.Vec2f(0.01, 100.0))
    Mx = np.eye(4); Mx[:3, :3] = look_quat(np.array(eye_mm, float), tgt_mm); Mx[:3, 3] = np.array(eye_mm, float) * MM
    UsdGeom.Xformable(cam).AddTransformOp().Set(gf_mat(Mx))
    if note:
        cam.GetPrim().SetCustomDataByKey("tc:note", note)
    return cam


def fixed_base_articulation(stage, root, node, objs, mats, cfg):
    name, jt, axis, lim, pivot = ART[node]
    sel = [o for o in objs if o["node"] == node]
    if not sel:
        return None
    if pivot is None:
        if node == "run_door":
            x0, x1, z0, z1, y = RC.gate_geom(); pivot = (x0 - 25, y, 0.0)
        else:
            V = np.concatenate([o["V"] for o in sel]); pivot = V.mean(0)
    pivot = np.asarray(pivot, float)
    ar = UsdGeom.Xform.Define(stage, f"{root}/{name}")
    UsdPhysics.ArticulationRootAPI.Apply(ar.GetPrim())
    base = UsdGeom.Xform.Define(stage, f"{root}/{name}/Anchor")
    base.AddTranslateOp().Set(Gf.Vec3d(*(pivot * MM)))
    rigid(base.GetPrim(), mass=1.0)
    fj = UsdPhysics.FixedJoint.Define(stage, f"{root}/{name}/Anchor/RootJoint")
    fj.CreateBody1Rel().SetTargets([base.GetPath()])
    fj.CreateLocalPos0Attr(Gf.Vec3f(*(pivot * MM))); fj.CreateLocalPos1Attr(Gf.Vec3f(0, 0, 0))
    link = UsdGeom.Xform.Define(stage, f"{root}/{name}/Link")
    link.AddTranslateOp().Set(Gf.Vec3d(*(pivot * MM)))
    mass = 0.75 if node == "pop_door" else 0.3 if node == "act_rod" else 4.0
    rigid(link.GetPrim(), mass=mass)
    for i, o in enumerate(sel):
        m = add_mesh(stage, f"{root}/{name}/Link/geom_{i}", (o["V"] - pivot) * MM, o["F"], o["color"], o["alpha"], mats[(o["layer"], o["alpha"])])
        if o["layer"] not in VISUAL_ONLY:
            collider(m.GetPrim(), "convexHull")
    if jt == "prismatic":
        j = UsdPhysics.PrismaticJoint.Define(stage, f"{root}/{name}/Joint")
        j.CreateLowerLimitAttr(lim[0]); j.CreateUpperLimitAttr(lim[1])
        drive(j.GetPrim(), "linear", 2000.0, 200.0, 60.0 if node == "pop_door" else 150.0)
    else:
        j = UsdPhysics.RevoluteJoint.Define(stage, f"{root}/{name}/Joint")
        j.CreateLowerLimitAttr(lim[0]); j.CreateUpperLimitAttr(lim[1])
        drive(j.GetPrim(), "angular", 50.0, 10.0, 200.0)
    j.CreateAxisAttr(axis)
    j.CreateBody0Rel().SetTargets([base.GetPath()]); j.CreateBody1Rel().SetTargets([link.GetPath()])
    j.CreateLocalPos0Attr(Gf.Vec3f(0, 0, 0)); j.CreateLocalPos1Attr(Gf.Vec3f(0, 0, 0))
    j.GetPrim().SetCustomDataByKey("tc:firmware", "door_logic.cpp states: closed=0, open=DOOR_LIFT; E-STOP holds position" if node == "pop_door" else "")
    return ar


def so101_articulation(stage, cfg, mats, egg_mat):
    m = so101.model()
    meshes = arm.link_meshes()
    if cfg == "plus":
        base_mm, yaw = np.array(P.PLUS_BASE), 0.0
    else:
        base_mm, yaw = np.array([P.NB_CX, arm.pro_carriage_for_egg(anim.PICK_EGG[1]), P.ARM_BASE_Z]), 0.0
    B = so101.mount_tf(base_mm, yaw_deg=yaw, inverted=True)
    L = m.fk({}, B)
    root = "/World/Robot/SO101"
    ar = UsdGeom.Xform.Define(stage, root)
    UsdPhysics.ArticulationRootAPI.Apply(ar.GetPrim())
    ar.GetPrim().SetCustomDataByKey("tc:source", "TheRobotStudio/SO-ARM100 Simulation/SO101/so101_new_calib.urdf (Apache-2.0), meshes decimated")
    if cfg == "pro":
        car = UsdGeom.Xform.Define(stage, f"{root}/gantry_carriage")
        car.AddTranslateOp().Set(Gf.Vec3d(*(base_mm * MM)))
        rigid(car.GetPrim(), mass=0.8)
        add_mesh(stage, f"{root}/gantry_carriage/plate", np.array([[-.06, -.06, 0], [.06, -.06, 0], [.06, .06, 0], [-.06, .06, 0]]) + [0, 0, 0.02],
                 [[0, 1, 2], [0, 2, 3]], P.COLORS_SC["metal"])
        anchor = UsdGeom.Xform.Define(stage, f"{root}/gantry_anchor")
        anchor.AddTranslateOp().Set(Gf.Vec3d(*(base_mm * MM)))
        rigid(anchor.GetPrim(), mass=2.0)
        fj = UsdPhysics.FixedJoint.Define(stage, f"{root}/gantry_anchor/RootJoint")
        fj.CreateBody1Rel().SetTargets([anchor.GetPath()]); fj.CreateLocalPos0Attr(Gf.Vec3f(*(base_mm * MM)))
        pj = UsdPhysics.PrismaticJoint.Define(stage, f"{root}/joints/gantry_y")
        pj.CreateAxisAttr("Y")
        pj.CreateLowerLimitAttr((P.PRO_RAIL_Y[0] - base_mm[1]) * MM); pj.CreateUpperLimitAttr((P.PRO_RAIL_Y[1] - base_mm[1]) * MM)
        pj.CreateBody0Rel().SetTargets([anchor.GetPath()]); pj.CreateBody1Rel().SetTargets([car.GetPath()])
        drive(pj.GetPrim(), "linear", 5000.0, 500.0, 200.0)
        parent_of_base = car.GetPath()
    links = {}
    for ln, T in L.items():
        x = UsdGeom.Xform.Define(stage, f"{root}/{ln}")
        x.AddTransformOp().Set(gf_mat(T))
        mass = max(m.links[ln]["mass"], 0.005)
        rigid(x.GetPrim(), mass=mass)
        links[ln] = x
        if ln in meshes:
            V, F = meshes[ln]
            vm = add_mesh(stage, f"{root}/{ln}/visual", V, F, P.COLORS_SC["arm"], 1.0, mats[("arm", 1.0)])
            col = add_mesh(stage, f"{root}/{ln}/collision", V, F, P.COLORS_SC["arm"])
            UsdGeom.Imageable(col).CreatePurposeAttr("guide")
            collider(col.GetPrim(), "convexHull")
    # root fixed joint
    fj = UsdPhysics.FixedJoint.Define(stage, f"{root}/joints/root_joint")
    if cfg == "pro":
        fj.CreateBody0Rel().SetTargets([parent_of_base])
        fj.CreateLocalPos0Attr(Gf.Vec3f(0, 0, 0)); fj.CreateLocalRot0Attr(quat_wxyz(B[:3, :3]))
    else:
        fj.CreateLocalPos0Attr(Gf.Vec3f(*(B[:3, 3]))); fj.CreateLocalRot0Attr(quat_wxyz(B[:3, :3]))
    fj.CreateBody1Rel().SetTargets([links["base_link"].GetPath()])
    for jn, j in m.joints.items():
        if j["type"] == "fixed":
            uj = UsdPhysics.FixedJoint.Define(stage, f"{root}/joints/{jn}")
        else:
            uj = UsdPhysics.RevoluteJoint.Define(stage, f"{root}/joints/{jn}")
            uj.CreateAxisAttr("Z")
            lo, hi = j["limit"]
            uj.CreateLowerLimitAttr(math.degrees(lo)); uj.CreateUpperLimitAttr(math.degrees(hi))
            # STS3215 12 V: ~2.9 N.m stall; drive gains in N.m/deg (PhysX angular drive units)
            drive(uj.GetPrim(), "angular", 17.8 if jn != "gripper" else 5.0, 0.6, 2.9 if jn != "gripper" else 0.3)
            uj.GetPrim().SetCustomDataByKey("tc:note", "gripper max force capped ~0.3 N.m = ~6 N at the jaw (egg break 34 N)" if jn == "gripper" else "")
        uj.CreateBody0Rel().SetTargets([links[j["parent"]].GetPath()]); uj.CreateBody1Rel().SetTargets([links[j["child"]].GetPath()])
        T = j["T"]
        uj.CreateLocalPos0Attr(Gf.Vec3f(*map(float, T[:3, 3]))); uj.CreateLocalRot0Attr(quat_wxyz(T[:3, :3]))
        uj.CreateLocalPos1Attr(Gf.Vec3f(0, 0, 0)); uj.CreateLocalRot1Attr(Gf.Quatf(1, 0, 0, 0))
    return ar


def starter_articulation(stage, objs, mats):
    root = "/World/Robot/StarterPicker"
    ar = UsdGeom.Xform.Define(stage, root)
    UsdPhysics.ArticulationRootAPI.Apply(ar.GetPrim())
    anchor = UsdGeom.Xform.Define(stage, f"{root}/rail"); rigid(anchor.GetPrim(), mass=2.0)
    fj = UsdPhysics.FixedJoint.Define(stage, f"{root}/rail/RootJoint"); fj.CreateBody1Rel().SetTargets([anchor.GetPath()])
    for i, o in enumerate([o for o in objs if o["name"].startswith("static") and o["layer"] == "rail" and o["step"] == 10]):
        add_mesh(stage, f"{root}/rail/geom_{i}", o["V"] * MM, o["F"], o["color"], 1.0, mats[(o["layer"], 1.0)])
    car = UsdGeom.Xform.Define(stage, f"{root}/carriage"); rigid(car.GetPrim(), mass=0.4)
    z = UsdGeom.Xform.Define(stage, f"{root}/plunger"); rigid(z.GetPrim(), mass=0.25)
    for node, x in (("st_car", car), ("st_z", z)):
        for i, o in enumerate([o for o in objs if o["node"] == node]):
            add_mesh(stage, f"{x.GetPath()}/geom_{i}", o["V"] * MM, o["F"], o["color"], 1.0, mats[(o["layer"], 1.0)])
    jy = UsdPhysics.PrismaticJoint.Define(stage, f"{root}/joints/rail_y"); jy.CreateAxisAttr("Y")
    jy.CreateLowerLimitAttr(-0.1); jy.CreateUpperLimitAttr((P.ST_RAIL_Y[1] - P.ST_RAIL_Y[0]) * MM)
    jy.CreateBody0Rel().SetTargets([anchor.GetPath()]); jy.CreateBody1Rel().SetTargets([car.GetPath()])
    drive(jy.GetPrim(), "linear", 3000.0, 300.0, 80.0)
    jz = UsdPhysics.PrismaticJoint.Define(stage, f"{root}/joints/plunger_z"); jz.CreateAxisAttr("Z")
    jz.CreateLowerLimitAttr(-0.05); jz.CreateUpperLimitAttr(0.16)
    jz.CreateBody0Rel().SetTargets([car.GetPath()]); jz.CreateBody1Rel().SetTargets([z.GetPath()])
    drive(jz.GetPrim(), "linear", 3000.0, 300.0, 80.0)
    z.GetPrim().SetCustomDataByKey("tc:suction", "20 mm bellows cup at -20 kPa: use isaacsim.robot.surface_gripper (Surface Gripper) on this body")
    return ar


def export(cfg, out_dir):
    os.makedirs(out_dir, exist_ok=True)
    path = os.path.join(out_dir, f"CT_COOP_A_sim_{cfg}.usd")
    stage = Usd.Stage.CreateNew(path)
    UsdGeom.SetStageUpAxis(stage, UsdGeom.Tokens.z); UsdGeom.SetStageMetersPerUnit(stage, 1.0)
    world = UsdGeom.Xform.Define(stage, "/World"); stage.SetDefaultPrim(world.GetPrim())
    world.GetPrim().SetCustomDataByKey("tc:config", cfg)
    world.GetPrim().SetCustomDataByKey("tc:source", "TenderCells cad/chicken-tender-coop/showcase/export_usd.py (PR #189)")
    ps = UsdPhysics.Scene.Define(stage, "/World/PhysicsScene")
    ps.CreateGravityDirectionAttr(Gf.Vec3f(0, 0, -1)); ps.CreateGravityMagnitudeAttr(9.81)
    UsdLux.DistantLight.Define(stage, "/World/Lights/Sun").CreateIntensityAttr(3000)
    UsdLux.DomeLight.Define(stage, "/World/Lights/Dome").CreateIntensityAttr(600)
    gp = UsdGeom.Mesh.Define(stage, "/World/GroundPlane")
    g = 15.0
    gp.CreatePointsAttr([(-g, -g, 0), (g, -g, 0), (g, g, 0), (-g, g, 0)]); gp.CreateFaceVertexCountsAttr([4]); gp.CreateFaceVertexIndicesAttr([0, 1, 2, 3])
    gp.CreateDisplayColorAttr([Gf.Vec3f(0.55, 0.6, 0.48)]); collider(gp.GetPrim(), "none")
    ground_mat = phys_material(stage, "/World/PhysicsMaterials/ground", 0.8, 0.7, 0.0)
    UsdShade.MaterialBindingAPI.Apply(gp.GetPrim()).Bind(ground_mat, UsdShade.Tokens.weakerThanDescendants, "physics")
    egg_mat = phys_material(stage, "/World/PhysicsMaterials/egg_shell", 0.6, 0.5, 0.05)
    objs = scene.build_objects(cfg)
    mats = {}
    for o in objs:
        key = (o["layer"], o["alpha"])
        if key not in mats:
            mats[key] = material(stage, f"{o['layer']}_{int(o['alpha'] * 100)}", o["color"], o["alpha"])
    if ("arm", 1.0) not in mats:
        mats[("arm", 1.0)] = material(stage, "arm_100", P.COLORS_SC["arm"], 1.0)
    # static coop (no hens, no animated nodes, no arm links)
    k = 0
    for o in objs:
        if o["node"] != "static":
            continue
        name = f"/World/Coop/Static/s{o['step']:02d}_{o['layer']}_{k:03d}"; k += 1
        msh = add_mesh(stage, name, o["V"] * MM, o["F"], o["color"], o["alpha"], mats[(o["layer"], o["alpha"])])
        msh.GetPrim().SetCustomDataByKey("tc:parts", "; ".join(o["parts"][:30]))
        if o["layer"] not in VISUAL_ONLY and o["layer"] != "chainlink":
            collider(msh.GetPrim(), "none")
    # chain-link colliders as thin boxes (visual strips above carry no collision)
    for i, (nm, ax, c, u, z, node) in enumerate(RC.fabric_rects()):
        cube = UsdGeom.Cube.Define(stage, f"/World/Coop/Colliders/chainlink_{i}")
        sx, sy = (0.003, (u[1] - u[0]) * MM) if ax == "x" else ((u[1] - u[0]) * MM, 0.003)
        cx, cy = (c * MM, (u[0] + u[1]) / 2 * MM) if ax == "x" else ((u[0] + u[1]) / 2 * MM, c * MM)
        cube.CreateSizeAttr(1.0)
        xf = UsdGeom.Xformable(cube); xf.AddTranslateOp().Set(Gf.Vec3d(cx, cy, (z[0] + z[1]) / 2 * MM))
        xf.AddScaleOp().Set(Gf.Vec3f(sx, sy, (z[1] - z[0]) * MM))
        UsdGeom.Imageable(cube).CreatePurposeAttr("guide")
        UsdPhysics.CollisionAPI.Apply(cube.GetPrim())
        cube.GetPrim().SetCustomDataByKey("tc:what", f"chain-link fabric collider: {nm}")
    # articulated doors
    for node in ("pop_door", "act_rod", "cleanout", "run_door", "nest_lid", "hood_door"):
        fixed_base_articulation(stage, "/World/Coop/Articulations", node, objs, mats, cfg)
    # robot
    if cfg in ("plus", "pro"):
        so101_articulation(stage, cfg, mats, egg_mat)
    elif cfg == "starter":
        starter_articulation(stage, objs, mats)
    # eggs (rigid, randomisable) + slots
    import trimesh
    em = trimesh.creation.icosphere(subdivisions=2)
    EV = np.asarray(em.vertices) * np.array([P.EGG_D / 2, P.EGG_L / 2, P.EGG_D / 2]) * MM
    for e in M.egg_positions():
        x = UsdGeom.Xform.Define(stage, f"/World/Markers/EggSlots/{e['id']}")
        x.AddTranslateOp().Set(Gf.Vec3d(*(np.array(e["pos"]) * MM)))
    for sid in M.SHOW_EGGS:
        pos = [e for e in M.egg_positions() if e["id"] == sid][0]["pos"]
        x = UsdGeom.Xform.Define(stage, f"/World/Eggs/Egg_{sid}")
        x.AddTranslateOp().Set(Gf.Vec3d(*(np.array(pos) * MM + [0, 0, 0.002])))
        x.AddOrientOp().Set(Gf.Quatf(1, 0, 0, 0))
        rigid(x.GetPrim(), mass=P.EGG_MASS_G[1] / 1000)
        msh = add_mesh(stage, f"/World/Eggs/Egg_{sid}/shell", EV, em.faces, P.COLORS_SC["egg"])
        collider(msh.GetPrim(), "convexHull")
        UsdShade.MaterialBindingAPI.Apply(msh.GetPrim()).Bind(egg_mat, UsdShade.Tokens.weakerThanDescendants, "physics")
        pr = x.GetPrim()
        pr.CreateAttribute("tc:randomize_xy_mm", Sdf.ValueTypeNames.Float).Set(60.0)
        pr.CreateAttribute("tc:randomize_yaw_deg", Sdf.ValueTypeNames.Float).Set(180.0)
        pr.CreateAttribute("tc:mass_range_g", Sdf.ValueTypeNames.Float2).Set(Gf.Vec2f(*P.EGG_MASS_G[::2]))
        pr.CreateAttribute("tc:slot", Sdf.ValueTypeNames.String).Set(sid)
    # basket + tag markers
    if cfg != "base":
        bx, by = P.BASKET_PLUS if cfg in ("plus", "pro") else P.BASKET_RAIL
        xb = UsdGeom.Xform.Define(stage, "/World/Markers/Basket"); xb.AddTranslateOp().Set(Gf.Vec3d(bx * MM, by * MM, P.BASKET_FLOOR_Z * MM))
        tag = UsdGeom.Xform.Define(stage, "/World/Markers/AprilTag")
        tag.GetPrim().SetCustomDataByKey("tc:apriltag", f"{P.APRILTAG['family']} id {P.APRILTAG['id']}, {P.APRILTAG['size_mm']} mm, on the tray rim facing the arm/bay camera")
        off = (P.BASKET_IN[1] / 2 + 4, 0) if cfg in ("plus", "pro") else (0, P.BASKET_IN[1] / 2 + 4)
        tag.AddTranslateOp().Set(Gf.Vec3d((bx + off[0]) * MM, (by + off[1]) * MM, (P.BASKET_FLOOR_Z + 30) * MM))
    # cameras (XIAO ESP32-S3 Sense OV2640 ~66 deg HFOV, ASSUMED lens)
    cam_y = P.COOP_Y0 + 230
    add_camera(stage, "/World/Sensors/CoopCam_XIAO", (45, cam_y, P.CAM_Z), (P.XC, (P.COOP_Y0 + P.COOP_Y1) / 2 + 150, P.ROOST_TOP_Z - 250), 66,
               note="XIAO ESP32-S3 Sense camera node, front-left upper corner (guide s7), aimed at the roost + pop door")
    if cfg != "base":
        add_camera(stage, "/World/Sensors/BayCam_XIAO", (P.HOOD_X1 - 40, P.HOOD_Y0 + 40, P.HOOD_ROOF_Z - 30), (P.NB_CX, P.NB_DIV_Y, P.NEST_FLOOR_Z), 66,
                   note="egg-bay XIAO ESP32-S3 Sense (showcase addition): nests + tray + AprilTag")
    add_camera(stage, "/World/Sensors/OverviewCam", (3600, 150, 2500), (650, 2650, 850), 50, note="smoke-test screenshot camera")
    # collision groups: doors/gate/lid move freely in their guides (they still hit eggs, hens and the robot)
    g_static = UsdPhysics.CollisionGroup.Define(stage, "/World/CollisionGroups/CoopStatic")
    Usd.CollectionAPI.Apply(g_static.GetPrim(), "colliders").CreateIncludesRel().SetTargets(
        [Sdf.Path("/World/Coop/Static"), Sdf.Path("/World/Coop/Colliders")])
    g_doors = UsdPhysics.CollisionGroup.Define(stage, "/World/CollisionGroups/Doors")
    Usd.CollectionAPI.Apply(g_doors.GetPrim(), "colliders").CreateIncludesRel().SetTargets([Sdf.Path("/World/Coop/Articulations")])
    g_doors.CreateFilteredGroupsRel().SetTargets([g_static.GetPath()])
    for p in ("/World/Robot/SO101", "/World/Robot/StarterPicker"):
        pr = stage.GetPrimAtPath(p)
        if pr.IsValid():
            pr.AddAppliedSchema("PhysxArticulationAPI")
            pr.CreateAttribute("physxArticulation:enabledSelfCollisions", Sdf.ValueTypeNames.Bool).Set(False)
            pr.CreateAttribute("physxArticulation:solverPositionIterationCount", Sdf.ValueTypeNames.Int).Set(32)
    stage.GetRootLayer().Save()
    return path


if __name__ == "__main__":
    out = sys.argv[2] if len(sys.argv) > 2 else "/workspace/work/coop-showcase/usd"
    for cfg in sys.argv[1].split(","):
        p = export(cfg, out)
        print(cfg, p, round(os.path.getsize(p) / 1e6, 2), "MB")
