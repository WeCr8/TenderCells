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
| Book | Chicken Tender Door Controller (21 illustrated steps) | BUILD | yes | concept preview, shown apart from the ladder |

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

## The LEGO standard (every ladder step)

Every step of every mission and hardware build is a full instruction page, and the tests enforce this (`validateItem(..., { lego: true })`). Each step has:

- **Its own picture** (`image.step_asset`):
  - **Missions:** a real screenshot of the simulated farm in the OS. The exact control or panel is spotlighted, numbered and labelled.
  - **Hardware builds:** a drawing of the build so far, with the new part glowing gold and called out, like a LEGO page.
- **`details`:** two or more small physical actions, in order. The learner can tick each one off.
- **`look_for`:** what you should see when the step is done right.
- **`watch_out`:** the most common mistake or safety point.
- **Optional extras:**
  - `code`, a program to type or paste, shown with a Copy button;
  - `parts_list` on a project, shown on step 1 as "What you need".

The pin names in the Blink build are the real Seeed XIAO ESP32-S3 labels (D0 = GPIO1 … D10 = GPIO9, the same mapping as `firmware/starter-node`). The LED is driven from **D0**.

### Making the pictures

**Mission screenshots:** `npm run builder:shots` (`scripts/builder/capture-steps.mjs`).
- It needs the OS running (`npm run build && npx vite preview --port 4317`, or `TC_OS_URL`). For website shots it also needs `TC_WEB_URL`.
- Each step's `shot` says how to take its picture: `{ path, target, label, run?, click?, press?, app? }`.
  - `run` triggers demo events first.
  - `target` is the element to spotlight.
- Pictures land in `public/builder-assets/steps/<item>/<step>.webp`, and the script sets `step_asset` for you.
- Re-run it after a UI change, then look at the pictures.

**Hardware drawings and WHEN · IF · DO cards:** `npm run builder:draw` (`scripts/builder/draw-steps.mjs`).
- It writes SVGs to `public/builder-assets/steps/`.
- Each breadboard scene lists the parts in the build so far, and the newest one is highlighted.

## Images

Steps reference **stable asset ids** (e.g. `board.seeed.xiao-esp32s3.rev1`), never file names.

- Until reference-checked art is published under `public/builder-assets/`, each id renders an illustrated fallback (`lib/assets.ts`).
- Technical parts are flagged so the UI tells learners to check pin positions against the official pinout.
- Never use generated art as an authoritative pinout.

### Covers, books and the parts catalog (Builder Master Package v3)

- **Mission covers.** Each mission has `"cover": "missions/<id>.webp"`, a path under `public/builder-assets/`. They are concept scenes (no wiring), shown on the library cards.
- **Build books.** `projects/chicken-tender-door-book.project.json` is a picture-book walkthrough. Each step shows a page from `public/builder-assets/books/chicken-tender-door/` via `image.step_asset`.
  - The project is `"concept": true`, so the library lists it under **Build books · concept preview**, outside the ladder.
  - Its step page shows the `concept_note` banner, and each page is labelled "CONCEPT ART · not a wiring reference".
  - The pictured XIAO ESP32-S3 runs the Starter Node firmware today, so the flash step points at `/flash?target=starter-node`. The dedicated Chicken Tender firmware targets an ESP32-WROOM-32.
- **Parts catalog.** `data/parts-catalog.json` lists 67 part ids by category, all `validation_status: "draft"`. `lib/assets.ts` merges them into the asset registry as technical parts, so they get the pinout warning.
- **Reference sheets.** The concept sheets the art came from are in `docs/builder/references/`. They are for direction only, never for pinouts.
- **Checks.** The validator takes a `hasFile` check. The tests confirm that every cover and page image exists, every catalog id resolves, and books stay concept and out of the ladder.

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
