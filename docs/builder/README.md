# TenderCells Builder

Builder teaches by doing, **one action per screen**. It lives in the OS at **`/builder`**.

Learners start on the simulated farm with no hardware, then build real electronics and bring a live device online:

```text
OBSERVE → DECIDE → AUTOMATE → BUILD → CONNECT → INVENT
```

| # | Item | Phase | Hardware | Milestone |
|---|---|---|---|---|
| M0 | Explore the Farm | OBSERVE | no | Property Explorer |
| M1 | Protect the Chickens | DECIDE | no | Safety Scout |
| M2 | Beat the Heat | DECIDE | no | Heat Helper |
| M3 | Robot Traffic Jam | DECIDE | no | Robot Coordinator |
| M4 | Build a Coop Brain | AUTOMATE | no | Automation Builder |
| M5 | Sensor Detective | OBSERVE | no | Sensor Detective |
| M6 | Make a Light Blink | BUILD | yes | Circuit Builder |
| M7 | Your First Coop Brain (Starter Node) | CONNECT | yes | Live Device Builder |
| M8–M9 | Replace the button with a sensor · Invent a TenderCell | CONNECT · INVENT | yes | coming next |

## How it works

- **Content** lives in `applications/tendercells_ui/test_output/tendercells-ui/src/features/builder/data/`:
  - `missions/*.mission.json`, listed in `missions/manifest.json`;
  - `projects/*.project.json`.
- **The contract** is in `schemas/` (JSON Schema). `lib/validate.ts` enforces it in the tests, so broken content fails CI. It checks:
  - step types, cue types and safety gates;
  - unique step ids;
  - known asset ids;
  - a checkpoint per item;
  - demo bindings that point at real demo events.
- **Depth.** Mission steps carry `instruction_layers` for `young`, `beginner`, `advanced` and `teacher`. These change only the wording, never the action or the system state.
- **Demo bindings.** A step's optional `demo` either runs a demo event (`run`, an id from `lib/demo/eventSimulator.ts`) or opens the OS page it is about (`open`). Every demo action is simulated.
- **Safety gates.** Steps are classified `CHILD_OK`, `SUPERVISION_RECOMMENDED`, `ADULT_REQUIRED`, `POWER_OFF_REQUIRED` or `MOTION_LOCKOUT_REQUIRED`.
  - The last three must be acknowledged before **Next**.
  - Every wiring step requires power off, and a test checks this.
- **Progress** is anonymous and stays in the browser (`localStorage`); no account is needed, and nothing is collected about the learner. A completed item earns its milestone.
- **Accessibility.**
  - Every step has a text alternative for its image.
  - Cues carry words as well as colour.
  - ← / → keys move between steps.

## Images

Steps reference **stable asset ids** (e.g. `board.seeed.xiao-esp32s3.rev1`), never file names.

- Until reference-checked art is published under `public/builder-assets/`, each id renders an illustrated fallback (`lib/assets.ts`).
- Technical parts are flagged so the UI tells learners to check pin positions against the official pinout.
- Never use generated art as an authoritative pinout.

## Hardware handoff

Builder links to the existing tools instead of re-implementing them:
- the browser flasher (`/flash?target=starter-node`);
- `firmware/starter-node/README.md`;
- `docs/CONNECT_A_DEVICE.md`.

The Starter Node project ends at **DEVICE FOUND**: the node's heartbeat on `tc/{id}/sensors` appears in the dashboard.

## Adding a step or a mission

1. Add the step to the mission or project JSON. One action only; split anything ambiguous.
2. Use an asset id from `lib/assets.ts`, or add one there.
3. Add a checkpoint at the end of each logical part.
4. Run `npx vitest run src/__tests__/builder`.
