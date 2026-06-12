# Product Registry Considerations

The registry is becoming the source of truth for full products, add-on modules, 3D printed parts, custom devices, simulation assets, and garage hardware tests. These considerations should guide new code before the registry grows into production data.

## Data Ownership And Consent

- Default device telemetry to local-only until the user opts in.
- Separate support sharing from anonymized community learning.
- Store retention intent per product with `telemetry_retention_days`.
- Make terrain learning opt-in, especially when property maps, camera feeds, or location traces are involved.
- Avoid uploading raw property imagery, depth captures, or telemetry without a clear consent state.

## Safety State

Every hardware or automation product needs a visible safety status:

- `not_started`: registered but not tested.
- `simulated`: checked only in software.
- `bench_tested`: tested on a workbench or garage setup.
- `field_tested`: validated in the real install location.
- `blocked`: unsafe, incomplete, or waiting on a known fix.

Simulation improves code quality, but it does not replace E-stop, limit switch, power, animal-proximity, and enclosure tests.

## Parent And Module Links

Door systems, waterers, feeders, sensor pods, camera kits, controller boards, motor/axis kits, and 3D printed parts should be able to register as standalone products and later attach to a parent product.

Use:

- `parent_product_id`
- `compatible_product_families`
- `mounting_location`
- `printable_part_id`
- `print_material`
- `print_revision`

## Versioning

Keep these revisions separate because they change independently:

- `hardware_revision`
- `cad_revision`
- `firmware_version`
- `firmware_contract_version`
- `pinout_revision`
- `print_revision`
- `asset_license`
- `asset_source`

This matters for open-source builders because their printed bracket, firmware, board, and app version may not match a prebuilt kit.

## NVIDIA And Custom Property Simulation

NVIDIA Isaac/Omniverse should remain optional but first-class for robotics development.

Recommended registry fields:

- `simulation_backend`
- `simulation_profile`
- `nvidia_isaac_scene`
- `nvidia_isaac_robot_asset`
- `property_scene_url`
- `custom_device_asset_url`
- `terrain_source`
- `terrain_capture_device_id`
- `telemetry_learning_enabled`

This lets a user register a custom device, point it at their own property scene, and later improve the terrain from device telemetry, depth camera, LiDAR, photogrammetry, or repeated route observations.

## Release Readiness Flags

Treat open-source, kit, and commercial readiness as separate states:

- `open_source_release_ready`
- `kit_release_ready`
- `commercial_sale_ready`

A design can be useful for community testing before it is safe or polished enough for a kit or prebuilt unit.

## Near-Term Code Needs

- Extract product cards and family options into a shared product catalog module so registration, registry edit forms, side menu, docs, and routes do not drift.
- Add validation for product metadata before saving.
- Add import/export for registry entries so community builders can share device definitions.
- Add parent-child linking UI for modules and printed parts.
- Add tests that serialize and restore NVIDIA/property simulation metadata.
- Add telemetry consent UI before any upload or cloud sync.
