# Control Types, Printing Tactics & Robot-Arm Plan

How users build **varying systems** on one platform and capture them in the
**TenderCells OS** — plus the plan to add **robot-arm control** (UI/UX + backend
together).

---

## 1. Control types the OS supports today

One Starter Node binary; pick `peripheral` at WiFi setup. Every type uses the same
**owner-gated, E-STOP-protected, local-MQTT** path.

| Control type | Hardware | `peripheral` | MQTT cmd | API endpoint | Status |
|--------------|----------|--------------|----------|--------------|--------|
| **Position servo** | hobby servo | `door` | `cmd/door {state}` | `POST /door` | ✅ |
| **Differential drive** | 2 cont. servos / DC | `drive` | `cmd/drive {dir,speed}` | `POST /drive` | ✅ |
| **Relay / load** | relay → lamp, pump, fan, valve | `relay` | `cmd/light {on}` | `POST /light` | ✅ |
| **Stepper gantry (GRBL)** | GRBL board + steppers | `gantry` | `cmd/gantry {x,y,speed\|cmd}` | `POST /gantry` | ✅ |
| **Metered dispense** | auger + load cell (full coop) | — | `cmd/feed {amount}` | `POST /feed` | ✅ |
| **6DOF arm** | servo/stepper arm or UR | — | `cmd/arm {joints,speed}` | `POST /arm` | 🟡 backend only |
| **Routines** | coordinated motion | — | `cmd/motion {routine}` | `POST /routine` | ✅ |

**Capture any system:** the [5-step peripheral recipe](CLASSROOM_FEEDER_AND_WATERER.md#implement-your-own-peripheral-the-real-skill)
(pin → topic → subscribe → act → report) plus `peripheral=custom` and `productType=custom`
let users model *any* device and have the OS show/schedule/own it. Drives covered:
**servo, DC (H-bridge or relay), stepper via GRBL, and arm joints** — the common four.

---

## 2. Printing tactics (match the part to the method)

| Tactic | Use for | Material | Notes |
|--------|---------|----------|-------|
| **FDM standard** | brackets, mounts, enclosures | PLA+ (indoor), PETG/ASA (outdoor/UV) | min wall 2 mm; 3 mm structural |
| **TPU (flexible)** | grippers, gaskets, anti-vibration feet, water seals | TPU 95A | soft egg gripper, pump-line seals |
| **Print-in-place** | hinges, living joints, door flaps | PETG | fewer fasteners; great for door lesson |
| **Multi-part + heat-set inserts** | load-bearing joints | PETG + brass M3 inserts | reusable threads for motor mounts |
| **Vase/spiral** | hoppers, funnels, chutes | PLA | fast feed hoppers |
| **Laser-cut (not printed)** | flat panels, gantry plates | 1/8–1/4" ply / acrylic | faster + stiffer than printing big flats |
| **CNC (GRBL!)** | aluminum brackets, the gantry itself | 6061 | the gantry you build can *make* the next part |

Design standards (units = inches, tolerances, naming) and the DFM checklist live in
CLAUDE.md → Engineering & CAD skill, and the [AI/CAD lesson](CLASSROOM_AI_CAD_FUSION_MCP.md).

---

## 3. Robot-arm control — plan (UI/UX + backend in parallel)

### Backend — what exists
- `POST /devices/:id/arm` → `cmd/arm {seq, joints[6], speed}` (owner-gated, QoS 1). ✅
- `POST /devices/:id/routine` → `cmd/motion {routine}` for canned sequences. ✅
- E-STOP + ownership already wrap it. ✅

### Backend — to add
- **Per-joint jog** — `cmd/arm` accepting a single `{joint, delta}` for nudge buttons.
- **Cartesian jog / pose** — `cmd/motion {x,y,z,...}`; IK runs on the arm controller
  (Jetson), not express-api (keep the API thin).
- **Saved poses / sequences** — store named poses in Firestore under the device; play via
  `routine`. (Schedules can then trigger arm routines.)
- **Coordinated 9DOF** — `cmd/motion` blending gantry XYZ + arm joints (CLAUDE.md §1.5
  sequential/parallel). Gantry bridge (✅) is the first 3 axes.
- **State feedback** — subscribe `state/arm` (joint angles) + `state/gantry`, mirror to
  Firestore (the [telemetry bridge](CLASSROOM_DOOR_AND_ROAMING_ROOST.md) already exists —
  extend it to these topics).

### UI/UX — to build (`tendercells-ui`)
- **Arm panel** — 6 joint sliders + live readout from `state/arm`; nudge (+/−) buttons.
- **Jog pad** — XYZ jog (gantry) + tool jog, step-size selector (0.1/1/10 mm), like a CNC pendant.
- **Pose library** — capture current pose → name/save; tap to replay; drag to sequence.
- **3D viewport** — reuse [`Viewport3D`](../applications/tendercells_ui/test_output/tendercells-ui/src/components/viewport/Viewport3D.tsx)
  to render the arm and **animate from live `state/arm`/`state/gantry`** (the
  `/viewer` work proves the rendering path).
- **Safety, non-negotiable** — big **E-STOP** always visible; every move behind the
  ConfirmModal; **chicken-presence gate** before arm motion (project rule); disable jog
  while E-STOP latched.
- **Tokens** — use the color tokens (gold/forest/danger) from CLAUDE.md; StatusHeader shows arm state.

### Build order (parallel tracks)
1. Backend: extend telemetry bridge to `state/arm`+`state/gantry`; add per-joint jog.
2. UI: Arm panel (sliders + jog) wired to `POST /arm` + live state.
3. UI: 3D arm in Viewport3D animated from live state.
4. Both: pose library (Firestore) + play via routine + schedule hook.
5. Both: 9DOF coordinated `cmd/motion` (gantry + arm).

Backend is ~70% there (arm + routine + ownership + E-STOP). The real work is **UI/UX +
live state feedback** — do those alongside the small backend jog/pose additions.
