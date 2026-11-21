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
