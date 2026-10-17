# Suggested repo placement

```text
express-api/backend/src/mcp/
  server.ts                 # existing compatibility
  v2/
    customerTools.ts
    builderTools.ts
    twinTools.ts
    adapters/
  admin/                    # separate auth boundary
    server.ts
    tools/
plugins/tendercells/skills/
  farm-check/               # existing
  builder-guide/
  mission-guide/
  device-connect/
```

Do not move Builder content for MCP. Read it through adapters.
