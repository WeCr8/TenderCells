# File Patch Map

## B01 — create

### Express API
`applications/tendercells_ui/test_output/express-api/backend/src/mcp/v2/registerV2.ts`
- one entry point that registers v2 read tools.

`.../v2/customerTools.ts`
- `get_farm_home`
- `list_devices`
- compose existing `farmOverview`; no new farm datastore.

`.../v2/builderTools.ts`
- Builder/Mission read tools.
- accepts generated content as dependency.

`.../v2/builderContent.ts`
- lookup helpers only.

`.../v2/generatedBuilderContent.ts`
- generated file; do not hand-maintain content.

`applications/tendercells_ui/test_output/express-api/tools/generate-builder-mcp.mts`
- reads existing Builder mission/project JSON.
- writes `generatedBuilderContent.ts`.

`.../backend/src/mcp/v2/v2.test.ts`
- v2 tool contract tests.

## B01 — modify

`applications/tendercells_ui/test_output/express-api/backend/src/mcp/server.ts`
- import/register v2 reads.
- do not move existing action code.

`applications/tendercells_ui/test_output/express-api/package.json`
- add `mcp:builder-gen`.
- use `prebuild` and `pretest` so generated content is current.

`applications/tendercells_ui/test_output/express-api/backend/src/mcp/mcp.test.ts`
- update exact tool-list assertion to account for additive reads.
- retain all existing safety assertions.

## B02 — likely modify/create

`applications/tendercells_ui/test_output/express-api/mcp-view/`
- keep current farm card.
- add mission/builder/device cards only after B01.

`applications/tendercells_ui/test_output/express-api/backend/src/mcp/farmCard.ts`
- do not overload it into a general UI router; create v2 resource builder files instead.

`functions/scripts/build-connector.mjs`
- extend only when additional MCP App resources need bundling.

## B03 — create

`plugins/tendercells/skills/builder-guide/SKILL.md`
`plugins/tendercells/skills/mission-guide/SKILL.md`
`plugins/tendercells/skills/device-connect/SKILL.md`

Do not replace `farm-check`.

## B04

Locate and adapt the existing Property Twin services before adding:
- `list_animals`
- `get_animal`
- `list_habitats`
- `get_habitat`
- `get_property_twin`

Do not invent a second twin model inside MCP.

## B05/B06

Create a distinct admin resource/server. Do not register admin tools in the customer connector.
