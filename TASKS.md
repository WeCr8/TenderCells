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

- [ ] app/services/mqtt.ts: 6 real ESLint issues (@typescript-eslint/no-explicit-any), first at line 17. Sample: Unexpected any. Specify a different type. Fix without suppressing (no @ts-ignore/eslint-disable, no weakening types/rules); run npm run lint after and confirm this file's count actually drops.
- [x] server.ts: fixed 2026-09-24, verified on origin/main (err: any -> Error, void next for the unused param). Was stale here after merge - removed.
- [ ] src/App.tsx: 2 real ESLint issues (@typescript-eslint/no-explicit-any), first at line 28. Sample: Unexpected any. Specify a different type. Fix without suppressing (no @ts-ignore/eslint-disable, no weakening types/rules); run npm run lint after and confirm this file's count actually drops.
- [ ] applications/tendercells_ui/test_output/tendercells-ui/src/pages/PropertyLayoutBuilder.tsx: wire the "draw a path with your finger, robot follows it" feature (Milestone 1, docs/ROBOT_OS_MILESTONES.md). A HANDOFF NOTE comment already sits right where the work starts (search the file for "HANDOFF NOTE") with the exact plan: add isDrawingPath + drawnPath state, a "Draw Path" button gated to layoutMode==='simulation' && selectedItem?.type==='roaming-roost', extend the EXISTING handlePointerMove (do not replace - it already owns hover + item drag) to append points while drawing, reuse the existing pointerToFt() conversion already in this file, commit the finished path onto the selected item's patrolPath field (propertyLayoutStore.ts - already added, real field, do not re-add it), and render the in-progress path as an SVG polyline for live feedback. Read the whole HANDOFF NOTE comment before starting - it is the real spec, not a summary. VERIFY: node node_modules/typescript/bin/tsc --noEmit -p tsconfig.json (run from applications/tendercells_ui/test_output/tendercells-ui) must stay clean, and a real click-through (Draw Path button toggles a visibly different pointer mode) must be possible - do not claim done from typecheck alone.
  files: applications/tendercells_ui/test_output/tendercells-ui/src/pages/PropertyLayoutBuilder.tsx, applications/tendercells_ui/test_output/tendercells-ui/src/components/property/propertyLayoutStore.ts
  pattern: the existing GLB-upload block just above the HANDOFF NOTE in the same file (same file, search "Attach robot model") shows the established style/conventions for roaming-roost-specific UI in this component
- [ ] applications/tendercells_ui/test_output/tendercells-ui/src/components/viewport/Viewport3D.tsx: Milestone 1 step 2 (docs/ROBOT_OS_MILESTONES.md) - animate a roaming-roost item's loaded GLB mesh along its `patrolPath` (propertyLayoutStore.ts, PropertyItem.patrolPath - already exists, do not re-add it). DEPENDS ON the draw-to-patrol task above being merged first (patrolPath must actually be populated by something before this is testable) - skip this task if that one is still open. Use simple linear interpolation between consecutive {x,y} points over a fixed duration per segment (e.g. THREE.Vector3.lerp per frame) - no physics engine, this is explicitly a "basic" simulation per the product owner, not a robotics-accurate one. Rotate the mesh to face its direction of travel between points. Loop the path when it reaches the end. VERIFY: node node_modules/typescript/bin/tsc --noEmit -p tsconfig.json (run from applications/tendercells_ui/test_output/tendercells-ui) stays clean; a real check that the mesh visibly moves (not just compiles) is required before calling this done.
  files: applications/tendercells_ui/test_output/tendercells-ui/src/components/viewport/Viewport3D.tsx, applications/tendercells_ui/test_output/tendercells-ui/src/components/property/propertyLayoutStore.ts
  pattern: this file already loads GLBs via GLTFLoader and syncs to the 2D editor via PROPERTY_LAYOUT_EVENT - reuse that existing sync/render loop rather than building a new one.
- [ ] applications/tendercells_ui/test_output/tendercells-ui/src/pages/PropertyLayoutBuilder.tsx: Milestone 1 step 3 (docs/ROBOT_OS_MILESTONES.md) - wire the "Simulate Route" button (search this file for "Simulate Route", currently a dead stub with no onClick) so clicking it triggers the patrol animation added to Viewport3D.tsx. DEPENDS ON the Viewport3D.tsx animation task above being merged first - skip this task if that one is still open. The button already sits in the simulation-mode panel for roaming-roost items; wire its onClick to whatever trigger mechanism Viewport3D.tsx's task established (event, prop, or store flag - match whatever it actually used, don't invent a second mechanism). VERIFY: tsc clean, and a real click-through (button click visibly starts the animation, is not a no-op) before calling this done.
  files: applications/tendercells_ui/test_output/tendercells-ui/src/pages/PropertyLayoutBuilder.tsx
- [ ] applications/tendercells_ui/test_output/tendercells-ui/src/pages/PropertyLayoutBuilder.tsx: Milestone 1 step 4 (docs/ROBOT_OS_MILESTONES.md) - make the patrol respect `ROAMING_BLOCKED_TYPES` (line ~113 in this file, a real existing Set: tree/rock/pond/fence/no-go-zone). DEPENDS ON the two tasks above being merged first - skip this task if either is still open. When the simulated route would cross a blocked-type item's footprint, stop or reroute around it rather than passing through - simplest correct approach: at path-authoring time (the draw-to-patrol step) or at animation time, reject/clip any patrolPath segment that intersects a blocked item's bounding box, matching the same blocked-type check already used at line 759 for the 2D map's own filtering. VERIFY: tsc clean; a real test placing a no-go-zone across a drawn path shows the simulated robot not crossing it.
  files: applications/tendercells_ui/test_output/tendercells-ui/src/pages/PropertyLayoutBuilder.tsx
- [ ] app/app/screens/DeviceControl.tsx: 1 real ESLint issue (@typescript-eslint/no-unused-vars), first at line 16. Sample: 'sendArmCommand' is defined but never used. Allowed unused vars must match /^_/u. Fix without suppressing (no @ts-ignore/eslint-disable, no weakening types/rules); run npm run lint after and confirm this file's count actually drops.

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
