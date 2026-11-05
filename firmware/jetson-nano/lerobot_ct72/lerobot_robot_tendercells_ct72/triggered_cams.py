"""Hardware-triggered global-shutter cameras (one trigger line from the XIAO cell-IO node, 30 Hz).

Plus (Pi 5): Raspberry Pi Global Shutter Camera (IMX296) in external-trigger mode (XTR pad, 1.8 V logic via a
74LVC1T45 level shifter; enable with the imx296 trigger setting documented by Raspberry Pi), read with picamera2.
Each request's SensorTimestamp (ns) is the exposure start of THAT triggered frame, mapped to the host monotonic clock.
Pro (Jetson): Arducam OV9281 with its external-trigger input, read through the vendor V4L2 driver; the
driver timestamp is used the same way. Untested on hardware in this scaffold - see README for the bring-up checks.
"""
from __future__ import annotations

from typing import Dict, Tuple


class TriggeredCam:  # pragma: no cover - hardware
    def __init__(self, index: int, fps: int):
        from picamera2 import Picamera2
        self.cam = Picamera2(index)
        cfg = self.cam.create_video_configuration(main={"size": (640, 480), "format": "RGB888"},
                                                   controls={"FrameDurationLimits": (int(1e6 / fps), int(1e6 / fps))})
        self.cam.configure(cfg)
        self.cam.start()

    def read_with_stamp(self) -> Tuple[object, int]:
        req = self.cam.capture_request()
        try:
            img = req.make_array("main")
            t = int(req.get_metadata()["SensorTimestamp"])
        finally:
            req.release()
        return img, t

    def close(self) -> None:
        self.cam.stop()


def open_triggered_cams(names, fps: int) -> Dict[str, TriggeredCam]:  # pragma: no cover
    return {n: TriggeredCam(i, fps) for i, n in enumerate(names)}
