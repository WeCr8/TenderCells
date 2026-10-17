# Live repository review

The repository already contains a real shared Claude + ChatGPT MCP implementation under `applications/tendercells_ui/test_output/express-api/backend/src/mcp/`. Reviewed modules include `server.ts`, `hosted.ts`, `connector.ts`, `firestoreHub.ts`, `hubClient.ts`, `confirm.ts`, `health.ts`, `demoHub.ts`, `farmCard.ts`, transports and tests.

Hosted `/mcp` is OAuth 2.1, per-user and read-only. `/mcp/demo` is simulated. Local MCP retains E-STOP plus optional confirm-twice allow-listed actions. Current reads include `get_farm_overview`, `get_hub_status`, `get_device`, `get_alerts`, `get_yard_events`, `get_farm_snapshot`.

Claude integration already exists under `plugins/tendercells/`, including `.mcp.json`, plugin metadata and `farm-check`.

Builder is also implemented in the shipped app under `src/features/builder/` with the mission ladder `OBSERVE → DECIDE → AUTOMATE → BUILD → CONNECT → INVENT`, schemas, learner depth, demo bindings, safety gates and stable asset IDs.

**Conclusion:** v2 should improve capability organization and add Builder/Property Twin/admin adapters; it should not create another MCP backend or another mission database.
