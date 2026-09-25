# auto-dev task queue

Tasks the local worker loop will attempt. Rules:

- Only lines starting with `- [ ]` are picked up. Everything else is ignored,
  including headings, notes, and plain bullets. This is deliberate - a looser
  pattern shreds a document into dozens of junk tasks.
- Name a real, existing file directly in the task line (an indented `files:`
  note under it helps a human skim the queue, but the picker itself only
  looks for a real path on the task's own line - name one there).
- Keep each task narrow and verifiable. "Add tests for X" works. "Improve the
  game" does not - the picker requires ONE named existing file and refuses
  broad, unscoped prose on purpose; that stays yours to break down.
- Anything touching payments, auth, secrets, or config is refused automatically,
  so don't bother queuing it.
- Mark a task `- [x]` once you've reviewed and merged its commit.
- This queue is tried whenever the lint/type picker has nothing left to offer
  this turn - gate clean or not. A build task only needs its OWN named file to
  not regress; it is not blocked by this project's wider backlog.

## Queue

- [x] app/services/mqtt.ts: fixed 2026-09-25, verified on origin/main (all 6 any -> unknown). Was stale here - removed.
- [x] server.ts: fixed 2026-09-24, verified on origin/main (err: any -> Error, void next for the unused param). Was stale here after merge - removed.
- [x] src/App.tsx: fixed 2026-09-25, verified on origin/main (both any -> real inline types). Was stale here - removed.
- [x] applications/tendercells_ui/test_output/tendercells-ui/src/pages/PropertyLayoutBuilder.tsx: draw-to-patrol implemented directly 2026-09-25 (not by the fleet) - "Draw Path" button, drag-to-author route committed onto PropertyItem.patrolPath, live + saved polyline rendering. Verified: nested tsconfig.json tsc clean, 22/22 vitest, eslint clean. See docs/ROBOT_OS_MILESTONES.md Milestone 1.
- [ ] applications/tendercells_ui/test_output/tendercells-ui/src/components/viewport/Viewport3D.tsx: Milestone 1 step 2 (docs/ROBOT_OS_MILESTONES.md) - animate a roaming-roost item's loaded GLB mesh along its `patrolPath` (propertyLayoutStore.ts, PropertyItem.patrolPath - real field, now populated by the draw-to-patrol feature). Use simple linear interpolation between consecutive {x,y} points over a fixed duration per segment (e.g. THREE.Vector3.lerp per frame) - no physics engine, this is explicitly a "basic" simulation per the product owner, not a robotics-accurate one. Rotate the mesh to face its direction of travel between points. Loop the path when it reaches the end. VERIFY: node node_modules/typescript/bin/tsc --noEmit -p tsconfig.json (run from applications/tendercells_ui/test_output/tendercells-ui) stays clean; a real check that the mesh visibly moves (not just compiles) is required before calling this done.
  files: applications/tendercells_ui/test_output/tendercells-ui/src/components/viewport/Viewport3D.tsx, applications/tendercells_ui/test_output/tendercells-ui/src/components/property/propertyLayoutStore.ts
  pattern: this file already loads GLBs via GLTFLoader and syncs to the 2D editor via PROPERTY_LAYOUT_EVENT - reuse that existing sync/render loop rather than building a new one.
- [ ] applications/tendercells_ui/test_output/tendercells-ui/src/pages/PropertyLayoutBuilder.tsx: Milestone 1 step 3 (docs/ROBOT_OS_MILESTONES.md) - wire the "Simulate Route" button (search this file for "Simulate Route", currently a dead stub with no onClick) so clicking it triggers the patrol animation added to Viewport3D.tsx. DEPENDS ON the Viewport3D.tsx animation task above being merged first - skip this task if that one is still open. The button already sits in the simulation-mode panel for roaming-roost items; wire its onClick to whatever trigger mechanism Viewport3D.tsx's task established (event, prop, or store flag - match whatever it actually used, don't invent a second mechanism). VERIFY: tsc clean, and a real click-through (button click visibly starts the animation, is not a no-op) before calling this done.
  files: applications/tendercells_ui/test_output/tendercells-ui/src/pages/PropertyLayoutBuilder.tsx
- [ ] applications/tendercells_ui/test_output/tendercells-ui/src/pages/PropertyLayoutBuilder.tsx: Milestone 1 step 4 (docs/ROBOT_OS_MILESTONES.md) - make the patrol respect `ROAMING_BLOCKED_TYPES` (line ~113 in this file, a real existing Set: tree/rock/pond/fence/no-go-zone). DEPENDS ON the two tasks above being merged first - skip this task if either is still open. When the simulated route would cross a blocked-type item's footprint, stop or reroute around it rather than passing through - simplest correct approach: at path-authoring time (the draw-to-patrol step) or at animation time, reject/clip any patrolPath segment that intersects a blocked item's bounding box, matching the same blocked-type check already used at line 759 for the 2D map's own filtering. VERIFY: tsc clean; a real test placing a no-go-zone across a drawn path shows the simulated robot not crossing it.
  files: applications/tendercells_ui/test_output/tendercells-ui/src/pages/PropertyLayoutBuilder.tsx
- [x] app/app/screens/DeviceControl.tsx: fixed 2026-09-25, verified on origin/main. Was stale here - removed.

(empty - add a task above this line in the exact `- [ ] <what, naming one real
file> ` shape described above)

## Reference - good task shapes

- [x] Add tests for an existing pure function
- [x] Add JSDoc to an undocumented exported function
- [x] Fix a specific named lint or type error
- [x] Create a small component that copies an existing pattern

## Reference - task shapes that will waste a night

- [x] "Improve performance" - no definition of done
- [x] "Refactor the X system" - cross-file, needs judgment
- [x] "Add a payment option" - protected path, refused automatically
