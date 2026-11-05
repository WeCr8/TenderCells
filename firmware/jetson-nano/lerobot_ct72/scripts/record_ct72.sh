#!/usr/bin/env bash
# Record CT72 egg-pick demos with LeRobot - REFUSES to start unless a fresh 60 s timestamp audit passes.
# Local only: dataset stays on disk (--dataset.push_to_hub=false). Run on the Pi 5 / Jetson in the cell.
set -euo pipefail
HERE="$(cd "$(dirname "$0")" && pwd)"; JN="$HERE/../.."
REPO="${REPO:-local/ct72_egg_pick}"; ROOT="${ROOT:-$HOME/ct72_datasets/ct72_egg_pick}"
EPISODES="${EPISODES:-20}"; TASK="${TASK:-pick the egg from the nest box and place it in the basket}"
cd "$JN"
python -m ct72.timestamp_audit --cams cam0_overhead,cam1_gantry --seconds 60 \
  --out "$ROOT.audit.json" --profile "$ROOT.jitter_profile.json" ${AUDIT_ARGS:-} \
  || { echo "Timestamp audit FAILED - session refused (see $ROOT.audit.json)"; exit 1; }
lerobot-record \
  --robot.type=tendercells_ct72 --robot.variant="${VARIANT:-plus}" \
  --teleop.type=tendercells_ct72_teleop \
  --dataset.repo_id="$REPO" --dataset.root="$ROOT" --dataset.push_to_hub=false \
  --dataset.num_episodes="$EPISODES" --dataset.fps=30 --dataset.single_task="$TASK" \
  --display_data=false
