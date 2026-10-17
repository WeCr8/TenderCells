"""LeRobot third-party robot plugin (LeRobot imports installed packages named lerobot_robot_*).
Registers robot type `tendercells_ct72`: the CT72 belt gantry (Klipper) + inverted SO-101 follower +
hardware-triggered global-shutter cameras, with capture-time stamps and per-sample clock offsets."""
from .config_tendercells_ct72 import TenderCellsCT72Config  # noqa: F401
from .tendercells_ct72 import TenderCellsCT72  # noqa: F401
