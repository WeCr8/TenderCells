# TenderCells Autonomous Loop Report

Generated: 2026-06-13T20:38:43.612Z
Status: ready-with-warnings
Iterations: 1
Route base: http://localhost:5173
Seed demo checks: yes
Auto repair: no
Auto repair files: none

## Checks

### PASS - Production build

Iteration: 1
Kind: command
Required: yes



```text
> tendercells-ui@0.0.1 build
> tsc -b && vite build

[36mvite v5.4.21 [32mbuilding for production...[36m[39m
transforming...
[32m✓[39m 11872 modules transformed.
rendering chunks...
computing gzip size...
[2mdist/[22m[32mindex.html                       [39m[1m[2m  0.80 kB[22m[1m[22m[2m │ gzip:   0.40 kB[22m
[2mdist/[22m[35massets/index-CSBLonOk.css        [39m[1m[2m  0.19 kB[22m[1m[22m[2m │ gzip:   0.15 kB[22m
[2mdist/[22m[36massets/react-vendor-CFNhyEbi.js  [39m[1m[2m161.06 kB[22m[1m[22m[2m │ gzip:  52.50 kB[22m
[2mdist/[22m[36massets/index-JTjaAvLA.js         [39m[1m[2m362.71 kB[22m[1m[22m[2m │ gzip:  97.01 kB[22m
[2mdist/[22m[36massets/index-DjStJqO1.js         [39m[1m[2m375.20 kB[22m[1m[22m[2m │ gzip: 110.67 kB[22m
[2mdist/[22m[36massets/mui-D35VV_AL.js           [39m[1m[2m431.01 kB[22m[1m[22m[2m │ gzip: 129.37 kB[22m
[2mdist/[22m[36massets/firebase-e_8nbQyS.js      [39m[1m[2m521.93 kB[22m[1m[22m[2m │ gzip: 120.86 kB[22m
[2mdist/[22m[36massets/three-BGRmT1Yy.js         [39m[1m[2m593.08 kB[22m[1m[22m[2m │ gzip: 153.77 kB[22m
[32m✓ built in 13.36s[39m
```

### WARN - Fallow codebase analysis

Iteration: 1
Kind: command
Required: no



```text
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
```

### PASS - App route /

Iteration: 1
Kind: http
Required: no
URL: http://localhost:5173/


```text
<!DOCTYPE html>
<html lang="en">
  <head>
    <script type="module">import { injectIntoGlobalHook } from "/@react-refresh";
injectIntoGlobalHook(window);
window.$RefreshReg$ = () => {};
window.$RefreshSig$ = () => (type) => type;</script>

    <script type="module" src="/@vite/client"></script>

    <meta charset="UTF-8" />
    <link rel="icon" type="image/svg+xml" href="/vite.svg" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>TenderCells Unified UI</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.tsx?t=1781381164261"></script>
  </body>
</html>


```

### PASS - App route /dashboard

Iteration: 1
Kind: http
Required: no
URL: http://localhost:5173/dashboard


```text
<!DOCTYPE html>
<html lang="en">
  <head>
    <script type="module">import { injectIntoGlobalHook } from "/@react-refresh";
injectIntoGlobalHook(window);
window.$RefreshReg$ = () => {};
window.$RefreshSig$ = () => (type) => type;</script>

    <script type="module" src="/@vite/client"></script>

    <meta charset="UTF-8" />
    <link rel="icon" type="image/svg+xml" href="/vite.svg" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>TenderCells Unified UI</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.tsx?t=1781381164261"></script>
  </body>
</html>


```

### PASS - App route /products

Iteration: 1
Kind: http
Required: no
URL: http://localhost:5173/products


```text
<!DOCTYPE html>
<html lang="en">
  <head>
    <script type="module">import { injectIntoGlobalHook } from "/@react-refresh";
injectIntoGlobalHook(window);
window.$RefreshReg$ = () => {};
window.$RefreshSig$ = () => (type) => type;</script>

    <script type="module" src="/@vite/client"></script>

    <meta charset="UTF-8" />
    <link rel="icon" type="image/svg+xml" href="/vite.svg" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>TenderCells Unified UI</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.tsx?t=1781381164261"></script>
  </body>
</html>


```

### PASS - App route /layout

Iteration: 1
Kind: http
Required: no
URL: http://localhost:5173/layout


```text
<!DOCTYPE html>
<html lang="en">
  <head>
    <script type="module">import { injectIntoGlobalHook } from "/@react-refresh";
injectIntoGlobalHook(window);
window.$RefreshReg$ = () => {};
window.$RefreshSig$ = () => (type) => type;</script>

    <script type="module" src="/@vite/client"></script>

    <meta charset="UTF-8" />
    <link rel="icon" type="image/svg+xml" href="/vite.svg" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>TenderCells Unified UI</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.tsx?t=1781381164261"></script>
  </body>
</html>


```

### PASS - App route /schedules

Iteration: 1
Kind: http
Required: no
URL: http://localhost:5173/schedules


```text
<!DOCTYPE html>
<html lang="en">
  <head>
    <script type="module">import { injectIntoGlobalHook } from "/@react-refresh";
injectIntoGlobalHook(window);
window.$RefreshReg$ = () => {};
window.$RefreshSig$ = () => (type) => type;</script>

    <script type="module" src="/@vite/client"></script>

    <meta charset="UTF-8" />
    <link rel="icon" type="image/svg+xml" href="/vite.svg" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>TenderCells Unified UI</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.tsx?t=1781381164261"></script>
  </body>
</html>


```

### PASS - App route /specs

Iteration: 1
Kind: http
Required: no
URL: http://localhost:5173/specs


```text
<!DOCTYPE html>
<html lang="en">
  <head>
    <script type="module">import { injectIntoGlobalHook } from "/@react-refresh";
injectIntoGlobalHook(window);
window.$RefreshReg$ = () => {};
window.$RefreshSig$ = () => (type) => type;</script>

    <script type="module" src="/@vite/client"></script>

    <meta charset="UTF-8" />
    <link rel="icon" type="image/svg+xml" href="/vite.svg" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>TenderCells Unified UI</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.tsx?t=1781381164261"></script>
  </body>
</html>


```

### PASS - App route /analytics

Iteration: 1
Kind: http
Required: no
URL: http://localhost:5173/analytics


```text
<!DOCTYPE html>
<html lang="en">
  <head>
    <script type="module">import { injectIntoGlobalHook } from "/@react-refresh";
injectIntoGlobalHook(window);
window.$RefreshReg$ = () => {};
window.$RefreshSig$ = () => (type) => type;</script>

    <script type="module" src="/@vite/client"></script>

    <meta charset="UTF-8" />
    <link rel="icon" type="image/svg+xml" href="/vite.svg" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>TenderCells Unified UI</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.tsx?t=1781381164261"></script>
  </body>
</html>


```

### PASS - App route /diagnostics

Iteration: 1
Kind: http
Required: no
URL: http://localhost:5173/diagnostics


```text
<!DOCTYPE html>
<html lang="en">
  <head>
    <script type="module">import { injectIntoGlobalHook } from "/@react-refresh";
injectIntoGlobalHook(window);
window.$RefreshReg$ = () => {};
window.$RefreshSig$ = () => (type) => type;</script>

    <script type="module" src="/@vite/client"></script>

    <meta charset="UTF-8" />
    <link rel="icon" type="image/svg+xml" href="/vite.svg" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>TenderCells Unified UI</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.tsx?t=1781381164261"></script>
  </body>
</html>


```

### PASS - App route /birds

Iteration: 1
Kind: http
Required: no
URL: http://localhost:5173/birds


```text
<!DOCTYPE html>
<html lang="en">
  <head>
    <script type="module">import { injectIntoGlobalHook } from "/@react-refresh";
injectIntoGlobalHook(window);
window.$RefreshReg$ = () => {};
window.$RefreshSig$ = () => (type) => type;</script>

    <script type="module" src="/@vite/client"></script>

    <meta charset="UTF-8" />
    <link rel="icon" type="image/svg+xml" href="/vite.svg" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>TenderCells Unified UI</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.tsx?t=1781381164261"></script>
  </body>
</html>


```

### PASS - App route /ai

Iteration: 1
Kind: http
Required: no
URL: http://localhost:5173/ai


```text
<!DOCTYPE html>
<html lang="en">
  <head>
    <script type="module">import { injectIntoGlobalHook } from "/@react-refresh";
injectIntoGlobalHook(window);
window.$RefreshReg$ = () => {};
window.$RefreshSig$ = () => (type) => type;</script>

    <script type="module" src="/@vite/client"></script>

    <meta charset="UTF-8" />
    <link rel="icon" type="image/svg+xml" href="/vite.svg" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>TenderCells Unified UI</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.tsx?t=1781381164261"></script>
  </body>
</html>


```

### PASS - App route /setup

Iteration: 1
Kind: http
Required: no
URL: http://localhost:5173/setup


```text
<!DOCTYPE html>
<html lang="en">
  <head>
    <script type="module">import { injectIntoGlobalHook } from "/@react-refresh";
injectIntoGlobalHook(window);
window.$RefreshReg$ = () => {};
window.$RefreshSig$ = () => (type) => type;</script>

    <script type="module" src="/@vite/client"></script>

    <meta charset="UTF-8" />
    <link rel="icon" type="image/svg+xml" href="/vite.svg" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>TenderCells Unified UI</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.tsx?t=1781381164261"></script>
  </body>
</html>


```

### PASS - App route /chicken-eye

Iteration: 1
Kind: http
Required: no
URL: http://localhost:5173/chicken-eye


```text
<!DOCTYPE html>
<html lang="en">
  <head>
    <script type="module">import { injectIntoGlobalHook } from "/@react-refresh";
injectIntoGlobalHook(window);
window.$RefreshReg$ = () => {};
window.$RefreshSig$ = () => (type) => type;</script>

    <script type="module" src="/@vite/client"></script>

    <meta charset="UTF-8" />
    <link rel="icon" type="image/svg+xml" href="/vite.svg" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>TenderCells Unified UI</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.tsx?t=1781381164261"></script>
  </body>
</html>


```

### PASS - App route /settings

Iteration: 1
Kind: http
Required: no
URL: http://localhost:5173/settings


```text
<!DOCTYPE html>
<html lang="en">
  <head>
    <script type="module">import { injectIntoGlobalHook } from "/@react-refresh";
injectIntoGlobalHook(window);
window.$RefreshReg$ = () => {};
window.$RefreshSig$ = () => (type) => type;</script>

    <script type="module" src="/@vite/client"></script>

    <meta charset="UTF-8" />
    <link rel="icon" type="image/svg+xml" href="/vite.svg" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>TenderCells Unified UI</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.tsx?t=1781381164261"></script>
  </body>
</html>


```

### PASS - App route /account

Iteration: 1
Kind: http
Required: no
URL: http://localhost:5173/account


```text
<!DOCTYPE html>
<html lang="en">
  <head>
    <script type="module">import { injectIntoGlobalHook } from "/@react-refresh";
injectIntoGlobalHook(window);
window.$RefreshReg$ = () => {};
window.$RefreshSig$ = () => (type) => type;</script>

    <script type="module" src="/@vite/client"></script>

    <meta charset="UTF-8" />
    <link rel="icon" type="image/svg+xml" href="/vite.svg" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>TenderCells Unified UI</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.tsx?t=1781381164261"></script>
  </body>
</html>


```

### PASS - Product route /chicken-tender

Iteration: 1
Kind: http
Required: no
URL: http://localhost:5173/chicken-tender


```text
<!DOCTYPE html>
<html lang="en">
  <head>
    <script type="module">import { injectIntoGlobalHook } from "/@react-refresh";
injectIntoGlobalHook(window);
window.$RefreshReg$ = () => {};
window.$RefreshSig$ = () => (type) => type;</script>

    <script type="module" src="/@vite/client"></script>

    <meta charset="UTF-8" />
    <link rel="icon" type="image/svg+xml" href="/vite.svg" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>TenderCells Unified UI</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.tsx?t=1781381164261"></script>
  </body>
</html>


```

### PASS - Product route /roaming-roost

Iteration: 1
Kind: http
Required: no
URL: http://localhost:5173/roaming-roost


```text
<!DOCTYPE html>
<html lang="en">
  <head>
    <script type="module">import { injectIntoGlobalHook } from "/@react-refresh";
injectIntoGlobalHook(window);
window.$RefreshReg$ = () => {};
window.$RefreshSig$ = () => (type) => type;</script>

    <script type="module" src="/@vite/client"></script>

    <meta charset="UTF-8" />
    <link rel="icon" type="image/svg+xml" href="/vite.svg" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>TenderCells Unified UI</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.tsx?t=1781381164261"></script>
  </body>
</html>


```

### PASS - Product route /duck-dock

Iteration: 1
Kind: http
Required: no
URL: http://localhost:5173/duck-dock


```text
<!DOCTYPE html>
<html lang="en">
  <head>
    <script type="module">import { injectIntoGlobalHook } from "/@react-refresh";
injectIntoGlobalHook(window);
window.$RefreshReg$ = () => {};
window.$RefreshSig$ = () => (type) => type;</script>

    <script type="module" src="/@vite/client"></script>

    <meta charset="UTF-8" />
    <link rel="icon" type="image/svg+xml" href="/vite.svg" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>TenderCells Unified UI</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.tsx?t=1781381164261"></script>
  </body>
</html>


```

### PASS - Product route /goat-guardian

Iteration: 1
Kind: http
Required: no
URL: http://localhost:5173/goat-guardian


```text
<!DOCTYPE html>
<html lang="en">
  <head>
    <script type="module">import { injectIntoGlobalHook } from "/@react-refresh";
injectIntoGlobalHook(window);
window.$RefreshReg$ = () => {};
window.$RefreshSig$ = () => (type) => type;</script>

    <script type="module" src="/@vite/client"></script>

    <meta charset="UTF-8" />
    <link rel="icon" type="image/svg+xml" href="/vite.svg" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>TenderCells Unified UI</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.tsx?t=1781381164261"></script>
  </body>
</html>


```

### PASS - Product route /bunny-burrow

Iteration: 1
Kind: http
Required: no
URL: http://localhost:5173/bunny-burrow


```text
<!DOCTYPE html>
<html lang="en">
  <head>
    <script type="module">import { injectIntoGlobalHook } from "/@react-refresh";
injectIntoGlobalHook(window);
window.$RefreshReg$ = () => {};
window.$RefreshSig$ = () => (type) => type;</script>

    <script type="module" src="/@vite/client"></script>

    <meta charset="UTF-8" />
    <link rel="icon" type="image/svg+xml" href="/vite.svg" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>TenderCells Unified UI</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.tsx?t=1781381164261"></script>
  </body>
</html>


```

### PASS - Product route /turkey-tower

Iteration: 1
Kind: http
Required: no
URL: http://localhost:5173/turkey-tower


```text
<!DOCTYPE html>
<html lang="en">
  <head>
    <script type="module">import { injectIntoGlobalHook } from "/@react-refresh";
injectIntoGlobalHook(window);
window.$RefreshReg$ = () => {};
window.$RefreshSig$ = () => (type) => type;</script>

    <script type="module" src="/@vite/client"></script>

    <meta charset="UTF-8" />
    <link rel="icon" type="image/svg+xml" href="/vite.svg" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>TenderCells Unified UI</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.tsx?t=1781381164261"></script>
  </body>
</html>


```

### PASS - Product route /predator-monitor

Iteration: 1
Kind: http
Required: no
URL: http://localhost:5173/predator-monitor


```text
<!DOCTYPE html>
<html lang="en">
  <head>
    <script type="module">import { injectIntoGlobalHook } from "/@react-refresh";
injectIntoGlobalHook(window);
window.$RefreshReg$ = () => {};
window.$RefreshSig$ = () => (type) => type;</script>

    <script type="module" src="/@vite/client"></script>

    <meta charset="UTF-8" />
    <link rel="icon" type="image/svg+xml" href="/vite.svg" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>TenderCells Unified UI</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.tsx?t=1781381164261"></script>
  </body>
</html>


```

### PASS - Product route /rail-system-modules

Iteration: 1
Kind: http
Required: no
URL: http://localhost:5173/rail-system-modules


```text
<!DOCTYPE html>
<html lang="en">
  <head>
    <script type="module">import { injectIntoGlobalHook } from "/@react-refresh";
injectIntoGlobalHook(window);
window.$RefreshReg$ = () => {};
window.$RefreshSig$ = () => (type) => type;</script>

    <script type="module" src="/@vite/client"></script>

    <meta charset="UTF-8" />
    <link rel="icon" type="image/svg+xml" href="/vite.svg" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>TenderCells Unified UI</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.tsx?t=1781381164261"></script>
  </body>
</html>


```

### PASS - Product route /tender-cells-cloud

Iteration: 1
Kind: http
Required: no
URL: http://localhost:5173/tender-cells-cloud


```text
<!DOCTYPE html>
<html lang="en">
  <head>
    <script type="module">import { injectIntoGlobalHook } from "/@react-refresh";
injectIntoGlobalHook(window);
window.$RefreshReg$ = () => {};
window.$RefreshSig$ = () => (type) => type;</script>

    <script type="module" src="/@vite/client"></script>

    <meta charset="UTF-8" />
    <link rel="icon" type="image/svg+xml" href="/vite.svg" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>TenderCells Unified UI</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.tsx?t=1781381164261"></script>
  </body>
</html>


```

### PASS - Product route /pigeon-palace

Iteration: 1
Kind: http
Required: no
URL: http://localhost:5173/pigeon-palace


```text
<!DOCTYPE html>
<html lang="en">
  <head>
    <script type="module">import { injectIntoGlobalHook } from "/@react-refresh";
injectIntoGlobalHook(window);
window.$RefreshReg$ = () => {};
window.$RefreshSig$ = () => (type) => type;</script>

    <script type="module" src="/@vite/client"></script>

    <meta charset="UTF-8" />
    <link rel="icon" type="image/svg+xml" href="/vite.svg" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>TenderCells Unified UI</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.tsx?t=1781381164261"></script>
  </body>
</html>


```

### PASS - OS audit: Product route map

Iteration: 1
Kind: source
Required: yes

File: src/routes/AppRoutes.tsx

```text
src/routes/AppRoutes.tsx has /chicken-tender, /roaming-roost, /duck-dock, /goat-guardian, /bunny-burrow, /turkey-tower, /predator-monitor, /rail-system-modules, /tender-cells-cloud, /pigeon-palace
```

### PASS - OS audit: Product registration catalog

Iteration: 1
Kind: source
Required: yes

File: src/components/products/ProductRegistrationModal.tsx

```text
src/components/products/ProductRegistrationModal.tsx has chicken-tender, roaming-roost, duck-dock, goat-guardian, bunny-burrow, turkey-tower, predator-monitor, rail-system, door-system, waterer, feeder, custom_product
```

### PASS - OS audit: Product registry CRUD surface

Iteration: 1
Kind: source
Required: yes

File: src/pages/ProductsPage.tsx

```text
src/pages/ProductsPage.tsx has registerProduct, updateProduct, deleteProduct, connectProduct, custom_product_name, product_family
```

### PASS - OS audit: Dynamic side menu sections

Iteration: 1
Kind: source
Required: yes

File: src/components/navigation/SideMenu.tsx

```text
src/components/navigation/SideMenu.tsx has PRODUCT_ITEMS, chicken-tender, roaming-roost, duck-dock, predator-monitor, Products, Property Layout
```

### PASS - OS audit: Product section device CRUD panels

Iteration: 1
Kind: source
Required: yes

File: src/components/navigation/ProductSectionPanel.tsx

```text
src/components/navigation/ProductSectionPanel.tsx has deviceTypes, defaultDevices, Add Device, Delete device, doors, water, route
```

### PASS - OS audit: Property editor simulation contract

Iteration: 1
Kind: source
Required: yes

File: src/pages/PropertyLayoutBuilder.tsx

```text
src/pages/PropertyLayoutBuilder.tsx has property, obstacle, hardware, Simulate Route, savePropertyLayout
```

### PASS - OS audit: Shared property layout store

Iteration: 1
Kind: source
Required: yes

File: src/components/property/propertyLayoutStore.ts

```text
src/components/property/propertyLayoutStore.ts has PROPERTY_LAYOUT_STORAGE_KEY, PRODUCT_DIMENSIONS, OBSTACLE_DEFAULT_SHAPES, deviceId, productId
```

### PASS - OS audit: 2D and 3D viewport contract

Iteration: 1
Kind: source
Required: yes

File: src/components/viewport/Viewport3D.tsx

```text
src/components/viewport/Viewport3D.tsx has viewMode, cameraPreset, controlMode, GLTFLoader, registered products, product_family
```

### PASS - OS audit: Camera and ChickenEye views

Iteration: 1
Kind: source
Required: yes

File: src/pages/ChickenTenderDashboard.tsx

```text
src/pages/ChickenTenderDashboard.tsx has cameraViewEnabled, Show Cameras, CameraGrid, Viewport3D
```

### PASS - OS audit: Telemetry and controls

Iteration: 1
Kind: source
Required: yes

File: src/hooks/useTelemetry.ts

```text
src/hooks/useTelemetry.ts has /api/mqtt, telemetry, pollIntervalMs
```

### PASS - OS audit: Hardware controls

Iteration: 1
Kind: source
Required: yes

File: src/hooks/useHardwareControl.ts

```text
src/hooks/useHardwareControl.ts has /api/mqtt, door, feed, water, stop
```

### PASS - OS audit: NVIDIA simulation docs

Iteration: 1
Kind: source
Required: yes

File: docs/nvidia-robotics-simulation.md

```text
docs/nvidia-robotics-simulation.md has Isaac Sim, property_scene_url, nvidia_isaac_robot_asset, tc/{device_id}/cmd, telemetry
```

### PASS - OS audit: FarmBot-inspired homestead OS docs

Iteration: 1
Kind: source
Required: yes

File: docs/farmbot-inspired-homestead-os.md

```text
docs/farmbot-inspired-homestead-os.md has Firmware, TenderCells OS, Web app, API server, Message broker, Developer SDKs, Offline, Simulation
```

### PASS - OS audit: Third-party attribution

Iteration: 1
Kind: source
Required: yes

File: docs/third-party-attribution.md

```text
docs/third-party-attribution.md has FarmBot, Code Reuse Policy, https://farm.bot/, https://github.com/FarmBot, https://licensing.farm.bot/
```

### PASS - OS audit: Mobile packaging docs

Iteration: 1
Kind: source
Required: yes

File: docs/mobile-packaging.md

```text
docs/mobile-packaging.md has iOS, Android, SHA
```

### PASS - OS audit: Production readiness tracker

Iteration: 1
Kind: source
Required: yes

File: docs/production-readiness.md

```text
docs/production-readiness.md has Product registry governance, Property CRUD, NVIDIA robotics simulation, Hardware kit docs
```

### PASS - Express API health on 4000

Iteration: 1
Kind: http
Required: no
URL: http://localhost:4000/health


```text
{"status": "ok", "time": "2026-06-13T20:39:07.558644"}
```

### PASS - OpenClaw gateway health

Iteration: 1
Kind: http
Required: no
URL: http://localhost:8089/health


```text
{"ok":true,"status":"live"}
```

### PASS - Open WebUI health

Iteration: 1
Kind: http
Required: no
URL: http://localhost:18789


```text
<!doctype html>
<html lang="en">
	<head>
		<meta charset="utf-8" />
		<link rel="icon" type="image/png" href="/static/favicon.png" crossorigin="use-credentials" />
		<link
			rel="icon"
			type="image/png"
			href="/static/favicon-96x96.png"
			sizes="96x96"
			crossorigin="use-credentials"
		/>
		<link
			rel="icon"
			type="image/svg+xml"
			href="/static/favicon.svg"
			crossorigin="use-credentials"
		/>
		<link rel="shortcut icon" href="/static/favicon.ico" crossorigin="use-credentials" />
		<link
			rel="apple-touch-icon"
			sizes="180x180"
			href="/static/apple-touch-icon.png"
			crossorigin="use-credentials"
		/>
		<link rel="manifest" href="/manifest.json" crossorigin="use-credentia
```

### PASS - Ollama model registry

Iteration: 1
Kind: http
Required: no
URL: http://localhost:11434/api/tags


```text
{"models":[{"name":"kimi-k2.6:cloud","model":"kimi-k2.6:cloud","remote_model":"kimi-k2.6","remote_host":"https://ollama.com:443","modified_at":"2026-05-03T12:41:02.8839958-07:00","size":384,"digest":"a90cd0d1590c53b9f9f4e0f66218e4c514d190652b8bed2842528e2530e34dc6","details":{"parent_model":"","format":"","family":"kimi-k2","families":["kimi-k2"],"parameter_size":"1T","quantization_level":"int4","context_length":262144,"embedding_length":2048},"capabilities":["completion","tools","thinking","vision"]},{"name":"kimi-k2.5:cloud","model":"kimi-k2.5:cloud","remote_model":"kimi-k2.5","remote_host":"https://ollama.com:443","modified_at":"2026-05-03T12:40:54.750393-07:00","size":340,"digest":"6d1c3
```

### PASS - Demo environment orchestrator

Iteration: 1
Kind: source
Required: yes

File: src/services/demo/demoEnvironment.ts

```text
src/services/demo/demoEnvironment.ts has seedDemoEnvironment, verifyDemoEnvironment, resetDemoEnvironment, DEMO_DEVICES
```

### PASS - Products seed contract

Iteration: 1
Kind: source
Required: yes

File: src/services/productsService.ts

```text
src/services/productsService.ts has seedFirstGarageCoop, seedDemoProducts, FIRST_COOP_DEVICE_ID
```

### PASS - Property layout device placement

Iteration: 1
Kind: source
Required: yes

File: src/components/property/propertyLayoutStore.ts

```text
src/components/property/propertyLayoutStore.ts has deviceId, productId, PROPERTY_LAYOUT_STORAGE_KEY
```

## Local LLM / OpenClaw Notes

OpenClaw gateway is probed as a local autonomous service. Direct Ollama is used for repair notes because it currently exposes a reliable local API for code-review tasks.

Set `LOCAL_LLM_REPAIR=1` or pass `--repair-notes` to ask Ollama for repair order after failures.

## Next Loop

1. Fix the first required failure.
2. Restart or repair any warned local services needed for browser testing.
3. Re-run `npm run autonomous:loop -- --seed-demo --repair-notes`.
4. Add Playwright browser seeding once the route probes are stable.
