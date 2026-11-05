#!/usr/bin/env bash
# Fine-tune SmolVLA (base weights are a free Hugging Face Hub download) locally - needs a CUDA GPU (Zach's own
# machine); inference then runs on the Jetson (Pro). No push to hub, no W&B.
set -euo pipefail
ROOT="${ROOT:-$HOME/ct72_datasets/ct72_egg_pick}"
lerobot-train \
  --dataset.repo_id=local/ct72_egg_pick --dataset.root="$ROOT" \
  --policy.path=lerobot/smolvla_base --policy.device=cuda --policy.push_to_hub=false \
  --wandb.enable=false --steps="${STEPS:-20000}" --batch_size="${BATCH:-16}" \
  --output_dir="${OUT:-$HOME/ct72_runs/smolvla_egg_pick}"
