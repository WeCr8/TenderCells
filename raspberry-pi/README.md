# Raspberry Pi — Tender Cells Roles

A Raspberry Pi can play two roles in the Tender Cells stack, both using the same
contracts as the ESP32 firmware (local MQTT, mDNS discovery, the camera streamUrl
heartbeat). No app changes needed.

## 1. Pi as the MQTT broker (local control hub)
The on-LAN broker that boards + the app talk to (alternative to express-api's embedded
broker). Motion control stays local — never cloud.

```bash
sudo apt install -y mosquitto mosquitto-clients avahi-daemon
sudo cp broker/mosquitto.conf /etc/mosquitto/conf.d/tendercells.conf
sudo cp broker/mqtt-mdns.service /etc/avahi/services/mqtt.service
sudo systemctl enable --now mosquitto
sudo systemctl restart avahi-daemon
```

mDNS advertises `_mqtt._tcp` on :1883, so a flashed board with the **broker IP left
blank** auto-finds the Pi (no IP typing — the #1 classroom stumble). Point the app's
`VITE_MQTT_API_BASE_URL` / `MQTT_BROKER` at the Pi if running express-api elsewhere.

## 2. Pi as a camera node (Pi Camera → ChickenEye)
Streams MJPEG and advertises its `streamUrl` exactly like the ESP32 camera firmware,
so it auto-registers and renders in ChickenEye where placed.

```bash
sudo apt install -y python3-picamera2 chrony
pip install paho-mqtt            # 1.x or 2.x
# edit broker IP + id, then:
python3 camera-node/camera_node.py --broker 192.168.1.50 --id pi_cam_01 --fps 30
# stream: http://<pi-ip>:8000/stream   status: http://<pi-ip>:8000/status
```

Each MJPEG part carries capture-time stamps (`X-Frame-Seq`, `X-Capture-Mono-Us`,
`X-Capture-Epoch-Us`, `X-Clock-Synced`); `/status` reports clock sync quality and
`/time` is a probe for offset estimation. Before a data-collection session run the
60 s audit (see [docs/CAMERA_TIMING.md](../docs/CAMERA_TIMING.md)):

```bash
python3 camera-node/timestamp_audit.py http://<pi-ip>:8000/stream --out audit.json \
    --profile-out jitter_profile.json --sidecar frames.jsonl
```

Run it on boot:
```bash
sudo mkdir -p /home/pi/tendercells && sudo cp camera-node/camera_node.py camera-node/camera_timing.py /home/pi/tendercells/
echo 'TC_BROKER=192.168.1.50
TC_DEVICE_ID=pi_cam_01
# optional: the one browser origin (relay/UI) allowed to read /stream and /status
# TC_CORS_ORIGIN=https://relay.example:8443' | sudo tee /etc/default/tc-camera-node
sudo cp camera-node/tc-camera-node.service /etc/systemd/system/
sudo systemctl daemon-reload && sudo systemctl enable --now tc-camera-node
```

Then claim `pi_cam_01` in the app (Configure / Claim) — the live feed shows up like any
camera node. Works in demo (LAN) and for logged-in accounts.

## Contracts (shared with ESP32 firmware)
- Heartbeat: `tc/{id}/sensors` `{ "peripheral":"camera", "streamUrl":"http://<ip>:8000/stream", "statusUrl":..., "fps":30, "clockSynced":true, ... }`
- Frame timing headers + `/status` + `/time`: [docs/CAMERA_TIMING.md](../docs/CAMERA_TIMING.md)
- LAN-only, no token yet. CORS: `/stream`, `/status`, `/healthz` only for `--cors-origin`
  (blank = none); `/time` is readable from any origin.

Tests (no Pi needed): `cd camera-node && python3 -m pytest -q tests && ruff check --config ruff.toml .`
- State: `tc/{id}/state` `{ "state":"idle|estop" }`
- E-STOP: subscribes `tc/{id}/cmd/estop` `{ "active":true }`
