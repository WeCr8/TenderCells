# Tender Cells Smart Feeder — App/Digital-Twin Integration

This directory adds a functional digital-twin layer to the physical feeder build.

## What is included

- `Assets/TenderCells_Smart_Feeder_Interactive_v4.glb` — assembled GLB generated from the actual printable feeder meshes, plus lightweight electronics/feed-state visualization geometry.
- `Assets/feeder-model-manifest.json` — semantic node names and motion/state contract.
- `Web/FeederFunctionalViewer.tsx` — direct Three.js viewer for the current TenderCells React/Vite application.
- `Web/FeederViewerPanel.tsx` — MUI demo panel.
- `Web/FeederModelUploadCard.tsx` — example using TenderCells' existing Firebase `modelUploadService`.
- `ReactNative/TenderCellsFeederViewerNative.tsx` — React Native WebView wrapper for the same hosted viewer.
- telemetry schema, examples, integration patch notes, and tests.

## Important architecture choice

TenderCells already uses Three.js + GLTFLoader and already has Firebase GLB upload support. Do not create a second asset-storage system. Upload the supplied `.glb` through the existing model upload flow, then pass the returned Firebase URL to `FeederFunctionalViewer`.

## Functional behavior

The viewer maps live or simulated state onto named GLB nodes:

- `Rotor` — indexes by 60° for each of six pockets.
- `FeedFill` — changes visible height from `feedPercent`.
- `LoadCellPlatform` — shows a small visual deflection proportional to weight.
- `StatusLED` — green online, yellow offline, red jammed.

A changed `dispenseCount` causes a visible one-pocket rotor animation.

## Hardware safety boundary

The UI is visualization-first. Real actuator motion must remain in the local feeder controller / local MQTT safety path. Do not turn a Firebase/cloud button into direct motor control. Keep E-STOP, watchdog, homing, jam detection and manual override local.
