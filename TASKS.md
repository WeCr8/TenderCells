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
- [x] applications/tendercells_ui/test_output/tendercells-ui/src/components/viewport/Viewport3D.tsx: Milestone 1 step 2 done 2026-09-29 - roaming-roost items with `patrolPath.length>1` get a precomputed scene-space waypoint list; `animate()` lerps the item's own mesh group (looked up via a new `userData.itemId`, not a separate marker) between waypoints on a fixed 2.5s/segment, loops via modulo, rotates to face travel direction (`Math.atan2`). Gated by a new transient per-item flag (`src/lib/yard/patrolSim.ts`, `PATROL_SIM_EVENT` - mirrors the existing `FARMBOT_POSITION_EVENT` ref pattern so toggling playback never rebuilds the scene). 2026-09-29 follow-up: extracted the lerp/loop/heading math into a pure, DOM-free `computePatrolPose()` in that same file and added `patrolSim.test.ts` (7 cases: start pose, mid-segment lerp, exact waypoint, next-segment re-heading, wraparound loop, <2-point and non-positive-duration rejection) - this is the "real check it moves right" proof that doesn't need a browser; Viewport3D's animate() now just calls it. VERIFIED: nested `tsc --noEmit -p tsconfig.json` 0 errors, `eslint` 0 errors/warnings, `vitest run src/lib/yard/patrolSim.test.ts src/services/demo/demoEnvironment.test.ts` 14/14. NOT verified: an actual browser click-through (no browser tool available this session) - do a manual smoke test (Property Layout Builder → simulation mode → select Roaming Roost → Draw Path → Simulate Route) before treating the visual/UI wiring as fully proven.
  files: applications/tendercells_ui/test_output/tendercells-ui/src/components/viewport/Viewport3D.tsx, applications/tendercells_ui/test_output/tendercells-ui/src/lib/yard/patrolSim.ts
- [x] applications/tendercells_ui/test_output/tendercells-ui/src/pages/PropertyLayoutBuilder.tsx: Milestone 1 step 3 done 2026-09-29 - "Simulate Route" is no longer a disabled stub; it's disabled only when the selected roaming-roost has no drawn path (<2 points), otherwise toggles `setPatrolSimActive(itemId, ...)` (the flag Viewport3D's animation reads) and flips to a "Stop Route" state. Sims auto-stop on leaving simulation mode or unmount (a ref-backed cleanup effect - avoids a rover "driving" forever off-screen). VERIFIED: tsc/eslint/vitest as above. NOT verified: real click-through (same caveat).
  files: applications/tendercells_ui/test_output/tendercells-ui/src/pages/PropertyLayoutBuilder.tsx
- [x] applications/tendercells_ui/test_output/tendercells-ui/src/pages/PropertyLayoutBuilder.tsx: Milestone 1 step 4 done 2026-09-29 - reject-at-authoring-time approach (the one TASKS.md called "simplest correct"): while drawing a patrol path, a new segment is dropped (path stops extending) if it crosses any `ROAMING_BLOCKED_TYPES` item's bounding box (tree/rock/pond/fence/no-go-zone), via a small segment/AABB intersection helper next to the existing `ROAMING_BLOCKED_TYPES` set. Nothing needed in the 3D playback - it can only ever play back a path that was already kept clear. VERIFIED: tsc/eslint/vitest as above. NOT verified: a real drag-across-a-no-go-zone browser test (same caveat).
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
