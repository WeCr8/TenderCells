# Handoff: where things stand (2026-09-30)

For the next agent (Codex, Claude Code or a person) picking up this repo. Everything below is merged to `main` and deployed to Firebase Hosting (`tendercells.com`, with the OS at `/app`).

## Apps

| App | Path | Checks (run before every PR) |
|---|---|---|
| Tender Cells OS | `applications/tendercells_ui/test_output/tendercells-ui` | `npx tsc --noEmit -p .` · `npx eslint .` · `npx vitest run` · `npm run build` |
| Website | `applications/tendercells_ui/test_output/website` | `npx tsc -b` · `npx eslint .` · `npm run sync:docs` · `npm run check:docs` · `npm run check:links` · `npm run build` |
| Hub (express-api) | `applications/tendercells_ui/test_output/express-api` | `npx tsc --noEmit -p .` · `npm test` · `npm run describe:xml -- --check` |
| Robot services (Python) | `firmware/jetson-nano` | `python3 -m pytest tests -q` |

- **Flow:** open a PR to `main`. CI (`.github/workflows/ci.yml`) runs the affected jobs, and a merge to `main` deploys (`deploy.yml`).
- **Conventions:** see `.claude/CLAUDE.md`. In short:
  - colour tokens, no raw hex outside token maps;
  - every hardware action goes through a confirm dialog;
  - E-STOP stays intact;
  - honest "simulated" labels;
  - no secrets in code.
- **Generated files:**
  - Edit `docs/*.md`, then run `npm run sync:docs` in the website. That publishes them to `website/public/docs`.
  - Edit `express-api/backend/src/describe.ts`, then run `npm run describe:xml`. That writes `website/public/api/tendercells-backend.xml`.
  - `tsconfig.tsbuildinfo` files change on every build. Don't commit them.

## Shipped today (PRs #153–#163)

| Area | What | Key files |
|---|---|---|
| Demo | `/demo` opens on the live 2D/3D Property Twin, with connection cards | `src/pages/DemoLandingPage.tsx` |
| Demo | The farm runs itself in every 3D viewer ("Autonomous farm · simulated"). Routes stay inside the boundary and out of zones, and the mower obeys its interlock. | `src/lib/demo/farmAutopilot.ts`, `src/components/viewport/Viewport3D.tsx` |
| Demo | Event simulator, missions, discovery | `src/lib/demo/*`, `src/pages/DemoLandingPage.tsx` |
| Property | Property boundary geofence, plus robot-survey proposals the owner must accept (widening needs confirmation) | `src/lib/yard/boundary.ts`, `components/property/BoundaryPanel.tsx`, `firmware/jetson-nano/zones.py`, `docs/ROBOT_EXCLUSION_ZONES.md` |
| Mowers | Bring your own mower: Home Assistant, MQTT, Husqvarna, GARDENA, Mammotion. Basic and advanced mowing (patterns), with animal-safety interlocks. | `express-api/backend/src/mower*.ts`, `src/lib/mower/*`, `src/pages/MowersPage.tsx`, `docs/ROBOT_MOWERS.md` |
| Digital twin | `/digital-twin` page, twin IDs, provenance | `docs/TENDERCELLS_DIGITAL_TWIN_ARCHITECTURE.md` + website |
| GPS / maps | Groundwork only: GPS ↔ property feet, map tiles | `src/lib/yard/geo.ts`, `docs/GPS_AND_MAP_OVERLAYS.md` |
| Video | Demo video script timed to the Tender Cells Anthem; captions, capture and rough-cut tools | `docs/video/`, `tendercells-ui/scripts/video/` |

## Open threads / next steps

1. **GPS and real maps** (`docs/GPS_AND_MAP_OVERLAYS.md`, phases 1–4).
   - Place the property on the map (`GeoAnchor`).
   - Add imagery under the 2D/3D view (pick a provider and keep its key in the hub env).
   - Load real elevation.
   - Add a `tc/{id}/state/gps` topic plus a `geo` anchor in `cfg/zones`.
2. **Robot survey on real hardware.** No firmware publishes `tc/{id}/state/survey` yet; the demo survey is simulated. The contract is in `docs/ROBOT_EXCLUSION_ZONES.md`.
3. **Roaming Roost ESP32.** It has no position estimate yet, so it can't enforce the boundary or zones on board.
4. **Demo video.**
   - Nudge the caption times onto the vocal in `docs/video/anthem-cues.json`, then run `npm run video:cues`.
   - For the final edit, add real hardware b-roll where available.
   - Audio is the song only: never add voice-over, narration or sound effects over it.
   - To regenerate the rough cut, run `npm run video:shots` and then `npm run video:roughcut`. Both need the dev servers on :5173 and :5176, plus ffmpeg with libass.
5. **Phone layout of the 3D viewer's bottom bar.** In the `/demo` hero on phones it wraps to two lines.
6. **Demo follow-up pack (2026-10-01).**
   - **Done:**
     - property-first opening copy and owner-facing status;
     - the first visit opens on the robot traffic jam (mower ↔ Roaming Roost work-area interlock, in the OS and the hub rule);
     - "Why?" at kid / farmer / engineer depth (`components/demo/WhyPanel.tsx`);
     - the Robot traffic jam, Beat the heat and Build a coop brain missions;
     - the Property Twin inspector with "How this becomes real" (`lib/twin/physical.ts`);
     - funnel analytics (`lib/demo/track.ts`).
   - **Next:**
     - highlight the affected twin on the 3D map when an event fires;
     - requested → acknowledged → confirmed command states in the UI;
     - the OS sends roost positions so the hub enforces `occupiedBy` live;
     - generic simulated irrigation (Orbit B-hyve, labelled COMMUNITY until official access is verified) and hive-monitor twins, with the irrigation ↔ mower hold;
     - mobile / Safari QA;
     - update `demo-manifest.json` / `snapshot.json` to match.
7. **Builder** (`/builder`, `docs/builder/README.md`).
   - **Done:**
     - the mission ladder M0–M5, Blink (M6), Starter Node (M7);
     - four depths, safety gates, demo bindings, local milestones and content validation;
     - mission cover art;
     - the Chicken Tender Door concept book (21 illustrated pages, labelled concept);
     - a draft parts catalog of 67 ids.
   - **Next:**
     - verify the door book against real parts, then drop `concept`;
     - reference-checked part art for the catalog ids;
     - M8 (sensor) and M9 (invent);
     - printable export from the same step data;
     - teacher / classroom mode;
     - mirror into the Python generator once stable.
8. **AI assistant plugin: Claude and ChatGPT** (`docs/AI_ASSISTANT_PLUGIN.md`).
   - **Done (v0.1):** one MCP server in the hub (`express-api/backend/src/mcp/`).
     - Read tools and `emergency_stop` are always available.
     - Door, feed, relay, stop-cleaning and mark-handled are confirm-twice actions (`request_action` → person says yes → `confirm_action`). They are off unless `TC_MCP_ALLOW_ACTIONS=1`.
     - Transports: stdio (`npm run mcp`) and HTTP (`npm run mcp:http`, with an access key).
     - A Claude Code plugin (`plugins/tendercells`, farm-check skill) and its marketplace entry.
   - **Done (v0.2):**
     - `get_farm_overview`, with animal-health flags and structured output;
     - the inline farm card (MCP Apps view, `express-api/mcp-view/`) for Claude and ChatGPT;
     - the `farm_check` and `evening_lockup` prompts;
     - the demo farm (`npm run mcp:demo`, `TC_MCP_DEMO=1`);
     - the Claude Desktop extension (`npm run mcp:pack` → `dist/tendercells.mcpb`, packed in CI).
   - **Next:**
     - OAuth 2.1 instead of `TC_TOKEN` and URL keys;
     - a hosted demo endpoint;
     - ChatGPT app and Claude directory listings;
     - a signed `.mcpb` on GitHub releases.
   - Never add arm / drive / laser / mower motion or E-STOP clear to the assistant tools.
9. **Older open PRs not from today:** #106 (Copilot auth flow) and the Dependabot bumps #96–#103. Review or merge them separately.
