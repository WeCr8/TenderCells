# B02 — MCP App Cards

Depends on B01.

Add compact read-only views for:
- mission;
- Builder project;
- device/attention.

Keep Farm Card intact.

Prefer independent resource builders instead of turning `farmCard.ts` into a monolith.

Update `functions/scripts/build-connector.mjs` only after confirming how each resource is bundled and tested.

Acceptance:
- text/structured output still works without UI support;
- UI makes no hardware call;
- inline card stays shallow;
- Builder full-step experience remains the web Builder until a dedicated fullscreen host path is proven.
