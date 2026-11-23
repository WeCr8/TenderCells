"""Headless smoke test for the Chicken Tender coop USD in Isaac Sim 5.x (falls back to 4.5 / 4.2 module names).

    ./python.sh <repo>/sim/isaac/smoke_test.py --usd <repo>/sim/isaac/usd/CT_COOP_A_sim_plus.usd \
        --out /tmp/tc_smoke.png

What it does: opens the stage, starts physics, steps 300 frames while it commands the pop door open
(prismatic joint to DOOR_LIFT) and closed again, checks the eggs stay on their pads, checks the SO-101 (if
present) has 6 DOF, saves a screenshot from /World/Sensors/OverviewCam and prints PASS or FAIL (exit 0 / 1).
Self-contained: no network, no credentials.
"""
import argparse
import os
import sys

ap = argparse.ArgumentParser()
ap.add_argument("--usd", required=True)
ap.add_argument("--out", default="tc_smoke.png")
ap.add_argument("--frames", type=int, default=300)
ap.add_argument("--gui", action="store_true")
args, _ = ap.parse_known_args()

try:                                    # Isaac Sim 4.5+ / 5.x
    from isaacsim import SimulationApp
except ImportError:                     # Isaac Sim <= 4.2
    from omni.isaac.kit import SimulationApp

app = SimulationApp({"headless": not args.gui, "width": 1280, "height": 720})

import numpy as np  # noqa: E402

try:
    from isaacsim.core.api import World
    from isaacsim.core.prims import SingleArticulation
    from isaacsim.core.utils.stage import open_stage
    from isaacsim.core.utils.types import ArticulationAction
except ImportError:                     # 4.2 fallback
    from omni.isaac.core import World
    from omni.isaac.core.articulations import Articulation as SingleArticulation
    from omni.isaac.core.utils.stage import open_stage
    from omni.isaac.core.utils.types import ArticulationAction
import omni.usd  # noqa: E402
from pxr import UsdGeom  # noqa: E402

DOOR = "/World/Coop/Articulations/PopDoor"
LIFT = 0.280                            # m, hw.yaml door.travel_mm
results = {}


def fail(msg):
    print(f"[tc-smoke] FAIL: {msg}", flush=True)
    results.setdefault("fail", []).append(msg)


usd = os.path.abspath(args.usd)
if not os.path.exists(usd):
    print(f"[tc-smoke] FAIL: missing {usd}")
    app.close(); sys.exit(1)
open_stage(usd)
for _ in range(10):
    app.update()
stage = omni.usd.get_context().get_stage()
world = World(stage_units_in_meters=1.0, physics_dt=1 / 60, rendering_dt=1 / 60)

door = SingleArticulation(prim_path=DOOR, name="pop_door")
robot = None
if stage.GetPrimAtPath("/World/Robot/SO101").IsValid():
    robot = SingleArticulation(prim_path="/World/Robot/SO101", name="so101")
world.reset()
door.initialize()
print(f"[tc-smoke] door dof names: {door.dof_names}", flush=True)
if robot is not None:
    robot.initialize()
    print(f"[tc-smoke] SO-101 dof ({robot.num_dof}): {robot.dof_names}", flush=True)
    if robot.num_dof < 6:
        fail(f"SO-101 has {robot.num_dof} DOF, expected 6 (5 arm + gripper)")

eggs = [p for p in stage.Traverse() if p.GetPath().pathString.startswith("/World/Eggs/Egg_") and p.GetPath().pathString.count("/") == 3]
def egg_z():
    out = []
    for p in eggs:
        m = UsdGeom.Xformable(p).ComputeLocalToWorldTransform(0)
        out.append(m.ExtractTranslation()[2])
    return out
z0 = egg_z()

n = args.frames
peak, final = 0.0, None
for i in range(n):
    target = LIFT if i < n // 2 else 0.0
    door.apply_action(ArticulationAction(joint_positions=np.array([target])))
    world.step(render=True)
    q = float(door.get_joint_positions()[0])
    peak = max(peak, q)
    final = q
results["door_peak_m"] = round(peak, 4)
results["door_final_m"] = round(final, 4)
if peak < 0.9 * LIFT:
    fail(f"door only opened to {peak:.3f} m (target {LIFT})")
if final > 0.02:
    fail(f"door did not close: {final:.3f} m")
z1 = egg_z()
for a, b, p in zip(z0, z1, eggs):
    if b < a - 0.02:
        fail(f"{p.GetName()} fell {a - b:.3f} m (through the nest pad?)")
results["eggs_dz_m"] = [round(b - a, 4) for a, b in zip(z0, z1)]

# screenshot
try:
    try:
        from isaacsim.sensors.camera import Camera
    except ImportError:
        from omni.isaac.sensor import Camera
    cam = Camera(prim_path="/World/Sensors/OverviewCam", resolution=(1280, 720))
    cam.initialize()
    for _ in range(20):
        world.step(render=True)
    rgba = cam.get_rgba()
    if rgba is None or getattr(rgba, "size", 0) == 0:
        raise RuntimeError("empty frame")
    from PIL import Image
    Image.fromarray(np.asarray(rgba)[..., :3].astype(np.uint8)).save(args.out)
    results["screenshot"] = os.path.abspath(args.out)
except Exception as e:  # screenshot is informative, not a pass/fail gate
    print(f"[tc-smoke] screenshot skipped: {e}", flush=True)

print(f"[tc-smoke] results: {results}", flush=True)
ok = not results.get("fail")
print("[tc-smoke] PASS" if ok else "[tc-smoke] FAIL", flush=True)
app.close()
sys.exit(0 if ok else 1)
