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
