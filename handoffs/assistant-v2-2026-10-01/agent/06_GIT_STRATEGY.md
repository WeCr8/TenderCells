# Suggested Git Strategy

Recommended branch:
`feat/assistant-v2-b01`

Suggested commits:

1. `test(mcp): lock v2 compatibility and hosted safety`
2. `build(mcp): generate builder content for assistant tools`
3. `feat(mcp): add farm home and device facade reads`
4. `feat(mcp): expose builder and mission read tools`
5. `docs(mcp): document v2 customer read surface`

Do not combine B01 with MCP App redesign or admin work.

PR description should include:
- changed tools;
- unchanged safety guarantees;
- test commands/results;
- known deferred items;
- screenshots only if B02 UI is included.
