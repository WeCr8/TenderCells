<!-- Generated from docs/ROBOT_EXCLUSION_ZONES.md by website/scripts/sync-docs.mjs - edit the source, then run npm run sync:docs. -->

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
 "ts": 1790000000000}
```

- Coordinates are property feet, with the origin at the top-left, x to the right and y down.
- `self` is the robot's own footprint. The robot uses it to turn bed millimetres into property feet, with the same mapping as the 3D view.

## In the 3D view

No-go zones render as a red translucent curtain with outlined edges. The 2D layout's Roaming layer shows hard no-go zones (red hatch) and stay-out obstacles.

## Limits today

- The Roaming Roost ESP32 firmware drives by velocity and has no position estimate yet. It cannot check zones on board.
- The rover weed patrol (`rover_patrol.py`) plans its lanes around no-go / keep-out zones, never reports finds inside them, and refuses the laser in any zone (including the no-laser buffer around animal housing). Other mobile robots: until they do, the OS checks patrol paths against zones before they are sent; when a rover reports a pose, it should subscribe to `cfg/zones` and stop at the boundary, using `zones.py`'s logic.
- The Roaming Roost's own no-laser buffer is placed where it is parked on the map.
