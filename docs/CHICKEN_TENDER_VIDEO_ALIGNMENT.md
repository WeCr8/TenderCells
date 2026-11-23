# Chicken Tender Plus: showcase video to CAD, docs and demo (alignment, 2026-11-22)

Video: `CT_COOP_A_showcase_plus_2026-11-22b.mp4` (83 s, 1920x1080, 24 fps, no audio). The encode is **not in git** (29 MB; the renderer is `cad/chicken-tender-coop/showcase/sc_render.py`).
Times below are approximate (read from a contact sheet every 3.5 s). "OK" means the video text matches the source named; **GAP** means it does not, or the source is missing.

## Scene map
| ~t (s) | Caption / overlay in the video | Source of truth in the repo | Doc | Status |
|---|---|---|---|---|
| 0, 81 | Title: "Plus - SO-101 on a ceiling gantry" | `sc_params.GANTRY_CFGS = plus,pro` | `CHICKEN_TENDER_SHOWCASE.md` (updated) | OK after this PR (doc said "under the hood") |
| 3 | Sunrise: the schedule opens the pop door; XIAO ESP32-S3 door controller overlay (lift mm, motor, reeds, E-STOP loop, current) | `fw_sim.py` (port of `door_logic.cpp`, PR #188) | `CHICKEN_TENDER_PINOUT.md`, SHOWCASE | OK |
| 3, 52 | Labels: 12 V linear actuator (300 mm), turnaround pulley, cord eye, gravity-close pop door, open and closed reed | `sc_model.py` (M1, PUL), `bom_check.py` | SHOWCASE (door section) | OK. Pulley is **ASSUMED**, not in the PR #188 BOM |
| 7, 49 | Hens leave for the run; return at dusk | `anim.py` | none | Illustrative only |
| 10 | "the pop door closes before any robot moves" | `routines.py` permissive (b) | `CHICKEN_TENDER_ROBOT_SAFETY.md` 2.2 | OK |
| 14-17 | EGG routine: ceiling XYZ gantry carries the SO-101 (inverted on the Z mast) to the nest box; nest box NAU7802 load cells | `gantry.py`, `so101.py`, `house.py` | ROBOT_SAFETY, SHOWCASE (new section) | OK |
| 14-31 | Permissives panel: camera clear 60 s + PIR + nest cells; pop door CLOSED (both reeds); E-STOP loop closed; SD1/SD2/cleanout/egg-bay doors closed; daytime window, no rain | `routines.py` header (a)-(f), `clean_params.CAM_CLEAR_HOLD_S` | ROBOT_SAFETY 2.2 | OK. See "Window" below |
| 21, 24 | Padded egg chute; eggs roll to the exterior drawer | `house.py` (CHUTE, EGG-DRAWER) | SHOWCASE (new section) | OK |
| 28-35 | CLEAN routine: T6 slotted trowel (80 mm) from the tool dock; deep-litter turn (plunge, curl, lift, roll) | `tools_cad.py`, `gantry.py` (dock), `clean_reach.py` | SHOWCASE (new section); ROBOT_SAFETY | OK. "tool dock" was missing from docs; added |
| 35 | Service door opened: reed interlock cuts motor power; MAINTENANCE LOCKOUT, RS-SD1 / SD1 service door labels | `service_params.DOOR_REEDS`, `routines.FAULTS["service_door_open"]` | ROBOT_SAFETY 2.3 | OK |
| 38 | Door closed and re-armed; routine resumes | `routines.py` latch MAINT + re-arm | ROBOT_SAFETY 2.3 | OK |
| 56 | E-STOP pressed: door stops and stays put; NC E-STOP station (back wall) | `fw_sim.py`, `routines.FAULTS["estop"]` | ROBOT_SAFETY | OK |
| 59-81 | Assembly: Step 2 Posts, 4 Walls, 6 Run frame, 9 Nest box/roost/ramp, 11 Robot egg bay | `sc_model.STEPS` (12 steps; step 12 = Gantry + tool dock, not shown in the cut) | `CHICKEN_TENDER_BUILD_GUIDE.md` | OK, but the guide has no gantry or egg-bay assembly steps. **GAP** |

## Gaps and recommended fixes
1. **Marketing/demo page.** `src/pages/chicken-tender.js` is generic stock copy (stock photo, "Order Now - $2,999", a "Watch Demo" button with no video). It does not mention the tiers, the gantry, the interlocks or the video. Recommend replacing the placeholder with the video and a Plus tier section only after the owner approves pricing and wording. Not changed here.
2. **Video hosting.** The encode is not in git. Host it (release asset or storage bucket) and link it from `docs/CHICKEN_TENDER_SHOWCASE.md`; do not commit the 29 MB file.
3. **Window.** ROBOT_SAFETY permissive (e) is a fixed 09:00-15:30 (**ASSUMED**). The care-scheduling pack (`docs/scheduling/care-agent-pack-2026-11-22/`, branch `docs/care-scheduling-agent-pack`) derives cues from sunset and shade and says roosting was already underway by about 4:18 PM against a 4:44 PM sunset. Align by deriving the robot window from that solar calendar (for example, finish before the head-count cue), and keep a fixed outer limit. Safety rule stays: unknown occupancy is never safe.
4. **Build guide.** `CHICKEN_TENDER_BUILD_GUIDE.md` has no gantry or egg-bay steps, and its numbering differs from the video's (guide Step 2 is the floor frame; the video's Step 2 is posts, from `sc_model.STEPS`). Add the electronics bay, egg bay and gantry + tool dock steps, and either renumber the video captions or the guide so both use one list.
5. **Reach numbers.** The Plus/Pro rows in the reach table are from the old layouts and are marked LEGACY. Re-run `reach.py` and `clean_reach.py` for the ceiling gantry and quote the new numbers.
6. **Isaac/USD and GLB.** `sim/isaac/usd` and `reports/glb/` were generated before the 2026-11-22 changes (T6, NAU7802, SD1/SD2, NC E-STOP). Re-export so the demo matches the video: `python export_glb.py plus,pro ../reports/glb` and `python export_usd.py plus,pro ../../../sim/isaac/usd` (needs build123d, trimesh, usd-core, numba).
7. **STEP files.** `step/CT_COOP_A_showcase_plus.step` and `_pro.step` should be rebuilt with `python export_step.py options` and re-validated (`validate_step.py`) so SolidCraft and the video show the same model.

## What was not checked
No hardware, no re-render, no firmware run. Everything above is from reading the video frames and the source on the PR #189 branch (`091952c7`).
