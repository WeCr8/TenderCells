"""Exclusion zones on the robot (cfg/zones) and the Isaac Sim arm driver (fake backend)."""
import json
import math

import pytest

from arm_factory import ArmFactory
from arm_interface import ArmConfig, ArmSafetyError
from isaac.isaac_arm import IsaacArm
from weed_patrol import BedConfig, LaserController, SimDetector, SimGantry, WeedPatrol
from weed_patrol_service import WeedPatrolService
from zones import MM_PER_FT, ZoneGuard, ZoneViolation

# Bed item at (20, 10) ft, 5 ft wide x 10 ft deep -> long side runs down the map (y).
SELF = {"itemId": "bed1", "x": 20, "y": 10, "width": 5, "depth": 10}


def payload(*zones, seq=3):
    return {"v": 1, "seq": seq, "units": "ft", "self": SELF, "zones": list(zones)}


def square(zid, kind, x0, y0, x1, y1):
    return {"id": zid, "name": zid, "kind": kind, "poly": [[x0, y0], [x1, y0], [x1, y1], [x0, y1]]}


# ── ZoneGuard ────────────────────────────────────────────────────────────────
def test_bed_mm_maps_to_property_feet_like_the_3d_view():
    g = ZoneGuard.from_payload(payload())
    # x along the long side (down the map), y across (to the right)
    assert g.bed_to_property(0, 0) == (20, 10)
    x, y = g.bed_to_property(3 * MM_PER_FT, 1 * MM_PER_FT)
    assert math.isclose(x, 21) and math.isclose(y, 13)


def test_no_laser_blocks_laser_but_not_driving():
    g = ZoneGuard.from_payload(payload(square("coop", "no-laser", 18, 9, 23, 13)))
    g.check_bed(1 * MM_PER_FT, 1 * MM_PER_FT, "drive")  # fine
    with pytest.raises(ZoneViolation, match="laser"):
        g.check_bed(1 * MM_PER_FT, 1 * MM_PER_FT, "laser")
    g.check_bed(8 * MM_PER_FT, 1 * MM_PER_FT, "laser")  # outside the buffer


def test_no_go_blocks_paths_and_bad_payloads_are_rejected():
    g = ZoneGuard.from_payload(payload(square("septic", "no-go", 5, 5, 8, 8)))
    with pytest.raises(ZoneViolation, match="septic"):
        g.check_path([(0, 6), (10, 6)])
    g.check_path([(0, 0), (10, 0)])
    for bad in ({"v": 2, "units": "ft"}, payload({"id": "a", "kind": "lava", "poly": [[0, 0], [1, 0], [1, 1]]}),
                payload({"id": "a", "kind": "no-go", "poly": [[0, 0], [1, 1]]})):
        with pytest.raises(ValueError):
            ZoneGuard.from_payload(bad)


# ── weed robot enforcement ───────────────────────────────────────────────────
def make_patrol():
    bed = BedConfig(item_id="bed1")
    laser = LaserController(lambda on: None, lambda on: None, lambda: True, sleeper=lambda s: None,
                            student_mode=False, burn_enabled=True)
    return WeedPatrol(bed, SimDetector(bed, weeds=6, seed=7), SimGantry(), laser, lambda e: None)


def test_pass_skips_waypoints_in_no_go_and_never_moves_there():
    patrol = make_patrol()
    # No-go over the whole top half of the bed (first 5 ft along the long side).
    patrol.zones = ZoneGuard.from_payload(payload(square("kids", "no-go", 19, 9, 26, 15)))
    moves = []
    real = patrol.gantry.move_to
    patrol.gantry.move_to = lambda x, y, z: (moves.append((x, y)), real(x, y, z))
    patrol.run_passes(1)
    assert moves, "rest of the bed is still scanned"
    for x_mm, y_mm in moves:
        px, py = patrol.zones.bed_to_property(x_mm, y_mm)
        assert patrol.zones.blocking(px, py) is None


def test_service_loads_zones_and_refuses_laser_near_animals():
    patrol = make_patrol()
    pub = []
    svc = WeedPatrolService("garden_weeder", patrol, lambda t, b, q, r: pub.append((t, b)))
    svc.handle("tc/garden_weeder/cmd/weed", json.dumps({"seq": 1, "action": "pass"}).encode())
    svc.wait_idle()
    # Whole bed is inside a coop's no-laser buffer.
    svc.handle("tc/garden_weeder/cfg/zones", json.dumps(payload(square("coop", "no-laser", 0, 0, 40, 40), seq=9)).encode())
    acks = [b for t, b in pub if t.endswith("/ack")]
    assert acks[-1] == {"seq": 9, "ok": True}
    state = [b for t, b in pub if t.endswith("state/weed")][-1]
    assert state["zones"]["kinds"]["no-laser"] == 1
    weed_id = next(iter(patrol.weeds))
    for mode in ("aim", "burn"):
        svc.handle("tc/garden_weeder/cmd/weed", json.dumps({"seq": 10, "action": "approve", "eventId": weed_id, "mode": mode}).encode())
        ack = [b for t, b in pub if t.endswith("/ack")][-1]
        assert ack["ok"] is False and "no-laser" in ack["error"]
    assert patrol.weeds[weed_id]["status"] == "pending_review"


# ── Isaac Sim arm driver ─────────────────────────────────────────────────────
class FakeArticulation:
    """Stands in for Isaac Sim: PD drive reaches half the remaining distance per step."""

    def __init__(self, dof=6):
        self.dof_names = [f"joint_{i + 1}" for i in range(dof)]
        self.q = [0.0] * dof
        self.target = [0.0] * dof
        self.steps = 0

    def read(self):
        return list(self.q)

    def set_targets(self, radians):
        self.target = list(radians)

    def step(self):
        self.steps += 1
        self.q = [q + (t - q) * 0.5 for q, t in zip(self.q, self.target)]


def test_isaac_arm_moves_in_degrees_and_respects_limits_and_estop():
    fake = FakeArticulation()
    cfg = ArmConfig(name="isaac", dof=6, joint_limits=[(-180, 180)] * 6)
    arm = IsaacArm(config=cfg, backend_factory=lambda: fake)
    assert arm.connect() and arm.mode == "simulation"
    arm.move_joints([10, 20, 30, 0, -45, 90], speed=0.5)
    assert all(abs(a - b) <= 0.5 for a, b in zip(arm.get_joint_state(), [10, 20, 30, 0, -45, 90]))
    assert math.isclose(fake.target[1], math.radians(20))
    with pytest.raises(ArmSafetyError):
        arm.move_joints([0, 0, 0, 0, 0, 200])
    arm.estop()
    assert fake.target == pytest.approx(fake.q)  # holds the current pose
    with pytest.raises(ArmSafetyError, match="E-STOP"):
        arm.move_joints([0] * 6)
    assert arm.describe()["simulator"] == "isaac-sim"


def test_isaac_arm_takes_joint_layout_from_the_usd_robot():
    arm = IsaacArm(backend_factory=lambda: FakeArticulation(dof=7))
    arm.connect()
    assert arm.config.dof == 7 and arm.config.joint_names[0] == "joint_1"


def test_factory_reports_missing_isaac_sim_clearly():
    with pytest.raises(ArmSafetyError, match="Isaac Sim is not available"):
        ArmFactory.create("isaac", env={}).connect()


def test_dataset_plan_and_prim_names_match_the_os_exporter():
    from isaac.usd_names import prim_name
    from isaac.weed_dataset import DatasetPlan

    plan = DatasetPlan((0, 0), (1.5, 3.0), frames=10)
    plan.validate()
    assert plan.centre == (0.75, 1.5)
    with pytest.raises(ValueError):
        DatasetPlan((1, 1), (0, 0)).validate()
    assert prim_name("item-1 a") == "item_1_a" and prim_name("9lives") == "_9lives"  # same as usdExport.test.ts


# ── habitat sound monitor ────────────────────────────────────────────────────
def test_sound_filter_alerts_once_per_cooldown_and_ignores_normal_sounds():
    from habitat_listener import SoundEventFilter

    f = SoundEventFilter(min_score=0.3, cooldown_s=60)
    assert f.feed([("Chicken, rooster", 0.9), ("Bird", 0.5)], now=0) == []
    first = f.feed([("Dog", 0.7), ("Rodents, rats, mice", 0.2)], now=1)
    assert [a["label"] for a in first] == ["Dog"] and first[0]["type"] == "predator"
    assert f.feed([("Dog", 0.8)], now=30) == []           # cooldown
    assert len(f.feed([("Dog", 0.8)], now=100)) == 1     # after cooldown
