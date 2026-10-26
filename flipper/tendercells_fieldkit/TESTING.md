# Tender Cells Field Kit validation

Validated on 2026-10-25 against a Flipper Zero running Momentum `mntm-012`
(target 7, API 87.1).

## Build

- The original v1.0 source failed against API 87.1 because its view-navigation
  callbacks returned `bool` instead of the required `uint32_t` view ID.
- The repaired v1.1 source builds cleanly with the pinned Momentum SDK and
  `ufbt`.
- Release artifact: `tendercells_fieldkit.release.fap`
- Size: `8,888` bytes
- SHA-256: `44D4397B075C3BDF48BB12D2FCC3D1C8C0132AD808BF38C313DCA56B225DAF84`
- MD5: `72E68A0AB68A9BCC4A52372CF45A2C26`

The generated artifact is intentionally not committed. Rebuild it from this
source with the pinned SDK before distribution.

## On-device acceptance

The exact artifact above was copied to
`/ext/apps/Tools/tendercells_fieldkit.fap`. Its remote size and MD5 matched the
local release before interaction tests.

| Test | Result |
|---|---|
| Idle Back exits, cycle 1 | PASS |
| Idle Back exits, cycle 2 | PASS |
| UART + Health opens / returns / exits | PASS |
| Board Diagnostics opens / returns / exits | PASS |
| Frequency Board opens / returns / exits | PASS |
| WiFi Board opens / returns / exits | PASS |
| Offline Node opens / returns / exits | PASS |
| GPIO / Reed Test opens / returns / exits | PASS |
| About opens / returns / exits | PASS |

An earlier build reset on the first detail view because app code overwrote the
private `View` contexts owned by `Submenu` and `TextBox`. The repaired build
keeps those module contexts intact and handles Back through the dispatcher.

## Evidence limits

- Direct UART acquisition is compile-time disabled pending an exact wired
  Momentum/XIAO test. Use the installed UART Terminal at 115200 or XIAO native
  USB console today.
- No SX127x/SX126x frequency board or ESP32 WiFi adapter was connected, so only
  their fail-closed preview screens—not their electrical or data paths—passed.
- No RF or WiFi transmission, replay, capture, deauthentication, credential
  collection, GPIO output, or safety-control action was performed or claimed.
