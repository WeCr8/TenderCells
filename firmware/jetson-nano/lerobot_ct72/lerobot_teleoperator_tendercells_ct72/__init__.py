"""LeRobot teleoperator plugin `tendercells_ct72_teleop`: SO-101 LEADER arm for the follower's joints + a USB
gamepad jogging the gantry (left stick X/Y, triggers Z), with a dead-man button (LB) that must be held."""
from .teleop_tendercells_ct72 import TenderCellsCT72Teleop, TenderCellsCT72TeleopConfig  # noqa: F401
