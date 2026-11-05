# Express API package.json patch

Reconcile with current scripts. Suggested additive scripts:

```json
{
  "scripts": {
    "mcp:builder-gen": "tsx tools/generate-builder-mcp.mts",
    "prebuild": "npm run mcp:builder-gen",
    "pretest": "npm run mcp:builder-gen"
  }
}
```

Do not overwrite existing `build` or `test`; npm automatically runs `prebuild` / `pretest`.

If the repo already gains prebuild/pretest on current main, merge commands rather than replacing them.
