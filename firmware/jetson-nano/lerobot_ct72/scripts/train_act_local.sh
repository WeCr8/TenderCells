#!/usr/bin/env bash
# Train ACT locally (no paid cloud, no W&B): on Zach's own GPU machine or the Jetson (slow).
# OPEN ITEM: lerobot-train has no time-shift augmentation hook yet; the measured jitter (CT72_JITTER_PROFILE) is
# applied in sim via ct72.jitter_augment.JitterInjector. Wiring it into training needs a dataset transform (A1.3).
set -euo pipefail
ROOT="${ROOT:-$HOME/ct72_datasets/ct72_egg_pick}"
export CT72_JITTER_PROFILE="${CT72_JITTER_PROFILE:-$ROOT.jitter_profile.json}"
lerobot-train \
  --dataset.repo_id=local/ct72_egg_pick --dataset.root="$ROOT" \
  --policy.type=act --policy.device="${DEVICE:-cuda}" --policy.push_to_hub=false \
  --wandb.enable=false --steps="${STEPS:-60000}" --batch_size="${BATCH:-8}" \
  --output_dir="${OUT:-$HOME/ct72_runs/act_egg_pick}"
