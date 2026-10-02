# Agent Start Here

You are modifying the existing `WeCr8/TenderCells` repository.

## Goal

Ship v2 incrementally while keeping the existing MCP safety guarantees intact.

## Before editing

1. Confirm you are on the intended branch and working tree is understood:
   ```bash
   git status --short
   git rev-parse --abbrev-ref HEAD
   git log -1 --oneline
   ```
2. Read:
   - `docs/AI_ASSISTANT_PLUGIN.md`
   - `docs/CONNECTOR_LISTING.md`
   - `docs/builder/README.md`
   - `applications/tendercells_ui/test_output/express-api/backend/src/mcp/server.ts`
   - `applications/tendercells_ui/test_output/express-api/backend/src/mcp/mcp.test.ts`
3. Run baseline:
   ```bash
   cd applications/tendercells_ui/test_output/express-api
   npm test
   npm run build
   ```
4. Run Builder baseline:
   ```bash
   cd ../tendercells-ui
   npx vitest run src/__tests__/builder
   npm run build
   ```

If baseline is already red, document the pre-existing failure before changing code.

## Implementation order

Do not jump ahead.

- **B01** Customer facade + Builder/Mission read tools
- **B02** Assistant cards/resources
- **B03** Claude skills
- **B04** Property Twin / animals / habitats adapters
- **B05** Admin read-only surface
- **B06** Admin controlled writes

## B01 completion gate

Do not start B02 until all are true:
- existing MCP tests pass;
- new v2 tool tests pass;
- hosted connector still registers no hardware actions;
- existing tool names still work;
- Builder content is generated from the existing Builder JSON;
- no hardcoded duplicate mission definitions;
- `npm run build` passes;
- Builder tests remain green.

## Work style

- Prefer additive files under `backend/src/mcp/v2/`.
- Keep `server.ts` as the compatibility root and register v2 from it.
- Small commits per batch.
- No unrelated cleanup.
- If a decision conflicts with `01_DECISIONS_LOCKED.md`, stop and report the conflict instead of improvising.
