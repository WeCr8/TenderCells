"""Pop-door cycle task (Isaac Lab 2.x): the policy (or a scripted controller) drives the cord-lift door joint
to a scheduled open/closed target, like firmware/chicken-tender-starter door_logic (open at sunrise, close at dusk).

Reward outline: track the scheduled target (tanh), never push the door down (the cord can only pull up),
small action-rate penalty. Reset outline: door closed (or random 0..DOOR_LIFT), door mass 0.6-0.9 kg (dry/wet ply).
Asset: sim/isaac/usd/CT_POPDOOR.usd (fixed-base articulation, prismatic joint 'door_lift', 0..0.28 m).
"""
from __future__ import annotations

import os

import isaaclab.envs.mdp as mdp
import isaaclab.sim as sim_utils
from isaaclab.actuators import ImplicitActuatorCfg
from isaaclab.assets import ArticulationCfg, AssetBaseCfg
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
from .egg_pick_env_cfg import USD_DIR

LIFT = 0.280        # m, hw.yaml door.travel_mm
PERIOD = 8.0        # s per open/close cycle in sim time


@configclass
class DoorSceneCfg(InteractiveSceneCfg):
    door = ArticulationCfg(
        prim_path="{ENV_REGEX_NS}/PopDoor",
        spawn=sim_utils.UsdFileCfg(usd_path=os.path.join(USD_DIR, "CT_POPDOOR.usd"),
                                   articulation_props=sim_utils.ArticulationRootPropertiesCfg(fix_root_link=True)),
        init_state=ArticulationCfg.InitialStateCfg(pos=(0.0, 0.0, 0.0), joint_pos={"door_lift": 0.0}),
        # ~60 N available at the DRV8874 2.0 A limit (generic 150 N actuator); ~10 mm/s (Starter) .. 44 mm/s (Pro)
        actuators={"act": ImplicitActuatorCfg(joint_names_expr=["door_lift"], effort_limit=60.0, velocity_limit=0.044,
                                              stiffness=4000.0, damping=400.0)},
    )
    light = AssetBaseCfg(prim_path="/World/light", spawn=sim_utils.DomeLightCfg(intensity=1200.0))


@configclass
class ActionsCfg:
    lift = mdp.JointPositionActionCfg(asset_name="door", joint_names=["door_lift"], scale=LIFT, use_default_offset=False)


@configclass
class ObservationsCfg:
    @configclass
    class PolicyCfg(ObsGroup):
        q = ObsTerm(func=mdp.joint_pos, params={"asset_cfg": SceneEntityCfg("door")})
        qd = ObsTerm(func=mdp.joint_vel, params={"asset_cfg": SceneEntityCfg("door")})
        target = ObsTerm(func=tc.door_target_obs, params={"lift": LIFT, "period_s": PERIOD})

        def __post_init__(self):
            self.concatenate_terms = True

    policy: PolicyCfg = PolicyCfg()


@configclass
class EventCfg:
    reset = EventTerm(func=mdp.reset_joints_by_offset, mode="reset",
                      params={"position_range": (0.0, 0.05), "velocity_range": (0.0, 0.0), "asset_cfg": SceneEntityCfg("door")})
    mass = EventTerm(func=mdp.randomize_rigid_body_mass, mode="startup",
                     params={"asset_cfg": SceneEntityCfg("door", body_names=["Link"]), "mass_distribution_params": (0.6, 0.9), "operation": "abs"})


@configclass
class RewardsCfg:
    track = RewTerm(func=tc.door_tracking, weight=1.0, params={"lift": LIFT, "period_s": PERIOD, "std": 0.02})
    no_push = RewTerm(func=tc.door_push_down, weight=-0.05)
    action_rate = RewTerm(func=mdp.action_rate_l2, weight=-1e-3)


@configclass
class TerminationsCfg:
    time_out = DoneTerm(func=mdp.time_out, time_out=True)


@configclass
class DoorCycleEnvCfg(ManagerBasedRLEnvCfg):
    scene: DoorSceneCfg = DoorSceneCfg(num_envs=512, env_spacing=1.0)
    actions: ActionsCfg = ActionsCfg()
    observations: ObservationsCfg = ObservationsCfg()
    events: EventCfg = EventCfg()
    rewards: RewardsCfg = RewardsCfg()
    terminations: TerminationsCfg = TerminationsCfg()

    def __post_init__(self):
        self.decimation = 4
        self.episode_length_s = 2 * PERIOD
        self.sim.dt = 1.0 / 120.0
        self.sim.render_interval = self.decimation
        self.viewer.eye = (1.2, -1.2, 0.8)
        self.viewer.lookat = (0.0, 0.0, 0.2)
