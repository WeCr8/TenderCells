# Barn Brain — Jetson Edge Hub Application Plan

> Implementation plan for the on-Jetson application. Companion to the concept
> [`README.md`](README.md). Concept stage — not an orderable kit. Local-first,
> open-source, contribution-ready for makers, students, ag engineers, and kids.

## 1. What we're building

A single runnable application stack for an NVIDIA Jetson (Orin Nano Super class;
legacy Nano works for non-AI roles) that becomes the **barn-side brain** of a
TenderCells site:

- Owns the **local MQTT broker** so coop hardware keeps working with no internet.
- Holds the **device + product registry** and **routine engine** locally.
- Bridges the **LoRa mesh** (WatchTower / ChickenEye, via the shared `tc_mesh`
  PHY) into MQTT and the cloud — the mesh→cloud edge.
- Runs **camera AI inference** on the Jetson GPU (predator / animal checks) and
  publishes alerts onto the same topics the app already consumes.
- Serves a **local dashboard** and exposes the same REST/MQTT surface the
  existing app and `express-api` already speak, so nothing downstream changes.

Design rule (non-negotiable, matches CLAUDE.md): **motion/control commands never
route through Firebase**; safety state lives close to the hardware; E-STOP is MQTT
QoS 2 + retain; no secrets/WiFi creds/real addresses in any committed example.

## 2. Where it fits the existing system

```text
                 ┌────────────────────────────────────────────┐
   LoRa mesh ───►│  LoRa gateway node (SX127x + ESP32, USB)    │
 (tc_mesh PHY)   │  speaks tc_mesh, forwards frames as JSON     │
                 └───────────────┬────────────────────────────┘
                                 │ USB serial (CDC/UART, 115200)
                 ┌───────────────▼────────────────────────────┐
   ESP32 coop ──►│              B A R N   B R A I N            │◄── app / browser
   over WiFi/MQTT│  • MQTT broker (Mosquitto/Aedes)            │   (LAN dashboard)
                 │  • device + product registry (SQLite)       │
   cameras ─────►│  • routine engine (feed/water/door/clean)   │
   (CSI/USB/RTSP)│  • safety state machine (estop/lockout)     │
                 │  • AI inference service (TensorRT/TFLite)    │
                 │  • cloud sync (optional, outbound only)      │
                 └─────────────────────────────────────────────┘
```

The MQTT topic contract is **identical** to what `express-api` and the firmware
already use (`tc/{deviceId}/cmd|state|sensors|alert`, `tc/broadcast/alert`,
`tc/{deviceId}/cmd/estop` QoS2+retain). Barn Brain is a superset of the existing
embedded-broker dev runner, promoted to a standing edge service with AI + mesh.

## 3. Stack & process layout

Two cooperating processes, split by what each runtime is good at:

| Service | Runtime | Job |
|---------|---------|-----|
| `barn-core` | Node 18 (reuse `express-api` patterns) | broker, registry (SQLite), routine engine, safety state, REST + local dashboard, mesh-serial bridge, optional outbound cloud sync |
| `barn-ai` | Python 3 + JetPack (CUDA/TensorRT) | camera capture, inference, publishes `tc/{id}/alert` over MQTT to `barn-core` |

Why split: Jetson AI tooling (TensorRT, `jetson-inference`, GStreamer/CSI) is
Python/C++; the rest of TenderCells is already TypeScript/Node. They talk over
local MQTT only — clean seam, either side restartable, both supervised by
`systemd` so the hub self-heals on boot/crash.

Proposed repo location: `applications/barn-brain/` with `barn-core/` (Node) and
`barn-ai/` (Python), plus `deploy/` (systemd units, JetPack setup script).

## 4. MQTT / data contract (reuses existing topics)

- Subscribe: `tc/+/sensors`, `tc/+/state`, `tc/+/alert`, `tc/broadcast/alert`.
- Publish commands: `tc/{id}/cmd/{door,feed,clean,arm}` (QoS 1),
  `tc/{id}/cmd/estop` (**QoS 2, retain:true**).
- Hub status: `tc/barn-brain/status` (retained), `tc/barn-brain/ai` (inference
  health), `tc/barn-brain/mesh` (gateway link + relay counters).
- Mesh bridge: a `tc_mesh` frame of type `TC_MSG_ALERT` arriving on the LoRa
  gateway is republished verbatim to `tc/broadcast/alert` (mirrors the WatchTower
  `onMeshMessage` bridge already shipped); `TC_MSG_ESTOP` fans out to every
  device's `cmd/estop`.

## 5. Safety state machine (local-first)

States mirror the firmware: `IDLE | RUNNING | LOCKOUT | ESTOP`. Rules enforced in
`barn-core`, independent of cloud:

- Any mesh/app/manual E-STOP → publish retained `cmd/estop` to all devices,
  enter `ESTOP`, refuse motion commands until manual clear.
- Offline device (missed N heartbeats) → flag, surface on dashboard, block
  routines that target it.
- Low battery / predator alert / door fault → raise local alert + (if online)
  outbound sync; never wait on cloud to act.
- No routine may emit arm/door motion without the device reporting a safe
  precondition (e.g., chicken-presence check before arm motion).

## 6. AI inference service (`barn-ai`)

- Inputs: CSI camera (Jetson native), USB UVC, or RTSP from WatchTower-class cams.
- Models: start with the same predator classifier WatchTower targets; Jetson runs
  the full-size model (TensorRT) instead of the on-device TFLite Micro stub, so
  Barn Brain is the "heavy inference" tier while WatchTower stays edge-cheap.
- Output: on detection, publish `tc/{cameraId}/alert` JSON
  (`{type,confidence,src,ts}`) — same schema the app + mesh already use.
- Degrade gracefully: if no GPU/model, run a motion-only heuristic and label
  `modelAvailable:false`.

## 7. Build milestones (extends the concept README's "First Builder Milestones")

1. **Bring-up**: JetPack install, network/storage/update verified (README steps 1–2).
2. **Broker + status**: `barn-core` runs Mosquitto/Aedes; publishes retained
   `tc/barn-brain/status`; existing app points at the Jetson IP and sees devices.
3. **Registry + sim device**: SQLite registry; register one simulated device +
   one sensor event; reuse the app's sim-only data layer contract.
4. **Routine + safety**: one routine (e.g. scheduled feed) that checks a safety
   condition and emits a command; E-STOP path verified end to end (QoS2+retain).
5. **Mesh bridge**: attach the USB LoRa gateway node; a WatchTower mesh alert
   appears on `tc/broadcast/alert` at the hub and in the app.
6. **AI tier**: `barn-ai` runs the predator model on a camera; detection publishes
   `tc/{id}/alert`; dashboard shows it.
7. **Resilience**: systemd auto-start, reboot test, offline-core-safety test,
   documented power/enclosure/cooling/backup/override assumptions.

## 8. Hardware needs

| Item | Note |
|------|------|
| Jetson Orin Nano Super Dev Kit (recommended) | full AI tier; legacy Nano OK for broker/registry only |
| microSD / NVMe + JetPack | per NVIDIA setup guide (links in README) |
| Camera | CSI (native), USB UVC, or RTSP IP cam |
| LoRa gateway node | SX127x + ESP32 over USB, flashed with `tc_mesh` PHY (915 MHz, BW125k, SF9, CR4/5, sync 0x34) |
| Power + cooling | active cooling for sustained inference; UPS/battery for safety-critical sites |
| Enclosure | barn-rated; keep electronics IP-protected (ammonia + moisture) |

## 9. Open questions (resolve before code)

- Broker choice: embed Aedes in `barn-core` (one process, matches the dev runner)
  vs. run system Mosquitto (battle-tested, separate lifecycle). Lean Mosquitto for
  a standing hub; Aedes for the all-in-one demo.
- Cloud sync scope: outbound telemetry/alert mirror only, or two-way config? Keep
  v1 outbound-only to preserve local-first guarantees.
- Multi-hub sites: out of scope for v1 (single hub per property).

## 10. Scope guardrails

- Concept stage: no orderable kit, no real owner data, no secrets in examples.
- Don't break the existing app/`express-api` contract — Barn Brain is additive.
- Apache-2.0, builder-friendly: every milestone runnable on a sim device with no
  real hardware so kids/students can follow along before buying anything.
