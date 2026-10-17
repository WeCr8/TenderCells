# ct72 – Chicken Tender 72x72 cell controller (rev A1.2)

This package runs on the Pi 5 (Plus), the Jetson (Pro) or the Pi Zero 2 W (Starter, scripted only). Everything also runs in simulation (`SimGantry`, `SimCellIO`, `SimTool`), so no hardware is needed for that.

| Module | What it does |
|---|---|
| `cell.py` | Loads `ct72_cell_a12.json`, written by the CAD (`hardware/ct72-cell/cad/export_cell_json.py`): nest boxes, basket, offline-checked TOP/SIDE approaches, and exact gantry no-go zones |
| `gantry.py` | Klipper (Moonraker) or sim belt gantry: absolute moves, zone guard, park, timestamped position history |
| `roost.py` | Roost bars via the XIAO cell-IO node. The node checks load + limits + current; the host adds the camera occupancy check and the parked-gantry check |
| `routines.py` | EGG COLLECTION and CLEANING state machines: preflight (E-stop, homed, schedule window, flock out), retract roosts, open lids, per box detect -> TOP/SIDE choice -> pick -> place in basket -> count, close, park, redeploy, and abort-to-park |
| `egg_detect.py` | Scripted egg detector (ellipse filter + homography from the basket AprilTag) |
| `so101_limits.py` | Servo-bus budget, per-joint torque caps, 6 N fingertip grip cap |
| `timing.py`, `timestamp_audit.py`, `jitter_augment.py` | Capture-time stamps + per-sample clock offset, the 60 s audit gate (`python -m ct72.timestamp_audit --simulate`), and measured jitter fed into sim |

LeRobot plugins live in `../lerobot_ct72` (`pip install -e firmware/jetson-nano/lerobot_ct72` next to `pip install "lerobot[feetech,smolvla]"`). Run `scripts/record_ct72.sh` (audit-gated), `train_act_local.sh` / `train_smolvla_local.sh` (local GPU, no hub push, no W&B), then `infer_ct72.sh`.

Tests: `python -m pytest -q tests/test_ct72_*.py`. Hardware bring-up checklists are in `firmware/ct72-cell-io/README.md` and `hardware/ct72-cell/ASSEMBLY_A1.2.md`.
