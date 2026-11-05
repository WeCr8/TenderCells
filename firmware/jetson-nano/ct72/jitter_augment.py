"""Inject the MEASURED timing jitter into sim and training (rev A1.2 sim-to-real rule), so a policy never learns a
perfect-sync shortcut. The profile comes from the pre-session timestamp audit (timing.jitter_profile).

  * frame lag: each camera frame is replaced by a frame k steps older with the measured lag distribution
  * state lag: the joint/gantry state is linearly interpolated back by a lag drawn from the bus-read profile
  * drops: a frame is held (repeated) with the measured drop probability
Pure Python (random module) so it plugs into a LeRobot dataset transform or the MuJoCo sim loop.
"""
from __future__ import annotations

import json
import random
from typing import List, Optional, Sequence


class JitterInjector:
    def __init__(self, profile: dict, fps: int = 30, drop_p: float = 0.0, seed: Optional[int] = None):
        self.p = profile.get("channels", {})
        self.dt_us = 1e6 / fps
        self.drop_p = drop_p
        self.rng = random.Random(seed)

    @classmethod
    def from_file(cls, path: str, **kw) -> "JitterInjector":
        with open(path) as f:
            return cls(json.load(f), **kw)

    def _lag_us(self, ch: str) -> float:
        c = self.p.get(ch)
        if not c:
            return 0.0
        return max(0.0, self.rng.gauss(c["mean_us"], c["std_us"]))

    def frame_index(self, i: int, ch: str = "camera_latency") -> int:
        """Index of the frame actually seen at control step i (lagged and maybe held)."""
        if i > 0 and self.rng.random() < self.drop_p:
            i -= 1
        return max(0, i - int(round(self._lag_us(ch) / self.dt_us)))

    def lag_state(self, history: Sequence[Sequence[float]], i: int, ch: str = "joint_read") -> List[float]:
        """Joint/gantry state at step i delayed by a sampled lag (linear interpolation between steps)."""
        lag = self._lag_us(ch) / self.dt_us
        j = max(0.0, i - lag)
        a = int(j); b = min(len(history) - 1, a + 1); f = j - a
        return [x + (y - x) * f for x, y in zip(history[a], history[b])]
