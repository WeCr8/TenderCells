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
sudo apt install -y python3-picamera2
pip install paho-mqtt
# edit broker IP + id, then:
python3 camera-node/camera_node.py --broker 192.168.1.50 --id pi_cam_01
# stream: http://<pi-ip>:8000/stream
```

Run it on boot:
```bash
sudo mkdir -p /home/pi/tendercells && sudo cp camera-node/camera_node.py /home/pi/tendercells/
echo 'TC_BROKER=192.168.1.50
TC_DEVICE_ID=pi_cam_01' | sudo tee /etc/default/tc-camera-node
sudo cp camera-node/tc-camera-node.service /etc/systemd/system/
sudo systemctl daemon-reload && sudo systemctl enable --now tc-camera-node
```

Then claim `pi_cam_01` in the app (Configure / Claim) — the live feed shows up like any
camera node. Works in demo (LAN) and for logged-in accounts.

## Contracts (shared with ESP32 firmware)
- Heartbeat: `tc/{id}/sensors` `{ "peripheral":"camera", "streamUrl":"http://<ip>:8000/stream", ... }`
- State: `tc/{id}/state` `{ "state":"idle|estop" }`
- E-STOP: subscribes `tc/{id}/cmd/estop` `{ "active":true }`
