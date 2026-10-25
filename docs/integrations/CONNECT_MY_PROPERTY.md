# Connect My Property — M1 (read-only discovery + import)

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

**Not built yet (future milestones, each needs its own real-hardware
acceptance pass before shipping):**
- Real Home Assistant adapter (REST/WS client, entity mapping, service
  allowlist) - M2.
- Real MQTT generic import (beyond the mower's `tc/{id}/cmd/mower` topic) -
  M3.
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

## Why mower integration wasn't touched or reused directly

`mower.ts`/`mowerBridge.ts` already has a real, shipped, animal-safety-
interlocked Home Assistant + MQTT adapter - but scoped specifically to the
`lawn_mower` domain and the mower's own safety rules. Generalizing it to
other domains/device types is a real design decision (reuse its `ha()`
client and interlock pattern vs. a parallel adapter), not something to guess
at silently. Left as an explicit open question for the next milestone rather
than either duplicating control paths into the same hardware or hollowing
out a working, tested safety system to force a premature generalization.
