"""Hugging Face policy runner + MQTT arm service safety rules."""
import io
import json

import pytest

from arm_service import ArmService
from policy_runner import PolicyError, PolicyRequest, PolicyRunner, build_command
from sim_arm import SimulatedArm

NO_SLEEP = lambda _s: None  # noqa: E731


# ── policy requests / commands ──────────────────────────────────────────────
@pytest.mark.parametrize("repo", ["", "smolvla", "../etc/passwd", "a/b/c", "lerobot/x;rm -rf"])
def test_policy_rejects_bad_repo_ids(repo):
    with pytest.raises(PolicyError, match="repo_id"):
        PolicyRequest(repo_id=repo).validate()


def test_policy_rejects_multiline_task_and_bad_duration():
    with pytest.raises(PolicyError, match="task"):
        PolicyRequest("lerobot/smolvla_base", task="pick\n--robot.port=/dev/x").validate()
    with pytest.raises(PolicyError, match="duration"):
        PolicyRequest("lerobot/smolvla_base", duration_s=9999).validate()


def test_build_command_live_and_simulation():
    req = PolicyRequest("lerobot/smolvla_base", task="pick the ripe tomato", duration_s=20).validate()
    live = build_command(req, False, ["--robot.type=so101_follower", "--robot.port=/dev/ttyACM0"])
    assert live[:3] == ["lerobot-rollout", "--strategy.type=base", "--policy.path=lerobot/smolvla_base"]
    assert "--duration=20" in live and "--task=pick the ripe tomato" in live
    sim = build_command(req, True, [])
    assert sim[0] == "lerobot-eval" and "--env.type=pusht" in sim
    with pytest.raises(PolicyError, match="LeRobot arm"):
        build_command(req, False, [])


class FakeProc:
    def __init__(self, cmd, **_kw):
        self.cmd = cmd
        self.stdout = io.StringIO("loading policy\nstep 1\n")
        self.killed = False
        self.code = None

    def poll(self):
        return self.code

    def kill(self):
        self.killed, self.code = True, -9

    def wait(self, timeout=None):
        return self.code if self.code is not None else 0


def test_runner_requires_lerobot_installed():
    runner = PolicyRunner(which=lambda _c: None)
    with pytest.raises(PolicyError, match="Install LeRobot"):
        runner.start(PolicyRequest("lerobot/act_x"), True, [])


# ── service ─────────────────────────────────────────────────────────────────
class Published(list):
    def __call__(self, topic, body, qos, retain):
        self.append((topic, body, qos, retain))

    def last_state(self):
        return [b for t, b, *_ in self if t.endswith("state/arm")][-1]


def service(animal_area=True, arm=None, runner=None, clock=lambda: 1000.0):
    pub = Published()
    arm = arm or SimulatedArm(sleeper=NO_SLEEP)
    arm.connect()
    svc = ArmService("ct_001", arm, pub, animal_area=animal_area, policy_runner=runner, clock=clock)
    return svc, pub, arm


def send(svc, kind, body):
    svc.handle(f"tc/ct_001/{kind}", json.dumps(body).encode())


def test_arm_move_needs_fresh_headcount_and_no_chickens():
    svc, pub, arm = service()
    send(svc, "cmd/arm", {"joints": [10] * 6, "speed": 1})
    assert "headcount" in pub.last_state()["error"]
    send(svc, "sensors", {"chickenCount": 2})
    send(svc, "cmd/arm", {"joints": [10] * 6})
    assert "2 chicken" in pub.last_state()["error"]
    send(svc, "sensors", {"chickenCount": 0})
    send(svc, "cmd/arm", {"joints": [10] * 6, "speed": 1})
    svc.wait_idle()
    assert arm.get_joint_state() == pytest.approx([10] * 6)
    assert pub.last_state()["state"] == "idle" and pub.last_state()["error"] is None


def test_garden_arm_skips_chicken_gate_but_not_estop():
    svc, pub, arm = service(animal_area=False)
    send(svc, "cmd/arm", {"joints": [5] * 6, "speed": 1})
    svc.wait_idle()
    assert arm.get_joint_state() == pytest.approx([5] * 6)
    send(svc, "cmd/estop", {"active": True})
    send(svc, "cmd/arm", {"joints": [0] * 6})
    assert pub.last_state()["state"] == "estop" and "E-STOP" in pub.last_state()["error"]
    send(svc, "cmd/estop", {"active": False})
    assert pub.last_state()["estop"] is False
    assert pub.last_state()["animalSafetyGate"] is False


def test_policy_in_simulation_runs_lerobot_eval_without_releasing_the_arm():
    procs = []
    runner = PolicyRunner(which=lambda c: f"/usr/bin/{c}", popen=lambda cmd, **kw: procs.append(FakeProc(cmd)) or procs[-1])
    svc, pub, arm = service(animal_area=False, runner=runner)
    send(svc, "cmd/motion", {"policy": {"repo_id": "lerobot/diffusion_pusht", "duration_s": 5}})
    assert procs and procs[0].cmd[0] == "lerobot-eval"
    assert arm.is_connected  # simulated arm keeps its (virtual) port


def test_estop_kills_a_running_policy():
    procs = []

    class Hanging(FakeProc):
        def __init__(self, cmd, **kw):
            super().__init__(cmd, **kw)
            self.stdout = None  # never finishes on its own

        def wait(self, timeout=None):
            import time
            end = time.time() + (timeout or 0)
            while self.code is None and time.time() < end:
                time.sleep(0.01)
            return self.code

    runner = PolicyRunner(which=lambda c: c, popen=lambda cmd, **kw: procs.append(Hanging(cmd)) or procs[-1])
    svc, pub, _ = service(animal_area=False, runner=runner)
    send(svc, "cmd/motion", {"policy": {"repo_id": "lerobot/smolvla_base", "task": "water seedlings"}})
    assert runner.running
    send(svc, "cmd/estop", {"active": True})
    assert procs[0].killed and not runner.running
    assert runner.status.state == "stopped"


def test_live_lerobot_policy_releases_port_then_reconnects():
    events = []

    class LiveArm(SimulatedArm):
        mode = "live"

        def rollout_robot_args(self):
            return ["--robot.type=so101_follower", "--robot.port=/dev/ttyACM0"]

        def disconnect(self):
            events.append("disconnect")
            super().disconnect()

        def _connect(self):
            events.append("connect")
            return True

    procs = []
    runner = PolicyRunner(which=lambda c: c, popen=lambda cmd, **kw: procs.append(FakeProc(cmd)) or procs[-1])
    svc, pub, arm = service(animal_area=False, arm=LiveArm(sleeper=NO_SLEEP), runner=runner)
    send(svc, "cmd/motion", {"policy": {"repo_id": "wecr8/act_egg_pick", "task": "pick the egg", "duration_s": 3}})
    assert procs[0].cmd[0] == "lerobot-rollout" and "--robot.port=/dev/ttyACM0" in procs[0].cmd
    import time
    for _ in range(100):
        if events[-1:] == ["connect"] and len(events) >= 3:
            break
        time.sleep(0.02)
    assert events == ["connect", "disconnect", "connect"]  # initial, hand port to LeRobot, take it back


def test_bad_policy_request_is_reported_not_run():
    runner = PolicyRunner(which=lambda c: c, popen=lambda *a, **k: pytest.fail("must not start"))
    svc, pub, _ = service(animal_area=False, runner=runner)
    send(svc, "cmd/motion", {"policy": {"repo_id": "not a repo"}})
    assert "repo_id" in pub.last_state()["error"]


def test_unknown_routine_and_missing_coordinator():
    svc, pub, _ = service(animal_area=False)
    send(svc, "cmd/motion", {"routine": "dance"})
    assert "Unknown routine" in pub.last_state()["error"]
    send(svc, "cmd/motion", {"routine": "egg_collection_routine"})
    assert "coordinator" in pub.last_state()["error"]


def test_arm_commands_with_seq_get_exactly_one_ack():
    svc, pub, _ = service(animal_area=False)
    send(svc, "cmd/arm", {"seq": 41, "joints": [1] * 6, "speed": 1})
    send(svc, "cmd/arm", {"seq": 42, "joints": [1, 2]})  # wrong count -> refused later by the driver? no: queued
    send(svc, "cmd/motion", {"seq": 43, "routine": "dance"})
    send(svc, "cmd/estop", {"seq": 44, "active": True})
    send(svc, "cmd/arm", {"seq": 45, "joints": [0] * 6})
    svc.wait_idle()
    acks = {b["seq"]: b for t, b, *_ in pub if t.endswith("/ack")}
    assert acks[41]["ok"] is True
    assert acks[43]["ok"] is False and "Unknown routine" in acks[43]["error"]
    assert acks[44]["ok"] is True
    assert acks[45]["ok"] is False and "E-STOP" in acks[45]["error"]
    assert sum(1 for t, b, *_ in pub if t.endswith("/ack") and b["seq"] == 41) == 1
