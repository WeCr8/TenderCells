# Copy/paste prompt for coding agent

Implement **Batch B01 only** from this package against the current `WeCr8/TenderCells` checkout.

Before editing:
- read `agent/00_START_HERE.md`;
- read `agent/01_DECISIONS_LOCKED.md`;
- run and record baseline MCP and Builder tests;
- inspect current main before applying any scaffold.

Goal:
add the v2 customer read facade and Builder/Mission read tools while preserving every existing safety boundary.

Use these exact new tools:
`get_farm_home`, `list_devices`, `list_missions`, `get_mission`,
`list_builder_projects`, `get_builder_project`, `get_builder_step`.

Requirements:
- keep all existing tool names;
- hosted connector remains read-only;
- customer OAuth scope stays `farm:read`;
- local E-STOP/request_action/confirm_action semantics must not change;
- generate assistant Builder content from the existing Builder JSON;
- do not create another Builder database;
- do not add admin or Property Twin tools in this batch;
- add tests before declaring done.

Use `starter-code/` as implementation scaffolding, not authoritative source. Reconcile imports/types with current main.

At completion, return:
1. files changed;
2. exact tests run and results;
3. new tool list;
4. safety invariants verified;
5. any deviations from the package and why;
6. whether B02 is safe to start.
