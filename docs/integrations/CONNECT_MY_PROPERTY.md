# Connect My Property — M1 + M2 + M3 (read-only discovery + import, real HA + MQTT adapters)

Status: **M1 only**, built against the full spec in the implementation package
(`CONNECT_MY_PROPERTY_IMPLEMENTATION_SPEC.md`, not committed to this repo -
kept with the requester). This doc covers what actually shipped here.

## What this is

A gateway-local, owner-scoped discovery/import surface, additive to the
existing device registry (`ownership.ts`) and separate from - not a
replacement for - the existing Home Assistant/MQTT mower integration in
`mower.ts`/`mowerBridge.ts`. Off by default.

## Scope

**Built (M1):**
- `backend/src/integrations/types.ts` - `ExternalIdentity`, `Capability`,
  `IntegrationRecord`, `DiscoveryCandidate`, `DiscoveryJob`.
- `backend/src/integrations/deviceIdentity.ts` - exact-match dedup; ambiguous
  matches are never merged, always staged as a new candidate.
- `backend/src/integrations/discoveryService.ts` - **simulated fixtures
  only**. No mDNS/SSDP/HA/MQTT network I/O happens anywhere in M1 - that's
  deliberate, not a stub to fill in later in this same module. Bounded to 20
  concurrent jobs per owner.
- `backend/src/integrations/registry.ts` - local JSON-file persistence
  (`.tendercells/integrations.json`, gitignored), same pattern as
  `mowerBridge.ts`'s `mower-links.json`. No credentials stored, ever.
- `backend/src/routes/integrations.routes.ts` - `GET /api/integrations`,
  `POST /api/integrations/discover`, `GET /api/integrations/discover/:jobId`,
  `POST /api/integrations/import`, `PATCH /api/integrations/:id` (disable
  only). Gated behind `TC_CONNECT_PROPERTY_ENABLED=1` (404 otherwise), owner
  auth via the existing `requireAuth`/`requirePerson` middleware.

**Built (M2):**
- `backend/src/integrations/homeAssistantAdapter.ts` - a real, read-only HA
  REST client. Reuses the hub-wide `HA_URL`/`HA_TOKEN` env vars
  `mowerBridge.ts` already reads (see "Credentials" below for why there's no
  separate per-connector store). `SAFE_DOMAINS` allowlist (sensor,
  binary_sensor, switch, light, climate, cover, lock) - `lawn_mower` and
  `vacuum` are never staged as candidates, verified by both mocked-fetch unit
  tests and a live end-to-end run against a real local HTTP server standing
  in for Home Assistant (see "Verified this session").
- Basic SSRF guard (`isPrivateHaUrl`) on the configured `HA_URL` - rejects
  non-private/non-local hosts before ever calling them. First pass only, not
  DNS-rebinding-proof; documented as such in the code.
- `POST /api/integrations/test` - connectivity/auth check, stages nothing.
- `discoveryService.ts`'s `home_assistant` branch now calls the real adapter
  when `HA_CONFIGURED`, with a proper `running` -> `complete`/`error` job
  transition (the contract was already there in `DiscoveryJob`, M1 just
  never needed it since fixtures were instant). Falls back to the M1
  simulated fixture when HA isn't configured - the public demo and any
  not-yet-configured gateway still touch zero real devices.

**Built (M3):**
- `backend/src/integrations/mqttImportAdapter.ts` - generic MQTT import, a
  **bounded preview scan** (connect, subscribe read-only to owner-approved
  topic patterns, collect for `SCAN_WINDOW_MS` [2.5s], disconnect) rather than
  a persistent subscription manager. This is a genuinely different broker
  than this hub's own embedded one (`broker.ts`) or its own outbound client
  (`mqtt.controller.ts`'s singleton to `MQTT_BROKER`) - the owner points the
  gateway at a *different* broker they already run.
- Topics under `tc/` (this hub's own device contract,
  `docs/CONNECT_A_DEVICE.md`) are rejected before connecting
  (`validateTopicPatterns`) *and* filtered again inside the message handler
  even if a broader pattern would have matched one - verified live: seeded a
  real local broker with a `tc/ct_001/sensors` message, subscribed with a
  wildcard (`+/#`) that matches it, confirmed it never appears in the result.
- Bare `#` wildcard rejected; topic-pattern count capped
  (`MAX_TOPIC_PATTERNS`); payload size capped (`MAX_PAYLOAD_BYTES`, 16KB);
  JSON payloads parsed, non-JSON kept as text rather than dropped.
- Never publishes anything, anywhere in this file.
- `isPrivateBrokerUrl` - same SSRF-guard shape as `homeAssistantAdapter.ts`'s
  `isPrivateHaUrl`.
- `POST /api/integrations/test` now also accepts `{"adapter":"mqtt",
  "brokerUrl":...}`. Connect options (`brokerUrl`/`username`/`password`) are
  per-request, never persisted - `registry.ts` only ever stores the resulting
  `DiscoveryCandidate` (topic name + value), never the connection details
  that produced it.

**Not built yet (future milestones, each needs its own real-hardware
acceptance pass before shipping):**
- ONVIF/RTSP/camera adapter and media hardening - M4.
- Any capability-policy engine that could ever set `controlEnabled: true` -
  out of scope until a dedicated safety review, same bar as the mower
  interlocks.
- UI (`/app/connect` wizard) - backend-only in this pass.
- `POST /api/integrations` (connector + credential reference),
  `POST /api/integrations/:id/test`, `POST /api/devices/:id/permissions`,
  `POST /api/devices/:id/actions`, `POST /api/cameras/:id/session` - all
  require a real adapter to mean anything; not stubbed here.

## Verified this session

- `npx tsc --noEmit -p .` - clean.
- `npm test` - 93/93 pass (14 new, zero regressions across mower, MCP/OAuth,
  claim, schedules, zones, broker auth suites).
- `npm run smoke` - passes (ran against a live `npm run dev` instance on an
  isolated port; the default port 4000 had two unrelated pre-existing
  processes already bound to it on this machine - not caused by this change,
  worked around by using `PORT=`).
- `npm run describe:xml -- --check` - clean (new routes aren't yet added to
  `describe.ts`; follow-up, not done blind without understanding that
  generator's schema first).
- Live end-to-end against a running server with `TC_CONNECT_PROPERTY_ENABLED=1`:
  discover -> poll -> import -> list -> re-discover -> re-import correctly
  returns `409 ALREADY_IMPORTED` (no duplicate) -> restarted the server ->
  import still listed (file persistence confirmed).
- Flag off (default): every route returns `404 FEATURE_DISABLED`, confirmed
  live.
- Added `.tendercells/` to the root `.gitignore` - this directory
  (`mowerBridge.ts`'s own `mower-links.json` lives there too) was never
  actually gitignored before.
- M2: live-tested the real network path against a local HTTP server
  standing in for Home Assistant (`/api/states`, bearer-token auth) - not
  just mocked-fetch unit tests. Confirmed: `/test` connectivity check works,
  a discovery job starts `running` and transitions to `complete` once the
  real HTTP call resolves, and a `lawn_mower.front` entity the fake server
  returned was correctly excluded from every response. No real Home
  Assistant instance was available to test against - flagging that
  explicitly rather than claiming more than this.
- M3: live-tested against a real local Aedes broker (the same library
  `broker.ts` uses) - `/test` connectivity check, a real async discovery job
  over real MQTT, and a `tc/ct_001/sensors` message published alongside
  legitimate `home/*` topics, subscribed via a wildcard broad enough to
  match it - confirmed excluded from the result. No real external broker
  (an owner's actual Mosquitto/Home-Assistant-MQTT setup) was available to
  test against.

## Why mower integration wasn't touched or reused directly

`mower.ts`/`mowerBridge.ts` already has a real, shipped, animal-safety-
interlocked Home Assistant + MQTT adapter - but scoped specifically to the
`lawn_mower` domain and the mower's own safety rules. M2 resolves this by
domain exclusion, not code reuse: the new adapter reads the exact same
`HA_URL`/`HA_TOKEN` (same hub, same HA instance - there's only one), but its
`SAFE_DOMAINS` allowlist structurally excludes `lawn_mower`/`vacuum`, so the
two adapters can never both think they control the same entity. `mower.ts`
keeps 100% of its own domain and interlocks, untouched.

## Credentials: why there's no per-connector secret store

Every existing vendor adapter in this hub - Husqvarna, GARDENA, Mammotion,
and now Home Assistant - is a single hub-wide env var pair
(`HUSQVARNA_APP_KEY`/`SECRET`, `MAMMOTION_CLIENT_ID`/`SECRET`,
`HA_URL`/`HA_TOKEN`). There is no multi-tenant, per-owner encrypted
credential store anywhere in this codebase, because the deployment model is
one hub per property, not multi-tenant SaaS. Building a new secret store for
this feature would have been a second, parallel credential architecture with
nothing to validate it against. M2 follows the existing convention exactly
instead: one hub, one Home Assistant instance, configured the same way the
operator already configures mower vendor credentials.
