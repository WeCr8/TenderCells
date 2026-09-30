<!-- Generated from docs/TENDERCELLS_DIGITAL_TWIN_ARCHITECTURE.md by website/scripts/sync-docs.mjs - edit the source, then run npm run sync:docs. -->

# Tender Cells Digital Twin Architecture

> Status: **draft architecture** (2026-09-30). This document says what exists today, what is
> planned, and the rules both must follow. It turns the "farm digital twin" positioning into
> engineering terms. Where a section says **Today**, the code exists; **Planned** means it does not yet.

## 1. What we mean by "digital twin"

A Tender Cells digital twin is a persistent digital representation of a real farm entity. Its
state can be updated by physical sensors, devices, observations or validated data sources. It is
used for monitoring, simulation, decision support, automation or education.

Some things are not twins:

- **A model or simulation** has no physical counterpart feeding it data. The public demo is one:
  it is a *simulated farm*, and every entity in it is **digital-twin ready**, not a live twin.
- **A dashboard** shows current values without identity, history, provenance or relationships.

**Maturity labels.** Use these in order. Never show a stronger label than the data supports.

| Label | Meaning |
|---|---|
| Simulated | Produced by the demo simulator or a design; no hardware. |
| Twin ready | The entity has an identity and a contract (MQTT topics) a real device can fill. |
| Connected prototype | A real prototype device updates this entity. |
| Hardware validated | Expected vs. observed behavior compared on real hardware. |
| Field testing | Running on a real property with real animals. |
| Live twin | Continuous physical → digital updates with history, provenance and safe commands. |

**Today:**

- Tender Cells OS and the demo are **Simulated**.
- Devices that speak the MQTT contract (Starter Node, Camera Node) are **Twin ready**.
- No product family is sold or field-deployed yet.

## 2. Twin kinds and hierarchy

```text
PROPERTY TWIN (tc:property:...)
├── ENVIRONMENT TWIN   weather, temperature, humidity, terrain, watershed
├── ANIMAL TWINS       only data we actually have: identity, species, location, observations
├── HABITAT TWINS      Chicken Tender, Duck Dock, Bunny Burrow, Goat Guardian, ...
├── DEVICE TWINS       WatchTower, cameras, starter nodes, sensors
└── ROBOT TWINS        Roaming Roost, gantry + arm, rovers
```

Animal twins describe only what is measured or recorded. They are not physiological models, and
Tender Cells does not diagnose illness.

## 3. Twin IDs

**Format:** `tc:{kind}:{type}:{localId}`. For example:

```text
tc:property:demo-farm
tc:habitat:chicken-tender:ct_001
tc:device:watchtower:wt_001
tc:robot:roaming-roost:rr_001
tc:animal:chicken:pepper
```

For devices, `localId` **is the deviceId** already used everywhere:

- MQTT topics `tc/{deviceId}/...`
- the property grid
- schedules
- the egg map
- telemetry

One entity therefore has one identity across the UI, the API, MQTT, the event logs and the docs.

**Today:** `tendercells-ui/src/lib/twin/twin.ts` (`twinId`, `deviceTwinId`). Demo device
prefixes map to twin kinds:

- `ct`, `dd`, `bb`, `gg`, `tt` and `pp` are habitats;
- `wt` is a device;
- `rr` is a robot.

The demo event log stores the twin ID of the entity each event changed.

## 4. Provenance: where every value came from

Every value belongs to one of these source classes:

| Source type | Example |
|---|---|
| `SENSED` | DHT22 temperature from ESP32 node `ct_001` |
| `USER_ENTERED` | Keeper sets a hen's name or breed |
| `INFERRED` | Vision model: "fox, 87%" (always with a model and a confidence) |
| `SIMULATED` | Anything produced by the demo simulator |
| `CALCULATED` | Rule output, e.g. "predator ≥ 80% after dusk" |
| `EXTERNAL` | Weather service |
| `COMMAND_STATE` | What the OS asked a device to do (not yet what happened) |

**Rule:** simulated, sensed, entered and inferred values must never look the same in the UI.

A state record looks like this:

```json
{
  "twin": "tc:device:watchtower:wt_001",
  "property": "battery_percent",
  "value": 83,
  "source_type": "SENSED",
  "source": "wt_001",
  "ts": "2026-09-30T18:02:31Z"
}
```

**Today:**

- The event simulator labels every chain step with the source class it would have on a live farm
  (device → `SENSED`, AI → `INFERRED`, rule/OS → `CALCULATED`, actuator → `COMMAND_STATE`).
- It marks the whole event `SIMULATED` from the "Tender Cells demo simulator".
- The Property Twin page shows **Simulation** (demo data) or **Design** (your own layout, no live devices).

**Planned:** per-value provenance on live telemetry in the entity inspector.

## 5. State: MQTT is the source

This part already exists (the contract is in `/api/tendercells-backend.xml`):

| Topic | Twin meaning |
|---|---|
| `tc/{id}/sensors` (QoS 0, 10 s) | `SENSED` environment and habitat state |
| `tc/{id}/state` (QoS 1) | Operating state: `idle`, `running`, `error` or `estop` |
| `tc/{id}/state/{sub}` (retained) | Sub-system state: arm joints, gantry xyz, weed tool |
| `tc/{id}/status` (retained + last will) | Presence: `{online}`. The broker publishes `online:false` if the device drops. |
| `tc/{id}/event` | Yard events, upserted by id (weeds, animals, leaks, eggs) |
| `tc/{id}/alert` (QoS 2) | Predator, fault and health alerts, which become located events |
| `tc/{id}/cmd/{command}` (QoS 1, `seq`) | `COMMAND_STATE`: what we asked |
| `tc/{id}/ack` | `{seq, ok, error?}`: the device accepted or refused |
| `tc/{id}/cmd/estop` (QoS 2, retained) | Emergency stop, always wins |

On a hub, `GET /api/state.xml` is the live snapshot of every device: presence, telemetry, state,
sub-states and yard events. That is the current read model for twins.

## 6. Commands: digital → physical, safely

Commands are separate from read-only twin state, and motion never goes through Firebase. Every
command that can move something must have all of these:

1. **Authorization**: the device owner, or the school-class role.
2. **Validation**: payload schema and limits (`schemas.ts`).
3. **Local safety constraints**: E-STOP clear, exclusion zones, and laser class rules. The arm
   checks for chicken presence first.
4. **Confirmation in the UI** before any hardware action.
5. **Acknowledgement**: `seq` → `ack` within 3 s. If none arrives, the API replies `202 sent, not acknowledged`.
6. **Physical confirmation where possible**, for example a door limit switch → `state`.
7. **Timeout and fault state**: the device enters `error` and the twin shows it.
8. **Manual override** plus E-STOP.
9. **An audit event.**

The twin shows **commanded** (`COMMAND_STATE`) and **confirmed** (`SENSED`) state separately.
Showing a door as "closed" because we sent "close" is a bug.

## 7. Events and history

A twin without time is a dashboard. We keep:

- **State now**: the retained MQTT topics plus `/api/state.xml`.
- **Event ledger**: ordered, explainable cause → effect entries. For example:

  ```text
  motion → classified raccoon → predator event → rule evaluated → occupancy confirmed
  → door-close command → limit switch CLOSED → owner notified
  ```

**Today:** the demo event ledger (`tendercells_demo_event_log_v1`, newest first, 30 entries).
Each entry stores:

- its scenario;
- the full chain;
- the twin ID;
- the time;
- whether "Why did this happen?" was opened.

**Planned:**

- A live ledger on the hub, built from `event`, `alert`, `ack` and `state` transitions.
- Replay: step through a time window on the Property Twin.

## 8. Relationships (planned)

```text
Pepper (tc:animal:chicken:pepper)
  MEMBER_OF    flock
  LOCATED_IN   tc:habitat:chicken-tender:ct_001
  OBSERVED_BY  camera node
tc:habitat:chicken-tender:ct_001
  LOCATED_ON   tc:property:demo-farm
  PROTECTED_BY tc:device:watchtower:wt_001
```

Some of these relationships already exist implicitly:

- `animal.device`
- the grid placement of each device
- WatchTower coverage

Making them explicit edges is what allows questions like "which chickens have not returned?" to
run over structured data rather than a chatbot guess.

## 9. Offline behavior

```text
DEVICE → LOCAL HUB (Barn Brain / Raspberry Pi, MQTT) → Tender Cells OS
```

Barn Brain is an optional edge runtime. It is not the twin itself. When the internet drops:

- safety routines keep running on the device and hub;
- presence and retained state stay correct locally;
- manual control remains;
- devices fail safe.

Buffered sync of history is **planned**.

## 10. Representations

**Property Twin (Three.js).** 2D and 3D layout: devices, zones, terrain, watershed, routes and
yard events. It is a visual representation of the twin, not an engineering-grade physics model.

**Isaac Sim (planned sync).** USD export of the layout and the arm bridge. Isaac Sim is for
testing behavior, not a claim that the simulation predicts reality.

## 11. API (planned)

```text
GET /api/twins                     list twins on a property
GET /api/twins/{id}                identity, kind, maturity, relationships
GET /api/twins/{id}/state          current values with provenance
GET /api/twins/{id}/events         ledger
GET /api/twins/{id}/history        time series
```

These endpoints are read-only. Commands stay on the existing `/api/mqtt/devices/{deviceId}/...`
endpoints with all the safety rules in section 6.

## 12. Migrating from the demo data model

| Demo today | Twin model |
|---|---|
| `deviceId` (`ct_001`) | Local id of `tc:{kind}:{family}:ct_001` |
| `tendercells_demo_equipment_v1` (door, feed, water, sensors) | Habitat state, source `SIMULATED` |
| Egg map by `deviceId` and box | Habitat sub-state (nest boxes) |
| Property layout items | Property twin children and placement |
| Event log | Event ledger entries with a twin ID |
| `demo-environment` tag on records | Maturity `Simulated` |

## 13. Twin vs. dashboard test

Before calling a feature a twin, check each question:

- Does it represent an identifiable entity?
- Does its state change over time?
- Is the source of every value known?
- Can physical data update it?
- Is history kept?
- Are relationships explicit?
- Can behavior be simulated?
- Can expected and actual behavior be compared?
- Does it support a decision?
- Can a *safe* command affect the physical counterpart?

If most answers are no, call it a model or a visualization.
