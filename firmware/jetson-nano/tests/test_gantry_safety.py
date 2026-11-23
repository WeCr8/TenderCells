"""Safety tests for GantryController (fake Jetson.GPIO, no hardware): E-STOP polled inside the step loop, travel limits refuse without partial moves, speed clamps,
position follows the steps actually taken, explicit E-STOP clear. Run: python -m unittest tests.test_gantry_safety   (from firmware/jetson-nano)"""
import sys
import types
import unittest
from pathlib import Path
from unittest import mock

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))
import gantry_controller as G  # noqa: E402


class FakeGPIO(types.SimpleNamespace):
    def __init__(self):
        super().__init__(BOARD="BOARD", OUT="OUT", HIGH=1, LOW=0, levels={}, pulses={})

    def setmode(self, *a, **k):
        pass

    def setup(self, *a, **k):
        pass

    def output(self, pin, level):
        self.levels[pin] = level
        if level == 1:
            self.pulses[pin] = self.pulses.get(pin, 0) + 1


class GantrySafety(unittest.TestCase):
    def setUp(self):
        self.gpio = FakeGPIO()
        self.patches = [mock.patch.object(G, "GPIO", self.gpio), mock.patch.object(G.time, "sleep", lambda s: None), mock.patch("builtins.print")]
        for p in self.patches:
            p.start()
        self.g = G.GantryController()
        self.assertTrue(self.g.connect())
        self.gpio.pulses.clear()          # connect() raises the enable pins; count only step pulses from here

    def tearDown(self):
        for p in self.patches:
            p.stop()

    def test_move_updates_position_by_steps(self):
        self.assertTrue(self.g.move_joints([10, 0, 0], 0.5))
        self.assertEqual(self.g.position[0], 10.0)

    def test_sub_step_move_does_not_drift(self):
        self.g.move_joints([0.4, 0, 0], 0.5)
        self.assertEqual(self.g.position[0], 0.0)

    def test_limit_refused_without_partial_move(self):
        with self.assertRaises(ValueError):
            self.g.move_joints([10, 5000, 0], 0.5)
        self.assertEqual(self.g.position, [0.0, 0.0, 0.0])
        self.assertFalse(any(self.gpio.pulses.values()))

    def test_zero_speed_rejected_and_huge_speed_clamped(self):
        with self.assertRaises(ValueError):
            self.g.move_joints([5, 0, 0], 0)
        self.assertTrue(self.g.move_joints([5, 0, 0], 1e9))

    def test_estop_before_move_refused(self):
        self.g.estop()
        with self.assertRaises(RuntimeError):
            self.g.move_joints([5, 0, 0], 0.5)

    def test_estop_mid_move_stops_at_next_step(self):
        pul = self.g.motors["X"]["pul"]
        count = {"n": 0}
        real = self.gpio.output

        def trip(pin, level):
            real(pin, level)
            if level == 1 and pin == pul:
                count["n"] += 1
                if count["n"] == 50:
                    self.g.estop_active = True
        self.gpio.output = trip
        with self.assertRaises(RuntimeError):
            self.g.move_joints([500, 0, 0], 0.5)
        self.assertEqual(count["n"], 50)
        self.assertEqual(self.g.position[0], 50.0)

    def test_clear_estop_reenables(self):
        self.g.estop()
        self.assertEqual(self.gpio.levels[self.g.motors["X"]["ena"]], 0)
        self.g.clear_estop()
        self.assertEqual(self.gpio.levels[self.g.motors["X"]["ena"]], 1)
        self.assertTrue(self.g.move_joints([3, 0, 0], 0.5))


if __name__ == "__main__":
    unittest.main()
