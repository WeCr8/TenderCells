# Tender Cells — Farm 3D Platform Plan
### FarmBot-aligned, expanded for custom robotics + farm-scale operations

> **Vision:** FarmBot gives one raised garden bed a data-driven 2D/3D designer + a
> bot you watch move. Tender Cells does this for a **whole property/farm** — many
> coops, rovers, gantries, arms, cameras, animals, terrain, and utilities — where the
> 3D viewer is both a **design tool** (place/edit) and a **live operations twin**
> (watch real hardware move from device state). Open-source, browser-first, no installs.

---

## 0. Principles we adopt from FarmBot (confirmed from their repo)
FarmBot Web App uses **React-Three-Fiber + drei + GLTF + instancing + progressive
load + FPS probes**, and one core idea:

1. **The map IS the database.** Every plant/tool/point is a record (x, y, type, …).
   The render is a thin view of structured data. Editing the map = editing records.
2. **2D designer is primary, 3D is the showcase** — both read the same records.
3. **Assets are small, open, self-hosted** (SVG sprites + a few low-poly GLTF).
4. **Perf is engineered** — progressive load, instancing, FPS monitoring.

We already follow #1 (`propertyLayoutStore` records → `PropertyLayoutBuilder` editor →
`Viewport3D` render). This plan extends it to farm scale + robotics.

---

## 1. Architecture (target)

```
 propertyLayoutStore (records)            ← single source of truth
   ├─ structures   (coop, barn, run, fence, gate, rail)
   ├─ terrain      (grass, dirt, pasture, pond, path zones)
   ├─ vegetation   (tree, bush, crop-row)
   ├─ utilities    (water trough, feeder, solar, sensor)
   ├─ robotics     (arm, gantry, rover, rail-carriage, camera)
   └─ animals      (per-species, placed or roaming)
        │
        ├──▶ 2D designer (SVG/canvas, PropertyLayoutBuilder)  — place/edit
        ├──▶ 3D viewer (Viewport3D, WebGL)                    — design + live twin
        └──▶ OS control plane (MQTT)  ← live state animates robotics in 3D
```

**Key expansion beyond FarmBot:** a **robotics layer** whose 3D representation is
driven by **live device state** (`tc/{id}/state/arm`, `/state/gantry`, `cmd/drive`,
door, etc.) — the 3D becomes a **digital twin** of real hardware, not just a planner.

---

## 2. Rendering engine decision
- **Keep the current imperative three.js `Viewport3D` for now** (it works, ships,
  renders terrain/sky/devices). No rewrite mid-flight.
- **Adopt FarmBot's techniques inside it:** `InstancedMesh` for repeated objects,
  progressive/lazy asset loading, an FPS guard that drops quality on weak devices,
  LOD for distant objects, WebGL guard + software fallback (already shipped).
- **Optional later migration to React-Three-Fiber + drei** once the catalog/asset
  pipeline is stable — R3F makes instancing, `useGLTF`, `<Environment>`, `<Sky>`,
  and animation declarative. Treat as a Phase 4 refactor, not a blocker.

---

## 3. Asset pipeline — "add-in assets into the WebGL viewer"
A first-class system to bring models into the scene, three sources:

1. **Procedural** (in-bundle, CSP-safe) — grass, sky, fences, simple coops. Default
   + fallback. (Shipped: grass/dirt texture, sky.)
2. **Curated CC0 GLTF pack** — self-hosted under `public/models/` (e.g. Kenney
   "Nature Kit" / "Farm Kit", CC0). Trees, fences, barns, troughs, animals.
   Self-hosted = no CDN/CSP problems; license-clean for open-source.
3. **User uploads** — the existing `/viewer` + `modelUploadService` already accept
   STL/OBJ/GLTF; extend so a user model can be **placed as a catalog item** in the
   property (custom coop/robot the user designed in Fusion/print).

**Loading rules (FarmBot-style):**
- `GLTFLoader` + a shared **cache** (we have `glbCache`); load each model once.
- **Progressive load:** scene renders procedurally first, swaps in GLTF when ready.
- **Instancing:** one geometry + `InstancedMesh` for N trees/posts/animals.
- **LOD:** swap to low-poly/billboard beyond a distance; cap instance counts.
- **Manifest:** `public/models/catalog.json` maps `itemType → { model, scale, yOffset,
  instanced }` so adding an asset = a data edit, not code (FarmBot-style data-driven).

---

## 4. Catalog (records + 3D factories) — the buildout

| Category | Items | 3D approach | Editor |
|----------|-------|-------------|--------|
| Structures | coop variants, barn, run, fence, gate, rail | GLTF/procedural; fence = instanced posts | drag place + size |
| Terrain | grass, dirt, pasture, pond, path | painted zones → textured/extruded regions | region paint tool |
| Vegetation | tree, bush, crop-row | InstancedMesh, billboard LOD | brush/scatter |
| Utilities | water trough, feeder, solar, sensor pod | GLTF/procedural | drag place |
| **Robotics** | **arm, gantry, rover, rail carriage, camera** | rig joints; **animated from live state** | place + bind to deviceId |
| Animals | chicken, duck, goat, rabbit, turkey, pigeon | instanced low-poly; optional roam | count + species |

Each new item = (a) a record type/fields in `propertyLayoutStore`, (b) a palette entry
in `PropertyLayoutBuilder`, (c) a mesh factory in `Viewport3D` (extend
`createYardItems` / `createHardwareMesh`), (d) a `catalog.json` row if it has a GLTF.

---

## 5. Robotics digital-twin layer (our differentiator)
Bind a placed robotics item to a `deviceId`; the 3D rig animates from live OS state:
- **Arm** → `state/arm` joint angles drive the rigged 6DOF model (reuse
  `ArmKinematics3D` math).
- **Gantry** → `state/gantry` X/Y/Z drive the carriage position.
- **Rover (Roaming Roost)** → `cmd/drive` / position updates move + rotate it.
- **Door / feeder / relay** → state toggles animate flaps/indicators.
- **Camera** → show its frustum + a "live" dot; click → the camera feed (webcam /
  flashed MJPEG, already built).
Demo mode uses seeded/simulated state; live mode uses real MQTT. Same scene code.

---

## 6. Editor UX (PropertyLayoutBuilder)
- **Palette** grouped by category (structures/terrain/vegetation/utilities/robotics/
  animals) with icons.
- **Place / move / rotate / size**; snap to grid; multi-select.
- **Terrain paint** for zones (grass/dirt/pond/path).
- **Bind robotics** items to a device (dropdown of claimed devices).
- **Properties panel** per item (size, count, species, deviceId, model variant).
- 2D and 3D stay in sync (same records, live update via `PROPERTY_LAYOUT_EVENT`).

---

## 7. Performance (farm scale)
- `InstancedMesh` for all repeated items (trees, fence posts, animals).
- Progressive/lazy GLTF load; procedural-first render.
- LOD + max draw distance + fog (fog shipped).
- FPS probe → auto-drop shadows/instance counts/pixel ratio on weak devices.
- WebGL guard + software retry + graceful fallback (shipped).
- Reuse one renderer; dispose on unmount (done).

---

## 8. Phased roadmap

**Phase 1 — Environment foundation (in progress)**
- [x] Grass/dirt terrain, sky, fog, auto-rotate, LIVE badge, mobile viewport, WebGL guard
- [ ] Fences/gates (instanced) + trees/bushes (instanced) via editor catalog
- [ ] Pond + path terrain zones

**Phase 2 — Asset pipeline**
- [ ] `public/models/catalog.json` manifest + loader/cache/instancing helpers
- [ ] Self-hosted CC0 GLTF pack (Kenney Nature/Farm) wired to catalog
- [ ] User-uploaded model → placeable catalog item

**Phase 3 — Robotics digital twin**
- [ ] Rig arm/gantry/rover models; animate from live `state/*`
- [ ] Camera frustum + feed link in 3D
- [ ] Demo seeded motion vs live MQTT

**Phase 4 — Scale + polish**
- [ ] LOD, FPS probe auto-quality, progressive load
- [ ] Optional R3F/drei migration
- [ ] Save/load named farm layouts per account (Firestore)

**Phase 5 — Education + showcase**
- [ ] "Design your farm in 3D" lesson (ties to property editor)
- [ ] Comparison vs camera-only coops; 3D as the proof

---

## 9. Open-source / licensing
- Procedural + CC0 assets only (Kenney CC0, or original). No paid/closed packs.
- Self-host all models (`public/models/`) — no third-party CDN (CSP-clean).
- Keep the catalog + lessons open so the community adds items (FarmBot ethos).

---

## 10. First implementation step (recommended)
Phase 1 next item: **fences/gates + trees as instanced editor catalog items** — proves
the record→palette→instanced-mesh pattern that every later item reuses, and gives the
biggest "this is a real farm" jump. Then ponds/paths, then the asset manifest (Phase 2),
then the robotics twin (Phase 3).

*Source of truth for scope; update each phase as items land.*
