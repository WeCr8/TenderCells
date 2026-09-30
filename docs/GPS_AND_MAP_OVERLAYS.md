# GPS and real map overlays (roadmap)

**Status: planned.** Today the Property Twin is drawn in property feet, with its origin at the top-left corner. It is not placed on the Earth yet. This page is the plan for:

- linking robots' real-time GPS positions;
- drawing real imagery and terrain (Google or other providers) under the layout.

The groundwork is `src/lib/yard/geo.ts` (tested in `src/__tests__/yard/geo.test.ts`):

| Function | What it does |
|---|---|
| `GeoAnchor` | The latitude / longitude of the property's top-left corner, plus the compass bearing of its +x edge. This is all it takes to put a layout on the Earth. |
| `toProperty(anchor, lat, lon)` | Turns a GPS fix into property feet. |
| `toLatLon(anchor, x, y)` | Turns property feet into latitude / longitude, for pins and map tiles. |
| `tileFor(lat, lon, zoom)` | Finds the Web-Mercator tile that imagery providers serve. |
| `fixGoodEnough(accuracyFt, marginFt)` | Allows a GPS fix for driving only when it is precise to half the boundary margin. |

Over a yard, a local flat-earth projection is accurate to well under an inch. Nothing is wired to a map provider yet.

## Phases

1. **Place the property** (OS only).
   - The owner drops two corner pins on a map, or stands at two corners with a phone. That gives the `GeoAnchor`.
   - The anchor is stored with the layout, on the owner's device only.
2. **Imagery under the 2D map and the 3D ground.**
   - Draw satellite tiles for the property's extent, fitted with `toLatLon`, under the grid.
   - A slider sets the opacity, so the drawn layout can be lined up with the real yard.
3. **Real terrain.**
   - Sample elevation over the property onto an `ElevationGrid`, with `source: 'survey'`. This is the same grid the robot survey fills (see [Robot exclusion zones → Property boundary](ROBOT_EXCLUSION_ZONES.md#property-boundary)).
   - Offer the property line from public parcel data as a proposed boundary. As with a robot survey, the owner accepts or discards it.
4. **Live robot GPS.**
   - Robots publish `tc/{id}/state/gps` as `{lat, lon, accuracyFt, fix: 'rtk-fixed' | 'rtk-float' | '3d' | 'none', ts}`.
   - The OS shows them on the map with `toProperty`.
   - The retained `cfg/zones` payload gains the `geo` anchor. The robot then checks the boundary and zones against its own fix, on board, so this still holds offline.
   - A robot stops if its fix is worse than half the margin (`fixGoodEnough`).

## Providers (choose per deployment)

| Provider | Gives | Notes |
|---|---|---|
| Google Maps Platform: Map Tiles API (2D satellite, Photorealistic 3D Tiles), Elevation API | Imagery, 3D mesh, elevation | Needs an API key with billing. The terms limit caching and require attribution. 3D Tiles load in three.js via `3d-tiles-renderer`. |
| Mapbox (Satellite, Terrain-RGB) | Imagery, elevation | API key. The free tier suits one yard. |
| Esri World Imagery (ArcGIS) | Imagery | ArcGIS account / key for most uses. |
| USGS 3DEP and NAIP (US only) | 1 m lidar elevation in many areas, and aerial photos | Public domain, no key. A good free default for US yards. |
| OpenStreetMap | Streets and outlines, not photos | Tile usage policy: no heavy use. Use a hosted provider for production. |

Keys live in the hub's environment and never in the browser bundle. The one exception is a key restricted to the site's referrer, when a provider requires the browser to fetch tiles directly.

## GPS on the robots

| Receiver | Accuracy | Enough to keep a 2 ft margin? |
|---|---|---|
| Phone / basic GNSS | ~10–15 ft | No. Use it only to place the property. |
| RTK GNSS (e.g. u-blox ZED-F9P + an NTRIP or own base station) | ~1 in | Yes |

Vendor RTK mowers (Mammotion, Husqvarna EPOS and others) keep their own maps. Tender Cells would only show their position, not steer them.

## Privacy

A home's exact location is sensitive.

- The anchor and GPS tracks stay on the owner's device and hub by default.
- Nothing is sent to Tender Cells' cloud unless the owner opts in.
- Map requests go to the chosen provider only for the property's own tiles.
