<!-- Generated from docs/MACHINE_READABLE_BACKEND.md by website/scripts/sync-docs.mjs - edit the source, then run npm run sync:docs. -->

# Machine-readable backend (XML for LLMs and tools)

An LLM or script can learn the whole Tender Cells backend from XML, without scraping any page.

| URL | What |
|---|---|
| `https://tendercells.com/api/tendercells-backend.xml` | Static description: HTTP endpoints, MQTT topics and payloads, yard events, robots and laser classes, safety rules, client-side analysis |
| `GET /api/describe.xml` on a hub (express-api) | The same description, plus an `<undocumented>` list if the hub has routes the catalog does not cover |
| `GET /api/state.xml` on a hub | Live devices. When auth is on it needs a Firebase ID token and lists only your devices. |

Each endpoint in the description includes:
- its method, path and auth level (`public`, `signed-in` or `device-owner`);
- its request body fields, with type, required flag, min/max and allowed values;
- the MQTT topic, QoS and retain setting it publishes;
- whether it is safety-gated;
- whether it waits for the device ack (200 accepted, 409 refused, 202 no ack yet).

The live state (`/api/state.xml`) lists, per device:
- presence;
- latest telemetry, state and sub-states;
- yard events.

## Where it comes from

- `express-api/backend/src/describe.ts` holds the endpoint and topic catalog and builds the XML.
- Request bodies come from `schemas.ts`, the same schemas the API validates with, so the docs cannot drift from validation.
- `npm run describe:xml` (in express-api) writes the static copy to `website/public/api/`.
- CI runs `npm run describe:xml -- --check` and fails if the committed copy is stale.

The file is linked from `llms.txt` and from the site's `<head>` (`rel="alternate" type="application/xml"`).
