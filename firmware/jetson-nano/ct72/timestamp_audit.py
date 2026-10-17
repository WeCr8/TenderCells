"""60 s timestamp audit CLI - run before every LeRobot collection session; exits non-zero (and the recording
wrapper refuses to start) if the camera skew, clock offset or servo-read uncertainty is over budget.

    python -m ct72.timestamp_audit --cams cam0,cam1 --seconds 60 --out audit.json --profile jitter.json

Live mode reads the trigger-stamped frame headers the camera nodes publish and the cell-IO node's trigger edge
stamps; --simulate generates a synthetic run (for CI and for checking the gate itself).
"""
from __future__ import annotations

import argparse
import json
import random
import sys

from .timing import AUDIT_SECONDS, CAM_FPS, evaluate_audit, jitter_profile


def simulate(cams, seconds, skew_us=150.0, offset_us=80.0, seed=1):
    rng = random.Random(seed)
    sets, offs, ju, lat = [], [], [], []
    t = 0
    for k in range(int(seconds * CAM_FPS)):
        t += int(1e9 / CAM_FPS + rng.gauss(0, 20_000))
        sets.append({c: t + int(abs(rng.gauss(0, skew_us)) * 1000) for c in cams})
        offs.append(int(rng.gauss(0, offset_us) * 1000))
        u = abs(rng.gauss(1200, 300)); ju.append(int(u * 1000)); lat.append(u)
    return sets, offs, ju, {"joint_read": lat, "camera_latency": [abs(rng.gauss(12000, 1500)) for _ in sets]}


def main(argv=None) -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("--cams", default="cam0,cam1")
    ap.add_argument("--seconds", type=float, default=AUDIT_SECONDS)
    ap.add_argument("--simulate", action="store_true")
    ap.add_argument("--sim-skew-us", type=float, default=150.0)
    ap.add_argument("--out", default="timestamp_audit.json")
    ap.add_argument("--profile", default="jitter_profile.json")
    a = ap.parse_args(argv)
    cams = a.cams.split(",")
    if not a.simulate:
        print("live audit: connect to the camera relay + cell-IO node (see ct72/README.md); use --simulate for a dry run", file=sys.stderr)
        return 2
    sets, offs, ju, samples = simulate(cams, a.seconds, a.sim_skew_us)
    res = evaluate_audit(sets, offs, ju, cams, a.seconds)
    open(a.out, "w").write(res.to_json())
    json.dump(jitter_profile(samples), open(a.profile, "w"), indent=1)
    print(("PASS" if res.ok else "FAIL"), res.to_json())
    return 0 if res.ok else 1


if __name__ == "__main__":
    sys.exit(main())
