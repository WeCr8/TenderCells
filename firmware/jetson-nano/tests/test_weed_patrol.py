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
