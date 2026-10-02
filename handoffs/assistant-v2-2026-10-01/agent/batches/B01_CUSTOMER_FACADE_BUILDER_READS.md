# B01 — Customer Facade + Builder/Mission Reads

**Priority:** first  
**Risk:** low-to-medium  
**Goal:** make the current connector feel like TenderCells v2 without changing hardware safety or OAuth.

## Tasks

### T01 Baseline tests
Run and record current MCP + Builder results.

### T02 Generate Builder MCP content
Create `tools/generate-builder-mcp.mts`.

Read:
`../tendercells-ui/src/features/builder/data/missions/*.mission.json`
and
`../tendercells-ui/src/features/builder/data/projects/*.project.json`.

Generate:
`backend/src/mcp/v2/generatedBuilderContent.ts`.

Generated objects must include `sourceFile`.

### T03 Register v2 customer reads
Create `v2/registerV2.ts`, `customerTools.ts`, `builderTools.ts`, `builderContent.ts`.

### T04 Integrate
Call `registerV2ReadTools(server, { hub })` from existing `createTenderCellsMcp`.

Do this before the `if (!allowActions) return server;` boundary, because v2 reads apply to hosted/local modes.

### T05 Test
Add v2 test coverage and update exact tool-name assertions.

## Do not do in this batch

- no admin;
- no OAuth scope changes;
- no new Firebase writes;
- no fullscreen UI;
- no hardware actions;
- no Property Twin invention;
- no migration of Builder files.
