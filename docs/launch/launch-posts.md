# Launch Posts — Tender Cells goes open source

Ready-to-paste drafts. You publish these (they're outward-facing); this file is
the source of truth so the wording stays consistent across channels.

Canonical links:
- Repo: https://github.com/WeCr8/TenderCells
- Live demo (no signup): https://tendercells.com/app/demo
- Good first issues: https://github.com/WeCr8/TenderCells/issues?q=is%3Aopen+label%3A%22good+first+issue%22

---

## 1. Hacker News (Show HN)

**Title:**
Show HN: Tender Cells – open-source OS for automated animal care (Apache-2.0)

**Body:**
We open-sourced Tender Cells, a platform for automated backyard animal care.
The flagship is an automated chicken coop with a ceiling 9DOF motion system
(XYZ gantry + 6DOF arm) for cleaning, egg collection, and feeding — but the
software is a general "animal OS": dashboard, device registry, telemetry,
schedules, and a sim mode that runs with no hardware.

The interesting part for HN: the whole product line is data-driven. Adding a
new animal product family (ducks, rabbits, quail, whatever) is mostly one
entry in a `DEMO_ANIMAL_PACKS` source-of-truth — the dashboard, device cards,
and seeded telemetry all derive from it. There's a 30-minute, no-hardware
walkthrough in the README.

Stack: React + TypeScript + Vite dashboard, Firebase (optional — it falls back
to a per-browser localStorage sim when no project is configured), MQTT for
local-first motion control (motion commands never round-trip the cloud), ESP32
firmware with a strict safety state machine (E-STOP, watchdog, stepper-disable-
on-idle).

Try it with no signup: https://tendercells.com/app/demo
Repo (Apache-2.0): https://github.com/WeCr8/TenderCells

We deliberately built the on-ramp for students and first-time hardware folks —
good-first-issues, a beginner-friendly PR template, and Discussions where
"how does this work?" is a welcome question. Feedback and contributors welcome.

---

## 2. Hackaday tip / blog pitch

**Subject:** Open-source robot chicken coop OS (9DOF arm, ESP32, sim mode)

Hi Hackaday,

We just open-sourced **Tender Cells** (Apache-2.0): a platform for automated
animal care. The flagship Chicken Tender is a 4×4×5 ft coop with a ceiling-
mounted 9DOF motion system — an XYZ gantry carrying a 6DOF arm — that handles
cleaning, egg collection, and feeding. Predator monitoring runs on solar
ESP32-CAM nodes meshed over LoRa.

What might interest your readers:
- **Local-first control.** Motion commands go app → MQTT → ESP32, never through
  the cloud. The cloud is for telemetry and history only.
- **Safety baked into firmware.** Every firmware target follows one state
  machine: BOOT→CONNECTING→IDLE→RUNNING→ERROR→ESTOP, with a watchdog,
  non-blocking reconnect, and steppers disabled on idle.
- **Runs with zero hardware.** A sim mode boots the full dashboard in the
  browser, so people can explore (and contribute) before buying a single servo.
- **Data-driven product line.** New animal enclosures are mostly a config entry.

Live demo: https://tendercells.com/app/demo
Repo + BOMs + firmware: https://github.com/WeCr8/TenderCells

Happy to answer questions or send photos/video of the prototype.

— WeCr8 Solutions

---

## 3. STEM / educator + maker communities

(For r/homestead, r/BackyardChickens, robotics-club Discords, FFA/4-H lists,
local makerspace boards. Lightly tailor the first line per audience.)

**Title:** Free, open-source platform for students to build automated animal care

We're a small team that just made **Tender Cells** fully open source
(Apache-2.0) — and we built it to be a real learning platform, not just a code
dump.

If you teach, run a robotics/FFA/4-H club, or just want a project: you can
explore the whole system in your browser with **no hardware and no signup**,
then graduate to ESP32 firmware, CAD/BOMs, and a 9DOF robot arm when you're
ready.

- ▶ Live demo: https://tendercells.com/app/demo
- 🧭 Beginner tasks (good first issues): in the repo, labeled for newcomers
- 📦 Repo: https://github.com/WeCr8/TenderCells

We have a Code of Conduct section specifically for students and young builders
(public mentorship, no off-platform contact with minors), beginner-friendly
issues, and Discussions where basic questions are explicitly welcome. Bring a
class or club — open a Discussion and tell us what you're building.

---

## Posting checklist

- [ ] Confirm demo URL resolves and seeds correctly in a fresh/incognito browser
- [ ] Confirm the public demo build ships with `VITE_FIREBASE_PROJECT_ID` UNSET
      (so each visitor gets the sim backend, not live Firestore)
- [ ] At least 3 good-first-issues open and labeled
- [ ] Discussions enabled with a pinned welcome post
- [ ] Be available to reply for the first few hours after posting (HN especially)
- [ ] Post HN in the morning ET on a weekday for best visibility
