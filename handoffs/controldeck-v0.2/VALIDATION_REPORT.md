# Validation Report — v0.2

Baseline: `WeCr8/TenderCells@53c934786be821084dec43fb5194f72ae2d7af73`

## Package-only validation performed

Command:

```bash
cd validation-harness
./run.sh
```

Result:

```text
PASS 19 Control Deck core/regression assertions
PASS Control Deck package regression invariants
```

Validated behaviors include:

- axis clamp and dead zone
- speed limiting
- differential and mecanum mixer normalization
- monotonic control-frame sequencing
- neutral/dead-man frame behavior
- device/profile capability allow-list
- FreeTouch pointer math
- simulator movement
- backend frame validation
- rejection of invalid axis ranges
- one active controller lease per device
- duplicate/out-of-order frame rejection
- stale session expiry
- neutralization callback on expiry
- no Firebase dependency in continuous-control gateway
- analog motion topic invariant
- dedicated E-STOP UI callback invariant
- pointer-cancel and lost-capture handling
- LoRa/video separation invariant

## Included but not executed here

The repo overlay also contains:

- TenderCells Vitest tests under `src/__tests__/control/`
- TenderCells API Node tests under `backend/src/control/*.test.ts`
- full existing-repository regression checklist

Those tests require the TenderCells workspace dependencies and should be run after
copying the overlay into a working branch.

## Hardware boundary

No real motor/vehicle hardware was actuated during package validation.
A physical deployment remains blocked on a verified device-side stale-command
watchdog and bench testing.
