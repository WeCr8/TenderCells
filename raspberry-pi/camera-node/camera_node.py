#!/usr/bin/env python3
"""
Tender Cells — Raspberry Pi Camera Node

Turns a Raspberry Pi + Pi Camera into a Tender Cells camera node, using the SAME
contract as the ESP32 camera firmware:
  - serves a live MJPEG stream at  http://<pi-ip>:<port>/stream
  - publishes peripheral="camera" + streamUrl in an MQTT heartbeat to
    tc/{deviceId}/sensors, so the OS auto-registers it and ChickenEye renders the
    feed where placed. No app changes needed — it looks like any camera node.

Install (on the Pi):
  sudo apt install -y python3-picamera2 mosquitto-clients
  pip install paho-mqtt
Run:
  python3 camera_node.py --broker 192.168.1.50 --id pi_cam_01
  (leave --broker blank to use mDNS-discovered broker if you wire that in)

Config via flags or env: TC_BROKER, TC_BROKER_PORT, TC_DEVICE_ID, TC_HTTP_PORT.
"""

import argparse
import io
import json
import os
import socket
import threading
import time
from http import server
from socketserver import ThreadingMixIn

import paho.mqtt.client as mqtt

try:
    from picamera2 import Picamera2
    from picamera2.encoders import MJPEGEncoder
    from picamera2.outputs import FileOutput
    HAVE_PICAMERA = True
except Exception:  # noqa: BLE001 - Pi-only dependency
    HAVE_PICAMERA = False

HEARTBEAT_S = 10


def lan_ip() -> str:
    """Best-effort primary LAN IP (so the published streamUrl is reachable)."""
    s = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
    try:
        s.connect(("8.8.8.8", 80))
        return s.getsockname()[0]
    except Exception:  # noqa: BLE001
        return "127.0.0.1"
    finally:
        s.close()


class StreamingOutput(io.BufferedIOBase):
    """Holds the latest JPEG frame; readers wait on a condition."""

    def __init__(self):
        self.frame = None
        self.condition = threading.Condition()

    def write(self, buf):
        with self.condition:
            self.frame = buf
            self.condition.notify_all()


class StreamingHandler(server.BaseHTTPRequestHandler):
    output: StreamingOutput = None  # set on the server class

    def do_GET(self):
        if self.path not in ("/stream", "/"):
            self.send_error(404)
            return
        self.send_response(200)
        self.send_header("Age", "0")
        self.send_header("Cache-Control", "no-cache, private")
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Content-Type", "multipart/x-mixed-replace; boundary=FRAME")
        self.end_headers()
        try:
            while True:
                with self.output.condition:
                    self.output.condition.wait()
                    frame = self.output.frame
                self.wfile.write(b"--FRAME\r\n")
                self.send_header("Content-Type", "image/jpeg")
                self.send_header("Content-Length", str(len(frame)))
                self.end_headers()
                self.wfile.write(frame)
                self.wfile.write(b"\r\n")
        except Exception:  # noqa: BLE001 - client disconnected
            pass

    def log_message(self, *_):  # silence per-request logging
        pass


class ThreadingHTTPServer(ThreadingMixIn, server.HTTPServer):
    allow_reuse_address = True
    daemon_threads = True


def start_stream(http_port: int) -> StreamingOutput:
    output = StreamingOutput()
    if HAVE_PICAMERA:
        cam = Picamera2()
        cam.configure(cam.create_video_configuration(main={"size": (1280, 720)}))
        cam.start_recording(MJPEGEncoder(), FileOutput(output))
        print(f"[CAM] Pi camera streaming at :{http_port}/stream")
    else:
        print("[CAM] picamera2 not available — install python3-picamera2. "
              "Serving an empty stream endpoint for now.")
    StreamingHandler.output = output
    srv = ThreadingHTTPServer(("", http_port), StreamingHandler)
    threading.Thread(target=srv.serve_forever, daemon=True).start()
    return output


def main():
    p = argparse.ArgumentParser()
    p.add_argument("--broker", default=os.getenv("TC_BROKER", "localhost"))
    p.add_argument("--broker-port", type=int, default=int(os.getenv("TC_BROKER_PORT", "1883")))
    p.add_argument("--id", default=os.getenv("TC_DEVICE_ID", f"pi_cam_{os.getpid() & 0xffff:04x}"))
    p.add_argument("--http-port", type=int, default=int(os.getenv("TC_HTTP_PORT", "8000")))
    p.add_argument("--product", default=os.getenv("TC_PRODUCT", "watchtower"))
    args = p.parse_args()

    start_stream(args.http_port)
    stream_url = f"http://{lan_ip()}:{args.http_port}/stream"

    client = mqtt.Client(client_id=f"tc-picam-{args.id}")
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
    client.connect(args.broker, args.broker_port, keepalive=60)
    client.loop_start()
    print(f"[NET] heartbeat -> tc/{args.id}/sensors  stream {stream_url}")

    try:
        while True:
            client.publish(f"tc/{args.id}/sensors", json.dumps({
                "node": "camera",
                "productType": args.product,
                "peripheral": "camera",
                "streamUrl": stream_url,
                "ts": int(time.time()),
            }))
            client.publish(f"tc/{args.id}/state", json.dumps({
                "state": "estop" if estop["active"] else "idle",
                "ts": int(time.time()),
            }), qos=1)
            time.sleep(HEARTBEAT_S)
    except KeyboardInterrupt:
        client.loop_stop()


if __name__ == "__main__":
    main()
