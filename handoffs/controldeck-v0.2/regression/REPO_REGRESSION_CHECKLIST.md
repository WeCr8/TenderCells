# Repository Regression Checklist

After overlay integration, run these existing TenderCells gates in addition to new tests:

## UI
```bash
cd applications/tendercells_ui/test_output/tendercells-ui
npm test -- --run
npm run build
npm run mobile:audit
npm run ui:smoke:desktop
```

## API
```bash
cd applications/tendercells_ui/test_output/express-api
npm test
npm run build
npm run smoke
```

## Manual invariants

- Existing `/api/mqtt/devices/:id/door` behavior unchanged.
- Existing `/feed`, `/clean`, `/light`, `/camera/config` behavior unchanged.
- Existing E-STOP endpoint remains dedicated.
- Existing E-STOP clear confirmation remains in UI.
- Existing gamepad RobotControlPanel works until migrated.
- CameraFeedViewer local MJPEG remains usable.
- Camera relay remains independent from motion gateway.
- Demo mode cannot reach physical hardware.
- Continuous motion never traverses Firebase.
- LoRa mesh remains low-rate and never carries video.
- A closed control WebSocket neutralizes the robot.
- A stale control stream neutralizes the robot.
- A duplicate or old sequence cannot restart motion.
