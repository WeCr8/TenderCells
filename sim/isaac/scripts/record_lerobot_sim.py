"""Teleoperate the simulated SO-101 with the real SO-101 LEADER arm and record LeRobot-format episodes.

    ./isaaclab.sh -p <repo>/sim/isaac/scripts/record_lerobot_sim.py --leader-port /dev/ttyACM0 \
        --repo-id local/tendercells_egg_pick_sim --episodes 20 --fps 30

Flow: read the leader arm joint angles (lerobot SO101Leader) -> joint targets for the sim follower in
TenderCells-EggPick-SO101-v0 (1 env) -> record observation.state (6 joints), action (leader targets),
observation.images.bay (BayCam_XIAO-like view) per frame -> LeRobotDataset.save_episode().
Then train ACT / diffusion with `lerobot-train` on the same repo id and replay on the real follower.
Stub: the LeRobot API names (SO101Leader, LeRobotDataset.create/add_frame/save_episode) follow lerobot 0.3.x;
check them against the installed version. Calibrate the leader first (`lerobot-calibrate`).
"""
import argparse

ap = argparse.ArgumentParser()
ap.add_argument("--leader-port", required=True)
ap.add_argument("--repo-id", default="local/tendercells_egg_pick_sim")
ap.add_argument("--episodes", type=int, default=10)
ap.add_argument("--fps", type=int, default=30)
ap.add_argument("--episode-s", type=float, default=20.0)
ap.add_argument("--task", default="TenderCells-EggPick-SO101-v0")
args, rest = ap.parse_known_args()

from isaaclab.app import AppLauncher  # noqa: E402

app = AppLauncher(headless=False, enable_cameras=True).app

import math  # noqa: E402
import gymnasium as gym  # noqa: E402
import numpy as np  # noqa: E402
import torch  # noqa: E402

import tendercells_isaaclab  # noqa: E402,F401
from isaaclab_tasks.utils import parse_env_cfg  # noqa: E402

JOINTS = ["shoulder_pan", "shoulder_lift", "elbow_flex", "wrist_flex", "wrist_roll", "gripper"]


def leader():
    try:
        from lerobot.teleoperators.so101_leader import SO101Leader, SO101LeaderConfig
    except ImportError:  # older lerobot layout
        from lerobot.common.teleoperators.so101_leader import SO101Leader, SO101LeaderConfig
    t = SO101Leader(SO101LeaderConfig(port=args.leader_port, id="tc_leader"))
    t.connect()
    return t


def leader_to_sim(action: dict) -> np.ndarray:
    """lerobot reports degrees for the arm and 0..100 for the gripper; the sim wants radians (URDF zero = calibrated mid)."""
    q = [math.radians(action[f"{j}.pos"]) for j in JOINTS[:5]]
    g = 0.2 + (0.75 - 0.2) * action["gripper.pos"] / 100.0
    return np.array(q + [g], np.float32)


def main():
    from lerobot.datasets.lerobot_dataset import LeRobotDataset
    cfg = parse_env_cfg(args.task, num_envs=1)
    env = gym.make(args.task, cfg=cfg)
    robot = env.unwrapped.scene["robot"]
    ids = [robot.joint_names.index(j) for j in JOINTS]
    features = {
        "observation.state": {"dtype": "float32", "shape": (6,), "names": JOINTS},
        "action": {"dtype": "float32", "shape": (6,), "names": JOINTS},
    }
    ds = LeRobotDataset.create(repo_id=args.repo_id, fps=args.fps, features=features, robot_type="so101_follower_sim", use_videos=False)
    tel = leader()
    for ep in range(args.episodes):
        env.reset()
        for _ in range(int(args.episode_s * args.fps)):
            target = leader_to_sim(tel.get_action())
            robot.set_joint_position_target(torch.tensor(target, device=robot.device).unsqueeze(0), joint_ids=ids)
            env.unwrapped.sim.step(render=True)
            env.unwrapped.scene.update(dt=env.unwrapped.physics_dt)
            state = robot.data.joint_pos[0, ids].cpu().numpy().astype(np.float32)
            ds.add_frame({"observation.state": state, "action": target}, task="pick the egg and place it on the tray")
        ds.save_episode()
        print(f"[tc] saved episode {ep + 1}/{args.episodes}", flush=True)
    tel.disconnect()
    env.close()


if __name__ == "__main__":
    main()
    app.close()
