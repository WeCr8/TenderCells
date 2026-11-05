# Camera Timing, Clock Sync and the Pre-Session Timestamp Audit

How TenderCells camera nodes stamp frames, how to check timing before you record
data for the rover or the SO-101 arm, and what the hardware can and cannot do.

The rules come from sim-to-real practice:

1. Stamp each frame **at capture** from one clock, not when it arrives.
2. Where several sensors must line up, use a **hardware trigger** (target skew < 1 ms).
3. Run a **~60 s timestamp audit** before every data-collection session.
4. Record **clock offset** as a first-class field in the dataset.
5. Feed the measured **latency and jitter back into sim**.
6. Keep camera rates **modest and in step with control**.

## What each node does now

| | XIAO ESP32-S3 Sense (`firmware/camera-node`) | Raspberry Pi (`raspberry-pi/camera-node`) |
|---|---|---|
| Capture stamp | Driver DMA timestamp (`fb->timestamp`, esp_timer µs, start of frame readout) | libcamera `SensorTimestamp` (CLOCK_MONOTONIC, first row exposed) |
| Wall clock | SNTP: NTP setting → broker IP → pool.ntp.org, every 5 min, step mode | Kernel clock disciplined by chrony / systemd-timesyncd |
| Default rate | 10 fps, VGA (configurable 1–30 fps) | 30 fps, 1280×720 (`--fps`, `--width`, `--height`) |
| Status | `http://<ip>:81/status`, `http://<ip>:81/time` | `http://<ip>:8000/status`, `/time`, `/healthz` |
| Sidecar | Headers only (recorder writes the sidecar) | `--frame-log frames.jsonl` |
| Trigger | Sync **input** on D3/GPIO4: edges are timestamped, exposure is not triggered | Global Shutter Camera (IMX296) external trigger supported by the OS |

### Per-frame headers (MJPEG multipart parts)

Browsers and FFmpeg ignore these headers, so existing viewers still work.

| Header | Meaning |
|---|---|
| `X-Frame-Seq` | Frame counter at the source. Pi: every sensor frame, so a gap means a missed frame. ESP32: one counter across all clients |
| `X-Stream-Seq` | Counter for this connection |
| `X-Capture-Mono-Us` | Device monotonic clock at capture (µs) |
| `X-Capture-Epoch-Us` | Device Unix time at capture (µs); only sent when the clock is synced |
| `X-Clock-Synced` | `1` / `0` |
| `X-Clock-Source` | `sntp`, `ntp`, `chrony` or `none` |
| `X-Capture-Stamp` | ESP32: `driver` (good) or `fb_get` (fallback) |
| `X-Trigger-Seq`, `X-Trigger-Mono-Us` | Last sync-input edge (ESP32, when enabled) |

### Camera config over MQTT (ESP32)

`tc/{id}/cmd/camera/config` now also accepts these optional fields:

```json
{"fps": 10, "syncInput": true, "wifiSleep": true, "corsOrigin": "https://relay.example:8443"}
```

A message without `enabled` no longer turns capabilities off.

| Field | Default | Meaning |
|---|---|---|
| `fps` | `10` | Target frame rate, 1–30. The Pi node stays at 30 (`--fps`) |
| `syncInput` | `false` | Timestamp edges on D3/GPIO4 |
| `wifiSleep` | `true` | Wi-Fi power-save allowed while idle (see below). `false` = never sleep (bench / mains power) |
| `corsOrigin` | blank | The one browser origin allowed to read `/stream` and `:81/status`. Blank = none |

### Wi-Fi power-save (XIAO)

Power-save (modem sleep) is **on by default** to save battery. It adds roughly
10–100+ ms of latency jitter, so the firmware lifts it automatically while timing
matters and restores it afterwards:

- while a `/stream` client is connected (a recording / dataset session; the
  recorder is the only client), plus 10 s after it disconnects;
- for 30 s after any `:81/time` probe (the pre-session audit and recorders probe
  `/time` for clock offset before and after streaming).

`/status` → `network.wifiPowerSaveActive` shows what the radio is doing now and
`network.wifiPowerSaveReason` why: `idle` (power-save on), `stream`,
`session_hold` or `disabled` (`{"wifiSleep": false}`). The serial console logs
each change. The first `/time` probes of an audit may still see sleep latency;
the audit's min-RTT offset filter discards them.

### One stream client (XIAO)

esp_http_server runs one task per port, and `/stream` holds it for as long as a
client watches. The XIAO therefore serves **one** `/stream` client. During a
recording session that client is the recorder; outside sessions it is the relay
(`deploy/self-hosted-camera`) that the UI and every viewer watch. Nobody opens
the camera's `/stream` directly. The relay counts as a client too, so stop its
pull while recording or auditing. `:81/status` and `:81/time` run on a second
server and stay reachable while streaming. If live viewing during recording is
needed later, the recorder (or a Pi) has to fan its one connection out.

### LAN access and CORS

Both nodes are LAN-only and **have no token yet** (follow-up). `/stream` and
`/status` send `Access-Control-Allow-Origin` only for the configured relay/UI
origin (XIAO: `corsOrigin` above or the setup-portal field; Pi:
`--cors-origin` / `TC_CORS_ORIGIN`), so other web pages cannot read frames,
timing headers or status with JavaScript. `/time` keeps
`Access-Control-Allow-Origin: *`. CORS only governs browsers: anything on the
LAN can still connect directly, which is what the token follow-up will close.

## The honest limits

- **XIAO over Wi-Fi cannot meet < 1 ms.** SNTP over Wi-Fi is a single, asymmetric
  round trip, so expect a few ms of error (worse with modem sleep, which the
  firmware lifts automatically while streaming). The OV2640/OV3660 has no exposure-trigger
  pin on the Sense board, so frames are free-running: the capture stamp tells you
  *when* a frame was taken, but you cannot make two XIAOs expose together.
- **What the XIAO sync input does give you:** one shared trigger wire to the XIAO
  and to the other sensors or the arm controller. Each device timestamps the
  same edge on its own clock (about 10 µs ISR latency). That lets you align the
  clocks of everything on the wire in post-processing, far better than SNTP. The
  frame's own phase is still free-running, so a 10 fps frame can be up to one
  sensor period away from the edge. Its stamp tells you exactly how far.
- **For < 1 ms multi-camera alignment** use a Raspberry Pi with the **Raspberry
  Pi Global Shutter Camera (IMX296)**, hardware-triggered from one pulse source
  (the arm/rover controller or a dedicated MCU). Run the Pi clocks on **wired
  Ethernet with chrony**, or **PTP (linuxptp)** on hardware with PTP
  timestamping (Compute Module 4 confirmed; check others with `ethtool -T eth0`).
  Then use the audit's `--budget triggered`.

## Wiring the optional sync input (XIAO)

| XIAO pin | Use | Notes |
|---|---|---|
| `D3 / GPIO4` | Sync / trigger **input** | 3.3 V logic only, rising edge, internal pull-down. Off by default |
| `GND` | Common ground with the trigger source | Required |

D3 does not clash with the existing map: camera (GPIO10–18, 38–40, 47, 48),
microphone (GPIO41–42), microSD, `D0` relay, `D1` digital input, `D4/D5` I2C.
Never drive it from 5 V. From a 5 V controller, use a level shifter or a
divider (for example 10 kΩ over 20 kΩ). Turn it on with `{"syncInput": true}`.

## Pre-session setup and 60 s audit (how-to)

1. **Time source:** on the Pi broker or the recording computer:
   `sudo apt install -y chrony`. To let ESP32 nodes use it, add
   `allow 192.168.0.0/16` (your LAN) to `/etc/chrony/chrony.conf` and restart
   chrony. Leave the ESP32 NTP field blank and it uses the broker IP first.
2. **Power and RF:** run cameras from a supply that does not sag. Check
   `/status` → `resetReason`; `brownout` means the battery or wiring is too weak
   for camera + Wi-Fi peaks. Wi-Fi power-save lifts itself while the recorder
   streams and during the audit; check `network.wifiPowerSaveReason` is `stream`
   while recording.
3. **Set the rate** to match control: 30 fps for a 30 Hz loop on the Pi; 10 fps
   (default; 15 if needed) on the XIAO.
4. **Make sure only the recorder connects to the camera.** The XIAO serves one
   stream client at a time. View through the relay, not the camera. Stop the
   relay's pull while the audit runs, since the audit is itself a stream client.
5. **Wait for sync:** `/status` → `clock.synced: true` (XIAO: a minute or so after boot).
6. **Run the audit** from the computer that will record:

   ```bash
   python3 raspberry-pi/camera-node/timestamp_audit.py \
       http://<camera>/stream [http://<camera2>/stream ...] \
       --duration 60 --out audit.json \
       --profile-out jitter_profile.json --sidecar audit_frames.jsonl
   ```

   It prints PASS/FAIL per check and exits `0` pass, `1` budget fail, `2` no data.
   The default `--budget wifi` checks jitter ≤ 8 ms, drops ≤ 2 %, offset
   uncertainty ≤ 5 ms, latency p95 ≤ 150 ms and that the clock is synced.
   `--budget triggered` is the < 1 ms profile. Every limit can be overridden
   (`--max-jitter-ms`, `--max-drop-rate`, ...).
7. **Do not record on FAIL.** Fix the cause first (weak RSSI, unsynced clock, a
   second viewer, too high fps), then re-run.
8. **Keep `audit.json` and `jitter_profile.json` with the dataset.**

## Dataset fields

Record, per frame: `seq`, `capture_mono_us`, `capture_epoch_us`, `clock_synced`,
`host_recv_epoch_us`, `clock_offset_us` (device − host, from `/time` probes
interpolated across the session) and `capture_host_epoch_us` (capture time on
the recorder's clock). The audit's `--sidecar` writes exactly this
(`tendercells.camera_frame/v1`). Align camera frames to arm/rover state with
`capture_host_epoch_us`, never with receive time.

## Feeding sim

`jitter_profile.json` (`tendercells.camera_jitter_profile/v1`) holds summary
stats and up to 2,000 empirical samples of frame interval and capture→receive
latency, the drop probability, and the clock-offset uncertainty. In Isaac Sim or
any other sim, delay each rendered observation by a sampled latency, space frames
by sampled intervals, drop frames with `drop_probability`, and add
`timestamp_noise_ms` as noise on observation timestamps.

## Running the checks locally

```bash
cd raspberry-pi/camera-node && python3 -m pytest -q tests && ruff check --config ruff.toml .
cd firmware/camera-node && pio run
```

## Open items

- **Token for LAN endpoints** (`/stream`, `/status`): planned follow-up; today the
  model is LAN-only with CORS limited to one origin.
- **Heartbeat `ts`** still differs between nodes (XIAO uptime ms, Pi epoch s).
  Use `epochMs` for wall time; a `ts` migration is open.
- **microSD pins:** the first-build guide lists GPIO3 and GPIO7–9; Seeed's
  examples use GPIO21 as SD CS. To be verified against the Seeed schematic.
