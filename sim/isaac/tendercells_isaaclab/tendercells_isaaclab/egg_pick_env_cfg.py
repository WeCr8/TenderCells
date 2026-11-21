"""Egg pick-and-place with the LeRobot SO-101 in the Chicken Tender egg bay (Isaac Lab 2.x, manager-based).

Assets come from sim/isaac/usd (written by cad/chicken-tender-coop/showcase/export_usd.py --lab):
    CT_COOP_A_lab_<layout>.usd   coop + chain-link run + egg-bay hood, static colliders, no robot/eggs/physics scene
    CT_SO101_follower.usd        SO-101 articulation (root = base_link; Lab fixes the root)
    CT_EGG.usd                   58 g egg rigid body (convex hull), shell friction 0.6
    tc_layout.json               mount pose, park pose, egg slots, tray pose (mm in the coop frame)

Reward outline: reach (tanh) -> lift (> 40 mm) -> carry to tray (tanh) -> placed bonus (slow, on the tray)
minus action-rate, joint-velocity and egg-speed (rough handling) penalties.
Reset outline: scene to default, egg to a random lay slot +/- 60 mm and random yaw, egg mass 50-70 g,
shell friction 0.4-0.8, arm joints park pose +/- small noise.
"""
from __future__ import annotations

import json
import math
import os

import isaaclab.envs.mdp as mdp
import isaaclab.sim as sim_utils
from isaaclab.actuators import ImplicitActuatorCfg
from isaaclab.assets import ArticulationCfg, AssetBaseCfg, RigidObjectCfg
from isaaclab.envs import ManagerBasedRLEnvCfg
from isaaclab.managers import EventTermCfg as EventTerm
from isaaclab.managers import ObservationGroupCfg as ObsGroup
from isaaclab.managers import ObservationTermCfg as ObsTerm
from isaaclab.managers import RewardTermCfg as RewTerm
from isaaclab.managers import SceneEntityCfg
from isaaclab.managers import TerminationTermCfg as DoneTerm
from isaaclab.scene import InteractiveSceneCfg
from isaaclab.utils import configclass

from . import mdp as tc

USD_DIR = os.environ.get("TC_USD_DIR", os.path.join(os.path.dirname(__file__), "..", "..", "usd"))
LAYOUT = json.load(open(os.path.join(USD_DIR, "tc_layout.json")))


def _m(v):
    return tuple(float(x) / 1000.0 for x in v)


def layout(name):
    L = LAYOUT[name]
    pick = [s for s in LAYOUT["egg_slots"] if s["id"] == LAYOUT["pick_slot"]][0]
    return {
        "base_pos": _m(L["base_mm"]),
        "base_rot": tuple(L["base_quat_wxyz"]),
        "park": {k: math.radians(v) for k, v in LAYOUT["park_deg"].items()},
        "egg_pos": _m(pick["pos_mm"]),
        "tray": _m(L["tray_mm"]),
        "egg_rest_z": float(pick["pos_mm"][2]) / 1000.0,
        "floor_z": float(LAYOUT["nest_floor_z_mm"]) / 1000.0 - 0.15,
        "coop_usd": os.path.join(USD_DIR, f"CT_COOP_A_lab_{name}.usd"),
    }


ARM_JOINTS = ["shoulder_pan", "shoulder_lift", "elbow_flex", "wrist_flex", "wrist_roll"]


def so101_cfg(pos, rot, park):
    return ArticulationCfg(
        prim_path="{ENV_REGEX_NS}/Robot",
        spawn=sim_utils.UsdFileCfg(
            usd_path=os.path.join(USD_DIR, "CT_SO101_follower.usd"),
            rigid_props=sim_utils.RigidBodyPropertiesCfg(disable_gravity=False, max_depenetration_velocity=1.0),
            articulation_props=sim_utils.ArticulationRootPropertiesCfg(
                fix_root_link=True, enabled_self_collisions=False, solver_position_iteration_count=16, solver_velocity_iteration_count=1),
        ),
        init_state=ArticulationCfg.InitialStateCfg(pos=pos, rot=rot, joint_pos={**park, "gripper": 0.75}),
        actuators={
            # STS3215 12 V bus servos: ~2.9 N.m stall; gains are a starting point, tune against the real arm
            "arm": ImplicitActuatorCfg(joint_names_expr=ARM_JOINTS, effort_limit=2.9, velocity_limit=4.0, stiffness=17.8, damping=0.6),
            # gripper capped ~0.3 N.m (~6 N at the jaw; egg shell fails ~34 N equatorial)
            "gripper": ImplicitActuatorCfg(joint_names_expr=["gripper"], effort_limit=0.3, velocity_limit=4.0, stiffness=5.0, damping=0.3),
        },
    )


@configclass
class EggBaySceneCfg(InteractiveSceneCfg):
    coop: AssetBaseCfg = None
    robot: ArticulationCfg = None
    egg: RigidObjectCfg = None
    light = AssetBaseCfg(prim_path="/World/light", spawn=sim_utils.DomeLightCfg(intensity=1500.0, color=(0.95, 0.95, 1.0)))


@configclass
class ActionsCfg:
    arm = mdp.JointPositionActionCfg(asset_name="robot", joint_names=ARM_JOINTS, scale=0.5, use_default_offset=True)
    gripper = mdp.BinaryJointPositionActionCfg(asset_name="robot", joint_names=["gripper"],
                                               open_command_expr={"gripper": 0.75}, close_command_expr={"gripper": 0.2})


@configclass
class ObservationsCfg:
    @configclass
    class PolicyCfg(ObsGroup):
        joint_pos = ObsTerm(func=mdp.joint_pos_rel)
        joint_vel = ObsTerm(func=mdp.joint_vel_rel)
        egg_pos = ObsTerm(func=tc.egg_pos_in_robot_frame)
        ee_to_egg = ObsTerm(func=tc.ee_to_egg)
        tray_pos = ObsTerm(func=tc.tray_pos_in_robot_frame, params={"tray_pos_env": (0.0, 0.0, 0.0)})
        actions = ObsTerm(func=mdp.last_action)

        def __post_init__(self):
            self.enable_corruption = True
            self.concatenate_terms = True

    policy: PolicyCfg = PolicyCfg()


@configclass
class EventCfg:
    reset_all = EventTerm(func=mdp.reset_scene_to_default, mode="reset")
    reset_egg = EventTerm(
        func=mdp.reset_root_state_uniform, mode="reset",
        params={"pose_range": {"x": (-0.06, 0.06), "y": (-0.06, 0.06), "z": (0.0, 0.003), "yaw": (-math.pi, math.pi)},
                "velocity_range": {}, "asset_cfg": SceneEntityCfg("egg")})
    reset_arm = EventTerm(func=mdp.reset_joints_by_offset, mode="reset",
                          params={"position_range": (-0.05, 0.05), "velocity_range": (0.0, 0.0),
                                  "asset_cfg": SceneEntityCfg("robot", joint_names=ARM_JOINTS)})
    egg_mass = EventTerm(func=mdp.randomize_rigid_body_mass, mode="startup",
                         params={"asset_cfg": SceneEntityCfg("egg"), "mass_distribution_params": (0.05, 0.07), "operation": "abs"})
    egg_friction = EventTerm(func=mdp.randomize_rigid_body_material, mode="startup",
                             params={"asset_cfg": SceneEntityCfg("egg"), "static_friction_range": (0.4, 0.8),
                                     "dynamic_friction_range": (0.3, 0.7), "restitution_range": (0.0, 0.1), "num_buckets": 32})


@configclass
class RewardsCfg:
    reach = RewTerm(func=tc.reach_egg, weight=1.0, params={"std": 0.05})
    lift = RewTerm(func=tc.egg_lifted, weight=5.0, params={"rest_z_env": 0.0, "min_lift": 0.04})
    carry = RewTerm(func=tc.egg_to_tray, weight=10.0, params={"std": 0.1, "tray_pos_env": (0.0, 0.0, 0.0), "rest_z_env": 0.0, "min_lift": 0.04})
    placed = RewTerm(func=tc.egg_placed, weight=25.0, params={"tray_pos_env": (0.0, 0.0, 0.0), "tol_xy": 0.04, "max_speed": 0.05})
    rough = RewTerm(func=tc.egg_rough_handling, weight=-2.0, params={"max_speed": 0.4})
    action_rate = RewTerm(func=mdp.action_rate_l2, weight=-1e-3)
    joint_vel = RewTerm(func=mdp.joint_vel_l2, weight=-1e-4, params={"asset_cfg": SceneEntityCfg("robot")})


@configclass
class TerminationsCfg:
    time_out = DoneTerm(func=mdp.time_out, time_out=True)
    egg_dropped = DoneTerm(func=tc.egg_dropped, params={"floor_z_env": 0.0})
    placed = DoneTerm(func=tc.egg_placed, params={"tray_pos_env": (0.0, 0.0, 0.0), "tol_xy": 0.04, "max_speed": 0.05})


@configclass
class EggPickEnvCfg(ManagerBasedRLEnvCfg):
    layout_name: str = "plus"
    scene: EggBaySceneCfg = EggBaySceneCfg(num_envs=256, env_spacing=6.0, replicate_physics=True)
    actions: ActionsCfg = ActionsCfg()
    observations: ObservationsCfg = ObservationsCfg()
    events: EventCfg = EventCfg()
    rewards: RewardsCfg = RewardsCfg()
    terminations: TerminationsCfg = TerminationsCfg()

    def __post_init__(self):
        L = layout(self.layout_name)
        self.scene.coop = AssetBaseCfg(prim_path="{ENV_REGEX_NS}/Coop", spawn=sim_utils.UsdFileCfg(usd_path=L["coop_usd"]))
        self.scene.robot = so101_cfg(L["base_pos"], L["base_rot"], L["park"])
        self.scene.egg = RigidObjectCfg(
            prim_path="{ENV_REGEX_NS}/Egg",
            spawn=sim_utils.UsdFileCfg(usd_path=os.path.join(USD_DIR, "CT_EGG.usd")),
            init_state=RigidObjectCfg.InitialStateCfg(pos=(L["egg_pos"][0], L["egg_pos"][1], L["egg_pos"][2] + 0.002)))
        tray = L["tray"]
        self.observations.policy.tray_pos.params["tray_pos_env"] = tray
        for term in (self.rewards.carry, self.rewards.placed, self.terminations.placed):
            term.params["tray_pos_env"] = tray
        for term in (self.rewards.lift, self.rewards.carry):
            term.params["rest_z_env"] = L["egg_rest_z"]
        self.terminations.egg_dropped.params["floor_z_env"] = L["floor_z"]
        self.decimation = 2
        self.episode_length_s = 12.0
        self.sim.dt = 1.0 / 120.0
        self.sim.render_interval = self.decimation
        self.sim.physx.bounce_threshold_velocity = 0.05
        self.sim.physx.friction_correlation_distance = 0.00625
        self.viewer.eye = (L["base_pos"][0] + 1.2, L["base_pos"][1] - 0.6, L["base_pos"][2] + 0.6)
        self.viewer.lookat = L["egg_pos"]


@configclass
class EggPickProEnvCfg(EggPickEnvCfg):
    """Pro layout: the arm base sits on the gantry carriage position for the picked slot (gantry DOF not in this stub)."""
    layout_name: str = "pro"


@configclass
class EggPickEnvCfg_PLAY(EggPickEnvCfg):
    def __post_init__(self):
        super().__post_init__()
        self.scene.num_envs = 8
        self.observations.policy.enable_corruption = False
