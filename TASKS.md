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
