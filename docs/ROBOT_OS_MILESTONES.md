# Robot OS milestones

Goal: TenderCells becomes a home-robotics platform — load any robot's 3D
package (GLB model + capability manifest), see it on the real property map,
schedule it to run basic tasks (starting with waypoint patrol).

This is not a from-scratch build. The audit below (2026-09-25) found most of
the pipeline already exists, just disconnected in a few specific places.
Reuse-first, per Zach's direction — only the checked-empty items are real
gaps.

## Milestone 0 — audit of what already exists (done)

- [x] Product registry already has a robot template: `ProductRegistrationModal.tsx`
      → `roaming-roost` (`DirectionsCarOutlinedIcon`, "Mobile motorized rearing
      enclosure that moves around a yard autonomously"), with
      `simulationBackend: 'nvidia_isaac'`, `propertySimulationEnabled: true`,
      `simulationProfile: 'mobile-navigation-and-obstacle-avoidance'`.
- [x] "Load your own robot package" already scaffolded: `community-custom`
      product family + `custom_device_asset_url` / `property_scene_url` /
      `terrain_source` fields in `types/products.ts` (`ProductMetadata`).
- [x] A **real open-source robot project is already integrated**, not just
      referenced: FarmBot Genesis (`farmbot-genesis`, `farmbot-genesis-xl` in
      `GARDEN_HW_TYPES`, `PropertyLayoutBuilder.tsx`). Control is bridged to
      FarmBot's own web app (`FarmBotBridgePanel`) — deliberately not
      reimplemented, per the code's own comment (their asset is CC-BY-NC).
- [x] GLB (glTF binary) upload already works end-to-end for garden-type
      hardware: file picker → `URL.createObjectURL` → `item.modelUrl` →
      loaded by `Viewport3D.tsx`'s real `GLTFLoader` into a real Three.js
      scene (orbit controls, procedural sky, live-synced to the 2D editor via
      `PROPERTY_LAYOUT_EVENT`). This is the exact "see your robot on the
      property map" requirement — already built, just not yet wired for the
      `roaming-roost` type specifically.
- [x] Obstacle-avoidance data model exists: `ROAMING_BLOCKED_TYPES` (tree,
      rock, pond, fence, no-go-zone) is a real Set already filtered against
      in the 2D map (`PropertyLayoutBuilder.tsx:747`). No-go zones already
      say "Roaming Roost will not enter this area" in the UI copy.
- [x] A "Simulate Route" button already exists in the simulation-mode panel
      for `roaming-roost` items (`PropertyLayoutBuilder.tsx:1059-1063`) —
      **currently a dead stub, no onClick handler.**

## Milestone 1 — first real robot on the map, patrolling on a schedule

- [x] Enable GLB upload for `roaming-roost` items. Added a dedicated block
      (not just adding it to `GARDEN_HW_TYPES` - that block's copy assumes a
      whole-scene replacement, wrong framing for a robot's own model) reusing
      the exact same proven upload → `modelUrl` → `Viewport3D` GLTFLoader
      path. Verified: `tsc --noEmit -p tsconfig.json` clean (0 errors) on the
      real project config.
- [x] Add the waypoint field: `PropertyItem.patrolPath` (`Array<{x,y}>`,
      property-coordinate feet, same shape as the existing `scan.boundary`
      field for rendering-code reuse, but a separate field - `scan` is
      robot-reported, `patrolPath` is user-authored). `propertyLayoutStore.ts`.
- [x] Draw a path with your finger/mouse and the robot follows it - done
      2026-09-25. This is also the real, well-known feature Zach was
      recalling (Sphero's "Draw N' Drive" - confirmed via web search, not
      assumed; the real Sphero feature is plain touchscreen drawing, not
      AR/VR - that's a real *later* layer, not a prerequisite. Real
      open-source references if wanted: TrackBot, github.com/muhammadnavas/
      TrackBot; Hand2Robot, github.com/xlistenz/Hand2Robot, the AR-layer
      option). A "Draw Path" toggle button appears next to Simulate Route
      when a roaming-roost is selected in simulation mode; dragging across
      the map appends feet-space points via the existing `pointerToFt()`
      conversion, extending the existing `handlePointerMove` (not replaced -
      it still owns hover + item drag). Releasing the pointer commits the
      path onto `PropertyItem.patrolPath` and renders it as a persistent
      amber dashed polyline; a gold polyline shows live feedback while
      drawing. `PropertyLayoutBuilder.tsx`. Verified: nested project's own
      `tsc --noEmit -p tsconfig.json` (0 errors - this is a real gap: the
      repo's root gate only typechecks the root tsconfig.app.json/
      tsconfig.node.json, never this nested subproject, so always verify
      this config directly here too), 22/22 vitest, eslint clean.
- [ ] Once path-drawing lands: animate `item.modelUrl`'s loaded mesh along
      `patrolPath` in `Viewport3D.tsx` using simple interpolation (no physics
      engine needed for "basic tasks" per Zach's own framing) and wire the
      dead "Simulate Route" button (`PropertyLayoutBuilder.tsx:1059-1063`,
      currently no onClick) to trigger it.
- [ ] Respect `ROAMING_BLOCKED_TYPES` during the patrol (skip/avoid
      no-go-zone footprints) — data already exists, just needs consuming in
      the movement step.
- [ ] Bind the patrol to whatever scheduling primitive `SchedulesPage.tsx`
      already uses for hardware tasks (audit that file before designing a
      new one — likely reuse-only, per Zach's instruction).
- [ ] One real, end-to-end test: register a `roaming-roost`, attach a free
      RC-car-like GLB (sourced from a CC0/CC-BY source — Kenney.nl or
      Sketchfab, or the bundled three.js `RobotExpressive` example asset as
      a placeholder), place 2-3 waypoints, run on a schedule, confirm it
      moves and avoids a no-go zone.

## Milestone 2 — generalize beyond one robot type (not started)

- [ ] Formalize the "robot package" as its own product family (not just
      `community-custom`) if usage grows beyond one type: real capability
      manifest (what functions a robot exposes — `move_to`, `patrol`,
      `dock`) alongside the GLB, so the schedule UI can offer real
      functions per robot instead of one hardcoded patrol behavior.
- [ ] Investigate whether `nvidia_isaac` backend (already selectable in
      registration) is real/wired anywhere, or purely aspirational config
      today — do not assume; check before building against it.

## Notes

- FarmBot Genesis is real, real code, real integration point — worth
  treating as the reference "robot package" shape once milestone 1 proves
  the pattern for a second (generic) robot type.
- Everything in Milestone 0 was verified by reading the actual source, not
  assumed from file/variable names.
