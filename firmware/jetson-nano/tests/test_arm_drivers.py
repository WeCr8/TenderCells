"""Arm drivers: simulator, Universal Robots, Hugging Face LeRobot, factory."""
import dataclasses
import math
import sys
import types

import pytest

from arm_factory import ArmFactory
from arm_interface import ArmSafetyError
from sim_arm import SimulatedArm
from ur_arm import URArm
import lerobot_arm
from lerobot_arm import LeRobotArm

NO_SLEEP = lambda _s: None  # noqa: E731


# ── simulator + shared safety rules ─────────────────────────────────────────
def test_sim_moves_and_streams_poses():
    poses = []
    arm = SimulatedArm(sleeper=NO_SLEEP, on_step=poses.append)
    arm.connect()
    arm.move_joints([10, 20, 30, 0, 0, 90], speed=1.0)
    assert arm.get_joint_state() == pytest.approx([10, 20, 30, 0, 0, 90])
    assert len(poses) > 1 and poses[-1] == pytest.approx([10, 20, 30, 0, 0, 90])


def test_estop_latches_until_cleared():
    arm = SimulatedArm(sleeper=NO_SLEEP)
    arm.connect()
    arm.estop()
    with pytest.raises(ArmSafetyError, match="E-STOP"):
        arm.move_joints([0] * 6)
    arm.clear_estop()
    assert arm.move_joints([1] * 6)


def test_rejects_wrong_joint_count_and_out_of_limit_targets():
    arm = SimulatedArm(sleeper=NO_SLEEP)
    arm.connect()
    with pytest.raises(ArmSafetyError, match="needs 6"):
        arm.move_joints([0, 0, 0])
    with pytest.raises(ArmSafetyError, match="outside its limit"):
        arm.move_joints([0, 0, 0, 0, 0, 400])


# ── factory ─────────────────────────────────────────────────────────────────
def test_factory_defaults_and_simulation_mode():
    assert isinstance(ArmFactory.create(env={}), SimulatedArm)
    assert isinstance(ArmFactory.create("stepper_6dof", env={}), SimulatedArm)
    sim_so = ArmFactory.create("lerobot", env={"ARM_MODE": "simulation", "LEROBOT_TYPE": "so101_follower"})
    assert isinstance(sim_so, SimulatedArm)
    assert sim_so.config.joint_names[0] == "shoulder_pan" and sim_so.config.joint_limits[-1] == (0, 100)
    sim_ur = ArmFactory.create("ur", env={"ARM_MODE": "simulation"})
    assert sim_ur.mode == "simulation" and sim_ur.config.dof == 6


def test_factory_requires_platform_settings():
    with pytest.raises(ArmSafetyError, match="UR_HOST"):
        ArmFactory.create("ur", env={})
    with pytest.raises(ArmSafetyError, match="LEROBOT_TYPE"):
        ArmFactory.create("lerobot", env={})
    with pytest.raises(ArmSafetyError, match="Unknown ARM_TYPE"):
        ArmFactory.create("kuka", env={})


# ── Universal Robots ────────────────────────────────────────────────────────
class FakeConn:
    sent = []

    def __init__(self, *_a, **_k):
        pass

    def __enter__(self):
        return self

    def __exit__(self, *exc):
        return False

    def sendall(self, data):
        FakeConn.sent.append(data.decode())


def test_ur_urscript_fallback_sends_movej_in_radians_and_stopj():
    FakeConn.sent = []
    arm = URArm("10.0.0.5", use_rtde=False, socket_factory=FakeConn, sleeper=NO_SLEEP)
    assert arm.connect()
    arm.move_joints([90, 0, 0, 0, 0, 0], speed=0.5)
    script = FakeConn.sent[-1]
    assert script.startswith("movej([1.57080, 0.00000") and "v=0.7854" in script
    assert arm.get_joint_state()[0] == pytest.approx(90)
    arm.estop()
    assert FakeConn.sent[-1].startswith("stopj(")
    assert arm.describe()["backend"] == "urscript"


def test_ur_rtde_backend_uses_movej_feedback_and_protective_stop(monkeypatch):
    calls = {}

    class Control:
        def __init__(self, host): calls["host"] = host
        def moveJ(self, q, v, a): calls["moveJ"] = (q, v, a)
        def triggerProtectiveStop(self): calls["pstop"] = True

    class Receive:
        def __init__(self, host): pass
        def getActualQ(self): return [math.radians(v) for v in (5, 10, 15, 20, 25, 30)]

    monkeypatch.setitem(sys.modules, "rtde_control", types.SimpleNamespace(RTDEControlInterface=Control))
    monkeypatch.setitem(sys.modules, "rtde_receive", types.SimpleNamespace(RTDEReceiveInterface=Receive))
    arm = URArm("10.0.0.6")
    arm.connect()
    arm.move_joints([0, -90, 90, 0, 0, 0], speed=1.0)
    assert calls["host"] == "10.0.0.6" and calls["moveJ"][0][1] == pytest.approx(-math.pi / 2)
    assert arm.get_joint_state() == pytest.approx([5, 10, 15, 20, 25, 30])
    arm.estop()
    assert calls["pstop"] and arm.describe()["backend"] == "ur_rtde"


# ── Hugging Face LeRobot ────────────────────────────────────────────────────
class FakeBus:
    torque = True

    def disable_torque(self):
        self.torque = False


class FakeLeRobot:
    """Mimics lerobot.robots.Robot for an SO-101 (5 joints + gripper)."""

    motors = ["shoulder_pan", "shoulder_lift", "elbow_flex", "wrist_flex", "wrist_roll", "gripper"]

    def __init__(self):
        self.pos = {m: 0.0 for m in self.motors}
        self.sent = []
        self.bus = FakeBus()
        self.is_connected = False

    @property
    def action_features(self):
        return {f"{m}.pos": float for m in self.motors}

    def connect(self, calibrate=True):
        self.is_connected = True

    def disconnect(self):
        self.is_connected = False

    def get_observation(self):
        return {f"{m}.pos": v for m, v in self.pos.items()}

    def send_action(self, action):
        self.sent.append(dict(action))
        for k, v in action.items():
            self.pos[k[:-4]] = v
        return action


def make_arm(robot=None):
    robot = robot or FakeLeRobot()
    arm = LeRobotArm("so101_follower", port="/dev/ttyACM0", robot_id="farm_arm",
                     robot_factory=lambda *a: robot, sleeper=NO_SLEEP)
    return arm, robot


def test_lerobot_joint_layout_comes_from_the_robot():
    arm, _ = make_arm()
    arm.connect()
    assert arm.config.dof == 6 and arm.config.joint_names[-1] == "gripper"
    assert arm.config.joint_limits[-1] == (0, 100)


def test_lerobot_streams_capped_steps_to_the_target():
    arm, robot = make_arm()
    arm.connect()
    arm.move_joints([30, -20, 45, 10, 0, 80], speed=0.5)
    assert arm.get_joint_state() == pytest.approx([30, -20, 45, 10, 0, 80], abs=0.3)
    max_step = arm.config.max_speed * 0.5 / lerobot_arm.CONTROL_HZ
    prev = [0.0] * 6
    for action in robot.sent:
        now = [action[f"{m}.pos"] for m in FakeLeRobot.motors]
        assert max(abs(a - b) for a, b in zip(now, prev)) <= max_step + 1e-9
        prev = now
    assert set(robot.sent[0]) == {f"{m}.pos" for m in FakeLeRobot.motors}


def test_lerobot_gripper_limit_and_estop_disables_torque():
    arm, robot = make_arm()
    arm.connect()
    with pytest.raises(ArmSafetyError, match="gripper"):
        arm.move_joints([0, 0, 0, 0, 0, 150])
    arm.estop()
    assert robot.bus.torque is False
    with pytest.raises(ArmSafetyError, match="E-STOP"):
        arm.move_joints([0] * 6)


def test_lerobot_rollout_args():
    arm, _ = make_arm()
    assert arm.rollout_robot_args() == ["--robot.type=so101_follower", "--robot.port=/dev/ttyACM0",
                                        "--robot.id=farm_arm"]


def test_make_lerobot_robot_uses_lerobots_registry(monkeypatch):
    """Builds the config through RobotConfig.get_choice_class like LeRobot's CLI."""
    @dataclasses.dataclass(kw_only=True)
    class SOFollowerRobotConfig:
        port: str
        id: str | None = None
        disable_torque_on_disconnect: bool = True
        use_degrees: bool = True

    built = {}

    class RobotConfig:
        @staticmethod
        def get_choice_class(name):
            if name != "so101_follower":
                raise KeyError(name)
            return SOFollowerRobotConfig

    def make_robot_from_config(cfg):
        built["cfg"] = cfg
        return "robot"

    robots = types.ModuleType("lerobot.robots")
    robots.RobotConfig, robots.make_robot_from_config = RobotConfig, make_robot_from_config
    monkeypatch.setitem(sys.modules, "lerobot", types.ModuleType("lerobot"))
    monkeypatch.setitem(sys.modules, "lerobot.robots", robots)
    assert lerobot_arm.make_lerobot_robot("so101_follower", "/dev/ttyACM0", "arm1", {"bogus": 1}) == "robot"
    cfg = built["cfg"]
    assert (cfg.port, cfg.id, cfg.disable_torque_on_disconnect) == ("/dev/ttyACM0", "arm1", False)
    with pytest.raises(ArmSafetyError, match="does not know robot type"):
        lerobot_arm.make_lerobot_robot("r2d2", None, None)
