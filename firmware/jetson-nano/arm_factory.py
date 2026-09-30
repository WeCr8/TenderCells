"""Pick an arm driver from configuration.

    ARM_TYPE=sim       Simulated 6-DOF arm (no hardware)       - works anywhere
    ARM_TYPE=ur        Universal Robots          (UR_HOST)
    ARM_TYPE=lerobot   Hugging Face LeRobot arm  (LEROBOT_TYPE, LEROBOT_PORT, LEROBOT_ID)
    ARM_TYPE=isaac     NVIDIA Isaac Sim articulation (ISAAC_ARM_PRIM, ISAAC_API) - run in Isaac Sim's Python

ARM_MODE=simulation forces the simulator whatever ARM_TYPE says, using the real
platform's joint layout where it is known, so a site can rehearse routines and
policies before switching to live.
"""

from __future__ import annotations

import os
from typing import Mapping, Optional

from arm_interface import ArmConfig, ArmController, ArmSafetyError
from sim_arm import SIM_CONFIG, SimulatedArm

SUPPORTED_TYPES = ("sim", "ur", "lerobot", "isaac")

# Joint layouts for simulating a platform before the real one is connected.
_LEROBOT_SO_JOINTS = ["shoulder_pan", "shoulder_lift", "elbow_flex", "wrist_flex", "wrist_roll", "gripper"]


def _sim_config_for(arm_type: str, env: Mapping[str, str]) -> ArmConfig:
    if arm_type == "ur":
        from ur_arm import UR_CONFIG
        return ArmConfig(**{**UR_CONFIG.__dict__, "name": "Universal Robots (simulated)"})
    if arm_type == "lerobot":
        robot_type = env.get("LEROBOT_TYPE", "so101_follower")
        names = _LEROBOT_SO_JOINTS if robot_type.startswith(("so100", "so101")) else SIM_CONFIG.joint_names
        return ArmConfig(
            name=f"LeRobot {robot_type} (simulated)", dof=len(names), max_speed=90.0, joint_names=list(names),
            joint_limits=[(0, 100) if "gripper" in n else (-180, 180) for n in names],
        )
    return SIM_CONFIG


class ArmFactory:
    @staticmethod
    def create(arm_type: Optional[str] = None, env: Optional[Mapping[str, str]] = None, **overrides) -> ArmController:
        """Build the configured arm driver.

        :param arm_type: "sim" | "ur" | "lerobot" | "isaac" (defaults to ARM_TYPE, then "sim").
        :param env:      Settings source (defaults to os.environ).
        :raises ArmSafetyError: unknown type or missing required setting.
        """
        env = dict(os.environ if env is None else env)
        arm_type = (arm_type or env.get("ARM_TYPE") or "sim").lower()
        # Legacy default from coordinated_motion_controller: no stepper driver exists yet.
        if arm_type == "stepper_6dof":
            arm_type = "sim"
        if arm_type not in SUPPORTED_TYPES:
            raise ArmSafetyError(f"Unknown ARM_TYPE '{arm_type}'. Use one of: {', '.join(SUPPORTED_TYPES)}")

        if arm_type == "isaac":  # already a simulator - ARM_MODE does not apply
            from isaac.isaac_arm import IsaacArm
            return IsaacArm(env.get("ISAAC_ARM_PRIM", "/World/arm"), api=env.get("ISAAC_API", "auto"), **overrides)

        if arm_type == "sim" or env.get("ARM_MODE", "live").lower() == "simulation":
            return SimulatedArm(_sim_config_for(arm_type, env), **overrides)

        if arm_type == "ur":
            from ur_arm import URArm
            host = env.get("UR_HOST")
            if not host:
                raise ArmSafetyError("ARM_TYPE=ur needs UR_HOST (the robot controller's IP address)")
            return URArm(host, **overrides)

        from lerobot_arm import LeRobotArm
        robot_type = env.get("LEROBOT_TYPE")
        if not robot_type:
            raise ArmSafetyError("ARM_TYPE=lerobot needs LEROBOT_TYPE (e.g. so101_follower, koch_follower)")
        return LeRobotArm(robot_type, port=env.get("LEROBOT_PORT"), robot_id=env.get("LEROBOT_ID"), **overrides)
