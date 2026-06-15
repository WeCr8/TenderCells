# Connect a Device

How to run a real, working Tender Cells device path — with **no hardware**, with a
**virtual device**, or with your **own ESP32**. This is the path schools, developers,
and curious users take to actually use the platform end to end.

> Tender Cells is concept-stage. This runbook is the live, runnable control plane:
> a device publishes sensors, the bridge ingests them, the dashboard / REST reads
> them, and commands flow back down to the device. It is real software you can run
> today on a laptop.

---

## The whole picture

```
  device  ──MQTT publish──▶  broker  ──▶  express-api bridge  ──▶  REST / dashboard
 (real or                  (embedded               (caches per-device
  virtual)                  or Mosquitto)           telemetry, state, alerts)
     ▲                                                      │
     └──────────────── MQTT cmd/* ◀── broker ◀── POST /api/mqtt/... ┘
```

- **Broker** — message bus. The API ships an **embedded broker** (aedes) so you do
  not have to install Mosquitto. Set `EMBED_BROKER=0` to use an external one.
- **Bridge** — `express-api` subscribes to `tc/+/sensors|state|alert`, caches the
  latest per device, and exposes REST. Commands POSTed to REST are published to
  `tc/{id}/cmd/*`.
- **Device** — anything that speaks the MQTT topics below: the virtual simulator, or
  real ESP32 firmware.

Motion/sensor data **never** routes through Firebase — MQTT is the control path.

---

## Quick start (zero hardware, ~2 minutes)

```bash
cd applications/tendercells_ui/test_output/express-api
npm install
npm run dev          # starts embedded broker (:1883) + API (:4000)
```

In a second terminal, start a virtual device:

```bash
cd applications/tendercells_ui/test_output/express-api
npm run simulate                 # device id "sim_001", publishes every 10s
# or: node tools/simulate-device.mjs --id coop_demo --interval 3
```

In a third terminal, read it back and send a command:

```bash
# live sensor data
curl http://localhost:4000/api/mqtt/devices/sim_001/telemetry

# open the door — watch the simulator terminal react, then re-read state
curl -X POST http://localhost:4000/api/mqtt/devices/sim_001/door \
  -H "Content-Type: application/json" -d '{"state":"open"}'

curl http://localhost:4000/api/mqtt/devices/sim_001/state
```

`doorState` flips `closed → open`. That is the full loop: command → broker → device →
state → REST.

### Or use the `tc` CLI (for advanced users and agents)

`curl` works, but the repo ships a real CLI — `tools/tc.mjs` — that wraps every
endpoint, prints human output by default, and prints machine JSON + meaningful exit
codes under `--json`. That last part is the point for **agent control**: an AI agent
or shell script can call `tc … --json`, parse the result, and branch on the exit code
(0 ok, 1 command/validation error, 2 API unreachable).

```bash
# from express-api/ (server must be running)
npm run tc -- status                 # broker + known devices
npm run tc -- telemetry sim_001
npm run tc -- door sim_001 open
npm run tc -- feed sim_001 100
npm run tc -- arm sim_001 --joints 0,45,90,0,45,0 --speed 0.3
npm run tc -- estop sim_001          # emergency stop
npm run tc -- watch sim_001          # live poll

# install it as a global `tc` command:
npm link        # then:  tc status   /   tc door sim_001 open

# agent / script style — JSON out, exit code in:
tc telemetry sim_001 --json          # {"deviceId":...,"data":{...}}  exit 0
tc door sim_001 sideways --json      # {"ok":false,"error":...}       exit 1
TC_API=http://coop.local:4000 tc status --json   # target a remote API
```

Full command list: `tc help`. The CLI only ever calls the REST API, so it honors the
same MQTT control path and safety rules — `tc estop` cuts motion via the retained
E-STOP topic just like the dashboard's E-STOP button.

### Prove it in one shot

```bash
npm run dev          # terminal 1
npm run smoke        # terminal 2  → "✓ SMOKE PASS" exit 0, or exit 1 if broken
```

`smoke` publishes a sensor reading and asserts the REST endpoint returns it. Good for
CI or a "is my setup working" check.

---

## Port already in use?

The API defaults to **:4000** and the broker to **:1883**. Override either:

```bash
PORT=4100 npm run dev                      # API on 4100
MQTT_PORT=1884 npm run dev                 # embedded broker on 1884
```

On some Windows machines (Hyper-V / WSL) a port can be invisibly reserved by the OS —
`netstat` shows nothing yet bind fails with `EADDRINUSE`. Just pick another `PORT`.
When you change `PORT`, pass it to the test tools too:

```bash
PORT=4100 npm run smoke
API_BASE=http://localhost:4100 npm run smoke
```

---

## Use a real broker (Mosquitto)

For a real deployment (e.g. Mosquitto on a Raspberry Pi), turn the embedded broker off
and point the bridge at the real one:

```bash
EMBED_BROKER=0 MQTT_BROKER=mqtt://192.168.1.50:1883 npm run dev
```

If the embedded broker finds its port already taken it steps aside automatically and
uses whatever broker is already running there.

---

## Bring your own ESP32

Your firmware is a "device" the moment it speaks these topics. Match the schemas
exactly (see `CLAUDE.md §4` for the firmware-side contract and safety rules).

### Topics

| Topic | Dir | QoS | Payload |
|---|---|---|---|
| `tc/{id}/sensors` | device → | 0 | `{"temp":67.2,"humidity":72,"ammonia":4,"feedLevel":80,"waterLevel":56,"chickenCount":3,"doorState":"closed","ts":...}` |
| `tc/{id}/state` | device → | 1 | `{"state":"idle","doorState":"closed","uptime":3600,"ts":...}` |
| `tc/{id}/alert` | device → | 2 | `{"type":"predator","confidence":0.87,"ts":...}` |
| `tc/{id}/cmd/door` | → device | 1 | `{"state":"open"\|"close"}` |
| `tc/{id}/cmd/feed` | → device | 1 | `{"amount":100}` |
| `tc/{id}/cmd/clean` | → device | 1 | `{"action":"start"\|"stop"}` |
| `tc/{id}/cmd/arm` | → device | 1 | `{"seq":42,"joints":[...],"speed":0.3}` |
| `tc/{id}/cmd/estop` | → device | 2, retain | `{"active":true,"ts":...}` |

- `state` must be one of `idle | running | error | estop`.
- The bridge **rejects non-JSON** payloads and ignores unknown topics.
- Publish sensors on an interval (10s is the firmware convention).
- E-STOP is **QoS 2 + retained** so a device that connects late still sees an active
  stop. Honor it before anything else and stay stopped until manually cleared.

### REST your firmware effectively talks to

Base: `http://<host>:4000/api/mqtt`

| Method | Path | Purpose |
|---|---|---|
| GET | `/devices/{id}/telemetry` | latest sensors |
| GET | `/devices/{id}/state` | latest state |
| GET | `/devices/{id}/alerts` | alerts |
| GET | `/mqtt/status` | broker + known devices |
| POST | `/devices/{id}/door` | `{"state":"open"\|"close"}` |
| POST | `/devices/{id}/feed` | `{"amount":<grams>}` |
| POST | `/devices/{id}/clean` | `{"action":"start"\|"stop"}` |
| POST | `/devices/{id}/arm` | `{"joints":[...],"speed":0..1}` |
| POST | `/devices/{id}/estop` | emergency stop |

### Minimum viable device

Want to see your own device id show up in the dashboard? Publish one sensor message:

```bash
mosquitto_pub -h localhost -t tc/mycoop/sensors \
  -m '{"temp":68,"humidity":65,"ammonia":3,"feedLevel":90,"waterLevel":80,"chickenCount":2,"doorState":"closed","ts":0}'

curl http://localhost:4000/api/mqtt/devices/mycoop/telemetry
```

The simulator in `tools/simulate-device.mjs` is a full reference implementation —
read it to see exactly how a device should behave (drifting sensors, state on change,
command handling, E-STOP wins always).

---

## Troubleshooting

| Symptom | Cause / fix |
|---|---|
| `EADDRINUSE` on 4000 or 1883 | Port taken or OS-reserved. Set `PORT=` / `MQTT_PORT=`. |
| `smoke` says "API not reachable" | `npm run dev` not running, or wrong `PORT`/`API_BASE`. |
| Device not showing in telemetry | Topic typo or non-JSON payload — bridge drops it. Check broker log line `[broker] device connected`. |
| Commands do nothing | Device must subscribe `tc/{id}/cmd/+`. Confirm the id matches. |
| Want an external broker | `EMBED_BROKER=0 MQTT_BROKER=mqtt://host:1883`. |

---

*See `CLAUDE.md §4` for the full MQTT/firmware contract and the non-negotiable safety
rules (E-STOP QoS/retain, chicken-presence check before arm motion, stepper-disable on
idle, no hardcoded credentials).*
