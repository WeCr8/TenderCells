# TenderCells Control Deck — Full Build v0.2

Repository baseline: `WeCr8/TenderCells`  
Pinned commit: `53c934786be821084dec43fb5194f72ae2d7af73`  
Pinned commit date: `2026-10-01T14:42:25Z`

This is an implementation-ready expansion of the v0.1 multipart architecture.
It includes a repository overlay, tests, regression guards, a simulation layer,
and expansion contracts.

## What is included

- normalized universal controller contract
- axis shaping, speed limiting and mixers
- capability/profile gate
- dead-man handling
- touch/pointer math
- FreeTouch dual-thumb React control surface
- Gamepad adapter
- keyboard adapter
- mock and WebSocket transports
- reusable controller session loop
- camera-first Control Deck component shell
- deterministic rover simulator
- backend frame validation
- backend control-session lease manager
- MQTT-compatible motion adapter interface
- WebSocket gateway implementation using `ws`
- unit tests
- regression tests/invariant audit
- standalone TypeScript validation harness
- repo integration patches/instructions
- extension SDK guidance
- drone/MAVLink safety boundary
- implementation checklist

## Installation strategy

The package deliberately uses `repo-overlay/` paths that mirror the TenderCells
repository. New files can be copied directly into the repo. Existing files are not
silently replaced; required edits to `server.ts`, package manifests, routes, and UI
routing are documented in `INTEGRATION/`.

This is safer than shipping whole replacement copies of active TenderCells files.

## Run the package-only validation

From this extracted package:

```bash
cd validation-harness
./run.sh
```

Windows PowerShell:

```powershell
cd validation-harness
./run.ps1
```

The harness uses `tsc` and Node only. It validates the core engine and regression
contracts without requiring React, Vite, Firebase, MQTT, or actual hardware.

## V0.2 boundary

This package is suitable for simulation and integration work. Real moving hardware
must not be enabled until the TenderCells edge gateway and device firmware both
have a verified stale-command watchdog.
