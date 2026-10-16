#!/usr/bin/env python3
"""
Tender Cells — Raspberry Pi Camera Node

Turns a Raspberry Pi + Pi Camera into a Tender Cells camera node, using the SAME
contract as the ESP32 camera firmware:
  - serves a live MJPEG stream at  http://<pi-ip>:<port>/stream
  - publishes peripheral="camera" + streamUrl in an MQTT heartbeat to
    tc/{deviceId}/sensors, so the OS auto-registers it and ChickenEye renders the
    feed where placed. No app changes needed — it looks like any camera node.
  - stamps every frame at CAPTURE time (libcamera SensorTimestamp, CLOCK_MONOTONIC)
    plus the matching realtime epoch, and carries seq + stamps in each multipart
    part header (X-Frame-Seq, X-Capture-Mono-Us, X-Capture-Epoch-Us, X-Clock-*).
    Optional sidecar JSONL (--frame-log) writes one line per captured frame.
  - /status reports host clock discipline (adjtimex / chrony), frame stats and
    the realtime-monotonic offset; /time is a cheap probe for offset estimation.

Install (on the Pi):
  sudo apt install -y python3-picamera2 chrony
  pip install paho-mqtt            # 1.x and 2.x both supported
Run:
  python3 camera_node.py --broker 192.168.1.50 --id pi_cam_01

Config via flags or env: TC_BROKER, TC_BROKER_PORT, TC_DEVICE_ID, TC_HTTP_PORT,
TC_PRODUCT, TC_FPS, TC_WIDTH, TC_HEIGHT, TC_FRAME_LOG, TC_CORS_ORIGIN.

LAN-only, no token (yet). CORS: /stream, /status and /healthz are readable only
from the one configured browser origin (--cors-origin, e.g. the relay/UI origin);
blank = no Access-Control-Allow-Origin. /time stays readable from any origin.
Non-browser clients (recorder, relay/ffmpeg, timestamp_audit.py) ignore CORS.
"""

from __future__ import annotations

import argparse
import io
import json
import os
import re
import socket
import sys
import threading
import time
from http import server
from socketserver import ThreadingMixIn
from typing import Callable, Optional

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import camera_timing as ct  # noqa: E402

try:
    from picamera2 import Picamera2
    from picamera2.encoders import MJPEGEncoder
    from picamera2.outputs import Output as _PiOutput
    HAVE_PICAMERA = True
except Exception:  # noqa: BLE001 - Pi-only dependency
    HAVE_PICAMERA = False
    _PiOutput = object

HEARTBEAT_S = 10
DEFAULT_FPS = 30          # matches a 30 Hz control/recording loop (e.g. SO-101 LeRobot)
STALL_TIMEOUT_S = 10.0
IMX296_TRIGGER = "/sys/module/imx296/parameters/trigger_mode"
_ORIGIN_RE = re.compile(r"^https?://[^\s/\"',*]+$")


def normalize_cors_origin(value: Optional[str]) -> str:
    """Return a single scheme://host[:port] origin, or "" (no CORS) if blank."""
    value = (value or "").strip()
    if not value:
        return ""
    if len(value) > 96 or not _ORIGIN_RE.match(value):
        raise ValueError(f"invalid CORS origin {value!r}: use scheme://host[:port], no path, no '*'")
    return value


def lan_ip() -> str:
    """Best-effort primary LAN IP (so the published streamUrl is reachable)."""
    s = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
    try:
        # No packet is sent; this only selects the outbound interface. Works without
        # internet as long as a default route exists.
        s.connect(("8.8.8.8", 80))
        return s.getsockname()[0]
    except Exception:  # noqa: BLE001
        return "127.0.0.1"
    finally:
        s.close()


def stream_host() -> str:
    ip = lan_ip()
    if ip.startswith("127."):
        return f"{socket.gethostname()}.local"   # offline LAN without a default route
    return ip


def default_device_id() -> str:
    """Stable across restarts (the old PID-based default re-registered every boot)."""
    host = re.sub(r"[^A-Za-z0-9_-]", "_", socket.gethostname())[:24] or "pi"
    return f"pi_cam_{host}"


# ── Clock helpers ───────────────────────────────────────────────────────────

def realtime_minus_monotonic_ns(tries: int = 5) -> int:
    """Offset that maps CLOCK_MONOTONIC to CLOCK_REALTIME, from the tightest bracket."""
    best = None
    for _ in range(tries):
        m0 = time.monotonic_ns()
        r = time.time_ns()
        m1 = time.monotonic_ns()
        width = m1 - m0
        off = r - (m0 + m1) // 2
        if best is None or width < best[0]:
            best = (width, off)
    return best[1]


class HostClock:
    """Caches kernel clock-discipline status (cheap to query from handlers)."""

    def __init__(self, refresh_s: float = 10.0,
                 reader: Callable[[], ct.ClockStatus] = ct.read_host_clock_status,
                 chrony: Callable[[], Optional[dict]] = ct.chrony_tracking):
        self._refresh_s = refresh_s
        self._reader = reader
        self._chrony = chrony
        self._lock = threading.Lock()
        self._at = 0.0
        self._status: Optional[ct.ClockStatus] = None
        self._chrony_info: Optional[dict] = None

    def status(self) -> tuple[ct.ClockStatus, Optional[dict]]:
        with self._lock:
            now = time.monotonic()
            if self._status is None or now - self._at > self._refresh_s:
                self._status = self._reader()
                self._chrony_info = self._chrony()
                if self._chrony_info and self._chrony_info.get("synced"):
                    self._status.source = "chrony"
                elif self._status.synced:
                    self._status.source = "ntp"
                self._at = now
            return self._status, self._chrony_info


# ── Frame buffer ────────────────────────────────────────────────────────────

class FrameBuffer(io.BufferedIOBase):
    """Latest JPEG + capture metadata; readers wait for a newer seq."""

    def __init__(self, clock: Optional[HostClock] = None, frame_log: Optional[str] = None):
        super().__init__()
        self.condition = threading.Condition()
        self.frame: Optional[bytes] = None
        self.meta: dict = {}
        self.seq = 0
        self.clock = clock
        self.stamp_source = "none"
        self.last_frame_mono_ns = 0
        self._intervals_ewma_us = 0.0
        self._last_cap_us: Optional[int] = None
        self._log = open(frame_log, "a", buffering=1 << 16) if frame_log else None
        self._log_flushed = time.monotonic()

    def push(self, frame: bytes, capture_mono_ns: Optional[int] = None) -> dict:
        """Publish one frame. capture_mono_ns: sensor timestamp on CLOCK_MONOTONIC."""
        now_mono = time.monotonic_ns()
        source = "sensor"
        if capture_mono_ns is None or capture_mono_ns <= 0 or abs(now_mono - capture_mono_ns) > 1_000_000_000:
            capture_mono_ns = now_mono
            source = "encoder_out"   # fallback: includes ISP/encode latency
        synced = False
        clock_source = "none"
        if self.clock is not None:
            st, _ = self.clock.status()
            synced, clock_source = st.synced, st.source
        epoch_us = (capture_mono_ns + realtime_minus_monotonic_ns(2)) // 1000
        cap_us = capture_mono_ns // 1000
        with self.condition:
            self.seq += 1
            if self._last_cap_us is not None and cap_us > self._last_cap_us:
                iv = cap_us - self._last_cap_us
                self._intervals_ewma_us = iv if not self._intervals_ewma_us else 0.9 * self._intervals_ewma_us + 0.1 * iv
            self._last_cap_us = cap_us
            self.meta = {
                "seq": self.seq,
                "capture_mono_us": cap_us,
                "capture_epoch_us": epoch_us,
                "clock_synced": synced,
                "clock_source": clock_source,
                "size": len(frame),
            }
            self.frame = frame
            self.stamp_source = source
            self.last_frame_mono_ns = now_mono
            meta = dict(self.meta)
            self.condition.notify_all()
        if self._log is not None:
            rec = {"schema": ct.FRAME_SCHEMA, **meta, "stamp_source": source}
            self._log.write(json.dumps(rec, separators=(",", ":")) + "\n")
            if time.monotonic() - self._log_flushed > 1.0:
                self._log.flush()
                self._log_flushed = time.monotonic()
        return meta

    def write(self, buf):  # FileOutput compatibility (no sensor stamp available)
        self.push(bytes(buf))
        return len(buf)

    def wait_newer(self, last_seq: int, timeout: float) -> Optional[tuple[bytes, dict]]:
        with self.condition:
            if not self.condition.wait_for(lambda: self.seq != last_seq and self.frame is not None, timeout):
                return None
            return self.frame, dict(self.meta)

    def measured_fps(self) -> Optional[float]:
        return round(1e6 / self._intervals_ewma_us, 2) if self._intervals_ewma_us else None

    def close(self):
        if self._log is not None:
            self._log.flush()
            self._log.close()
            self._log = None
        super().close()


class TimestampedOutput(_PiOutput):
    """picamera2 Output that forwards the encoder's per-frame sensor timestamp.

    picamera2 passes timestamps relative to the first frame (µs); the absolute
    SensorTimestamp of that first frame is kept on the encoder as firsttimestamp.
    """

    def __init__(self, buffer: FrameBuffer, encoder=None):
        if HAVE_PICAMERA:
            super().__init__()
        self.buffer = buffer
        self.encoder = encoder

    def outputframe(self, frame, keyframe=True, timestamp=None, *args, **kwargs):
        cap_ns = None
        first = getattr(self.encoder, "firsttimestamp", None) if self.encoder is not None else None
        if timestamp is not None and first is not None:
            cap_ns = (int(first) + int(timestamp)) * 1000
        self.buffer.push(bytes(frame), cap_ns)


# ── HTTP ────────────────────────────────────────────────────────────────────

class StreamingHandler(server.BaseHTTPRequestHandler):
    output: FrameBuffer = None            # set by make_server
    status_fn: Callable[[], dict] = None
    frame_timeout_s: float = 5.0
    cors_origin: str = ""                 # "" = no CORS header (same-origin/non-browser only)
    protocol_version = "HTTP/1.0"

    def _cors(self, public: bool = False, expose: Optional[str] = None):
        if public:
            self.send_header("Access-Control-Allow-Origin", "*")
            return
        if not self.cors_origin:
            return
        self.send_header("Access-Control-Allow-Origin", self.cors_origin)
        self.send_header("Vary", "Origin")
        if expose:
            self.send_header("Access-Control-Expose-Headers", expose)

    def _json(self, obj: dict, code: int = 200, public: bool = False):
        body = json.dumps(obj, separators=(",", ":")).encode()
        self.send_response(code)
        self.send_header("Content-Type", "application/json")
        self.send_header("Content-Length", str(len(body)))
        self.send_header("Cache-Control", "no-store")
        self._cors(public)
        self.end_headers()
        self.wfile.write(body)

    def do_GET(self):
        path = self.path.split("?", 1)[0]
        if path == "/time":
            mono = time.monotonic_ns() // 1000
            epoch = time.time_ns() // 1000
            st = self.output.clock.status()[0] if self.output.clock else None
            self._json({"monoUs": mono, "epochUs": epoch, "synced": bool(st and st.synced)}, public=True)
            return
        if path in ("/status", "/healthz"):
            st = self.status_fn() if self.status_fn else {}
            code = 200 if path == "/status" or st.get("healthy", True) else 503
            self._json(st, code)
            return
        if path not in ("/stream", "/"):
            self.send_error(404)
            return
        self.send_response(200)
        self.send_header("Age", "0")
        self.send_header("Cache-Control", "no-cache, private")
        self._cors(expose="X-Frame-Seq, X-Capture-Epoch-Us")
        self.send_header("Content-Type", "multipart/x-mixed-replace; boundary=FRAME")
        self.end_headers()
        last = self.output.seq
        stream_seq = 0
        try:
            while True:
                got = self.output.wait_newer(last, self.frame_timeout_s)
                if got is None:
                    break   # camera stalled: end the response instead of hanging forever
                frame, meta = got
                last = meta["seq"]
                stream_seq += 1
                headers = ct.build_part_headers(
                    len(frame), meta["seq"], stream_seq, meta["capture_mono_us"],
                    meta["capture_epoch_us"], meta["clock_synced"], meta["clock_source"])
                buf = [b"--FRAME\r\n"]
                buf += [f"{k}: {v}\r\n".encode("latin-1") for k, v in headers.items()]
                buf.append(b"\r\n")
                self.wfile.write(b"".join(buf))
                self.wfile.write(frame)
                self.wfile.write(b"\r\n")
        except (BrokenPipeError, ConnectionResetError):
            pass

    def log_message(self, *_):  # silence per-request logging
        pass


class ThreadingHTTPServer(ThreadingMixIn, server.HTTPServer):
    allow_reuse_address = True
    daemon_threads = True


def make_server(http_port: int, output: FrameBuffer, status_fn: Callable[[], dict],
                frame_timeout_s: float = 5.0, cors_origin: str = "") -> ThreadingHTTPServer:
    handler = type("TCStreamingHandler", (StreamingHandler,), {
        "output": output, "status_fn": staticmethod(status_fn), "frame_timeout_s": frame_timeout_s,
        "cors_origin": normalize_cors_origin(cors_origin)})
    return ThreadingHTTPServer(("", http_port), handler)


def read_trigger_mode(path: str = IMX296_TRIGGER) -> Optional[int]:
    try:
        with open(path) as fh:
            return int(fh.read().strip())
    except (OSError, ValueError):
        return None


def build_status(device_id: str, output: FrameBuffer, args, started_mono: float,
                 camera_ok: bool) -> dict:
    st, chrony = output.clock.status() if output.clock else (ct.ClockStatus(False, "unknown"), None)
    age_s = (time.monotonic_ns() - output.last_frame_mono_ns) / 1e9 if output.last_frame_mono_ns else None
    healthy = camera_ok and age_s is not None and age_s < STALL_TIMEOUT_S
    trig = read_trigger_mode()
    return {
        "deviceId": device_id,
        "node": "camera",
        "firmware": "pi-camera-node",
        "healthy": healthy,
        "uptimeS": round(time.monotonic() - started_mono, 1),
        "camera": {
            "available": camera_ok,
            "width": args.width, "height": args.height,
            "targetFps": args.fps,
            "measuredFps": output.measured_fps(),
            "frameSeq": output.seq,
            "lastFrameAgeMs": round(age_s * 1000, 1) if age_s is not None else None,
            "captureStamp": output.stamp_source,
        },
        "clock": {
            "synced": st.synced,
            "source": st.source,
            "estErrorUs": st.est_error_us,
            "maxErrorUs": st.max_error_us,
            "kernelOffsetUs": st.offset_us,
            "realtimeMinusMonotonicUs": realtime_minus_monotonic_ns() // 1000,
            "chrony": chrony,
        },
        "trigger": {
            "imx296TriggerMode": trig,   # 1 = external XTR trigger armed (global-shutter cam)
            "exposureTrigger": trig == 1,
        },
        "frameLog": args.frame_log or None,
        "corsOrigin": getattr(args, "cors_origin", "") or None,
    }


def start_camera(output: FrameBuffer, width: int, height: int, fps: int) -> bool:
    if not HAVE_PICAMERA:
        print("[CAM] picamera2 not available — install python3-picamera2. "
              "Serving /status and an idle /stream for now.")
        return False
    cam = Picamera2()
    cfg = cam.create_video_configuration(main={"size": (width, height)},
                                         controls={"FrameRate": float(fps)})
    cam.configure(cfg)
    enc = MJPEGEncoder()
    cam.start_recording(enc, TimestampedOutput(output, enc))
    print(f"[CAM] Pi camera {width}x{height}@{fps}fps")
    return True


def make_mqtt_client(client_id: str):
    import paho.mqtt.client as mqtt

    # paho-mqtt 2.x requires the callback API version; 1.x has no such enum.
    api = getattr(mqtt, "CallbackAPIVersion", None)
    if api is not None:
        return mqtt.Client(api.VERSION2, client_id=client_id)
    return mqtt.Client(client_id=client_id)


def main():
    p = argparse.ArgumentParser()
    p.add_argument("--broker", default=os.getenv("TC_BROKER", "localhost"))
    p.add_argument("--broker-port", type=int, default=int(os.getenv("TC_BROKER_PORT", "1883")))
    p.add_argument("--id", default=os.getenv("TC_DEVICE_ID", default_device_id()))
    p.add_argument("--http-port", type=int, default=int(os.getenv("TC_HTTP_PORT", "8000")))
    p.add_argument("--product", default=os.getenv("TC_PRODUCT", "watchtower"))
    p.add_argument("--fps", type=int, default=int(os.getenv("TC_FPS", str(DEFAULT_FPS))))
    p.add_argument("--width", type=int, default=int(os.getenv("TC_WIDTH", "1280")))
    p.add_argument("--height", type=int, default=int(os.getenv("TC_HEIGHT", "720")))
    p.add_argument("--frame-log", default=os.getenv("TC_FRAME_LOG", ""),
                   help="append one JSON line per captured frame (seq + capture stamps)")
    p.add_argument("--cors-origin", default=os.getenv("TC_CORS_ORIGIN", ""),
                   help="relay/UI browser origin allowed to read /stream and /status "
                        "(scheme://host[:port]); blank = none. /time is always public")
    args = p.parse_args()
    try:
        args.cors_origin = normalize_cors_origin(args.cors_origin)
    except ValueError as exc:
        p.error(str(exc))
    args.fps = max(1, min(args.fps, 120))

    started = time.monotonic()
    clock = HostClock()
    output = FrameBuffer(clock, args.frame_log or None)
    camera_ok = start_camera(output, args.width, args.height, args.fps)

    def status_fn():
        return build_status(args.id, output, args, started, camera_ok)

    srv = make_server(args.http_port, output, status_fn, cors_origin=args.cors_origin)
    threading.Thread(target=srv.serve_forever, daemon=True).start()
    host = stream_host()
    stream_url = f"http://{host}:{args.http_port}/stream"
    status_url = f"http://{host}:{args.http_port}/status"

    client = make_mqtt_client(f"tc-picam-{args.id}")
    estop = {"active": False}

    def on_connect(c, *_):
        c.subscribe(f"tc/{args.id}/cmd/estop", qos=1)
        c.publish(f"tc/{args.id}/state", json.dumps({"state": "idle", "ts": int(time.time())}), qos=1)

    def on_message(_c, _u, msg):
        try:
            estop["active"] = bool(json.loads(msg.payload).get("active"))
        except Exception:  # noqa: BLE001
            pass

    client.on_connect = on_connect
    client.on_message = on_message
    client.reconnect_delay_set(min_delay=1, max_delay=30)
    # connect_async: a broker that is down at boot no longer crashes the service.
    client.connect_async(args.broker, args.broker_port, keepalive=60)
    client.loop_start()
    print(f"[NET] heartbeat -> tc/{args.id}/sensors  stream {stream_url}  status {status_url}")

    try:
        next_hb = 0.0
        while True:
            now = time.monotonic()
            if camera_ok and output.last_frame_mono_ns and \
                    (time.monotonic_ns() - output.last_frame_mono_ns) / 1e9 > STALL_TIMEOUT_S:
                print("[CAM] no frames for >%ss — exiting so systemd restarts the camera" % STALL_TIMEOUT_S)
                sys.exit(3)
            if now >= next_hb:
                next_hb = now + HEARTBEAT_S
                st, _ = clock.status()
                client.publish(f"tc/{args.id}/sensors", json.dumps({
                    "node": "camera",
                    "productType": args.product,
                    "peripheral": "camera",
                    "streamUrl": stream_url,
                    "statusUrl": status_url,
                    "fps": args.fps,
                    "resolution": f"{args.height}p",
                    "clockSynced": st.synced,
                    "clockSource": st.source,
                    "epochMs": time.time_ns() // 1_000_000,
                    "ts": int(time.time()),
                }))
                client.publish(f"tc/{args.id}/state", json.dumps({
                    "state": "estop" if estop["active"] else "idle",
                    "ts": int(time.time()),
                }), qos=1)
            time.sleep(0.5)
    except KeyboardInterrupt:
        pass
    finally:
        client.loop_stop()
        output.close()


if __name__ == "__main__":
    main()
