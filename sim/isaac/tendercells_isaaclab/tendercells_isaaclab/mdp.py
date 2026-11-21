"""Observation / reward / termination / event terms for the TenderCells tasks (Isaac Lab 2.x manager API).

All functions take the env first and return a (num_envs, ...) torch tensor, like isaaclab.envs.mdp terms.
"""
from __future__ import annotations

import math
import torch

from isaaclab.managers import SceneEntityCfg
from isaaclab.utils.math import subtract_frame_transforms

EE_BODY = "gripper_frame_link"


def _ee_pos_w(env, robot_cfg: SceneEntityCfg):
    robot = env.scene[robot_cfg.name]
    idx = robot.find_bodies(EE_BODY)[0][0]
    return robot.data.body_pos_w[:, idx]


# ----------------------------------------------------------------------------- observations
def egg_pos_in_robot_frame(env, robot_cfg: SceneEntityCfg = SceneEntityCfg("robot"), egg_cfg: SceneEntityCfg = SceneEntityCfg("egg")):
    robot, egg = env.scene[robot_cfg.name], env.scene[egg_cfg.name]
    p, _ = subtract_frame_transforms(robot.data.root_pos_w, robot.data.root_quat_w, egg.data.root_pos_w)
    return p


def tray_pos_in_robot_frame(env, tray_pos_env: tuple, robot_cfg: SceneEntityCfg = SceneEntityCfg("robot")):
    robot = env.scene[robot_cfg.name]
    tray_w = env.scene.env_origins + torch.tensor(tray_pos_env, device=env.device)
    p, _ = subtract_frame_transforms(robot.data.root_pos_w, robot.data.root_quat_w, tray_w)
    return p


def ee_to_egg(env, robot_cfg: SceneEntityCfg = SceneEntityCfg("robot"), egg_cfg: SceneEntityCfg = SceneEntityCfg("egg")):
    return env.scene[egg_cfg.name].data.root_pos_w - _ee_pos_w(env, robot_cfg)


# ----------------------------------------------------------------------------- rewards
def reach_egg(env, std: float, robot_cfg: SceneEntityCfg = SceneEntityCfg("robot"), egg_cfg: SceneEntityCfg = SceneEntityCfg("egg")):
    d = torch.norm(ee_to_egg(env, robot_cfg, egg_cfg), dim=1)
    return 1.0 - torch.tanh(d / std)


def egg_lifted(env, rest_z_env: float, min_lift: float, egg_cfg: SceneEntityCfg = SceneEntityCfg("egg")):
    z = env.scene[egg_cfg.name].data.root_pos_w[:, 2] - env.scene.env_origins[:, 2]
    return (z > rest_z_env + min_lift).float()


def egg_to_tray(env, std: float, tray_pos_env: tuple, rest_z_env: float, min_lift: float, egg_cfg: SceneEntityCfg = SceneEntityCfg("egg")):
    egg = env.scene[egg_cfg.name]
    tray_w = env.scene.env_origins + torch.tensor(tray_pos_env, device=env.device)
    d = torch.norm(egg.data.root_pos_w - tray_w, dim=1)
    lifted = egg_lifted(env, rest_z_env, min_lift, egg_cfg)
    near_tray = (d < 0.12).float()
    return torch.maximum(lifted, near_tray) * (1.0 - torch.tanh(d / std))


def egg_placed(env, tray_pos_env: tuple, tol_xy: float, max_speed: float, egg_cfg: SceneEntityCfg = SceneEntityCfg("egg")):
    egg = env.scene[egg_cfg.name]
    tray_w = env.scene.env_origins + torch.tensor(tray_pos_env, device=env.device)
    dxy = torch.norm(egg.data.root_pos_w[:, :2] - tray_w[:, :2], dim=1)
    dz = torch.abs(egg.data.root_pos_w[:, 2] - tray_w[:, 2])
    slow = torch.norm(egg.data.root_lin_vel_w, dim=1) < max_speed
    return ((dxy < tol_xy) & (dz < 0.04) & slow).float()


def egg_rough_handling(env, max_speed: float, egg_cfg: SceneEntityCfg = SceneEntityCfg("egg")):
    """Penalise egg speed above max_speed (m/s): a proxy for knocks and drops (shell ~34 N equatorial)."""
    v = torch.norm(env.scene[egg_cfg.name].data.root_lin_vel_w, dim=1)
    return torch.clamp(v - max_speed, min=0.0)


# ----------------------------------------------------------------------------- terminations
def egg_dropped(env, floor_z_env: float, egg_cfg: SceneEntityCfg = SceneEntityCfg("egg")):
    z = env.scene[egg_cfg.name].data.root_pos_w[:, 2] - env.scene.env_origins[:, 2]
    return z < floor_z_env


# ----------------------------------------------------------------------------- door cycle task
def door_target(env, lift: float, period_s: float):
    """Scheduled target: open for the first half of each period, closed for the second (firmware schedule proxy)."""
    t = env.episode_length_buf.float() * env.step_dt
    phase = torch.remainder(t, period_s) / period_s
    return torch.where(phase < 0.5, torch.full_like(t, lift), torch.zeros_like(t))


def door_target_obs(env, lift: float, period_s: float):
    return door_target(env, lift, period_s).unsqueeze(1)


def door_tracking(env, lift: float, period_s: float, std: float, asset_cfg: SceneEntityCfg = SceneEntityCfg("door")):
    q = env.scene[asset_cfg.name].data.joint_pos[:, 0]
    return 1.0 - torch.tanh(torch.abs(q - door_target(env, lift, period_s)) / std)


def door_push_down(env, asset_cfg: SceneEntityCfg = SceneEntityCfg("door")):
    """The cord can only pull up: penalise any commanded effort that pushes the door down (firmware never does)."""
    eff = env.scene[asset_cfg.name].data.applied_torque[:, 0]
    return torch.clamp(-eff, min=0.0)
