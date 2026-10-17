import os
import sys

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "lerobot_ct72")))

from lerobot_robot_tendercells_ct72 import TenderCellsCT72, TenderCellsCT72Config  # noqa: E402
from lerobot_teleoperator_tendercells_ct72 import TenderCellsCT72Teleop, TenderCellsCT72TeleopConfig  # noqa: E402


def test_sim_robot_observation_has_capture_stamps_and_offsets():
    r = TenderCellsCT72(TenderCellsCT72Config(simulate=True))
    r.connect()
    obs = r.get_observation()
    for k in ("timing.t_trigger_ns", "timing.clock_offset_ns", "timing.joint_uncert_ns", "timing.cam_skew_ns", "gantry.x", "gripper.pos"):
        assert k in obs
    assert set(r.observation_features) >= set(k for k in obs if not k.startswith("cam"))


def test_actions_are_step_limited_and_zone_checked():
    r = TenderCellsCT72(TenderCellsCT72Config(simulate=True))
    r.connect()
    x, y, z = r.gantry.position()
    out = r.send_action({"gantry.x": x + 500, "gantry.y": y, "gantry.z": z, "elbow_flex.pos": 90.0})
    assert abs(out["gantry.x"] - x) <= 5.0 + 1e-6 or out["gantry.x"] == x
    assert abs(out["elbow_flex.pos"]) <= 2.0 + 1e-6


def test_teleop_deadman():
    t = TenderCellsCT72Teleop(TenderCellsCT72TeleopConfig(simulate=True),
                              read_gamepad=lambda: {"lx": 1.0, "ly": 0.0, "lt": 0.0, "rt": 0.0, "deadman": False},
                              read_gantry=lambda: (500.0, 500.0, 1500.0))
    t.connect()
    assert t.get_action()["gantry.x"] == 500.0
    t.read_gamepad = lambda: {"lx": 1.0, "ly": 0.0, "lt": 0.0, "rt": 0.0, "deadman": True}
    assert t.get_action()["gantry.x"] > 500.0
