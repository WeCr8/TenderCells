"""Weed patrol: pass planning, detection, human approval, laser interlocks, MQTT service."""
import json
import math

import pytest

from weed_patrol import (BedConfig, Detection, InterlockError, LaserController, Plant, SimDetector, SimGantry,
                         WeedPatrol, near_known_plant, plan_pass)
from weed_patrol_service import WeedPatrolService


def make_laser(**kw):
    log = {"laser": [], "aim": []}
    laser = LaserController(lambda on: log["aim"].append(on), lambda on: log["laser"].append(on),
                            kw.pop("enclosure", lambda: True), sleeper=lambda s: None, **kw)
    return laser, log


def make_patrol(**laser_kw):
    bed = BedConfig(item_id="item-garden-genesis")
    events = []
    laser, log = make_laser(**laser_kw)
    patrol = WeedPatrol(bed, SimDetector(bed, weeds=6, seed=7), SimGantry(), laser, events.append)
    return patrol, events, log


# ── planning / detection ────────────────────────────────────────────────────
def test_pass_covers_the_whole_bed_serpentine():
    bed = BedConfig()
    pts = plan_pass(bed)
    fx, fy = bed.fov_mm
    for x in range(0, int(bed.length_mm), 50):  # every point of the bed is inside some frame
        for y in range(0, int(bed.width_mm), 50):
            assert any(abs(x - px) <= fx / 2 and abs(y - py) <= fy / 2 for px, py in pts), (x, y)
    assert pts[0][1] < pts[1][1]  # serpentine: first column goes up...


def test_sim_pass_flags_every_weed_once_and_never_a_crop():
    patrol, events, _ = make_patrol()
    found = patrol.run_passes(2)  # second pass must not duplicate flags
    assert len(found) == len(patrol.detector.truth) == 6
    for w in found:
        assert not near_known_plant(w["x"], w["y"], patrol.bed.known_plants)
        assert min(math.hypot(w["x"] - t[0], w["y"] - t[1]) for t in patrol.detector.truth) < 20
    first = [e for e in events if e["status"] == "pending_review"]
    assert len({e["id"] for e in first}) == 6
    assert first[0]["type"] == "weed_detected" and first[0]["itemId"] == "item-garden-genesis" and "bedMm" in first[0]


def test_hsv_detector_finds_green_weeds_on_soil_and_skips_crops():
    np = pytest.importorskip("numpy")
    cv2 = pytest.importorskip("cv2")
    from weed_patrol import HsvDetector

    img = np.zeros((300, 400, 3), np.uint8)
    img[:] = (40, 70, 110)  # brown soil (BGR)
    cv2.circle(img, (100, 80), 12, (40, 170, 40), -1)   # weed
    cv2.circle(img, (300, 220), 16, (30, 160, 50), -1)  # weed
    cv2.circle(img, (200, 150), 25, (40, 180, 40), -1)  # crop at the frame centre
    det = HsvDetector(lambda: img, blur=3, morph=3, iterations=1, mm_per_px=1.0)
    bed = BedConfig(fov_mm=(400, 300), known_plants=[Plant(1000, 500, 40)])
    hits = det.detect((1000, 500), bed)  # frame centred at (1000, 500) mm
    coords = sorted((round(h.x), round(h.y)) for h in hits)
    assert (900, 430) in coords and (1100, 570) in coords
    weeds = [h for h in hits if not near_known_plant(h.x, h.y, bed.known_plants)]
    assert len(weeds) == 2


# ── human in the loop + laser ───────────────────────────────────────────────
def test_aim_only_never_fires_and_keeps_weed_for_review():
    patrol, events, log = make_patrol()
    weed = patrol.run_passes(1)[0]
    patrol.approve(weed["id"], "aim")
    assert True not in log["laser"] and log["aim"][-1] is True
    assert patrol.weeds[weed["id"]]["status"] == "pending_review"
    assert patrol.gantry.position[:2] == (weed["x"], weed["y"])


@pytest.mark.parametrize("kw, reason", [
    ({}, "Student mode"),  # default: student mode
    ({"student_mode": False}, "not enabled"),
    ({"student_mode": False, "burn_enabled": True, "enclosure": lambda: False}, "Enclosure is open"),
])
def test_burn_refused_by_each_interlock(kw, reason):
    patrol, events, log = make_patrol(**kw)
    weed = patrol.run_passes(1)[0]
    with pytest.raises(InterlockError, match=reason):
        patrol.approve(weed["id"], "burn")
    assert True not in log["laser"]
    assert events[-1]["status"] == "pending_review" and "Burn blocked" in events[-1]["detail"]


def test_burn_with_all_interlocks_pulses_once_and_marks_treated():
    patrol, events, log = make_patrol(student_mode=False, burn_enabled=True, pulse_ms=5000)
    assert patrol.laser.pulse_ms == LaserController.MAX_PULSE_MS  # clamped
    weed = patrol.run_passes(1)[0]
    patrol.approve(weed["id"], "burn")
    assert log["laser"] == [True, False]  # on then always off
    assert patrol.weeds[weed["id"]]["status"] == "treated" and events[-1]["status"] == "treated"
    assert len(patrol.detector.truth) == 5  # the sim weed is gone
    with pytest.raises(InterlockError, match="cooling down"):
        patrol.laser.check_burn_allowed()


def test_estop_stops_laser_and_blocks_everything():
    patrol, events, log = make_patrol(student_mode=False, burn_enabled=True)
    weed = patrol.run_passes(1)[0]
    patrol.estop()
    assert log["laser"][-1] is False and log["aim"][-1] is False
    with pytest.raises(InterlockError, match="E-STOP"):
        patrol.laser.check_burn_allowed()


def test_reject():
    patrol, events, _ = make_patrol()
    weed = patrol.run_passes(1)[0]
    patrol.reject(weed["id"])
    assert events[-1]["status"] == "rejected"


# ── MQTT service ────────────────────────────────────────────────────────────
class Pub(list):
    def __call__(self, topic, body, qos, retain):
        self.append((topic, body))

    def acks(self):
        return [b for t, b in self if t.endswith("/ack")]


def service(**laser_kw):
    patrol, _, log = make_patrol(**laser_kw)
    pub = Pub()
    return WeedPatrolService("garden_weeder", patrol, pub), pub, log


def send(svc, kind, body):
    svc.handle(f"tc/garden_weeder/{kind}", json.dumps(body).encode())


def test_service_pass_acks_and_publishes_flags():
    svc, pub, _ = service()
    send(svc, "cmd/weed", {"seq": 11, "action": "pass", "passes": 1})
    svc.wait_idle()
    assert pub.acks()[0] == {"seq": 11, "ok": True}
    flags = [b for t, b in pub if t.endswith("/event")]
    assert len({f["id"] for f in flags}) == 6
    state = [b for t, b in pub if t.endswith("state/weed")][-1]
    assert state["state"] == "idle" and state["animalSafetyGate"] is False and state["laser"]["studentMode"] is True


def test_service_refuses_burn_with_reason_in_ack():
    svc, pub, log = service()
    send(svc, "cmd/weed", {"seq": 1, "action": "pass"})
    svc.wait_idle()
    weed_id = next(iter(svc.patrol.weeds))
    send(svc, "cmd/weed", {"seq": 2, "action": "approve", "eventId": weed_id, "mode": "burn"})
    assert pub.acks()[-1]["ok"] is False and "Student mode" in pub.acks()[-1]["error"]
    assert True not in log["laser"]


def test_service_estop_latches_until_cleared():
    svc, pub, _ = service()
    send(svc, "cmd/estop", {"active": True, "seq": 5})
    send(svc, "cmd/weed", {"seq": 6, "action": "pass"})
    assert pub.acks()[-1] == {"seq": 6, "ok": False, "error": "E-STOP is active"}
    send(svc, "cmd/estop", {"active": False})
    send(svc, "cmd/weed", {"seq": 7, "action": "pass"})
    svc.wait_idle()
    assert pub.acks()[-1] == {"seq": 7, "ok": True}


# ── laser profiles + FarmBot Genesis (Project Cyclops) ─────────────────────────
from weed_patrol import LASER_PROFILES, FarmBotGantry  # noqa: E402


def test_profile_exposure_scales_with_weed_size_and_is_bounded():
    p = LASER_PROFILES["diode-4w"]
    assert p.exposure_ms(5) == p.min_ms and p.exposure_ms(500) == p.max_ms
    assert p.min_ms < p.exposure_ms(35) < p.max_ms
    laser, log = make_laser(student_mode=False, burn_enabled=True, profile="diode-500mw")
    assert laser.burn(60) == LASER_PROFILES["diode-500mw"].max_ms
    assert log["laser"] == [True, False]
    assert laser.status()["laserClass"] == "3B"
    with pytest.raises(ValueError):
        make_laser(profile="co2-150w")


def test_estop_during_a_long_pulse_cuts_the_laser():
    holder = {}

    def sleeper(_s):  # E-STOP arrives from another thread mid-pulse
        holder["laser"].estop()

    laser, log = make_laser(student_mode=False, burn_enabled=True, profile="diode-4w")
    laser._sleep = sleeper
    holder["laser"] = laser
    with pytest.raises(InterlockError, match="E-STOP during pulse"):
        laser.burn(40)
    assert log["laser"][-1] is False


class FakeFarmBot:
    def __init__(self):
        self.calls, self.pins = [], {"7": {"mode": 0, "value": 0}}

    def move(self, **kw):
        self.calls.append(("move", kw))

    def e_stop(self):
        self.calls.append(("e_stop",))

    def read_pin(self, pin):
        self.calls.append(("read_pin", pin))

    def read_status(self, path=None):
        return self.pins if path == "pins" else {"pins": self.pins}


def test_farmbot_gantry_moves_estops_and_reads_pins():
    bot = FakeFarmBot()
    g = FarmBotGantry(token=None, bot=bot)
    g.move_to(120.04, 50, -150)
    g.stop()
    assert bot.calls[0] == ("move", {"x": 120.0, "y": 50, "z": -150, "speed": 100})
    assert ("e_stop",) in bot.calls
    assert g.pin_value(7) == 0 and g.pin_value(9) is None  # unknown pin -> None (treated as open)


def test_state_reports_tool_position_aim_and_laser_for_the_3d_view():
    published = []
    patrol, _events, _log = make_patrol(student_mode=False, burn_enabled=True)
    svc = WeedPatrolService("garden_weeder", patrol, lambda t, b, q, r: published.append((t, b)), robot_type="rover-laser")
    patrol.run_passes(1)
    weed = next(iter(patrol.weeds.values()))
    patrol.approve(weed["id"], "aim")
    snap = svc.snapshot()
    assert snap["robotType"] == "rover-laser"
    assert snap["tool"]["aim"] is True and snap["tool"]["laser"] is False
    assert (snap["tool"]["x"], snap["tool"]["y"]) == (round(weed["x"], 1), round(weed["y"], 1))
    patrol.estop()
    assert svc.snapshot()["tool"]["aim"] is False


def test_patrol_and_plant_scan_raise_located_alerts_that_are_never_laser_targets():
    patrol, events, log = make_patrol(student_mode=False, burn_enabled=True)
    found = patrol.run_passes(1, task="patrol")
    assert [a["label"] for a in found] == ["Snake"]
    ev = events[-1]
    assert ev["type"] == "alert" and ev["label"] == "Snake" and "bedMm" in ev and ev["itemId"] == "item-garden-genesis"
    with pytest.raises(KeyError):
        patrol.approve(found[0]["id"], "burn")  # sightings are not weeds: no laser path
    assert log["laser"] == []
    patrol.ack_alert(found[0]["id"])
    assert events[-1]["status"] == "cleared"
    stressed = patrol.run_passes(1, task="plant_scan")
    assert stressed and all(a["label"] in ("Wilting", "Yellow leaves", "Pest damage") for a in stressed)
    with pytest.raises(ValueError):
        patrol.run_passes(1, task="laser_everything")


def test_service_validates_task_and_acks_sightings():
    published = []
    patrol, _events, _log = make_patrol()
    svc = WeedPatrolService("garden_weeder", patrol, lambda t, b, q, r: published.append((t, b)))
    svc.handle("tc/garden_weeder/cmd/weed", json.dumps({"seq": 1, "action": "pass", "passes": 1, "task": "nope"}))
    assert published[-1][1] == {"seq": 1, "ok": False, "error": "task must be one of weed, plant_scan, patrol"}
    svc.handle("tc/garden_weeder/cmd/weed", json.dumps({"seq": 2, "action": "pass", "passes": 1, "task": "patrol"}))
    svc.wait_idle()
    alert_id = next(iter(patrol.alerts))
    svc.handle("tc/garden_weeder/cmd/event", json.dumps({"seq": 3, "action": "ack", "eventId": alert_id}))
    assert ("tc/garden_weeder/ack", {"seq": 3, "ok": True}) in published
