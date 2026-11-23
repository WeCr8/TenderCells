"""Open the Chicken Tender coop in Isaac Sim (GUI).

Inside a running Isaac Sim (Script Editor, or `./isaac-sim.sh --exec "<repo>/sim/isaac/load_coop.py --config plus"`):
    opens sim/isaac/usd/CT_COOP_A_sim_<config>.usd in the current Kit app.
Standalone (`./python.sh <repo>/sim/isaac/load_coop.py --config plus [--headless]`):
    starts its own SimulationApp, opens the stage and keeps it open (Ctrl+C / close the window to quit).
"""
import argparse
import os
import sys

HERE = os.path.dirname(os.path.abspath(__file__))
ap = argparse.ArgumentParser()
ap.add_argument("--config", default="plus", choices=["base", "starter", "plus", "pro"])
ap.add_argument("--usd", default=None)
ap.add_argument("--headless", action="store_true")
args, _ = ap.parse_known_args(sys.argv[1:])
usd = os.path.abspath(args.usd or os.path.join(HERE, "usd", f"CT_COOP_A_sim_{args.config}.usd"))

try:                                    # already inside Kit (--exec / Script Editor)
    import omni.usd
    in_kit = True
except ImportError:
    in_kit = False

if in_kit:
    omni.usd.get_context().open_stage(usd)
    print(f"[tc] opened {usd}")
else:
    try:
        from isaacsim import SimulationApp
    except ImportError:
        from omni.isaac.kit import SimulationApp
    app = SimulationApp({"headless": args.headless})
    import omni.usd  # noqa: E402
    omni.usd.get_context().open_stage(usd)
    print(f"[tc] opened {usd}; press Play to start physics", flush=True)
    while app.is_running():
        app.update()
    app.close()
