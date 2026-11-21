"""TenderCells Chicken Tender tasks for Isaac Lab 2.x.

Registration only uses string entry points, so importing this package does not start Isaac Sim.
    TenderCells-EggPick-SO101-v0      SO-101 picks an egg from the nest pad and places it on the tray (Plus layout)
    TenderCells-EggPick-SO101-Pro-v0  same on the Pro gantry layout
    TenderCells-DoorCycle-v0          pop-door open/close cycle (door joint + reeds), for controller tests
"""
import gymnasium as gym

gym.register(
    id="TenderCells-EggPick-SO101-v0",
    entry_point="isaaclab.envs:ManagerBasedRLEnv",
    disable_env_checker=True,
    kwargs={
        "env_cfg_entry_point": f"{__name__}.egg_pick_env_cfg:EggPickEnvCfg",
        "rsl_rl_cfg_entry_point": f"{__name__}.agents.rsl_rl_ppo_cfg:EggPickPPORunnerCfg",
    },
)
gym.register(
    id="TenderCells-EggPick-SO101-Pro-v0",
    entry_point="isaaclab.envs:ManagerBasedRLEnv",
    disable_env_checker=True,
    kwargs={
        "env_cfg_entry_point": f"{__name__}.egg_pick_env_cfg:EggPickProEnvCfg",
        "rsl_rl_cfg_entry_point": f"{__name__}.agents.rsl_rl_ppo_cfg:EggPickPPORunnerCfg",
    },
)
gym.register(
    id="TenderCells-DoorCycle-v0",
    entry_point="isaaclab.envs:ManagerBasedRLEnv",
    disable_env_checker=True,
    kwargs={
        "env_cfg_entry_point": f"{__name__}.door_cycle_env_cfg:DoorCycleEnvCfg",
        "rsl_rl_cfg_entry_point": f"{__name__}.agents.rsl_rl_ppo_cfg:DoorCyclePPORunnerCfg",
    },
)
