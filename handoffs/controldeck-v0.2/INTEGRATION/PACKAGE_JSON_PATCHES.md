# Package Manifest Changes

## express-api

Add production dependency:

```json
"ws": "^8.18.0"
```

Add development dependency:

```json
"@types/ws": "^8.5.13"
```

No new UI dependency is required for the V0.2 control layer: it uses React already
present in TenderCells.

## Optional scripts

UI:

```json
"test:control": "vitest run src/__tests__/control"
```

API: current `npm test` glob only includes `backend/src/*.test.ts` and
`backend/src/mcp/*.test.ts`.

Either expand it:

```json
"test": "tsx --test backend/src/*.test.ts backend/src/mcp/*.test.ts backend/src/control/*.test.ts"
```

or add:

```json
"test:control": "tsx --test backend/src/control/*.test.ts"
```
