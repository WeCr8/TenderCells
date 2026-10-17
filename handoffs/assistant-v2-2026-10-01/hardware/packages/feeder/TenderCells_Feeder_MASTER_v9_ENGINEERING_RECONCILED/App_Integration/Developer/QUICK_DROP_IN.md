# Feeder Digital Twin — Quick Drop-In

## Existing TenderCells React/Vite UI
The current TenderCells UI already uses Three.js/GLTFLoader and Firebase model upload. Copy the `Web/` components, upload `Assets/TenderCells_Smart_Feeder_Interactive_v4.glb`, and feed the viewer telemetry matching `Schemas/feeder-telemetry.schema.json`. Preserve the named GLB nodes in `Assets/feeder-model-manifest.json`.

## React Native
Use `ReactNative/TenderCellsFeederViewerNative.tsx` with `react-native-webview`. Telemetry is bridged to the same web Three.js renderer, keeping one digital-twin behavior across web, Android and iOS.

## Safety boundary
UI/cloud commands are requests only. Local firmware must own homing, limits, jam handling, timeouts/watchdog and physical stop behavior.
