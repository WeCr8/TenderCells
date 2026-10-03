# Install Into TenderCells

Baseline reviewed: `53c934786be821084dec43fb5194f72ae2d7af73`.

## 1. Copy overlay

Copy `repo-overlay/*` into the root of a working TenderCells branch.

No existing files in this package have the same path as active repo files except new
test/code paths, so the initial copy is additive.

## 2. Add backend dependency

In:
`applications/tendercells_ui/test_output/express-api/package.json`

Add:

```json
"ws": "^8.18.0"
```

Dev dependency:

```json
"@types/ws": "^8.5.13"
```

Then install normally in that workspace.

## 3. Change API server from anonymous `app.listen` to explicit HTTP server

The WebSocket gateway needs access to the HTTP server's `upgrade` event.

See `SERVER_PATCH.md`.

## 4. Attach control gateway

Wire `MQTTController.host().publish` into `createMotionPublisher(...)`, then attach
the gateway to the HTTP server.

The gateway publishes continuous motion to:

`tc/{deviceId}/cmd/drive/analog`

Do not overload the existing discrete `/cmd/drive` schema until firmware migration
is complete.

## 5. Add firmware/simulator consumer

A moving device must:

- subscribe to `tc/{deviceId}/cmd/drive/analog`
- reject malformed/out-of-range values
- track the last accepted command timestamp
- stop motors after <=500 ms without a valid frame
- stop immediately when `deadman=false`
- continue to honor existing retained E-STOP

Do not test first with wheels on the ground.

## 6. Integrate the UI

Mount `ControlDeck` first in demo/simulation UI.
Pass the existing `CameraFeedViewer` as `cameraSlot`.

Only turn `simulation={false}` after the server and firmware watchdog tests pass.

## 7. Migrate physical gamepads

Keep the current `useGamepad` hook initially.
Replace robot-specific mapping in consumers with `gamepadToRawInput(...)` feeding
the common ControlSession.

## 8. Run all tests

Run the package harness first, then repo tests in `regression/REPO_REGRESSION_CHECKLIST.md`.
