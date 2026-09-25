# New-user responsive and action audit

Status: queued for local worker verification

## Scope

Audit the first-use paths that can make a new TenderCells user leave:

- `/account`: email login, registration, Google login error states, and visible recovery guidance
- `/dashboard`, `/products`, `/birds`, and `/settings`: primary buttons, empty states, and save feedback
- hardware quick actions: door, feed, cleaning, water, and E-STOP controls
- desktop and mobile viewport sizing, horizontal overflow, clipped labels, and dialogs wider than the viewport
- local service-offline behavior when the UI cannot reach the API or MQTT bridge

## Required evidence

Run the existing build and unit tests, then run the Playwright UI checks at at least:

- 1440x900 desktop
- 390x844 mobile

For every failure, record the route, control text, viewport, exact console/network error,
and the smallest affected file. Do not count a route as fixed because it renders; click
the primary action and verify the resulting state or error is visible.

## Acceptance

- no horizontal document overflow at either viewport
- every primary action is visible, enabled when inputs are valid, and gives success or actionable failure feedback
- save actions survive a reload in the configured backend or clearly identify demo/local-only persistence
- offline API/MQTT state is explicit and does not look like a successful save
- fixes are kept only when the relevant test and the full gate pass

## Current evidence

- `npm test -- --run`: 22/22 passing
- local platform smoke passes when Vite is running; the previous `8089/health` assertion was stale and now accepts the configured `4000/4100` service path
- QuickActions and Settings threshold controls were adjusted to stack on narrow viewports
