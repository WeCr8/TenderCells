#!/usr/bin/env bash
# Run a locally trained policy on the cell (Pi 5: ACT; Jetson: ACT or SmolVLA). Evaluation episodes are recorded
# locally so every rollout keeps its timing columns. The routine controller still owns roosts, lids and E-stop.
set -euo pipefail
POLICY="${POLICY:-$HOME/ct72_runs/act_egg_pick/checkpoints/last/pretrained_model}"
lerobot-record \
  --robot.type=tendercells_ct72 --robot.variant="${VARIANT:-plus}" \
  --policy.path="$POLICY" \
  --dataset.repo_id=local/eval_ct72_egg_pick --dataset.root="${ROOT:-$HOME/ct72_datasets/eval_ct72_egg_pick}" \
  --dataset.push_to_hub=false --dataset.num_episodes="${EPISODES:-5}" --dataset.fps=30 \
  --dataset.single_task="pick the egg from the nest box and place it in the basket" --display_data=false
