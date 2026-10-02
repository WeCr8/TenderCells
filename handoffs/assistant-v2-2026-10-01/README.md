# TenderCells AI Assistant Plugin v2 — Agent-Ready Implementation Pack

Repository-reviewed package for upgrading the existing TenderCells Claude + ChatGPT integration **without replacing the current MCP architecture**.

**Live repo reviewed:** `WeCr8/TenderCells` main branch  
**Agent-ready revision:** 2026-10-01

## Use this package differently from the earlier v2

The earlier v2 explains *what to build*.  
This revision tells an implementation agent *where to edit, in what order, what not to touch, and exactly how to prove each batch is done*.

Start here:

1. `agent/00_START_HERE.md`
2. `agent/01_DECISIONS_LOCKED.md`
3. `agent/02_FILE_PATCH_MAP.md`
4. `agent/machine/task_graph.json`
5. `agent/batches/B01_CUSTOMER_FACADE_BUILDER_READS.md`

Then implement **one batch at a time**.

## Fastest safe first release

Batch 01 deliberately avoids risky refactors.

It adds:
- `get_farm_home`
- `list_devices`
- `list_missions`
- `get_mission`
- `list_builder_projects`
- `get_builder_project`
- `get_builder_step`

while preserving:
- hosted connector read-only behavior;
- OAuth `farm:read`;
- local E-STOP;
- request → explicit human yes → confirm action;
- existing tool names;
- existing MQTT/device safety;
- existing Builder source of truth.

The starter-code folder contains **scaffolds, not blind patches**. The agent should reconcile them against current main before applying.

## Current repo facts used by this pack

- MCP source: `applications/tendercells_ui/test_output/express-api/backend/src/mcp/`
- MCP tests: `.../backend/src/mcp/mcp.test.ts`, `hosted.test.ts`
- MCP UI: `applications/tendercells_ui/test_output/express-api/mcp-view/`
- Builder source: `applications/tendercells_ui/test_output/tendercells-ui/src/features/builder/`
- Builder missions: six JSON missions + manifest
- Builder projects: Chicken Tender Door concept book, XIAO Blink, Starter Node
- Claude plugin: `plugins/tendercells/`
- Hosted connector bundler: `functions/scripts/build-connector.mjs`

## Non-negotiable rule

**Do not create a second Builder/Mission database for the assistant.**  
Generate or adapt assistant-readable content from the existing Builder JSON.


## Store / directory release material added in v2.2

This revision adds a complete distribution path for:

- **OpenAI universal plugin directory** — ChatGPT + Codex
- **Claude directory** — remote MCP connector or GitHub-hosted plugin bundle
- **Claude Code plugin marketplace** — secondary developer-facing distribution target

Start store work only after `B01` passes.

Read:
1. `distribution/00_RELEASE_OVERVIEW.md`
2. `distribution/shared/STORE_RELEASE_GATE.md`
3. `distribution/openai/CHATGPT_CODEX_DIRECTORY.md`
4. `distribution/claude/CLAUDE_DIRECTORY.md`

The package also includes TenderCells-specific review cases, listing copy, reviewer scripts, demo-video shot lists, and a store preflight script.


## v2.3 additions — official brand + completion roadmap

This revision adds:

- exact TenderCells SVG logo source from the live repository;
- derived PNG store/icon sizes;
- store-ready logo copies;
- feature-completion status matrix;
- release critical path;
- staged 2026–2027 roadmap;
- master completion checklist;
- machine-readable roadmap/checklist;
- B08 hardening coordination batch;
- a `NEXT_FEATURE` agent prompt.

For the fastest continuation, open `ROADMAP_AND_CHECKLIST.md`.

## v2.4 additions — hardware engineering sources

This revision embeds and expands both uploaded engineering packages:

- `TenderCells_Feeder_MASTER_v9_ENGINEERING_RECONCILED.zip` — 290 expanded files
- `TenderCells_DoorCell_V1_4_Solar_Ready_Assembly.zip` — 65 expanded files

See `hardware/README.md` and B09 before integrating them into the main repository.
