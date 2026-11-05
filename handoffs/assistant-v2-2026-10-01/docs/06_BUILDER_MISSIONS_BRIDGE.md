# Builder + Missions bridge

Do not create a second content store. Adapt the existing `src/features/builder/data/` mission manifest, mission JSON, project JSON, parts catalog, stable asset IDs and validated images.

`get_builder_step` should return item/step id, progress, action, selected instruction layer, details, look-for, watch-out, parts, image URI, safety gates, demo binding and previous/next ids.

Never synthesize a missing pinout. Preserve draft/reference-check-required state.

Mission bridges: Beat the Heat → temperature sensor; Sensor Detective → sensor telemetry; Build a Coop Brain → Starter Node; Protect the Chickens → WatchTower/door safety; Robot Traffic Jam → Property Twin coordination.
