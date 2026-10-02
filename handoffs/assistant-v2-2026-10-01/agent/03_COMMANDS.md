# Commands

## Express API / MCP

```bash
cd applications/tendercells_ui/test_output/express-api
npm ci
npm test
npm run build
npm run mcp:demo
```

For local/manual MCP:
```bash
npm run mcp
npm run mcp:http
npm run mcp:demo
```

## Builder

```bash
cd applications/tendercells_ui/test_output/tendercells-ui
npm ci
npx vitest run src/__tests__/builder
npm run build
```

Optional Builder visual generation:
```bash
npm run builder:draw
npm run builder:shots
```

## Hosted connector bundle

From repo root/function workflow as already used by the project:
```bash
node functions/scripts/build-connector.mjs
```

Do not modify deployment commands until local build/tests pass.
