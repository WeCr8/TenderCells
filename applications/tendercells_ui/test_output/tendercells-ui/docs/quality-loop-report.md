# TenderCells Quality Loop Report

Generated: 2026-06-12T08:36:13.982Z
Status: ready-for-repair-review

## Checks

### PASS - TypeScript and production bundle

Command: `npm.cmd run build`
Required: yes

```text
> tendercells-ui@1.0.0 build
> tsc -b && vite build

[36mvite v5.4.21 [32mbuilding for production...[36m[39m
transforming...
[32m✓[39m 11761 modules transformed.
rendering chunks...
computing gzip size...
[2mdist/[22m[32mindex.html                [39m[1m[2m    0.41 kB[22m[1m[22m[2m │ gzip:   0.29 kB[22m
[2mdist/[22m[36massets/index-DbuGOUwI.js  [39m[1m[2m  375.17 kB[22m[1m[22m[2m │ gzip: 110.65 kB[22m
[2mdist/[22m[36massets/index-CQngVr4h.js  [39m[1m[33m1,582.55 kB[39m[22m[2m │ gzip: 435.09 kB[22m
[32m✓ built in 12.29s[39m
[33m
(!) Some chunks are larger than 500 kB after minification. Consider:
- Using dynamic import() to code-split the application
- Use build.rollupOptions.output.manualChunks to improve chunking: https://rollupjs.org/configuration-options/#output-manualchunks
- Adjust chunk size limit for this warning via build.chunkSizeWarningLimit.[39m
```



### PASS - Unit tests

Command: `npm.cmd run test -- --run`
Required: no

```text
> tendercells-ui@1.0.0 test
> vitest --run


[1m[7m[36m RUN [39m[27m[22m [36mv2.1.9 [39m[90mC:/Users/zach/Documents/Projects/TenderCells/applications/tendercells_ui/test_output/tendercells-ui[39m

 [32m✓[39m src/__tests__/models/ModelLoader.test.ts [2m([22m[2m8 tests[22m[2m)[22m[90m 4[2mms[22m[39m

[2m Test Files [22m [1m[32m1 passed[39m[22m[90m (1)[39m
[2m      Tests [22m [1m[32m8 passed[39m[22m[90m (8)[39m
[2m   Start at [22m 01:36:31
[2m   Duration [22m 438ms[2m (transform 56ms, setup 0ms, collect 85ms, tests 4ms, environment 0ms, prepare 128ms)[22m
```



### WARN - Fallow codebase analysis

Command: `npm.cmd run fallow`
Required: no

```text
> tendercells-ui@1.0.0 fallow
> npx --yes fallow@2.94.0 --summary

      77  Unused files
      11  Unused exports
       3  Unused types
       2  Unused class members
      13  Unresolved imports
       3  Unlisted dependencies

     109  Total
      26  Clone families
      35  Clone groups
   1,424  Duplicated lines
   12.1%  Duplication rate
     763  Functions analyzed
      51  Above threshold
   85.0   Average maintainability (good)

■ Metrics: dead files 54.6% (77 of 141) · dead exports 7.3% (14 of 192) · MI 85.0 (good) · 1 churn hotspot
  141 files analyzed
  7 entry points detected (6 plugin, 1 package.json)
  8 refactoring targets — start with applications/tendercells_ui/test_output/tendercells-ui/src/models/presets/coopPresets.ts (dead code)

── Dead Code ──────────────────────────────────────
✗ 109 issues (0.07s)

── Duplication ────────────────────────────────────
✗ 12.1% duplication (0.04s)

── Complexity ─────────────────────────────────────
✓ 763 functions analyzed (0.07s)

Failed: dead-code (109 issues), dupes (35 clone groups), health (51 above threshold) — start with applications/tendercells_ui/test_output/tendercells-ui/src/models/presets/coopPresets.ts
Setup: `fallow init --agents` writes an agent guide; `fallow hooks install --target agent` adds a commit gate (hide this hint: `fallow init --decline`).
```

Repair target: Review fallow findings for dead code, duplication, complexity hotspots, or architecture drift before promoting this to a required gate.

## Repair Loop

1. Fix the first required failure.
2. Run `npm run quality:loop` again.
3. Convert repeated failures into tests or docs.
4. Update the production readiness tracker when the fix changes product behavior.
