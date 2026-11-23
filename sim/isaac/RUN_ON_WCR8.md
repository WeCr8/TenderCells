# Run the Chicken Tender coop in Isaac Sim on WCR8 (copy-paste)

Target: **Isaac Sim 5.x + Isaac Lab 2.x** (5.0/5.1 and Lab 2.1/2.2 tested in design, not yet on hardware).
Fallback: Isaac Sim **4.5** uses the same `isaacsim.*` module names, so every script here runs unchanged;
4.2 and older use `omni.isaac.*` (the smoke test falls back automatically; Lab needs 2.x).
Nothing here needs a password, token or network access after the clone.

## 0. Paths (edit these three lines only)

```bash
export ISAACSIM=~/isaacsim                 # folder with isaac-sim.sh and python.sh (pip install: use `isaacsim` / `python`)
export ISAACLAB_PATH=~/IsaacLab            # IsaacLab checkout with isaaclab.sh
export TC=~/src/TenderCells                # this repo
```

Windows (WCR8 native): use `isaac-sim.bat`, `python.bat`, `isaaclab.bat` and `%TC%\sim\isaac\...`; the commands are the same.

## 1. Get the branch (PR #189)

```bash
git clone https://github.com/WeCr8/TenderCells.git "$TC" 2>/dev/null || true
cd "$TC" && git fetch origin docs/chicken-tender-build-2026-11-20 && git checkout docs/chicken-tender-build-2026-11-20 && git pull
ls sim/isaac/usd        # CT_COOP_A_sim_{base,starter,plus,pro}.usd, CT_COOP_A_lab_*.usd, CT_SO101_follower.usd, CT_EGG.usd, CT_POPDOOR.usd, tc_layout.json
```

## 2. One-command scene load (GUI)

```bash
cd "$ISAACSIM"
./isaac-sim.sh --exec "$TC/sim/isaac/load_coop.py --config plus"
# or standalone:
./python.sh "$TC/sim/isaac/load_coop.py" --config plus
```
Press **Play**. Joint drives: `/World/Coop/Articulations/PopDoor/Joint` (prismatic Z, 0..0.28 m), `.../RunGate/Joint`,
`.../CleanoutDoor/Joint`, `.../HoodDoor/Joint`; arm joints under `/World/Robot/SO101/joints/`.

## 3. Headless smoke test (PASS/FAIL + screenshot)

```bash
cd "$ISAACSIM"
for c in plus pro starter base; do
  ./python.sh "$TC/sim/isaac/smoke_test.py" --usd "$TC/sim/isaac/usd/CT_COOP_A_sim_$c.usd" --out "/tmp/tc_smoke_$c.png" --frames 300 \
    || echo "SMOKE FAIL: $c"
done
```
It loads the stage, steps 300 physics frames at 60 Hz, drives the pop door to 0.28 m then back to 0, checks the door
reached >= 90 % of the lift and closed to < 20 mm, checks the eggs did not fall through the nest pads, checks the SO-101
has 6 DOF (plus/pro), saves `/tmp/tc_smoke_<cfg>.png` from `/World/Sensors/OverviewCam`, and prints
`[tc-smoke] PASS` (exit 0) or `[tc-smoke] FAIL: <reason>` (exit 1). Paste the `[tc-smoke]` lines back into the PR.

## 4. Isaac Lab tasks

```bash
cd "$ISAACLAB_PATH"
./isaaclab.sh -p -m pip install -e "$TC/sim/isaac/tendercells_isaaclab"
export TC_USD_DIR="$TC/sim/isaac/usd"
# list / sanity-check (zero actions, 16 envs)
./isaaclab.sh -p scripts/environments/zero_agent.py --task TenderCells-DoorCycle-v0 --num_envs 16 --headless \
  || ./isaaclab.sh -p "$TC/sim/isaac/scripts/rsl_rl.py" play --task TenderCells-DoorCycle-v0 --num_envs 16 --headless
# train (RSL-RL PPO)
./isaaclab.sh -p "$TC/sim/isaac/scripts/rsl_rl.py" train --task TenderCells-DoorCycle-v0 --headless --num_envs 512
./isaaclab.sh -p "$TC/sim/isaac/scripts/rsl_rl.py" train --task TenderCells-EggPick-SO101-v0 --headless --num_envs 256
./isaaclab.sh -p "$TC/sim/isaac/scripts/rsl_rl.py" train --task TenderCells-EggPick-SO101-Pro-v0 --headless --num_envs 256
# watch a checkpoint
./isaaclab.sh -p "$TC/sim/isaac/scripts/rsl_rl.py" play --task TenderCells-EggPick-SO101-v0 --num_envs 8
```
`zero_agent.py` only sees our ids if the package is imported; if it says "not found", use the `rsl_rl.py` wrapper
(it imports `tendercells_isaaclab` before handing over to Isaac Lab's own train/play scripts).
Logs land in `$ISAACLAB_PATH/logs/rsl_rl/tendercells_*`.

## 5. If something breaks (most likely first)

| Symptom | Fix |
|---|---|
| `ModuleNotFoundError: isaacsim` | run with `python.sh` (or the Isaac pip venv), not system Python |
| Door joint does not move | check `/World/Coop/Articulations/PopDoor` has ArticulationRootAPI and the drive (`drive:linear`) is set; door collisions with the coop are filtered by `/World/CollisionGroups/Doors` |
| SO-101 jitters / explodes | self-collision is off on `/World/Robot/SO101`; raise `physxArticulation:solverPositionIterationCount`, or re-import `third_party/SO101/so101_new_calib.urdf` with the Isaac URDF importer (full-resolution meshes) and replace `/World/Robot/SO101` |
| Lab: `effort_limit` deprecation warning (Lab 2.1+) | harmless; rename to `effort_limit_sim` / `velocity_limit_sim` in `egg_pick_env_cfg.py` |
| Lab: joint name not found | joint names are `shoulder_pan, shoulder_lift, elbow_flex, wrist_flex, wrist_roll, gripper` and `door_lift` |
| Screenshot skipped | the run still PASSes; on 4.5 the camera API is `isaacsim.sensors.camera`, on 4.2 `omni.isaac.sensor` |

## 6. Training prep for the gantry egg pick: NVIDIA SO-101 pipeline (Isaac Capture / Isaac Teleop)

Source (read 2026-11-21): https://nvidia.github.io/IsaacCapture/main/integrations/lerobot/index.html
Flow: teleop the SO-101 (SO-101 **leader arm** or XR controller) -> record demos in Isaac Lab **and** on the real arm
-> LeRobot datasets -> fine-tune a **GR00T N1.7** policy -> sim-to-real
(https://docs.nvidia.com/learning/physical-ai/sim-to-real-so-101/latest/index.html).

### 6.1 Version check: Isaac Lab 3.0 vs our 2.x
| | Our tasks (sections 2-4) | NVIDIA SO-101 pipeline |
|---|---|---|
| Isaac Lab | 2.x (2.1/2.2) | **3.0** (Isaac Capture docs badge) |
| OS | Windows native OK | **Ubuntu 22.04 / 24.04 only** |
| Python | Isaac Sim bundled | **3.12** |
| CUDA / driver | per Isaac Sim | CUDA **12.8+**, driver per Isaac Sim |
| Extra | none | CloudXR runtime (auto-launched by Isaac Lab, even for the leader path); `so101_leader_plugin` built **from source** |

Decision: do **not** upgrade the 2.x install in place. Install Isaac Lab 3.0 side by side in its own folder/env
(`~/IsaacLab3`) and keep `tendercells_isaaclab` on 2.x until it is ported. Porting our EggPick env cfgs to 3.0 is a
separate task; expect config/API renames (not yet checked against the 3.0 changelog).

### 6.2 What WCR8 needs
- An Ubuntu 22.04/24.04 boot (dual boot or second SSD). The pipeline is documented for Linux only, and the leader plugin
  build uses Linux tooling (`clang-format-14`, `/dev/ttyACM*`, `dialout` group). Native Windows Isaac Sim is not covered.
- NVIDIA GPU (RTX). NVIDIA's *recommended* sim-teleop workstation is a Threadripper 7960X with an RTX 6000-class GPU;
  a single consumer RTX card should run 1-env teleop but is below their recommendation (untested here).
- Internet at CMake configure time (FetchContent pulls OpenXR SDK, yaml-cpp, pybind11, FlatBuffers, MCAP); the SO-101 USDs
  stream from NVIDIA Nucleus.
- Hardware: a second SO-101 built as a **leader** (gears removed, servo ids 1-6) plus the follower. No headset needed on
  the leader path.

### 6.3 Commands (Ubuntu side, Isaac Lab 3.0)
```bash
# 1. Build the leader plugin
git clone https://github.com/NVIDIA/IsaacCapture.git && cd IsaacCapture
sudo apt-get install -y clang-format-14
cmake -B build && cmake --build build --target so101_leader_plugin && cmake --install build
./install/plugins/so101_leader/so101_leader_plugin               # no args = synthetic backend, no hardware
sudo usermod -aG dialout $USER                                    # log out/in
./install/plugins/so101_leader/so101_leader_plugin calibrate /dev/ttyACM1 so101_leader.calib

# 2. Terminal A: sim (NVIDIA reference task first, before any coop task)
cd ~/IsaacLab3
./isaaclab.sh -p scripts/environments/teleoperation/teleop_se3_agent.py \
  --task IsaacContrib-Stack-Cube-SO101-Joint-Teleop-v0 --num_envs 1 --viz kit

# 3. Terminal B: leader -> sim (collection_id must stay so101_leader). In the viewport: B start, P pause, R reset.
source ~/.cloudxr/run/cloudxr.env
./install/plugins/so101_leader/so101_leader_plugin /dev/ttyACM1 so101_leader so101_leader.calib

# 4. Record demos (HDF5)
./isaaclab.sh -p scripts/tools/record_demos.py --task IsaacContrib-Stack-Cube-SO101-Joint-Teleop-v0 \
  --dataset_file ./datasets/so101_leader_stack_demos.hdf5 --num_demos 10 --step_hz 30 --viz kit
```
Real-arm demos: follow "Data Collection in Real" (LeRobot SO-101), which writes LeRobot datasets directly.

### 6.4 Coop egg-pick plan (TODO, in order)
1. Pass 6.3 on the NVIDIA cube task (proves Ubuntu, CloudXR, plugin, calibration).
2. Port `TenderCells-EggPick-SO101-v0` to Isaac Lab 3.0 as a **joint-teleop** variant (same joint names as section 5),
   arm base at the gantry egg-pick height (z 1240, through the 12 in nest hole).
3. Record ~50 sim egg picks plus real picks on the bench nest box with the same camera poses.
4. Convert sim HDF5 to LeRobot format. **NVIDIA has not shipped this converter yet**; adapt Isaac Lab `develop`
   `scripts/imitation_learning/locomanipulation_sdg/gr00t/convert_dataset.py`.
5. Fine-tune GR00T N1.7 (NVIDIA's training guide is still marked pending), then sim-to-real per the learning path
   (domain randomisation, sim/real co-training, actuator-gap compensation).

Status per NVIDIA's own page (2026-11-21): teleop devices, real and sim collection done; sim->LeRobot export,
GR00T training guide and the Isaac Teleop sim-to-real update still pending.
