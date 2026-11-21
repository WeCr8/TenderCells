# Chicken Tender in NVIDIA Isaac Sim / Isaac Lab

Copy-paste run steps for the GPU desktop: **[RUN_ON_WCR8.md](./RUN_ON_WCR8.md)**. Targets Isaac Sim 5.x / Isaac Lab 2.x, with 4.5 fallbacks.
None of this runs in the cloud sandbox that built it, which has no GPU or Isaac install. The scripts were byte-compiled and the USD files were opened and checked with `pxr`. Nothing has run in Isaac yet.

## Files
| Path | What |
|---|---|
| `usd/CT_COOP_A_sim_<base,starter,plus,pro>.usd` | Full single-env scenes. Metres, Z up, `/World` default prim. Static coop, chain-link run and gable roof use triangle-mesh colliders. Chain-link uses thin-box colliders. Doors are fixed-base articulations (PopDoor prismatic 0..0.28 m; RunGate, CleanoutDoor, NestLid or HoodDoor revolute). Includes the SO-101 or Starter picker, eggs as 58 g rigid bodies, all 18 egg slots as markers, tray + AprilTag marker, and XIAO Sense cameras |
| `usd/CT_COOP_A_lab_<cfg>.usd`, `CT_SO101_follower.usd`, `CT_EGG.usd`, `CT_POPDOOR.usd`, `tc_layout.json` | Isaac Lab assets. Nothing is pinned to world coordinates, so they clone safely to N envs |
| `load_coop.py` | Opens a scene in the GUI (`isaac-sim.sh --exec` or `python.sh`) |
| `smoke_test.py` | Headless: 300 frames, door cycle, egg and DOF checks, screenshot, PASS/FAIL |
| `tendercells_isaaclab/` | pip-installable task package: `TenderCells-EggPick-SO101-v0`, `-Pro-v0`, `TenderCells-DoorCycle-v0` + RSL-RL PPO configs |
| `scripts/rsl_rl.py` | Runs Isaac Lab's own RSL-RL train/play scripts with our tasks registered |
| `scripts/record_lerobot_sim.py` | Teleop the sim follower with the real SO-101 leader arm and record LeRobot episodes |

The USD is regenerated from the parametric model with `cad/chicken-tender-coop/showcase/export_usd.py <cfgs> sim/isaac/usd` and `export_usd_lab.py sim/isaac/usd`.

## SO-101 source and licence
Kinematics, joint limits, masses and meshes come from TheRobotStudio/SO-ARM100 `Simulation/SO101/so101_new_calib.urdf`, under the **Apache-2.0** licence (`cad/chicken-tender-coop/showcase/third_party/SO-ARM100_LICENSE`). The meshes are decimated, and the full-resolution STLs stay upstream. For best fidelity, import the URDF with Isaac's URDF importer and swap it in.

## Tasks
**Egg pick-and-place (SO-101).**
- Observations: joint positions and velocities, egg position in the robot frame, gripper-to-egg vector, tray position, last action.
- Reward, in order: reach the egg (tanh, 5 cm), lift it more than 40 mm (+5), carry it to the tray (tanh, +10), place it on the tray slowly (+25). Penalties: egg speed above 0.4 m/s (rough handling), action rate, joint velocity.
- Resets: scene to default; egg in a random slot ±60 mm with random yaw; arm in the park pose ±0.05 rad.
- Domain randomisation: egg mass 50-70 g, shell friction 0.4-0.8. Knobs to add next: lighting, camera pose ±2 cm / ±3°, nest-pad friction, servo gains ±20 %, latency of 1-3 control steps.

**Door cycle.**
- The door tracks a scheduled open/close target, standing in for the firmware schedule.
- It is penalised for pushing the door down, because the cord can only pull up.
- Door mass is randomised 0.6-0.9 kg (dry to wet plywood).
- The actuator is capped at about 60 N (the force at the DRV8874's 2 A current limit) and 44 mm/s.

## LeRobot data, policies, sim-to-real
1. Calibrate the real SO-101 leader and follower (`lerobot-calibrate`). Joint zeros must match the URDF's calibrated mid-pose.
2. Collect sim demonstrations with `scripts/record_lerobot_sim.py --leader-port <port>`. You move the real leader and the sim follower copies you.
3. Collect real demonstrations in the egg bay with `lerobot-record`, using the so101_follower robot and the so101_leader teleop.
4. Train with `lerobot-train --policy.type=act` (or `diffusion`) on the mixed dataset. Evaluate in sim first, then on the real arm with the 6 N gripper cap.
5. Close the gap between sim and the real coop:
   - Measure egg slip and servo lag on the real arm and feed them into the randomisation ranges.
   - Keep the AprilTag on the tray for camera-to-arm registration.
   - Never run the arm while a hen is in the bay (camera check + hood door interlock).
