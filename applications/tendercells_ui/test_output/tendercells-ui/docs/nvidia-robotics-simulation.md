# NVIDIA Robotics Simulation

TenderCells should support NVIDIA simulation as an optional robotics development path for users who want richer physics, camera, synthetic data, and property/device simulations.

This is not required for normal app use. Browser Three.js remains the default local visualization path.

## Supported Intent

- Simulate custom devices on a user's own property scene.
- Validate motor and axis movement before hardware tests.
- Check keep-in and keep-out envelopes for rails, doors, arms, and mobile products.
- Generate synthetic camera scenarios for WatchTower AI and camera kits.
- Run hardware-in-loop tests where physical controllers report state while a simulated scene predicts movement.
- Improve terrain detail later using device telemetry, depth cameras, LiDAR, photogrammetry, or repeated Roaming Roost route observations.

## Registry Metadata

Product registration can now store simulation metadata:

| Field | Purpose |
| --- | --- |
| `simulation_backend` | `browser_threejs`, `nvidia_isaac`, `ros_gazebo`, `hardware_in_loop`, or `none` |
| `simulation_profile` | Named test profile such as `axis-jog-homing-limits` |
| `robotics_middleware` | `mqtt_bridge`, `ros2`, or `none` |
| `nvidia_isaac_enabled` | Whether this product should use NVIDIA/Isaac workflows |
| `nvidia_isaac_scene` | Optional scene path, commonly a USD file |
| `nvidia_isaac_robot_asset` | Optional robot/device asset path |
| `property_scene_url` | User property scene asset, layout, or generated world |
| `terrain_source` | Manual layout, device telemetry, depth camera, LiDAR, or photogrammetry |
| `terrain_capture_device_id` | Device expected to collect terrain detail |
| `custom_device_asset_url` | Asset for custom DIY devices or printed modules |
| `telemetry_learning_enabled` | Whether device data can later refine property/terrain maps |

## Recommended Profiles

| Profile | Product Types |
| --- | --- |
| `garage-axis-and-door-bringup` | First Chicken TenderCell, door systems, motor/axis kits |
| `axis-jog-homing-limits` | Rail system, motor/axis kit, controller board |
| `mobile-navigation-and-obstacle-avoidance` | Roaming Roost and other mobile products |
| `synthetic-camera-detection` | WatchTower AI and camera kits |
| `property-terrain-learning` | Custom devices that collect route, slope, obstacle, or depth data |

## Safety Boundary

Simulation can improve code quality and reduce hardware risk, but it must not replace physical safety checks.

- Limit switches must still be tested before motorized travel.
- E-stop paths must be tested on real hardware.
- Collision-free simulation does not prove animal-safe operation.
- Simulated terrain must be treated as advisory until verified in the yard.

## Future Work

- Add import/export for USD scene metadata.
- Add a ROS 2 bridge contract for axes, doors, route goals, camera events, and telemetry.
- Add terrain learning jobs that turn device telemetry into property-map updates.
- Add synthetic camera datasets for predator and animal detection model testing.
- Add CI smoke tests for simulation metadata serialization.

## Custom Build Implementation Guide

This section is for open-source users building their own home farming or animal tending products and using TenderCells as the software/control layer.

The recommended flow is:

1. Register the product or module in TenderCells.
2. Attach CAD, USD, or GLB asset references.
3. Build or import a property scene.
4. Select a simulation backend and profile.
5. Connect simulated telemetry to TenderCells.
6. Compare simulation telemetry with physical device telemetry when hardware is available.

### 1. Register The Custom Product

In the app:

1. Open `/products`.
2. Select **Register Product**.
3. Choose **Custom Build**, **3D Printed Part**, **Motor / Axis Kit**, **Controller Board**, or another matching module card.
4. Set:
   - Product name
   - Device ID
   - MQTT base topic
   - Firmware target
   - Product family
   - Build source
   - Simulation backend
5. If using NVIDIA, choose **NVIDIA Isaac / Omniverse** as `simulation_backend`.

Recommended metadata:

```json
{
  "product_family": "community-custom",
  "build_source": "open-source-diy",
  "simulation_backend": "nvidia_isaac",
  "simulation_profile": "property-terrain-learning",
  "robotics_middleware": "mqtt_bridge",
  "property_simulation_enabled": true,
  "terrain_source": "manual_layout",
  "telemetry_learning_enabled": true
}
```

### 2. Prepare Product Assets

Users can begin with simple geometry and improve later.

Accepted asset paths should eventually support:

- `.usd` / `.usda` / `.usdc` for Isaac Sim scenes and robot assets.
- `.glb` / `.gltf` for browser previews.
- `.step` / `.stl` / `.3mf` for printable parts and CAD source.

Recommended folder layout:

```text
assets/
  products/
    my-custom-waterer/
      model.glb
      isaac/
        waterer.usd
      prints/
        valve-bracket-r1.stl
      docs/
        wiring.md
        bom.md
```

Register these fields:

- `custom_device_asset_url`: product or robot asset.
- `nvidia_isaac_robot_asset`: Isaac-ready product asset.
- `asset_license`: license for the asset.
- `cad_revision`: CAD revision.
- `print_revision`: printed part revision.
- `firmware_contract_version`: command/telemetry API version.

### 3. Build A Property Scene

Start with the TenderCells property layout editor. Later, export or recreate the layout in Isaac Sim.

Minimum property scene data:

- Yard width/depth.
- Product positions.
- Obstacles such as trees, fences, sheds, ponds, gates, and no-go zones.
- Terrain approximation.
- Docking and charging zones for mobile products.

Register:

```json
{
  "property_scene_url": "scenes/my-yard.usd",
  "terrain_source": "manual_layout",
  "terrain_detail_status": "manual"
}
```

Future terrain sources:

- `device_telemetry`: position, wheel slip, route attempts, stuck events.
- `depth_camera`: camera depth or stereo captures.
- `lidar`: point clouds.
- `photogrammetry`: phone/video reconstruction.

### 4. Define The Simulation Contract

Every custom build needs a simple command and telemetry contract.

Suggested MQTT topic shape:

```text
tc/{device_id}/cmd/axis
tc/{device_id}/cmd/door
tc/{device_id}/cmd/route
tc/{device_id}/cmd/estop
tc/{device_id}/telemetry/state
tc/{device_id}/telemetry/pose
tc/{device_id}/telemetry/motor
tc/{device_id}/telemetry/sensors
tc/{device_id}/events/safety
tc/{device_id}/events/sim
```

Suggested axis command:

```json
{
  "axis": "x",
  "command": "jog",
  "direction": 1,
  "speed_mm_s": 20,
  "duration_ms": 250
}
```

Suggested pose telemetry:

```json
{
  "device_id": "my-axis-kit-01",
  "source": "nvidia_isaac",
  "timestamp": "2026-06-12T08:00:00.000Z",
  "pose": {
    "x_m": 1.2,
    "y_m": 0.4,
    "z_m": 0.0,
    "yaw_deg": 90
  },
  "safety": {
    "estop": false,
    "limit_triggered": false,
    "collision_predicted": false
  }
}
```

### 5. Connect Isaac Sim To TenderCells

Near-term bridge options:

- MQTT bridge: easiest for DIY users and existing TenderCells topics.
- ROS 2 bridge: best for robotics workflows, navigation, transforms, and richer simulation.
- File import/export: lowest friction for property scenes and product assets.

Recommended starting point:

1. Run TenderCells UI on `http://localhost:5173`.
2. Run the API/MQTT bridge locally.
3. Start Isaac Sim with the user's property scene.
4. Publish simulated state to the same device topics a real controller would use.
5. Keep `source` in telemetry as `nvidia_isaac` so simulated and real data can be separated.

### 6. Hardware-In-Loop Path

When the user has real electronics connected:

1. Keep physical E-stop available.
2. Start with motor power disabled or current-limited.
3. Send low-speed simulated commands first.
4. Compare simulated pose/axis state against physical controller telemetry.
5. Only enable physical motion after limits and E-stop are verified.

Use these metadata states:

```json
{
  "simulation_backend": "hardware_in_loop",
  "safety_validation_status": "bench_tested",
  "telemetry_consent": "local_only"
}
```

### 7. Terrain Learning From Devices

TenderCells should eventually improve property simulations from device data, but this must remain consent-based.

Useful signals:

- Route success/failure.
- Wheel slip.
- Current draw spikes.
- Stuck events.
- IMU tilt.
- Repeated obstacle detections.
- Depth camera snapshots.
- Manual user corrections in the property layout editor.

Suggested telemetry event:

```json
{
  "device_id": "rr-yard-01",
  "event": "terrain_observation",
  "source": "device_telemetry",
  "position": { "x_m": 4.2, "y_m": 8.6 },
  "observation": {
    "slope_deg": 6,
    "wheel_slip": 0.18,
    "surface": "grass",
    "confidence": 0.62
  }
}
```

The app should treat generated terrain as a suggested layer until the user confirms it.

### 8. Open-Source Contributor Expectations

Community device definitions should include:

- Product name and purpose.
- Required electronics.
- Firmware target.
- MQTT or ROS 2 command contract.
- Simulation asset license.
- CAD/print revision.
- Safety limitations.
- Whether it has been simulated, bench tested, or field tested.

Do not mark a design kit-ready or commercial-ready just because it loads in simulation.
