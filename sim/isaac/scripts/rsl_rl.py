"""Run Isaac Lab's own RSL-RL train/play scripts with the TenderCells tasks registered.

    ./isaaclab.sh -p <repo>/sim/isaac/scripts/rsl_rl.py train --task TenderCells-EggPick-SO101-v0 --headless --num_envs 256
    ./isaaclab.sh -p <repo>/sim/isaac/scripts/rsl_rl.py play  --task TenderCells-EggPick-SO101-v0 --num_envs 8

Needs: `./isaaclab.sh -p -m pip install -e <repo>/sim/isaac/tendercells_isaaclab` once, and ISAACLAB_PATH
(isaaclab.sh sets it) or --isaaclab <path to the IsaacLab checkout>.
"""
import os
import runpy
import sys

mode = sys.argv[1] if len(sys.argv) > 1 and sys.argv[1] in ("train", "play") else "train"
argv = [a for a in sys.argv[1:] if a not in ("train", "play")]
lab = os.environ.get("ISAACLAB_PATH")
if "--isaaclab" in argv:
    i = argv.index("--isaaclab"); lab = argv[i + 1]; del argv[i:i + 2]
if not lab:
    sys.exit("Set ISAACLAB_PATH or pass --isaaclab <IsaacLab checkout>")
script = os.path.join(lab, "scripts", "reinforcement_learning", "rsl_rl", f"{mode}.py")
if not os.path.exists(script):
    sys.exit(f"not found: {script}")

sys.path.insert(0, os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "tendercells_isaaclab"))
import tendercells_isaaclab  # noqa: E402,F401  (registers the gym ids; no Isaac imports at this point)

sys.argv = [script] + argv
runpy.run_path(script, run_name="__main__")
