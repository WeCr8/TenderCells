# TenderCells Essential Loop Report

Generated: 2026-06-13T20:38:42.139Z
Status: ready

## Steps

### PASS - Vitest OS and model contracts

Command: `npm.cmd run test -- --run`

```text
> tendercells-ui@0.0.1 test
> vitest --run


[1m[7m[36m RUN [39m[27m[22m [36mv2.1.9 [39m[90mC:/Users/zach/Documents/Projects/TenderCells/applications/tendercells_ui/test_output/tendercells-ui[39m

 [32m✓[39m src/__tests__/models/ModelLoader.test.ts [2m([22m[2m8 tests[22m[2m)[22m[90m 3[2mms[22m[39m
 [32m✓[39m src/__tests__/os/TenderCellsOsContracts.test.ts [2m([22m[2m7 tests[22m[2m)[22m[90m 6[2mms[22m[39m

[2m Test Files [22m [1m[32m2 passed[39m[22m[90m (2)[39m
[2m      Tests [22m [1m[32m15 passed[39m[22m[90m (15)[39m
[2m   Start at [22m 13:38:42
[2m   Duration [22m 573ms[2m (transform 79ms, setup 0ms, collect 152ms, tests 9ms, environment 0ms, prepare 322ms)[22m
```

### PASS - Autonomous build, route, service, and seed-demo audit

Command: `C:\nvm4w\nodejs\node.exe scripts/autonomous-loop.mjs --seed-demo`

```text
0.86 kB[22m
[2mdist/[22m[36massets/three-BGRmT1Yy.js         [39m[1m[2m593.08 kB[22m[1m[22m[2m │ gzip: 153.77 kB[22m
[32m✓ built in 13.36s[39m

== Fallow codebase analysis ==
> tendercells-ui@0.0.1 fallow
> npx --yes fallow@2.94.0 --summary

       6  Unused files
      14  Unused exports
       4  Unused types
       2  Unused class members

      26  Total
      20  Clone families
      26  Clone groups
     651  Duplicated lines
    3.6%  Duplication rate
    1324  Functions analyzed
     119  Above threshold
   91.9   Average maintainability (good)
loaded config: C:\Users\zach\Documents\Projects\TenderCells\applications\tendercells_ui\test_output\tendercells-ui\.fallowrc.jsonc

■ Metrics: dead files 6.0% (6 of 100) · dead exports 8.0% (18 of 226) · MI 91.9 (good)
  100 files analyzed
  17 entry points detected (7 package.json, 6 plugin, 4 manual entry)
  8 refactoring targets — start with src/services/demo/demoEnvironment.ts (dead code)

── Dead Code ──────────────────────────────────────
✗ 26 issues (0.08s)

── Duplication ────────────────────────────────────
✗ 3.6% duplication (0.05s)

── Complexity ─────────────────────────────────────
✓ 1324 functions analyzed (0.09s)

Failed: dead-code (26 issues), dupes (26 clone groups), health (119 above threshold) — start with src/services/demo/demoEnvironment.ts

== App route / ==
200 OK http://localhost:5173/

== App route /dashboard ==
200 OK http://localhost:5173/dashboard

== App route /products ==
200 OK http://localhost:5173/products

== App route /layout ==
200 OK http://localhost:5173/layout

== App route /schedules ==
200 OK http://localhost:5173/schedules

== App route /specs ==
200 OK http://localhost:5173/specs

== App route /analytics ==
200 OK http://localhost:5173/analytics

== App route /diagnostics ==
200 OK http://localhost:5173/diagnostics

== App route /birds ==
200 OK http://localhost:5173/birds

== App route /ai ==
200 OK http://localhost:5173/ai

== App route /setup ==
200 OK http://localhost:5173/setup

== App route /chicken-eye ==
200 OK http://localhost:5173/chicken-eye

== App route /settings ==
200 OK http://localhost:5173/settings

== App route /account ==
200 OK http://localhost:5173/account

== Product route /chicken-tender ==
200 OK http://localhost:5173/chicken-tender

== Product route /roaming-roost ==
200 OK http://localhost:5173/roaming-roost

== Product route /duck-dock ==
200 OK http://localhost:5173/duck-dock

== Product route /goat-guardian ==
200 OK http://localhost:5173/goat-guardian

== Product route /bunny-burrow ==
200 OK http://localhost:5173/bunny-burrow

== Product route /turkey-tower ==
200 OK http://localhost:5173/turkey-tower

== Product route /predator-monitor ==
200 OK http://localhost:5173/predator-monitor

== Product route /rail-system-modules ==
200 OK http://localhost:5173/rail-system-modules

== Product route /tender-cells-cloud ==
200 OK http://localhost:5173/tender-cells-cloud

== Product route /pigeon-palace ==
200 OK http://localhost:5173/pigeon-palace

== OS audit: Product route map ==
OK src/routes/AppRoutes.tsx

== OS audit: Product registration catalog ==
OK src/components/products/ProductRegistrationModal.tsx

== OS audit: Product registry CRUD surface ==
OK src/pages/ProductsPage.tsx

== OS audit: Dynamic side menu sections ==
OK src/components/navigation/SideMenu.tsx

== OS audit: Product section device CRUD panels ==
OK src/components/navigation/ProductSectionPanel.tsx

== OS audit: Property editor simulation contract ==
OK src/pages/PropertyLayoutBuilder.tsx

== OS audit: Shared property layout store ==
OK src/components/property/propertyLayoutStore.ts

== OS audit: 2D and 3D viewport contract ==
OK src/components/viewport/Viewport3D.tsx

== OS audit: Camera and ChickenEye views ==
OK src/pages/ChickenTenderDashboard.tsx

== OS audit: Telemetry and controls ==
OK src/hooks/useTelemetry.ts

== OS audit: Hardware controls ==
OK src/hooks/useHardwareControl.ts

== OS audit: NVIDIA simulation docs ==
OK docs/nvidia-robotics-simulation.md

== OS audit: FarmBot-inspired homestead OS docs ==
OK docs/farmbot-inspired-homestead-os.md

== OS audit: Third-party attribution ==
OK docs/third-party-attribution.md

== OS audit: Mobile packaging docs ==
OK docs/mobile-packaging.md

== OS audit: Production readiness tracker ==
OK docs/production-readiness.md

== Express API health on 4000 ==
200 OK http://localhost:4000/health

== OpenClaw gateway health ==
200 OK http://localhost:8089/health

== Open WebUI health ==
200 OK http://localhost:18789

== Ollama model registry ==
200 OK http://localhost:11434/api/tags

== Demo environment orchestrator ==
OK src/services/demo/demoEnvironment.ts

== Products seed contract ==
OK src/services/productsService.ts

== Property layout device placement ==
OK src/components/property/propertyLayoutStore.ts

Autonomous loop report: C:\Users\zach\Documents\Projects\TenderCells\applications\tendercells_ui\test_output\tendercells-ui\docs\autonomous-loop-report.md
```

## Meaning

The platform passed required tests and the seed-demo autonomous OS audit. Non-blocking Fallow warnings remain backlog signals.
