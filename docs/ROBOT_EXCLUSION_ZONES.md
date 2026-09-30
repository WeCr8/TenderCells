# Robot exclusion zones

Each robot gets a copy of where it may not go. The robot enforces the zones on board, so they
still hold if the network drops.

| Kind | From the layout | Driving | Laser / aiming dot |
|---|---|---|---|
| `no-go` | **No-Go Zone** items (restricted areas, septic, play areas, neighbours' land) | refused | refused |
| `keep-out` | Obstacle footprints + 1 ft (tree, bush, rock, pond, fence, building) | refused | refused |
| `no-laser` | Every animal house + 6 ft (Chicken Tender, Roaming Roost, Duck Dock, …) | allowed | refused |

## Flow

1. The OS builds the zones from the property layout (`src/lib/yard/exclusionZones.ts`).
2. In **Property Layout**, click **Robot zones**. The dialog shows:
   - every zone;
   - any patrol path that crosses one;
   - the robots with a device ID (Roaming Roost, garden robots, rail modules).

   **Send** asks for confirmation first.
3. The API (`POST /api/mqtt/devices/{id}/zones`) validates the payload. It publishes it **retained, QoS 1** on `tc/{id}/cfg/zones`, so the robot reloads it on every reconnect.
4. The robot parses the zones and acks on `tc/{id}/ack`:
   - The weed / laser robot (`firmware/jetson-nano/zones.py`) skips scan waypoints inside no-go and keep-out zones.
   - It refuses to aim or burn inside any zone, and says why in the ack.
   - A bad payload is refused and the previous zones stay.
   - Zone counts appear in `state/weed.zones`.

## Payload

```json
{"v": 1, "seq": 7, "units": "ft",
 "self": {"itemId": "bed1", "x": 20, "y": 10, "width": 5, "depth": 10},
 "zones": [{"id": "septic", "name": "Septic", "kind": "no-go", "poly": [[10,10],[16,10],[16,16],[10,16]]}],
 "boundary": {"poly": [[0,0],[60,0],[60,40],[0,40]], "marginFt": 2, "source": "layout"},
 "ts": 1790000000000}
```

- Coordinates are property feet, with the origin at the top-left, x to the right and y down.
- `self` is the robot's own footprint. The robot uses it to turn bed millimetres into property feet, with the same mapping as the 3D view.

- `boundary` is the property boundary (see below). The API accepts 3-256 corners and a `marginFt` from 0 to 50.

## Property boundary

Every mobile product (Roaming Roost, weed rover, robot mower, custom robot) stays inside the
property boundary, and keeps `marginFt` away from its edge. Nothing in the OS or on the robot
widens it without the owner.

| Source | What it is |
|---|---|
| `layout` | The default: the property rectangle from **Property Layout**, with a 2 ft margin. |
| `drawn` | Corners the owner typed in the **Property boundary** panel (x, y in feet). |
| `survey` | A robot's measured outline that the owner reviewed and accepted. |

Where it is enforced:

- **OS.** The rover sim and route planner (`roverPlan.ts`) skip points outside it. **Robot zones** flags a patrol path that leaves it, and lists layout items outside it.
- **Robot.** `zones.py` treats a point outside the polygon, or within the margin, as blocked for driving *and* the laser. The message is "outside the property boundary". Rover lanes and path checks use this, so it holds offline.
- **Vendor mowers** (Husqvarna, GARDENA, Mammotion, Home Assistant) keep their own boundary wire or RTK map. Tender Cells cannot move that line, but it holds them with the interlock.

### Measuring it with a robot

The owner's rectangle is often only a rough guess. A mobile robot can measure the real yard:

1. The robot drives the ground **inside today's boundary**. It never leaves it to measure.
2. It records elevation and standing-water depth, and its sensors (lidar, camera, bump) trace the fence line. The fence line may lie past the old boundary.
3. It publishes the result retained on `tc/{id}/state/survey`:
   ```json
   {"deviceId": "rv_001", "at": 1790000000000, "stepFt": 2,
    "edge": [[0.6,0.4],[58.5,0.3],[64,14]],
    "samples": [{"x": 2, "y": 2, "z": 0.01}, {"x": 16, "y": 24, "z": -0.4, "depthFt": 0.4}]}
   ```
4. In **Property Layout → Property boundary**, **Load survey** turns it into a proposal. In the demo, the button is **Run demo survey**. The proposal shows:
   - the measured outline over today's boundary;
   - width, depth, area and perimeter;
   - the elevation range and the steepest slope;
   - low and wet spots;
   - how much ground was covered, and a confidence score;
   - how far the boundary would widen or shrink.
5. The owner accepts or discards it (`src/lib/yard/boundary.ts`):
   - **Shrinking** is always allowed, because it is safer.
   - **Widening** by more than 0.5 ft needs a tick box ("the wider area is mine and safe for robots"). It also needs at least 50% confidence (ground covered, discounted when few edge points were sensed).
   - Ground steeper than **35%**, or with more than **0.25 ft** of standing water, is offered as suggested No-Go Zones.
   - When accepted, the measured elevation grid replaces the terrain heights, and the map grows to fit.
6. Robots get the new boundary only when the owner sends **Robot zones** again. Until then, they keep the old one.

## In the 3D view

No-go zones render as a red translucent curtain with outlined edges. The 2D layout's Roaming layer shows hard no-go zones (red hatch) and stay-out obstacles. The 2D map always draws the property boundary as a dashed gold line, with a faint band for the margin.

## Limits today

- The Roaming Roost ESP32 firmware drives by velocity and has no position estimate yet. It cannot check zones or the boundary on board.
- No robot firmware publishes `state/survey` yet. The demo survey is simulated. The contract and the review flow are ready for the rover once it reports poses and depth.
- The rover weed patrol (`rover_patrol.py`) plans its lanes around no-go / keep-out zones, never reports finds inside them, and refuses the laser in any zone (including the no-laser buffer around animal housing). Other mobile robots: until they do, the OS checks patrol paths against zones before they are sent; when a rover reports a pose, it should subscribe to `cfg/zones` and stop at the boundary, using `zones.py`'s logic.
- The Roaming Roost's own no-laser buffer is placed where it is parked on the map.
