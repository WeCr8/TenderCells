# TenderCells Quality Loop Report

Generated: 2026-06-12T12:14:22.166Z
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
[32m✓[39m 11770 modules transformed.
rendering chunks...
computing gzip size...
[2mdist/[22m[32mindex.html                [39m[1m[2m    0.41 kB[22m[1m[22m[2m │ gzip:   0.29 kB[22m
[2mdist/[22m[36massets/index-Fgdo3qM7.js  [39m[1m[2m  375.17 kB[22m[1m[22m[2m │ gzip: 110.65 kB[22m
[2mdist/[22m[36massets/index-BJ5Zenid.js  [39m[1m[33m1,637.49 kB[39m[22m[2m │ gzip: 447.42 kB[22m
[32m✓ built in 16.20s[39m
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

 [32m✓[39m src/__tests__/models/ModelLoader.test.ts [2m([22m[2m8 tests[22m[2m)[22m[90m 5[2mms[22m[39m

[2m Test Files [22m [1m[32m1 passed[39m[22m[90m (1)[39m
[2m      Tests [22m [1m[32m8 passed[39m[22m[90m (8)[39m
[2m   Start at [22m 05:14:47
[2m   Duration [22m 1.43s[2m (transform 63ms, setup 0ms, collect 124ms, tests 5ms, environment 0ms, prepare 675ms)[22m
```



### WARN - Fallow codebase analysis

Command: `npm.cmd run fallow`
Required: no

```text
> tendercells-ui@1.0.0 fallow
> npx --yes fallow@2.94.0 --summary

      14  Unused files
       2  Unused types
       2  Unused class members

      18  Total
       8  Clone families
      16  Clone groups
     473  Duplicated lines
    4.4%  Duplication rate
     634  Functions analyzed
      49  Above threshold
   91.3   Average maintainability (good)
loaded config: C:\Users\zach\Documents\Projects\TenderCells\applications\tendercells_ui\test_output\tendercells-ui\.fallowrc.jsonc

■ Metrics: dead files 17.7% (14 of 79) · dead exports 1.5% (2 of 133) · MI 91.3 (good)
  79 files analyzed
  8 entry points detected (4 manual entry, 3 plugin, 1 package.json)
  3 refactoring targets — start with src/services/deviceService.ts (dead code)

── Dead Code ──────────────────────────────────────
✗ 18 issues (0.08s)

── Duplication ────────────────────────────────────
✗ 4.4% duplication (0.04s)

── Complexity ─────────────────────────────────────
✓ 634 functions analyzed (0.09s)

Failed: dead-code (18 issues), dupes (16 clone groups), health (49 above threshold) — start with src/services/deviceService.ts
```

Repair target: Review fallow findings for dead code, duplication, complexity hotspots, or architecture drift before promoting this to a required gate.

## Repair Loop

1. Fix the first required failure.
2. Run `npm run quality:loop` again.
3. Convert repeated failures into tests or docs.
4. Update the production readiness tracker when the fix changes product behavior.
