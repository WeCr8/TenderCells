# Property map layers — terrain, elevation, predators

Users start in the **2D Property Layout** and the 3D view follows. Each layer can be drawn by
hand today and filled in by a robot later.

## Terrain zones

In **Property Layout → Terrain**, press **+ Zone** and pick a surface for a rectangle of the yard:

- lawn, pasture, dry dirt, snow
- garden soil, mulch, gravel, sand, paved, woods floor, wet/boggy

A zone can also be raised or lowered, e.g. +1 ft for a raised-bed area.

In 3D, each zone is draped over the ground with its own texture, and grass tufts are left off
non-grass surfaces. The base **Terrain** menu in the 3D toolbar still sets the ground for the
parts no zone covers.

## Elevation

**+ Mound / dip** adds a height (positive or negative, in feet) that falls off smoothly to
zero at its radius. The 3D ground, the items, the flags and the roaming birds all sit on the
resulting surface.

## Robot mapping (planned)

The data model is ready for measured terrain (`components/property/terrain.ts`):

- `elevationGrid`: a regular grid of heights with `source: 'robot'` and a `deviceId`. For
  example, Roaming Roost logging its tilt and wheel odometry, or a gantry probing a bed.
  Where the grid has data it overrides the hand-placed points.
- `terrainZones[].polygon` with `source: 'robot'`: measured outlines. These show read-only in
  the editor.

Coordinates are property feet from the top-left corner, the same as items.

## WatchTower predator layer

- **Coverage:** each WatchTower draws three 120° camera sectors (40 ft default range, or the item's mapped radius) in 2D (the **Predators** toggle)
  and in 3D. Camera 1 faces map north unless the tower is flashed with `-DTOWER_HEADING_DEG`.
- **Detections:**
  - The tower's `tc/{id}/alert` now carries `camera` and `bearingDeg`, and optionally
    `distanceFt` and `label`.
  - express-api turns each alert into a located map event.
  - The map places a marker along that bearing, with a dashed sight line from the tower.
  - When there is no distance estimate, the marker is placed at 60% of the tower's range.
- **Seen it** in the "Needs attention" list clears the flag.
- **Testing:** `node tools/simulate-device.mjs --id wt_001 --kind watchtower` publishes located
  test detections. The public demo generates them in the browser.

## Watershed & drainage (`/watershed`)

Pick **Light rain** (1/4 in in 1 h), **Heavy rain** (1 in in 1 h) or **Flood storm**
(4 in over 2 h). The page shows three layers:

- **Standing water**: puddle depth, area and gallons.
- **Flow paths**: where runoff concentrates.
- **Erosion risk**: moderate or high.

Results are shown on a 2D map and in 3D.

### How it works

`components/property/watershed.ts` does four things:

1. Runs a priority-flood over the terrain height model.
2. Fills each low spot with the runoff from its own catchment. Runoff depends on the rain
   rate minus the soak-in rate of the surface (lawn, mulch, gravel, paved or roof).
3. Traces D8 flow accumulation.
4. Scores erosion as erodibility × √flow × slope.

The property edges, ponds, drains and rain gardens are outlets. The rates are planning-grade
defaults for comparing options on one yard. This is not an engineered drainage design.

### More accurate terrain → better answers

When a robot has measured the yard (`elevationGrid`, `source: 'robot'`), the model uses that
grid instead of the hand-drawn heights. Hand-drawn terrain misses the small dips that decide
where puddles form. **Run robot scan (demo)** shows the difference using a simulated Roaming
Roost scan.

### Try fixes

| Fix | What it does in the model |
|---|---|
| **Drain / dry well** | An outlet at a point. |
| **Rain garden** | A shallow planted basin that soaks water in and is an outlet. |
| **Grassed swale** | A channel falling 1% from start to end that cuts through rims as needed. The planner shows the deepest cut, capped at 3 ft. |
| **Berm** | A raised strip that redirects surface water. |
| **Fill / regrade** | Raises a low spot. |

Fixes are saved as a plan on the property (`drainagePlan`). **Plan vs now** compares puddle
area, stored water and erosion. It warns when a plan trades puddles for erosion, i.e. when more
ground moves into a moderate or high erosion class.

## Device camera views (inside / outside)

- **Mounts:** every product has default camera mounts (`src/lib/yard/cameraMounts.ts`):
  - Chicken Tender: roost + nest boxes (inside), run (outside).
  - Duck Dock: shelter + pond.
  - Roaming Roost: dome + front/rear.
  - Garden robots: tool camera + bed overview.
  - Bunny Burrow, Goat Guardian, Turkey Tower, Pigeon Palace: one inside and one outside.

  A custom build sets `PropertyItem.cameras` to its own mounts. Each mount has a position, height, yaw/pitch, field of view and an inside/outside flag.
- **Demo:** the 3D view's **Cameras** menu picks up to three views and renders them as picture-in-picture insets.
- **Live:** a camera node publishes its MJPEG `streamUrl` on `tc/{deviceId}_{mountId}/sensors`, or on `streamDeviceId` when that is set.
- **Isaac Sim:** the USD export turns each mount into a `Camera` prim (see [ISAAC_SIM.md](ISAAC_SIM.md)).

## Robot exclusion zones

No-Go Zones, obstacle footprints and a no-laser buffer around animal housing are sent to robots over MQTT and enforced on the robot. They are drawn in 3D as red curtains. See [ROBOT_EXCLUSION_ZONES.md](ROBOT_EXCLUSION_ZONES.md).

## WatchTower camera views

- **Demo:** the 3D view renders what each of the tower's three 120° cameras sees, as
  picture-in-picture insets. Pick them in the **Cameras** menu; they are shown by
  default in Predator Monitor.
- **Live:** each camera node (`firmware/camera-node`) publishes its MJPEG `streamUrl`.
  The Predator Monitor page shows `{tower}_cam1..3` together with the recent located
  detections.
