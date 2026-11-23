"""Tests for gantry_controller_proposed.py using a fake Jetson.GPIO. Run: python -m unittest test_gantry_proposed -v"""
import sys
import types
import threading
import time
import unittest

# fake GPIO + stop sleeping so tests are fast
fake = types.ModuleType("Jetson.GPIO")
fake.BOARD, fake.OUT, fake.HIGH, fake.LOW = "BOARD", "OUT", 1, 0
fake.pulses = {}
fake.levels = {}
fake.setmode = lambda *a, **k: None
fake.setup = lambda *a, **k: None


def _output(pin, level):
    fake.levels[pin] = level
    if level == 1:
        fake.pulses[pin] = fake.pulses.get(pin, 0) + 1


fake.output = _output
pkg = types.ModuleType("Jetson")
pkg.GPIO = fake
sys.modules["Jetson"], sys.modules["Jetson.GPIO"] = pkg, fake

import gantry_controller_proposed as G  # noqa: E402

G.time.sleep = lambda s: None


def make():
    g = G.GantryController()
    assert g.connect()
    fake.pulses.clear()
    return g


class GantryTests(unittest.TestCase):
    def test_normal_move_updates_position_by_steps(self):
        g = make()
        self.assertTrue(g.move_joints([10, 0, 0], 0.5))
        self.assertEqual(g.position[0], 10.0)

    def test_sub_step_move_does_not_drift_position(self):
        g = make()
        g.mm_per_step = 1.0
        g.move_joints([0.4, 0, 0], 0.5)          # less than one step: nothing moves, position must not change
        self.assertEqual(g.position[0], 0.0)

    def test_limit_refused_without_partial_move(self):
        g = make()
        with self.assertRaises(ValueError):
            g.move_joints([10, 5000, 0], 0.5)    # Y out of range: X must not have moved either
        self.assertEqual(g.position, [0.0, 0.0, 0.0])
        self.assertFalse(any(fake.pulses.values()))

    def test_zero_and_huge_speed(self):
        g = make()
        with self.assertRaises(ValueError):
            g.move_joints([5, 0, 0], 0)
        self.assertTrue(g.move_joints([5, 0, 0], 1e9))   # clamped, no zero step delay
    def test_estop_before_move_refused(self):
        g = make()
        g.estop()
        with self.assertRaises(RuntimeError):
            g.move_joints([5, 0, 0], 0.5)

    def test_estop_mid_move_stops_at_next_step(self):
        g = make()
        count = {"n": 0}
        orig = fake.output

        def trip(pin, level):
            orig(pin, level)
            if level == 1 and pin == g.motors["X"]["pul"]:
                count["n"] += 1
                if count["n"] == 50:
                    g.estop_active = True
        fake.output = trip
        G.GPIO.output = trip
        try:
            with self.assertRaises(RuntimeError):
                g.move_joints([500, 0, 0], 0.5)
        finally:
            fake.output = orig
            G.GPIO.output = orig
        self.assertEqual(count["n"], 50)               # stopped immediately, not after 500 steps
        self.assertEqual(g.position[0], 50.0)

    def test_clear_estop_reenables(self):
        g = make()
        g.estop()
        self.assertEqual(fake.levels[g.motors["X"]["ena"]], 0)
        g.clear_estop()
        self.assertEqual(fake.levels[g.motors["X"]["ena"]], 1)
        self.assertTrue(g.move_joints([3, 0, 0], 0.5))


if __name__ == "__main__":
    unittest.main()
