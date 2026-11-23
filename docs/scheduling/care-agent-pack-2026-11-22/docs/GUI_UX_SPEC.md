# GUI / interaction design specification

## Navigation
`Property → Care Calendar` (new), existing `Schedules` remains with a seamless link. Mobile: `Calendar` tab in property overflow. Existing Schedules CRUD must stay functional for prior users; do not silently migrate or delete.

## Page A: Care Calendar / Today
Top: property picker, `America/Los_Angeles`, `LIVE/DEMO` context badge, weather source & age, `solar calculated` label. Hero: sunrise / sunset / civil dusk, `next human review`, first-roost observed-by, local shade confidence, physical door state. Day timeline cards: time, action, due state, target, evidence/provenance, risk, `why`, assigned owner. Show continuous fresh-water/feed availability reminder independent of any timed dispenser.

## Page B: Week + Month
Week: 7 columns for scheduled checks, not an auto-execution guarantee. Month: days with review/alert counts, tooltip events. Preview cannot show a moving robot as if physically active. Adjustable timezone (property default), seasonal solar changes, DST treatment. Differentiate planned schedules from executed events.

## Page C: Schedule wizard
Step 1: choose **human reminder** or **physical device action** (latter gated). Step 2: select trigger `Fixed`, `Solar`, `Site-shade monitoring cue`, `Sensor threshold`, `Combined guarded`. Step 3: select action/capability from actual device registry. Step 4: review conditions (occupancy, light freshness, door limit switch, obstruction, E-STOP, max runtime). Step 5: Preview next seven days, timeline, offline behavior, user approval. Save disabled for unverified actuator. For `door`, explicit Open/Close control; for waterer, distinguish `relay on/off` and calibrated volume, never present a ml number for generic relay.

## Page D: Observation drawer
Timestamp default current property-local; input: `Roosting already observed by` (default approximation, optional), `Confirmed first roost` (separate), `Last bird inside`, `Shade started`, `Birds confirmed/total`, `Lux`, `Coop temperature`, `Sky`, evidence source `human/camera/sensor`, confidence `low/medium/high`, notes. Show consent and privacy context for camera captures. Observations must not silently convert to commands.

## Page E: Conditions / Weather
Provider, geofence/coordinates handling, last updated/valid-until, stale state, NWS alert banner, temperature (outside vs coop), sun, shade, smoke if integrated. `Forecast is advisory; sensor and bird observations matter more` banner. Provider failure UI: stale/unknown with manual fallback rather than zeroes. Manual refresh rate-limited.

## Page F: Feed + water
Flock count and life stage, example feed consumption only with explicit units, actual hopper/weight evidence. Daily feed available, dispensed, residual, calculated intake (not assume dispensed=consumed). Water available continuously, level/flow/temperature as installed; alert when not reporting. A calibration card showing verified dispenser conversion and safeguards, not default 100g or 20sec on uncalibrated hardware.

## Page G: Import / export
Sources: `.xlsx` reporting (human), `.csv` per table, `.xml` versioned interchange (strict XSD). Input preview: file name/hash, schema version, rows, failures, diff by stable ID, `Import as draft` only. No secret fields, no execution flags, owner approval per actuation. Export: date scope, selected property, masked device IDs, timezone/UTC, provenance and units; user downloads data, not keys.

## Empty and safety states
- No property coords: prompt to choose approximate location; avoid forced exact street coordinates.
- No flock count: state `Unknown headcount`; disable auto-close.
- Door offline: last confirmed position with stale timestamp, not a green status.
- Weather unavailable: `Forecast unavailable`, reminders continue with local sensors.
- User in demo: `SIMULATED — Nothing controls hardware`, zero external calls.
- No real device: CTA `Connect a device` links existing onboarding; no phantom sensor values.

## Accessibility & styling
Use existing TenderCells design tokens/components; MUI already used in scheduler. Touch targets >=44px; clear focus states, keyboard/voiceover labels, plain text for color-coded status, predictable tab order, reduced-motion preference; display units as F/C (setting) without changing stored SI; date-time localized; avoid complex controls for classrooms (advanced mode optional).

## UI prototype
Open `../gui/care-calendar-prototype.html` locally for behavior demonstration. It is a static mock not connected to accounts, MQTT, hardware, or cloud. Do not commit it as a live product page.
