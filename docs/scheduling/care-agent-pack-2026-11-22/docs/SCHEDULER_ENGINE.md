# Scheduler extension — algorithm and interoperability

## Preserve existing pipeline
- UI CRUD: `.../tendercells-ui/src/services/schedulesService.ts` → `schedules/{deviceId}/items/{id}` or demo localStorage.
- Hub `.../express-api/backend/src/schedule.runner.ts`: 30s tick, MQTT, control gates, and shared queue.
- Hub pure functions: `.../express-api/backend/src/schedules.ts`.
- Cloud pure functions: `functions/src/scheduleExec.ts`; cloud runner `functions/src/scheduleRunner.ts` scans five-minute window.
- Keep current cron records valid and untouched; `triggerV2` is optional and versioned. No direct actuation from Drive/Calendar/forecast provider.

## Proposed triggerV2 (logical, NOT drop-in code)
```
{
  "version": 2,
  "mode": "solar|fixed|site_shade|sensor|combined",
  "solar": { "event": "sunrise|sunset|civil_dusk", "offsetMinutes": -10 },
  "siteShade": { "role": "monitoring_cue", "minSamples": 7 },
  "sensor": { "metric": "water_level_percent", "op": "lt", "value": 20, "freshWithinSec": 120 },
  "result": { "kind": "human_reminder|device_action", "capability": "door.open" },
  "executionPolicy": { "requiresOwnerApproval": true, "offline": "skip_and_alert" }
}
```
`site_shade` supports only notification/observation at launch; not an automatic door-close trigger. `combined` may request an action only after independent local interlocks and ownership approve it.

## Solar times
Calculate sunrise/sunset/civil dusk by property coordinates and IANA timezone with a separately tested, deterministic implementation. UTC calculations + `Intl` zone conversion must handle DST and midnight. Persist UTC epoch for events plus `localDate`, `timeZone`, `calculationVersion`, `coordinateAccuracy` and `calculatedAt`. Approximate solar calculations are not local tree/hill obstruction measurements. No calibration should infer roost time from one data point. For the 2026-11-22 observation use `roosting_seen_by=2026-11-22T16:18:00-08:00` and `firstRoostAt=null`.

## Shade estimator
Log 7–14+ repeated evenings. For days with clear timed `firstRoostAt`, compute `lead_minutes = sunset - firstRoostAt`. For `roosting_seen_by`, record a **lower bound** on advance minutes, not an exact lead. Segment by cloud, season, orientation, and sensor confidence; do not fit until sufficient confirmed events exist. Report median/spread/sample count with a low-confidence badge. A lux drop is an observation cue; cloud changes must not alone cause door movement.

## Scheduling state machine
`draft → enabled → due → evaluated → requested → acknowledged → physically_confirmed` or `blocked|expired|failed|unknown`. Explicitly record source and reason. Scheduled reminder completion is independent from hardware confirmation. A command with no ack is `sent_unconfirmed`, never success.

## Idempotency
Single canonical event key `scheduleId + eventUtcMinute + deviceId + ruleRevision` (or use existing shared `commandId` until migration); hub and cloud use same deterministic key. Claims must fail closed on datastore failures rather than **firing locally anyway** for dangerous commands. Retain TTL and no stale replay; include reboots, clock drift, duplicate tick cases. Test `cron` edge cases, and reconcile hub/cloud five-minute vs 30-second windows.

## Local first / disconnected
Reminders can be queued locally but flagged as not synced. Hardware safety remains on device/hub, not cloud; control must default to safe disabled for missing sensors, unknown flock count, stale data, E-STOP and obstruction. Cloud must not infer physical state. Distinguish advisory vs real action explicitly. On reconnect no burst catch-up of expired door/feeder/mower commands.

## Important known mismatch audit
1. `water` in hub/cloud maps to `light {on}`, but UI displays `Amount (ml)`; contract mismatch. Add relay on/off separately, calibrated water-volume command only if real meter and max-duration hardware interlock exist.
2. `feed` UI input max 5000g while hub/cloud clamp to 1000g; derive range from per-device capability, show validated maximum and explicit human-confirmed calibration.
3. UI `Door Open` menu and creation save payload do not show close-state choice despite schedule interface having `state`; add choice + tests.
4. Hub schedule runner catches queue claim error and logs `firing locally anyway`; treat as a potential duplication/safety issue and fix with test-driven fail-closed strategy.
5. Hub runner disabled without Firebase Admin; retain public demo simulation but do not advertise localStorage scheduled actions as live automation.

## Testing invariants
All transition paths prove time zone, source freshness, device existence/ownership, device capability, E-STOP, request/ack/physical feedback, notification and retry behavior; backwards compatibility for existing cron and relay-only student kits; never show confidence when only a speculative field exists.
