# Classroom: Build a Gantry (Coop + Duck Dock) — with BOMs

**Advanced lesson.** A **gantry** moves a tool to any X/Y spot over the floor — it's how
the real Chicken Tender carries its arm to clean, collect eggs, and feed across the whole
4×4 ft coop. Here you build a **small working gantry**, scale the idea to a **Duck Dock**
over a pond, and get **bills of materials** for a cheap classroom rig and a real unit.

Builds on the [sensors](CLASSROOM_SENSORS_AND_AUTOMATION.md) and
[actuator](CLASSROOM_DOOR_AND_ROAMING_ROOST.md) lessons. Gantry control is the natural
"add your own peripheral" capstone (recipe in the feeder lesson).

> **Build order:** 1 axis first (prove motion), then add the second (X+Y), then mount a
> tool. Don't start with the full thing.

---

## How a gantry works

```text
        Y rail
   ┌──────────────┐        carriage rides X on the gantry beam;
 X │   ▓ tool     │ X      the beam rides Y on the side rails;
   │   │          │        tool = pen (demo), then scraper/gripper.
   └───┴──────────┘
        Y rail

   Each axis: stepper → belt/leadscrew → carriage on linear rail.
   1 step = a known distance, so the OS can say "go to (x,y)".
```

Real Chicken Tender = **XYZ gantry + 6DOF arm = 9DOF** (CLAUDE.md §1.5). Classroom = the
**XY** part, small and cheap.

---

## Stage 1 — Single-axis demo (prove it moves)

Smallest win: one stepper drives one carriage along one rail, moving a marker.

### BOM — single axis (classroom, ~$25)
| Part | Spec | Qty | ~Cost |
|------|------|-----|-------|
| Stepper motor | NEMA17, 1.8° | 1 | $9 |
| Stepper driver | A4988 or DRV8825 | 1 | $3 |
| Belt + pulley | GT2, 6 mm | 1 set | $5 |
| Linear motion | 8 mm rod + LM8UU, or V-slot offcut | 1 | $6 |
| Limit switch | microswitch (home position) | 1 | $1 |
| Reuse | Starter Node ESP32 + 12V supply | — | — |

Wire driver STEP/DIR/EN to free GPIOs; power the motor from 12V (not USB). Home against
the limit switch on boot, then `1 step = N mm`.

---

## Stage 2 — Add the second axis (X + Y)

Duplicate the axis perpendicular. Two common layouts:
- **Cartesian (H-bot-free):** X stepper on the moving beam, Y steppers on the sides.
  Simplest to understand; wiring is obvious.
- **CoreXY:** two fixed steppers + crossed belts move the carriage. Lighter, faster,
  harder to grasp — do this *after* Cartesian.

### BOM — XY gantry (classroom, ~$70)
| Part | Spec | Qty | ~Cost |
|------|------|-----|-------|
| NEMA17 stepper | 1.8° | 2–3 | $9 ea |
| A4988/DRV8825 driver | + heatsink | 2–3 | $3 ea |
| V-slot 2020 extrusion | 250–500 mm | 3 | $6 ea |
| Wheels / gantry plate | POM V-wheels | 1 kit | $12 |
| GT2 belt + idlers + pulleys | 6 mm | 1 kit | $10 |
| Limit switches | home X + Y | 2 | $1 ea |
| 3D-printed brackets/corners | PETG | set | ~$4 |
| Reuse | ESP32 + 12V 5A supply | — | — |

Tool mount on the carriage: start with a **pen** (draw a square = proof). Then swap a
**scraper** or a small **gripper** — the same tool-changer idea the real coop uses.

---

## Duck Dock gantry (variant)

Same XY gantry, mounted **over a water platform**. What changes:
- **Waterproofing** — IP-rated motors/enclosures, conformal-coat the driver board,
  stainless/anodized rails (no rusting steel rod over water).
- **Span** — Duck Dock is wider/wetter; use leadscrews or belt with support, not bare rod.
- **Tool** — pond-skimmer or egg pickup instead of a coop scraper.
- **Drainage** — cable drip-loops; nothing live near the waterline.

### BOM deltas — Duck Dock (add to XY BOM)
| Part | Why | ~Cost |
|------|-----|-------|
| Anodized/stainless rails | corrosion over water | +$15 |
| IP54 driver enclosure + glands | splash protection | +$12 |
| Conformal coating | board protection | +$6 |
| Stainless fasteners | no rust | +$8 |

---

## Control it from the OS (capstone)

Gantry motion is the **"implement your own peripheral"** capstone. There is **no
`cmd/gantry` endpoint yet** — adding it is the lesson:

1. **Firmware:** drive the steppers (STEP/DIR), home on limits, track position. Subscribe
   `tc/<id>/cmd/gantry` and move to `{x, y, speed}`. **Refuse while E-STOP**; **disable
   the stepper driver (EN) when idle** (project rule — no energized steppers at rest).
2. **express-api:** add a `gantry` schema `{x:number, y:number, speed?:0-1}`, a
   `sendGantryCommand`, and an owner-gated `POST /devices/:id/gantry` — copy the `light`
   command in [mqtt.controller.ts](../applications/tendercells_ui/test_output/express-api/backend/src/controllers/mqtt.controller.ts).
3. **OS:** click a grid cell → POST `{x,y}`. The MQTT topics `tc/<id>/cmd/gantry` and
   `tc/<id>/state/gantry` are already specced in CLAUDE.md §1.5 — follow that contract.

> Real coop uses NEMA23 + DM542T drivers on a Jetson Nano for the full 9DOF; the
> classroom NEMA17 + A4988 on an ESP32 teaches the **exact same** position→command idea
> at 1/10 the cost.

---

## Safety (gantry-specific)

| Protection | What |
|------------|------|
| **Home on boot** | Find the limit switch before trusting position — never assume where it is. |
| **Soft + hard limits** | Refuse moves past travel; limit switches as the hard backstop. |
| **Stepper disable on idle** | EN pin off at rest — no heat/coil damage (project rule). |
| **E-STOP** | Cuts motion instantly and disables drivers; latched until cleared. |
| **No tool over animals while moving** | Real coop checks chicken presence before arm motion — teach the principle even on the demo. |

---

## Where this goes

Single axis → XY gantry → tool changer → (real) add Z + a 6DOF arm = the full Chicken
Tender. Same on the Duck Dock over water. Students who build the classroom XY gantry have
built the *core* of the real product — just smaller and drier. Link it to the OS, claim
it to an account, and a gantry move is one more command in the same platform.
